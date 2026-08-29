# ADR 0008: Production Readiness and Complete Removal of Dev Simulation Modes

## Status
Accepted (Production Deployed)

## Context
During the prototype and design verification phases, a developer switcher bar (`.dev-test-bar`) and simulation overrides were embedded at the top of the Student LIFF Web App (`web-liff/index.html`) to facilitate rapid testing between standard student profiles (e.g. `34889`) and student council officer profiles (e.g. `34890`).

With all features finalized—including:
1. Purrweb-inspired green bottom navigation bar with central scanner squircle
2. Dedicated standalone backoffice admin dashboard (`admin.html`) with Chart.js analytics
3. Full student roster table (2,906 students) with pagination and live search
4. Three official reward categories (`stationery`, `character`, `toy`)
5. Foreign-key safe coupon and reward lifecycle management
6. LINE Role-Based Access Control (RBAC) authorization

The user requested the complete removal of all simulation artifacts, mock switchers, and dev bars to transition the codebase into 100% production readiness for real student and council operations.

## Decision
1. **Student Web App (`web-liff/index.html`)**:
   - Completely stripped the `#dev-test-bar` container, dev headers, quick switcher buttons, and dev styles.
   - Preserved legitimate role-based admin navigation: Student council officers (`is_council_member === true`) access the backoffice exclusively via the verified `[🛠️ เปิดหน้าจัดการแอดมิน Backoffice (สภานักเรียน)]` button inside their Profile tab.
2. **Student App Controller (`web-liff/app.js`)**:
   - Purged all dev switcher event listeners (`btn-toggle-dev`, `btn-dev-switch-user`, `btn-quick-std1`, `btn-quick-council`).
   - Retained robust automated LINE LIFF profile resolution (`liff.getProfile()` $\rightarrow$ Supabase lookup) with fallback URL parameter handling for standalone testing.
3. **Stylesheets (`web-liff/index.css`)**:
   - Cleaned up all `.dev-test-bar`, `.dev-bar-header`, `.dev-bar-body`, and `.dev-row` CSS declarations.
4. **Standalone Admin Backoffice (`web-liff/admin.html` & `web-liff/admin.js`)**:
   - Retained zero test bars. Protected by the 403 Forbidden RBAC security shield.

## Consequences
- **User Experience**: The student user interface is now 100% clean, elegant, and production-ready with zero development clutter.
- **Security**: Unauthorized users cannot tamper with mock switchers on the student screen.
- **Maintainability**: Reduced code surface area and eliminated dead event listeners.
