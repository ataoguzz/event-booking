import pg from 'pg'; 
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', (client) => {
  console.log('New client connected to the database');

});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  let client;
  try {
    client = await pool.connect(); 
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error: error.message });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  console.log('Client acquired for transaction');
  return client;
};