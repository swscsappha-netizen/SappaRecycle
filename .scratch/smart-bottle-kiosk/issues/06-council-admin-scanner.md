# 06: Council Admin QR Scanner & Instant Redemption Verification

**What to build:**
Create the Student Council Admin Scanner interface inside LINE LIFF:
- Access control verification checking `is_council_member = TRUE` on the active user record.
- In-app camera QR Code scanner using device camera (Html5Qrcode / BarcodeDetector).
- Coupon validation modal displaying student name, class room, reward item, and redemption status.
- Single-tap "Confirm Handover" action that atomically transitions coupon status to `REDEEMED`, sets `redeemed_at` and `redeemed_by_line_id`.
- Instant anti-reuse error banner when scanning an already redeemed or invalid QR code.

**Blocked by:**
05: Reward Catalog & Dynamic QR Coupon Generation

**Status:** completed

- [x] Role-based authorization gate for council admin views
- [x] Mobile camera scanner with target viewfinder and flashlight toggle
- [x] Coupon inspection and verification view
- [x] Atomic redemption confirmation and audit record update
- [x] Error prevention against used/invalid coupons
- [x] End-to-end scanner and status transition test suite
