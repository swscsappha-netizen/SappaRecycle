# ADR 0003: Cross-Device Mobile Responsiveness & Safe-Area Optimization for LINE LIFF

## Status
Accepted

## Context
LINE LIFF web apps run inside WebView containers across diverse mobile hardware, ranging from compact devices (iPhone SE, Galaxy A-series at 320px-360px width) to modern notch/Dynamic Island devices (iPhone 14/15/16 Pro) and large Android screens.

Key challenges addressed:
1. Bottom navigation bar obstruction by iOS Home Indicator or Android navigation gestures.
2. Narrow viewport overflow on 5-tab layouts.
3. Modal clipping on short landscape or compact mobile viewports.
4. Unwanted double-tap zoom delays or horizontal scroll jitter.

## Decisions
1. **Viewport & Safe-Area Inset Support**:
   - Implement `viewport-fit=cover` in HTML meta headers.
   - Anchor the fixed bottom navigation with `padding-bottom: max(12px, env(safe-area-inset-bottom))`.
2. **Fluid Typography & Responsive Grid System**:
   - Fluid sizing for balance counters and badges (`clamp()` and Tailwind breakpoints).
   - Scalable 2-column store grid with auto-shrinking image containers on screens below 375px.
3. **Touch-Optimized Interactive Elements**:
   - Minimum 44x44px touch targets.
   - Enable `-webkit-overflow-scrolling: touch` on horizontal category carousels with hidden scrollbars.
4. **Adaptive Modal Dialogs**:
   - Bound modals to `max-h-[85vh]` with auto-scroll and compact vertical padding on smaller screens.

## Consequences
- **Positive**: Pixel-perfect rendering across all iPhone, iPad, and Android screen sizes.
- **Positive**: Zero layout breaks, zero horizontal overflow, and native app-like touch responsiveness.
