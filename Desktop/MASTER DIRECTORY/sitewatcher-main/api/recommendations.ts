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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { method } = req;
    
    console.log(`[${requestId}] Recommendations API request:`, {
      method,
      url: req.url,
      body: method === 'PUT' ? req.body : undefined,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    switch (method) {
      case 'GET':
        // Get recommendations for a specific analysis
        const { analysisId } = req.query;
        
        if (!analysisId || typeof analysisId !== 'string') {
          return res.status(400).json({ 
            message: "Analysis ID is required",
            requestId
          });
        }

        const recommendations = await queryDatabase(`
          SELECT 
            id, 
            analysis_id, 
            title, 
            description, 
            priority, 
            type,
            implementation_guide,
            code_example,
            effort_score,
            impact_score,
            estimated_time,
            status,
            completed_at,
            created_at
          FROM recommendations 
          WHERE analysis_id = $1
          ORDER BY 
            CASE 
              WHEN priority = 'high' THEN 3
              WHEN priority = 'medium' THEN 2
              ELSE 1
            END DESC,
            (impact_score::float / GREATEST(effort_score, 1)) DESC
        `, [analysisId]);
        
        return res.status(200).json(recommendations);

      case 'PUT':
        // Update recommendation status
        const { id } = req.query;
        const { status } = req.body;
        
        // Input validation
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ 
            message: "Recommendation ID is required",
            requestId
          });
        }

        if (!status || typeof status !== 'string') {
          return res.status(400).json({ 
            message: "Status is required",
            requestId
          });
        }

        const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            message: "Invalid status. Must be one of: " + validStatuses.join(', '),
            requestId
          });
        }

        // UUID validation
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          return res.status(400).json({ 
            message: "Invalid recommendation ID format",
            requestId
          });
        }

        // Check if recommendation exists
        const existingRec = await queryDatabase('SELECT id FROM recommendations WHERE id = $1', [id]);
        if (existingRec.length === 0) {
          return res.status(404).json({ 
            message: "Recommendation not found",
            requestId
          });
        }

        // Update the recommendation
        const updateQuery = status === 'completed' 
          ? 'UPDATE recommendations SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *'
          : 'UPDATE recommendations SET status = $1, completed_at = NULL WHERE id = $2 RETURNING *';
        
        const updatedRec = await queryDatabase(updateQuery, [status, id]);
        
        console.log(`[${requestId}] Recommendation status updated:`, { id, status });
        
        return res.status(200).json({
          message: "Recommendation status updated successfully",
          recommendation: updatedRec[0],
          requestId
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error(`[${requestId}] Recommendations API error:`, {
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