const fetch = require('node-fetch');

async function registerUser(email, password, first, last) {
    try {
        const res = await fetch('http://localhost:5173/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                firstName: first,
                lastName: last
            })
        });

        if (res.ok) {
            console.log(`Success: Created ${email}`);
        } else if (res.status === 409) {
            console.log(`Info: User ${email} already exists.`);
        } else {
            console.error(`Error creating ${email}:`, await res.text());
        }
    } catch (e) {
        console.error(`Network Error for ${email}:`, e.message);
    }
}

async function main() {
    console.log('Creating Test Users...');
    // "Admin" User (Functionally same as regular for now, but used for Admin Tool test)
    await registerUser('admin@test.com', 'admin123', 'Adam', 'Admin');

    // Regular Camper
    await registerUser('camper@test.com', 'camper123', 'Chris', 'Camper');

    console.log('Done.');
}

main();
