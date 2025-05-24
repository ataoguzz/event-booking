
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The path to your 'uploads' directory.
// If uploadMiddleware.js is in 'server/middleware/' and 'uploads' is in the project root,
// then __dirname is 'your-project-root/server/middleware'.
// So, to get to 'your-project-root/uploads/', it would be path.join(__dirname, '..', '..', 'uploads').
// Please verify this path based on your actual directory structure.
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        // Pass an error to multer
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10 // 10MB per file
    },
    fileFilter: fileFilter
});

export const uploadEventImages = upload.array('images', 10);