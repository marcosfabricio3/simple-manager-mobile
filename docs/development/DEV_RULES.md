# Development Rules

Always follow Clean Architecture.

UI must never access database directly.

Flow must be:

Screen → Hook → Service → Repository → Database

Validation must exist in the service layer.

Repositories must only contain database logic.

Do not introduce global state libraries.

Prefer React hooks over classes.
