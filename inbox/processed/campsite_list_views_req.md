# Campsite Bookings - List Views & Reserved Status

**Source**: Dave's Call (2026-01-20)

**Requirement 1: Admin Visibility**
- Dave wants to see which sites are reserved.
- *Agent Note*: This seems covered by `docs/implementation_plans/camping_list_and_reporting.md`.

**Requirement 2: Public List View**
- **New Feature**: A "List View" for booking campsites (alternative to Map).
- **Behavior**:
    - Show ALL sites (not just available ones).
    - If a site is reserved for the selected date range:
        - Display as "Reserved" / "Unavailable".
        - Greyed out (disabled).
    - If available:
        - Clickable / Bookable.

**Context**:
- Implementation Plan `camping_list_and_reporting.md` already exists but might need updating to explicitly mention showing *blocked* sites in the public list (original plan might have implied only showing available).
