const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const { query, sql } = require('../lib/db');

app.http('authRegister', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { email, password, firstName, lastName } = await request.json();

            if (!email || !password || !firstName || !lastName) {
                return { status: 400, body: "Missing required fields." };
            }

            // 1. Check if user exists
            const checkQuery = "SELECT user_id FROM users WHERE email = @email";
            const existingUser = await query(checkQuery, [
                { name: 'email', type: sql.NVarChar, value: email }
            ]);

            if (existingUser.length > 0) {
                return { status: 409, body: "Email already registered." };
            }

            // 2. Hash Password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // 3. Insert User
            const insertQuery = `
                INSERT INTO users (email, password_hash, first_name, last_name, is_email_verified)
                VALUES (@email, @hash, @first, @last, 0)
            `;
            
            await query(insertQuery, [
                { name: 'email', type: sql.NVarChar, value: email },
                { name: 'hash', type: sql.NVarChar, value: passwordHash },
                { name: 'first', type: sql.NVarChar, value: firstName },
                { name: 'last', type: sql.NVarChar, value: lastName }
            ]);

            return { status: 201, body: JSON.stringify({ message: "User created successfully" }) };

        } catch (error) {
            context.log(`Error in authRegister: ${error.message}`);
            return { status: 500, body: "Internal Server Error" };
        }
    }
});