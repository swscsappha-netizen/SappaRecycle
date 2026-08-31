# ADR 0015: Kiosk Micro-Animations, Motion Design, and Interactive Splash Screen

## Status
Accepted

## Context
To elevate the user engagement, playfulness, and sensory feedback of the physical Kiosk Touchscreen (Raspberry Pi 4), the interface incorporates rich CSS3/JS micro-animations, a boot splash screen, and dynamic physics-based score feedback.

---

## Decision

### 1. Kiosk Splash Screen Loader (`#kiosk-splash-screen`)
* Displays an animated emerald recycling emblem with spinning leaf rings and a glowing loading progress indicator.
* Smoothly fades out (`opacity-0`, `pointer-events-none`) with a 500ms cubic-bezier transition once offline student roster cache and Supabase connection are verified.

### 2. Live AI Camera Laser Scanner (`@keyframes laserScan`)
* A vibrant emerald-cyan laser beam continuously sweeps vertically inside the viewfinder box.
* Active item detection triggers a pulsing bounding box and high-contrast confidence label.

### 3. Floating Score Popups (`@keyframes scoreFloat`)
* Upon successful item sorting (PET: +10 pts, CAN: +20 pts), a glowing score particle (e.g. `+10 Pts ✨` or `+20 Pts 🌟`) spawns dynamically at the item counter, pops upward with a spring bounce, and fades out over 1.2s.

### 4. 3D Animated Conveyor Belt Simulation
* Conveyor overlay displays animated diagonal speed stripes moving forward when bottles are ingested (`state === 'FORWARD'`) and reversing with a warning amber/red hue when objects are rejected (`state === 'REVERSE'`).

### 5. Count-Up Score Telemetry on Summary Screen
* Session earned points and total balance animate upward from 0 to target values using a 60fps easing loop accompanied by a multi-burst confetti celebration.

---

## Consequences
* **Positive**: Creates an arcade-grade physical recycling kiosk experience that encourages students to recycle regularly.
* **Positive**: High-framerate CSS transitions ensure smooth 60fps performance on Raspberry Pi 4 hardware without GPU bottlenecks.
