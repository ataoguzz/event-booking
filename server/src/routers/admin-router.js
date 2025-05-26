import express from "express";
import {check} from "express-validator";
import {getVenuesRequests, 
    evaluateVenueRequest,
    getAllEvents,
    getAllEventsFilter,
    getAllAcounts,
    getEventsByCities,
    getAllOrganizers,
    getDashboardData} from "../controllers/admin-controller.js";

export const adminRouter = express.Router();


adminRouter.get("/venuesRequests", getVenuesRequests);
adminRouter.post("/evaluateVenueRequest", evaluateVenueRequest);
adminRouter.get("/getAllEvents", getAllEvents);
adminRouter.get('/getAllEventsFilter', getAllEventsFilter);
adminRouter.get('/getAllAccounts', getAllAcounts);
adminRouter.get("/getEventsByCities", getEventsByCities);
adminRouter.get("/getAllOrganizers", getAllOrganizers);
adminRouter.get('/dashboard', getDashboardData);