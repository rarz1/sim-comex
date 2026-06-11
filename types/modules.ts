export interface ModuleResource {
    id: string;
    name: string;
    type: 'pdf' | 'word' | 'excel' | 'image' | 'video' | 'link';
    url: string;
    size?: string;
}

export interface ModuleSection {
    id: string;
    title: string;
    content: string; // Rich text / HTML
    resources: ModuleResource[];
    attachedDocumentIds: string[]; // IDs from DocumentTemplate
}

export interface Module {
    id: string;
    title: string;
    description: string;
    teacherId: string; // "Profesor 1", etc.
    groupIds: string[]; // IDs of assigned groups
    sections: ModuleSection[];
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'published';
}
