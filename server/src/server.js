import express from "express";
import dotenv from "dotenv";
import cors from 'cors';

import {authRouter} from "./routers/auth-router.js";
import {userRouter} from "./routers/user-router.js";
import {adminRouter} from "./routers/admin-router.js";
import {eventRouter} from "./routers/event-router.js";


dotenv.config()

const app = express()

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/events", eventRouter);
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("Server listening on port", PORT);

});

