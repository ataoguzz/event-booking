import express from 'express';
import { check } from 'express-validator';
import { 
    createPromoCode,
    getEventPromoCodes,
    validatePromoCode,
    applyPromoCode,
    updatePromoCode,
    deletePromoCode
} from '../controllers/promo-controller.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import { isOrganizer } from '../middleware/role-middleware.js';

export const promoRouter = express.Router();

// Validation middleware for promo code creation and updates
const validatePromoCodeData = [
    check('code')
        .isString()
        .isLength({ min: 3, max: 50 })
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('Code must be 3-50 characters long and contain only uppercase letters, numbers, underscores, and hyphens'),
    check('discount_type')
        .isIn(['PERCENT', 'FIXED'])
        .withMessage('Invalid discount type'),
    check('discount_value')
        .isFloat({ min: 0 })
        .withMessage('Discount value must be a positive number'),
    check('usage_limit')
        .isInt({ min: 1 })
        .withMessage('Usage limit must be at least 1'),
    check('start_date')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Invalid start date format'),
    check('end_date')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Invalid end date format')
];

// Routes for organizers
promoRouter.post(
    '/create',
    isAuthenticated,
    isOrganizer,
    validatePromoCodeData,
    createPromoCode
);

promoRouter.get(
    '/event/:event_id',
    isAuthenticated,
    isOrganizer,
    getEventPromoCodes
);

promoRouter.put(
    '/:promo_code_id',
    isAuthenticated,
    isOrganizer,
    validatePromoCodeData,
    updatePromoCode
);

promoRouter.delete(
    '/:promo_code_id',
    isAuthenticated,
    isOrganizer,
    deletePromoCode
);

// Routes for attendees
promoRouter.post(
    '/validate',
    isAuthenticated,
    [
        check('code').isString().notEmpty(),
        check('event_id').isInt()
    ],
    validatePromoCode
);

promoRouter.post(
    '/apply',
    isAuthenticated,
    [
        check('code').isString().notEmpty(),
        check('tx_id').isInt()
    ],
    applyPromoCode
); 