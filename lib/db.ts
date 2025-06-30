import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

// Database configuration interface
interface DBConfig extends PoolConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

// Get database configuration from environment variables
const getDBConfig = (): DBConfig => {
  const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  };

  // Validate configuration
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null) {
      throw new Error(`Missing database configuration for ${key}`);
    }
  }

  return config as DBConfig;
};

// Create a new pool instance
const pool = new Pool(getDBConfig());

// Handle connection errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query function with proper generic type constraint
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error in query', { text, error });
    throw error;
  }
};

// For shutting down the pool gracefully
export const shutdown = async () => {
  await pool.end();
};

// Test the database connection
export const testConnection = async () => {
  try {
    await query('SELECT NOW()');
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Export the pool for transactions if needed
export { pool };