export interface Group {
    id: string;
    name: string;
    description: string;
    teacherId: string; // The responsible teacher (name or ID)
    moduleId?: string; // The assigned educational module
    members: string[]; // List of Student names or IDs
    startDate: string; // ISO Date string
    endDate: string; // ISO Date string
    createdAt: string;
}
