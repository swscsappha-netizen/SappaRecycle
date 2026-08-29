# ADR 0004: Admin Portal for Point Adjustments and Coupon Management

## Status
Accepted

## Context
Administrators, teachers, and Student Council leaders need a centralized, direct administrative interface within the Web App to:
1. Search and view student account profiles (from the 2,906 student roster).
2. Adjust student point balances (grant bonus points, deduct penalties, or rectify discrepancies).
3. Issue new reward coupons manually to specific students.
4. Delete or void erroneous coupons.
5. Override coupon statuses (`ACTIVE` $\leftrightarrow$ `REDEEMED`).

## Decisions
1. **Direct Dev Bar & Profile Integration**:
   - Access the Admin Portal via a red `🛠️ Admin Portal` shortcut button in the top Dev bar and via the Student Profile when authorized.
2. **Two Core Operational Domains**:
   - **Domain 1: Student Points & Roster Editor**:
     - Instant lookup by 5-digit Student ID.
     - Quick adjustments (`+50`, `+100`, `+500`, `-50`, `-100`) and arbitrary point setter.
     - Direct atomic update against Supabase `students.current_points`.
   - **Domain 2: Coupon Issuer & Void Manager**:
     - Query live coupons by student or list recent coupons.
     - Issue coupon with unique `CPN-` code and chosen reward ID.
     - Delete / void coupon directly from Supabase `coupons`.
     - Toggle redemption status.
3. **Real-Time Client State Refresh**:
   - Whenever an admin modifies a student's points or coupons, the active student session and store counters refresh instantly.

## Consequences
- **Positive**: Complete administrative control without requiring SQL console access.
- **Positive**: Immediate auditability and troubleshooting capability during school operations.
