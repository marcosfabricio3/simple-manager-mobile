# Architecture Decisions

Database
SQLite via expo-sqlite.

Soft Delete
Records are never permanently deleted.
Field "isDeleted" marks logical deletion.

ID generation
UUID generated using expo-crypto.

Validation
Application layer handles validation logic.

Future Backend
The architecture is designed to allow migration to API backend later.
Repositories will be replaced by HTTP adapters.
