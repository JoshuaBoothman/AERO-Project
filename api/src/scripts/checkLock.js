process.env.SQL_CONNECTION_STRING = "Server=tcp:sql-aero-dev-jb.database.windows.net,1433;Initial Catalog=sqldb-aero-dev;Persist Security Info=False;User ID=aero_admin;Password=ZiJZ2SUjFBAWLeL;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";
const { query } = require('../lib/db');

async function check() {
    try {
        const res = await query("SELECT registration_lock_until FROM organization_settings");
        console.log("Result:", res);
        if (res.length > 0) {
            const val = res[0].registration_lock_until;
            console.log("Value:", val);
            console.log("Type:", typeof val);
            console.log("Is Date instance?", val instanceof Date);

            const lock = new Date(val);
            const now = new Date();
            console.log("Lock Date (parsed):", lock.toString());
            console.log("Now:", now.toString());
            console.log("Is Locked?", now < lock);
        }
    } catch (err) {
        console.error(err);
    }
}

check();
