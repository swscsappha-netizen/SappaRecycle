# ADR 0005: Standalone Admin Backoffice Dashboard for SappaRecycle

## Status
Accepted

## Context
Administrators, teachers, and Student Council directors at Sapphawitthayakhom School require a comprehensive, responsive desktop-and-mobile web dashboard (`admin.html`) to manage:
1. **Reward Catalog & Inventory**: Adding new reward items, editing point costs, replenishing stock quantities, and deactivating/deleting rewards.
2. **Student Accounts & Points**: Searching any student across the 2,906-record roster and adjusting point balances.
3. **Coupon Vault Management**: Issuing custom coupons to students, monitoring redemption statuses, and voiding invalid coupons.
4. **School Recycling Metrics**: Inspecting total bottles/cans recycled and overall ecological impact.

## Decisions
1. **Dedicated Web Dashboard Endpoint**:
   - Provide `web-liff/admin.html` as an independent, fully-featured backoffice dashboard.
   - Connect directly to the Supabase Cloud backend (`socuwjwndvbfjxafnolx.supabase.co`) with realtime synchronization.
2. **Comprehensive 3-Pillar UI Architecture**:
   - **Pillar 1 (Rewards)**: Full CRUD on `rewards` table (Insert, Update Stock, Edit Points, Toggle Active, Delete).
   - **Pillar 2 (Students)**: Search, view metrics, and adjust `students.current_points` and phone numbers.
   - **Pillar 3 (Coupons)**: Query, issue new vouchers, toggle redemption status, and delete from `coupons` table.
3. **Cross-Platform Responsive Design**:
   - Built with Tailwind CSS and modern Material Design 3 Kawaii Eco aesthetic, fully responsive on PC, laptop, iPad, and smartphone screens.

## Consequences
- **Positive**: Complete administrative autonomy for school staff without requiring direct database access.
- **Positive**: Instant bi-directional synchronization with student LINE LIFF clients.
