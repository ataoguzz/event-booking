import express from 'express';
import { searchEvents, getEventById } from '../controllers/event-controller.js';

export const eventRouter = express.Router();

// Search events with filters
eventRouter.get('/search', searchEvents);

// Get event by ID
eventRouter.get('/:id', getEventById); 