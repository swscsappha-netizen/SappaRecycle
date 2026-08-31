# ADR 0020: Mascot & Mechanical Animation Engine for Deposit Screen

## Status
Accepted

## Context
Rather than showing a dark raw camera viewfinder which feels industrial and intimidating for school students, the deposit screen (`ScreenDeposit.tsx`) is upgraded to a lively, pastel Light Eco Slate animated visual stage.

---

## Decision

### 1. Replaced Industrial Camera Viewport with Animated Visual Stage
* Replaced the dark `#0b1329` camera frame with a pastel mint/sky frosted stage (`bg-gradient-to-b from-white to-emerald-50/80`).
* Features cute interactive SVG animations powered by Framer Motion:
  1. **Standby State (Hand Insertion Loop)**: Animated cartoon hand dropping a clear PET bottle into the illuminated intake slot with guiding arrows and EarthMascot cheering.
  2. **Liquid Reminder (Empty Liquids)**: Animated bottle tilting with dripping water drops (`Droplets`) reminding students to empty leftover beverages.
  3. **Conveyor Sorting Success State**: When PET or CAN is detected, the item glides on active conveyor rollers with starburst particles (`Sparkles`), brand banner, and bouncing score badge (`+10 แต้ม ✨` or `+20 แต้ม ✨`).
  4. **Rejection / Alien Object State**: Shaking item with bright red warning halo (`AlertTriangle`), reverse roller conveyor animation, and explicit friendly Thai instruction.

---

## Consequences
* **Positive**: 100% harmonious with the Light Eco Slate design system.
* **Positive**: Delightful, intuitive, and highly engaging for students of all ages (ม.1 - ม.6).
* **Positive**: Clearly communicates machine physical actions in real-time.
