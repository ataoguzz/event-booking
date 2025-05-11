import {validationResult} from "express-validator";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import crypto from "node:crypto";
import { query } from "../utils/db.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1hr";


export const signup = async (req, res) => {
    const validationErrors = validationResult(req)
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({error: validationErrors})
    }

    const {email, password, phoneNumber} = req.body;

    try {
        // Check if user already exists
        const existingUserResult = await query('SELECT * FROM "User" WHERE "email" = $1', [email]);

        if (existingUserResult.rows.length > 0) {
            return res.status(401).json({error: "Existing user"})
        }

        // Hash the password
        let hashedPassword = await bcryptjs.hash(password, 12);

        // Insert the new user
        const result = await query(
            'INSERT INTO "User" ("email", "password", "phoneNumber") VALUES ($1, $2, $3) RETURNING *',
            [email, hashedPassword, phoneNumber]
        );

        const createdUser = result.rows[0];

        // Generate JWT token
        let token = jwt.sign({userId: createdUser.userID}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});

        return res.status(201).json({
            user: {
                userId: createdUser.userID,
                email: createdUser.email,
                phoneNumber: createdUser.phoneNumber
            },
            token: token
        });

    } catch (error) {
        console.error('Error in signup:', error);
        return res.status(400).json({error: error.message});
    }
}

export const login = async (req, res) => {
    const validationErrors = validationResult(req)

    if (!validationErrors.isEmpty()) {
        return res.status(400).json({error: validationErrors})
    }

    const {email, password} = req.body;

    try {
        // Find user by email
        const userResult = await query('SELECT * FROM "User" WHERE "email" = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({error: "Invalid credentials."})
        }

        const user = userResult.rows[0];

        // Compare passwords
        let isValidPassword = await bcryptjs.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({error: "Invalid credentials."})
        }

        // Generate JWT token
        let token = jwt.sign({userId: user.userID}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});

        // Create user info object
        const userInfo = {
            userId: user.userID,
            email: user.email,
            phoneNumber: user.phoneNumber
        }

        return res.json({
            user: userInfo,
            token: token
        })

    } catch (error) {
        console.error('Error in login:', error);
        return res.status(400).json({error: error.message});
    }
}



export const forgotPassword = async (req, res) => {
    const email = req.body.email;

    try {
        // Find user by email
        const userResult = await query('SELECT * FROM "User" WHERE "email" = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({error: "User not found"});
        }

        const user = userResult.rows[0];

        // Delete existing token if any
        await query('DELETE FROM "Token" WHERE "userId" = $1', [user.userID]);

        // Create new reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hash = await bcryptjs.hash(resetToken, 10);

        // Save token to database
        await query(
            'INSERT INTO "Token" ("userId", "token") VALUES ($1, $2)',
            [user.userID, hash]
        );

        // Create reset link
        const link = `http://localhost:3000/auth/reset-password?token=${resetToken}&id=${user.userID}`;

        // Return the reset link in the response instead of sending an email
        res.status(201).json({
            message: "Password reset initiated",
            resetLink: link
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(400).json({error: "Something went wrong"});
    }
};

export const resetPassword = async (req, res) => {
    const userId = req.body.userId;
    const token = req.body.token;
    const newPassword = req.body.newPassword;

    try {
        // Find token by userId
        const tokenResult = await query('SELECT * FROM "Token" WHERE "userId" = $1', [userId]);

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({error: "Invalid or expired password reset token"});
        }

        const resetToken = tokenResult.rows[0];

        // Verify token
        const isValid = await bcryptjs.compare(token, resetToken.token);

        if (!isValid) {
            return res.status(400).json({error: "Invalid or expired password reset token"});
        }

        // Hash new password
        const hashedPassword = await bcryptjs.hash(newPassword, 12);

        // Update user password
        await query('UPDATE "User" SET "password" = $1 WHERE "userID" = $2', [hashedPassword, userId]);

        // Delete used token
        await query('DELETE FROM "Token" WHERE "userId" = $1', [userId]);

        res.status(201).json({message: "Password reset successfully."});
    } catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(400).json({error: "Something went wrong"});
    }
}

export const changePassword = async (req, res) => {
    const userId = req.user.userId; // Updated to match the JWT token payload
    const newPassword = req.body.newPassword;

    try {
        // Hash new password
        const hashedPassword = await bcryptjs.hash(newPassword, 12);

        // Update user password
        const result = await query('UPDATE "User" SET "password" = $1 WHERE "userID" = $2', [hashedPassword, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({error: "User not found"});
        }

        res.status(201).json({message: "Password changed successfully."});
    } catch (error) {
        console.error('Error in changePassword:', error);
        return res.status(400).json({error: "Something went wrong"});
    }
}
