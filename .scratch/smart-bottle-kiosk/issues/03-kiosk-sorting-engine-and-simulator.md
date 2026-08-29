# 03: Kiosk Sorting Engine & Mock/Real Hardware Simulator

**What to build:**
Implement the sorting state machine, AI classification pipeline, and live deposit interface:
- Real-time video preview feed with bounding box and classification overlays.
- Sensor-fusion logic integrating camera classification with Inductive Proximity Sensor.
- Real-time session counter tracking PET bottles (+10 pts) and CANs (+20 pts).
- Object rejection mechanism with 3-second conveyor reverse flow.
- Hardware mock/simulation mode (interactive buttons to simulate IR trigger, AI vision, and metal sensor) for local testing without physical Pi.
- Session finalization updating `students.current_points` and inserting rows into `recycle_logs`, ending in a Confetti Celebration & Thank You summary screen.

**Blocked by:**
02: Kiosk Identification & Progressive Phone Modal (Numpad Flow)

**Status:** completed

- [x] Sorting state machine evaluating AI class + Inductive sensor input
- [x] Hardware controller / mock simulator with forward/reverse conveyor and dual servo trapdoors
- [x] Live UI Deposit Screen showing real-time item counter, camera feed, and [Finish] button
- [x] Atomic point crediting and `recycle_logs` insertion
- [x] Confetti Celebration & Thank You screen showing points earned and new balance
- [x] Automated state machine and point calculation tests
