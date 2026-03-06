# Simple Manager – Product Modules

This document defines the functional modules of the Simple Manager application and the current implementation status.

The goal is to clearly describe the remaining work required to complete the MVP.

---

# Application Overview

Simple Manager is an **offline-first management application** designed primarily for small businesses such as aesthetic clinics.

The application must support:

- Mobile usage
- Desktop (Windows) usage
- Local data storage
- Future synchronization capability

The application revolves around three core entities:

- Records (clients/patients)
- Services
- Appointments

Everything else in the system builds on top of these.

---

# Core Modules

## 1. Records (Clients / Patients)

This module manages the clients of the business.

Responsibilities:

- Create record
- Edit record
- Delete record (soft delete)
- List records
- Validate inputs
- Prevent duplicates

Fields:

- id
- title (name)
- subtitle (optional)
- metadata (optional)
- type
- createdAt
- updatedAt
- isDeleted

Status:

IMPLEMENTED

---

# 2. Services

Services represent the treatments or services offered by the business.

Examples:

- Facial treatment
- Botox
- Laser therapy
- Hair removal

Each user defines their own service list.

Fields:

- id
- name
- color
- duration (optional)
- price (optional)
- createdAt

Status:

NOT IMPLEMENTED

---

# 3. Appointments (Core System)

Appointments represent scheduled visits.

This is the **central feature of the application**.

Each appointment contains:

- id
- recordId
- startDate
- endDate
- price (optional)
- notes (optional)
- status
- createdAt
- updatedAt

Status options:

- pending
- completed
- cancelled

Appointments may contain **multiple services**.

For this reason the system requires an intermediate table:

appointment_services

Status:

NOT IMPLEMENTED

---

# 4. Dashboard (Home Screen)

This is the main screen of the application.

It displays the **appointments for the current day**.

Appointments are ordered by:

start time ascending.

Information displayed per appointment:

- client name
- time
- services
- status

Dashboard indicators:

- total clients attended today
- cancellations today
- pending appointments

The screen also contains a **floating action button (+)**.

This button opens a quick action menu:

- Create appointment
- Create client

Status:

NOT IMPLEMENTED

---

# 5. Calendar

Calendar allows visual navigation of appointments.

Views required:

- Day view
- Week view
- Month view

Each appointment block should show:

- client
- services
- duration
- status

Possible library:

react-native-calendars

Status:

NOT IMPLEMENTED

---

# 6. Statistics

Provides business insights.

Examples:

- total clients
- completed appointments
- cancellations
- estimated revenue

Status:

NOT IMPLEMENTED

---

# 7. Settings

Configuration screen for the application.

Possible sections:

- services management
- theme (dark/light)
- security settings
- API configuration (future)

Status:

NOT IMPLEMENTED

---

# 8. Authentication

Authentication is currently **local only**.

The MVP focuses on:

- local usage
- offline functionality

Future features may include:

- Google OAuth
- Two-factor authentication (2FA)
- cloud accounts

Status:

DEFERRED FOR MVP

---

# Current Development Status

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

# Estimated MVP Completion

Overall project progress:

≈ 35% – 40%

However, the most complex part is already completed:

- architecture
- database integration
- CRUD pattern
- validation system
- application structure

This foundation will allow faster implementation of the remaining modules.
