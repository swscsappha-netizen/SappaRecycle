# ADR 0021: 5-Stage Sensor-Driven State Machine for Deposit Flow

## Status
Accepted

## Context
Students and contest judges require clear, real-time telemetry matching the physical sensors and conveyor mechanisms on the Smart Recycling Kiosk.

---

## Decision

### 1. 5-Stage Sensor State Machine
1. **`WAITING_OBJECT` (รอขวดมาวาง)**:
   * Sensor: IR Proximity Sensor = CLEAR
   * UI: "กรุณานำขวดหรือกระป๋องมาวางในช่องรับ" + Animated Hand Insertion + Idle Mascot.
2. **`OBJECT_DETECTED` (ตรวจพบวัตถุ / กำลังสแกน)**:
   * Sensor: IR Proximity Sensor = TRIGGERED
   * UI: "ตรวจพบวัตถุแล้ว! กำลังสแกนประเภท..." + Scanning beam laser animation.
3. **`CHECKING_LIQUID` (ตรวจสอบน้ำตกค้าง)**:
   * Sensor: Moisture / Loadcell = ANALYZING
   * UI: "กำลังตรวจเช็คของเหลวตกค้าง..." + Droplet ripple animation.
4. **`SORTING_SUCCESS` (คัดแยกสำเร็จ: PET +10 แต้ม / CAN +20 แต้ม)**:
   * Actuator: Conveyor Forward = ACTIVE
   * UI: "✓ ผ่านการคัดแยก: ..." + Mascot Celebrate + Points burst.
5. **`REJECTED` (ส่งคืนขยะแปลกปลอม)**:
   * Actuator: Conveyor Reverse = ACTIVE
   * UI: "⚠️ ตรวจพบสิ่งของไม่รองรับ หรือมีน้ำตกค้าง!" + Reverse belt animation.

---

## Consequences
* **Positive**: 100% faithful to physical sensor fusion behavior.
* **Positive**: Crystal-clear real-time feedback for students.
* **Positive**: Fully interactive with WebSerial API, hardware sensors, and keyboard simulation.
