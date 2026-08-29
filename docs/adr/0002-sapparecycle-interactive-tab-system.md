# ADR 0002: SappaRecycle Interactive Multi-View Architecture & Dynamic State Synchronization

## Status
Accepted

## Context
Students and Student Council members at Sapphawitthayakhom School interact with the SappaRecycle Web App across 4 distinct primary domains:
1. **Home Dashboard (`tab-home`)**: Point balance checking, recycling progress tracking, and recent activity inspection.
2. **Reward Catalog (`tab-rewards`)**: Category filtering, stock availability checks, and reward redemption.
3. **Coupon Vault (`tab-coupons`)**: Active vs Redeemed coupon inspection, QR Code generation, and presenting vouchers for redemption.
4. **Student Profile (`tab-profile`)**: Progressive phone registration (ADR-0001) and council authorization elevation.
5. **Council Scanner (`view-scanner`)**: High-speed camera QR code verification and atomic voucher handover.

## Decisions
1. **Single-Page Application (SPA) State Switching**:
   - Maintain client-side active tab state (`currentTab`) synchronized with both DOM classes and bottom navigation tactile indicators.
   - Use CSS-accelerated display states with Material 3 squishy active button effects.
2. **Category-Driven Filter Streams**:
   - Both the Home history view and the Reward store support instant category filtering (`all`, `stationery`, `food`, `merchandise`, `PET`, `CAN`).
3. **Two-Way Supabase Synchronization**:
   - Phone updates in `tab-profile` or in the `modal-phone-required` dialog immediately update the Supabase `students` table via REST/RPC.
   - Redemptions immediately invoke `redeem_reward_coupon` stored procedure, deduct stock and balance, generate a unique `CPN-` token, render the QR code on HTML5 Canvas, and push to the active coupons list.
4. **Anti-Tamper Council Scanner**:
   - Council members can switch to `view-scanner` directly from the bottom bar or profile.
   - Handover transitions are atomic via `confirm_coupon_handover`.

## Consequences
- **Positive**: 100% of screens and buttons are interactive, responsive, and tactile with immediate visual and sound/confetti feedback.
- **Positive**: Compliant with ADR-0001 phone gatekeeper requirement.
