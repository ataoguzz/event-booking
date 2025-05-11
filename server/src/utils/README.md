# Database Utilities

This directory contains utilities for working with the PostgreSQL database.

## Usage

### Connecting to the Database

The `db.js` file exports two functions:

- `query(text, params)`: Execute a SQL query with parameters.
- `getPool()`: Get the database connection pool for transactions or other operations.

Example usage:

```javascript
import { query } from '../utils/db.js';

// Execute a simple query
const getUserById = async (userId) => {
  const result = await query('SELECT * FROM "User" WHERE id = $1', [userId]);
  return result.rows[0];
};

// Execute a query with multiple parameters
const createUser = async (email, name, phone, password) => {
  const result = await query(
    'INSERT INTO "User" (email, name, phone, password) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, name, phone, password]
  );
  return result.rows[0];
};
```

### Using Transactions

For operations that require transactions, you can use the `getPool()` function:

```javascript
import { getPool } from '../utils/db.js';

const createBookingWithTransaction = async (userId, startDate, endDate) => {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user exists
    const userResult = await client.query('SELECT * FROM "User" WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    // Create booking
    const bookingResult = await client.query(
      'INSERT INTO "Booking" (startDate, endDate, userId) VALUES ($1, $2, $3) RETURNING *',
      [startDate, endDate, userId]
    );
    
    await client.query('COMMIT');
    return bookingResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

### Database Schema

The `schema.sql` file contains the SQL schema for the database. You can use this file to create the database tables:

```bash
psql -U postgres -d booking_app -f schema.sql
```

Or you can execute the SQL statements directly in your application:

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initializeDatabase = async () => {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await query(schema);
  console.log('Database initialized');
};
```