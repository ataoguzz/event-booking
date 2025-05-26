import express from "express";
import { getOrganizers, getFollowing, followOrganizer, unfollowOrganizer, getWalletInfo, getTransactions, topUpBalance, getFollowedEvents } from "../controllers/user-controller.js";
import checkAuth from "../middleware/auth-check.js";

export const userRouter = express.Router();

userRouter.get("/organizers", getOrganizers);
userRouter.get("/organizers/following", checkAuth, getFollowing);
userRouter.post("/organizers/follow/:id", checkAuth, followOrganizer);
userRouter.delete("/organizers/follow/:id", checkAuth, unfollowOrganizer);

userRouter.get("/followed-events", checkAuth, getFollowedEvents);

userRouter.get("/wallet", checkAuth, getWalletInfo);
userRouter.get("/wallet/transactions", checkAuth, getTransactions);
userRouter.post("/wallet/topup", checkAuth, topUpBalance);



