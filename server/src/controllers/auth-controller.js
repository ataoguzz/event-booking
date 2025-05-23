import {validationResult} from "express-validator";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import crypto from "node:crypto";
import { query, getClient } from "../utils/db.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  };


export const registerUser = async (req, res) => {
    const { email, password, full_name, role = 'attendee' } = req.body;
  
    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Please provide email, password, and full name.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    const validRoles = ['attendee', 'organizer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid user role specified.' });
    }
  
    const client = await getClient();
  
    try {
      await client.query('BEGIN');
  
      const userExistsResult = await client.query('SELECT email FROM users WHERE email = $1', [email.toLowerCase()]);
      if (userExistsResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'User with this email already exists.' });
      }
  
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
  
      const newUserQuery = `
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id, email, full_name, role, avatar_url;
      `;
      const newUserResult = await client.query(newUserQuery, [email.toLowerCase(), password_hash, full_name, role]);
      const newUser = newUserResult.rows[0];
  
      const walletQuery = `
        INSERT INTO wallets (user_id, balance)
        VALUES ($1, $2)
        RETURNING balance;
      `;
      const walletResult = await client.query(walletQuery, [newUser.user_id, 0.00]);
  
      if (newUser.role === 'organizer') {
        const organizerProfileQuery = `
          INSERT INTO organizer_profiles (user_id, display_name)
          VALUES ($1, $2);
        `;
        await client.query(organizerProfileQuery, [newUser.user_id, newUser.full_name]);
      }
      
  
      await client.query('COMMIT');
  
      const token = generateToken(newUser.user_id, newUser.role);
  
      res.status(201).json({
        message: 'User registered successfully.',
        token,
        user: {
          ...newUser,
          balance: parseFloat(walletResult.rows[0].balance),
        },
      });
  
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Registration Controller Error:', error);
      res.status(500).json({ message: 'Server error during registration.' });
    } finally {
      client.release();
    }
};


export const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }
  
    try {
      const userQuery = `
        SELECT u.user_id, u.email, u.full_name, u.password_hash, u.role, u.avatar_url, w.balance
        FROM users u
        LEFT JOIN wallets w ON u.user_id = w.user_id
        WHERE u.email = $1;
      `;
      const userResult = await query(userQuery, [email.toLowerCase()]);
  
      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const user = userResult.rows[0];
      const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
  
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const token = generateToken(user.user_id, user.role);
  
      const userResponse = {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        balance: user.balance !== null ? parseFloat(user.balance) : 0.00,
      };
  
      res.status(200).json({
        message: 'Login successful.',
        token,
        user: userResponse,
      });
  
    } catch (error) {
      console.error('Login Controller Error:', error);
      res.status(500).json({ message: 'Server error during login.' });
    }
};










