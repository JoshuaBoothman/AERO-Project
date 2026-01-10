# Merchandise Implementation Plan

## Goal Description
Enable a comprehensive system for selling merchandise for events. This includes a full Admin workflow for managing products, variants (e.g., Size, Color), and event-specific pricing, as well as the User workflow for browsing and purchasing items.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: `order_items`.`attendee_id` must be made **NULLable** to support merchandise items that are not linked to a specific attendee ticket.

## Proposed Changes

### Database Schema
#### [MODIFY] Database Schema
-   **`order_items`**: Change `attendee_id` to `[int] NULL`.
- Instruct user how to make this change

### Admin Workflow (Backend & Frontend)
1.  **Product Management**
    -   **API**:
        -   `POST /api/admin/products`: Create generic product (Name, Description, Base Image).
        -   `PUT /api/admin/products/{id}`: Update details.
        -   *Note: Images to be uploaded via existing `uploadImage` utility and URL stored.*
    -   **Frontend**: Admin > Global Settings > Products (New Section).

2.  **Variant Management**
    -   **API**:
        -   `POST /api/admin/products/{id}/variants`: Define categories (e.g., "Size") and options (e.g., "S", "M", "L").
        -   Support attaching images to specific variant options (e.g., "Blue" shirt image).
    -   **Frontend**: Interface to add Variant Categories and Options to a Product.

3.  **SKU Generation**
    -   **API**:
        -   `POST /api/admin/products/{id}/skus/generate`: Auto-generate SKUs for all variant combinations.
        -   `GET /api/admin/products/{id}/skus`: List generated SKUs.
    -   **Frontend**: Table showing all combinations. Allow manual override of SKU codes/Barcodes.

4.  **Event Pricing (Merchandise Assignment)**
    -   **API**:
        -   `POST /api/admin/events/{eventId}/merchandise`: Link Product SKUs to an Event and set the **Price**.
        -   Inserts into `event_skus` table.
    -   **Frontend**: Admin > Event > Merchandise Tab. Select Products, toggle specific SKUs, set Price.

### User Workflow (Frontend & Backend)
1.  **Browse Merchandise**
    -   **API**: `GET /api/events/{id}/merchandise` (Returns products with consolidated Price range and Options).
    -   **Frontend**: User Booking Flow > "Add Extras" step (or separate Merchandise tab).
    -   *UI*: Product Cards -> Click to view Details -> Select Options (Color/Size) -> Update Image based on selection -> Add to Cart.

2.  **Purchase (Checkout)**
    -   **API**: `createOrder` (Updated).
        -   Accept `merchandise` items in payload.
        -   Validate stock (if tracked) and active status.
        -   Create `order_items` with `item_type='Merchandise'` and `attendee_id=NULL`.
    -   **Frontend**: Cart Summary lists merch items separately from Tickets/Camping.

## Implementation Steps
1.  **Schema Update**: Apply `ALTER TABLE` for `order_items`.
2.  **Admin API**: Build Product/Variant/SKU endpoints.
3.  **Admin UI**: Build Product Manager & Event Linker.
4.  **User API**: `getEventMerchandise` & update `createOrder`.
5.  **User UI**: Merchandise Storefront & Cart update.

## Verification Plan
### Automated Tests
-   **Admin Flow**: Create Product -> Add Variants -> Generate SKUs -> Link to Event.
-   **User Flow**: Fetch Event Merch -> Add to Cart -> Checkout -> Verify Order Item created with NULL attendee.

### Manual Verification
-   **images**: Upload base product image and variant-specific images (e.g., Blue shirt). Verify switching options in User UI changes the displayed image.
