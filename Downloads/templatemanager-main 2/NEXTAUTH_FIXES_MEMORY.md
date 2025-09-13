# NextAuth Google OAuth Fixes - Memory Document

## Overview
This document contains critical fixes and best practices for NextAuth Google OAuth implementation that should be applied to all future projects using the Template Manager.

## Key Fixes to Remember

### 1. Always Use NextAuth v4 (Stable)
- **NEVER** use `next-auth@beta` or v5 beta versions
- **ALWAYS** use `next-auth@4.24.5` and `@next-auth/prisma-adapter`
- Remove any beta dependencies if found

### 2. Next.js 14 API Route Requirements
- **MUST** use named exports: `export { handler as GET, handler as POST }`
- **NEVER** use default export: `export default NextAuth(...)`
- File location: `app/api/auth/[...nextauth]/route.ts`

### 3. Environment Variable Setup
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[generated-with-openssl]
GOOGLE_CLIENT_ID=[actual-client-id]
GOOGLE_CLIENT_SECRET=[actual-client-secret]
DATABASE_URL="file:./dev.db"  # SQLite for development
```

### 4. Database Configuration
- Use SQLite for development (`provider = "sqlite"`)
- PostgreSQL for production
- Always run: `npx prisma generate` then `npx prisma db push`

### 5. Installation Sequence
1. `npm install` - MUST be first
2. Generate secret: `openssl rand -base64 32`
3. `npx prisma generate`
4. `npx prisma db push`
5. `npm run dev`

## Common Errors and Solutions

| Error | Solution |
|-------|----------|
| `Cannot find module '.prisma/client/default'` | Run `npx prisma generate` |
| `TypeError: r is not a function` | Downgrade from NextAuth v5 to v4 |
| `Detected default export in route.ts` | Use named exports |
| `Environment variable not found: DATABASE_URL` | Check .env.local formatting |
| `sh: next: command not found` | Run `npm install` first |

## File Locations in Template Manager

- Knowledge base: `/TemplateManager/Resources/Knowledge/nextauth-fixes.json`
- Fixed setup script: `/TemplateManager/Resources/Scripts/setup-nextjs-auth-fixed.sh`
- KnowledgeService: `/TemplateManager/Services/KnowledgeService.swift`

## Integration Points

1. **ProjectCreator.swift**: Now calls `KnowledgeService.shared.applyFixes()`
2. **KnowledgeService**: Automatically applies fixes during project creation
3. **Setup Scripts**: Fixed version uses NextAuth v4 and proper configuration

## Testing Checklist

- [ ] Dependencies install without errors
- [ ] Prisma client generates successfully
- [ ] Database creates without issues
- [ ] NextAuth route uses named exports
- [ ] Google OAuth flow works end-to-end
- [ ] Protected routes function correctly

## Notes for Future Development

- Always check NextAuth version before starting
- Verify API route export format for Next.js compatibility
- Use SQLite for development to avoid database setup issues
- Generate all secrets and keys programmatically
- Apply fixes automatically through KnowledgeService

---
*This memory document should be referenced whenever creating or troubleshooting NextAuth implementations.*