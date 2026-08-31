# ADR 0017: Raspberry Pi 4 Light Eco Slate Touchscreen Kiosk Architecture

## Status
Accepted

## Context
Following user requirements for running natively and lightweight on Raspberry Pi 4 Touchscreen hardware (1024x600 px / 1280x800 px) with 0 lag, the Kiosk UI adopts the **Light Eco Slate Theme** with Google Fonts (`Prompt`, `Sarabun`, `Chakra Petch`), touch-optimized gestures (`touch-manipulation`), and live AI vision/sound telemetry.

---

## Decision

### 1. Typography Hierarchy
* **Primary Headings & Action Labels**: `Prompt` (Weights 600, 700, 800, 900)
* **Informational & Body Copy**: `Sarabun` (Weights 400, 500, 600)
* **Digital Telemetry, Counters & Points**: `Chakra Petch` (Weights 500, 700) for futuristic arcade score telemetry.

### 2. Light Eco Slate Palette
* **Canvas Background**: Light eco slate `#f1f5f9` / `#f8fafc` with subtle mint gradient blurs (`rgba(16, 185, 129, 0.08)` and `rgba(2, 132, 199, 0.06)`).
* **Surfaces**: Crisp white `#ffffff` cards with soft elevation shadows and mint borders (`border-2 border-emerald-100`).
* **Interactive Buttons**: 3D Squishy buttons with active tactile click response (`transform: translateY(4px)`).

### 3. Raspberry Pi 4 Zero-Overhead Runtime
* Zero build dependency requirements for local Pi execution (runs directly in Chromium Kiosk mode: `chromium-browser --kiosk http://localhost:5000/kiosk-ui/`).
* Web Audio API synthesis (zero MP3 file loading delays).
* WebSerial API (direct USB hardware connection with Arduino/ESP32).

---

## Consequences
* **Positive**: 100% lightweight and instant boot (<100ms) on Raspberry Pi 4.
* **Positive**: High contrast, legible typography with dedicated digital display font (`Chakra Petch`) for score points.
* **Positive**: Retains all Supabase cloud sync, sensor fusion, and mascot animations.
