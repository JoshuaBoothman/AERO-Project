const fs = require('fs');
const path = require('path');

// Load environment variables from local.settings.json
try {
    const settingsPath = path.join(__dirname, '../local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load settings:", e.message);
}

const { query } = require('../src/lib/db');

async function run() {
    try {
        console.log("Ensuring Schema (Consolidated Fresh Start)...");

        const schemaSql = fs.readFileSync(path.join(__dirname, 'generated_schema.sql'), 'utf8');

        // Split by GO and filter out empty strings
        const statements = schemaSql.split(/\bGO\b/i).map(s => s.trim()).filter(s => s.length > 0);

        console.log(`Executing ${statements.length} schema segments...`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            // Extract table name for logging if possible
            const match = stmt.match(/IF OBJECT_ID\('([^']+)'/);
            const tableName = match ? match[1] : `Segment ${i + 1}`;

            console.log(`[${i + 1}/${statements.length}] Ensuring table: ${tableName}`);
            await query(stmt);
        }

        console.log("Schema synchronization complete.");
        process.exit(0);
    } catch (e) {
        console.error("Schema sync failed:", e);
        process.exit(1);
    }
}

run();
