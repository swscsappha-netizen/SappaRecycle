# 22. LINE Profile Synchronization & Kiosk Avatar Integration

Date: 2026-08-30

## Status

Accepted

## Context

When students use the Smart Recycling Kiosk, those who have bound their account via the LINE LIFF app (`web-liff/`) already have an authenticated LINE Identity (`line_user_id`, LINE display name, and LINE avatar photo).
Previously, the Kiosk UI only displayed a generic CSS room badge (`[5/10]`) without reflecting the student's personal LINE avatar or LINE connection status.

The school and student council requested that the Kiosk UI dynamically detect if the student is LINE-linked, and display their real **LINE Profile Avatar Photo** and **LINE Verified Badge (`LINE เชื่อมต่อแล้ว 🟢`)** directly on the Kiosk UI deposit screen and summary screen.

## Decision

1. **Schema & Model Mapping**:
   - In `types.ts`, extend `Student` with:
     - `lineUserId?: string` (LINE UID e.g. `U203ff6...`)
     - `linePictureUrl?: string` (LINE avatar picture URL or verified avatar)
     - `lineDisplayName?: string` (LINE nickname)
     - `isLineLinked?: boolean` (True if `line_user_id` is populated)
2. **Supabase Cloud Retrieval (`supabase.ts`)**:
   - `fetchStudentFromSupabase(studentId)` reads `line_user_id`.
   - If `line_user_id` is present, `isLineLinked` is flagged as `true`, and avatar URL is assigned with fallback LINE avatar styling.
3. **Kiosk UI Student Profile Card (`ScreenDeposit.tsx` & `ScreenSummary.tsx`)**:
   - If `student.isLineLinked` is true:
     - Render circular/squircle LINE avatar photo with a green LINE indicator badge (💬 🟢).
     - Display a tag: `[ LINE เชื่อมต่อแล้ว 🟢 ]`.
   - If false:
     - Render default room gradient avatar with `[ ยังไม่ผูก LINE ⚪ ]` and encourage student to scan QR to bind LINE for real-time deposit notifications.

## Consequences

- **Positive**: Students receive instant visual confirmation of their LINE connection upon typing their 5-digit PIN at the kiosk.
- **Positive**: Drives high student engagement and incentives for linking their LINE accounts to receive instant point alerts and digital reward coupons.
- **Resilient**: Gracefully falls back to gradient badges for students who haven't registered on LINE yet without disrupting kiosk operations.
