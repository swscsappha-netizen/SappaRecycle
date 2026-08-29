# ADR 0006: LINE Role-Based Access Control (RBAC) for Admin Backoffice

## Status
Accepted

## Context
The Standalone Backoffice Dashboard (`admin.html`) possesses sensitive capabilities: modifying student point balances, creating reward vouchers, and updating school reward inventory. Unauthorized student access must be strictly prevented.

## Decisions
1. **Automated LINE Identity & Role Verification**:
   - When accessing `admin.html`, the system verifies the user's identity via LINE LIFF SDK / Supabase.
   - The user's account must satisfy `students.is_council_member = TRUE`.
2. **Hard-Blocked Access Denied Shield**:
   - If `is_council_member === false` or the user is unauthenticated, the dashboard DOM is strictly unmounted/hidden.
   - A full-screen **Access Denied Dialog (403 Forbidden)** is rendered with an immediate redirect button back to `index.html`.
3. **Audit Badge on Header**:
   - For authorized administrators, the top header visibly displays the authenticated Admin Name and Student Council badge.

## Consequences
- **Positive**: Zero risk of unauthorized students modifying points or stealing rewards.
- **Positive**: Seamless single sign-on experience for teachers and council leads via LINE.
