import express from "express";
import { getUserTickets, getTicketById, downloadTicketPDF } from "../controllers/ticket-controller.js";
import checkAuth from "../middleware/auth-check.js";

export const ticketRouter = express.Router();

// All ticket routes require authentication
ticketRouter.use(checkAuth);

ticketRouter.get("/", getUserTickets);
ticketRouter.get("/:ticketId", getTicketById);
ticketRouter.get("/:ticketId/download", downloadTicketPDF); 