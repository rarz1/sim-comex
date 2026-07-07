'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/lib/services/dataService';
import type { UserProfile, Group, Module, Template, Draft, Catalog, CaseFolder, CaseItem, CaseAssignment } from '@/types';

// --- Generic helpers ---

function useTable<T>(table: string, filters?: Record<string, string>) {
  return useQuery<T[]>({
    queryKey: [table, filters],
    queryFn: () => dataService.getAll<T>(table, filters),
  });
}

function useTableItem<T>(table: string, id?: string) {
  return useQuery<T | null>({
    queryKey: [table, id],
    queryFn: () => dataService.getById<T>(table, id!),
    enabled: !!id,
  });
}

function useCreateOrUpdate<T>(table: string) {
  const qc = useQueryClient();
  return useMutation<T, Error, Record<string, any>>({
    mutationFn: (data) => dataService.save<T>(table, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

function useRemove(table: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => dataService.delete(table, id).then(() => {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

// --- Exported hooks ---

export function useUsers(filters?: Record<string, string>) {
  return useTable<UserProfile>('profiles', filters);
}

export function useUser(userId?: string) {
  return useTableItem<UserProfile>('profiles', userId);
}

export function useGroups(filters?: Record<string, string>) {
  return useTable<Group>('groups', filters);
}

export function useGroup(groupId?: string) {
  return useTableItem<Group>('groups', groupId);
}

export function useCreateOrUpdateGroup() {
  return useCreateOrUpdate<Group>('groups');
}

export function useDeleteGroup() {
  return useRemove('groups');
}

export function useModules(filters?: Record<string, string>) {
  return useTable<Module>('modules', filters);
}

export function useModule(moduleId?: string) {
  return useTableItem<Module>('modules', moduleId);
}

export function useCreateOrUpdateModule() {
  return useCreateOrUpdate<Module>('modules');
}

export function useDeleteModule() {
  return useRemove('modules');
}

export function useTemplates(filters?: Record<string, string>) {
  const mergedFilters = { select: 'id,title,status,schema,created_at,updated_at', ...filters };
  return useTable<Template>('templates', mergedFilters);
}

export function useTemplate(templateId?: string) {
  return useTableItem<Template>('templates', templateId);
}

export function useCreateOrUpdateTemplate() {
  return useCreateOrUpdate<Template>('templates');
}

export function useDeleteTemplate() {
  return useRemove('templates');
}

export function useDrafts(filters?: Record<string, string>) {
  return useTable<Draft>('drafts', filters);
}

export function useCreateOrUpdateDraft() {
  const qc = useQueryClient();
  return useMutation<Draft, Error, Record<string, any>>({
    mutationFn: (data) => dataService.save<Draft>('drafts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drafts'] }),
  });
}

export function useCatalogs() {
  return useTable<Catalog>('catalogs');
}

export function useCreateOrUpdateCatalog() {
  return useCreateOrUpdate<Catalog>('catalogs');
}

export function useDeleteCatalog() {
  return useRemove('catalogs');
}

export function useExerciseFolders(filters?: Record<string, string>) {
  return useTable<CaseFolder>('exercise_folders', filters);
}

export function useCreateOrUpdateExerciseFolder() {
  return useCreateOrUpdate<CaseFolder>('exercise_folders');
}

export function useDeleteExerciseFolder() {
  return useRemove('exercise_folders');
}

export function useExercises(filters?: Record<string, string>) {
  return useTable<CaseItem>('exercises', filters);
}

export function useCreateOrUpdateExercise() {
  return useCreateOrUpdate<CaseItem>('exercises');
}

export function useDeleteExercise() {
  return useRemove('exercises');
}

export function useExerciseAssignments(filters?: Record<string, string>) {
  return useTable<CaseAssignment>('exercise_assignments', filters);
}

export function useCreateOrUpdateExerciseAssignment() {
  return useCreateOrUpdate<CaseAssignment>('exercise_assignments');
}

export function useDeleteExerciseAssignment() {
  return useRemove('exercise_assignments');
}

export function useAppTexts() {
  return useTable<{ id: string; key: string; value: string }>('app_texts');
}

export function useCreateOrUpdateAppText() {
  return useCreateOrUpdate<{ id: string; key: string; value: string }>('app_texts');
}
