# 07: Kiosk Ultrasonic Bin-Full Monitoring & End-to-End Integration

**What to build:**
Implement bin capacity monitoring on the Kiosk and complete system integration:
- Ultrasonic sensor monitoring loop for PET and CAN bins with configurable warning threshold ($< 10\text{ cm}$ remaining clearance).
- On-screen visual alert banner on Kiosk UI when bins near full capacity.
- End-to-End integration test validating the entire student journey:
  1. Student enters ID and deposits PET bottles (+10 pts each) & CANs (+20 pts each) at Kiosk.
  2. Points reflect instantly in database and on student's LINE LIFF portal.
  3. Student browses reward store and redeems an item for a Dynamic QR Coupon.
  4. Council member opens scanner, validates QR code, and marks coupon `REDEEMED`.
  5. Stock decrements, points remain deducted, and coupon cannot be reused.

**Blocked by:**
03: Kiosk Sorting Engine & Mock/Real Hardware Simulator
06: Council Admin QR Scanner & Instant Redemption Verification

**Status:** completed

- [x] Ultrasonic bin level checking service with visual warning on Kiosk UI
- [x] Automated end-to-end integration test covering the entire deposit-to-redemption lifecycle
- [x] Hardware controller deployment scripts for Raspberry Pi 4
- [x] Production build and comprehensive test suite execution
