import express from "express";
import dotenv from "dotenv";
import cors from 'cors';

import {authRouter} from "./routers/auth-router.js";
import {userRouter} from "./routers/user-router.js"


dotenv.config()

const app = express()

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log("Server listening on port", PORT);
});
