import { db, FormDraft } from '../db/db';
import { Group } from '@/types/group';
import { Module } from '@/types/modules';
import { DocumentTemplate } from '@/types/form';
import { ExerciseFolder, Exercise, ExerciseAssignment } from '@/types/exercises';
import { createClient } from '../supabase/client';
import { authService } from './authService';

const supabase = createClient();

export const dbService = {
    // Catalogs Sync
    async pushCatalogs(): Promise<void> {
        if (authService.isMockEnabled()) {
            console.log("Mock mode enabled, skipping cloud push.");
            return;
        }

        const localCatalogs = await db.catalogs.toArray();
        if (localCatalogs.length === 0) return;

        const { error } = await supabase
            .from('catalogs')
            .upsert(localCatalogs.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                items: c.items
            })));
        
        if (error) throw error;
    },

    async pullCatalogs(): Promise<void> {
        if (authService.isMockEnabled()) {
            console.log("Mock mode enabled, skipping cloud pull.");
            return;
        }

        const { data, error } = await supabase
            .from('catalogs')
            .select('*');
        
        if (error) throw error;
        await db.catalogs.clear();
        if (data && data.length > 0) {
            await db.catalogs.bulkPut(data);
        }
    },

    // Groups
    async getGroups(): Promise<Group[]> {
        return await db.groups.toArray();
    },
    async getGroupById(id: string): Promise<Group | undefined> {
        return await db.groups.get(id);
    },
    async saveGroup(group: Group): Promise<string> {
        const result = await db.groups.put(group);
        await this.pushGroup(group); // Push to cloud
        return result;
    },
    async getGroupsByTeacher(teacherId: string): Promise<Group[]> {
        return await db.groups.where({ teacherId }).toArray();
    },

    // Modules
    async getModules(): Promise<Module[]> {
        return await db.modules.toArray();
    },
    async getModuleById(id: string): Promise<Module | undefined> {
        return await db.modules.get(id);
    },
    async saveModule(module: Module): Promise<string> {
        const result = await db.modules.put(module);
        await this.pushModule(module); // Push to cloud
        return result;
    },

    // Templates
    async getTemplates(): Promise<DocumentTemplate[]> {
        return await db.templates.toArray();
    },
    async getTemplatesByModule(moduleId: string): Promise<DocumentTemplate[]> {
        return await db.templates.where({ moduleId }).toArray();
    },
    async saveTemplate(template: DocumentTemplate): Promise<string> {
        const result = await db.templates.put(template);
        await this.pushTemplate(template); // Push to cloud
        return result;
    },

    // Drafts
    async getDraftsByUser(userId: string): Promise<FormDraft[]> {
        return await db.drafts.where({ userId }).toArray();
    },
    async getDraftsByUserAndGroup(userId: string, groupId: string): Promise<FormDraft[]> {
        return await db.drafts.where({ userId, groupId }).toArray();
    },
    async getDraftsByModuleAndUser(moduleId: string, userId: string): Promise<FormDraft[]> {
        return await db.drafts.where({ moduleId, userId }).toArray();
    },
    async saveDraft(draft: FormDraft): Promise<number> {
        return (await db.drafts.put({
            ...draft,
            lastUpdated: Date.now(),
            isSynced: false // Ensure it's marked for sync
        })) as number;
    },
    async markDraftAsSynced(id: number): Promise<number> {
        return await db.drafts.update(id, { isSynced: true });
    },

    // Users (Mock/Sync)
    async getUsers(): Promise<any[]> {
        return await db.users.toArray();
    },
    async getUserByUserId(userId: string): Promise<any | undefined> {
        return await db.users.where({ userId }).first();
    },
    async getTeachers(): Promise<any[]> {
        return await db.users.where({ role: 'teacher' }).toArray();
    },

    // --- Cloud Sync Methods (Pull/Push) ---

    // Groups
    async pullGroups(): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { data, error } = await supabase.from('groups').select('*');
        if (error) { console.error("Error pulling groups", error); return; }
        await db.groups.clear();
        if (data && data.length > 0) {
            await db.groups.bulkPut(data.map(d => ({
                id: d.id, name: d.name, description: d.description, teacherId: d.teacher_id,
                moduleId: d.module_id, members: d.members, startDate: d.start_date, endDate: d.end_date, createdAt: d.created_at
            })));
        }
    },
    async pushGroup(group: Group): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('groups').upsert({
            id: group.id, name: group.name, description: group.description, teacher_id: group.teacherId,
            module_id: group.moduleId, members: group.members, start_date: group.startDate, end_date: group.endDate, created_at: group.createdAt
        });
        if (error) console.error("Error pushing group", error);
    },
    async deleteGroupCloud(id: string): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('groups').delete().eq('id', id);
        if (error) console.error("Error deleting group cloud", error);
    },

    // Modules
    async pullModules(): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { data, error } = await supabase.from('modules').select('*');
        if (error) { console.error("Error pulling modules", error); return; }
        await db.modules.clear();
        if (data && data.length > 0) {
            await db.modules.bulkPut(data.map(d => ({
                id: d.id, title: d.title, description: d.description, teacherId: d.teacher_id,
                groupIds: d.group_ids, sections: d.sections, status: d.status, createdAt: d.created_at, updatedAt: d.updated_at
            })));
        }
    },
    async pushModule(module: Module): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('modules').upsert({
            id: module.id, title: module.title, description: module.description, teacher_id: module.teacherId,
            group_ids: module.groupIds, sections: module.sections, status: module.status, created_at: module.createdAt, updated_at: module.updatedAt
        });
        if (error) console.error("Error pushing module", error);
    },
    async deleteModuleCloud(id: string): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('modules').delete().eq('id', id);
        if (error) console.error("Error deleting module cloud", error);
    },

    // Templates
    async pullTemplates(): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { data, error } = await supabase.from('templates').select('*');
        if (error) { console.error("Error pulling templates", error); return; }
        await db.templates.clear();
        if (data && data.length > 0) {
            await db.templates.bulkPut(data.map(d => ({
                id: d.id, moduleId: d.module_id, title: d.title, description: d.description,
                pdfUrl: d.pdf_url, schema: d.schema, status: d.status, createdAt: d.created_at, updatedAt: d.updated_at
            })));
        }
    },
    async pushTemplate(template: DocumentTemplate): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('templates').upsert({
            id: template.id, module_id: template.moduleId, title: template.title, description: template.description,
            pdf_url: template.pdfUrl, schema: template.schema, status: template.status, created_at: template.createdAt, updated_at: template.updatedAt
        });
        if (error) console.error("Error pushing template", error);
    },
    async deleteTemplateCloud(id: string): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('templates').delete().eq('id', id);
        if (error) console.error("Error deleting template cloud", error);
    },

    // Exercise Folders
    async pullExerciseFolders(): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { data, error } = await supabase.from('exercise_folders').select('*');
        if (error) { console.error("Error pulling exercise folders", error); return; }
        await db.exerciseFolders.clear();
        if (data && data.length > 0) {
            await db.exerciseFolders.bulkPut(data.map(d => ({
                id: d.id, name: d.name, description: d.description, teacherId: d.teacher_id,
                moduleIds: d.module_ids, groupIds: d.group_ids, createdAt: d.created_at, updatedAt: d.updated_at
            })));
        }
    },
    async pushExerciseFolder(folder: ExerciseFolder): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('exercise_folders').upsert({
            id: folder.id, name: folder.name, description: folder.description, teacher_id: folder.teacherId,
            module_ids: folder.moduleIds, group_ids: folder.groupIds, created_at: folder.createdAt, updated_at: folder.updatedAt
        });
        if (error) console.error("Error pushing exercise folder", error);
    },
    async deleteExerciseFolderCloud(id: string): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('exercise_folders').delete().eq('id', id);
        if (error) console.error("Error deleting exercise folder cloud", error);
    },

    // Exercises
    async pullExercises(): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { data, error } = await supabase.from('exercises').select('*');
        if (error) { console.error("Error pulling exercises", error); return; }
        await db.exercises.clear();
        if (data && data.length > 0) {
            await db.exercises.bulkPut(data.map(d => ({
                id: d.id, folderId: d.folder_id, title: d.title, description: d.description, content: d.content,
                moduleId: d.module_id, createdAt: d.created_at, updatedAt: d.updated_at
            })));
        }
    },
    async pushExercise(exercise: Exercise): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('exercises').upsert({
            id: exercise.id, folder_id: exercise.folderId, title: exercise.title, description: exercise.description, content: exercise.content,
            module_id: exercise.moduleId, created_at: exercise.createdAt, updated_at: exercise.updatedAt
        });
        if (error) console.error("Error pushing exercise", error);
    },
    async deleteExerciseCloud(id: string): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('exercises').delete().eq('id', id);
        if (error) console.error("Error deleting exercise cloud", error);
    },

    // Exercise Assignments
    async pullExerciseAssignments(): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { data, error } = await supabase.from('exercise_assignments').select('*');
        if (error) { console.error("Error pulling exercise assignments", error); return; }
        await db.exerciseAssignments.clear();
        if (data && data.length > 0) {
            await db.exerciseAssignments.bulkPut(data.map(d => ({
                id: d.id, exerciseId: d.exercise_id, studentId: d.student_id, groupId: d.group_id, moduleId: d.module_id,
                assignedBy: d.assigned_by, assignedAt: d.assigned_at, dueDate: d.due_date, status: d.status
            })));
        }
    },
    async pushExerciseAssignment(assignment: ExerciseAssignment): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('exercise_assignments').upsert({
            id: assignment.id, exercise_id: assignment.exerciseId, student_id: assignment.studentId, group_id: assignment.groupId, module_id: assignment.moduleId,
            assigned_by: assignment.assignedBy, assigned_at: assignment.assignedAt, due_date: assignment.dueDate, status: assignment.status
        });
        if (error) console.error("Error pushing exercise assignment", error);
    },
    async deleteExerciseAssignmentCloud(id: string): Promise<void> {
        if (authService.isMockEnabled()) return;
        const { error } = await supabase.from('exercise_assignments').delete().eq('id', id);
        if (error) console.error("Error deleting exercise assignment cloud", error);
    }
};
