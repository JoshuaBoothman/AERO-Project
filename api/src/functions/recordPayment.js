const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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
                // 2. Validate Order Existence & Get Details
                const orderCheck = await transaction.request()
                    .input('oid', sql.Int, orderId)
                    .query("SELECT o.total_amount, o.invoice_number, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.user_id WHERE o.order_id = @oid");

                if (orderCheck.recordset.length === 0) {
                    throw new Error("Order not found.");
                }

                const orderData = orderCheck.recordset[0];
                const totalOrderAmount = orderData.total_amount;

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

                // 7. Send Receipt Email (Fail-Safe)
                try {
                    if (orderData.customer_email) {
                        await resend.emails.send({
                            from: 'Aeromodelling <registrations@meandervalleywebdesign.com.au>',
                            to: orderData.customer_email,
                            subject: `Payment Receipt: ${orderData.invoice_number}`,
                            html: `
                                <h1>Payment Recorded</h1>
                                <p>Thank you. We have received your payment of <strong>$${amount}</strong> via ${method || 'Direct Deposit'}.</p>
                                <p><strong>New Status:</strong> ${newStatus}</p>
                                <p><strong>Invoice Number:</strong> ${orderData.invoice_number}</p>
                                <p><strong>Remaining Balance:</strong> $${totalOrderAmount - totalPaid}</p>
                            `
                        });
                    }
                } catch (emailError) {
                    context.log(`Failed to send receipt email for order ${orderId}: ${emailError.message}`);
                    // Swallow error so API response still succeeds
                }

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
