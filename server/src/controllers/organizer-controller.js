import { query } from "../utils/db.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const accountId = req.user?.accountId;
        
        if (!accountId) {
            return res.status(401).json({ message: 'Not authorized, user identification missing.' });
        }
        
        // Check if user is an organizer
        const roleCheck = await query('SELECT role FROM accounts WHERE account_id = $1', [accountId]);
        
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Account not found.' });
        }
        
        if (roleCheck.rows[0].role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can update their profile image.' });
        }

        // Generate a unique filename based on accountId and timestamp
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `profile_${accountId}_${Date.now()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Write the file to disk
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Update the avatar_url in the database
        const fileUrl = `/uploads/${fileName}`;
        
        const updateQuery = `
            UPDATE organizers 
            SET avatar_url = $1
            WHERE account_id = $2
            RETURNING *`;
        
        const result = await query(updateQuery, [fileUrl, accountId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Organizer profile not found.' });
        }
        
        res.status(200).json({
            message: 'Profile image uploaded successfully',
            profile: result.rows[0]
        });
        
    } catch (error) {
        console.error('Upload Profile Image Error:', error);
        next(error);
    }
};

export const updateOrganizerProfile = async (req, res, next) => {
    try {
        const accountId = req.user?.accountId;
        
        if (!accountId) {
            return res.status(401).json({ message: 'Not authorized, user identification missing.' });
        }
        
        // Check if user is an organizer
        const roleCheck = await query('SELECT role FROM accounts WHERE account_id = $1', [accountId]);
        
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Account not found.' });
        }
        
        if (roleCheck.rows[0].role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can update their profiles.' });
        }
        
        const { display_name, bio, avatar_url, email } = req.body;
        
        // Validate required fields
        if (!display_name) {
            return res.status(400).json({ message: 'Display name is required.' });
        }
        
        // Get the current profile to preserve avatar_url if not provided
        let currentProfile = null;
        if (!avatar_url) {
            const currentProfileQuery = 'SELECT avatar_url FROM organizers WHERE account_id = $1';
            const currentProfileResult = await query(currentProfileQuery, [accountId]);
            if (currentProfileResult.rows.length > 0) {
                currentProfile = currentProfileResult.rows[0];
            }
        }
        
        // If email is provided, check if it's already taken by another account
        if (email) {
            const emailCheckQuery = 'SELECT account_id FROM accounts WHERE email = $1 AND account_id <> $2';
            const emailCheckResult = await query(emailCheckQuery, [email.toLowerCase(), accountId]);
            
            if (emailCheckResult.rows.length > 0) {
                return res.status(409).json({ message: 'Email is already in use by another account.' });
            }
            
            // Update the email in the accounts table
            await query('UPDATE accounts SET email = $1 WHERE account_id = $2', [email.toLowerCase(), accountId]);
        }
        
        // Update the organizer profile - check if updated_at column exists in the table
        const updateQuery = `
            UPDATE organizers 
            SET 
                display_name = $1, 
                bio = $2,
                avatar_url = $3
            WHERE account_id = $4
            RETURNING *`;
        
        const result = await query(updateQuery, [
            display_name,
            bio || null,
            avatar_url || (currentProfile?.avatar_url || 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png'),
            accountId
        ]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Organizer profile not found.' });
        }
        
        // If email was updated, include it in the response
        let profileResponse = result.rows[0];
        if (email) {
            profileResponse.email = email.toLowerCase();
        } else {
            // Get the current email to include in the response
            const emailQuery = 'SELECT email FROM accounts WHERE account_id = $1';
            const emailResult = await query(emailQuery, [accountId]);
            if (emailResult.rows.length > 0) {
                profileResponse.email = emailResult.rows[0].email;
            }
        }
        
        res.status(200).json({
            message: 'Profile updated successfully',
            profile: profileResponse
        });
        
    } catch (error) {
        console.error('Update Organizer Profile Error:', error);
        next(error);
    }
};

export const getOrganizerProfile = async (req, res, next) => {
    try {
        const accountId = req.user?.accountId;
        
        if (!accountId) {
            return res.status(401).json({ message: 'Not authorized, user identification missing.' });
        }
        
        // Check if user is an organizer
        const roleCheck = await query('SELECT role FROM accounts WHERE account_id = $1', [accountId]);
        
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Account not found.' });
        }
        
        if (roleCheck.rows[0].role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can access organizer profiles.' });
        }
        
        const profileQuery = `
            SELECT o.*, a.email
            FROM organizers o
            JOIN accounts a ON o.account_id = a.account_id
            WHERE o.account_id = $1`;
        
        const result = await query(profileQuery, [accountId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Organizer profile not found.' });
        }
        
        res.status(200).json(result.rows[0]);
        
    } catch (error) {
        console.error('Get Organizer Profile Error:', error);
        next(error);
    }
}; 