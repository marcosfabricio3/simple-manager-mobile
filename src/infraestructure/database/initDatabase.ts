import { db } from "./database";

export function initDatabase() {
  db.execSync(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT,
            metadata TEXT,
            type TEXT NOT NULL,
            userId TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            isDeleted INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            notes TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            isDeleted INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            defaultPrice REAL NOT NULL,
            color TEXT NOT NULL,
            isActive INTEGER NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY NOT NULL,
            clientId TEXT NOT NULL,
            date TEXT NOT NULL,
            durationMinutes INTEGER NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            isDeleted INTEGER NOT NULL,
            FOREIGN KEY (clientId) REFERENCES clients(id)
        );  

        CREATE TABLE IF NOT EXISTS appointment_services (
            id TEXT PRIMARY KEY NOT NULL,
            appointmentId TEXT NOT NULL,
            serviceId TEXT NOT NULL,
            customPrice REAL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (appointmentId) REFERENCES appointments(id),
            FOREIGN KEY (serviceId) REFERENCES services(id)
        );
    `);
}
