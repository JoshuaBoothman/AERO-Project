/****** Object:  Database [sqldb-aero-master]    Script Date: 25/12/2025 7:59:19 AM ******/
CREATE DATABASE [sqldb-aero-master]  (EDITION = 'Basic', SERVICE_OBJECTIVE = 'Basic', MAXSIZE = 2 GB) WITH CATALOG_COLLATION = SQL_Latin1_General_CP1_CI_AS, LEDGER = OFF;
GO
ALTER DATABASE [sqldb-aero-master] SET COMPATIBILITY_LEVEL = 170
GO
ALTER DATABASE [sqldb-aero-master] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET ARITHABORT OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [sqldb-aero-master] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [sqldb-aero-master] SET ALLOW_SNAPSHOT_ISOLATION ON 
GO
ALTER DATABASE [sqldb-aero-master] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [sqldb-aero-master] SET READ_COMMITTED_SNAPSHOT ON 
GO
ALTER DATABASE [sqldb-aero-master] SET  MULTI_USER 
GO
ALTER DATABASE [sqldb-aero-master] SET ENCRYPTION ON
GO
ALTER DATABASE [sqldb-aero-master] SET QUERY_STORE = ON
GO
ALTER DATABASE [sqldb-aero-master] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 7), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 10, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
/*** The scripts of database scoped configurations in Azure should be executed inside the target database connection. ***/
GO
-- ALTER DATABASE SCOPED CONFIGURATION SET MAXDOP = 8;
GO
/****** Object:  Sequence [dbo].[Seq_TaxInvoice]    Script Date: 25/12/2025 7:59:19 AM ******/
CREATE SEQUENCE [dbo].[Seq_TaxInvoice] 
 AS [bigint]
 START WITH 10000
 INCREMENT BY 1
 MINVALUE -9223372036854775808
 MAXVALUE 9223372036854775807
 CACHE 
