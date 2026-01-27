# Implementation Plans Analysis - January 27, 2026

## Overview
Analysis of 17 implementation plans created on 2026-01-27 for the AERO Project event management system.

## Plans Categorized by Type

### 🏗️ **Foundation & Infrastructure** (4 Plans)
1. **Day Pass Tickets** - New ticket type with dynamic pricing
2. **Official Dinner Registrations** - Link dinner subevents to tickets
3. **Order Item Refunds** - Admin refund functionality with stock updates
4. **Cart and Invoice Updates** - Fix duplicates and enhance display

### 🛠️ **Bug Fixes** (3 Plans)
5. **Subevent Date Change Error** - Fix date reversion bug
6. **Camping Availability Report** - Fix 403 authentication error
7. **Dashboard Subevents Card** - Remove aggregate info

### ✨ **Feature Enhancements** (10 Plans)
8. **Pit Crew Tickets** - Add AUS number and flight line duties option
9. **Flight Line Roster Filtering** - Filter roster by flight line
10. **Air Show Registrations** - Update wording and add email opt-in
11. **Attendees List** - New comprehensive attendee management page
12. **Event Tickets Attendee Details** - Improve validation and UX
13. **Subevent Registrations** - Search all attendees or add guests
14. **Camping** - Default event selection and remove tooltip
15. **Merchandise Suppliers** - New supplier management system
16. **Asset Categories and Sorting** - Categorization and drag-drop sorting
17. **Variant Templates** - Enable editing of variant templates

---

## Dependency Analysis

### 🔗 **Critical Dependencies**

#### **Day Pass Tickets → Pit Crew Tickets**
- **Relationship**: Pit Crew plan explicitly references Day Pass plan
- **Note in Pit Crew Plan**: 
  > "Interaction with Day Pass Logic: Pit Crew tickets can also be Day Passes. If `is_day_pass = true`, the Day Pass Pricing Logic will apply."
- **Action Required**: ✅ Already documented in Pit Crew plan (lines 11-17)

#### **Official Dinner Registrations → Event Tickets Attendee Details**
- **Relationship**: Event Tickets plan mentions dinner attendance checkbox
- **Overlap**: Both plans modify attendee modal for dinner-related fields
- **Potential Conflict**: Dinner checkbox wording and logic
- **Resolution**: Implement Official Dinner first, then Event Tickets can refine the UX

#### **Cart and Invoice Updates → Multiple Plans**
- **Impacts**: Day Pass, Pit Crew, Official Dinner, Subevent Registrations
- **Reason**: All these add new item types or metadata that need display in cart/invoice
- **Recommendation**: Implement Cart Updates AFTER the feature plans, or keep generic enough to handle future metadata

### 📊 **Shared Components**

#### **AttendeeModal.jsx** (Modified by 4 plans)
1. Day Pass Tickets - Flight line duties visibility logic (Pilots only)
2. Pit Crew Tickets - AUS number and flight line duties (Pit Crew only)
3. Event Tickets Attendee Details - Validation, defaults, heavy model logic, dinner wording
4. Official Dinner Registrations (indirectly) - Related to dinner checkbox

**Conflict Potential**: 🔴 HIGH
**Resolution Strategy**: Implement in this order:
1. Day Pass (establishes `is_day_pass` logic)
2. Pit Crew (adds Pit Crew-specific logic alongside Pilot logic)
3. Official Dinner (adds dinner selection UI)
4. Event Tickets (refines all of the above + adds validation)

#### **SubeventModal.jsx** (Modified by 1 plan)
1. Subevent Registrations - Complete overhaul to search attendees or add guests

**Conflict Potential**: 🟢 LOW

#### **StorePage.jsx** (Modified by 4 plans)
1. Day Pass Tickets - Price calculation logic
2. Pit Crew Tickets - Uses Day Pass logic
3. Subevent Registrations - Add search function and pass to modal
4. Asset Categories - Grouping assets by category in display

**Conflict Potential**: 🟡 MEDIUM
**Resolution**: Asset Categories is mostly display logic (separate concern). Day Pass/Pit Crew share logic. Subevent is isolated to subevent flow.

---

## Detected Conflicts

### 🚨 **Critical Conflicts**

#### **1. AttendeeModal.jsx - Flight Line Duties Logic**
**Plans Involved**: Day Pass, Pit Crew
- **Day Pass Logic**: Show flight line checkbox if `system_role === 'pilot' && (!is_day_pass || duration >= 3)`
- **Pit Crew Logic**: Show flight line checkbox if `system_role === 'pit_crew' && licenseNumber.length > 0`
- **Conflict Type**: ✅ NO CONFLICT (different system_role conditions)
- **Note**: Plans already acknowledge this (Day Pass line 12, Pit Crew line 14-17)

