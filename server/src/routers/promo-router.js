import { Router } from 'express';
import { validatePromoCode } from '../controllers/promo-controller.js';
import checkAuth from '../middleware/auth-check.js';

const promoRouter = Router();


promoRouter.post('/validate', checkAuth, validatePromoCode);

export default promoRouter; 