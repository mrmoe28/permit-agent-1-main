# Known Issues and Solutions

This document contains a comprehensive list of known issues encountered during development and their solutions, based on real-world project experiences.

## Table of Contents
- [NextAuth.js Issues](#nextauthjs-issues)
- [Database Configuration](#database-configuration)
- [Routing Conflicts](#routing-conflicts)
- [OAuth Integration](#oauth-integration)
- [Environment Setup](#environment-setup)
- [Common Development Errors](#common-development-errors)

---

## NextAuth.js Issues

### 1. Version Compatibility
**Issue:** NextAuth v5 beta causes compatibility issues with Next.js 14+
```
Error: Failed to read source code from /node_modules/next-auth/react.js
```

**Solution:**
- Use stable NextAuth v4.24.5
- Update package.json:
```json
{
  "dependencies": {
    "next-auth": "4.24.5",
    "@next-auth/prisma-adapter": "^1.0.7"
  }
}
```

### 2. Route Export Errors
**Issue:** Next.js 14 App Router requires named exports
```
Error: Detected default export in route.ts
```

**Solution:**
Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 3. JWT Session Errors
**Issue:** Session decryption failures
```
[next-auth][error][JWT_SESSION_ERROR] decryption operation failed
```

**Solution:**
Configure proper callbacks in auth options:
```typescript
{
  session: {
    strategy: 'jwt',
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
  }
}
```

---

## Database Configuration

### 1. Provider Mismatch
**Issue:** Prisma schema provider doesn't match DATABASE_URL
```
Error: the URL must start with the protocol postgresql:// or postgres://
```

**Solution:**
- For SQLite: `provider = "sqlite"` and `DATABASE_URL="file:./dev.db"`
- For PostgreSQL: `provider = "postgresql"` and `DATABASE_URL="postgresql://..."`

### 2. Empty Database File
**Issue:** SQLite database file exists but is empty

**Solution:**
```bash
rm dev.db
touch dev.db
export DATABASE_URL="file:./dev.db"
sqlite3 dev.db < prisma/migrations/*/migration.sql
```

### 3. User Record Not Found
**Issue:** OAuth users not created in database
```
PrismaClientKnownRequestError: Record to update not found
```

**Solution:**
Check and create users in API routes:
```typescript
let user = await prisma.user.findUnique({
  where: { email: session.user.email },
});

if (!user) {
  user = await prisma.user.create({
    data: {
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
  });
}
```

---

## Routing Conflicts

### 1. Duplicate Routes
**Issue:** Multiple pages resolve to the same path
```
You cannot have two parallel pages that resolve to the same path
```

**Solution:**
- Keep protected routes in `app/(protected)/` folder
- Delete duplicate unprotected routes
- Use route groups for organization

### 2. Middleware Conflicts
**Issue:** Generic middleware causes NextAuth errors

**Solution:**
- Remove problematic middleware.ts
- Use NextAuth callbacks instead
- Or properly configure NextAuth middleware

---

## OAuth Integration

### 1. OAuth Timeouts
**Issue:** Sign-in requests timeout
```
[next-auth][error][SIGNIN_OAUTH_ERROR] outgoing request timed out after 3500ms
```

**Solution:**
Enhanced Google provider configuration:
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
})
```

### 2. Manual Redirect Handling
**Issue:** Automatic redirects fail silently

**Solution:**
Use manual redirects in sign-in:
```typescript
const result = await signIn('google', {
  redirect: false,
  callbackUrl: '/dashboard'
});

if (result?.error) {
  // Handle error
} else if (result?.url) {
  router.push(result.url);
}
```

---

## Environment Setup

### 1. Missing Environment Variables
**Issue:** Required variables not configured

**Solution:**
Create `.env.local`:
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=# Generate with: openssl rand -base64 32

# OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Database
DATABASE_URL="file:./dev.db"
```

### 2. Secret Generation
**Issue:** NEXTAUTH_SECRET not properly generated

**Solution:**
```bash
openssl rand -base64 32
```

---

## Common Development Errors

### 1. Dependencies Not Installed
**Issue:** Module not found errors

**Solution:**
Always run `npm install` first:
```bash
npm install
npx prisma generate
npx prisma db push
```

### 2. Prisma Client Not Generated
**Issue:** Cannot find module '.prisma/client'

**Solution:**
```bash
npx prisma generate
```

### 3. TypeScript Errors
**Issue:** Type mismatches in auth configuration

**Solution:**
- Ensure proper type imports
- Use NextAuthOptions type
- Handle nullable user properties

---

## Prevention Checklist

Before running your application:
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database file exists and is populated
- [ ] Prisma client generated
- [ ] No duplicate routes
- [ ] OAuth credentials configured
- [ ] Session strategy set to JWT for OAuth

## Debugging Tips

1. **Enable Debug Mode:**
```typescript
debug: process.env.NODE_ENV === 'development'
```

2. **Check Logs:**
- Browser console for client errors
- Terminal for server errors
- Network tab for API failures

3. **Verify Database:**
```bash
sqlite3 dev.db ".tables"
sqlite3 dev.db "SELECT * FROM User;"
```

4. **Test OAuth Flow:**
- Clear cookies/session
- Try incognito mode
- Check OAuth provider console

---

## Contributing

If you encounter new issues, please add them to this document with:
1. Clear error description
2. Root cause analysis
3. Step-by-step solution
4. Prevention tips