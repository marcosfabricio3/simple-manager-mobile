# Simple Manager – Project Roadmap

This document tracks the development progress of the project.

---

# Current Stage

Early MVP Development

The core architecture and base CRUD functionality are already implemented.

---

# Completed Features

Core Architecture

- Clean Architecture structure
- Domain / Application / Infrastructure / Presentation separation

Database

- SQLite local database
- Table: records
- UUID based identifiers
- Soft delete support

Records Module

- Create record
- Edit record
- Soft delete record
- List records

Validation

- Title normalization
- Duplicate prevention
- Minimum length validation
- Maximum length validation

User Experience

- Global Toast Notification System
- Toast animations
- Basic mobile-first UI

---

# MVP Features Remaining

Records UX

- Search records
- Filter records by type

UI Improvements

- Better form layout
- Empty state screen
- Confirmation modal before deletion

Data Management

- Record sorting
- Record grouping by type

Architecture

- Global error handler
- Service validation improvements

Persistence Safety

- Backup / export data option

---

# Post-MVP Features (Future)

Appointments system

Services system

Calendar integration

Local notifications

Offline synchronization

Cloud sync option

Multi-device support

User authentication (future optional backend)

---

# Long Term Vision

Simple Manager aims to be:

A lightweight offline-first management tool for small businesses and freelancers.

The application should remain:

- simple
- fast
- private
- offline-first
