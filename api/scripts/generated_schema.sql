-- AERO-Project Consolidated Schema
-- Generated on: 2026-02-13T01:57:14.294Z

-- Table: admin_users
IF OBJECT_ID('admin_users', 'U') IS NULL
BEGIN
    CREATE TABLE admin_users (
        admin_user_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        first_name nvarchar(50) NOT NULL,
        last_name nvarchar(50) NOT NULL,
        email nvarchar(255) NOT NULL,
        phone_number varchar(20),
        password_hash nvarchar(255) NOT NULL,
        role varchar(20) NOT NULL,
        is_active bit DEFAULT ((1)),
        last_login_at datetime2,
        created_at datetime2 DEFAULT (getutcdate()),
        reset_password_token nvarchar(255),
        reset_password_expires datetime
    );
END
GO

-- Table: asset_categories
IF OBJECT_ID('asset_categories', 'U') IS NULL
BEGIN
    CREATE TABLE asset_categories (
        asset_category_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        name nvarchar(255) NOT NULL,
        sort_order int DEFAULT ((0))
    );
END
GO

-- Table: asset_hires
IF OBJECT_ID('asset_hires', 'U') IS NULL
BEGIN
    CREATE TABLE asset_hires (
        asset_hire_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        asset_item_id int,
        order_item_id int NOT NULL,
        hire_start_date datetime2 NOT NULL,
        hire_end_date datetime2 NOT NULL,
        returned_at datetime2,
        condition_on_return nvarchar(255),
        asset_type_id int,
        selected_option_id int
    );
END
GO

-- Table: asset_items
IF OBJECT_ID('asset_items', 'U') IS NULL
BEGIN
    CREATE TABLE asset_items (
        asset_item_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        asset_type_id int NOT NULL,
        identifier nvarchar(50) NOT NULL,
        serial_number nvarchar(50),
        status varchar(20) DEFAULT ('Active'),
        notes nvarchar(MAX),
        image_url nvarchar(MAX)
    );
END
GO

-- Table: asset_type_options
IF OBJECT_ID('asset_type_options', 'U') IS NULL
BEGIN
    CREATE TABLE asset_type_options (
        asset_type_option_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        asset_type_id int NOT NULL,
        label nvarchar(100) NOT NULL,
        sort_order int NOT NULL DEFAULT ((0)),
        is_active bit NOT NULL DEFAULT ((1))
    );
END
GO

-- Table: asset_types
IF OBJECT_ID('asset_types', 'U') IS NULL
BEGIN
    CREATE TABLE asset_types (
        asset_type_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        name nvarchar(100) NOT NULL,
        description nvarchar(MAX),
        base_hire_cost decimal DEFAULT ((0.00)),
        image_url nvarchar(500),
        full_event_cost decimal,
        show_daily_cost bit DEFAULT ((1)),
        show_full_event_cost bit DEFAULT ((0)),
        asset_category_id int,
        sort_order int DEFAULT ((0)),
        stock_quantity int NOT NULL DEFAULT ((0)),
        option_label nvarchar(50)
    );
END
GO

-- Table: attendees
IF OBJECT_ID('attendees', 'U') IS NULL
BEGIN
    CREATE TABLE attendees (
        attendee_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        person_id int NOT NULL,
        ticket_type_id int NOT NULL,
        status varchar(20) DEFAULT ('Registered'),
        is_waiver_signed bit DEFAULT ((0)),
        waiver_signed_at datetime2,
        dietary_preferences nvarchar(255),
        admin_notes nvarchar(MAX),
        created_at datetime2 DEFAULT (getutcdate()),
        ticket_code varchar(10),
        has_agreed_to_mop bit DEFAULT ((0)),
        arrival_date date,
        departure_date date,
        flight_line_duties bit DEFAULT ((0)),
        is_heavy_model_inspector bit NOT NULL DEFAULT ((0)),
        dietary_requirements nvarchar(MAX),
        linked_pilot_attendee_id int,
        attending_dinner bit NOT NULL DEFAULT ((0)),
        pilot_name nvarchar(255)
    );
