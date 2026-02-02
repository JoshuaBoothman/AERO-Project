# Critical Lint Errors - Fix Plan

**Goal**: Fix 43 critical ESLint errors that can cause runtime crashes, state corruption, and application failures.

## User Review Required

> [!IMPORTANT]
> These are **critical fixes** that address fundamental React violations and runtime errors. The changes are necessary to prevent:
> - Component crashes due to Hook rule violations
> - State corruption from conditional Hook calls
> - Script failures from undefined variables
> - Silent UI bugs from state mutation

**Risk Assessment:**
- **Low Risk**: Most fixes involve restructuring component logic without changing functionality
- **Testing Required**: Manual verification of affected pages after fixes
- **No Breaking Changes**: All fixes maintain existing behavior

## Proposed Changes

### Frontend (Client)

#### [MODIFY] [CampingPage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/CampingPage.jsx)

**Issue**: Multiple React Hook rule violations (3+ occurrences on lines 45, 70, 133+)

**Current Problem:**
```javascript
// ❌ DANGEROUS - Early return before hooks
if (!user) return null;
useEffect(() => { /* ... */ }); // Hook called conditionally!
```

**Fix Strategy:**
1. Move all `useState` and `useEffect` calls to the top of the component
2. Move conditional returns (`if (!user) return null;`) AFTER all Hook declarations
3. Ensure Hooks are always called in the same order

**Changes:**
- Lines 45, 70, 133: Restructure to call all Hooks before any early returns
- Add loading state to handle async operations before rendering

---

#### [MODIFY] [NotificationContext.jsx](file:///c:/laragon/www/AERO-Project/client/src/context/NotificationContext.jsx)

**Issue**: React Hook violations in context provider

**Fix Strategy:**
- Audit all Hook calls
- Ensure no conditional Hook usage
- Move any conditional logic inside Hook callbacks (not around Hook calls)

---

#### [MODIFY] [AttendeesList.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AttendeesList.jsx)

**Issue**: Unused variable `e` in catch block (line 100)

**Current:**
```javascript
} catch (e) { console.error(e); }
```

**Fix:**
```javascript
} catch (err) { console.error(err); }
```

**Note:** This is cosmetic but clean - OR suppress the warning:
```javascript
} catch (e) { console.error('Failed to fetch ticket types:', e); }
```

---

### Scripts

#### [MODIFY] [create-admin.js](file:///c:/laragon/www/AERO-Project/client/scripts/create-admin.js)

**Issue**: 3 `no-undef` errors - Using Node.js `require` without proper ESLint config

**Fix Strategy:**
Add ESLint override comment at top of file:

```javascript
/* eslint-env node */
const sql = require('mssql');
const readline = require('readline');
// ... rest of script
```

**Alternative Fix:**
Create `.eslintrc.js` in `/scripts` folder:
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true
  },
  rules: {
    'no-undef': 'off' // Scripts use Node globals
  }
};
```

---

### Immutability Violation (1 occurrence)

**Status**: Need to scan for exact location

**Search Strategy:**
```bash
npx eslint . --no-color 2>&1 | grep -i "immutability"
```

**Typical Pattern:**
```javascript
// ❌ Direct mutation
setState(state.property = newValue);

// ✅ Correct immutable update
setState({ ...state, property: newValue });
```

**Action**: Once located, replace with spread operator or immutability helper

---

### Additional Hook Violations

**Other Admin Pages**: Several admin pages have similar Hook rule violations

**Common Pattern to Fix:**
1. Identify early returns
2. Move all Hooks above early returns
3. Use loading/error states to conditionally render content instead of early returns

**Files to Audit:**
- `src/pages/admin/AdminDashboard.jsx`
- `src/pages/admin/FlightLineRoster.jsx`
- `src/pages/admin/EventForm.jsx`
- Any file showing `react-hooks/rules-of-hooks` errors

---

## Verification Plan

### Automated Tests

```bash
# Run lint to verify all critical errors are fixed
cd client
npm run lint

# Expected: No errors with rules:
# - react-hooks/rules-of-hooks
# - no-undef
# - react-hooks/immutability
```

### Manual Verification

1. **CampingPage.jsx**:
   - Navigate to `/store` → Select event with camping
   - Verify camping availability loads correctly
   - Test booking flow end-to-end
   - Verify no console errors related to Hooks

2. **Admin Script**:
   ```bash
   node client/scripts/create-admin.js
   ```
   - Should run without errors
   - Verify it prompts for admin details

3. **NotificationContext**:
   - Test notification system (confirm dialogs, toasts)
   - Verify no Hook-related console errors

4. **All Fixed Pages**:
   - Load each page modified
   - Check browser console for React warnings
   - Verify functionality unchanged

### Regression Testing

- **Critical User Flows**:
  - [ ] Ticket purchase flow
  - [ ] Camping booking flow
  - [ ] Admin dashboard access
  - [ ] Creating admin users via script

---

## Implementation Order

1. **Quickest Win**: Fix `create-admin.js` (30 seconds - add eslint comment)
2. **High Impact**: Fix `CampingPage.jsx` (15 minutes - restructure Hooks)
3. **Context Fix**: Fix `NotificationContext.jsx` (10 minutes)
4. **Cleanup**: Fix unused variable in `AttendeesList.jsx` (1 minute)
5. **Deep Scan**: Find and fix immutability violation (10 minutes)
6. **Remaining**: Fix other admin page Hook violations (20 minutes)

**Total Estimated Time**: 60-90 minutes

---

## Risk Mitigation

- **Backup**: Ensure git commit before starting
- **Incremental**: Fix and test one file at a time
- **Verification**: Run lint after each file fix
- **Rollback Plan**: `git checkout -- <file>` if issues arise

---

## Success Criteria

- [ ] All 39 `react-hooks/rules-of-hooks` errors resolved
- [ ] All 3 `no-undef` errors in scripts resolved  
- [ ] 1 `react-hooks/immutability` error resolved
- [ ] `npm run lint` shows 0 critical errors
- [ ] All manual verification tests pass
- [ ] No new console errors in browser
