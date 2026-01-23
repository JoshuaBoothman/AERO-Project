const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');

app.http('recordPayment', {
    methods: ['POST'],
    route: 'orders/{orderId}/payments',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user || user.role !== 'admin') {
            return { status: 403, body: JSON.stringify({ error: "Unauthorized. Admin access required." }) };
        }

        const orderId = request.params.orderId;
        const { amount, date, reference, method } = await request.json();

        if (!amount || isNaN(amount) || amount <= 0) {
            return { status: 400, body: JSON.stringify({ error: "Invalid amount." }) };
        }

        try {
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 2. Validate Order Existence
                const orderCheck = await transaction.request()
                    .input('oid', sql.Int, orderId)
                    .query("SELECT total_amount FROM orders WHERE order_id = @oid");

                if (orderCheck.recordset.length === 0) {
                    throw new Error("Order not found.");
                }

                const totalOrderAmount = orderCheck.recordset[0].total_amount;

                // 3. Insert Transaction
                // use provided date or current time if missing (though UI should provide it)
                const paymentDate = date ? new Date(date) : new Date();

                await transaction.request()
                    .input('oid', sql.Int, orderId)
                    .input('amt', sql.Decimal(10, 2), amount)
                    .input('method', sql.VarChar, method || 'Direct Deposit')
                    .input('status', sql.VarChar, 'Success')
                    .input('ref', sql.VarChar, reference || null)
                    .input('pdate', sql.DateTime, paymentDate)
                    .query(`
                        INSERT INTO transactions (order_id, amount, payment_method, status, timestamp, reference, payment_date)
                        VALUES (@oid, @amt, @method, @status, GETUTCDATE(), @ref, @pdate)
                    `);

                // 4. Recalculate Total Paid
                const sumRes = await transaction.request()
                    .input('oid', sql.Int, orderId)
                    .query("SELECT SUM(amount) as total_paid FROM transactions WHERE order_id = @oid AND status = 'Success'");

                const totalPaid = sumRes.recordset[0].total_paid || 0;

                // 5. Determine New Status
                let newStatus = 'Pending';
                if (totalPaid >= totalOrderAmount) {
                    newStatus = 'Paid';
                } else if (totalPaid > 0) {
                    newStatus = 'Partially Paid';
                }

                // 6. Update Order
                await transaction.request()
                    .input('oid', sql.Int, orderId)
                    .input('paid', sql.Decimal(10, 2), totalPaid)
                    .input('status', sql.VarChar, newStatus)
                    .query("UPDATE orders SET amount_paid = @paid, payment_status = @status WHERE order_id = @oid");

                await transaction.commit();

                return {
                    status: 200,
                    body: JSON.stringify({
                        message: "Payment recorded successfully.",
                        newStatus,
                        totalPaid,
                        balance: totalOrderAmount - totalPaid
                    })
                };

            } catch (err) {
                await transaction.rollback();
                throw err;
            }

        } catch (error) {
            context.log(`Error recording payment: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
