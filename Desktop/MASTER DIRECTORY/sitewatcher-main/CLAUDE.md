# SiteWatcher - SEO Analysis & Monitoring Platform

## Project Overview

SiteWatcher is a full-stack SEO analysis and monitoring platform that helps users analyze websites, track SEO performance, and get optimization recommendations. Built from the original SiteInsight codebase, this application provides comprehensive website analysis through Google PageSpeed Insights integration and real-time monitoring capabilities.

## Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Radix UI components with Tailwind CSS using shadcn/ui "new-york" theme
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React icon library

### Backend Stack
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **External APIs**: Google PageSpeed Insights API for SEO analysis

### Key Features
- **URL Analysis**: Submit websites for comprehensive SEO analysis
- **Real-time Monitoring**: WebSocket-based progress tracking for analysis runs
- **Dashboard Metrics**: Overview of SEO scores, performance metrics, and site health
- **SEO Recommendations**: Actionable suggestions for website optimization
- **Keyword Tracking**: Monitor keyword rankings and performance over time
- **Multi-site Management**: Track multiple websites from a single dashboard

## Database Schema

### Core Tables
- **users**: User authentication and management
- **sites**: Website URLs and domains for tracking
- **analyses**: SEO analysis runs with scores, status, and progress
- **recommendations**: Actionable SEO improvement suggestions
- **keywords**: Keyword rankings and performance metrics

### Relations
- Sites have many analyses and keywords
- Analyses belong to sites and have many recommendations
- Keywords belong to sites for tracking performance

## Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or Neon)
- Google PageSpeed Insights API key

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sitewatcher"

# Google APIs
GOOGLE_API_KEY="your_google_api_key"

# Session Secret
SESSION_SECRET="your_session_secret"
```

## Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm run start           # Start production server
npm run check           # TypeScript type checking

# Database
npm run db:push         # Apply schema changes to database
npm run db:studio       # Open Drizzle Studio for database management

# Testing
npm run test            # Run test suite
npm run test:watch      # Run tests in watch mode
```

## API Endpoints

### Sites Management
- `GET /api/sites` - List all tracked sites
- `POST /api/sites` - Add new site for tracking
- `DELETE /api/sites/:id` - Remove site from tracking

### SEO Analysis
- `POST /api/analyses` - Start new SEO analysis
- `GET /api/analyses/:id` - Get analysis results
- `GET /api/analyses/recent` - Get recent analyses

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard overview metrics
- `GET /api/recommendations/:analysisId` - Get SEO recommendations

### Keywords
- `GET /api/keywords/:siteId` - Get keyword performance for site
- `POST /api/keywords` - Add keyword for tracking

## Component Structure

```
client/src/
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── url-analysis-form.tsx
│   │   ├── metrics-overview.tsx
│   │   ├── seo-recommendations.tsx
│   │   ├── keyword-performance.tsx
│   │   └── recent-analyses.tsx
│   ├── layout/            # Layout components
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   └── ui/               # Reusable UI components (shadcn/ui)
├── pages/                # Page components
├── hooks/                # Custom React hooks
└── lib/                  # Utilities and configurations
```

## Deployment

### Vercel Deployment
The application is automatically deployed to Vercel on every push to the main branch.

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```bash
docker build -t sitewatcher .
docker run -p 5000:5000 sitewatcher
```

### Environment Setup
- Configure PostgreSQL database
- Set up Google PageSpeed Insights API access
- Configure session storage and security settings

## Security Considerations

- All API endpoints require authentication
- Session-based authentication with secure cookies
- Environment variables for sensitive configuration
- Input validation using Zod schemas
- SQL injection protection through Drizzle ORM

## Performance Optimizations

- React Query for efficient data fetching and caching
- Drizzle ORM with connection pooling
- Vite for optimized bundling and fast HMR
- Lazy loading for dashboard components
- Real-time updates via WebSocket connections

## Future Enhancements

- Mobile app companion (React Native)
- Advanced analytics and reporting
- Competitor analysis features
- Automated SEO auditing schedules
- Integration with additional SEO tools
- Multi-language support
- Team collaboration features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Add tests for new functionality
5. Submit pull request with detailed description

## License

MIT License - see LICENSE file for details