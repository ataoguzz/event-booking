import express from 'express';
import { getEvents, getEventDetails } from '../controllers/event-controller.js';
import { getEventReviews, canReviewEvent, createReview } from '../controllers/review-controller.js';
import { requireAuth } from '../middleware/auth-middleware.js';

const router = express.Router();

// Event routes
router.get('/', getEvents);
router.get('/:eventId', getEventDetails);

// Review routes
router.get('/:eventId/reviews', getEventReviews);
router.get('/:eventId/can-review', requireAuth, canReviewEvent);
router.post('/:eventId/reviews', requireAuth, createReview);

export default router; 