# ADR 0012: Raspberry Pi 4 Touchscreen Kiosk Architecture & Audio-Visual Feedback System

## Status
Accepted

## Context
The **SappaRecycle Smart Bottle & Can Recycling Machine** (โรงเรียนสรรพวิทยาคม) features a physical kiosk powered by a **Raspberry Pi 4** connected to a dedicated HDMI/DSI Touchscreen Display (7–10 inch).

The kiosk software must provide:
1. An intuitive, frictionless user interface for 2,906 students to identify themselves using their 5-digit Student ID.
2. Real-time visual and audio feedback during bottle/can insertion (PET: +10 pts, CAN: +20 pts).
3. Seamless integration with the live **Supabase Cloud Database** (recording entries in `public.recycle_logs` and updating `public.students.current_points` & `total_bottles_recycled`), immediately syncing with students' LINE LIFF portal.
4. Robust hardware integration supporting both direct **WebSerial API / USB Serial** communication with the sorting microcontroller (Arduino/ESP32) and an on-screen **Hardware Simulator Dock** for demonstrations.
5. Built-in synthetic **Web Audio API Sound Effects** for immediate positive reinforcement without external audio asset dependencies.

---

## Decision

### 1. Kiosk Screen State Machine
The touchscreen UI follows a strict 4-screen state machine:
* **Screen 1: Welcome / Idle Screen (`#screen-welcome`)**: High-impact Eco branding, point values guide (+10 PET / +20 CAN), real-time Ultrasonic Bin capacity gauges, and a pulsing "แตะเพื่อเริ่มต้น" CTA.
* **Screen 2: 5-Digit PIN Identification (`#screen-numpad`)**: Touch-friendly numpad with instant student name/room verification from the 2,906 student roster.
* **Screen 3: Live Deposit & Sorting (`#screen-deposit`)**: AI Vision target viewport, real-time conveyor animation, item counters (PET / CAN / Points), and active deposit tip.
* **Screen 4: Celebration Summary (`#screen-summary`)**: Confetti blast, detailed session point breakdown, LINE LIFF reminder, and auto-return countdown timer (10s).

### 2. Standalone Web Audio API Sound Synthesizer
To ensure zero asset loading lag and offline audio reliability on Raspberry Pi 4 Chromium, all sound effects are generated synthetically via the HTML5 `AudioContext` Web Audio API:
* `beep(freq, duration)`: Keypress tactile feedback.
* `playBottleSuccess()`: Pleasant ascending chime (+10 / +20 pts).
* `playRejectBuzz()`: Low-frequency buzz for foreign/non-recyclable waste.
* `playCelebrationFanfare()`: Multi-tone celebratory arpeggio for session completion.

### 3. Progressive Phone Registration (ADR 0001 Enforced)
If an identified student has no recorded phone number (`phone_number == null`), display `#modal-phone` with a prominent "ข้าม (ไว้กรอกทีหลัง)" button to prevent queuing bottlenecks at the physical kiosk.

### 4. Direct Supabase Cloud Sync
Upon completing a deposit session:
1. Batch insert individual item records into `public.recycle_logs` (`student_id`, `item_type`, `points_earned`, `status`).
2. Update `public.students` with new `current_points` and `total_bottles_recycled`.
3. In case of temporary network dropout on Raspberry Pi, store pending logs in `localStorage` and retry in background.

### 5. Hardware Communication Protocol
Serial protocol format over USB (`115200 baud`):
* `DROP:PET` $\rightarrow$ Triggers PET deposit animation (+10 pts, chime).
* `DROP:CAN` $\rightarrow$ Triggers CAN deposit animation (+20 pts, chime).
* `DROP:REJECT` $\rightarrow$ Triggers rejection warning overlay & buzz.
* `BIN:PET:<0-100>` $\rightarrow$ Updates PET ultrasonic bin level indicator.
* `BIN:CAN:<0-100>` $\rightarrow$ Updates CAN ultrasonic bin level indicator.

---

## Consequences
* **Positive**: Delivers a fluid 60fps touchscreen experience with immediate tactile, visual, and audio feedback for students.
* **Positive**: Points earned at the physical kiosk immediately appear on the student's LINE LIFF app without manual refreshes.
* **Positive**: Fully testable both on PC with the built-in simulator and on Raspberry Pi 4 hardware.
