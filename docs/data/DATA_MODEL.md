# Data Model

Table: records

Fields:

id TEXT PRIMARY KEY
title TEXT NOT NULL
subtitle TEXT
metadata TEXT
type TEXT NOT NULL
userId TEXT
createdAt TEXT
updatedAt TEXT
isDeleted INTEGER

Rules:

- title max 50 characters
- title cannot be duplicated
- title cannot be empty
- type required
