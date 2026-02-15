const { app } = require('@azure/functions');
const { getPool, sql } = require('../lib/db');
const { validateToken } = require('../lib/auth');
const { SquareClient, SquareEnvironment } = require("square");
const { Resend } = require('resend');
const crypto = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Square Client
// Note: Ensure SQUARE_ACCESS_TOKEN and SQUARE_ENVIRONMENT are set in local.settings.json
const squareClient = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

app.http('processSquarePayment', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // 1. Auth Check
        const user = validateToken(request);
        if (!user) {
            return { status: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        try {
            const { orderId, sourceId } = await request.json();

            if (!orderId || !sourceId) {
                return { status: 400, body: JSON.stringify({ error: "Missing orderId or payment source (nonce)." }) };
            }

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 2. Validate Order & Get Amount
                const orderCheck = await transaction.request()
                    .input('oid', sql.Int, orderId)
                    .input('uid', sql.Int, user.userId) // Ensure user owns the order
                    .query("SELECT o.total_amount, o.payment_status, o.invoice_number, u.email FROM orders o JOIN users u ON o.user_id = u.user_id WHERE o.order_id = @oid AND o.user_id = @uid");

                if (orderCheck.recordset.length === 0) {
                    throw new Error("Order not found or access denied.");
                }

                const orderData = orderCheck.recordset[0];
                const amountToCharge = orderData.total_amount;

                if (orderData.payment_status === 'Paid') {
                    throw new Error("Order is already paid.");
                }

                if (amountToCharge <= 0) {
                    throw new Error("Invalid order amount.");
                }

                // 3. Process Payment with Square
                // Square requires amount in cents (BigInt)
                const amountCents = BigInt(Math.round(amountToCharge * 100));

                const response = await squareClient.payments.create({
                    sourceId: sourceId,
                    idempotencyKey: crypto.randomUUID(), // Unique ID for this specific attempt
                    amountMoney: {
                        amount: amountCents,
                        currency: 'AUD',
                    },
                    referenceId: orderData.invoice_number, // Shows on bank statement/receipt
                    note: `Order #${orderId} - ${orderData.invoice_number}`
                });

                const paymentResult = response.payment;

                // 4. Record Transaction in DB
                await transaction.request()
                    .input('oid', sql.Int, orderId)
                    .input('amt', sql.Decimal(10, 2), amountToCharge)
                    .input('method', sql.VarChar, 'Square') // Card brand (e.g. VISA) is in paymentResult.cardDetails.card.brand if needed
                    .input('status', sql.VarChar, 'Success')
                    .input('ref', sql.VarChar, paymentResult.id) // Store Square Payment ID
                    .input('pdate', sql.DateTime, new Date())
                    .query(`
                        INSERT INTO transactions (order_id, amount, payment_method, status, timestamp, reference, payment_date)
                        VALUES (@oid, @amt, @method, @status, GETUTCDATE(), @ref, @pdate)
                    `);

                // 5. Update Order Status
                await transaction.request()
                    .input('oid', sql.Int, orderId)
                    .input('paid', sql.Decimal(10, 2), amountToCharge)
                    .query("UPDATE orders SET amount_paid = @paid, payment_status = 'Paid' WHERE order_id = @oid");

                await transaction.commit();

                // 6. Send Receipt Email (Fail-Safe)
                try {
                    if (orderData.email) {
                        await resend.emails.send({
                            from: 'Aeromodelling <registrations@meandervalleywebdesign.com.au>',
                            to: orderData.email,
                            subject: `Payment Receipt: ${orderData.invoice_number}`,
                            html: `
                                <h1>Payment Received</h1>
                                <p>Thank you. We have received your payment of <strong>$${amountToCharge}</strong> via Credit Card.</p>
                                <p><strong>Order Status:</strong> Paid</p>
                                <p><strong>Invoice Number:</strong> ${orderData.invoice_number}</p>
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
                        message: "Payment successful",
                        paymentId: paymentResult.id,
                        status: paymentResult.status
                    })
                };

            } catch (err) {
                await transaction.rollback();
                // Check if it's a Square API error
                if (err.errors && err.errors.length > 0) {
                    const squareError = err.errors[0].detail || err.errors[0].category;
                    throw new Error(`Square Payment Failed: ${squareError}`);
                }
                throw err;
            }

        } catch (error) {
            context.log(`Error processing Square payment: ${error.message}`);
            return { status: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
});