END
GO

-- Table: campgrounds
IF OBJECT_ID('campgrounds', 'U') IS NULL
BEGIN
    CREATE TABLE campgrounds (
        campground_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        name nvarchar(100) NOT NULL,
        map_image_url nvarchar(500),
        description nvarchar(MAX),
        is_active bit DEFAULT ((1))
    );
END
GO

-- Table: campsite_bookings
IF OBJECT_ID('campsite_bookings', 'U') IS NULL
BEGIN
    CREATE TABLE campsite_bookings (
        booking_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        campsite_id int,
        order_item_id int,
        check_in_date date,
        check_out_date date,
        number_of_adults int DEFAULT ((1)),
        number_of_children int DEFAULT ((0))
    );
END
GO

-- Table: campsites
IF OBJECT_ID('campsites', 'U') IS NULL
BEGIN
    CREATE TABLE campsites (
        campsite_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        campground_id int NOT NULL,
        site_number nvarchar(50) NOT NULL,
        is_powered bit DEFAULT ((0)),
        dimensions nvarchar(50),
        map_coordinates nvarchar(50),
        is_active bit DEFAULT ((1)),
        price_per_night decimal DEFAULT ((0.00)),
        description nvarchar(MAX),
        full_event_price decimal,
        extra_adult_price_per_night decimal DEFAULT ((0)),
        extra_adult_full_event_price decimal DEFAULT ((0)),
        site_sort_index int
    );
END
GO

-- Table: checkin_logs
IF OBJECT_ID('checkin_logs', 'U') IS NULL
BEGIN
    CREATE TABLE checkin_logs (
        checkin_log_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        admin_user_id int NOT NULL,
        attendee_id int NOT NULL,
        location_name varchar(50) DEFAULT ('Main Gate'),
        scanned_at datetime2 DEFAULT (getutcdate())
    );
END
GO

-- Table: event_media
IF OBJECT_ID('event_media', 'U') IS NULL
BEGIN
    CREATE TABLE event_media (
        media_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        url nvarchar(500) NOT NULL,
        thumbnail_url nvarchar(500),
        media_type varchar(20) NOT NULL,
        caption nvarchar(255),
        is_featured bit DEFAULT ((0)),
        sort_order int DEFAULT ((0)),
        uploaded_at datetime2 DEFAULT (getutcdate())
    );
END
GO

-- Table: event_payment_settings
IF OBJECT_ID('event_payment_settings', 'U') IS NULL
BEGIN
    CREATE TABLE event_payment_settings (
        event_payment_setting_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        payment_method_id int NOT NULL,
        is_enabled bit DEFAULT ((1))
    );
END
GO

-- Table: event_planes
IF OBJECT_ID('event_planes', 'U') IS NULL
BEGIN
    CREATE TABLE event_planes (
        event_plane_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        plane_id int NOT NULL,
        is_safety_checked bit DEFAULT ((0)),
        safety_checked_by int,
        safety_checked_at datetime2,
        created_at datetime2 DEFAULT (getutcdate())
    );
END
GO

-- Table: event_skus
IF OBJECT_ID('event_skus', 'U') IS NULL
BEGIN
    CREATE TABLE event_skus (
        event_sku_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        product_sku_id int NOT NULL,
        price decimal NOT NULL,
        is_enabled bit DEFAULT ((1)),
        created_at datetime2 DEFAULT (getutcdate())
    );
END
GO

-- Table: event_ticket_types
IF OBJECT_ID('event_ticket_types', 'U') IS NULL
BEGIN
    CREATE TABLE event_ticket_types (
        ticket_type_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        name nvarchar(100) NOT NULL,
        price decimal NOT NULL,
        system_role varchar(20) NOT NULL,
        description nvarchar(MAX),
        sort_order int DEFAULT ((0)),
        includes_merch bit NOT NULL DEFAULT ((0)),
        price_no_flight_line decimal,
        is_day_pass bit NOT NULL DEFAULT ((0)),
        includes_official_dinner bit DEFAULT ((0))
    );
