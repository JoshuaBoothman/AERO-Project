# Public Air Show Registration Implementation Plan (Completed)

## Goal Description
Implement a simple public registration system for the "Air Show Day" event. This registration is separate from the main ticketing/order system. It allows members of the public to register their attendance by providing their contact details and a headcount of adults and children.

## User Review Required
> [!NOTE]
> **Data Structure**: This approach uses a flat table `public_registrations` containing a headcount (Adults/Children) rather than individual attendee records. Individual tickets will not be generated; instead, a single confirmation (Group Ticket) will be issued.

## Completed Changes

### Database Schema
- [x] Create table `public_registrations`.
- [x] Create table `public_event_days`.

### API (`api/src`)
- [x] Endpoint: `POST /api/public/register`
- [x] Endpoint: `GET /api/public-days` and `POST /api/public-days`
- [x] Endpoint: `GET /api/events/{slug}/public-registrations`
- [x] Email Service: `sendPublicRegistrationEmail`.

### Client (`client/src`)
- [x] Admin: Manage Public Event Days in `EventForm.jsx`.
- [x] Admin: View Registrations in `PublicRegistrationsReport.jsx` and Dashboard.
- [x] Public: View days and register in `EventDetails.jsx` (Modal).

## Verification Results
- [x] Schema applied successfully.
- [x] Registration flow verified (User received email).
- [x] Admin reporting verified (Data visible in dashboard).
