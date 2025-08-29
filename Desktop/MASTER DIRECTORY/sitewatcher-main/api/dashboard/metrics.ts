import type { VercelRequest, VercelResponse } from '@vercel/node';

async function queryDatabase(query: string, params: any[] = [], retries: number = 2): Promise<any> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Import Neon serverless client for Vercel environment
  const { neon } = await import('@neondatabase/serverless');
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Database query attempt ${attempt + 1}/${retries + 1}: ${query.substring(0, 50)}...`);
      
      // Create Neon SQL client
      const sql = neon(databaseUrl);
      
      // Execute query with parameters
      const result = await sql(query, params);
      
      console.log(`Database query successful on attempt ${attempt + 1}`);
      return result;
    } catch (error) {
      if (attempt === retries) {
        console.error(`Database query failed after all retries:`, error);
        throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      console.log(`Database query error on attempt ${attempt + 1}, retrying:`, error);
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Database query failed after all retries');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = Math.random().toString(36).substring(7);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
  
  try {
    console.log(`[${requestId}] Dashboard metrics API request`);

    // Validate environment setup
    if (!process.env.DATABASE_URL) {
      console.error(`[${requestId}] Missing DATABASE_URL environment variable`);
      return res.status(500).json({
        message: "Server configuration error: Database not configured",
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Get total sites count
      const siteCount = await queryDatabase('SELECT COUNT(*) as count FROM sites');
      
      // Get total analyses count
      const analysisCount = await queryDatabase('SELECT COUNT(*) as count FROM analyses');
      
      // Get average SEO score for completed analyses
      const avgSeoScore = await queryDatabase(`
        SELECT AVG(seo_score) as avg 
        FROM analyses 
        WHERE status = 'completed' AND seo_score IS NOT NULL
      `);
      
      // Get average page speed for completed analyses
      const avgPageSpeed = await queryDatabase(`
        SELECT AVG(page_speed) as avg 
        FROM analyses 
        WHERE status = 'completed' AND page_speed IS NOT NULL
      `);

      // Get recent SEO score for trend calculation
      const recentSeoScore = await queryDatabase(`
        SELECT AVG(seo_score) as avg 
        FROM analyses 
        WHERE status = 'completed' AND seo_score IS NOT NULL 
        AND created_at >= NOW() - INTERVAL '7 days'
      `);

      // Get recent page speed for trend calculation  
      const recentPageSpeed = await queryDatabase(`
        SELECT AVG(page_speed) as avg 
        FROM analyses 
        WHERE status = 'completed' AND page_speed IS NOT NULL 
        AND created_at >= NOW() - INTERVAL '7 days'
      `);

      // Get keywords count
      const keywordsCount = await queryDatabase('SELECT COUNT(*) as count FROM keywords');

      // Get recent keywords for trend
      const recentKeywords = await queryDatabase(`
        SELECT COUNT(*) as count FROM keywords 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `);

      // Calculate metrics with trends
      const currentSeoScore = Math.round(Number(avgSeoScore[0]?.avg) || 0);
      const currentPageSpeed = Math.round(Number(avgPageSpeed[0]?.avg) || 0);
      const recentSeo = Math.round(Number(recentSeoScore[0]?.avg) || 0);
      const recentSpeed = Math.round(Number(recentPageSpeed[0]?.avg) || 0);
      const totalKeywords = Number(keywordsCount[0]?.count) || 0;
      const newKeywords = Number(recentKeywords[0]?.count) || 0;

      const metrics = {
        seoScore: currentSeoScore,
        seoChange: recentSeo > 0 && currentSeoScore > 0 ? 
          Math.round(((recentSeo - currentSeoScore) / currentSeoScore) * 100) : 0,
        pageSpeed: currentPageSpeed,
        speedChange: recentSpeed > 0 && currentPageSpeed > 0 ? 
          Math.round(((recentSpeed - currentPageSpeed) / currentPageSpeed) * 100) : 0,
        keywords: totalKeywords,
        keywordChange: newKeywords,
        traffic: "N/A", // Traffic data not available yet
        trafficChange: 0,
        sites: Number(siteCount[0]?.count) || 0,
        analyses: Number(analysisCount[0]?.count) || 0,
      };

      console.log(`[${requestId}] Dashboard metrics calculated:`, metrics);
      return res.status(200).json(metrics);
      
    } catch (dbError) {
      // If tables don't exist, return default values
      if (dbError instanceof Error && (
        dbError.message.includes('relation') || 
        dbError.message.includes('table') ||
        dbError.message.includes('does not exist')
      )) {
        console.log(`[${requestId}] Database tables not found, returning default metrics`);
        const defaultMetrics = {
          seoScore: 0,
          seoChange: 0,
          pageSpeed: 0,
          speedChange: 0,
          keywords: 0,
          keywordChange: 0,
          traffic: "N/A",
          trafficChange: 0,
          sites: 0,
          analyses: 0,
        };
        return res.status(200).json(defaultMetrics);
      }
      throw dbError;
    }
    
  } catch (error) {
    console.error(`[${requestId}] Dashboard metrics API error:`, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      message: "Failed to fetch dashboard metrics",
      error: error instanceof Error ? error.message : "Unknown error",
      requestId
    });
  }
}