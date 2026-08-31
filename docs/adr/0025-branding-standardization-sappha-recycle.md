# ADR 0025: การกำหนดมาตรฐานชื่อระบบและเว็บไซต์เป็น "Sappha Recycle" (Branding Standardization)

## สถานะ (Status)
**อนุมัติและบังคับใช้ (Approved & Implemented)** — 31 สิงหาคม 2569

---

## บริบท (Context)
แต่เดิมในระบบมีการใช้ชื่อแบรนด์และชื่อเว็บไซต์หลากหลายรูปแบบ เช่น `SappaRecycle`, `Sappa Recycle`, `ตู้รีไซเคิลอัจฉริยะ` ส่งผลให้การสื่อสารภาพลักษณ์โครงการระหว่างตู้คีออส (Kiosk Touchscreen), เว็บแอปพลิเคชันนักเรียน (LINE LIFF Web App), และระบบหลังบ้านแอดมิน (Admin Backoffice) ยังไม่เป็นเอกภาพ

ผู้ใช้งานได้ออกคำสั่ง `/grill-with-docs` เพื่อปรับเปลี่ยนชื่อแบรนด์และชื่อเว็บไซต์ทั้งหมดให้เป็นมาตรฐานเดียวกัน คือ **`Sappha Recycle`** (สรรพ รีไซเคิล) โดยสะกดด้วยตัวอักษร **"Sappha"** ซึ่งสอดคล้องกับการสะกดชื่อโรงเรียนสรรพวิทยาคมในภาษาอังกฤษ (Sapphawitthayakhom)

---

## การตัดสินใจทางสถาปัตยกรรม (Architectural Decisions)

### 1. การกำหนดชื่อแบรนด์มาตรฐาน (Unified Brand Identity)
* **ชื่อแบรนด์หลัก (Primary Brand):** `Sappha Recycle`
* **สโลแกนและคำอธิบาย:** ระบบสะสมแต้มรักษ์โลก โรงเรียนสรรพวิทยาคม
* **ขอบเขตการบังคับใช้:** 
  1. **LINE LIFF Web App (`web-liff/index.html`):** Page `<title>`, Splash Screen, Navbar Header, และ Welcome Dialogs
  2. **Admin Backoffice (`web-liff/admin.html`):** Page `<title>`, Top Bar Brand Logo & Title (`Sappha Recycle Admin`)
  3. **Kiosk Touchscreen UI (`kiosk-ui/`):** Header Navbar (`Header.tsx`), Mascot Cheering Welcome Screen (`ScreenWelcome.tsx`), คู่มือการใช้งาน (`GuideModal.tsx`), และ HTML Title (`kiosk-ui/index.html`)
  4. **Root Portal (`index.html`):** Page `<title>` และหน้าเปลี่ยนเส้นทาง (Redirect Screen)
  5. **Glossary & Project Documentation (`docs/glossary.md`):** ปรับแก้คำศัพท์นิยามระบบ

### 2. ขอบเขตที่คงเดิมเพื่อความเข้ากันได้ทางเทคนิค (Backward Compatibility)
* **ฐานข้อมูล (Database Schema & API):** ไม่มีการเปลี่ยนชื่อตาราง คอลัมน์ หรือ RPC Functions ใน Supabase เพื่อป้องกันปัญหา Breaking Changes กับข้อมูลเดิม
* **Repository & Packages:** ชื่อ Package ภายใน `package.json` ยังคงรักษารูปแบบ Semantic naming เดิมเพื่อความปลอดภัยของ Dependencies

---

## ผลกระทบ (Consequences)

### ข้อดี (Positive Impact)
1. **ภาพลักษณ์แบรนด์เป็นเอกภาพ:** ทุก Touchpoint (เว็บ LIFF, จอตู้คีออส, ระบบแอดมิน) ใช้ชื่อ **`Sappha Recycle`** อย่างถูกต้องและตรงกับชื่อภาษาอังกฤษของโรงเรียนสรรพวิทยาคม
2. **ความชัดเจนในการนำเสนอโครงงาน:** ผู้ประเมิน คณะกรรมการ และนักเรียนจดจำชื่อโครงการได้อย่างถูกต้อง
3. **ไม่มีผลกระทบต่อความเสถียรของระบบ:** เป็นการปรับปรุงในระดับ UI Layer และ Documentation จึงปลอดภัย 100%
