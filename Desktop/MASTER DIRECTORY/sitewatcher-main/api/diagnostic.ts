import type { VercelRequest, VercelResponse } from '@vercel/node';

async function testDatabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return { success: false, message: 'DATABASE_URL not configured' };
    }

    // Import Neon serverless client
    const { neon } = await import('@neondatabase/serverless');
    
    // Create Neon SQL client
    const sql = neon(databaseUrl);
    
    // Test basic query
    const result = await sql`SELECT 1 as test, NOW() as timestamp`;
    
    return { 
      success: true, 
      message: 'Database connection successful',
      details: result[0]
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Database test error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function testGoogleAPI(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (!apiKey) {
      return { success: false, message: 'GOOGLE_PAGESPEED_API_KEY not configured' };
    }

    const testUrl = 'https://example.com';
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(testUrl)}&key=${apiKey}&category=seo`;
    
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'SiteWatcher-Diagnostic/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        message: 'Google PageSpeed API working',
        details: {
          seoScore: Math.round((data.lighthouseResult?.categories?.seo?.score || 0) * 100),
          hasLighthouseData: !!data.lighthouseResult
        }
      };
    } else {
      const errorText = await response.text().catch(() => response.statusText);
      return { 
        success: false, 
        message: `Google API error: ${response.status} ${errorText}`
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Google API test error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Starting comprehensive diagnostic...');

    // Environment check
    const environment = {
      VERCEL: !!process.env.VERCEL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      GOOGLE_PAGESPEED_API_KEY: !!process.env.GOOGLE_PAGESPEED_API_KEY,
      NODE_ENV: process.env.NODE_ENV || 'unknown'
    };

    console.log('Environment check:', environment);

    // Run tests in parallel
    const [dbTest, apiTest] = await Promise.all([
      testDatabaseConnection(),
      testGoogleAPI()
    ]);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      environment,
      tests: {
        database: dbTest,
        googleAPI: apiTest
      },
      overall: {
        healthy: dbTest.success && apiTest.success,
        readyForAnalysis: dbTest.success && apiTest.success
      }
    };

    console.log('Diagnostic results:', diagnostics);

    const statusCode = diagnostics.overall.healthy ? 200 : 500;
    return res.status(statusCode).json(diagnostics);

  } catch (error) {
    console.error('Diagnostic failed:', error);
    
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      overall: {
        healthy: false,
        readyForAnalysis: false
      }
    });
  }
}