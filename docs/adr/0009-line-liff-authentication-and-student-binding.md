# ADR 0009: LINE LIFF Authentication & First-Time Student Account Binding Architecture

## Status
Accepted (Implemented & Verified)

## Context
The Smart Bottle Recycling Kiosk & Reward System at Sapphawitthayakhom School requires that students access their personal balance, recycling transaction logs, and voucher wallet through LINE LIFF (`https://liff.line.me/2011161264-kB7McE5S`).

However, before a student can accumulate points and claim rewards:
1. The student's LINE account (`line_user_id`) must be linked to their verified 5-digit Student ID from the official 2,906 school roster in Supabase (`public.students`).
2. The system must support automatic login on subsequent visits without re-prompting.
3. The system must support role-based permission derivation (`is_council_member === true`) directly from the linked student record.

## Decision

### 1. LINE LIFF Lifecycle & Auto-Login Flow
When a user opens the LIFF app:
1. `liff.init({ liffId: APP_CONFIG.LIFF_ID })`:
   - If running inside the LINE in-app browser and not yet authorized $\rightarrow$ `liff.login()` triggers the LINE OAuth consent flow.
   - If authorized $\rightarrow$ `liff.getProfile()` retrieves `userId`, `displayName`, and `pictureUrl`.
2. **Supabase Student Identity Resolution**:
   - Query `public.students` where `line_user_id = profile.userId`.
   - **Case A (Existing Linked User)**: Immediately load student data, populate header avatar, render balance and transactions.
   - **Case B (First-Time User)**: Open the **First-Time LINE Account Binding Modal (`#modal-line-bind`)**.

### 2. First-Time Account Binding Modal (`#modal-line-bind`)
1. Displays the student's LINE profile picture and display name.
2. Prompts the student to enter their **5-Digit Student ID** (`#line-bind-student-id`).
3. **Live Roster Lookup**: When 5 digits are entered, queries Supabase in real-time to preview the student's Full Name, Classroom (`room`), and Class Number (`no`) to prevent binding errors.
4. Prompts for Mobile Phone Number (`#line-bind-phone`).
5. On clicking **`ยืนยันผูกบัญชี LINE เข้าใช้งาน 🔗`**:
   - Updates `public.students` with `line_user_id = profile.userId` and `phone_number = phone`.
   - Fires celebratory confetti animation and transitions into the main app seamlessly.

### 3. Fallback & Web Development Mode
If accessed outside LINE (e.g. Chrome / Desktop browser for development testing), the application parses `?student_id=...` from the URL parameters (defaults to `32650` for administrative operations).

## Consequences
- **Zero Password Friction**: Students never have to remember passwords; authentication is completely managed via LINE OAuth.
- **Data Integrity**: Every LINE account binds to exactly one verified record in the 2,906 student dataset.
- **Security**: Backoffice admin access (`admin.html`) securely verifies that `is_council_member === true` on the linked LINE profile.
