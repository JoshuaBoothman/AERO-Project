const fs = require('fs');
const path = require('path');

async function checkRoles() {
    try {
        const settingsPath = path.join(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }

        const { query } = require('../src/lib/db');

        console.log("Checking distinct system_roles...");
        const roles = await query("SELECT DISTINCT system_role FROM event_ticket_types");
        console.table(roles);

        console.log("Checking CHECK constraints on event_ticket_types...");
        const constraints = await query(`
            SELECT name, definition 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('event_ticket_types')
        `);
        console.table(constraints);

    } catch (e) {
        console.error(e);
    }
}
checkRoles();
