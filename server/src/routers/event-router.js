import express from "express";
import { getEvents, getEventDetails, getEventSeats } from "../controllers/event-controller.js";


export const eventRouter = express.Router();

eventRouter.get("/", getEvents);
eventRouter.get("/:eventId", getEventDetails);
eventRouter.get("/:eventId/seats", getEventSeats);