END
GO

-- Table: events
IF OBJECT_ID('events', 'U') IS NULL
BEGIN
    CREATE TABLE events (
        event_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        venue_id int NOT NULL,
        name nvarchar(100) NOT NULL,
        slug nvarchar(100) NOT NULL,
        description nvarchar(MAX),
        start_date datetime2 NOT NULL,
        end_date datetime2 NOT NULL,
        is_public_viewable bit DEFAULT ((0)),
        is_purchasing_enabled bit DEFAULT ((0)),
        status varchar(20) DEFAULT ('Draft'),
        created_at datetime2 DEFAULT (getutcdate()),
        is_active bit DEFAULT ((1)),
        banner_url nvarchar(500),
        mop_url nvarchar(2048),
        dinner_date datetime,
        official_dinner_subevent_id int
    );
END
GO

-- Table: faqs
IF OBJECT_ID('faqs', 'U') IS NULL
BEGIN
    CREATE TABLE faqs (
        id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int,
        question nvarchar(MAX) NOT NULL,
        answer nvarchar(MAX) NOT NULL,
        image_url nvarchar(500),
        display_order int DEFAULT ((0)),
        is_active bit DEFAULT ((1)),
        created_at datetime DEFAULT (getdate()),
        updated_at datetime DEFAULT (getdate())
    );
END
GO

-- Table: flight_line_roster
IF OBJECT_ID('flight_line_roster', 'U') IS NULL
BEGIN
    CREATE TABLE flight_line_roster (
        roster_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        flight_line_id int NOT NULL,
        attendee_id int,
        roster_date date NOT NULL,
        start_time time NOT NULL,
        end_time time NOT NULL
    );
END
GO

-- Table: flight_line_schedule
IF OBJECT_ID('flight_line_schedule', 'U') IS NULL
BEGIN
    CREATE TABLE flight_line_schedule (
        schedule_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        flight_line_id int NOT NULL,
        schedule_date date NOT NULL,
        open_time time NOT NULL,
        close_time time NOT NULL,
        duty_duration_minutes int NOT NULL DEFAULT ((60))
    );
END
GO

-- Table: flight_lines
IF OBJECT_ID('flight_lines', 'U') IS NULL
BEGIN
    CREATE TABLE flight_lines (
        flight_line_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        flight_line_name nvarchar(255) NOT NULL
    );
END
GO

-- Table: gallery_items
IF OBJECT_ID('gallery_items', 'U') IS NULL
BEGIN
    CREATE TABLE gallery_items (
        id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        url nvarchar(MAX) NOT NULL,
        filename nvarchar(MAX) NOT NULL,
        media_type nvarchar(50) NOT NULL,
        caption nvarchar(MAX),
        sort_order int DEFAULT ((0)),
        created_at datetime DEFAULT (getdate()),
        is_active bit DEFAULT ((1))
    );
END
GO

-- Table: merchandise_suppliers
IF OBJECT_ID('merchandise_suppliers', 'U') IS NULL
BEGIN
    CREATE TABLE merchandise_suppliers (
        supplier_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        name nvarchar(255) NOT NULL,
        contact_name nvarchar(255),
        phone nvarchar(50),
        email nvarchar(255),
        is_active bit DEFAULT ((1)),
        created_at datetime DEFAULT (getdate())
    );
END
GO

-- Table: order_items
IF OBJECT_ID('order_items', 'U') IS NULL
BEGIN
    CREATE TABLE order_items (
        order_item_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        order_id int NOT NULL,
        attendee_id int NOT NULL,
        item_type varchar(20) NOT NULL,
        item_reference_id int NOT NULL,
        price_at_purchase decimal NOT NULL,
        fulfillment_status varchar(20) DEFAULT ('Pending'),
        fulfillment_date datetime2,
        refunded_at datetime,
        quantity int NOT NULL DEFAULT ((1))
    );
