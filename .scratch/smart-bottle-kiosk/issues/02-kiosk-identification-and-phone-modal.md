# 02: Kiosk Identification & Progressive Phone Modal (Numpad Flow)

**What to build:**
Create the 1024×600 px Touchscreen Kiosk UI for user authentication:
- Welcome Screen with animated school graphics, instructions, and tap-to-start.
- Responsive Touch Numpad (0–9) for 5-digit Student ID input with immediate lookup against the database.
- Progressive Phone Registration Modal (ADR-0001): If the student's phone number is missing, prompt to input 10-digit number with a prominent [Skip / ข้าม] button that allows immediate transition to depositing without blocking the queue.

**Blocked by:**
01: Database Foundation & 2,906 Student Roster Seeding

**Status:** completed

- [x] 1024×600 fixed-layout Kiosk Welcome Screen with school identity & ambient animation
- [x] On-screen numeric keypad with clear/backspace and 5-digit validation
- [x] Student verification against database displaying student's name and room
- [x] Progressive phone modal with phone formatting and functional [Skip] button (ADR-0001)
- [x] Unit tests for numpad inputs, validations, and state transitions
