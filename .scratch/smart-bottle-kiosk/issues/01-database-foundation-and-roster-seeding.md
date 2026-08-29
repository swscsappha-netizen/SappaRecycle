# 01: Database Foundation & 2,906 Student Roster Seeding

**What to build:**
Set up the complete Supabase PostgreSQL database architecture including schema definition, tables (`students`, `rewards`, `coupons`, `recycle_logs`), Row-Level Security (RLS) policies, indexes, and full seeding of all 2,906 students from Sapphawitthayakhom School across 80 classes (M.1/1 to M.6/13) with unique 5-digit IDs.

**Blocked by:**
None (can start immediately)

**Status:** completed

- [x] Complete schema SQL script with `students`, `rewards`, `coupons`, and `recycle_logs` tables
- [x] Primary keys, foreign keys, and indexes for high-speed student ID lookup and coupon validation
- [x] Database seed containing all 2,906 students with zero duplicates and accurate grade/room data
- [x] Sample reward catalogue (stationary, snacks, school merch) with point costs and stock
- [x] Standalone schema validation test verifying table relations and student queries
