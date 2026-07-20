
export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    name?: string; // alias for fullName from DB
    groupIds?: string[]; // IDs of groups the user belongs to
    avatarUrl?: string;
    createdAt: string;
    documentType?: 'CC' | 'TI' | 'CE' | 'PASSPORT';
    documentNumber?: string;
    canCreateUsers?: boolean;
}
