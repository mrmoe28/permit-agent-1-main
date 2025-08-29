import type { VercelRequest, VercelResponse } from '@vercel/node';

async function queryDatabase(query: string, params: any[] = []): Promise<any> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(databaseUrl);
  
  return await sql(query, params);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = Math.random().toString(36).substring(7);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { method } = req;
    
    console.log(`[${requestId}] Sites API request:`, {
      method,
      url: req.url,
      body: method === 'POST' ? req.body : undefined,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    switch (method) {
      case 'GET':
        const sites = await queryDatabase(`
          SELECT id, url, domain, created_at
          FROM sites 
          ORDER BY created_at DESC
        `);
        return res.status(200).json(sites);

      case 'POST':
        console.log(`[${requestId}] Processing POST request for new site`);
        
        const { url, domain } = req.body;
        
        // Input validation
        if (!url || typeof url !== 'string' || !domain || typeof domain !== 'string') {
          console.log(`[${requestId}] Invalid input:`, { url: typeof url, domain: typeof domain });
          return res.status(400).json({ 
            message: "URL and domain are required and must be strings",
            requestId
          });
        }
        
        if (url.length > 2048 || domain.length > 255) {
          console.log(`[${requestId}] Input too long:`, { urlLength: url.length, domainLength: domain.length });
          return res.status(400).json({ 
            message: "URL or domain is too long",
            requestId
          });
        }

        const newSites = await queryDatabase(`
          INSERT INTO sites (url, domain) 
          VALUES ($1, $2)
          ON CONFLICT (url) DO UPDATE SET domain = EXCLUDED.domain
          RETURNING id, url, domain, created_at
        `, [url, domain]);
        
        return res.status(201).json(newSites[0]);

      case 'DELETE':
        console.log(`[${requestId}] Processing DELETE request`);
        
        const { id } = req.query;
        
        // Input validation
        if (!id || typeof id !== 'string') {
          console.log(`[${requestId}] Invalid site ID:`, { id, type: typeof id });
          return res.status(400).json({ 
            message: "Site ID is required and must be a string",
            requestId
          });
        }
        
        // UUID validation
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          console.log(`[${requestId}] Invalid UUID format:`, { id });
          return res.status(400).json({ 
            message: "Invalid site ID format",
            requestId
          });
        }

        console.log(`[${requestId}] Deleting site ${id}`);
        const deleteResult = await queryDatabase('DELETE FROM sites WHERE id = $1 RETURNING id', [id]);
        
        if (deleteResult.length === 0) {
          console.log(`[${requestId}] Site not found:`, { id });
          return res.status(404).json({ 
            message: "Site not found",
            requestId
          });
        }
        
        console.log(`[${requestId}] Site deleted successfully:`, { id });
        return res.status(200).json({ 
          message: "Site deleted successfully",
          requestId
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error(`[${requestId}] Sites API error:`, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      method: req.method,
      url: req.url,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      requestId
    });
  }
}