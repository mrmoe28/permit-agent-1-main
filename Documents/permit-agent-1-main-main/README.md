# PermitAgent - Permit Information Discovery Tool

PermitAgent is a comprehensive web application that helps project managers and contractors efficiently find and gather permit information from local planning and building departments. Simply enter an address and automatically discover local permit requirements, fees, application procedures, and contact information.

## 🚀 Features

- **Automatic Jurisdiction Discovery**: Find the correct local government website from any address
- **Intelligent Web Scraping**: Extract permit information from government websites
- **AI-Powered Data Processing**: Use GPT-4 to parse and organize unstructured government data
- **Comprehensive Results**: Get permit types, fees, requirements, and contact information
- **Export Functionality**: Download organized permit information for your projects
- **Mobile-Friendly**: Responsive design works on all devices

## 🛠️ Technology Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **OpenAI GPT-4** for data extraction
- **Cheerio** for web scraping
- **React Hook Form** + **Zod** for form validation
- **Vercel** for deployment

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (for AI processing)
- Optional: Google Maps API key (for enhanced geocoding)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys (server and client-side where needed):
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_key_here
   GOOGLE_PLACES_API_KEY=your_google_places_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_key_here
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in your terminal)

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Project Structure

```text
src/
├── app/                    # Next.js App Router
│   ├── api/search/         # Main search API endpoint
│   └── page.tsx            # Home page
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── forms/              # Form components
│   └── dashboard/          # Results display
├── lib/
│   ├── scraping/           # Web scraping engine
│   ├── ai/                 # AI processing
│   └── utils/              # Utilities
└── types/                  # TypeScript definitions
```

## 🌐 API Endpoints

### POST /api/search

Search for permit information by address.

**Request:**
```json
{
  "address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "county": "San Francisco"
  }
}
```

## 📋 Usage Guide

1. **Enter an Address**: Type any property address in the search form
2. **Wait for Results**: The app discovers the jurisdiction and scrapes permit information
3. **Review Results**: See organized permit types, fees, and requirements
4. **Export Data**: Download or print the permit information for your records

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub** and connect to Vercel
2. **Add environment variables** in Vercel project settings:
   - `OPENAI_API_KEY`: OpenAI API key for data processing
   - `NEXT_PUBLIC_APP_URL`: Your deployed app URL
3. **Deploy!**

## 🛡️ Legal & Compliance

- **Respectful Scraping**: The app respects robots.txt and implements delays between requests
- **Rate Limiting**: Built-in protection against overwhelming government websites
- **Data Accuracy**: Always verify information directly with local jurisdictions

## ⚠️ Disclaimer

PermitAgent automatically extracts information from government websites. While we strive for accuracy, information may not be complete or current. Always verify permit requirements, fees, and procedures directly with the jurisdiction before applying for permits.

---

Made with ❤️ for contractors and project managers who deserve better tools.
