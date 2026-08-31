# ADR 0018: Kiosk Recycling Guide Modal and Ultrasonic Bin Full Emergency Architecture

## Status
Accepted

## Context
To ensure smooth autonomous operation of the Smart Recycling Kiosk at Sapphawitthayakhom School, two critical features are integrated:
1. **Recycling Guide Modal (คำแนะนำการรีไซเคิลและข้อควรระวัง)**: Interactive touch guide educating students on acceptable vs rejected materials with animated vector mascot diagrams.
2. **Bin Full Emergency State (หน้าแจ้งเตือนถังเต็ม 100%)**: Triggered when Ultrasonic sensors detect PET or CAN bin capacity >= 95%, temporarily pausing deposits and notifying the Student Council Super Admin (`32650`).

---

## Decision

### 1. Recycling Guide Modal (`GuideModal.tsx`)
* Accessible via a prominent "💡 คำแนะนำการรีไซเคิล" badge on ScreenWelcome and Header.
* Shows 3 clear actionable rules:
  1. **เทน้ำออกให้หมด**: Empty all liquids before insertion.
  2. **หยอดทีละ 1 ชิ้น**: Drop 1 bottle/can at a time for accurate AI camera vision.
  3. **วัสดุที่ไม่รองรับ**: Clear rejection list (Glass bottles, milk cartons, disposable cup lids) to prevent bin jamming.

### 2. Bin Full Emergency Screen (`ScreenBinFull.tsx`)
* Triggered automatically when `petBinPercent >= 95` or `canBinPercent >= 95` via hardware ultrasonic telemetry or simulator slider.
* Displays live capacity meters for both bins with amber/red visual alarms.
* Provides a 1-tap "ส่งการแจ้งเตือนสภานักเรียน (Notify Admin 32650)" button with instant confirmation.
* Provides a Staff PIN Unlock for Council Members to reset bin levels after clearing.

---

## Consequences
* **Positive**: Minimizes user errors (contaminated liquids / unaccepted items).
* **Positive**: Prevents machine overflow and hardware jams automatically.
* **Positive**: Maintains pure Light Eco Slate design language.
