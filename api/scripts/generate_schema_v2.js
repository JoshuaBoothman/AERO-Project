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

async function generateSchema() {
    try {
        console.log("-- Automating Schema Generation from Live Database --");

        // 1. Get all user tables
        const tables = await query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            AND TABLE_NAME NOT IN ('sysdiagrams')
            ORDER BY TABLE_NAME
        `);

        let sqlOutput = "-- AERO-Project Consolidated Schema\n";
        sqlOutput += `-- Generated on: ${new Date().toISOString()}\n\n`;

        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            sqlOutput += `-- Table: ${tableName}\n`;
            sqlOutput += `IF OBJECT_ID('${tableName}', 'U') IS NULL\nBEGIN\n    CREATE TABLE ${tableName} (\n`;

            const columns = await query(`
                SELECT 
                    COLUMN_NAME, 
                    DATA_TYPE, 
                    CHARACTER_MAXIMUM_LENGTH, 
                    IS_NULLABLE, 
                    COLUMN_DEFAULT,
                    (SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = @tableName AND COLUMN_NAME = COLUMNS.COLUMN_NAME AND CONSTRAINT_NAME LIKE 'PK%') as is_pk,
                    (SELECT 1 FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id WHERE t.name = @tableName AND c.name = COLUMNS.COLUMN_NAME AND c.is_identity = 1) as is_identity
                FROM INFORMATION_SCHEMA.COLUMNS AS COLUMNS
                WHERE TABLE_NAME = @tableName
                ORDER BY ORDINAL_POSITION
            `, [{ name: 'tableName', type: require('mssql').NVarChar, value: tableName }]);

            const colDefs = columns.map(col => {
                let def = `        ${col.COLUMN_NAME} ${col.DATA_TYPE}`;
                if (col.CHARACTER_MAXIMUM_LENGTH) {
                    def += `(${col.CHARACTER_MAXIMUM_LENGTH === -1 ? 'MAX' : col.CHARACTER_MAXIMUM_LENGTH})`;
                }
                if (col.is_identity) def += " IDENTITY(1,1)";
                if (col.is_pk) def += " PRIMARY KEY";
                if (col.IS_NULLABLE === 'NO') def += " NOT NULL";
                if (col.COLUMN_DEFAULT) def += ` DEFAULT ${col.COLUMN_DEFAULT}`;
                return def;
            });

            sqlOutput += colDefs.join(",\n");
            sqlOutput += "\n    );\nEND\nGO\n\n";
        }

        const outputPath = path.join(__dirname, 'api/scripts/generated_schema.sql');
        fs.writeFileSync(outputPath, sqlOutput);
        console.log(`Schema saved to: ${outputPath}`);

    } catch (err) {
        console.error("Error generating schema:", err);
    } finally {
        process.exit();
    }
}

generateSchema();
