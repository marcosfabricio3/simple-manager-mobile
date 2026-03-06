# Simple Manager – Project Context

Simple Manager is a mobile-first management application built with Expo and React Native.

Architecture follows Clean Architecture principles.

Layers:

Domain

- Entities
- Business rules

Application

- Services
- Use cases

Infrastructure

- SQLite database
- Repositories

Presentation

- React Native UI
- Hooks
- Screens

Main Entity:
Record

Record represents any manageable entity in the system (client, task, appointment, note).

Record fields:

- id
- title
- subtitle
- metadata
- type
- userId
- createdAt
- updatedAt
- isDeleted

Data Flow:

UI → Hook → Service → Repository → SQLite
