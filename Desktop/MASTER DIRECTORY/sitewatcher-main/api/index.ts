import type { VercelRequest, VercelResponse } from '@vercel/node';

// API Router for Vercel deployment
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check endpoint
  if (req.url === '/api/health') {
    return res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  // Default response for unmatched routes
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.url,
    method: req.method
  });
}
