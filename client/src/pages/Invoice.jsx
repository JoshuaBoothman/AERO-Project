import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext'; // [NEW] Import Notification
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk'; // [NEW] Import Square SDK

// [NEW] Square Credentials
const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APP_ID;
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID;

function Invoice() {
    const { orderId } = useParams();
    const { token } = useAuth();
    const { notify } = useNotification(); // [NEW] Use Notification
    const [order, setOrder] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false); // [NEW] Payment Loading State
    const [error, setError] = useState(null);

    // [NEW] Fetch Data Function
    const fetchOrderData = async () => {
        try {
            // Fetch Order
            const ordRes = await fetch(`/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
            });
            if (!ordRes.ok) throw new Error("Order not found");
            const ordData = await ordRes.json();
            setOrder(ordData);

            // Fetch Org Settings (only need once really, but fine here)
            const orgRes = await fetch(`/api/getOrganization`);
            if (orgRes.ok) {
                const orgData = await orgRes.json();
                setOrganization(orgData);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderData();
    }, [orderId, token]);

    // [NEW] Handle Square Payment
    const handleSquarePayment = async (tokenResult) => {
        setPaymentLoading(true);
        try {
            const payRes = await fetch('/api/processSquarePayment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    orderId: order.order_id,
                    sourceId: tokenResult.token
                })
            });

            if (!payRes.ok) {
                const err = await payRes.json();
                notify(`Payment Failed: ${err.error}`, "error");
                return;
            }

            notify("Payment Successful! Invoice updated.", "success");
            // Reload order data to reflect payment
            setLoading(true); // Show main loading briefly or just re-fetch
            await fetchOrderData();

        } catch (e) {
            console.error(e);
            notify("Error processing payment: " + e.message, "error");
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading Invoice...</div>;
    if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
    if (!order) return null;

    const totalAmount = parseFloat(order.total_amount);
    const amountPaid = parseFloat(order.amount_paid);
    const balanceDue = totalAmount - amountPaid;
    const isPaid = balanceDue <= 0.01; // tolerance

    // Group items for display if needed, but linear list is fine for invoice usually.
    // Let's filter out $0 items that aren't merchandise/ticket placeholders if desired, 
    // but usually invoices show everything.

    return (
        <div className="bg-white min-h-screen p-8 text-black print:p-0">
            {/* Print Controls - Hidden on Print */}
            <div className="mb-8 print:hidden flex justify-end items-center max-w-4xl mx-auto">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                    Print Invoice
                </button>
            </div>

            {/* A4 Container */}
            <div className="max-w-4xl mx-auto bg-white border print:border-0 print:w-full p-12 print:p-0 shadow-lg print:shadow-none min-h-[1123px] relative">

                {/* Header */}
                <div className="flex justify-between items-start border-b pb-8 mb-8">
                    <div className="w-1/2">
                        {organization?.logo_url && (
                            <img src={organization.logo_url} alt="Logo" className="h-20 mb-4 object-contain" />
                        )}
                        <h1 className="text-2xl font-bold text-gray-800">{organization?.organization_name}</h1>
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                            {organization?.address_line_1 && <p>{organization.address_line_1}</p>}
                            {organization?.city && <p>{organization.city}, {organization.state} {organization.postcode}</p>}
                            {organization?.phone_number && <p>Phone: {organization.phone_number}</p>}
                            {organization?.support_email && <p>Email: {organization.support_email}</p>}
                            {/* ABN if we had it */}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-bold text-gray-200 mb-2 uppercase tracking-wide">
                            {isPaid ? 'Tax Invoice' : 'Invoice'}
                        </h2>
                        {isPaid && <div className="text-green-600 font-bold border-2 border-green-600 inline-block px-4 py-1 rounded rotate-[-10deg] opacity-80 mt-2">PAID</div>}
                        {!isPaid && amountPaid > 0 && <div className="text-orange-500 font-bold border-2 border-orange-500 inline-block px-4 py-1 rounded rotate-[-10deg] opacity-80 mt-2">PARTIALLY PAID</div>}

                        <div className="mt-6 text-sm">
                            <div className="flex justify-end gap-4 mb-1">
                                <span className="text-gray-500 font-medium">Invoice No:</span>
                                <span className="font-bold">{order.invoice_number || `INV-${order.order_id}`}</span>
                            </div>
                            <div className="flex justify-end gap-4 mb-1">
                                <span className="text-gray-500 font-medium">Date:</span>
                                <span>{new Date(order.order_date).toLocaleDateString('en-AU')}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-gray-500 font-medium">Order Ref:</span>
                                <span>#{order.order_id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-12">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                    <div className="text-gray-800">
                        {/* We use the first attendee/person if direct user address isn't stored on order directly (it's on persons) */}
                        <p className="font-bold">{order.items[0]?.first_name} {order.items[0]?.last_name}</p>
                        <p>{order.items[0]?.email}</p>
                        {/* Address from person if available */}
                        {/* This assumes the first item has the billing details which isn't always true but close enough for MVP */}
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 text-sm font-bold text-gray-600 uppercase">Description</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-600 uppercase w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {order.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className="py-3">
                                    <div className="flex items-center">
                                        {(item.quantity || 1) > 1 && (
                                            <span className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded text-xs mr-3">
                                                {item.quantity}x
                                            </span>
                                        )}
                                        <div className="font-medium">{item.item_name}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {item.item_type === 'Asset' ? (
                                            <div>
                                                {item.first_name} {item.last_name}
                                                {item.asset_start && item.asset_end && (
                                                    <span className="ml-2">
                                                        ({new Date(item.asset_start).toLocaleDateString()} - {new Date(item.asset_end).toLocaleDateString()})
                                                    </span>
                                                )}
                                                {item.asset_identifier && <span className="ml-2 font-mono">[{item.asset_identifier}]</span>}
                                            </div>
                                        ) : item.item_type === 'Subevent' && item.subevent_attendee_name ? (
                                            <span>
                                                {item.is_subevent_guest === 1 && <span className="font-semibold text-amber-600 mr-1">Guest:</span>}
                                                {item.subevent_attendee_name}
                                            </span>
                                        ) : (
                                            `${item.first_name || ''} ${item.last_name || ''}`
                                        )}
                                        {item.ticket_code && ` (${item.ticket_code})`}

                                        {/* Unit Price breakdown for quantity > 1 */}
                                        {(item.quantity || 1) > 1 && (
                                            <div className="text-gray-400 mt-1">
                                                {item.quantity} x ${parseFloat(item.price_at_purchase).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="text-right py-3 align-top">
                                    ${(parseFloat(item.price_at_purchase) * (item.quantity || 1)).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span>${totalAmount.toFixed(2)}</span>
                        </div>
                        {/* Tax logic here if needed, assuming inclusive for now */}
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total</span>
                            <span>${totalAmount.toFixed(2)}</span>
                        </div>

                        {amountPaid > 0 && (
                            <div className="flex justify-between text-sm text-gray-600 border-t pt-2 mt-2">
                                <span>Less Amount Paid</span>
                                <span>- ${amountPaid.toFixed(2)}</span>
                            </div>
                        )}

                        <div className={`flex justify-between text-lg font-bold border-t border-b py-2 ${balanceDue > 0.01 ? 'text-red-600 bg-red-50 px-2' : 'text-green-600'}`}>
                            <span>Balance Due</span>
                            <span>${balanceDue > 0 ? balanceDue.toFixed(2) : '0.00'}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Section (Square) */}
                {balanceDue > 0.01 && (
                    <div className="mb-8 break-inside-avoid print:hidden">
                        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm max-w-md mx-auto">
                            <h3 className="font-bold text-gray-800 mb-4 text-center">Pay Balance Online</h3>
                            <PaymentForm
                                applicationId={SQUARE_APP_ID}
                                locationId={SQUARE_LOCATION_ID}
                                cardTokenizeResponseReceived={handleSquarePayment}
                            >
                                <CreditCard
                                    buttonProps={{
                                        css: {
                                            backgroundColor: '#0055AA',
                                            color: '#fff',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            padding: '16px',
                                            borderRadius: '8px',
                                        }
                                    }}
                                >
                                    {paymentLoading ? 'Processing Payment...' : `Pay $${balanceDue.toFixed(2)}`}
                                </CreditCard>
                            </PaymentForm>
                        </div>
                    </div>
                )}

                {/* Bank Details (If unpaid) */}
                {balanceDue > 0.01 && (
                    <div className="bg-gray-50 p-6 rounded border border-gray-200 break-inside-avoid">
                        <h3 className="font-bold text-gray-800 mb-4">Payment Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Bank Name</p>
                                <p className="font-medium">{organization?.bank_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Account Name</p>
                                <p className="font-medium">{organization?.bank_account_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">BSB</p>
                                <p className="font-medium font-mono">{organization?.bank_bsb || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Account Number</p>
                                <p className="font-medium font-mono">{organization?.bank_account_number || 'N/A'}</p>
                            </div>
                            <div className="col-span-2 mt-2 pt-2 border-t">
                                <p className="text-gray-500 mb-1">Payment Reference (Required)</p>
                                <p className="font-bold text-lg">
                                    {order.invoice_number || `INV-${new Date(order.order_date).getFullYear()}-${order.order_id}`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="absolute bottom-12 left-0 right-0 text-center text-sm text-gray-500 print:bottom-8">
                    <p>Thank you for your support!</p>
                </div>

            </div>
        </div>
    );
}

export default Invoice;
