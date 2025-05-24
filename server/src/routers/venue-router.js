import express from "express";
import { getCities } from "../controllers/venue-controller.js";

export const venueRouter = express.Router();

venueRouter.get("/cities", getCities);