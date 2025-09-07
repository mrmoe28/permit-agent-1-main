# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PermitAgent is a comprehensive web application that helps project managers and contractors efficiently find and gather permit information from local planning and building departments. The app automatically locates, scrapes, and organizes relevant permit data by taking an address as input.

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing (when implemented)
npm test            # Run test suite
npm run test:watch  # Run tests in watch mode
```

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives + custom components
- **Forms**: React Hook Form with Zod validation
- **State Management**: Zustand
- **Web Scraping**: Cheerio for static content parsing
- **AI Integration**: OpenAI GPT-4 for data extraction
- **Database**: PostgreSQL (via Vercel Postgres)
- **Deployment**: Vercel with edge functions

### Core Features

1. **Address Input & Jurisdiction Discovery**: Automatically determine correct jurisdiction from address
2. **Web Scraping & Data Extraction**: Extract permit fees, requirements, and contact info
3. **AI-Powered Processing**: Use LLM to parse unstructured government data
4. **Results Dashboard**: Organized display of permit information
5. **Export Functionality**: Download permit packets and reports

### Directory Structure

```text
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/
│   │   └── search/         # Main search API endpoint
│   └── page.tsx            # Home page with search interface
├── components/
│   ├── ui/                 # Reusable UI components (Button, Input, etc.)
│   ├── forms/              # Form components (AddressSearch)
│   └── dashboard/          # Results display components
├── lib/
│   ├── scraping/           # Web scraping engine and jurisdiction discovery
│   ├── ai/                 # AI processing for permit data extraction
│   ├── database/           # Database schemas and utilities
│   └── utils/              # Shared utility functions
└── types/                  # TypeScript type definitions
```

## Key Components

### Web Scraping Engine (`/lib/scraping/`)

- **scraper.ts**: Core web scraping functionality with anti-detection measures
- **discovery.ts**: Jurisdiction discovery from addresses using government website patterns

### AI Processing (`/lib/ai/`)

- **processor.ts**: OpenAI integration for extracting structured permit data from scraped content

### API Endpoints (`/app/api/`)

- **search/route.ts**: Main endpoint that orchestrates jurisdiction discovery, scraping, and AI processing

### UI Components (`/components/`)

- **AddressSearch**: Form for inputting addresses with validation
- **SearchResults**: Dashboard displaying organized permit information

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Core APIs
OPENAI_API_KEY=           # OpenAI API for data processing
GOOGLE_MAPS_API_KEY=      # For address geocoding (future)
SERPAPI_KEY=              # For search engine integration (future)
DATABASE_URL=             # Postgres connection string

# Application settings
NEXT_PUBLIC_APP_URL=      # Application base URL
MAX_REQUESTS_PER_MINUTE=  # Rate limiting
SCRAPING_DELAY_MS=        # Delay between requests
```

## Data Models

### Core Types (`/types/index.ts`)

- **Address**: Street, city, state, ZIP with optional coordinates
- **Jurisdiction**: Government entity with contact info and website
- **PermitType**: Permit categories with fees, requirements, and forms
- **SearchRequest/Response**: API contract for search functionality

### Database Schema (`/lib/database/schema.sql`)

- **jurisdictions**: Government entities and contact information
- **permit_types**: Available permits with categories and requirements
- **permit_fees**: Fee structures and amounts
- **user_projects**: Saved user projects and permit applications

## Development Workflow

### Adding New Features

1. Define types in `/types/index.ts`
2. Implement business logic in `/lib/`
3. Create API endpoints in `/app/api/`
4. Build UI components in `/components/`
5. Update database schema if needed

### Web Scraping Guidelines

- Respect robots.txt and implement delays between requests
- Use user-agent identification: "PermitAgent/1.0"
- Implement retry mechanisms with exponential backoff
- Cache results to minimize repeated requests

### AI Processing Best Practices

- Use structured prompts with clear output format requirements
- Implement fallback handling for AI API failures
- Validate extracted data before storing
- Keep token usage optimized with content limits

## Common Patterns

### Error Handling

```typescript
// API responses use consistent format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
```

### Form Validation

```typescript
// Use Zod schemas for consistent validation
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().min(5)
});
```

### Component Props

```typescript
// Consistent prop interfaces
interface ComponentProps {
  onSuccess: (data: T) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}
```

## Performance Considerations

- API routes use Vercel Edge Runtime for global performance
- Implement caching for frequently accessed jurisdictions
- Use progressive loading for better user experience
- Optimize AI token usage with content limits

## Security & Compliance

- Never store API keys in client-side code
- Implement rate limiting for scraping activities
- Respect website terms of service and robots.txt
- Validate all user inputs with Zod schemas
- Use HTTPS for all external requests

## Deployment

The app is configured for Vercel deployment with:

- Automatic builds on git push
- Environment variable management
- Edge function support for API routes
- Static asset optimization

## Future Enhancements

- Database integration for caching scraped data
- User authentication and project management
- PDF form parsing and pre-population
- Mobile app development
- Integration with permitting software APIs
