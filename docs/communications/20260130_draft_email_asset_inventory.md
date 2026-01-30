# Draft Email to Dave & Gemma

**Subject**: Re: Asset Inventory and Hiring Logic

Hi Dave/Gemma,

Thanks for the clarification. You are absolutely right—the current system was a bit too rigid by requiring us to create (and book) specific "Golf Cart #1", "Golf Cart #2", etc. upfront.

The solution is exactly what Dave suggested: adding a simple "Quantity" field to the Asset Categories (e.g., "Golf Carts").

**How it will work:**
1.  **Booking**: We set "Golf Carts" to have a stock of 10. When someone books, they just book "A Golf Cart". The system automatically ensures we don't exceed 10 bookings per day. This makes the "Stock/Inventory" tab much easier to manage—you just update one number.
2.  **Tracking**: We **do not lose** the ability to track specific items. We will keep the underlying list of individual carts (Asset IDs/Serial Numbers) in the system.
3.  **Assignment**: When a user picks up their cart, or before the event, you can "Assign" a specific cart (e.g., "Golf Cart #4") to their booking in the Admin system. This gives you the best of both worlds: simple booking for the user/admin setup, but full tracking accountability for who had which unit.

All existing bookings that were made incorrectly (where users booked the same cart) can be easily migrated to this new "Pooled" system without losing any data.

I'll proceed with this update now. It will require a small database alignment but will make the Asset Management much smoother.


**Update (31/01/2026): The New System is Live**

I have just deployed the new "Pooled Inventory" system. Here is how it connects:

1.  **Stock Quantity (The Limit):** The "Asset Types" page now has a `Stock Quantity` field (e.g., 7). This is the **primary** number the system uses.
    *   *Availability* = `Stock Quantity` - `Active Bookings for those dates`.
    *   The system ignores how many individual items are in the "Inventory" tab for booking purposes.

2.  **Inventory Tab (Optional Tracking):** The "Inventory" tab is now purely for your internal tracking of specific physical assets (e.g., recording serial numbers or damage on "Golf Cart #3").
    *   You do **not** need to create 7 items in the Inventory tab to have 7 available to hire.
    *   You can leave the Inventory tab empty if you don't care about tracking specific unit identities yet.

**Example Scenario:**
*   You set "Golf Cart" Stock to **7** on the Asset Types page.
*   The Inventory tab has **1** item (or even 0).
*   A user searches for a Golf Cart.
*   The system sees you have **7** total, and 0 booked. It confirms availability.
*   The user books it. You now have **6** available for those dates.

This separates the "Sales" availability from the "Operational" asset tracking, making it much easier to manage.

Cheers,
Josh
