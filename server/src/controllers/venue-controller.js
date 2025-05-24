import { query } from '../utils/db.js';

export const getCities = async (_req, res) => {
    try {
      const { rows } = await query('SELECT city FROM venue_cities;');
      res.json(rows.map(r => r.city)); 
    } catch (e) { res.status(500).json({ error: e.message }); }
  };