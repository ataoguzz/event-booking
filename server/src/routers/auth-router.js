import express from "express";
import {check} from "express-validator";
import {login, signup, forgotPassword, resetPassword, changePassword} from "../controllers/auth-controller.js";
import checkAuth from "../middleware/auth-check.js";

export const authRouter = express.Router();

authRouter.post("/signup",[
        check("first_name").not().isEmpty(),
        check("last_name").not().isEmpty(),
        check("email").normalizeEmail().isEmail(),
        check("password").isLength({min: 6}),
        check("city").not().isEmpty(),
        check("role").not().isEmpty()
    ],
    signup
)

authRouter.post("/login", [
        check("email").normalizeEmail().isEmail()
    ],
    login
)


authRouter.post("/forgot-password", forgotPassword)

authRouter.post("/reset-password", resetPassword)
authRouter.post("/change-password", checkAuth, changePassword)


