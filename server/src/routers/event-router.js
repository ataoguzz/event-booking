import express from "express";
import {getEvents, getEventDetails, getEventSeats, purchaseTickets, createEvent, getOrganizerEvents, updateEvent, deleteEvent, getEventDetailsById} from "../controllers/event-controller.js";
import { uploadEventImages } from "../middleware/uploadMiddleware.js";
import checkAuth from "../middleware/auth-check.js";


export const eventRouter = express.Router();

eventRouter.get("/", getEvents);
eventRouter.get("/:eventId/details", getEventDetails);
eventRouter.get("/:eventId/seats", getEventSeats);
eventRouter.post("/:eventId/purchase", checkAuth, purchaseTickets);
eventRouter.post('/create', uploadEventImages, createEvent);
eventRouter.post('/my-events', getOrganizerEvents);
eventRouter.post('/:eventId', deleteEvent);
eventRouter.put('/:eventId', uploadEventImages, updateEvent);
eventRouter.delete('/:eventId', deleteEvent);
eventRouter.get('/:eventId', getEventDetailsById);