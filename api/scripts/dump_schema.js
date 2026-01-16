const fs = require('fs');
const path = require('path');

// Load env
try {
    const settingsPath = path.join(__dirname, '../local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load settings", e);
}

const { query } = require('../src/lib/db');

async function run() {
    try {
        const result = await query(`
            SELECT 
                t.TABLE_NAME,
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.CHARACTER_MAXIMUM_LENGTH,
                c.IS_NULLABLE,
                c.COLUMN_DEFAULT
            FROM 
                INFORMATION_SCHEMA.TABLES t
            INNER JOIN 
                INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
            WHERE 
                t.TABLE_TYPE = 'BASE TABLE'
            ORDER BY 
                t.TABLE_NAME, c.ORDINAL_POSITION
        `);

        // Group by table
        const tables = {};
        if (result && result.recordset) {
            result.recordset.forEach(row => {
                const tableName = row.TABLE_NAME;
                if (!tables[tableName]) {
                    tables[tableName] = [];
                }
                tables[tableName].push(row);
            });
        }

        // Output Markdown
        console.log("# Database Schema\n");
        for (const tableName in tables) {
            console.log(`## ${tableName}`);
            console.log("| Column | Type | Length | Nullable | Default |");
            console.log("|---|---|---|---|---|");
            tables[tableName].forEach(col => {
                const length = col.CHARACTER_MAXIMUM_LENGTH ? col.CHARACTER_MAXIMUM_LENGTH : '-';
                console.log(`| ${col.COLUMN_NAME} | ${col.DATA_TYPE} | ${length} | ${col.IS_NULLABLE} | ${col.COLUMN_DEFAULT || '-'} |`);
            });
            console.log("\n");
        }

        process.exit(0);
    } catch (e) {
        console.error("Error dumping schema:", e);
        process.exit(1);
    }
}

run();
