import express from "express";
import { getOrganizers, updateOrganizerProfile, uploadProfileImage } from "../controllers/user-controller.js";
import checkAuth from "../middleware/auth-check.js";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

export const userRouter = express.Router();

userRouter.get("/organizers", getOrganizers);
userRouter.put("/organizers/profile", checkAuth, updateOrganizerProfile);
userRouter.post("/organizers/profile-image", checkAuth, upload.single('image'), uploadProfileImage);


/*
userRouter.get("/organizers/following", checkAuth, (req, res) => {
    const following = await db.query("SELECT * FROM following WHERE user_id = $1", [req.user.id]);
}

userRouter.post("/organizers/follow", checkAuth, (req, res) => {
    const { organizerId } = req.body;

userRouter.post("/organizers/follow", checkAuth, (req, res) => {
    const { organizerId } = req.body;
} */
