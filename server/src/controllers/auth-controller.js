// server/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import { query, getClient } from "../utils/db.js"; // Ensure path is correct

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (accountId, role) => {
    return jwt.sign({ accountId: accountId, role: role }, JWT_SECRET, {
      expiresIn: '1d',
    });
};

export const registerUser = async (req, res, next) => {
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

      const accountExistsResult = await client.query('SELECT email FROM accounts WHERE email = $1', [email.toLowerCase()]);
      if (accountExistsResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'Account with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const newAccountQuery = `
        INSERT INTO accounts (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING account_id, email, role;
      `;
      const newAccountResult = await client.query(newAccountQuery, [email.toLowerCase(), password_hash, role]);
      const newAccount = newAccountResult.rows[0];

      let userProfileSpecifics = {};
      let balance = null;
      let following_count = null;

      if (role === 'attendee') {
        const attendeeQuery = `
          INSERT INTO attendees (account_id, full_name, balance, following_count)
          VALUES ($1, $2, $3, $4) 
          RETURNING full_name, balance, following_count;
        `;
        const attendeeResult = await client.query(attendeeQuery, [newAccount.account_id, full_name, 0.00, 0]);
        userProfileSpecifics.full_name = attendeeResult.rows[0].full_name;
        balance = parseFloat(attendeeResult.rows[0].balance);
        following_count = parseInt(attendeeResult.rows[0].following_count, 10);
      } else if (role === 'organizer') {
        const organizerQuery = `
          INSERT INTO organizers (account_id, display_name) 
          VALUES ($1, $2)
          RETURNING display_name, bio, avg_rating, followers_count;
        `;
        const organizerResult = await client.query(organizerQuery, [newAccount.account_id, full_name]);
        userProfileSpecifics = { ...organizerResult.rows[0] };
        userProfileSpecifics.full_name = organizerResult.rows[0].display_name;
      } else if (role === 'admin') {
        const adminQuery = `INSERT INTO admins (account_id) VALUES ($1);`;
        await client.query(adminQuery, [newAccount.account_id]);
        userProfileSpecifics.full_name = "Administrator";
      }

      await client.query('COMMIT');

      const token = generateToken(newAccount.account_id, newAccount.role);

      const responseUser = {
        account_id: newAccount.account_id,
        email: newAccount.email,
        role: newAccount.role,
        full_name: userProfileSpecifics.full_name,
        display_name: userProfileSpecifics.display_name,
        ...(role === 'organizer' && {
            bio: userProfileSpecifics.bio,
            avg_rating: userProfileSpecifics.avg_rating,
            followers_count: userProfileSpecifics.followers_count,
        }),
        ...(role === 'attendee' && {
            following_count: following_count,
        }),
        balance: balance,
      };

      res.status(201).json({
        message: 'Account registered successfully.',
        token,
        user: responseUser,
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Registration Controller Error:', error);
      next(error);
    } finally {
      client.release();
    }
};


export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    try {
      const accountAuthQuery = `
        SELECT account_id, email, password_hash, role
        FROM accounts
        WHERE email = $1;
      `;
      const accountAuthResult = await query(accountAuthQuery, [email.toLowerCase()]);

      if (accountAuthResult.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const accountAuthData = accountAuthResult.rows[0];
      const isPasswordMatch = await bcrypt.compare(password, accountAuthData.password_hash);

      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const accountId = accountAuthData.account_id;
      const role = accountAuthData.role;
      let userProfile = {
        account_id: accountId,
        email: accountAuthData.email,
        role: role,
        balance: null,
        following_count: null,
      };

      if (role === 'attendee') {
        const profileRes = await query('SELECT full_name, balance, following_count FROM attendees WHERE account_id = $1', [accountId]);
        if (profileRes.rows.length > 0) {
            userProfile.full_name = profileRes.rows[0].full_name;
            userProfile.balance = parseFloat(profileRes.rows[0].balance);
            userProfile.following_count = parseInt(profileRes.rows[0].following_count, 10);
        } else {
            userProfile.full_name = "N/A";
        }
      } else if (role === 'organizer') {
        const profileRes = await query('SELECT display_name, bio, avg_rating, followers_count FROM organizers WHERE account_id = $1', [accountId]);
        if (profileRes.rows.length > 0) {
            userProfile = { ...userProfile, ...profileRes.rows[0] };
            userProfile.full_name = profileRes.rows[0].display_name;
        } else {
            userProfile.full_name = "Organizer N/A";
        }
      } else if (role === 'admin') {
        userProfile.full_name = "Administrator";
      }

      const token = generateToken(accountId, role);

      const finalUserResponse = {
        account_id: userProfile.account_id,
        email: userProfile.email,
        role: userProfile.role,
        full_name: userProfile.full_name,
        ...(role === 'attendee' && {
            balance: userProfile.balance,
            following_count: userProfile.following_count,
        }),
        ...(role === 'organizer' && {
            display_name: userProfile.display_name,
            bio: userProfile.bio,
            avg_rating: userProfile.avg_rating,
            followers_count: userProfile.followers_count,
        }),
      };

      res.status(200).json({
        message: 'Login successful.',
        token,
        user: finalUserResponse,
      });

    } catch (error) {
      console.error('Login Controller Error:', error);
      next(error);
    }
};


export const getCurrentUser = async (req, res, next) => {
  const accountId = req.user?.accountId;
  const role = req.user?.role;

  if (!accountId || !role) {
      return res.status(401).json({ message: 'Not authorized, user identification missing.' });
  }

  try {
      let userProfile = {
          account_id: accountId,
          role: role,
          balance: null,
          following_count: null, 
      };

      const accountEmailResult = await query('SELECT email FROM accounts WHERE account_id = $1', [accountId]);
      if (accountEmailResult.rows.length === 0) {
          return res.status(404).json({ message: 'Account not found for token.' });
      }
      userProfile.email = accountEmailResult.rows[0].email;

      if (role === 'attendee') {
          const profileRes = await query('SELECT full_name, balance, following_count FROM attendees WHERE account_id = $1', [accountId]);
          if (profileRes.rows.length > 0) {
              userProfile.full_name = profileRes.rows[0].full_name;
              userProfile.balance = parseFloat(profileRes.rows[0].balance);
              userProfile.following_count = parseInt(profileRes.rows[0].following_count, 10);
          } else {
               userProfile.full_name = "N/A";
          }
      } else if (role === 'organizer') {
          const profileRes = await query('SELECT display_name, bio, avg_rating, followers_count FROM organizers WHERE account_id = $1', [accountId]);
          if (profileRes.rows.length > 0) {
              userProfile = { ...userProfile, ...profileRes.rows[0] };
              userProfile.full_name = profileRes.rows[0].display_name;
          } else {
              userProfile.full_name = "Organizer N/A";
          }
      } else if (role === 'admin') {
          userProfile.full_name = "Administrator";
      }

      const finalUserResponse = {
          account_id: userProfile.account_id,
          email: userProfile.email,
          role: userProfile.role,
          full_name: userProfile.full_name,
          ...(role === 'attendee' && {
              balance: userProfile.balance,
              following_count: userProfile.following_count,
          }),
          ...(role === 'organizer' && {
              display_name: userProfile.display_name,
              bio: userProfile.bio,
              avg_rating: userProfile.avg_rating,
              followers_count: userProfile.followers_count,
          }),
      };


      res.status(200).json(finalUserResponse);

  } catch (error) {
      console.error('Get Current User Error:', error);
      next(error);
  }
};
