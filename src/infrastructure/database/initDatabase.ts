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
            isDeleted INTEGER NOT NULL,
            isNew INTEGER NOT NULL DEFAULT 1
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
            paymentStatus TEXT NOT NULL DEFAULT 'unpaid',
            notes TEXT,
            seriesId TEXT NOT NULL,
            recurrence TEXT NOT NULL DEFAULT 'none',
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

  // Silent Migration
  try {
    db.execSync(
      `ALTER TABLE appointments ADD COLUMN paymentStatus TEXT NOT NULL DEFAULT 'unpaid';`,
    );
  } catch (e) {}

  try {
    db.execSync(
      `ALTER TABLE appointments ADD COLUMN seriesId TEXT;`,
    );
    db.execSync(
      `UPDATE appointments SET seriesId = id WHERE seriesId IS NULL;`,
    );
  } catch (e) {}

  try {
    db.execSync(
      `ALTER TABLE appointments ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'none';`,
    );
  } catch (e) {}

  try {
    db.execSync(
      `ALTER TABLE clients ADD COLUMN isNew INTEGER NOT NULL DEFAULT 1;`,
    );
  } catch (e) {}

  // Post-migration: Retroactively update existing clients to `isNew: 0`
  // if they have at least one successfully paid and completed appointment.
  try {
    db.execSync(`
      UPDATE clients 
      SET isNew = 0 
      WHERE id IN (
        SELECT clientId 
        FROM appointments 
        WHERE status != 'cancelled' 
          AND paymentStatus = 'paid' 
          AND (status = 'completed' OR date < datetime('now'))
      );
    `);
  } catch(e) {
    console.error("Failed to retroactively update new clients:", e);
  }
}
