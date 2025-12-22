const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, sql } = require('../lib/db');

// Use a fallback for dev, but ensure this is in your App Settings in Azure
const SECRET_KEY = process.env.JWT_SECRET || "dev-secret-key-change-me"; 

app.http('authLogin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { email, password } = await request.json();

            // 1. Fetch User
            const sqlQuery = "SELECT user_id, password_hash, first_name, last_name, role FROM users WHERE email = @email";
            // Note: 'role' isn't in your schema.sql for 'users', only 'admin_users'. 
            // If you want roles for public users, we need to add it. For now, we skip it.
            
            const result = await query("SELECT user_id, password_hash, first_name, last_name FROM users WHERE email = @email", [
                { name: 'email', type: sql.NVarChar, value: email }
            ]);

            if (result.length === 0) {
                return { status: 401, body: "Invalid credentials" };
            }

            const user = result[0];

            // 2. Compare Password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return { status: 401, body: "Invalid credentials" };
            }

            // 3. Generate Token
            const token = jwt.sign(
                { userId: user.user_id, email: user.email },
                SECRET_KEY,
                { expiresIn: '8h' }
            );

            // 4. Return Token & User Info (excluding hash)
            return {
                status: 200,
                body: JSON.stringify({
                    token,
                    user: {
                        id: user.user_id,
                        firstName: user.first_name,
                        lastName: user.last_name
                    }
                })
            };

        } catch (error) {
            context.log(`Error in authLogin: ${error.message}`);
            return { status: 500, body: "Internal Server Error" };
        }
    }
});