END
GO

-- Table: orders
IF OBJECT_ID('orders', 'U') IS NULL
BEGIN
    CREATE TABLE orders (
        order_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        user_id int NOT NULL,
        order_date datetime2 DEFAULT (getutcdate()),
        total_amount decimal NOT NULL,
        payment_status varchar(20) DEFAULT ('Unpaid'),
        tax_invoice_number int NOT NULL DEFAULT (NEXT VALUE FOR [Seq_TaxInvoice]),
        invoice_number varchar(20),
        amount_paid decimal NOT NULL DEFAULT ((0.00)),
        booking_source nvarchar(50) DEFAULT ('Online')
    );
END
GO

-- Table: organization_settings
IF OBJECT_ID('organization_settings', 'U') IS NULL
BEGIN
    CREATE TABLE organization_settings (
        setting_id int PRIMARY KEY NOT NULL DEFAULT ((1)),
        organization_name nvarchar(100) NOT NULL,
        abn varchar(20),
        primary_color varchar(7) DEFAULT ('#000000'),
        secondary_color varchar(7) DEFAULT ('#FFFFFF'),
        accent_color varchar(7) DEFAULT ('#FFD700'),
        logo_url nvarchar(500),
        support_email nvarchar(255) NOT NULL,
        website_url nvarchar(255),
        terms_and_conditions_url nvarchar(500),
        is_gst_registered bit DEFAULT ((0)),
        bank_name nvarchar(100),
        bank_account_name nvarchar(100),
        bank_bsb nvarchar(20),
        bank_account_number nvarchar(50),
        address_line_1 nvarchar(255),
        city nvarchar(100),
        state nvarchar(50),
        postcode nvarchar(20),
        phone_number varchar(50)
    );
END
GO

-- Table: payment_methods
IF OBJECT_ID('payment_methods', 'U') IS NULL
BEGIN
    CREATE TABLE payment_methods (
        payment_method_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        name nvarchar(50) NOT NULL,
        is_active_system_wide bit DEFAULT ((1)),
        is_available_at_gate bit DEFAULT ((1)),
        is_available_online bit DEFAULT ((1))
    );
END
GO

-- Table: persons
IF OBJECT_ID('persons', 'U') IS NULL
BEGIN
    CREATE TABLE persons (
        person_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        user_id int,
        first_name nvarchar(50) NOT NULL,
        last_name nvarchar(50) NOT NULL,
        date_of_birth date,
        email nvarchar(255),
        phone_number varchar(20),
        address_line_1 nvarchar(100),
        city nvarchar(50),
        state nvarchar(50),
        postcode varchar(10),
        license_number nvarchar(50),
        emergency_contact_name nvarchar(100),
        emergency_contact_phone varchar(20),
        medical_notes nvarchar(MAX),
        created_at datetime2 DEFAULT (getutcdate()),
        country nvarchar(100) DEFAULT ('Australia')
    );
END
GO

-- Table: pilot_pit_crews
IF OBJECT_ID('pilot_pit_crews', 'U') IS NULL
BEGIN
    CREATE TABLE pilot_pit_crews (
        pilot_pit_crew_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        pilot_attendee_id int NOT NULL,
        crew_attendee_id int NOT NULL,
        created_at datetime2 DEFAULT (getutcdate())
    );
END
GO

-- Table: planes
IF OBJECT_ID('planes', 'U') IS NULL
BEGIN
    CREATE TABLE planes (
        plane_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        person_id int NOT NULL,
        name nvarchar(100) NOT NULL,
        model_type nvarchar(100) NOT NULL,
        registration_number nvarchar(50),
        wingspan_mm int,
        weight_kg decimal NOT NULL,
        is_heavy_model bit DEFAULT ((0)),
        heavy_model_cert_number nvarchar(50),
        created_at datetime2 DEFAULT (getutcdate()),
        heavy_model_cert_image_url nvarchar(MAX)
    );
END
GO

