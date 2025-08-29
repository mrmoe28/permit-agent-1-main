import { Pool, neonConfig, neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { Pool as NodePool } from 'pg';
import * as schema from "@shared/schema";

// Default to local PostgreSQL for development if no DATABASE_URL is provided
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/sitewatcher_dev";

// Check if using Neon (serverless) or local PostgreSQL
const isNeon = DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('neon.db');
const isVercel = !!process.env.VERCEL;

// For serverless environments, create DB instance per request
let globalDb: any = null;
let globalPool: Pool | NodePool | null = null;

function createDatabaseConnection() {
  if (isNeon) {
    if (isVercel) {
      // Use HTTP-based queries for Vercel to avoid WebSocket issues
      console.log('Creating HTTP-based Neon connection for Vercel...');
      const sql = neon(DATABASE_URL);
      return drizzleHttp(sql, { schema });
    } else {
      // Local development with WebSocket support
      console.log('Creating WebSocket-based Neon connection for local development...');
      if (typeof window === 'undefined') {
        try {
          const ws = require("ws");
          neonConfig.webSocketConstructor = ws;
        } catch (error) {
          console.warn('WebSocket library not available, falling back to HTTP');
          const sql = neon(DATABASE_URL);
          return drizzleHttp(sql, { schema });
        }
      }
      
      // Create pooled connection for local development
      const pool = new Pool({ 
        connectionString: DATABASE_URL,
        max: 1, // Limit connections for serverless compatibility
      });
      
      // Add error handling
      pool.on('error', (err) => {
        console.error('Database pool error:', err);
      });
      
      globalPool = pool;
      return drizzle({ client: pool, schema });
    }
  } else {
    // Local PostgreSQL for development
    console.log('Creating local PostgreSQL connection...');
    const pool = new NodePool({ 
      connectionString: DATABASE_URL,
      ssl: false,
      max: 1, // Limit connections
    });
    
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
    
    globalPool = pool;
    return drizzleNode(pool, { schema });
  }
}

// Create connection for serverless or reuse for local development
function getDatabase() {
  if (isVercel || !globalDb) {
    // Always create new connection in Vercel or if none exists
    globalDb = createDatabaseConnection();
  }
  return globalDb;
}

// Cleanup function for graceful shutdown
async function closeDatabase() {
  if (globalPool) {
    console.log('Closing database pool...');
    try {
      await globalPool.end();
      globalPool = null;
      globalDb = null;
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', closeDatabase);
  process.on('SIGTERM', closeDatabase);
  process.on('beforeExit', closeDatabase);
}

export const db = getDatabase();
export { getDatabase, closeDatabase };