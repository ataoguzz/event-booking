import express from "express";
import { getOrganizers, getFollowing, followOrganizer, unfollowOrganizer, getWalletInfo, getTransactions, topUpBalance } from "../controllers/user-controller.js";
import checkAuth from "../middleware/auth-check.js";


export const userRouter = express.Router();

userRouter.get("/organizers", getOrganizers);
userRouter.get("/organizers/following", checkAuth, getFollowing);
userRouter.post("/organizers/follow/:id", checkAuth, followOrganizer);
userRouter.delete("/organizers/follow/:id", checkAuth, unfollowOrganizer);

// Wallet routes
userRouter.get("/wallet", checkAuth, getWalletInfo);
userRouter.get("/wallet/transactions", checkAuth, getTransactions);
userRouter.post("/wallet/topup", checkAuth, topUpBalance);



/*
userRouter.get("/organizers/following", checkAuth, (req, res) => {
    const following = await db.query("SELECT * FROM following WHERE user_id = $1", [req.user.id]);
}

userRouter.post("/organizers/follow", checkAuth, (req, res) => {
    const { organizerId } = req.body;

userRouter.post("/organizers/follow", checkAuth, (req, res) => {
    const { organizerId } = req.body;
} */
