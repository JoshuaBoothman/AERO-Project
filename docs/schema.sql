-- --------------------------------------------------------
-- Host:                         sql-aero-dev-jb.database.windows.net
-- Server version:               Microsoft SQL Azure (RTM) - 12.0.2000.8
-- Server OS:                    
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES  */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for sqldb-aero-master
CREATE DATABASE IF NOT EXISTS "sqldb-aero-master";
USE "sqldb-aero-master";

-- Dumping structure for table sqldb-aero-master.admin_users
CREATE TABLE IF NOT EXISTS "admin_users" (
	"admin_user_id" INT NOT NULL,
	"first_name" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"last_name" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"email" NVARCHAR(255) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"phone_number" VARCHAR(20) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"password_hash" NVARCHAR(255) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"role" VARCHAR(20) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_active" BIT NULL DEFAULT '(1)',
	"last_login_at" DATETIME2(7) NULL DEFAULT NULL,
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	PRIMARY KEY ("admin_user_id"),
	UNIQUE INDEX "UQ__admin_us__AB6E616445A5B3C3" ("email"),
	CONSTRAINT "CK_AdminRole" CHECK (([role]='Operational' OR [role]='Admin'))
);

-- Dumping data for table sqldb-aero-master.admin_users: -1 rows
/*!40000 ALTER TABLE "admin_users" DISABLE KEYS */;
/*!40000 ALTER TABLE "admin_users" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.asset_hires
CREATE TABLE IF NOT EXISTS "asset_hires" (
	"asset_hire_id" INT NOT NULL,
	"asset_item_id" INT NOT NULL,
	"order_item_id" INT NOT NULL,
	"hire_start_date" DATETIME2(7) NOT NULL,
	"hire_end_date" DATETIME2(7) NOT NULL,
	"returned_at" DATETIME2(7) NULL DEFAULT NULL,
	"condition_on_return" NVARCHAR(255) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	FOREIGN KEY INDEX "FK_AssetHire_Item" ("asset_item_id"),
	FOREIGN KEY INDEX "FK_AssetHire_OrderItem" ("order_item_id"),
	PRIMARY KEY ("asset_hire_id"),
	CONSTRAINT "FK_AssetHire_Item" FOREIGN KEY ("asset_item_id") REFERENCES "asset_items" ("asset_item_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_AssetHire_OrderItem" FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("order_item_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.asset_hires: -1 rows
/*!40000 ALTER TABLE "asset_hires" DISABLE KEYS */;
/*!40000 ALTER TABLE "asset_hires" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.asset_items
CREATE TABLE IF NOT EXISTS "asset_items" (
	"asset_item_id" INT NOT NULL,
	"asset_type_id" INT NOT NULL,
	"identifier" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"serial_number" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"status" VARCHAR(20) NULL DEFAULT '''Active''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"notes" NVARCHAR(max) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	FOREIGN KEY INDEX "FK_AssetItems_Type" ("asset_type_id"),
	PRIMARY KEY ("asset_item_id"),
	CONSTRAINT "FK_AssetItems_Type" FOREIGN KEY ("asset_type_id") REFERENCES "asset_types" ("asset_type_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.asset_items: -1 rows
/*!40000 ALTER TABLE "asset_items" DISABLE KEYS */;
/*!40000 ALTER TABLE "asset_items" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.asset_types
CREATE TABLE IF NOT EXISTS "asset_types" (
	"asset_type_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"description" NVARCHAR(max) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"base_hire_cost" DECIMAL(10,2) NULL DEFAULT '(0.00)',
	FOREIGN KEY INDEX "FK_AssetTypes_Event" ("event_id"),
	PRIMARY KEY ("asset_type_id"),
	CONSTRAINT "FK_AssetTypes_Event" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.asset_types: -1 rows
/*!40000 ALTER TABLE "asset_types" DISABLE KEYS */;
/*!40000 ALTER TABLE "asset_types" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.attendees
CREATE TABLE IF NOT EXISTS "attendees" (
	"attendee_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"person_id" INT NOT NULL,
	"ticket_type_id" INT NOT NULL,
	"status" VARCHAR(20) NULL DEFAULT '''Registered''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_waiver_signed" BIT NULL DEFAULT '(0)',
	"waiver_signed_at" DATETIME2(7) NULL DEFAULT NULL,
	"dietary_preferences" NVARCHAR(255) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"admin_notes" NVARCHAR(max) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_Attendees_Events" ("event_id"),
	FOREIGN KEY INDEX "FK_Attendees_Persons" ("person_id"),
	FOREIGN KEY INDEX "FK_Attendees_TicketTypes" ("ticket_type_id"),
	PRIMARY KEY ("attendee_id"),
	CONSTRAINT "FK_Attendees_Persons" FOREIGN KEY ("person_id") REFERENCES "persons" ("person_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_Attendees_Events" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_Attendees_TicketTypes" FOREIGN KEY ("ticket_type_id") REFERENCES "event_ticket_types" ("ticket_type_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "CK_AttendeeStatus" CHECK (([status]='Cancelled' OR [status]='Checked In' OR [status]='Registered'))
);

-- Dumping data for table sqldb-aero-master.attendees: -1 rows
/*!40000 ALTER TABLE "attendees" DISABLE KEYS */;
/*!40000 ALTER TABLE "attendees" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.campgrounds
CREATE TABLE IF NOT EXISTS "campgrounds" (
	"campground_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"map_image_url" NVARCHAR(500) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"description" NVARCHAR(max) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_active" BIT NULL DEFAULT '(1)',
	FOREIGN KEY INDEX "FK_Campgrounds_Event" ("event_id"),
	PRIMARY KEY ("campground_id"),
	CONSTRAINT "FK_Campgrounds_Event" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.campgrounds: -1 rows
/*!40000 ALTER TABLE "campgrounds" DISABLE KEYS */;
/*!40000 ALTER TABLE "campgrounds" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.campsites
CREATE TABLE IF NOT EXISTS "campsites" (
	"campsite_id" INT NOT NULL,
	"campground_id" INT NOT NULL,
	"site_number" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_powered" BIT NULL DEFAULT '(0)',
	"dimensions" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"map_coordinates" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_active" BIT NULL DEFAULT '(1)',
	"price_per_night" DECIMAL(10,2) NULL DEFAULT '(0.00)',
	FOREIGN KEY INDEX "FK_Campsites_Campground" ("campground_id"),
	PRIMARY KEY ("campsite_id"),
	CONSTRAINT "FK_Campsites_Campground" FOREIGN KEY ("campground_id") REFERENCES "campgrounds" ("campground_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.campsites: -1 rows
/*!40000 ALTER TABLE "campsites" DISABLE KEYS */;
/*!40000 ALTER TABLE "campsites" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.campsite_bookings
CREATE TABLE IF NOT EXISTS "campsite_bookings" (
	"campsite_booking_id" INT NOT NULL,
	"campsite_id" INT NOT NULL,
	"order_item_id" INT NOT NULL,
	"check_in_date" DATE NOT NULL,
	"check_out_date" DATE NOT NULL,
	FOREIGN KEY INDEX "FK_CampBook_OrderItem" ("order_item_id"),
	FOREIGN KEY INDEX "FK_CampBook_Site" ("campsite_id"),
	PRIMARY KEY ("campsite_booking_id"),
	CONSTRAINT "FK_CampBook_Site" FOREIGN KEY ("campsite_id") REFERENCES "campsites" ("campsite_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_CampBook_OrderItem" FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("order_item_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.campsite_bookings: -1 rows
/*!40000 ALTER TABLE "campsite_bookings" DISABLE KEYS */;
/*!40000 ALTER TABLE "campsite_bookings" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.checkin_logs
CREATE TABLE IF NOT EXISTS "checkin_logs" (
	"checkin_log_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"admin_user_id" INT NOT NULL,
	"attendee_id" INT NOT NULL,
	"location_name" VARCHAR(50) NULL DEFAULT '''Main Gate''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"scanned_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_Checkin_Admin" ("admin_user_id"),
	FOREIGN KEY INDEX "FK_Checkin_Attendee" ("attendee_id"),
	FOREIGN KEY INDEX "FK_Checkin_Event" ("event_id"),
	PRIMARY KEY ("checkin_log_id"),
	CONSTRAINT "FK_Checkin_Admin" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users" ("admin_user_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_Checkin_Event" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_Checkin_Attendee" FOREIGN KEY ("attendee_id") REFERENCES "attendees" ("attendee_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.checkin_logs: -1 rows
/*!40000 ALTER TABLE "checkin_logs" DISABLE KEYS */;
/*!40000 ALTER TABLE "checkin_logs" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.events
CREATE TABLE IF NOT EXISTS "events" (
	"event_id" INT NOT NULL,
	"venue_id" INT NOT NULL,
	"name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"slug" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"description" NVARCHAR(max) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"start_date" DATETIME2(7) NOT NULL,
	"end_date" DATETIME2(7) NOT NULL,
	"is_public_viewable" BIT NULL DEFAULT '(0)',
	"is_purchasing_enabled" BIT NULL DEFAULT '(0)',
	"status" VARCHAR(20) NULL DEFAULT '''Draft''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	"is_active" BIT NULL DEFAULT '(1)',
	FOREIGN KEY INDEX "FK_Events_Venues" ("venue_id"),
	PRIMARY KEY ("event_id"),
	UNIQUE INDEX "UQ__events__32DD1E4CE8A750A1" ("slug"),
	CONSTRAINT "FK_Events_Venues" FOREIGN KEY ("venue_id") REFERENCES "venues" ("venue_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.events: -1 rows
/*!40000 ALTER TABLE "events" DISABLE KEYS */;
/*!40000 ALTER TABLE "events" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.event_media
CREATE TABLE IF NOT EXISTS "event_media" (
	"media_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"url" NVARCHAR(500) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"thumbnail_url" NVARCHAR(500) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"media_type" VARCHAR(20) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"caption" NVARCHAR(255) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_featured" BIT NULL DEFAULT '(0)',
	"sort_order" INT NULL DEFAULT '(0)',
	"uploaded_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_EventMedia_Events" ("event_id"),
	PRIMARY KEY ("media_id"),
	CONSTRAINT "FK_EventMedia_Events" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "CK_MediaType" CHECK (([media_type]='Youtube' OR [media_type]='Video' OR [media_type]='Image'))
);

-- Dumping data for table sqldb-aero-master.event_media: -1 rows
/*!40000 ALTER TABLE "event_media" DISABLE KEYS */;
/*!40000 ALTER TABLE "event_media" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.event_payment_settings
CREATE TABLE IF NOT EXISTS "event_payment_settings" (
	"event_payment_setting_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"payment_method_id" INT NOT NULL,
	"is_enabled" BIT NULL DEFAULT '(1)',
	FOREIGN KEY INDEX "FK_PaySet_Event" ("event_id"),
	FOREIGN KEY INDEX "FK_PaySet_Method" ("payment_method_id"),
	PRIMARY KEY ("event_payment_setting_id"),
	CONSTRAINT "FK_PaySet_Method" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("payment_method_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_PaySet_Event" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.event_payment_settings: -1 rows
/*!40000 ALTER TABLE "event_payment_settings" DISABLE KEYS */;
/*!40000 ALTER TABLE "event_payment_settings" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.event_planes
CREATE TABLE IF NOT EXISTS "event_planes" (
	"event_plane_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"plane_id" INT NOT NULL,
	"is_safety_checked" BIT NULL DEFAULT '(0)',
	"safety_checked_by" INT NULL DEFAULT NULL,
	"safety_checked_at" DATETIME2(7) NULL DEFAULT NULL,
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_EventPlanes_Admin" ("safety_checked_by"),
	FOREIGN KEY INDEX "FK_EventPlanes_Events" ("event_id"),
	FOREIGN KEY INDEX "FK_EventPlanes_Planes" ("plane_id"),
	PRIMARY KEY ("event_plane_id"),
	CONSTRAINT "FK_EventPlanes_Planes" FOREIGN KEY ("plane_id") REFERENCES "planes" ("plane_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_EventPlanes_Admin" FOREIGN KEY ("safety_checked_by") REFERENCES "admin_users" ("admin_user_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_EventPlanes_Events" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.event_planes: -1 rows
/*!40000 ALTER TABLE "event_planes" DISABLE KEYS */;
/*!40000 ALTER TABLE "event_planes" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.event_skus
CREATE TABLE IF NOT EXISTS "event_skus" (
	"event_sku_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"product_sku_id" INT NOT NULL,
	"price" DECIMAL(10,2) NOT NULL,
	"is_enabled" BIT NULL DEFAULT '(1)',
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_EventSkus_Event" ("event_id"),
	FOREIGN KEY INDEX "FK_EventSkus_Sku" ("product_sku_id"),
	PRIMARY KEY ("event_sku_id"),
	CONSTRAINT "FK_EventSkus_Sku" FOREIGN KEY ("product_sku_id") REFERENCES "product_skus" ("product_sku_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_EventSkus_Event" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.event_skus: -1 rows
/*!40000 ALTER TABLE "event_skus" DISABLE KEYS */;
/*!40000 ALTER TABLE "event_skus" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.event_ticket_types
CREATE TABLE IF NOT EXISTS "event_ticket_types" (
	"ticket_type_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"price" DECIMAL(10,2) NOT NULL,
	"system_role" VARCHAR(20) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	FOREIGN KEY INDEX "FK_EventTicketTypes_Events" ("event_id"),
	PRIMARY KEY ("ticket_type_id"),
	CONSTRAINT "FK_EventTicketTypes_Events" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "CK_SystemRole" CHECK (([system_role]='Crew' OR [system_role]='Spectator' OR [system_role]='Pilot'))
);

-- Dumping data for table sqldb-aero-master.event_ticket_types: -1 rows
/*!40000 ALTER TABLE "event_ticket_types" DISABLE KEYS */;
/*!40000 ALTER TABLE "event_ticket_types" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.orders
CREATE TABLE IF NOT EXISTS "orders" (
	"order_id" INT NOT NULL,
	"user_id" INT NOT NULL,
	"order_date" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	"total_amount" DECIMAL(10,2) NOT NULL,
	"payment_status" VARCHAR(20) NULL DEFAULT '''Unpaid''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"tax_invoice_number" INT NOT NULL DEFAULT 'NEXT VALUE FOR [Seq_TaxInvoice]',
	FOREIGN KEY INDEX "FK_Orders_User" ("user_id"),
	PRIMARY KEY ("order_id"),
	CONSTRAINT "FK_Orders_User" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.orders: -1 rows
/*!40000 ALTER TABLE "orders" DISABLE KEYS */;
/*!40000 ALTER TABLE "orders" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.order_items
CREATE TABLE IF NOT EXISTS "order_items" (
	"order_item_id" INT NOT NULL,
	"order_id" INT NOT NULL,
	"attendee_id" INT NOT NULL,
	"item_type" VARCHAR(20) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"item_reference_id" INT NOT NULL,
	"price_at_purchase" DECIMAL(10,2) NOT NULL,
	"fulfillment_status" VARCHAR(20) NULL DEFAULT '''Pending''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"fulfillment_date" DATETIME2(7) NULL DEFAULT NULL,
	FOREIGN KEY INDEX "FK_OrderItems_Attendee" ("attendee_id"),
	FOREIGN KEY INDEX "FK_OrderItems_Order" ("order_id"),
	PRIMARY KEY ("order_item_id"),
	CONSTRAINT "FK_OrderItems_Order" FOREIGN KEY ("order_id") REFERENCES "orders" ("order_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_OrderItems_Attendee" FOREIGN KEY ("attendee_id") REFERENCES "attendees" ("attendee_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.order_items: -1 rows
/*!40000 ALTER TABLE "order_items" DISABLE KEYS */;
/*!40000 ALTER TABLE "order_items" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.organization_settings
CREATE TABLE IF NOT EXISTS "organization_settings" (
	"setting_id" INT NOT NULL DEFAULT '(1)',
	"organization_name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"abn" VARCHAR(20) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"primary_color" VARCHAR(7) NULL DEFAULT '''#000000''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"secondary_color" VARCHAR(7) NULL DEFAULT '''#FFFFFF''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"accent_color" VARCHAR(7) NULL DEFAULT '''#FFD700''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"logo_url" NVARCHAR(500) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"support_email" NVARCHAR(255) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"website_url" NVARCHAR(255) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"terms_and_conditions_url" NVARCHAR(500) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_gst_registered" BIT NULL DEFAULT '(0)',
	PRIMARY KEY ("setting_id"),
	CONSTRAINT "CK_SingleRow" CHECK (([setting_id]=(1)))
);

-- Dumping data for table sqldb-aero-master.organization_settings: -1 rows
/*!40000 ALTER TABLE "organization_settings" DISABLE KEYS */;
/*!40000 ALTER TABLE "organization_settings" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.payment_methods
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"payment_method_id" INT NOT NULL,
	"name" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_active_system_wide" BIT NULL DEFAULT '(1)',
	"is_available_at_gate" BIT NULL DEFAULT '(1)',
	"is_available_online" BIT NULL DEFAULT '(1)',
	PRIMARY KEY ("payment_method_id"),
	UNIQUE INDEX "UQ__payment___72E12F1B9FC85B99" ("name")
);

-- Dumping data for table sqldb-aero-master.payment_methods: -1 rows
/*!40000 ALTER TABLE "payment_methods" DISABLE KEYS */;
/*!40000 ALTER TABLE "payment_methods" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.persons
CREATE TABLE IF NOT EXISTS "persons" (
	"person_id" INT NOT NULL,
	"user_id" INT NOT NULL,
	"first_name" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"last_name" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"date_of_birth" DATE NULL DEFAULT NULL,
	"email" NVARCHAR(255) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"phone_number" VARCHAR(20) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"address_line_1" NVARCHAR(100) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"city" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"state" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"postcode" VARCHAR(10) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"license_number" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"emergency_contact_name" NVARCHAR(100) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"emergency_contact_phone" VARCHAR(20) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"medical_notes" NVARCHAR(max) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_Persons_Users" ("user_id"),
	PRIMARY KEY ("person_id"),
	CONSTRAINT "FK_Persons_Users" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.persons: -1 rows
/*!40000 ALTER TABLE "persons" DISABLE KEYS */;
/*!40000 ALTER TABLE "persons" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.pilot_pit_crews
CREATE TABLE IF NOT EXISTS "pilot_pit_crews" (
	"pilot_pit_crew_id" INT NOT NULL,
	"pilot_attendee_id" INT NOT NULL,
	"crew_attendee_id" INT NOT NULL,
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_Pit_Crew" ("crew_attendee_id"),
	FOREIGN KEY INDEX "FK_Pit_Pilot" ("pilot_attendee_id"),
	PRIMARY KEY ("pilot_pit_crew_id"),
	CONSTRAINT "FK_Pit_Pilot" FOREIGN KEY ("pilot_attendee_id") REFERENCES "attendees" ("attendee_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_Pit_Crew" FOREIGN KEY ("crew_attendee_id") REFERENCES "attendees" ("attendee_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.pilot_pit_crews: -1 rows
/*!40000 ALTER TABLE "pilot_pit_crews" DISABLE KEYS */;
/*!40000 ALTER TABLE "pilot_pit_crews" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.planes
CREATE TABLE IF NOT EXISTS "planes" (
	"plane_id" INT NOT NULL,
	"person_id" INT NOT NULL,
	"name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"model_type" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"registration_number" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"wingspan_mm" INT NULL DEFAULT NULL,
	"weight_kg" DECIMAL(5,2) NOT NULL,
	"is_heavy_model" BIT NULL DEFAULT '(0)',
	"heavy_model_cert_number" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_Planes_Persons" ("person_id"),
	PRIMARY KEY ("plane_id"),
	CONSTRAINT "FK_Planes_Persons" FOREIGN KEY ("person_id") REFERENCES "persons" ("person_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.planes: -1 rows
/*!40000 ALTER TABLE "planes" DISABLE KEYS */;
/*!40000 ALTER TABLE "planes" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.products
CREATE TABLE IF NOT EXISTS "products" (
	"product_id" INT NOT NULL,
	"name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"description" NVARCHAR(max) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"base_image_url" NVARCHAR(500) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_active" BIT NULL DEFAULT '(1)',
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	PRIMARY KEY ("product_id")
);

-- Dumping data for table sqldb-aero-master.products: -1 rows
/*!40000 ALTER TABLE "products" DISABLE KEYS */;
/*!40000 ALTER TABLE "products" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.product_skus
CREATE TABLE IF NOT EXISTS "product_skus" (
	"product_sku_id" INT NOT NULL,
	"product_id" INT NOT NULL,
	"sku_code" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"barcode" NVARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"current_stock" INT NULL DEFAULT '(0)',
	"is_active" BIT NULL DEFAULT '(1)',
	FOREIGN KEY INDEX "FK_ProductSkus_Product" ("product_id"),
	PRIMARY KEY ("product_sku_id"),
	UNIQUE INDEX "UQ__product___843F428FEFFF392C" ("sku_code"),
	CONSTRAINT "FK_ProductSkus_Product" FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.product_skus: -1 rows
/*!40000 ALTER TABLE "product_skus" DISABLE KEYS */;
/*!40000 ALTER TABLE "product_skus" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.sku_option_links
CREATE TABLE IF NOT EXISTS "sku_option_links" (
	"sku_option_link_id" INT NOT NULL,
	"product_sku_id" INT NOT NULL,
	"variant_option_id" INT NOT NULL,
	FOREIGN KEY INDEX "FK_SkuOption_Option" ("variant_option_id"),
	FOREIGN KEY INDEX "FK_SkuOption_Sku" ("product_sku_id"),
	PRIMARY KEY ("sku_option_link_id"),
	CONSTRAINT "FK_SkuOption_Option" FOREIGN KEY ("variant_option_id") REFERENCES "variant_options" ("variant_option_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_SkuOption_Sku" FOREIGN KEY ("product_sku_id") REFERENCES "product_skus" ("product_sku_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.sku_option_links: -1 rows
/*!40000 ALTER TABLE "sku_option_links" DISABLE KEYS */;
/*!40000 ALTER TABLE "sku_option_links" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.subevents
CREATE TABLE IF NOT EXISTS "subevents" (
	"subevent_id" INT NOT NULL,
	"event_id" INT NOT NULL,
	"name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"description" NVARCHAR(max) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"start_time" DATETIME2(7) NOT NULL,
	"end_time" DATETIME2(7) NOT NULL,
	"capacity" INT NULL DEFAULT NULL,
	"cost" DECIMAL(10,2) NULL DEFAULT '(0.00)',
	FOREIGN KEY INDEX "FK_Subevents_Event" ("event_id"),
	PRIMARY KEY ("subevent_id"),
	CONSTRAINT "FK_Subevents_Event" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.subevents: -1 rows
/*!40000 ALTER TABLE "subevents" DISABLE KEYS */;
/*!40000 ALTER TABLE "subevents" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.subevent_registrations
CREATE TABLE IF NOT EXISTS "subevent_registrations" (
	"subevent_registration_id" INT NOT NULL,
	"subevent_id" INT NOT NULL,
	"order_item_id" INT NOT NULL,
	FOREIGN KEY INDEX "FK_SubReg_OrderItem" ("order_item_id"),
	FOREIGN KEY INDEX "FK_SubReg_Subevent" ("subevent_id"),
	PRIMARY KEY ("subevent_registration_id"),
	CONSTRAINT "FK_SubReg_Subevent" FOREIGN KEY ("subevent_id") REFERENCES "subevents" ("subevent_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_SubReg_OrderItem" FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("order_item_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.subevent_registrations: -1 rows
/*!40000 ALTER TABLE "subevent_registrations" DISABLE KEYS */;
/*!40000 ALTER TABLE "subevent_registrations" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.transactions
CREATE TABLE IF NOT EXISTS "transactions" (
	"transaction_id" INT NOT NULL,
	"order_id" INT NOT NULL,
	"amount" DECIMAL(10,2) NOT NULL,
	"payment_method" VARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"gateway_transaction_id" NVARCHAR(100) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"status" VARCHAR(20) NULL DEFAULT '''Success''' COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"timestamp" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	FOREIGN KEY INDEX "FK_Transactions_Order" ("order_id"),
	PRIMARY KEY ("transaction_id"),
	CONSTRAINT "FK_Transactions_Order" FOREIGN KEY ("order_id") REFERENCES "orders" ("order_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.transactions: -1 rows
/*!40000 ALTER TABLE "transactions" DISABLE KEYS */;
/*!40000 ALTER TABLE "transactions" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.users
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" INT NOT NULL,
	"email" NVARCHAR(255) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"password_hash" NVARCHAR(255) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"first_name" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"last_name" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"phone_number" VARCHAR(20) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_email_verified" BIT NULL DEFAULT '(0)',
	"stripe_customer_id" VARCHAR(50) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"created_at" DATETIME2(7) NULL DEFAULT 'getutcdate()',
	"last_login_at" DATETIME2(7) NULL DEFAULT NULL,
	PRIMARY KEY ("user_id"),
	UNIQUE INDEX "UQ__users__AB6E61640A9C9A4E" ("email")
);

-- Dumping data for table sqldb-aero-master.users: -1 rows
/*!40000 ALTER TABLE "users" DISABLE KEYS */;
/*!40000 ALTER TABLE "users" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.variants
CREATE TABLE IF NOT EXISTS "variants" (
	"variant_id" INT NOT NULL,
	"product_id" INT NOT NULL,
	"variant_category_id" INT NOT NULL,
	FOREIGN KEY INDEX "FK_Variants_Category" ("variant_category_id"),
	FOREIGN KEY INDEX "FK_Variants_Product" ("product_id"),
	PRIMARY KEY ("variant_id"),
	CONSTRAINT "FK_Variants_Product" FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK_Variants_Category" FOREIGN KEY ("variant_category_id") REFERENCES "variant_categories" ("variant_category_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.variants: -1 rows
/*!40000 ALTER TABLE "variants" DISABLE KEYS */;
/*!40000 ALTER TABLE "variants" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.variant_categories
CREATE TABLE IF NOT EXISTS "variant_categories" (
	"variant_category_id" INT NOT NULL,
	"name" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	PRIMARY KEY ("variant_category_id"),
	UNIQUE INDEX "UQ__variant___72E12F1BFE0AD96C" ("name")
);

-- Dumping data for table sqldb-aero-master.variant_categories: -1 rows
/*!40000 ALTER TABLE "variant_categories" DISABLE KEYS */;
/*!40000 ALTER TABLE "variant_categories" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.variant_options
CREATE TABLE IF NOT EXISTS "variant_options" (
	"variant_option_id" INT NOT NULL,
	"variant_id" INT NOT NULL,
	"value" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"sort_order" INT NULL DEFAULT '(0)',
	"image_url" NVARCHAR(500) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	FOREIGN KEY INDEX "FK_VariantOptions_Variant" ("variant_id"),
	PRIMARY KEY ("variant_option_id"),
	CONSTRAINT "FK_VariantOptions_Variant" FOREIGN KEY ("variant_id") REFERENCES "variants" ("variant_id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Dumping data for table sqldb-aero-master.variant_options: -1 rows
/*!40000 ALTER TABLE "variant_options" DISABLE KEYS */;
/*!40000 ALTER TABLE "variant_options" ENABLE KEYS */;

