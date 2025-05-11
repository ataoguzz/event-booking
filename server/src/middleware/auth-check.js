import jwt from 'jsonwebtoken';
import { query } from '../utils/db.js';

const checkAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Get token from Bearer token

        if (!token) {
            return res.status(401).json({ error: 'Authentication failed - No token provided' });
        }

        // Verify token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database using SQL query
        const result = await query('SELECT * FROM "User" WHERE "userID" = $1', [decodedToken.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Authentication failed - User not found' });
        }

        const user = result.rows[0];

        // Attach user to request with consistent structure
        req.user = {
            userId: user.userID,
            email: user.email,
            phoneNumber: user.phoneNumber
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

export default checkAuth;
