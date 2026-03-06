# Simple Manager – Roadmap Technical Review

This document reviews the original development roadmap and proposes a more natural and stable implementation order.

The goal is to minimize refactoring, reduce development risk, and follow a professional product development flow.

---

# Current Project Status

Estimated completion: **35–40%**

The following systems are already implemented:

- Clean Architecture project structure
- SQLite local database
- Records module (CRUD)
- Soft delete strategy
- Validation system
- Toast notification system
- Basic mobile UI

This foundation represents the **most complex technical layer of the application**.

The remaining work focuses mostly on **domain features**.

---

# Issues With the Original Roadmap

The original roadmap is generally well structured, but two ordering issues were identified.

---

## Issue 1 – Calendar Appears Too Early

The calendar feature depends entirely on the **Appointments system**.

Calendar views require:

- appointment duration
- appointment status
- services relation
- date filtering queries
- stable appointment CRUD

If the calendar is implemented before the appointment system is stable, it will likely need to be rewritten multiple times.

Professional development flow usually follows:

Appointments CRUD
↓
Dashboard
↓
Calendar

---

## Issue 2 – Settings Appears Too Late

Service management is usually considered **business configuration**, not an operational screen.

For this reason, services should normally be managed from **Settings**.

Typical flow:

Settings → manage services
Appointments → use services

This creates a more natural UX and cleaner architecture.

---

# Recommended Roadmap

The development phases should follow this order.

---

# Phase 1 – Stabilize Records Module

Goal: polish the existing client management system.

Tasks:

- Improve RecordsScreen UX
- Add empty state
- Add delete confirmation modal
- Add search functionality
- Add filtering by type
- Add sorting and grouping

---

# Phase 2 – Basic Settings System

Goal: introduce a configuration screen.

Tasks:

- Create SettingsScreen
- Add theme toggle (light / dark)
- Prepare space for business configuration

This screen will later host **service management**.

---

# Phase 3 – Services Module

Goal: implement services offered by the business.

Tasks:

- Create `services` table in SQLite
- Create `Service` entity
- Create `ServiceRepository`
- Create `ServiceService`
- Add service name validation
- Create `useServices` hook

Service management UI should live inside the **Settings screen**.

---

# Phase 4 – Appointments System (Core Feature)

This is the **central system of the application**.

Tasks:

- Create `appointments` table
- Create `appointment_services` table
- Create `Appointment` entity
- Create `AppointmentRepository`
- Create `AppointmentService`
- Create `useAppointments` hook
- Implement appointment CRUD

Appointments will reference:

records
services

This module represents the **core functionality of the product**.

---

# Phase 5 – Dashboard (Home Screen)

Once appointments exist, the home screen can display useful information.

Features:

- show today's appointments
- sort by start time
- display appointment status
- display associated services

Indicators:

- appointments completed today
- cancellations today
- pending appointments

Add floating action button (FAB):

Create Appointment

Create Client

---

# Phase 6 – Calendar

Goal: visual navigation of appointments.

Library candidate:

react-native-calendars

Views:

- Day view
- Week view
- Month view

Selecting a date should show appointments scheduled for that day.

---

# Phase 7 – Statistics

Business insights dashboard.

Possible metrics:

- total clients
- completed appointments
- cancellations
- estimated revenue

Statistics depend on the full dataset, therefore they are implemented later.

---

# Additional Missing Phase – Data Safety

One important feature missing from the roadmap is **data protection**.

Since the application stores data locally in SQLite, users risk losing information if the database is corrupted or deleted.

Before releasing the MVP, the system should include:

- data export
- data import
- backup functionality

This allows users to safely migrate or restore their data.

---

# Final Roadmap Structure

The recommended development order becomes:

1 Stabilize Records
2 Settings (base)
3 Services
4 Appointments (core)
5 Dashboard
6 Calendar
7 Statistics

---

# Project Completion Status

Architecture

██████████ 95%

Records System

██████████ 100%

Services System

░░░░░░░░░░ 0%

Appointments System

░░░░░░░░░░ 0%

Dashboard

░░░░░░░░░░ 0%

Calendar

░░░░░░░░░░ 0%

Statistics

░░░░░░░░░░ 0%

Settings

░░░░░░░░░░ 0%

---

# Key Insight

Although only ~40% of the product features are implemented, the **most difficult technical foundation is already complete**:

- architecture
- database integration
- CRUD patterns
- validation system
- UI base

This significantly reduces the complexity of the remaining work.