-- Table: product_skus
IF OBJECT_ID('product_skus', 'U') IS NULL
BEGIN
    CREATE TABLE product_skus (
        product_sku_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        product_id int NOT NULL,
        sku_code nvarchar(50),
        barcode nvarchar(50),
        current_stock int DEFAULT ((0)),
        is_active bit DEFAULT ((1)),
        price decimal DEFAULT ((0.00)),
        image_url nvarchar(500),
        cost_price decimal NOT NULL DEFAULT ((0.00))
    );
END
GO

-- Table: products
IF OBJECT_ID('products', 'U') IS NULL
BEGIN
    CREATE TABLE products (
        product_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        name nvarchar(100) NOT NULL,
        description nvarchar(MAX),
        base_image_url nvarchar(500),
        is_active bit DEFAULT ((1)),
        created_at datetime2 DEFAULT (getutcdate()),
        sort_order int DEFAULT ((0)),
        supplier_id int
    );
END
GO

-- Table: public_event_days
IF OBJECT_ID('public_event_days', 'U') IS NULL
BEGIN
    CREATE TABLE public_event_days (
        id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        title nvarchar(255) NOT NULL,
        description nvarchar(MAX),
        date date NOT NULL,
        start_time time,
        end_time time,
        is_active bit DEFAULT ((1))
    );
END
GO

-- Table: public_registrations
IF OBJECT_ID('public_registrations', 'U') IS NULL
BEGIN
    CREATE TABLE public_registrations (
        id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        public_event_day_id int NOT NULL,
        first_name nvarchar(255) NOT NULL,
        last_name nvarchar(255) NOT NULL,
        email nvarchar(255) NOT NULL,
        adults_count int DEFAULT ((1)),
        children_count int DEFAULT ((0)),
        ticket_code varchar(12),
        created_at datetime DEFAULT (getutcdate()),
        subscribe_to_emails bit DEFAULT ((0))
    );
END
GO

-- Table: sku_option_links
IF OBJECT_ID('sku_option_links', 'U') IS NULL
BEGIN
    CREATE TABLE sku_option_links (
        sku_option_link_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        product_sku_id int NOT NULL,
        variant_option_id int NOT NULL
    );
END
GO

-- Table: subevent_registration_choices
IF OBJECT_ID('subevent_registration_choices', 'U') IS NULL
BEGIN
    CREATE TABLE subevent_registration_choices (
        registration_choice_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        subevent_registration_id int NOT NULL,
        variation_option_id int NOT NULL
    );
END
GO

-- Table: subevent_registrations
IF OBJECT_ID('subevent_registrations', 'U') IS NULL
BEGIN
    CREATE TABLE subevent_registrations (
        subevent_registration_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        subevent_id int NOT NULL,
        order_item_id int NOT NULL,
        attendee_id int,
        guest_name nvarchar(255),
        attendee_note nvarchar(MAX)
    );
END
GO

-- Table: subevent_variation_options
IF OBJECT_ID('subevent_variation_options', 'U') IS NULL
BEGIN
    CREATE TABLE subevent_variation_options (
        variation_option_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        subevent_variation_id int NOT NULL,
        name nvarchar(255) NOT NULL,
        price_adjustment decimal DEFAULT ((0.00))
    );
END
GO

-- Table: subevent_variations
IF OBJECT_ID('subevent_variations', 'U') IS NULL
BEGIN
    CREATE TABLE subevent_variations (
        subevent_variation_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        subevent_id int NOT NULL,
        name nvarchar(255) NOT NULL,
        is_required bit DEFAULT ((1))
    );
END
GO

-- Table: subevents
IF OBJECT_ID('subevents', 'U') IS NULL
BEGIN
    CREATE TABLE subevents (
        subevent_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        event_id int NOT NULL,
        name nvarchar(100) NOT NULL,
        description nvarchar(MAX),
        start_time datetime2 NOT NULL,
        end_time datetime2 NOT NULL,
        capacity int,
        cost decimal DEFAULT ((0.00)),
        img_url nvarchar(500),
        note_title nvarchar(255)
    );
