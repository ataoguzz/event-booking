import express from "express";
import dotenv from "dotenv";
import cors from 'cors';

import { authRouter } from "./routers/auth-router.js";
// import { userRouter } from "./routers/user-router.js"; // Assuming this is still planned for later
import { adminRouter } from "./routers/admin-router.js";
import { eventRouter } from "./routers/event-router.js";
import { venueRouter } from "./routers/venue-router.js";
import { promoRouter } from './routers/promo-router.js';

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirnameCurrent = dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use("/api/auth", authRouter);
// app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/event", eventRouter);
app.use("/api/venues", venueRouter);
app.use("/api/promo", promoRouter);


app.use('/uploads', express.static(path.join(__dirnameCurrent, '..', 'uploads')));


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log("Server listening on port", PORT);
});