-- Dumping structure for table sqldb-aero-master.venues
CREATE TABLE IF NOT EXISTS "venues" (
	"venue_id" INT NOT NULL,
	"name" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"contact_name" NVARCHAR(100) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"contact_email" NVARCHAR(255) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"contact_phone" VARCHAR(20) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"address_line_1" NVARCHAR(100) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"city" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"state" NVARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"postcode" VARCHAR(10) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"latitude" DECIMAL(9,6) NULL DEFAULT NULL,
	"longitude" DECIMAL(9,6) NULL DEFAULT NULL,
	"elevation_ft" INT NULL DEFAULT NULL,
	"timezone" VARCHAR(50) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"map_url" NVARCHAR(500) NULL DEFAULT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"is_active" BIT NULL DEFAULT '(1)',
	PRIMARY KEY ("venue_id")
);

-- Dumping data for table sqldb-aero-master.venues: -1 rows
/*!40000 ALTER TABLE "venues" DISABLE KEYS */;
/*!40000 ALTER TABLE "venues" ENABLE KEYS */;

-- Dumping structure for view sqldb-aero-master.database_firewall_rules
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE "database_firewall_rules" (
	"id" INT NOT NULL,
	"name" NVARCHAR(128) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"start_ip_address" VARCHAR(1) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"end_ip_address" VARCHAR(1) NOT NULL COLLATE 'SQL_Latin1_General_CP1_CI_AS',
	"create_date" DATETIME NOT NULL,
	"modify_date" DATETIME NOT NULL
) ENGINE=MyISAM;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS "database_firewall_rules";
CREATE VIEW sys.database_firewall_rules AS SELECT id, name, start_ip_address, end_ip_address, create_date, modify_date FROM sys.database_firewall_rules_table;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
