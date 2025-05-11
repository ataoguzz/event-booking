import bcryptjs from "bcryptjs";
import generateRandomPassword from "../utils/password-generator.js";
import { query } from "../utils/db.js";



export const getUserInfo = async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await query('SELECT * FROM "User" WHERE "userID" = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];

        const userInfo = {
            userId: user.userID,
            email: user.email,
            phoneNumber: user.phoneNumber
        };

        return res.status(200).json({
            user: userInfo
        });

    } catch (error) {
        console.error('Error in getUserInfo:', error);
        return res.status(500).json({ error: "Failed to fetch user information" });
    }
};

export const getUserList = async (req, res) => {
    try {
        const result = await query('SELECT "userID", "email", "phoneNumber", "createdAt", "updatedAt" FROM "User"');
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error in getUserList:', error);
        return res.status(500).json({error: "Failed to fetch user list"});
    }
}

export const changeInformation = async (req, res) => {
    const userId = req.params.id;
    const { email, phoneNumber } = req.body;

    try {
        if (!email && !phoneNumber) {
            return res.status(400).json({ message: "No valid fields provided for update." });
        }

        if (email) {
            const existingUserResult = await query(
                'SELECT * FROM "User" WHERE "email" = $1 AND "userID" != $2',
                [email, userId]
            );

            if (existingUserResult.rows.length > 0) {
                return res.status(400).json({ message: "Email is already in use by another account." });
            }
        }

        let updateQuery = 'UPDATE "User" SET ';
        const queryParams = [];
        const updateFields = [];

        if (email) {
            queryParams.push(email);
            updateFields.push(`"email" = $${queryParams.length}`);
        }

        if (phoneNumber) {
            queryParams.push(phoneNumber);
            updateFields.push(`"phoneNumber" = $${queryParams.length}`);
        }

        updateQuery += updateFields.join(', ');
        queryParams.push(userId);
        updateQuery += ` WHERE "userID" = $${queryParams.length} RETURNING *`;

        const result = await query(updateQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({ 
            message: "User updated successfully", 
            user: {
                userId: result.rows[0].userID,
                email: result.rows[0].email,
                phoneNumber: result.rows[0].phoneNumber
            }
        });
    } catch (error) {
        console.error('Error in changeInformation:', error);
        return res.status(500).json({ message: `Failed to update user information: ${error.message}` });
    }
};

export const createUser = async (req, res) => {
    const { email, phoneNumber } = req.body;

    try {
        const existingUserResult = await query('SELECT * FROM "User" WHERE "email" = $1', [email]);

        if (existingUserResult.rows.length > 0) {
            return res.status(401).json({message: "User already exists with given email."});
        }

        const password = generateRandomPassword();
        const hashedPassword = await bcryptjs.hash(password, 12);

        const result = await query(
            'INSERT INTO "User" ("email", "password", "phoneNumber") VALUES ($1, $2, $3) RETURNING *',
            [email, hashedPassword, phoneNumber]
        );

        const createdUser = result.rows[0];

        // Return the generated password in the response instead of sending an email
        return res.status(200).json({
            message: "User created successfully", 
            data: createdUser.userID,
            temporaryPassword: password // Include the generated password in the response
        });

    } catch (error) {
        console.error('Error in createUser:', error);
        return res.status(400).json({error: error.message});
    }
}


export const deleteAccount = async (req, res) => {
    const userId = req.params.id;

    try {
        const userResult = await query('SELECT * FROM "User" WHERE "userID" = $1', [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({error: "Could not find user"});
        }

        await query('DELETE FROM "Token" WHERE "userId" = $1', [userId]);

        await query('DELETE FROM "User" WHERE "userID" = $1', [userId]);

        return res.status(200).json({message: "Deleted successfully"});
    } catch (error) {
        console.error('Error in deleteAccount:', error);
        return res.status(500).json({error: "An error occurred while deleting the account"});
    }
}
