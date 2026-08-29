# ADR 0011: Student Identity Dispute Resolution & Administrative LINE Unlink

## Status
Accepted (2026-08-30)

## Context
When students bind their LINE Account with their 5-digit student ID (`student_id`) on first login, there is a possibility that a student might accidentally enter another student's ID or maliciously attempt to claim another student's account.

Without a dispute resolution mechanism, a victim whose ID was claimed by someone else would be locked out from binding their rightful LINE account.

## Decision
We implemented a two-part security and dispute resolution architecture:

1. **Client-side Conflict Detection & Lockout Guard (`web-liff/app.js`)**:
   - During first-time registration, when the user inputs a 5-digit student ID, `lookupStudentForBinding()` inspects `data.line_user_id`.
   - If `data.line_user_id` is already assigned to a different LINE User ID (`data.line_user_id !== currentLineProfile.userId`), the binding button is strictly disabled with the message:
     `⚠️ รหัสนักเรียนนี้ถูกผูกบัญชี LINE ไปแล้ว หากมีคนแอบอ้างหรือทำโทรศัพท์หาย กรุณาติดต่อสภานักเรียนเพื่อขอปลดล็อก`

2. **Administrative LINE Unlink in Backoffice (`web-liff/admin.html`, `web-liff/admin.js`)**:
   - Authorized Student Council Admins (`32650`) can search any student in the 2,906 Student Roster table.
   - The roster table displays real-time badges: `ผูก LINE แล้ว 🔗` vs `ยังไม่ผูก LINE`.
   - Inside the Student Editor modal, an Admin can click `[🔓 ปลดล็อก / ยกเลิกการผูกบัญชี LINE (Unlink LINE)]`.
   - This executes `UPDATE public.students SET line_user_id = NULL WHERE student_id = ...`.
   - The rightful student can immediately open LINE LIFF and bind their official account.

## Consequences
- **Positive**: Complete administrative control to recover student accounts from impostors, lost phones, or account transfers.
- **Positive**: Zero data loss — points accumulated from physical recycling remain safely attached to the student ID record.
