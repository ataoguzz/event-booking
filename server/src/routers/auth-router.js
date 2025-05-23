import express from "express";
import {check} from "express-validator";
import {registerUser, loginUser} from "../controllers/auth-controller.js";
import checkAuth from "../middleware/auth-check.js";

export const authRouter = express.Router();



authRouter.post("/register", registerUser)
authRouter.post("/login", loginUser)

// TODO
// authRouter.post("/forgot-password", forgotPassword)
// authRouter.post("/reset-password", resetPassword)
// authRouter.post("/change-password", checkAuth, changePassword)


