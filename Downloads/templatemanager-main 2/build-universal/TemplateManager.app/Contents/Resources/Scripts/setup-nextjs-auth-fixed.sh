#!/bin/bash

echo "🚀 Next.js with Google OAuth Setup (Fixed Version)"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Create package.json with CORRECT dependencies (NextAuth v4)
echo -e "${BLUE}Creating package.json with NextAuth v4 dependencies...${NC}"
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
    "typecheck": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "next-auth": "4.24.5",
    "@next-auth/prisma-adapter": "^1.0.7",
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

# Create .env.local with SQLite for development
echo -e "${BLUE}Creating environment variables template...${NC}"
cat > .env.local << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (SQLite for development)
DATABASE_URL="file:./dev.db"
EOF

# Create Prisma schema with SQLite
echo -e "${BLUE}Creating Prisma schema with SQLite...${NC}"
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
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

# Create auth-options.ts for NextAuth v4
echo -e "${BLUE}Creating NextAuth v4 configuration...${NC}"
cat > lib/auth/auth-options.ts << 'EOF'
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
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

# Create NextAuth route with NAMED EXPORTS
echo -e "${BLUE}Creating NextAuth route with named exports...${NC}"
cat > app/api/auth/[...nextauth]/route.ts << 'EOF'
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
EOF

# Create Prisma client instance
echo -e "${BLUE}Creating Prisma client instance...${NC}"
cat > lib/db/prisma.ts << 'EOF'
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
EOF

# Create login page
echo -e "${BLUE}Creating login page...${NC}"
cat > app/\(auth\)/login/page.tsx << 'EOF'
"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    </div>
  )
}
EOF

# Create SessionProvider wrapper
echo -e "${BLUE}Creating SessionProvider wrapper...${NC}"
cat > app/providers.tsx << 'EOF'
"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
EOF

# Update layout.tsx to include providers
echo -e "${BLUE}Updating layout.tsx...${NC}"
cat > app/layout.tsx << 'EOF'
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NextAuth Google OAuth App",
  description: "Authentication with Google OAuth",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
EOF

# Create middleware.ts
echo -e "${BLUE}Creating middleware...${NC}"
cat > middleware.ts << 'EOF'
export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/(protected)/:path*"]
}
EOF

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Generate NextAuth secret
echo -e "${BLUE}Generating NextAuth secret...${NC}"
SECRET=$(openssl rand -base64 32)
sed -i.bak "s/your-secret-here-generate-with-openssl/$SECRET/" .env.local
rm .env.local.bak

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client...${NC}"
npx prisma generate

# Push database schema
echo -e "${BLUE}Creating database...${NC}"
npx prisma db push

# Print setup completion
echo -e "${GREEN}✅ Next.js with Google OAuth project setup completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Set up Google OAuth:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create a new project or select existing"
echo "   - Enable Google+ API"
echo "   - Create OAuth 2.0 credentials"
echo "   - Add authorized redirect URI: http://localhost:3000/api/auth/callback/google"
echo ""
echo "2. Add your Google OAuth credentials to .env.local:"
echo "   - Replace 'your-google-client-id' with your actual client ID"
echo "   - Replace 'your-google-client-secret' with your actual client secret"
echo ""
echo "3. Run the development server:"
echo "   npm run dev"
echo ""
echo -e "${GREEN}✅ All common issues have been preemptively fixed:${NC}"
echo "   - Using NextAuth v4 (stable) instead of v5 beta"
echo "   - Named exports for API routes"
echo "   - SQLite database for easy development"
echo "   - Prisma client pre-generated"
echo "   - NextAuth secret auto-generated"
echo ""
echo -e "${BLUE}Visit http://localhost:3000 to see your app!${NC}"