const { sql, query } = require('../../api/src/lib/db');
const bcrypt = require('bcryptjs');

async function createRealAdmin() {
    try {
        const email = 'admin@test.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Creating admin: ${email}`);

        // Check if exists
        const check = await query("SELECT admin_user_id FROM admin_users WHERE email = @email", [
            { name: 'email', type: sql.NVarChar, value: email }
        ]);

        if (check.length > 0) {
            console.log('Admin already exists.');
            return;
        }

        // Insert
        await query(`
            INSERT INTO admin_users (first_name, last_name, email, password_hash, role, is_active)
            VALUES ('Admin', 'User', @email, @hash, 'admin', 1)
        `, [
            { name: 'email', type: sql.NVarChar, value: email },
            { name: 'hash', type: sql.NVarChar, value: hashedPassword }
        ]);

        console.log('Admin user created successfully.');

    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

createRealAdmin();
