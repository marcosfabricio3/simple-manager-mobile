export interface ValidationResult {
    valid: boolean;
    message?: string;
}

export function validateRecord(title: string, type: string): ValidationResult {
    const cleanTitle = title.trim();
    const cleanType = type.trim();

    if (!cleanTitle || !cleanType) {
        return { valid: false, message: "Todos los campos son obligatorios" };
    }

    if (cleanTitle.length < 3) {
        return { valid: false, message: "El título debe tener al menos 3 caracteres" };
    }

    if (cleanTitle.length > 50) {
        return { valid: false, message: "El título no puede superar los 50 caracteres" };
    }

    if (cleanType.length < 3) {
        return { valid: false, message: "El tipo debe tener al menos 3 caracteres" };
    }

    return { valid: true };
}