END
GO

-- Table: ticket_linked_products
IF OBJECT_ID('ticket_linked_products', 'U') IS NULL
BEGIN
    CREATE TABLE ticket_linked_products (
        ticket_linked_product_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        ticket_type_id int NOT NULL,
        product_id int NOT NULL
    );
END
GO

-- Table: transactions
IF OBJECT_ID('transactions', 'U') IS NULL
BEGIN
    CREATE TABLE transactions (
        transaction_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        order_id int NOT NULL,
        amount decimal NOT NULL,
        payment_method varchar(50) NOT NULL,
        gateway_transaction_id nvarchar(100),
        status varchar(20) DEFAULT ('Success'),
        timestamp datetime2 DEFAULT (getutcdate()),
        reference varchar(100),
        payment_date datetime
    );
END
GO

-- Table: users
IF OBJECT_ID('users', 'U') IS NULL
BEGIN
    CREATE TABLE users (
        user_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        email nvarchar(255) NOT NULL,
        password_hash nvarchar(255) NOT NULL,
        first_name nvarchar(50) NOT NULL,
        last_name nvarchar(50) NOT NULL,
        phone_number varchar(20),
        is_email_verified bit DEFAULT ((0)),
        stripe_customer_id varchar(50),
        created_at datetime2 DEFAULT (getutcdate()),
        last_login_at datetime2,
        verification_token nvarchar(255),
        verification_token_expires datetime,
        is_locked bit DEFAULT ((0)),
        aus_number nvarchar(50) NOT NULL,
        reset_password_token nvarchar(255),
        reset_password_expires datetime,
        is_legacy_import bit DEFAULT ((0))
    );
END
GO

-- Table: variant_categories
IF OBJECT_ID('variant_categories', 'U') IS NULL
BEGIN
    CREATE TABLE variant_categories (
        variant_category_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        name nvarchar(50) NOT NULL
    );
END
GO

-- Table: variant_options
IF OBJECT_ID('variant_options', 'U') IS NULL
BEGIN
    CREATE TABLE variant_options (
        variant_option_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        variant_id int NOT NULL,
        value nvarchar(50) NOT NULL,
        sort_order int DEFAULT ((0)),
        image_url nvarchar(500)
    );
END
GO

-- Table: variant_template_options
IF OBJECT_ID('variant_template_options', 'U') IS NULL
BEGIN
    CREATE TABLE variant_template_options (
        option_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        template_id int NOT NULL,
        category_name nvarchar(100) NOT NULL,
        option_name nvarchar(100) NOT NULL,
        price_adjustment decimal DEFAULT ((0))
    );
END
GO

-- Table: variant_templates
IF OBJECT_ID('variant_templates', 'U') IS NULL
BEGIN
    CREATE TABLE variant_templates (
        template_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        name nvarchar(100) NOT NULL,
        created_at datetime2 DEFAULT (getutcdate())
    );
END
GO

-- Table: variants
IF OBJECT_ID('variants', 'U') IS NULL
BEGIN
    CREATE TABLE variants (
        variant_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        product_id int NOT NULL,
        variant_category_id int NOT NULL
    );
END
GO

-- Table: venues
IF OBJECT_ID('venues', 'U') IS NULL
BEGIN
    CREATE TABLE venues (
        venue_id int IDENTITY(1,1) PRIMARY KEY NOT NULL,
        name nvarchar(100) NOT NULL,
        contact_name nvarchar(100),
        contact_email nvarchar(255),
        contact_phone varchar(20),
        address_line_1 nvarchar(100) NOT NULL,
        city nvarchar(50) NOT NULL,
        state nvarchar(50) NOT NULL,
        postcode varchar(10) NOT NULL,
        latitude decimal,
        longitude decimal,
        elevation_ft int,
        timezone varchar(50) NOT NULL,
        map_url nvarchar(500),
        is_active bit DEFAULT ((1))
    );
END
GO

