# ADR 0014: Eco-Playful Rolling Hills & 3D Tactile Kiosk Design System

## Status
Accepted

## Context
Following user design input, the physical Kiosk UI (1024x600 px Touchscreen) is updated to an **Eco-Playful Theme** featuring stylized green landscape hills (`.hill-bg-1`, `.hill-bg-2`), floating animated nature icons, high-contrast 3D squishy buttons (`box-shadow: 0 8px 0 #087f23`), and 100% Thai localization.

---

## Decision

### 1. Visual Aesthetics & Environment
* **Background Atmosphere**:
  * Light eco mint background (`#f5fbf5`)
  * Stylized layered green hills (`hill-bg-1` & `hill-bg-2`)
  * Floating animated eco icons (`energy_savings_leaf`, `eco`, `recycling`, `nest_eco_leaf`)
* **3D Tactile Button System**:
  * Active press depth (`.btn-press:active { transform: translateY(4px); }`)
  * 3D Shadow effect (`0 8px 0 #087f23, 0 15px 20px rgba(0,0,0,0.15)`)
* **100% Thai Localization**:
  * Clear, welcoming Thai language designed for all students of โรงเรียนสรรพวิทยาคม.

### 2. Screen Hierarchy (All 4 Screens + Modal)
* **Screen 1 (หน้าแรก - ต้อนรับ)**:
  * Hero text: "เปลี่ยนขยะรีไซเคิล ให้เป็นแต้มสะสมรางวัล ✨"
  * Big 3D Start Button: "แตะที่นี่เพื่อเริ่มต้น 🚀"
  * 3D Value Cards for PET (+10 แต้ม/ขวด) and CAN (+20 แต้ม/ใบ) with translucent backdrop icons.
* **Screen 2 (กรอกรหัสประจำตัว 5 หลัก)**:
  * 3D Numpad keys (1-9, ล้าง, 0, ลบ)
  * Live Student Card verification with avatar and room name.
* **Screen 3 (หน้าจอหยอดขวดสด)**:
  * Live AI Vision frame with crosshair target and conveyor status.
  * Live session item counters and total earned points.
  * 3D "เสร็จสิ้นและรับแต้ม" button with coin chime sound.
* **Screen 4 (สรุปแต้ม & ขอบคุณ)**:
  * Grand celebration with confetti, score breakdown, LINE reminder, and 10s auto-return countdown.
* **Phone Modal (ADR-0001)**:
  * 3D numpad for 10-digit phone registration with prominent "ข้าม (ไว้กรอกทีหลัง)" button.

---

## Consequences
* **Positive**: Delivers an engaging, highly inviting, and fun experience for school students.
* **Positive**: High-contrast touch targets prevent input errors on touchscreens.
* **Positive**: Retains all underlying backend capabilities (Supabase cloud sync, Web Audio synthesis, and WebSerial API).
