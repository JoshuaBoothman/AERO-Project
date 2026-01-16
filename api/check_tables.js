const { query } = require('./src/lib/db');

async function run() {
    try {
        const tables = await query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        console.log("Tables:", tables.map(t => t.TABLE_NAME));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
