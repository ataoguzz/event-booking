import express from "express";
import { getEvents, getEventDetails, getEventSeats, purchaseTickets } from "../controllers/event-controller.js";
import checkAuth from "../middleware/auth-check.js";

export const eventRouter = express.Router();

eventRouter.get("/", getEvents);
eventRouter.get("/:eventId", getEventDetails);
eventRouter.get("/:eventId/seats", getEventSeats);
eventRouter.post("/:eventId/purchase", checkAuth, purchaseTickets);