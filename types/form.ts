
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';

export interface ValidationRules {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
}

export interface Coordinates {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FormField {
    id: string; // Unique key for the field (e.g., "fob_value")
    label: string;
    type: FieldType;
    placeholder?: string;
    options?: { label: string; value: string }[]; // For select fields
    validation?: ValidationRules;
    coordinates?: Coordinates; // For PDF mapping
    tags?: string[]; // For cross-document validation (e.g., "total_fob")
    tagId?: string; // Specific unique tag for cross-validation as requested
    catalogId?: string; // Reference to a system catalog
    helpText?: string;
}

export interface FormSection {
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
}

export interface DocumentTemplate {
    id: string;
    moduleId: string;
    title: string;
    description?: string;
    pdfUrl: string; // Background PDF
    schema: {
        sections: FormSection[];
    };
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'published';
}

export interface DocumentSubmission {
    id: string;
    templateId: string;
    userId: string;
    data: Record<string, any>; // Key-Value pair of Field.id -> Value
    status: 'draft' | 'completed';
    lastUpdated: number;
}
