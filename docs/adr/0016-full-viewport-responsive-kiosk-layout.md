# ADR 0016: Full Viewport Responsive Kiosk Layout (Edge-to-Edge)

## Status
Accepted

## Context
Previously, the Kiosk UI was constrained inside a fixed-dimension bounding box (`1024px x 600px`), causing large empty borders when viewed on full HD monitors, laptops, and larger touchscreen displays.

---

## Decision

### 1. Edge-to-Edge Full Viewport Scaling
* Replace fixed `w-[1024px] h-[600px]` container with **Full Viewport Responsive (`w-screen h-screen min-h-screen overflow-hidden`)**.
* Elements adapt dynamically using responsive flexbox/grid layout and fluid container sizing (`max-w-5xl` / `max-w-6xl` centered workspace).
* Background rolling hills (`.hill-bg-1`, `.hill-bg-2`) and floating eco elements stretch to cover the entire visible canvas naturally.

### 2. Multi-Resolution Display Support
* **7-inch Touchscreen (1024x600 px)**: Perfect fit with compact paddings and 0 scrollbars.
* **10.1-inch Raspberry Pi Display (1280x800 px)**: Crisp, high-contrast touch targets.
* **15.6-inch to 27-inch PC Displays (1920x1080 Full HD)**: Immersive, arcade-grade kiosk experience.

---

## Consequences
* **Positive**: No empty grey borders or floating box appearance.
* **Positive**: 100% immersive kiosk experience on any hardware screen resolution.
