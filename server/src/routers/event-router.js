// server/routers/event-router.js
import express from "express";
import {createEvent, getOrganizerEvents, deleteEvent, getEventDetailsById} from "../controllers/event-controller.js";
import { uploadEventImages } from "../middleware/uploadMiddleware.js";

export const eventRouter = express.Router();

// POST /api/event/
eventRouter.post('/create', uploadEventImages, createEvent);
eventRouter.post('/my-events', getOrganizerEvents);
eventRouter.post('/:eventId', deleteEvent);
eventRouter.get('/:eventId', getEventDetailsById);