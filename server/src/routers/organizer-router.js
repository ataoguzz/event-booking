import express from "express";
import { updateOrganizerProfile, uploadProfileImage, getOrganizerProfile, getPublicOrganizerProfile } from "../controllers/organizer-controller.js";
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

// Optional authentication middleware - doesn't require auth but populates req.user if token exists
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        // If no token, just continue without authentication
        if (!token) {
            return next();
        }
        
        // Try to authenticate the user but don't require authentication
        try {
            const jwt = await import('jsonwebtoken');
            const { query } = await import('../utils/db.js');
            
            const decodedToken = jwt.default.verify(token, process.env.JWT_SECRET);
            const result = await query('SELECT account_id, role FROM accounts WHERE account_id = $1', [decodedToken.accountId]);
            
            if (result.rows.length > 0) {
                const user = result.rows[0];
                req.user = {
                    accountId: user.account_id,
                    role: user.role,
                };
                console.log(`[Optional Auth] User authenticated: ${user.account_id}`);
            }
        } catch (error) {
            // Just log the error but don't fail the request
            console.log("[Optional Auth] Auth failed but continuing:", error.message);
        }
        
        // Continue to the next middleware/route handler
        next();
    } catch (error) {
        // Log error and continue
        console.error("[Optional Auth] Error:", error);
        next();
    }
};

export const organizerRouter = express.Router();

// Profile management routes (private, for organizers only)
organizerRouter.get("/profile", checkAuth, getOrganizerProfile);
organizerRouter.put("/profile", checkAuth, updateOrganizerProfile);
organizerRouter.post("/profile-image", checkAuth, upload.single('image'), uploadProfileImage);

// Public routes (accessible to all users)
organizerRouter.get("/:id", optionalAuth, getPublicOrganizerProfile);