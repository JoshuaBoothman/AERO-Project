import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Invoice() {
    const { orderId } = useParams();
    const { token } = useAuth();
    const [order, setOrder] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Order
                const ordRes = await fetch(`/api/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token }
                });
                if (!ordRes.ok) throw new Error("Order not found");
                const ordData = await ordRes.json();
                setOrder(ordData);

                // Fetch Org Settings
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
        fetchData();
    }, [orderId, token]);

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
                                    <div className="font-medium">{item.item_name}</div>
                                    <div className="text-xs text-gray-500">
                                        {item.item_type} &bull; {item.first_name} {item.last_name}
                                        {item.ticket_code && ` (${item.ticket_code})`}
                                    </div>
                                </td>
                                <td className="text-right py-3">
                                    ${parseFloat(item.price_at_purchase).toFixed(2)}
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
