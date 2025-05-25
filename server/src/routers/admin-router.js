import express from "express";
import {check} from "express-validator";
import {getVenuesRequests, evaluateVenueRequest} from "../controllers/admin-controller.js";

export const adminRouter = express.Router();


adminRouter.get("/venuesRequests", getVenuesRequests);
adminRouter.post("/evaluateVenueRequest", evaluateVenueRequest);