# 05: Reward Catalog & Dynamic QR Coupon Generation

**What to build:**
Implement the reward redemption ecosystem in the LINE LIFF application:
- Interactive Reward Store displaying item cards (Image, Title, Description, Required Points, Stock Badge).
- Phone Number Gatekeeper (ADR-0001): If student attempts redemption without a registered phone number, displays modal to input phone before proceeding.
- Transaction handling: verifies sufficient points balance and available stock, deducts points, decrements stock by 1, and inserts coupon record (`status = 'ACTIVE'`).
- Dynamic QR Code Coupon display on student screen (QR code encodes unique verification token, displayed alongside item details with no expiry date).
- Student Redemption History tab showing active coupons and past redeemed items.

**Blocked by:**
04: LINE LIFF Student Portal & Profile Management

**Status:** completed

- [x] Reward catalogue UI with stock availability indicators
- [x] Phone requirement gatekeeper modal before redemption
- [x] Atomic transaction handling for point deduction and coupon creation
- [x] High-resolution dynamic QR code generator component for coupon presentation
- [x] Coupon list and history views for students
- [x] Integration tests for redemption balance checks and concurrent stock limits
