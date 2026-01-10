const fs = require('fs');
const path = require('path');

try {
    const settingsPath = path.join(__dirname, '../local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load local.settings.json", e);
}

const { sql, query } = require('../src/lib/db');

async function checkFK() {
    try {
        const res = await query(`
            SELECT TableName = t.name, ColumnName = c.name 
            FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id 
            WHERE t.name IN ('campsites')
        `);
        console.log(JSON.stringify(res, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkFK();
