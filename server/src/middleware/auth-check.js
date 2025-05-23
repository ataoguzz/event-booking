import jwt from 'jsonwebtoken';
import { query } from '../utils/db.js';

const checkAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; 

        if (!token) {
            return res.status(401).json({ error: 'Authentication failed - No token provided' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const result = await query('SELECT account_id, role FROM accounts WHERE account_id = $1', [decodedToken.accountId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Authentication failed - User not found' });
        }

        const user = result.rows[0];

        req.user = {
            accountId: user.account_id,
            role: user.role,
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

export default checkAuth;
