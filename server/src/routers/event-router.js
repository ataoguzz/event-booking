// server/routers/event-router.js
import express from "express";
import { createEvent } from "../controllers/event-controller.js";
import { uploadEventImages } from "../middleware/uploadMiddleware.js";

export const eventRouter = express.Router();

// POST /api/event/
eventRouter.post('/create', uploadEventImages, createEvent);

// eventRouter.get('/', getAllEvents);
// eventRouter.get('/:eventId', getEventById);