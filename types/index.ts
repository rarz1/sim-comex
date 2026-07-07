export type { UserProfile } from './roles';
export type { Group } from './group';
export type { Module } from './modules';
export type { DocumentTemplate as Template } from './form';
export type { CaseFolder, CaseItem, CaseAssignment } from './exercises';
export interface Draft {
  id?: number;
  documentId: string;
  moduleId: string;
  groupId: string;
  userId: string;
  content: Record<string, any>;
  lastUpdated: number;
  isSynced: boolean;
  status?: 'in_progress' | 'completed';
}

export interface Catalog {
  id: string;
  name: string;
  type: 'simple' | 'two_column' | 'three_column';
  items: Array<{ label: string; value: string; value2?: string }>;
}
