import { query, getClient } from "../utils/db.js";
import { validationResult } from "express-validator";

// Create a new promo code
export const createPromoCode = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            event_id, 
            code, 
            discount_type, 
            discount_value, 
            usage_limit,
            start_date,
            end_date 
        } = req.body;

        // Validate discount value based on type
        if (discount_type === 'PERCENT' && (discount_value <= 0 || discount_value > 100)) {
            return res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
        }
        if (discount_type === 'FIXED' && discount_value <= 0) {
            return res.status(400).json({ message: "Fixed discount must be greater than 0" });
        }

        // Check if code already exists
        const existingCode = await query(
            'SELECT code FROM promo_codes WHERE code = $1',
            [code]
        );

        if (existingCode.rows.length > 0) {
            return res.status(400).json({ message: "Promo code already exists" });
        }

        // Create new promo code
        const result = await query(
            `INSERT INTO promo_codes 
            (event_id, code, discount_type, discount_value, usage_limit, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [event_id, code, discount_type, discount_value, usage_limit, start_date, end_date]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating promo code:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all promo codes for an event
export const getEventPromoCodes = async (req, res) => {
    try {
        const { event_id } = req.params;
        
        const result = await query(
            `SELECT * FROM promo_codes 
            WHERE event_id = $1 
            ORDER BY created_at DESC`,
            [event_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching promo codes:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Validate and apply promo code
export const validatePromoCode = async (req, res) => {
    try {
        const { code, event_id } = req.body;
        const user_id = req.user.id; // Assuming user is authenticated

        const promoCode = await query(
            `SELECT * FROM promo_codes 
            WHERE code = $1 
            AND event_id = $2 
            AND is_active = true
            AND (usage_count < usage_limit)
            AND (start_date IS NULL OR start_date <= CURRENT_DATE)
            AND (end_date IS NULL OR end_date >= CURRENT_DATE)`,
            [code, event_id]
        );

        if (promoCode.rows.length === 0) {
            return res.status(404).json({ message: "Invalid or expired promo code" });
        }

        // Check if user has already used this code
        const existingRedemption = await query(
            `SELECT * FROM promo_redemptions 
            WHERE promo_code_id = $1 
            AND account_id = $2`,
            [promoCode.rows[0].promo_code_id, user_id]
        );

        if (existingRedemption.rows.length > 0) {
            return res.status(400).json({ message: "You have already used this promo code" });
        }

        res.json({
            valid: true,
            discount_type: promoCode.rows[0].discount_type,
            discount_value: promoCode.rows[0].discount_value
        });
    } catch (error) {
        console.error('Error validating promo code:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Apply promo code to transaction
export const applyPromoCode = async (req, res) => {
    try {
        const { code, tx_id } = req.body;
        const user_id = req.user.id;

        const client = await query.getClient();

        try {
            await client.query('BEGIN');

            // Get and validate promo code
            const promoCode = await client.query(
                `SELECT * FROM promo_codes 
                WHERE code = $1 
                AND is_active = true
                AND usage_count < usage_limit
                AND (start_date IS NULL OR start_date <= CURRENT_DATE)
                AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                FOR UPDATE`,
                [code]
            );

            if (promoCode.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: "Invalid or expired promo code" });
            }

            // Create redemption record
            await client.query(
                `INSERT INTO promo_redemptions (promo_code_id, tx_id, account_id)
                VALUES ($1, $2, $3)`,
                [promoCode.rows[0].promo_code_id, tx_id, user_id]
            );

            // Update usage count
            await client.query(
                `UPDATE promo_codes 
                SET usage_count = usage_count + 1
                WHERE promo_code_id = $1`,
                [promoCode.rows[0].promo_code_id]
            );

            await client.query('COMMIT');
            res.json({ message: "Promo code applied successfully" });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error applying promo code:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update promo code
export const updatePromoCode = async (req, res) => {
    try {
        const { promo_code_id } = req.params;
        const { 
            discount_type, 
            discount_value, 
            usage_limit,
            start_date,
            end_date,
            is_active 
        } = req.body;

        // Validate discount value based on type
        if (discount_type === 'PERCENT' && (discount_value <= 0 || discount_value > 100)) {
            return res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
        }
        if (discount_type === 'FIXED' && discount_value <= 0) {
            return res.status(400).json({ message: "Fixed discount must be greater than 0" });
        }

        const result = await query(
            `UPDATE promo_codes 
            SET discount_type = $1, 
                discount_value = $2, 
                usage_limit = $3,
                start_date = $4,
                end_date = $5,
                is_active = $6,
                updated_at = NOW()
            WHERE promo_code_id = $7
            RETURNING *`,
            [discount_type, discount_value, usage_limit, start_date, end_date, is_active, promo_code_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Promo code not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating promo code:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete promo code
export const deletePromoCode = async (req, res) => {
    try {
        const { promo_code_id } = req.params;

        const result = await query(
            'DELETE FROM promo_codes WHERE promo_code_id = $1 RETURNING *',
            [promo_code_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Promo code not found" });
        }

        res.json({ message: "Promo code deleted successfully" });
    } catch (error) {
        console.error('Error deleting promo code:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}; 