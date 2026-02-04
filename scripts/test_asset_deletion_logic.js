const fs = require('fs');
const path = require('path');

// 1. Load Environment (Must be done BEFORE requiring db.js)
const settingsPath = path.join(__dirname, '../api/local.settings.json');
try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
    // Also need API_URL if defined, else default
    process.env.API_URL = "http://localhost:7071/api";
} catch (e) {
    console.error("Could not load local.settings.json", e);
    process.exit(1);
}

const { sql, getPool } = require('../api/src/lib/db');

async function callApi(method, endpoint) {
    try {
        const res = await fetch(`${process.env.API_URL}${endpoint}`, { method });
        return { status: res.status, body: await res.json().catch(() => ({})) };
    } catch (e) {
        if (e.cause && e.cause.code === 'ECONNREFUSED') {
            return { error: 'ECONNREFUSED' };
        }
        throw e;
    }
}

async function run() {
    const pool = await getPool();
    console.log("--- Starting Asset Deletion Logic Test ---");

    // DEBUG: Identify required columns (Short version)
    // const schemaRes = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'attendees' AND IS_NULLABLE = 'NO' AND COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 0");
    // console.log("Required Columns:", schemaRes.recordset.map(r => r.COLUMN_NAME).join(', '));

    let typeId, itemAId, itemBId;

    try {
        // 2. Setup Test Data
        console.log("Setting up test data...");

        // Create Type
        const typeRes = await pool.request()
            .input('name', sql.NVarChar, 'TEST_DELETE_TYPE')
            .query("INSERT INTO asset_types (name, description) OUTPUT INSERTED.asset_type_id VALUES (@name, 'Test Type')");
        typeId = typeRes.recordset[0].asset_type_id;

        // Create Item A (No History)
        const itemARes = await pool.request()
            .input('typeId', sql.Int, typeId)
            .input('ident', sql.NVarChar, 'TEST-DEL-A')
            .query("INSERT INTO asset_items (asset_type_id, identifier, status) OUTPUT INSERTED.asset_item_id VALUES (@typeId, @ident, 'Active')");
        itemAId = itemARes.recordset[0].asset_item_id;

        // Create Item B (With History)
        const itemBRes = await pool.request()
            .input('typeId', sql.Int, typeId)
            .input('ident', sql.NVarChar, 'TEST-DEL-B')
            .query("INSERT INTO asset_items (asset_type_id, identifier, status) OUTPUT INSERTED.asset_item_id VALUES (@typeId, @ident, 'Active')");
        itemBId = itemBRes.recordset[0].asset_item_id;

        // Create Hire for B (Mock) - Robust dependency chain
        console.log("Creating/Fetching dependencies for Hire...");

        // 1. Event
        const evRes = await pool.request().query("SELECT TOP 1 event_id FROM events");
        const eventId = evRes.recordset[0] ? evRes.recordset[0].event_id : 1;

        // 2. Ticket Type
        const ttRes = await pool.request().query("SELECT TOP 1 event_ticket_type_id FROM event_ticket_types");
        const ticketTypeId = ttRes.recordset[0] ? ttRes.recordset[0].event_ticket_type_id : 1;

        // 3. Person
        const pRes = await pool.request().query("SELECT TOP 1 person_id FROM persons");
        let personId = pRes.recordset.length > 0 ? pRes.recordset[0].person_id : null;

        if (!personId) {
            console.log("Creating new Person...");
            const emailP = `person${Date.now()}@test.com`;
            const insP = await pool.request()
                .input('email', sql.NVarChar, emailP)
                .query("INSERT INTO persons (first_name, last_name, email) OUTPUT INSERTED.person_id VALUES ('Test', 'Person', @email)");
            personId = insP.recordset[0].person_id;
        }

        // 4. Attendee
        console.log(`Creating Attendee using: Person=${personId}, Event=${eventId}, TicketType=${ticketTypeId}`);

        const insRes = await pool.request()
            .input('pid', sql.Int, personId)
            .input('eid', sql.Int, eventId)
            .input('tid', sql.Int, ticketTypeId)
            .query("INSERT INTO attendees (person_id, event_id, ticket_type_id, status) OUTPUT INSERTED.attendee_id VALUES (@pid, @eid, @tid, 'Active')");

        const attendeeId = insRes.recordset[0].attendee_id;
        if (!attendeeId) throw new Error("Failed to create attendee");

        await pool.request()
            .input('itemId', sql.Int, itemBId)
            .input('attId', sql.Int, attendeeId)
            .query("INSERT INTO asset_hires (asset_item_id, attendee_id, hired_at, due_at, status) VALUES (@itemId, @attId, GETDATE(), GETDATE(), 'Active')");

        console.log(`Test Data Created: Type=${typeId}, ItemA=${itemAId}, ItemB=${itemBId} (With Hire)`);

        // 3. Test DELETE API
        console.log("\n--- Testing API ---");

        // Test A (Hard Delete)
        console.log(`Deleting Item A (${itemAId}) - Expecting Hard Delete...`);
        const resA = await callApi('DELETE', `/assets/items/${itemAId}`);
        if (resA.error === 'ECONNREFUSED') {
            console.error("!! CRITICAL: API is NOT running on localhost:7071. Cannot verify API logic. !!");
            console.error("Please run 'func start' in /api folder and retry.");
            // We can't proceed with API tests
        } else {
            console.log(`Response: ${resA.status}`, resA.body);

            // Test B (Soft Delete)
            console.log(`Deleting Item B (${itemBId}) - Expecting Soft Delete...`);
            const resB = await callApi('DELETE', `/assets/items/${itemBId}`);
            console.log(`Response: ${resB.status}`, resB.body);

            // 4. Verify DB State
            console.log("\n--- Verifying DB State ---");
            const finalCheck = await pool.request()
                .input('idA', sql.Int, itemAId)
                .input('idB', sql.Int, itemBId)
                .query(`
                    SELECT asset_item_id, identifier, status FROM asset_items WHERE asset_item_id IN (@idA, @idB)
                `);

            const rowA = finalCheck.recordset.find(r => r.asset_item_id === itemAId);
            const rowB = finalCheck.recordset.find(r => r.asset_item_id === itemBId);

            if (!rowA) console.log("SUCCESS: Item A was hard deleted (not found in DB).");
            else console.error("FAILURE: Item A still exists!", rowA);

            if (rowB && rowB.status === 'Deleted') console.log("SUCCESS: Item B is present with status 'Deleted'.");
            else console.error("FAILURE: Item B status incorrect or missing!", rowB);

            // 5. Test GET API Filtering
            console.log("\n--- Testing GET filtering ---");
            const getRes = await callApi('GET', `/assets/items?typeId=${typeId}`);
            if (getRes.body && Array.isArray(getRes.body)) {
                const foundB = getRes.body.find(i => i.asset_item_id === itemBId);
                if (!foundB) console.log("SUCCESS: Item B not returned in GET list.");
                else console.error("FAILURE: Item B returned in GET list!", foundB);
            }
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        // 6. Cleanup
        console.log("\n--- Cleaning Up ---");
        try {
            if (itemBId) await pool.request().input('id', sql.Int, itemBId).query("DELETE FROM asset_hires WHERE asset_item_id = @id");
            if (typeId) {
                await pool.request().input('typeId', sql.Int, typeId).query("DELETE FROM asset_items WHERE asset_type_id = @typeId");
                await pool.request().input('typeId', sql.Int, typeId).query("DELETE FROM asset_types WHERE asset_type_id = @typeId");
            }
            // Clean created person/attendee? Too complex to track.
            console.log("Cleanup Complete.");
        } catch (cleanupErr) {
            console.error("Error during cleanup:", cleanupErr);
        }
        process.exit(0);
    }
}

run();
