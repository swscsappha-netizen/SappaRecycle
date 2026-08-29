# ADR 0010: Strict LINE OAuth Authentication & Identity Enforcement

## Status
Accepted (Implemented & Verified)

## Context
In the Smart Bottle Recycling Kiosk & Voucher System at Sapphawitthayakhom School, student balances, coupons, and physical prize redemptions carry tangible real-world value.

Allowing unauthenticated users on public web browsers to simply input a 5-digit Student ID presents impersonation risks where third parties could inspect balances or trigger unauthorized operations.

## Decision
Enforce **Strict LINE OAuth Authentication (Strict LIFF Mode)** across the client application:

1. **Mandatory LINE OAuth Guard (`liff.login()`)**:
   - On application startup, `liff.init({ liffId: window.APP_CONFIG.LIFF_ID })` runs.
   - If `!liff.isLoggedIn()`, the app immediately triggers `liff.login()` to initiate the official LINE OAuth consent handshake.
   - On mobile within the LINE in-app browser, login is silent and automatic.
   - On external browsers (desktop/mobile Chrome/Safari), LINE prompts for QR Code or Email/Password authorization.

2. **Immutable LINE Profile Association (`line_user_id`)**:
   - Access to student balance and coupons is granted **strictly** when the user's cryptographically signed `line_user_id` matches a registered record in `public.students`.
   - First-time users bind their 5-digit Student ID through `#modal-line-bind` once, permanently linking their LINE account to their official student record.

3. **Elimination of Arbitrary ID Bypass**:
   - All unauthenticated standalone web login modals (`#modal-web-login`) and client-side account switches are removed from the production bundle.

## Consequences
- **Zero Impersonation**: No student or outsider can impersonate another student without possession of their authenticated LINE account.
- **Auditability**: Every recycle transaction and coupon redemption is traceable to a verified LINE identity.
- **Consistent UX**: Seamless, frictionless single-sign-on (SSO) for 2,906 students inside LINE.
