import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[${requestId}] Health check started`);

    // Basic environment checks
    const healthStatus = {
      status: 'healthy',
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      google_api: process.env.GOOGLE_PAGESPEED_API_KEY ? 'configured' : 'missing',
      environment: process.env.VERCEL ? 'vercel' : 'local',
      timestamp: new Date().toISOString(),
      requestId
    };

    // Test database connection if configured
    if (process.env.DATABASE_URL) {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL);
        await sql`SELECT 1 as test`;
        healthStatus.database = 'connected';
        console.log(`[${requestId}] Database connection successful`);
      } catch (dbError) {
        console.error(`[${requestId}] Database connection failed:`, dbError);
        healthStatus.database = 'error';
        healthStatus.status = 'degraded';
      }
    }

    console.log(`[${requestId}] Health check completed:`, healthStatus);
    return res.status(200).json(healthStatus);
    
  } catch (error) {
    console.error(`[${requestId}] Health check failed:`, error);
    return res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId
    });
  }
}