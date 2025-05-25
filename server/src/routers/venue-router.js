import express from "express";
import {getCities, getAllVenues, getVenueSeats, createVenueRequest} from "../controllers/venue-controller.js";

export const venueRouter = express.Router();

venueRouter.get('/venues', getAllVenues);
venueRouter.get("/cities", getCities);
venueRouter.get("/:venueId/seats", getVenueSeats);
venueRouter.post('/request', createVenueRequest);