# ADR 0013: Kiosk UI Design Language Unification with Purrweb Eco Emerald System

## Status
Accepted

## Context
The student-facing mobile application (LINE LIFF) and the physical recycling kiosk touchscreen interface (Raspberry Pi 4) were initially styled with different design languages (LINE LIFF using a modern light Purrweb Eco Emerald theme, while Kiosk UI used a dark mode palette).

To create a unified, recognizable, and trustworthy brand identity for **SappaRecycle (โรงเรียนสรรพวิทยาคม)**, the physical kiosk UI must adopt the exact same vibrant light eco emerald visual design system as the LINE LIFF web app.

---

## Decision

### 1. Unified Purrweb Eco Emerald Palette
* **Canvas Background**: Light eco tint (`#f6faf6`) with subtle gradient ambient blurs (`rgba(16, 185, 129, 0.08)` and `rgba(245, 158, 11, 0.06)`).
* **Card Surfaces**: Pure white `#ffffff` cards with soft rounded corners (`rounded-[28px]`), dual-tone borders (`border-2 border-[#e2ece2]`), and subtle elevation shadows.
* **Primary Brand Colors**:
  * Brand Emerald: `#047857` (Primary) & `#10b981` (Accent)
  * PET Plastic Accent: `#0284c7` (Sky Blue) with `#e0f2fe` background badge (+10 pts)
  * CAN Aluminium Accent: `#d97706` (Amber Gold) with `#fef3c7` background badge (+20 pts)
* **3D Squishy Button Hierarchy**:
  * Primary Green CTA: `bg-[#047857] hover:bg-[#059669] border-b-4 border-[#064e3b]`
  * Numpad Keys: Pure white with soft grey borders, bold font, and bouncy press feedback (`transform: translateY(2px)`).

### 2. Widescreen 2-Column Responsive Layout (1024x600 px)
Optimized specifically for Raspberry Pi 4 Touchscreens (7–10 inch, 1024x600 / 1280x800):
* **Screen 1 (Welcome)**: Left column showcases branding, live ultrasonic bin capacity, and recycling benefits; right column displays 3D PET/CAN value cards and prominent start CTA.
* **Screen 2 (Identification)**: Left column shows student verification badge card with avatar and room; right column displays the large 12-key tactile touch numpad.
* **Screen 3 (Deposit)**: Left column renders the AI Vision target viewfinder and conveyor status; right column displays the real-time session item counter and points accumulator.
* **Screen 4 (Summary)**: Celebratory breakdown with confetti blast, point awards, and LINE reminder card.

---

## Consequences
* **Positive**: Cohesive visual identity across the physical kiosk and students' personal LINE smartphones.
* **Positive**: High contrast, legible typography, and large touch targets ideal for students of all ages.
* **Positive**: 0ms local execution on Raspberry Pi 4 with responsive CSS and Web Audio synthesis.
