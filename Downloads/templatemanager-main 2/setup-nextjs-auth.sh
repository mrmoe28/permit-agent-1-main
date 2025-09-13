#!/bin/bash

echo "🚀 Next.js with Google OAuth Setup"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Please install jq first."
    exit 1
fi

# Use the existing setup script to create the structure
echo -e "${BLUE}Creating project structure...${NC}"
echo "nextjs-google-auth" | ./setup-from-config.sh

# Check if structure was created successfully
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Failed to create project structure${NC}"
    exit 1
fi

# Create package.json with dependencies
echo -e "${BLUE}Creating package.json with dependencies...${NC}"
cat > package.json << 'EOF'
{
  "name": "nextjs-google-auth",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "next-auth": "^5.0.0-beta.3",
    "@auth/prisma-adapter": "^1.0.12",
    "@prisma/client": "^5.8.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5",
    "prisma": "^5.8.0",
    "eslint": "^8",
    "eslint-config-next": "14.1.0"
  }
}
EOF

# Create .env.local.example
echo -e "${BLUE}Creating environment variables template...${NC}"
cat > .env.local.example << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
EOF

# Create auth-options.ts
echo -e "${BLUE}Creating NextAuth configuration...${NC}"
cat > lib/auth/auth-options.ts << 'EOF'
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
}
EOF

# Create Prisma schema
echo -e "${BLUE}Creating Prisma schema...${NC}"
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
EOF

# Create middleware.ts
echo -e "${BLUE}Creating middleware...${NC}"
cat > middleware.ts << 'EOF'
export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/protected/:path*"]
}
EOF

# Print setup instructions
echo -e "${GREEN}✅ Next.js with Google OAuth project structure created!${NC}"
echo ""
echo -e "${YELLOW}📝 Setup Instructions:${NC}"
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Set up Google OAuth:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create a new project or select existing"
echo "   - Enable Google+ API"
echo "   - Create OAuth 2.0 credentials"
echo "   - Add authorized redirect URI: http://localhost:3000/api/auth/callback/google"
echo ""
echo "3. Configure environment variables:"
echo "   - Copy .env.local.example to .env.local"
echo "   - Add your Google OAuth credentials"
echo "   - Generate NEXTAUTH_SECRET: openssl rand -base64 32"
echo "   - Set up your database URL"
echo ""
echo "4. Initialize database:"
echo "   npx prisma db push"
echo ""
echo "5. Run the development server:"
echo "   npm run dev"
echo ""
echo -e "${BLUE}📁 Project structure:${NC}"
if command -v tree &> /dev/null; then
    tree . -I 'node_modules|.next' -L 3
else
    find . -type d -not -path '*/\.*' -not -path './node_modules*' | head -20 | sort
fi