#### **2. AttendeeModal.jsx - Dinner Checkbox Wording**
**Plans Involved**: Official Dinner, Event Tickets Attendee Details
- **Official Dinner**: Adds checkbox for "Add Official Dinner Entry?"
- **Event Tickets**: Changes wording to "I will be attending (tick if yes)"
- **Conflict Type**: 🟡 WORDING MISMATCH
- **Resolution**: 
  - Official Dinner plan targets `EventPurchase.jsx` (not modal) for the opt-in checkbox
  - Event Tickets targets the modal for a separate "attending dinner" field
  - These may be TWO DIFFERENT mechanisms:
    - **Official Dinner opt-in**: At ticket purchase time (EventPurchase.jsx)
    - **Dinner attendance confirmation**: In attendee details (AttendeeModal.jsx)
  - **Action**: Add clarification note to Official Dinner plan explaining the difference

#### **3. Cart/Invoice Display - Metadata Handling**
**Plans Involved**: Cart Invoice Updates vs. Day Pass, Pit Crew, Official Dinner, Subevent Registrations
- **Cart Invoice Updates**: Plans to add display logic for variants, dates, names
- **Other Plans**: Add NEW metadata types that aren't in current cart plan
- **Conflict Type**: 🟡 INCOMPLETE SCOPE
- **Resolution**: Update Cart Invoice plan to include:
  - Day Pass dates (arrival/departure)
  - Official Dinner flag
  - Guest names from Subevent Registrations

---

## Database Changes Summary

### Scripts Required (8 Plans)

| Plan | Tables Modified | Complexity |
|------|----------------|------------|
| Day Pass Tickets | `event_ticket_types` +`is_day_pass` | Low |
| Official Dinner | `events` +`official_dinner_subevent_id`<br>`event_ticket_types` +`includes_official_dinner` | Medium |
| Order Item Refunds | `order_items` +`refunded_at` | Low |
| Air Show Registrations | `public_registrations` +`subscribe_to_emails` | Low |
| Event Tickets Attendee Details | `persons` - enforce NOT NULL on 7 fields | High |
| Subevent Registrations | `subevent_registrations` - make `attendee_id` NULLABLE<br>add `guest_name` | Medium |
| Merchandise Suppliers | NEW `merchandise_suppliers` table<br>`products` +`supplier_id` | Medium |
| Asset Categories | NEW `asset_categories` table<br>`asset_types` +`asset_category_id`, +`sort_order` | High |

### Plans with NO DB Changes (9 Plans)
- Flight Line Roster Filtering
- Pit Crew Tickets
- Cart and Invoice Updates
- Dashboard Subevents Card
- Camping Availability Report
- Attendees List
- Subevent Date Change Error
- Camping
- Variant Templates

---

## Recommended Implementation Order

### 🥇 **Phase 1: Foundation & Critical Fixes** (Priority Order)
**Goal**: Establish core mechanisms and fix blocking bugs

1. **Camping Availability Report** 
   - **Why First**: Production bug (403 error), simple header fix
   - **Effort**: 🟢 30 mins
   - **Dependencies**: None
   - **DB Changes**: None

2. **Subevent Date Change Error**
   - **Why**: Bug fix, simple cache bypass
   - **Effort**: 🟢 1 hour
   - **Dependencies**: None
   - **DB Changes**: None

3. **Dashboard Subevents Card**
   - **Why**: Simple UI cleanup, no dependencies
   - **Effort**: 🟢 30 mins
   - **Dependencies**: None
   - **DB Changes**: None

4. **Day Pass Tickets** ⭐
   - **Why**: Foundation for Pit Crew tickets
   - **Effort**: 🟡 4-6 hours
   - **Dependencies**: None (but Pit Crew depends on this)
   - **DB Changes**: ✅ Run SQL first
   - **Notes**: Implement AttendeeModal logic carefully for Pilots

5. **Pit Crew Tickets** ⭐
   - **Why**: Depends on Day Pass, should follow immediately
   - **Effort**: 🟡 3-4 hours
   - **Dependencies**: ✅ Day Pass Tickets
   - **DB Changes**: None
   - **Notes**: Add Pit Crew-specific logic alongside Day Pass logic

---

