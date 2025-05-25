import express from "express";
import {getCities, getAllVenues} from "../controllers/venue-controller.js";

export const venueRouter = express.Router();

venueRouter.get('/venues', getAllVenues);
venueRouter.get("/cities", getCities);