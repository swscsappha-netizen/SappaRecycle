# ADR 0007: Admin Daily and Monthly Analytics Dashboard

## Status
Accepted

## Context
Administrators, teachers, and Student Council directors at Sapphawitthayakhom School require quantitative insights and reporting tools to evaluate school-wide recycling engagement, monitor bottle/can collection velocity over time, and calculate environmental impact (e.g., carbon emission reduction).

## Decisions
1. **Promote Analytics as First-Class Admin Tab**:
   - Add a primary tab `📊 แดชบอร์ดสรุปสถิติ (Analytics Dashboard)` in `web-liff/admin.html`.
2. **Configurable Time Horizons**:
   - Support dynamic switching across `Today`, `Last 7 Days`, `This Month`, and `All Time`.
3. **Interactive Visualizations (Chart.js)**:
   - **Daily Recycling Trend**: Stacked/grouped bar chart tracking PET and CAN items per day.
   - **Waste Composition Donut**: Proportional distribution of PET bottles vs Aluminium cans.
4. **Classroom Leaderboard & Carbon Calculator**:
   - Aggregate recycling totals by classroom (`students.room`) to encourage healthy school competition.
   - Apply standard emission factors:
     - PET bottle: $0.0825\text{ kg CO}_2\text{ saved / item}$
     - Aluminium can: $0.0950\text{ kg CO}_2\text{ saved / item}$

## Consequences
- **Positive**: Comprehensive real-time reporting for school executives and project presentations.
- **Positive**: Gamification of classroom environmental stewardship.
