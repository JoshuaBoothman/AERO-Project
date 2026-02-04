import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth to access user/token

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const { user, token } = useAuth(); // Access auth state
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('cart');
            if (!saved) return [];

            const parsed = JSON.parse(saved);

            // Normalize cart items to ensure consistent structure
            return parsed.map(item => {
                // Normalize type to uppercase
                const normalizedType = (item.type || '').toUpperCase();

                // For campsite items, ensure all display properties exist
                if (normalizedType === 'CAMPSITE') {
                    return {
                        ...item,
                        type: 'CAMPSITE',
                        name: item.name || `Site ${item.site_number || item.campsiteId || 'Unknown'}`,
                        checkIn: item.checkIn || item.check_in_date,
                        checkOut: item.checkOut || item.check_out_date
                    };
                }

                return { ...item, type: normalizedType || item.type };
            });
        } catch (e) {
            console.error(e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Check for Legacy Bookings on Login
    useEffect(() => {
        const fetchLegacy = async () => {
            if (!user || !token) return;

            try {
                const res = await fetch('/api/getLegacyBookings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const legacyItems = await res.json();
                    if (legacyItems.length > 0) {
                        setCart(prev => {
                            const newCart = [...prev];
                            let changed = false;

                            legacyItems.forEach(item => {
                                // Check if already in cart (use uppercase for consistency)
                                const exists = newCart.find(c => c.type === 'CAMPSITE' && c.campsiteId === item.campsite_id);
                                if (!exists) {
                                    // Calculate Price (Basic approximation or use logic)
                                    // Logic: Nights * Daily
                                    const start = new Date(item.check_in_date);
                                    const end = new Date(item.check_out_date);
                                    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                                    const price = item.price_per_night * nights;
                                    // Note: Full Event Price logic is complex, stick to daily for default or check nights > 4
                                    // If nights > 4 && full_event_price exists, maybe use that?
                                    // For simplicity, let's trust the user will see generic price or calculated.
                                    // Let's use simple logic:
                                    let finalPrice = price;
                                    if (nights > 4 && item.full_event_price) {
                                        finalPrice = item.full_event_price;
                                    }

                                    newCart.push({
                                        type: 'CAMPSITE', // Must be uppercase for Checkout.jsx comparison
                                        id: item.campsite_id, // Checkout looks for .id for payload mapping
                                        name: `Site ${item.campsite_name}`, // Checkout displays .name
                                        campsiteId: item.campsite_id,
                                        site_number: item.site_number || item.campsite_name,
                                        checkIn: item.check_in_date,
                                        checkOut: item.check_out_date,
                                        price: finalPrice,
                                        eventId: item.event_id,
                                        eventName: item.event_name,
                                        adults: 1, // Default from legacy import
                                        children: 0,
                                        isLegacy: true // Mark as legacy
                                    });
                                    changed = true;
                                }
                            });

                            return changed ? newCart : prev;
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch legacy bookings", e);
            }
        };

        fetchLegacy();
    }, [user, token]); // Run when user/token changes


    const addToCart = (item) => {
        setCart(prev => [...prev, item]);
    };

    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);

    const cartItemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartItemCount }}>
            {children}
        </CartContext.Provider>
    );
}
