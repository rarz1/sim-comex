
import Dexie, { type EntityTable } from 'dexie';

import { Module } from '@/types/modules';
import { DocumentTemplate } from '@/types/form';
import { Group } from '@/types/group';
import type { ExerciseFolder, Exercise, ExerciseAssignment } from '@/types/exercises';

export interface FormDraft {
  id?: number; // Auto-incrementing ID for local storage
  documentId: string; // The UUID of the document in Supabase
  moduleId: string; // This stores the TEMPLATE ID (legacy naming)
  groupId: string; // The specific group this draft belongs to
  userId: string;
  content: Record<string, any>; // The form data (JSON)
  lastUpdated: number; // Timestamp
  isSynced: boolean;
  status?: 'in_progress' | 'completed';
}

// Define the Sync Queue interface (for Background Sync)
export interface SyncQueueItem {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'documents' | 'progress'; // Which Supabase table to sync to
  payload: any;
  timestamp: number;
}

// Define the Database Class
export class ComexDatabase extends Dexie {
  drafts!: EntityTable<FormDraft, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  templates!: EntityTable<DocumentTemplate, 'id'>;
  modules!: EntityTable<Module, 'id'>;
  groups!: EntityTable<Group, 'id'>;
  users!: EntityTable<any, 'id'>;
  appTexts!: EntityTable<{ id: string, value: string }, 'id'>;
  catalogs!: EntityTable<{ id: string, name: string, type: 'simple' | 'two_column', items: any[] }, 'id'>;
  exerciseFolders!: EntityTable<ExerciseFolder, 'id'>;
  exercises!: EntityTable<Exercise, 'id'>;
  exerciseAssignments!: EntityTable<ExerciseAssignment, 'id'>;

  constructor() {
    super('SimComexDB');
    this.version(1).stores({
      drafts: '++id, documentId, moduleId, userId, [userId+moduleId]',
      syncQueue: '++id, timestamp',
      templates: 'id, moduleId, status'
    });

    // Version 2: Add isSynced to drafts
    this.version(2).stores({
      drafts: '++id, documentId, moduleId, userId, isSynced, [userId+moduleId]'
    });

    // Version 3: Add modules
    this.version(3).stores({
      modules: 'id, teacherId, *groupIds'
    });

    // Version 4: Add groups
    this.version(4).stores({
      groups: 'id, teacherId, moduleId'
    });

    // Version 6: Drop the broken/incompatible users table
    this.version(6).stores({
      users: null
    });

    // Version 7: Re-create users table with correct Auto-increment PK
    this.version(7).stores({
      users: '++id, userId, email, role'
    });

    // Version 8: Add groupId to drafts for unique tracking per group
    this.version(8).stores({
      drafts: '++id, documentId, moduleId, userId, groupId, isSynced, [userId+moduleId+groupId]'
    });

    // Version 9: Force re-index of users to ensure 'role' is queryable
    // This is necessary if the previous version update didn't trigger correctly on client
    // Version 10: Add documentNumber to users index for searching
    this.version(10).stores({
      users: '++id, userId, email, role, documentNumber'
    });

    // Version 11: Add appTexts table for CMS
    this.version(11).stores({
      appTexts: 'id' // id is the key (e.g. 'admin.dashboard.title')
    });

    // Version 13: Add missing compound index for drafts fallback
    this.version(13).stores({
      drafts: '++id, documentId, moduleId, userId, groupId, isSynced, [userId+moduleId+groupId], [userId+moduleId]'
    });

    // Version 14: Add exercise management tables
    this.version(14).stores({
      exerciseFolders: 'id, teacherId, [teacherId+moduleIds], [teacherId+groupIds]',
      exercises: 'id, folderId, moduleId, [folderId+moduleId]',
      exerciseAssignments: 'id, exerciseId, studentId, groupId, moduleId, [exerciseId+studentId], [studentId+moduleId]'
    });

    // Version 15: Add catalogs table for system catalogs
    this.version(15).stores({
      catalogs: 'id, name'
    });
  }
}

export const db = new ComexDatabase();
