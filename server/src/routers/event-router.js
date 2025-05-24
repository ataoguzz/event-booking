import express from "express";
import { getEvents } from "../controllers/event-controller.js";


export const eventRouter = express.Router();

eventRouter.get("/", getEvents);