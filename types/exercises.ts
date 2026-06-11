export interface ExerciseFolder {
    id: string;
    name: string;
    description?: string;
    teacherId: string;
    moduleIds: string[];
    groupIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Exercise {
    id: string;
    folderId: string;
    title: string;
    description: string;
    content: string;
    moduleId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExerciseAssignment {
    id: string;
    exerciseId: string;
    studentId: string;
    groupId: string;
    moduleId: string;
    assignedBy: string;
    assignedAt: string;
    dueDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
}

export interface ExerciseWithAssignment {
    exercise: Exercise;
    assignedTo: string[];
    isAssignedToStudent: (studentId: string) => boolean;
}