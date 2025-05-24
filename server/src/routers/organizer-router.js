import express from "express";
import { updateOrganizerProfile, uploadProfileImage, getOrganizerProfile } from "../controllers/organizer-controller.js";
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

export const organizerRouter = express.Router();

// Profile management routes
organizerRouter.get("/profile", checkAuth, getOrganizerProfile);
organizerRouter.put("/profile", checkAuth, updateOrganizerProfile);
organizerRouter.post("/profile-image", checkAuth, upload.single('image'), uploadProfileImage); 