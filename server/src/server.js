import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import {authRouter} from "./routers/auth-router.js";
import {userRouter} from "./routers/user-router.js";
import {adminRouter} from "./routers/admin-router.js";
import {eventRouter} from "./routers/event-router.js";
import {organizerRouter} from "./routers/organizer-router.js";

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()

const app = express()

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/event", eventRouter);
app.use("/api/organizer", organizerRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!', 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log("Server listening on port", PORT);
});

