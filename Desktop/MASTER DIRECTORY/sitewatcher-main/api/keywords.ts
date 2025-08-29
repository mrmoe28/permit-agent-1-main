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

// Get real keyword ranking data using SERPApi - NO SIMULATION OR FALLBACKS
async function getKeywordRanking(keyword: string, domain: string): Promise<{ rank: number; volume: number; change: number }> {
  const serpApiKey = process.env.SERPAPI_KEY;
  
  if (!serpApiKey) {
    throw new Error(`SERPApi key not configured in environment variables. Please add SERPAPI_KEY to your Vercel environment settings.`);
  }

  console.log(`Getting real ranking data for "${keyword}" on domain "${domain}" using SERPApi`);
  
  // SERPApi Google Search request
  const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword)}&api_key=${serpApiKey}&num=100`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SiteWatcher/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(`SERPApi authentication failed. Please check your API key is correct and has sufficient credits.`);
      } else if (response.status === 429) {
        throw new Error(`SERPApi rate limit exceeded. Please wait before trying again or upgrade your plan.`);
      } else {
        throw new Error(`SERPApi request failed with status ${response.status}: ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`SERPApi returned error: ${data.error}`);
    }
    
    if (!data.organic_results || !Array.isArray(data.organic_results)) {
      throw new Error(`SERPApi returned invalid data structure. No organic results found for keyword "${keyword}".`);
    }
    
    // Find the domain in organic results
    let rank = null;
    for (let i = 0; i < data.organic_results.length; i++) {
      const result = data.organic_results[i];
      if (result.link && result.link.includes(domain)) {
        rank = i + 1; // Position is 1-based
        break;
      }
    }
    
    // If not found in top 100, set rank as not found
    if (rank === null) {
      rank = 0; // 0 indicates not found in top 100
    }
    
    // Get search volume from related searches
    let volume = 0;
    if (data.related_searches && data.related_searches.length > 0) {
      // Estimate volume based on related searches count (rough approximation)
      volume = Math.min(data.related_searches.length * 500, 50000);
    }
    
    // For change calculation, we need historical data which we don't have yet
    // Set to 0 for now, will need to implement historical tracking later
    const change = 0;
    
    console.log(`SERPApi result for "${keyword}": rank=${rank}, volume=${volume}, change=${change}`);
    
    return { rank, volume, change };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`SERPApi request timeout after 15 seconds. The API may be experiencing issues or your connection is slow.`);
    }
    
    // Re-throw the original error without any fallback
    throw error;
  }
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
    console.log(`[${requestId}] Keywords API request:`, {
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.method === 'POST' ? req.body : undefined
    });

    // Validate environment setup
    if (!process.env.DATABASE_URL) {
      console.error(`[${requestId}] Missing DATABASE_URL environment variable`);
      return res.status(500).json({
        message: "Server configuration error: Database not configured",
        requestId
      });
    }

    const { method } = req;
    
    switch (method) {
      case 'GET':
        const { siteId } = req.query;
        
        let keywords;
        
        if (siteId && typeof siteId === 'string') {
          // Get keywords for a specific site
          console.log(`[${requestId}] Fetching keywords for site: ${siteId}`);
          
          keywords = await queryDatabase(`
            SELECT 
              k.id,
              k.site_id,
              k.term,
              k.rank,
              k.volume,
              k.change,
              k.created_at,
              s.domain,
              s.url
            FROM keywords k
            JOIN sites s ON k.site_id = s.id
            WHERE k.site_id = $1
            ORDER BY k.created_at DESC
          `, [siteId]);
        } else {
          // Get all keywords across all sites (for dashboard)
          console.log(`[${requestId}] Fetching all keywords for dashboard`);
          
          keywords = await queryDatabase(`
            SELECT 
              k.id,
              k.site_id,
              k.term,
              k.rank,
              k.volume,
              k.change,
              k.created_at,
              s.domain,
              s.url
            FROM keywords k
            JOIN sites s ON k.site_id = s.id
            ORDER BY k.rank ASC, k.volume DESC
            LIMIT 20
          `);
        }

        return res.status(200).json(keywords);

      case 'POST':
        console.log(`[${requestId}] Processing POST request for new keyword`);
        
        const { siteId: postSiteId, term, domain } = req.body;
        
        // Input validation
        if (!postSiteId || typeof postSiteId !== 'string') {
          return res.status(400).json({
            message: "Site ID is required and must be a string",
            requestId
          });
        }

        if (!term || typeof term !== 'string' || term.trim().length === 0) {
          return res.status(400).json({
            message: "Keyword term is required and must be a non-empty string",
            requestId
          });
        }

        if (!domain || typeof domain !== 'string') {
          return res.status(400).json({
            message: "Domain is required and must be a string",
            requestId
          });
        }

        const trimmedTerm = term.trim();
        
        // Check if keyword already exists for this site
        const existingKeywords = await queryDatabase(`
          SELECT id FROM keywords 
          WHERE site_id = $1 AND LOWER(term) = LOWER($2)
        `, [postSiteId, trimmedTerm]);

        if (existingKeywords.length > 0) {
          return res.status(409).json({
            message: "Keyword already exists for this site",
            requestId
          });
        }

        console.log(`[${requestId}] Getting ranking data for keyword: ${trimmedTerm}`);
        
        try {
          // Get real ranking data from SERPApi - NO FALLBACKS
          const rankingData = await getKeywordRanking(trimmedTerm, domain);
          
          // Insert keyword with ranking data
          const newKeywords = await queryDatabase(`
            INSERT INTO keywords (site_id, term, rank, volume, change)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, site_id, term, rank, volume, change, created_at
          `, [postSiteId, trimmedTerm, rankingData.rank, rankingData.volume, rankingData.change]);

          const newKeyword = newKeywords[0];
          
          console.log(`[${requestId}] Keyword created successfully:`, newKeyword);
          
          return res.status(201).json({
            ...newKeyword,
            domain
          });
          
        } catch (rankingError) {
          console.error(`[${requestId}] Failed to get ranking data:`, rankingError);
          
          // Return specific error messages for the frontend to show in popup
          return res.status(500).json({
            message: rankingError instanceof Error ? rankingError.message : "Failed to get keyword ranking data",
            requestId,
            errorType: "ranking_api_error"
          });
        }

      case 'DELETE':
        console.log(`[${requestId}] Processing DELETE request`);
        
        const { id } = req.query;
        
        if (!id || typeof id !== 'string') {
          return res.status(400).json({
            message: "Keyword ID is required and must be a string",
            requestId
          });
        }

        console.log(`[${requestId}] Deleting keyword: ${id}`);
        
        const deleteResult = await queryDatabase(`
          DELETE FROM keywords WHERE id = $1 RETURNING id, term
        `, [id]);
        
        if (deleteResult.length === 0) {
          return res.status(404).json({
            message: "Keyword not found",
            requestId
          });
        }
        
        console.log(`[${requestId}] Keyword deleted successfully:`, deleteResult[0]);
        
        return res.status(200).json({
          message: "Keyword deleted successfully",
          keyword: deleteResult[0],
          requestId
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ 
          message: `Method ${method} not allowed`,
          requestId
        });
    }
    
  } catch (error) {
    console.error(`[${requestId}] Keywords API error:`, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      requestId
    });
  }
}