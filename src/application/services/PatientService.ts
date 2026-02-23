import 'react-native-get-random-values';
import { v4 as uuidv4 } from "uuid";
import { Patient } from "../../domain/entities/Patient";
import { PatientRepository } from "../../infraestructure/repositories/PatientRepository";

export class PatientService {
    private repository: PatientRepository;

    constructor() {
        this.repository = new PatientRepository;
    }

    createPatient(data: {
        name: string;
        phone: string;
        email?: string;
        notes?: string;
    }): { patient: Patient; warning?: string } {
        const now = new Date().toISOString();

        const existingPatients = this.repository.findAll();
        const duplicate = existingPatients.find(
            (p) => p.phone === data.phone
        );

        const patient: Patient = {
            id: uuidv4(),
            name: data.name,
            phone: data.phone,
            email: data.email,
            notes: data.notes,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
        };

        this.repository.create(patient);

        return {
            patient,
            warning: duplicate ? "Phone number alredy exists" : undefined,
        };
    }

    getAllPatients(): Patient[] {
        return this.repository.findAll();
    }
}