### 🥈 **Phase 2: User-Facing Enhancements** (Parallel Safe)
**Goal**: Improve UX and add requested features

6. **Air Show Registrations**
   - **Why**: Simple change, independent
   - **Effort**: 🟢 1-2 hours
   - **Dependencies**: None
   - **DB Changes**: ✅ Run SQL first

7. **Flight Line Roster Filtering**
   - **Why**: Client-side filtering, simple enhancement
   - **Effort**: 🟢 2 hours
   - **Dependencies**: None
   - **DB Changes**: None

8. **Camping**
   - **Why**: UX improvements, low risk
   - **Effort**: 🟢 1-2 hours
   - **Dependencies**: None
   - **DB Changes**: None

---

### 🥉 **Phase 3: Official Dinner & Attendee Management** (Sequential)
**Goal**: Add dinner registration and improve attendee data quality

9. **Official Dinner Registrations** ⭐
   - **Why**: Foundation for Event Tickets plan
   - **Effort**: 🟡 4-5 hours
   - **Dependencies**: None
   - **DB Changes**: ✅ Run SQL first
   - **Notes**: Implement in EventPurchase.jsx (not AttendeeModal)

10. **Event Tickets Attendee Details** ⭐
    - **Why**: Refinement of all previous attendee logic
    - **Effort**: 🔴 6-8 hours
    - **Dependencies**: Day Pass, Pit Crew, Official Dinner
    - **DB Changes**: ✅ Run SQL first (NOT NULL enforcement - risky!)
    - **Notes**: This is a REFINEMENT pass, should be done after Day Pass, Pit Crew, and Official Dinner are stable

11. **Attendees List**
    - **Why**: New admin tool, independent but benefits from clean data
    - **Effort**: 🟡 5-6 hours
    - **Dependencies**: Ideally after Event Tickets Attendee Details (ensures clean data)
    - **DB Changes**: None

---

### 🏅 **Phase 4: Order Management & Display** (After Core Features)
**Goal**: Enhance order handling and display

12. **Order Item Refunds**
    - **Why**: New admin feature, independent
    - **Effort**: 🟡 4-5 hours
    - **Dependencies**: None (but benefits from Cart Updates being done after)
    - **DB Changes**: ✅ Run SQL first

13. **Cart and Invoice Updates** ⭐
    - **Why**: Should be done AFTER all feature plans that add metadata
    - **Effort**: 🔴 6-8 hours
    - **Dependencies**: Ideally after Day Pass, Pit Crew, Official Dinner, Subevent Registrations
    - **DB Changes**: None (backend query changes only)
    - **Notes**: Update scope to include all new metadata types from other plans

---

### 🎖️ **Phase 5: Advanced Features** (Independent, Can Be Deferred)
**Goal**: Add sophisticated management tools

14. **Subevent Registrations**
    - **Why**: Independent feature, complex
    - **Effort**: 🔴 6-8 hours
    - **Dependencies**: None
    - **DB Changes**: ✅ Run SQL first
    - **Notes**: Security consideration - allows searching all attendees

15. **Merchandise Suppliers**
    - **Why**: New system, independent
    - **Effort**: 🟡 5-6 hours
    - **Dependencies**: None
    - **DB Changes**: ✅ Run SQL first

16. **Asset Categories and Sorting**
    - **Why**: Complex feature, drag-drop implementation
    - **Effort**: 🔴 8-10 hours
    - **Dependencies**: None
    - **DB Changes**: ✅ Run SQL first
    - **Notes**: Uses @dnd-kit library (already in project for merchandise)

17. **Variant Templates**
    - **Why**: Enhancement of existing feature, low priority
    - **Effort**: 🟡 4-5 hours
    - **Dependencies**: None
    - **DB Changes**: None

---

## Action Items

### 📝 **Cross-Reference Notes to Add**

#### **Official Dinner Registrations Plan**
Add this note to the User Review Required section:

> [!NOTE]
> **Separation of Concerns**: This plan adds the "opt-in" checkbox at ticket purchase time (in `EventPurchase.jsx`). The `AttendeeModal.jsx` already has a separate "attending official dinner" confirmation field that will be refined by the [Event Tickets Attendee Details](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_event_tickets_attendee_details.md) plan. These are two different mechanisms:
> - **This plan**: Offers the option to add the subevent to cart during ticket purchase
> - **Event Tickets plan**: Collects dietary requirements and confirms attendance in attendee details

#### **Cart and Invoice Updates Plan**
Add this note to the Proposed Changes section:

