const fs = require('fs');
const path = require('path');

// Load env
try {
    const settingsPath = path.join(__dirname, '../local.settings.json');
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.Values && settings.Values.SQL_CONNECTION_STRING) {
            process.env.SQL_CONNECTION_STRING = settings.Values.SQL_CONNECTION_STRING;
        }
    }
} catch (e) {
    console.warn("Could not load settings", e);
}

const { query } = require('../src/lib/db');

async function run() {
    try {
        console.log("Ensuring Schema...");

        // Venues
        await query(`IF OBJECT_ID('venues', 'U') IS NULL CREATE TABLE venues (
            venue_id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(255),
            address NVARCHAR(MAX),
            capacity INT
        )`);

        // Events
        await query(`IF OBJECT_ID('events', 'U') IS NULL CREATE TABLE events (
            event_id INT IDENTITY(1,1) PRIMARY KEY,
            venue_id INT,
            name NVARCHAR(255),
            slug NVARCHAR(255),
            start_date DATE,
            end_date DATE,
            is_purchasing_enabled BIT,
            is_public_viewable BIT,
            status NVARCHAR(50)
        )`);

        // Campgrounds
        await query(`IF OBJECT_ID('campgrounds', 'U') IS NULL CREATE TABLE campgrounds (
            campground_id INT IDENTITY(1,1) PRIMARY KEY,
            event_id INT,
            name NVARCHAR(255),
            description NVARCHAR(MAX),
            map_image_url NVARCHAR(255)
        )`);

        // Campground Sections
        await query(`IF OBJECT_ID('campground_sections', 'U') IS NULL CREATE TABLE campground_sections (
            campground_section_id INT IDENTITY(1,1) PRIMARY KEY,
            campground_id INT,
            name NVARCHAR(255)
        )`);

        // Campsites
        await query(`IF OBJECT_ID('campsites', 'U') IS NULL CREATE TABLE campsites (
            campsite_id INT IDENTITY(1,1) PRIMARY KEY,
            campground_section_id INT,
            name NVARCHAR(50),
            price_per_night DECIMAL(10,2),
            is_powered BIT,
            max_occupancy INT,
            map_coordinates NVARCHAR(MAX),
            is_active BIT DEFAULT 1
        )`);

        // Event Ticket Types
        await query(`IF OBJECT_ID('event_ticket_types', 'U') IS NULL CREATE TABLE event_ticket_types (
            ticket_type_id INT IDENTITY(1,1) PRIMARY KEY,
            event_id INT,
            name NVARCHAR(255),
            price DECIMAL(10,2),
            system_role NVARCHAR(50),
            is_pilot BIT DEFAULT 0,
            is_pit_crew BIT DEFAULT 0
        )`);

        // Products
        await query(`IF OBJECT_ID('products', 'U') IS NULL CREATE TABLE products (
            product_id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(255),
            description NVARCHAR(MAX),
            base_image_url NVARCHAR(255),
            is_active BIT
        )`);

        // Variant Categories
        await query(`IF OBJECT_ID('variant_categories', 'U') IS NULL CREATE TABLE variant_categories (
            variant_category_id INT IDENTITY(1,1) PRIMARY KEY,
             name NVARCHAR(255)
        )`);

        // Variants
        await query(`IF OBJECT_ID('variants', 'U') IS NULL CREATE TABLE variants (
            variant_id INT IDENTITY(1,1) PRIMARY KEY,
            product_id INT,
            variant_category_id INT
        )`);

        // Variant Options
        await query(`IF OBJECT_ID('variant_options', 'U') IS NULL CREATE TABLE variant_options (
            variant_option_id INT IDENTITY(1,1) PRIMARY KEY,
            variant_id INT,
            value NVARCHAR(255)
        )`);

        // Product SKUs
        await query(`IF OBJECT_ID('product_skus', 'U') IS NULL CREATE TABLE product_skus (
            product_sku_id INT IDENTITY(1,1) PRIMARY KEY,
            product_id INT,
            sku_code NVARCHAR(50),
            current_stock INT,
            is_active BIT
        )`);

        // SKU Option Links
        await query(`IF OBJECT_ID('sku_option_links', 'U') IS NULL CREATE TABLE sku_option_links (
             link_id INT IDENTITY(1,1) PRIMARY KEY,
             product_sku_id INT,
             variant_option_id INT
        )`);

        // Event SKUs
        await query(`IF OBJECT_ID('event_skus', 'U') IS NULL CREATE TABLE event_skus (
            event_sku_id INT IDENTITY(1,1) PRIMARY KEY,
            event_id INT,
            product_sku_id INT,
            price DECIMAL(10,2),
            is_enabled BIT
        )`);

        // Asset Types
        await query(`IF OBJECT_ID('asset_types', 'U') IS NULL CREATE TABLE asset_types (
            asset_type_id INT IDENTITY(1,1) PRIMARY KEY,
            event_id INT,
            name NVARCHAR(255),
            description NVARCHAR(MAX),
            base_hire_cost DECIMAL(10,2)
        )`);

        // Asset Items
        await query(`IF OBJECT_ID('asset_items', 'U') IS NULL CREATE TABLE asset_items (
             asset_item_id INT IDENTITY(1,1) PRIMARY KEY,
             asset_type_id INT,
             identifier NVARCHAR(50),
             status NVARCHAR(50)
        )`);

        // Subevents
        await query(`IF OBJECT_ID('subevents', 'U') IS NULL CREATE TABLE subevents (
            subevent_id INT IDENTITY(1,1) PRIMARY KEY,
            event_id INT,
            name NVARCHAR(255),
            description NVARCHAR(MAX),
            start_time DATETIME,
            end_time DATETIME,
            capacity INT,
            cost DECIMAL(10,2)
        )`);

        // Attendees (Basic)
        await query(`IF OBJECT_ID('attendees', 'U') IS NULL CREATE TABLE attendees (
            attendee_id INT IDENTITY(1,1) PRIMARY KEY,
            event_id INT,
            person_id INT,
            ticket_type_id INT,
            status NVARCHAR(50),
            ticket_code NVARCHAR(50)
        )`);

        // Orders
        await query(`IF OBJECT_ID('orders', 'U') IS NULL CREATE TABLE orders (
            order_id INT IDENTITY(1,1) PRIMARY KEY,
            user_id INT,
            total_amount DECIMAL(10,2),
            payment_status NVARCHAR(50),
            order_date DATETIME DEFAULT GETUTCDATE()
        )`);

        // Order Items
        await query(`IF OBJECT_ID('order_items', 'U') IS NULL CREATE TABLE order_items (
            order_item_id INT IDENTITY(1,1) PRIMARY KEY,
            order_id INT,
            attendee_id INT NULL,
            item_type NVARCHAR(50),
            item_reference_id INT,
            price_at_purchase DECIMAL(10,2)
        )`);

        // Campsite Bookings
        await query(`IF OBJECT_ID('campsite_bookings', 'U') IS NULL CREATE TABLE campsite_bookings (
            booking_id INT IDENTITY(1,1) PRIMARY KEY,
            campsite_id INT,
            order_item_id INT,
            check_in_date DATE,
            check_out_date DATE
        )`);

        // Subevent Registrations
        await query(`IF OBJECT_ID('subevent_registrations', 'U') IS NULL CREATE TABLE subevent_registrations (
            registration_id INT IDENTITY(1,1) PRIMARY KEY,
            subevent_id INT,
            order_item_id INT,
            attendee_id INT NULL
        )`);

        // Asset Hires
        await query(`IF OBJECT_ID('asset_hires', 'U') IS NULL CREATE TABLE asset_hires (
            hire_id INT IDENTITY(1,1) PRIMARY KEY,
            asset_item_id INT,
            order_item_id INT,
            hire_start_date DATE,
            hire_end_date DATE
        )`);

        // Transactions
        await query(`IF OBJECT_ID('transactions', 'U') IS NULL CREATE TABLE transactions (
            transaction_id INT IDENTITY(1,1) PRIMARY KEY,
            order_id INT,
            amount DECIMAL(10,2),
            payment_method NVARCHAR(50),
            status NVARCHAR(50),
            timestamp DATETIME
        )`);

        console.log("Schema Ensured.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
