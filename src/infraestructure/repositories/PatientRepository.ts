import { Patient } from "../../domain/entities/Patient";
import { db } from "../database/database";

export class PatientRepository {
    create(patient: Patient): void {
        db.runSync(
            `INSERT INTO patients
             (id, name, phone, email, notes, createdAt, updatedAt, isDeleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patient.id,
                patient.name,
                patient.phone,
                patient.email ?? null,
                patient.notes ?? null,
                patient.createdAt,
                patient.updatedAt,
                patient.isDeleted ? 1 : 0,
            ],
        );
    }

    findAll(): Patient[] {
        const result = db.getAllSync<any>(
            `SELECT * FROM patients WHERE isDeleted = 0`
        );

        return result.map((row) => ({
            ...row,
            isDeleted: row.isDeleted === 1,
        }));
    }
}
