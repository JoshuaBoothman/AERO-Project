const { getPool } = require('../src/lib/db');

(async () => {
    try {
        const pool = await getPool();
        const res = await pool.request().query("SELECT TOP 0 * FROM asset_hires");
        console.log("Columns:", Object.keys(res.recordset.columns));
    } catch (e) {
        console.error(e);
    }
})();
