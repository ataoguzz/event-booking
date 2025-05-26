import express from 'express';
import { createReview, getEventReviews, getUserReview } from '../controllers/review-controller.js';
import checkAuth from '../middleware/auth-check.js';

export const reviewRouter = express.Router();

// All routes require authentication
reviewRouter.use(checkAuth);

// Create a review for an event
reviewRouter.post('/events/:eventId/reviews', createReview);

// Get all reviews for an event
reviewRouter.get('/events/:eventId/reviews', getEventReviews);

// Get user's review for an event
reviewRouter.get('/events/:eventId/reviews/user', getUserReview); 