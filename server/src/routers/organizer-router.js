import express from "express";
import { updateOrganizerProfile, uploadProfileImage, getOrganizerProfile, getPublicOrganizerProfile } from "../controllers/organizer-controller.js";
import checkAuth from "../middleware/auth-check.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return next();
        }
        
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
           
            console.log("[Optional Auth] Auth failed but continuing:", error.message);
        }
        
        
        next();
    } catch (error) {
        
        console.error("[Optional Auth] Error:", error);
        next();
    }
};

export const organizerRouter = express.Router();

organizerRouter.get("/profile", checkAuth, getOrganizerProfile);
organizerRouter.put("/profile", checkAuth, updateOrganizerProfile);
organizerRouter.post("/profile-image", checkAuth, upload.single('image'), uploadProfileImage);

// Public routes (accessible to all users)
organizerRouter.get("/:id", optionalAuth, getPublicOrganizerProfile);