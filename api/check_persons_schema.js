const sql = require('mssql');

const config = {
    user: 'aero_admin',
    password: 'ZiJZ2SUjFBAWLeL',
    server: 'sql-aero-dev-jb.database.windows.net',
    database: 'sqldb-aero-dev',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function checkSchema() {
    try {
        await sql.connect(config);

        console.log("--- Persons Table Schema ---");
        const columns = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'persons'
        `;
        columns.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE}, Nullable: ${row.IS_NULLABLE})`));

        console.log("\n--- Checking for NULL Contact Details in Persons ---");
        const nullChecks = await sql.query`
            SELECT 
                COUNT(*) as TotalRows,
                SUM(CASE WHEN first_name IS NULL THEN 1 ELSE 0 END) as NullFirstName,
                SUM(CASE WHEN last_name IS NULL THEN 1 ELSE 0 END) as NullLastName,
                SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) as NullEmail,
                SUM(CASE WHEN phone_number IS NULL THEN 1 ELSE 0 END) as NullPhone,
                SUM(CASE WHEN address_line_1 IS NULL THEN 1 ELSE 0 END) as NullAddress,
                SUM(CASE WHEN city IS NULL THEN 1 ELSE 0 END) as NullCity,
                SUM(CASE WHEN state IS NULL THEN 1 ELSE 0 END) as NullState,
                SUM(CASE WHEN postcode IS NULL THEN 1 ELSE 0 END) as NullPostcode,
                SUM(CASE WHEN country IS NULL THEN 1 ELSE 0 END) as NullCountry,
                SUM(CASE WHEN emergency_contact_name IS NULL THEN 1 ELSE 0 END) as NullEmergName,
                SUM(CASE WHEN emergency_contact_phone IS NULL THEN 1 ELSE 0 END) as NullEmergPhone
            FROM persons
        `;

        console.log(nullChecks.recordset[0]);

        console.log("\n--- Attendees Table Schema ---");
        const checkoutColumns = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'attendees'
        `;
        checkoutColumns.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE}, Nullable: ${row.IS_NULLABLE})`));


    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkSchema();
