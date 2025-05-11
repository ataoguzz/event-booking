import express from "express";
import {
    changeInformation,
    createUser,
    deleteAccount,
    getUserInfo,
    getUserList
} from "../controllers/user-controller.js";
import checkAuth from "../middleware/auth-check.js";


export const userRouter = express.Router();

userRouter.get("/users", getUserList)
userRouter.post("/new-user", createUser)

userRouter.get("/:id", checkAuth, getUserInfo);
userRouter.post("/:id", checkAuth, changeInformation);
userRouter.delete("/:id", checkAuth, deleteAccount);

