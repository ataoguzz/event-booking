import { query, getClient } from '../utils/db.js';

export const validatePromoCode = async (req, res) => {
    try {
        const { code, eventId } = req.body;
        const { accountId } = req.user;

        if (!code || !eventId) {
            return res.status(400).json({ error: 'Promo code and event ID are required' });
        }

        const eventIdInt = parseInt(eventId);

        const promoQuery = `
            SELECT 
                pc.promo_code_id,
                pc.code,
                pc.discount_type,
                pc.discount_value,
                pc.usage_limit,
                pc.usage_count,
                pc.start_date,
                pc.end_date,
                pc.is_active,
                pc.event_id
            FROM promo_codes pc
            WHERE pc.code = $1 
            AND pc.is_active = TRUE
            AND (pc.event_id IS NULL OR pc.event_id = $2)
        `;

        const { rows: promoRows } = await query(promoQuery, [code, eventIdInt]);

        if (promoRows.length === 0) {
            return res.status(404).json({ error: 'Invalid promo code' });
        }

        const promo = promoRows[0];

        const currentDate = new Date().toISOString().split('T')[0];
        if (promo.start_date && currentDate < promo.start_date) {
            return res.status(400).json({ error: 'Promo code is not yet active' });
        }
        if (promo.end_date && currentDate > promo.end_date) {
            return res.status(400).json({ error: 'Promo code has expired' });
        }

        if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
            return res.status(400).json({ error: 'Promo code usage limit reached' });
        }

        const redemptionQuery = `
            SELECT redemption_id 
            FROM promo_redemptions 
            WHERE promo_code_id = $1 AND account_id = $2
        `;
        const { rows: redemptionRows } = await query(redemptionQuery, [promo.promo_code_id, accountId]);

        if (redemptionRows.length > 0) {
            return res.status(400).json({ error: 'You have already used this promo code' });
        }

        res.json({
            valid: true,
            promo_code_id: promo.promo_code_id,
            code: promo.code,
            discount_type: promo.discount_type,
            discount_value: parseFloat(promo.discount_value),
            description: promo.discount_type === 'PERCENT' 
                ? `${promo.discount_value}% off`
                : `$${promo.discount_value} off`
        });

    } catch (err) {
        console.error('Error validating promo code:', err);
        res.status(500).json({ error: 'Failed to validate promo code', details: err.message });
    }
};

export const calculateDiscount = (totalAmount, discountType, discountValue) => {
    if (discountType === 'PERCENT') {
        const discount = totalAmount * (discountValue / 100);
        return Math.min(discount, totalAmount); 
    } else if (discountType === 'FIXED') {
        return Math.min(discountValue, totalAmount);
    }
    return 0;
};

export const applyPromoCode = async (client, promoCodeId, txId, accountId) => {
    try {
        const redemptionQuery = `
            INSERT INTO promo_redemptions (promo_code_id, tx_id, account_id)
            VALUES ($1, $2, $3)
            RETURNING redemption_id
        `;
        await client.query(redemptionQuery, [promoCodeId, txId, accountId]);

        const updateUsageQuery = `
            UPDATE promo_codes 
            SET usage_count = usage_count + 1, updated_at = NOW()
            WHERE promo_code_id = $1
        `;
        await client.query(updateUsageQuery, [promoCodeId]);

        return true;
    } catch (err) {
        console.error('Error applying promo code:', err);
        throw err;
    }
}; 