GO
/****** Object:  Table [dbo].[admin_users]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[admin_users](
	[admin_user_id] [int] IDENTITY(1,1) NOT NULL,
	[first_name] [nvarchar](50) NOT NULL,
	[last_name] [nvarchar](50) NOT NULL,
	[email] [nvarchar](255) NOT NULL,
	[phone_number] [varchar](20) NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[role] [varchar](20) NOT NULL,
	[is_active] [bit] NULL,
	[last_login_at] [datetime2](7) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[admin_user_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[asset_hires]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[asset_hires](
	[asset_hire_id] [int] IDENTITY(1,1) NOT NULL,
	[asset_item_id] [int] NOT NULL,
	[order_item_id] [int] NOT NULL,
	[hire_start_date] [datetime2](7) NOT NULL,
	[hire_end_date] [datetime2](7) NOT NULL,
	[returned_at] [datetime2](7) NULL,
	[condition_on_return] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[asset_hire_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[asset_items]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[asset_items](
	[asset_item_id] [int] IDENTITY(1,1) NOT NULL,
	[asset_type_id] [int] NOT NULL,
	[identifier] [nvarchar](50) NOT NULL,
	[serial_number] [nvarchar](50) NULL,
	[status] [varchar](20) NULL,
	[notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[asset_item_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[asset_types]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[asset_types](
	[asset_type_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NULL,
	[base_hire_cost] [decimal](10, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[asset_type_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[attendees]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[attendees](
	[attendee_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[person_id] [int] NOT NULL,
	[ticket_type_id] [int] NOT NULL,
	[status] [varchar](20) NULL,
	[is_waiver_signed] [bit] NULL,
	[waiver_signed_at] [datetime2](7) NULL,
	[dietary_preferences] [nvarchar](255) NULL,
	[admin_notes] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NULL,
	[ticket_code] [varchar](10) NULL,
PRIMARY KEY CLUSTERED 
(
	[attendee_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[campgrounds]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[campgrounds](
	[campground_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[map_image_url] [nvarchar](500) NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[campground_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[campsite_bookings]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[campsite_bookings](
	[campsite_booking_id] [int] IDENTITY(1,1) NOT NULL,
	[campsite_id] [int] NOT NULL,
	[order_item_id] [int] NOT NULL,
	[check_in_date] [date] NOT NULL,
	[check_out_date] [date] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[campsite_booking_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[campsites]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[campsites](
	[campsite_id] [int] IDENTITY(1,1) NOT NULL,
	[campground_id] [int] NOT NULL,
	[site_number] [nvarchar](50) NOT NULL,
	[is_powered] [bit] NULL,
	[dimensions] [nvarchar](50) NULL,
	[map_coordinates] [nvarchar](50) NULL,
	[is_active] [bit] NULL,
	[price_per_night] [decimal](10, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[campsite_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[checkin_logs]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[checkin_logs](
	[checkin_log_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[admin_user_id] [int] NOT NULL,
	[attendee_id] [int] NOT NULL,
	[location_name] [varchar](50) NULL,
	[scanned_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[checkin_log_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[event_media]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[event_media](
	[media_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[url] [nvarchar](500) NOT NULL,
	[thumbnail_url] [nvarchar](500) NULL,
	[media_type] [varchar](20) NOT NULL,
	[caption] [nvarchar](255) NULL,
	[is_featured] [bit] NULL,
	[sort_order] [int] NULL,
	[uploaded_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[media_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[event_payment_settings]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[event_payment_settings](
	[event_payment_setting_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[payment_method_id] [int] NOT NULL,
	[is_enabled] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[event_payment_setting_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[event_planes]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[event_planes](
	[event_plane_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[plane_id] [int] NOT NULL,
	[is_safety_checked] [bit] NULL,
	[safety_checked_by] [int] NULL,
	[safety_checked_at] [datetime2](7) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[event_plane_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[event_skus]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[event_skus](
	[event_sku_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[product_sku_id] [int] NOT NULL,
	[price] [decimal](10, 2) NOT NULL,
	[is_enabled] [bit] NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[event_sku_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[event_ticket_types]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[event_ticket_types](
	[ticket_type_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[price] [decimal](10, 2) NOT NULL,
	[system_role] [varchar](20) NOT NULL,
	[is_pilot] [bit] NULL,
	[is_pit_crew] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[ticket_type_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[events]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[events](
	[event_id] [int] IDENTITY(1,1) NOT NULL,
	[venue_id] [int] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[slug] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NULL,
	[start_date] [datetime2](7) NOT NULL,
	[end_date] [datetime2](7) NOT NULL,
	[is_public_viewable] [bit] NULL,
	[is_purchasing_enabled] [bit] NULL,
	[status] [varchar](20) NULL,
	[created_at] [datetime2](7) NULL,
	[is_active] [bit] NULL,
	[banner_url] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[event_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[slug] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[order_items]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[order_items](
	[order_item_id] [int] IDENTITY(1,1) NOT NULL,
	[order_id] [int] NOT NULL,
	[attendee_id] [int] NOT NULL,
	[item_type] [varchar](20) NOT NULL,
	[item_reference_id] [int] NOT NULL,
	[price_at_purchase] [decimal](10, 2) NOT NULL,
	[fulfillment_status] [varchar](20) NULL,
	[fulfillment_date] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[order_item_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[orders]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[orders](
	[order_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[order_date] [datetime2](7) NULL,
	[total_amount] [decimal](10, 2) NOT NULL,
	[payment_status] [varchar](20) NULL,
	[tax_invoice_number] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[order_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[organization_settings]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[organization_settings](
	[setting_id] [int] NOT NULL,
	[organization_name] [nvarchar](100) NOT NULL,
	[abn] [varchar](20) NULL,
	[primary_color] [varchar](7) NULL,
	[secondary_color] [varchar](7) NULL,
	[accent_color] [varchar](7) NULL,
	[logo_url] [nvarchar](500) NULL,
	[support_email] [nvarchar](255) NOT NULL,
	[website_url] [nvarchar](255) NULL,
	[terms_and_conditions_url] [nvarchar](500) NULL,
	[is_gst_registered] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[setting_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payment_methods]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payment_methods](
	[payment_method_id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](50) NOT NULL,
	[is_active_system_wide] [bit] NULL,
	[is_available_at_gate] [bit] NULL,
	[is_available_online] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[payment_method_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[persons]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[persons](
	[person_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NULL,
	[first_name] [nvarchar](50) NOT NULL,
	[last_name] [nvarchar](50) NOT NULL,
	[date_of_birth] [date] NULL,
	[email] [nvarchar](255) NULL,
	[phone_number] [varchar](20) NULL,
	[address_line_1] [nvarchar](100) NULL,
	[city] [nvarchar](50) NULL,
	[state] [nvarchar](50) NULL,
	[postcode] [varchar](10) NULL,
	[license_number] [nvarchar](50) NULL,
	[emergency_contact_name] [nvarchar](100) NULL,
	[emergency_contact_phone] [varchar](20) NULL,
	[medical_notes] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[person_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pilot_pit_crews]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pilot_pit_crews](
	[pilot_pit_crew_id] [int] IDENTITY(1,1) NOT NULL,
	[pilot_attendee_id] [int] NOT NULL,
	[crew_attendee_id] [int] NOT NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[pilot_pit_crew_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[planes]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[planes](
	[plane_id] [int] IDENTITY(1,1) NOT NULL,
	[person_id] [int] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[model_type] [nvarchar](100) NOT NULL,
	[registration_number] [nvarchar](50) NULL,
	[wingspan_mm] [int] NULL,
	[weight_kg] [decimal](5, 2) NOT NULL,
	[is_heavy_model] [bit] NULL,
	[heavy_model_cert_number] [nvarchar](50) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[plane_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[product_skus]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[product_skus](
	[product_sku_id] [int] IDENTITY(1,1) NOT NULL,
	[product_id] [int] NOT NULL,
	[sku_code] [nvarchar](50) NULL,
	[barcode] [nvarchar](50) NULL,
	[current_stock] [int] NULL,
	[is_active] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[product_sku_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[sku_code] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[products]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[products](
	[product_id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NULL,
	[base_image_url] [nvarchar](500) NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[product_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sku_option_links]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sku_option_links](
	[sku_option_link_id] [int] IDENTITY(1,1) NOT NULL,
	[product_sku_id] [int] NOT NULL,
	[variant_option_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[sku_option_link_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[subevent_registrations]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[subevent_registrations](
	[subevent_registration_id] [int] IDENTITY(1,1) NOT NULL,
	[subevent_id] [int] NOT NULL,
	[order_item_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[subevent_registration_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[subevents]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[subevents](
	[subevent_id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NULL,
	[start_time] [datetime2](7) NOT NULL,
	[end_time] [datetime2](7) NOT NULL,
	[capacity] [int] NULL,
	[cost] [decimal](10, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[subevent_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[transactions]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[transactions](
	[transaction_id] [int] IDENTITY(1,1) NOT NULL,
	[order_id] [int] NOT NULL,
	[amount] [decimal](10, 2) NOT NULL,
	[payment_method] [varchar](50) NOT NULL,
	[gateway_transaction_id] [nvarchar](100) NULL,
	[status] [varchar](20) NULL,
	[timestamp] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[transaction_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[users]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[email] [nvarchar](255) NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[first_name] [nvarchar](50) NOT NULL,
	[last_name] [nvarchar](50) NOT NULL,
	[phone_number] [varchar](20) NULL,
	[is_email_verified] [bit] NULL,
	[stripe_customer_id] [varchar](50) NULL,
	[created_at] [datetime2](7) NULL,
	[last_login_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[variant_categories]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[variant_categories](
	[variant_category_id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[variant_category_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[variant_options]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[variant_options](
	[variant_option_id] [int] IDENTITY(1,1) NOT NULL,
	[variant_id] [int] NOT NULL,
	[value] [nvarchar](50) NOT NULL,
	[sort_order] [int] NULL,
	[image_url] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[variant_option_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[variants]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[variants](
	[variant_id] [int] IDENTITY(1,1) NOT NULL,
	[product_id] [int] NOT NULL,
	[variant_category_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[variant_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[venues]    Script Date: 25/12/2025 7:59:19 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[venues](
	[venue_id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[contact_name] [nvarchar](100) NULL,
	[contact_email] [nvarchar](255) NULL,
	[contact_phone] [varchar](20) NULL,
	[address_line_1] [nvarchar](100) NOT NULL,
	[city] [nvarchar](50) NOT NULL,
	[state] [nvarchar](50) NOT NULL,
	[postcode] [varchar](10) NOT NULL,
	[latitude] [decimal](9, 6) NULL,
	[longitude] [decimal](9, 6) NULL,
	[elevation_ft] [int] NULL,
	[timezone] [varchar](50) NOT NULL,
	[map_url] [nvarchar](500) NULL,
	[is_active] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[venue_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[admin_users] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[admin_users] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[asset_items] ADD  DEFAULT ('Active') FOR [status]
GO
ALTER TABLE [dbo].[asset_types] ADD  DEFAULT ((0.00)) FOR [base_hire_cost]
GO
ALTER TABLE [dbo].[attendees] ADD  DEFAULT ('Registered') FOR [status]
GO
ALTER TABLE [dbo].[attendees] ADD  DEFAULT ((0)) FOR [is_waiver_signed]
GO
ALTER TABLE [dbo].[attendees] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[campgrounds] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[campsites] ADD  DEFAULT ((0)) FOR [is_powered]
GO
ALTER TABLE [dbo].[campsites] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[campsites] ADD  DEFAULT ((0.00)) FOR [price_per_night]
GO
ALTER TABLE [dbo].[checkin_logs] ADD  DEFAULT ('Main Gate') FOR [location_name]
GO
ALTER TABLE [dbo].[checkin_logs] ADD  DEFAULT (getutcdate()) FOR [scanned_at]
GO
ALTER TABLE [dbo].[event_media] ADD  DEFAULT ((0)) FOR [is_featured]
GO
ALTER TABLE [dbo].[event_media] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[event_media] ADD  DEFAULT (getutcdate()) FOR [uploaded_at]
GO
ALTER TABLE [dbo].[event_payment_settings] ADD  DEFAULT ((1)) FOR [is_enabled]
GO
ALTER TABLE [dbo].[event_planes] ADD  DEFAULT ((0)) FOR [is_safety_checked]
GO
ALTER TABLE [dbo].[event_planes] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[event_skus] ADD  DEFAULT ((1)) FOR [is_enabled]
GO
ALTER TABLE [dbo].[event_skus] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[event_ticket_types] ADD  DEFAULT ((0)) FOR [is_pilot]
GO
ALTER TABLE [dbo].[event_ticket_types] ADD  DEFAULT ((0)) FOR [is_pit_crew]
GO
ALTER TABLE [dbo].[events] ADD  DEFAULT ((0)) FOR [is_public_viewable]
GO
ALTER TABLE [dbo].[events] ADD  DEFAULT ((0)) FOR [is_purchasing_enabled]
GO
ALTER TABLE [dbo].[events] ADD  DEFAULT ('Draft') FOR [status]
GO
ALTER TABLE [dbo].[events] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[events] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[order_items] ADD  DEFAULT ('Pending') FOR [fulfillment_status]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT (getutcdate()) FOR [order_date]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT ('Unpaid') FOR [payment_status]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT (NEXT VALUE FOR [Seq_TaxInvoice]) FOR [tax_invoice_number]
GO
ALTER TABLE [dbo].[organization_settings] ADD  DEFAULT ((1)) FOR [setting_id]
GO
ALTER TABLE [dbo].[organization_settings] ADD  DEFAULT ('#000000') FOR [primary_color]
GO
ALTER TABLE [dbo].[organization_settings] ADD  DEFAULT ('#FFFFFF') FOR [secondary_color]
GO
ALTER TABLE [dbo].[organization_settings] ADD  DEFAULT ('#FFD700') FOR [accent_color]
GO
ALTER TABLE [dbo].[organization_settings] ADD  DEFAULT ((0)) FOR [is_gst_registered]
GO
ALTER TABLE [dbo].[payment_methods] ADD  DEFAULT ((1)) FOR [is_active_system_wide]
GO
ALTER TABLE [dbo].[payment_methods] ADD  DEFAULT ((1)) FOR [is_available_at_gate]
GO
ALTER TABLE [dbo].[payment_methods] ADD  DEFAULT ((1)) FOR [is_available_online]
GO
ALTER TABLE [dbo].[persons] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[pilot_pit_crews] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[planes] ADD  DEFAULT ((0)) FOR [is_heavy_model]
GO
ALTER TABLE [dbo].[planes] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[product_skus] ADD  DEFAULT ((0)) FOR [current_stock]
GO
ALTER TABLE [dbo].[product_skus] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[subevents] ADD  DEFAULT ((0.00)) FOR [cost]
GO
ALTER TABLE [dbo].[transactions] ADD  DEFAULT ('Success') FOR [status]
GO
ALTER TABLE [dbo].[transactions] ADD  DEFAULT (getutcdate()) FOR [timestamp]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT ((0)) FOR [is_email_verified]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[variant_options] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[venues] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[asset_hires]  WITH CHECK ADD  CONSTRAINT [FK_AssetHire_Item] FOREIGN KEY([asset_item_id])
REFERENCES [dbo].[asset_items] ([asset_item_id])
GO
ALTER TABLE [dbo].[asset_hires] CHECK CONSTRAINT [FK_AssetHire_Item]
GO
ALTER TABLE [dbo].[asset_hires]  WITH CHECK ADD  CONSTRAINT [FK_AssetHire_OrderItem] FOREIGN KEY([order_item_id])
REFERENCES [dbo].[order_items] ([order_item_id])
GO
ALTER TABLE [dbo].[asset_hires] CHECK CONSTRAINT [FK_AssetHire_OrderItem]
GO
ALTER TABLE [dbo].[asset_items]  WITH CHECK ADD  CONSTRAINT [FK_AssetItems_Type] FOREIGN KEY([asset_type_id])
REFERENCES [dbo].[asset_types] ([asset_type_id])
GO
ALTER TABLE [dbo].[asset_items] CHECK CONSTRAINT [FK_AssetItems_Type]
GO
ALTER TABLE [dbo].[asset_types]  WITH CHECK ADD  CONSTRAINT [FK_AssetTypes_Event] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[asset_types] CHECK CONSTRAINT [FK_AssetTypes_Event]
GO
ALTER TABLE [dbo].[attendees]  WITH CHECK ADD  CONSTRAINT [FK_Attendees_Events] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[attendees] CHECK CONSTRAINT [FK_Attendees_Events]
GO
ALTER TABLE [dbo].[attendees]  WITH CHECK ADD  CONSTRAINT [FK_Attendees_Persons] FOREIGN KEY([person_id])
REFERENCES [dbo].[persons] ([person_id])
GO
ALTER TABLE [dbo].[attendees] CHECK CONSTRAINT [FK_Attendees_Persons]
GO
ALTER TABLE [dbo].[attendees]  WITH CHECK ADD  CONSTRAINT [FK_Attendees_TicketTypes] FOREIGN KEY([ticket_type_id])
REFERENCES [dbo].[event_ticket_types] ([ticket_type_id])
GO
ALTER TABLE [dbo].[attendees] CHECK CONSTRAINT [FK_Attendees_TicketTypes]
GO
ALTER TABLE [dbo].[campgrounds]  WITH CHECK ADD  CONSTRAINT [FK_Campgrounds_Event] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[campgrounds] CHECK CONSTRAINT [FK_Campgrounds_Event]
GO
ALTER TABLE [dbo].[campsite_bookings]  WITH CHECK ADD  CONSTRAINT [FK_CampBook_OrderItem] FOREIGN KEY([order_item_id])
REFERENCES [dbo].[order_items] ([order_item_id])
GO
ALTER TABLE [dbo].[campsite_bookings] CHECK CONSTRAINT [FK_CampBook_OrderItem]
GO
ALTER TABLE [dbo].[campsite_bookings]  WITH CHECK ADD  CONSTRAINT [FK_CampBook_Site] FOREIGN KEY([campsite_id])
REFERENCES [dbo].[campsites] ([campsite_id])
GO
ALTER TABLE [dbo].[campsite_bookings] CHECK CONSTRAINT [FK_CampBook_Site]
GO
ALTER TABLE [dbo].[campsites]  WITH CHECK ADD  CONSTRAINT [FK_Campsites_Campground] FOREIGN KEY([campground_id])
REFERENCES [dbo].[campgrounds] ([campground_id])
GO
ALTER TABLE [dbo].[campsites] CHECK CONSTRAINT [FK_Campsites_Campground]
GO
ALTER TABLE [dbo].[checkin_logs]  WITH CHECK ADD  CONSTRAINT [FK_Checkin_Admin] FOREIGN KEY([admin_user_id])
REFERENCES [dbo].[admin_users] ([admin_user_id])
GO
ALTER TABLE [dbo].[checkin_logs] CHECK CONSTRAINT [FK_Checkin_Admin]
GO
ALTER TABLE [dbo].[checkin_logs]  WITH CHECK ADD  CONSTRAINT [FK_Checkin_Attendee] FOREIGN KEY([attendee_id])
REFERENCES [dbo].[attendees] ([attendee_id])
GO
ALTER TABLE [dbo].[checkin_logs] CHECK CONSTRAINT [FK_Checkin_Attendee]
GO
ALTER TABLE [dbo].[checkin_logs]  WITH CHECK ADD  CONSTRAINT [FK_Checkin_Event] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[checkin_logs] CHECK CONSTRAINT [FK_Checkin_Event]
GO
ALTER TABLE [dbo].[event_media]  WITH CHECK ADD  CONSTRAINT [FK_EventMedia_Events] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[event_media] CHECK CONSTRAINT [FK_EventMedia_Events]
GO
ALTER TABLE [dbo].[event_payment_settings]  WITH CHECK ADD  CONSTRAINT [FK_PaySet_Event] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[event_payment_settings] CHECK CONSTRAINT [FK_PaySet_Event]
GO
ALTER TABLE [dbo].[event_payment_settings]  WITH CHECK ADD  CONSTRAINT [FK_PaySet_Method] FOREIGN KEY([payment_method_id])
REFERENCES [dbo].[payment_methods] ([payment_method_id])
GO
ALTER TABLE [dbo].[event_payment_settings] CHECK CONSTRAINT [FK_PaySet_Method]
GO
ALTER TABLE [dbo].[event_planes]  WITH CHECK ADD  CONSTRAINT [FK_EventPlanes_Admin] FOREIGN KEY([safety_checked_by])
REFERENCES [dbo].[admin_users] ([admin_user_id])
GO
ALTER TABLE [dbo].[event_planes] CHECK CONSTRAINT [FK_EventPlanes_Admin]
GO
ALTER TABLE [dbo].[event_planes]  WITH CHECK ADD  CONSTRAINT [FK_EventPlanes_Events] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[event_planes] CHECK CONSTRAINT [FK_EventPlanes_Events]
GO
ALTER TABLE [dbo].[event_planes]  WITH CHECK ADD  CONSTRAINT [FK_EventPlanes_Planes] FOREIGN KEY([plane_id])
REFERENCES [dbo].[planes] ([plane_id])
GO
ALTER TABLE [dbo].[event_planes] CHECK CONSTRAINT [FK_EventPlanes_Planes]
GO
ALTER TABLE [dbo].[event_skus]  WITH CHECK ADD  CONSTRAINT [FK_EventSkus_Event] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[event_skus] CHECK CONSTRAINT [FK_EventSkus_Event]
GO
ALTER TABLE [dbo].[event_skus]  WITH CHECK ADD  CONSTRAINT [FK_EventSkus_Sku] FOREIGN KEY([product_sku_id])
REFERENCES [dbo].[product_skus] ([product_sku_id])
GO
ALTER TABLE [dbo].[event_skus] CHECK CONSTRAINT [FK_EventSkus_Sku]
GO
ALTER TABLE [dbo].[event_ticket_types]  WITH CHECK ADD  CONSTRAINT [FK_EventTicketTypes_Events] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[event_ticket_types] CHECK CONSTRAINT [FK_EventTicketTypes_Events]
GO
ALTER TABLE [dbo].[events]  WITH CHECK ADD  CONSTRAINT [FK_Events_Venues] FOREIGN KEY([venue_id])
REFERENCES [dbo].[venues] ([venue_id])
GO
ALTER TABLE [dbo].[events] CHECK CONSTRAINT [FK_Events_Venues]
GO
ALTER TABLE [dbo].[order_items]  WITH CHECK ADD  CONSTRAINT [FK_OrderItems_Attendee] FOREIGN KEY([attendee_id])
REFERENCES [dbo].[attendees] ([attendee_id])
GO
ALTER TABLE [dbo].[order_items] CHECK CONSTRAINT [FK_OrderItems_Attendee]
GO
ALTER TABLE [dbo].[order_items]  WITH CHECK ADD  CONSTRAINT [FK_OrderItems_Order] FOREIGN KEY([order_id])
REFERENCES [dbo].[orders] ([order_id])
GO
ALTER TABLE [dbo].[order_items] CHECK CONSTRAINT [FK_OrderItems_Order]
GO
ALTER TABLE [dbo].[orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_User] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[orders] CHECK CONSTRAINT [FK_Orders_User]
GO
ALTER TABLE [dbo].[persons]  WITH CHECK ADD  CONSTRAINT [FK_Persons_Users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[persons] CHECK CONSTRAINT [FK_Persons_Users]
GO
ALTER TABLE [dbo].[pilot_pit_crews]  WITH CHECK ADD  CONSTRAINT [FK_Pit_Crew] FOREIGN KEY([crew_attendee_id])
REFERENCES [dbo].[attendees] ([attendee_id])
GO
ALTER TABLE [dbo].[pilot_pit_crews] CHECK CONSTRAINT [FK_Pit_Crew]
GO
ALTER TABLE [dbo].[pilot_pit_crews]  WITH CHECK ADD  CONSTRAINT [FK_Pit_Pilot] FOREIGN KEY([pilot_attendee_id])
REFERENCES [dbo].[attendees] ([attendee_id])
GO
ALTER TABLE [dbo].[pilot_pit_crews] CHECK CONSTRAINT [FK_Pit_Pilot]
GO
ALTER TABLE [dbo].[planes]  WITH CHECK ADD  CONSTRAINT [FK_Planes_Persons] FOREIGN KEY([person_id])
REFERENCES [dbo].[persons] ([person_id])
GO
ALTER TABLE [dbo].[planes] CHECK CONSTRAINT [FK_Planes_Persons]
GO
ALTER TABLE [dbo].[product_skus]  WITH CHECK ADD  CONSTRAINT [FK_ProductSkus_Product] FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([product_id])
GO
ALTER TABLE [dbo].[product_skus] CHECK CONSTRAINT [FK_ProductSkus_Product]
GO
ALTER TABLE [dbo].[sku_option_links]  WITH CHECK ADD  CONSTRAINT [FK_SkuOption_Option] FOREIGN KEY([variant_option_id])
REFERENCES [dbo].[variant_options] ([variant_option_id])
GO
ALTER TABLE [dbo].[sku_option_links] CHECK CONSTRAINT [FK_SkuOption_Option]
GO
ALTER TABLE [dbo].[sku_option_links]  WITH CHECK ADD  CONSTRAINT [FK_SkuOption_Sku] FOREIGN KEY([product_sku_id])
REFERENCES [dbo].[product_skus] ([product_sku_id])
GO
ALTER TABLE [dbo].[sku_option_links] CHECK CONSTRAINT [FK_SkuOption_Sku]
GO
ALTER TABLE [dbo].[subevent_registrations]  WITH CHECK ADD  CONSTRAINT [FK_SubReg_OrderItem] FOREIGN KEY([order_item_id])
REFERENCES [dbo].[order_items] ([order_item_id])
GO
ALTER TABLE [dbo].[subevent_registrations] CHECK CONSTRAINT [FK_SubReg_OrderItem]
GO
ALTER TABLE [dbo].[subevent_registrations]  WITH CHECK ADD  CONSTRAINT [FK_SubReg_Subevent] FOREIGN KEY([subevent_id])
REFERENCES [dbo].[subevents] ([subevent_id])
GO
ALTER TABLE [dbo].[subevent_registrations] CHECK CONSTRAINT [FK_SubReg_Subevent]
GO
ALTER TABLE [dbo].[subevents]  WITH CHECK ADD  CONSTRAINT [FK_Subevents_Event] FOREIGN KEY([event_id])
REFERENCES [dbo].[events] ([event_id])
GO
ALTER TABLE [dbo].[subevents] CHECK CONSTRAINT [FK_Subevents_Event]
GO
ALTER TABLE [dbo].[transactions]  WITH CHECK ADD  CONSTRAINT [FK_Transactions_Order] FOREIGN KEY([order_id])
REFERENCES [dbo].[orders] ([order_id])
GO
ALTER TABLE [dbo].[transactions] CHECK CONSTRAINT [FK_Transactions_Order]
GO
ALTER TABLE [dbo].[variant_options]  WITH CHECK ADD  CONSTRAINT [FK_VariantOptions_Variant] FOREIGN KEY([variant_id])
REFERENCES [dbo].[variants] ([variant_id])
GO
ALTER TABLE [dbo].[variant_options] CHECK CONSTRAINT [FK_VariantOptions_Variant]
GO
ALTER TABLE [dbo].[variants]  WITH CHECK ADD  CONSTRAINT [FK_Variants_Category] FOREIGN KEY([variant_category_id])
REFERENCES [dbo].[variant_categories] ([variant_category_id])
GO
ALTER TABLE [dbo].[variants] CHECK CONSTRAINT [FK_Variants_Category]
GO
ALTER TABLE [dbo].[variants]  WITH CHECK ADD  CONSTRAINT [FK_Variants_Product] FOREIGN KEY([product_id])
REFERENCES [dbo].[products] ([product_id])
GO
ALTER TABLE [dbo].[variants] CHECK CONSTRAINT [FK_Variants_Product]
GO
ALTER TABLE [dbo].[admin_users]  WITH CHECK ADD  CONSTRAINT [CK_AdminRole] CHECK  (([role]='Operational' OR [role]='Admin'))
GO
ALTER TABLE [dbo].[admin_users] CHECK CONSTRAINT [CK_AdminRole]
GO
ALTER TABLE [dbo].[attendees]  WITH CHECK ADD  CONSTRAINT [CK_AttendeeStatus] CHECK  (([status]='Cancelled' OR [status]='Checked In' OR [status]='Registered'))
GO
ALTER TABLE [dbo].[attendees] CHECK CONSTRAINT [CK_AttendeeStatus]
GO
ALTER TABLE [dbo].[event_media]  WITH CHECK ADD  CONSTRAINT [CK_MediaType] CHECK  (([media_type]='Youtube' OR [media_type]='Video' OR [media_type]='Image'))
GO
ALTER TABLE [dbo].[event_media] CHECK CONSTRAINT [CK_MediaType]
GO
ALTER TABLE [dbo].[event_ticket_types]  WITH CHECK ADD  CONSTRAINT [CK_SystemRole] CHECK  (([system_role]='Crew' OR [system_role]='Spectator' OR [system_role]='Pilot'))
GO
ALTER TABLE [dbo].[event_ticket_types] CHECK CONSTRAINT [CK_SystemRole]
GO
ALTER TABLE [dbo].[organization_settings]  WITH CHECK ADD  CONSTRAINT [CK_SingleRow] CHECK  (([setting_id]=(1)))
GO
ALTER TABLE [dbo].[organization_settings] CHECK CONSTRAINT [CK_SingleRow]
GO
ALTER DATABASE [sqldb-aero-master] SET  READ_WRITE 
GO
