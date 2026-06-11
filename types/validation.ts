
export interface FieldMatch {
    fieldId: string;
    label: string;
    value: any;
    docId: string;
    docTitle: string;
}

export interface ValidationDetail {
    tagId: string;
    tagName: string;
    isConsistent: boolean;
    values: FieldMatch[];
}

export interface ValidationReport {
    studentId: string;
    moduleId: string;
    totalTags: number;
    matchedTags: number;
    score: number; // 0-100
    details: ValidationDetail[];
    generatedAt: number;
}
