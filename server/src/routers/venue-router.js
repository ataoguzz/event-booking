import express from "express";
import {getAllVenues} from "../controllers/venue-controller.js";

export const venueRouter = express.Router();

venueRouter.get('/', getAllVenues);
