---
name: LabShare request workflow
description: Product boundaries, persistence expectations, and safe schema changes for LabShare bookings.
---

Student discovery, booking requests, and later owner decisions must use the same persistent equipment and booking records. The current MVP is student-first, uses fictional example data, and defers the owner UI and role security.

**Why:** The user asked for the student dashboard first, bookings connected to the shared model for owner processing, and fictional demonstration data.

**How to apply:** Extend the shared request lifecycle rather than keeping bookings in browser-only state. Do not use real student data until authentication and role-based access are in place.

When pushing a new unique constraint onto a populated LabShare booking table, Drizzle prompted to truncate its existing rows. Do not accept truncation or use `push-force` as a shortcut; make schema changes additive and backfill existing records safely before adding uniqueness.

**Why:** A uniqueness change during this build triggered an interactive truncate prompt for four existing demo bookings.

**How to apply:** Preserve current rows during database schema changes, and verify the generated push plan before applying it.
