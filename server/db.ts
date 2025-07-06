import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { supabase, supabaseAdmin } from './supabase.js';

const { Pool } = pg;

// Database connection with proper error handling
let pool: pg.Pool | null = null;
let db: any = null;
let isConnected = false;

const connectToDatabase = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Try to get DATABASE_URL from environment
    let connectionString = process.env.DATABASE_URL;
    
    // If no DATABASE_URL, try to construct from Supabase components
    if (!connectionString && process.env.SUPABASE_URL) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
      
      // Construct connection string - user needs to provide password
      if (process.env.SUPABASE_PASSWORD) {
        connectionString = `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;
      }
    }
    
    if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
      console.log('⚠️  DATABASE_URL not properly configured');
      console.log('📝 Please set DATABASE_URL in your .env file with your complete Supabase connection string');
      console.log('📝 Example: DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres');
      return false;
    }

    // Create connection pool with timeout settings
    pool = new Pool({ 
      connectionString,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 10
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    // Create drizzle instance
    db = drizzle({ client: pool, schema });
    
    console.log('✅ Database connected successfully');
    isConnected = true;
    return true;
  } catch (error: any) {
    console.log('⚠️  Database connection failed, using in-memory storage for development');
    console.log(`📝 Error: ${error.message}`);
    console.log('📝 To fix this, update your .env file with correct Supabase credentials');
    
    if (pool) {
      await pool.end();
      pool = null;
    }
    isConnected = false;
    return false;
  }
};

// Initialize database connection
const initPromise = connectToDatabase();

// Export connection status and database instances
export const getDatabaseConnection = async () => {
  await initPromise;
  return { pool, db, isConnected };
};

export const isDataBaseConnected = () => isConnected;

// For backwards compatibility
export { pool, db, supabase, supabaseAdmin };