const { getPool } = require('../src/lib/db');

(async () => {
    try {
        const pool = await getPool();
        // Check Users
        const usersRes = await pool.request().query("SELECT TOP 0 * FROM users");
        console.log("Users Columns: ", Object.keys(usersRes.recordset.columns).join(', '));

        // Check Orders
        const ordersRes = await pool.request().query("SELECT TOP 0 * FROM orders");
        console.log("Orders Columns: ", Object.keys(ordersRes.recordset.columns).join(', '));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