> [!IMPORTANT]
> **Scope Expansion Required**: This plan should be implemented AFTER the following plans to ensure all new metadata types are included:
> - [Day Pass Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_day_pass_tickets.md) - Adds arrival/departure dates to tickets
> - [Pit Crew Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_pit_crew_tickets.md) - Shares Day Pass logic
> - [Official Dinner Registrations](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_official_dinner_registrations.md) - Adds dinner indicator
> - [Subevent Registrations](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_subevent_registrations.md) - Adds guest names
>
> Update the backend query and frontend display to handle:
> - Ticket dates for Day Pass tickets
> - "Includes Official Dinner" indicator
> - Guest names for subevents (when `attendee_id` is NULL)

#### **Event Tickets Attendee Details Plan**
Add this note to the User Review Required section:

> [!WARNING]
> **Implementation Order Critical**: This plan is a REFINEMENT pass over the attendee modal. It should be implemented AFTER the following plans are stable:
> - [Day Pass Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_day_pass_tickets.md) - Establishes `is_day_pass` logic
> - [Pit Crew Tickets](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_pit_crew_tickets.md) - Adds Pit Crew-specific fields
> - [Official Dinner Registrations](file:///c:/laragon/www/AERO-Project/docs/implementation_plans/20260127_official_dinner_registrations.md) - Adds dinner opt-in
>
> The dinner wording change in this plan ("I will be attending") applies to the attendee details confirmation field, which is separate from the ticket purchase opt-in added by the Official Dinner plan.

---

## Risk Assessment

### 🔴 **High Risk Plans**
1. **Event Tickets Attendee Details** - NOT NULL enforcement on production data, multiple overlapping changes
2. **Cart and Invoice Updates** - Touches critical checkout flow, duplicate bug investigation
3. **Asset Categories and Sorting** - Complex drag-drop, new table relationships

### 🟡 **Medium Risk Plans**
1. **Day Pass Tickets** - New pricing model, complex logic
2. **Subevent Registrations** - Database schema change to nullable FK, security implications
3. **Official Dinner Registrations** - Multiple integration points

### 🟢 **Low Risk Plans**
1. Bug fixes (Camping Report, Subevent Date, Dashboard)
2. Simple enhancements (Air Show, Flight Line Filter, Camping UX)
3. Independent features (Attendees List, Merchandise Suppliers, Variant Templates)

---

## Testing Strategy

### Pre-Implementation
- [ ] Run all SQL scripts on DEV environment first
- [ ] Backup production database before running Event Tickets NOT NULL script

### Per-Phase Testing
- [ ] Phase 1: Test Day Pass + Pit Crew together thoroughly
- [ ] Phase 3: Test Official Dinner → Event Tickets → Attendees List as a flow
- [ ] Phase 4: Test Cart/Invoice with all new item types from Phases 1-3

### Integration Testing
- [ ] After Phase 3: Create test order with Day Pass, Pit Crew, Official Dinner
- [ ] After Phase 4: Verify cart and invoice display all metadata correctly
- [ ] After Phase 5: Test subevent registration with both attendee search and guest name

---

## Estimated Timeline

| Phase | Plans | Effort | Duration |
|-------|-------|--------|----------|
| Phase 1 | 5 plans | 9-14 hours | 2-3 days |
| Phase 2 | 3 plans | 4-6 hours | 1 day |
| Phase 3 | 3 plans | 15-19 hours | 3-4 days |
| Phase 4 | 2 plans | 10-13 hours | 2-3 days |
| Phase 5 | 4 plans | 23-29 hours | 4-5 days |
| **TOTAL** | **17 plans** | **61-81 hours** | **12-16 days** |

*Assuming 5-6 productive hours per day*

---

## Summary

✅ **No Critical Conflicts** - Plans are well-designed with awareness of each other

🔗 **Clear Dependencies** - Day Pass → Pit Crew, Official Dinner → Event Tickets

📊 **Shared Components Identified** - AttendeeModal.jsx needs careful sequential implementation

🎯 **Recommended Approach**: 
1. Start with Phase 1 (bugs + foundation)
2. Implement Day Pass + Pit Crew as a unit
3. Implement Official Dinner + Event Tickets as a unit
4. Update Cart/Invoice after all features are in
5. Add advanced features (Phase 5) as time permits

⚠️ **Critical Notes**:
- Add cross-reference notes to 3 plans (Official Dinner, Cart Updates, Event Tickets)
- Event Tickets Attendee Details NOT NULL changes need careful production testing
- Cart and Invoice Updates scope should expand to include all new metadata types
