export interface CaseFolder {
    id: string;
    name: string;
    description: string;
    space: 'repository' | 'personal';
    ownerId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CaseItem {
    id: string;
    folderId: string;
    title: string;
    description: string;
    content: {
        text: string;
        pdfUrl?: string;
        pdfName?: string;
        pdfSize?: string;
    };
    space: 'repository' | 'personal';
    ownerId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CaseAssignment {
    id: string;
    caseId: string;
    studentId: string;
    groupId: string;
    assignedBy: string;
    assignedAt: string;
    status: 'pending' | 'in_progress' | 'completed';
}
