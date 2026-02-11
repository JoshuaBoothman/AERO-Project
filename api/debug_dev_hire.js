const sql = require('mssql');
const fs = require('fs');

const config = "Server=tcp:sql-aero-dev-jb.database.windows.net,1433;Initial Catalog=sqldb-aero-dev;Persist Security Info=False;User ID=aero_admin;Password=ZiJZ2SUjFBAWLeL;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";

async function run() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        let output = '';

        console.log('Fetching asset hires...');
        const h = await pool.request().query('SELECT * FROM asset_hires ORDER BY asset_hire_id DESC');
        output += '--- ASSET HIRES ---\n' + JSON.stringify(h.recordset, null, 2) + '\n';

        if (h.recordset.length > 0) {
            const lastOrderItemId = h.recordset[0].order_item_id;
            const orderInfo = await pool.request()
                .input('oiid', sql.Int, lastOrderItemId)
                .query('SELECT order_id FROM order_items WHERE order_item_id = @oiid');

            if (orderInfo.recordset.length > 0) {
                const oid = orderInfo.recordset[0].order_id;
                output += `\n--- DETAILS FOR ORDER #${oid} ---\n`;

                const p = await pool.request()
                    .input('oid', sql.Int, oid)
                    .query(`
                        SELECT p.person_id, p.user_id, p.first_name, p.last_name 
                        FROM persons p 
                        JOIN orders o ON p.user_id = o.user_id 
                        WHERE o.order_id = @oid
                    `);
                output += 'Persons linked to this order user:\n' + JSON.stringify(p.recordset, null, 2) + '\n';

                const apiQuery = await pool.request()
                    .input('oid', sql.Int, oid)
                    .query(`
                        SELECT 
                            ah.asset_hire_id,
                            p.first_name + ' ' + p.last_name as hirer_name
                        FROM asset_hires ah
                        JOIN order_items oi ON ah.order_item_id = oi.order_item_id
                        JOIN orders o ON oi.order_id = o.order_id
                        LEFT JOIN persons p ON o.user_id = p.user_id
                        WHERE o.order_id = @oid
                    `);
                output += '\nRows returned by API query for this order:\n' + JSON.stringify(apiQuery.recordset, null, 2) + '\n';
            }
        }

        fs.writeFileSync('debug_output.txt', output);
        console.log('Results written to debug_output.txt');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

run();
