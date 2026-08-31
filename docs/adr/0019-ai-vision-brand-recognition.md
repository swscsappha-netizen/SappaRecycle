# ADR 0019: AI Vision Brand & Product Recognition System for Kiosk UI

## Status
Accepted

## Context
Following school kiosk requirements, students and judges want to see the AI Vision subsystem recognize not only the material category (PET / CAN) but also the specific **beverage brand** (e.g. Singha, Crystal, Sappa Water, Coca-Cola, Oishi, Nescafé) commonly consumed at Sapphawitthayakhom School.

---

## Decision

### 1. Brand Taxonomy
* **PET Bottles (+10 pts)**:
  * `สิงห์ (Singha Water)`
  * `คริสตัล (Crystal Water)`
  * `น้ำดื่มสรรพวิทยาคม (Sappa Water)`
  * `โออิชิ กรีนที (Oishi)`
  * `โค้ก PET (Coca-Cola)`
  * `เป๊ปซี่ PET (Pepsi)`
* **Aluminium Cans (+20 pts)**:
  * `โค้ก CAN (Coca-Cola)`
  * `เป๊ปซี่ CAN (Pepsi)`
  * `สไปรท์ CAN (Sprite)`
  * `เนสกาแฟ CAN (Nescafé)`
  * `เบอร์ดี้ CAN (Birdy)`
* **Rejected Items (0 pts / Auto-Reject)**:
  * `กล่องนม UHT`
  * `ขวดแก้ว (Glass Bottle)`
  * `แก้วน้ำพลาสติกแบบใช้แล้วทิ้ง`

### 2. UI & Simulation Integration
* Hardware simulation bar on `ScreenDeposit.tsx` allows 1-click selection of specific brands or random instant drops.
* The AI Camera Viewport renders brand badges (`🏷️ แบรนด์: ...`) inside the bounding box with confidence score telemetry.
* Summary Screen (`ScreenSummary.tsx`) shows the detected brands in the deposited items history.

---

## Consequences
* **Positive**: Greatly elevates project presentation and demonstrates advanced AI classification capabilities to engineering contest judges.
* **Positive**: Provides actionable recycling analytics per brand for school administration.
