import { query, getClient } from "../utils/db.js";

export const getAllVenues = async (req, res, next) => {
    const client = await getClient();
    try {
        const { rows } = await client.query('SELECT venue_id, name, address, city, capacity, is_seated FROM venues ORDER BY name ASC');
        const venues = rows.map(v => ({
            id: v.venue_id,
            name: v.name,
            address: `${v.address}, ${v.city}`,
            capacity: v.capacity,
            isSeated: v.is_seated
        }));
        res.status(200).json(venues);
    } catch (error) {
        console.error('Error fetching venues:', error);
        next(error);
    } finally {
        client.release();
    }
};


export const getCities = async (_req, res) => {
    try {
      const { rows } = await query('SELECT city FROM venue_cities;');
      res.json(rows.map(r => r.city)); 
    } catch (e) { res.status(500).json({ error: e.message }); }
  };