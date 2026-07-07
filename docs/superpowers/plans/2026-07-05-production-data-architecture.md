# Production Data Architecture - Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement task-by-task.

**Goal:** Replace IndexedDB/Dexie with Supabase-first architecture via server-side API routes and React Query.

**Architecture:** Generic CRUD API route (`/api/data/[table]`) → Supabase (service_role_key) → React Query hooks for caching/state. No IndexedDB, no SyncContext, no push/pull engine.

**Tech Stack:** Next.js 16, Supabase (admin client), @tanstack/react-query

---

### Task 1: Generic CRUD API Route

**Files:**
- Create: `app/api/data/[table]/route.ts`

- [ ] **Create generic route handler**

```typescript
// app/api/data/[table]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const supabase = createAdminClient();
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const { id, ...filters } = searchParams;

  let query = supabase.from(table).select('*');

  if (id) {
    query = query.eq('id', id).single();
  } else {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase.from(table).upsert(body).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data?.[0] ?? null });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const supabase = createAdminClient();
  const { id } = await request.json();

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

### Task 2: Data Service

**Files:**
- Create: `lib/services/dataService.ts`

- [ ] **Create data service**

```typescript
// lib/services/dataService.ts

export class DataService {
  private baseUrl = '/api/data';

  async getAll<T>(table: string, filters?: Record<string, string>): Promise<T[]> {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    const res = await fetch(`${this.baseUrl}/${table}${params}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data ?? [];
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}/${table}?id=${id}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data ?? null;
  }

  async save<T>(table: string, data: Record<string, any>): Promise<T> {
    const res = await fetch(`${this.baseUrl}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data as T;
  }

  async delete(table: string, id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${table}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return true;
  }
}

export const dataService = new DataService();
```

### Task 3: React Query Hooks

**Files:**
- Create: `hooks/useData.ts`

- [ ] **Create all React Query hooks**

```typescript
// hooks/useData.ts
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
  return useTable<Template>('templates', filters);
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
```

### Task 4: React Query Provider

**Files:**
- Create: `app/providers.tsx`

- [ ] **Create providers wrapper**

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Wrap root layout**

Read `app/layout.tsx` first, then add `<Providers>` around `{children}`.

```typescript
// In app/layout.tsx, import Providers and wrap:
<Providers>{children}</Providers>
```

### Task 5: Migrate Admin Dashboard Page

**Files:**
- Modify: `app/(dashboard)/dashboard/admin/page.tsx`

- [ ] **Replace useLiveQuery with React Query hooks**

The admin page shows cards with record counts. Replace:

```typescript
// Before:
const groups = useLiveQuery(() => db.groups.toArray());
const modules = useLiveQuery(() => db.modules.toArray());
// etc.

// After:
const groupsQuery = useGroups();
const modulesQuery = useModules();
const templatesQuery = useTemplates();
const usersQuery = useUsers();
const catalogsQuery = useCatalogs();
```

Use `data?.length ?? 0` for counts. Remove all dbService references.

### Task 6: Migrate CatalogManager

**Files:**
- Modify: `components/admin/CatalogManager.tsx`

- [ ] **Replace reads and writes**

Reads: `useCatalogs()`
Create: `useCreateOrUpdateCatalog()`
Delete: `useDeleteCatalog()`
Remove SyncContext import and sync calls.

### Task 7: Migrate GroupManager

**Files:**
- Modify: `components/admin/GroupManager.tsx`

- [ ] **Replace reads and writes**

`useGroups()`, `useModules()`, `useUsers()`, `useTemplates()`
Create/update: `useCreateOrUpdateGroup()`
Delete: `useDeleteGroup()`
Remove dbService.pushGroup/deleteGroupCloud calls.

### Task 8: Migrate ModuleEditor

**Files:**
- Modify: `components/admin/ModuleEditor.tsx`

- [ ] **Replace reads and writes**

`useModules()`, `useTemplates()`, `useModule()`
Create/update: `useCreateOrUpdateModule()`
Remove dbService.pushModule.

### Task 9: Migrate UserManager

**Files:**
- Modify: `components/admin/UserManager.tsx`

- [ ] **Replace reads and writes**

`useUsers()`
Writes go through API route instead of direct db.users.put().

### Task 10: Migrate Admin Modules Page

**Files:**
- Modify: `app/(dashboard)/dashboard/admin/modules/page.tsx`

- [ ] **Replace reads and writes**

`useModules()`, `useUsers()`
Create/update/delete hooks.

### Task 11: Migrate Admin Builder Page

**Files:**
- Modify: `app/(dashboard)/dashboard/admin/builder/page.tsx`

- [ ] **Replace reads**

`useTemplates()` - templates list for the form builder.

### Task 12: Migrate Admin Settings Page

**Files:**
- Modify: `app/(dashboard)/dashboard/admin/settings/page.tsx`

- [ ] **Replace reads and writes**

`useAppTexts()`, `useCreateOrUpdateAppText()`

### Task 13: Migrate FormRenderer

**Files:**
- Modify: `components/form-builder/FormRenderer.tsx`

- [ ] **Replace reads**

`useCatalogs()`
Remove FormRenderer import of db.

### Task 14: Migrate FormBuilder Sidebar

**Files:**
- Modify: `components/form-builder/Sidebar.tsx`

- [ ] **Replace reads**

`useCatalogs()`, `useTemplates()`

### Task 15: Migrate Teacher Dashboard

**Files:**
- Modify: `app/(dashboard)/dashboard/teacher/page.tsx`

- [ ] **Replace reads**

`useGroups()`, `useModules()`, `useDrafts()`, `useTemplates()`, `useUsers()`

### Task 16: Migrate Teacher Groups List

**Files:**
- Modify: `app/(dashboard)/dashboard/teacher/groups/page.tsx`

- [ ] **Replace reads**

`useGroups()`, `useUsers()`, `useModules()`

### Task 17: Migrate Teacher Group Detail

**Files:**
- Modify: `app/(dashboard)/dashboard/teacher/groups/[id]/page.tsx`

- [ ] **Replace reads and writes**

`useGroup()`, `useUsers()`, `useTemplates()`, `useModule()`
Writes go through hooks.

### Task 18: Migrate ExerciseBank

**Files:**
- Modify: `components/teacher/ExerciseBank.tsx`

- [ ] **Replace all reads/writes**

`useExerciseFolders()`, `useExercises()`, `useExerciseAssignments()`, `useGroups()`, `useUsers()`
Create/update/delete hooks for each.
Remove dbService references.

### Task 19: Migrate TeacherDocumentViewer

**Files:**
- Modify: `components/teacher/TeacherDocumentViewer.tsx`

- [ ] **Replace reads**

`useModule()`, `useTemplates()`, `useDrafts()`

### Task 20: Migrate Student Pages

**Files:**
- Modify: `app/(dashboard)/dashboard/student/page.tsx`
- Modify: `app/(dashboard)/dashboard/student/groups/page.tsx`
- Modify: `app/(dashboard)/dashboard/student/groups/[id]/page.tsx`
- Modify: `app/(dashboard)/dashboard/student/documents/page.tsx`
- Modify: `app/(dashboard)/dashboard/student/documents/[id]/page.tsx`
- Modify: `app/(dashboard)/dashboard/student/cases/page.tsx`
- Modify: `app/(dashboard)/dashboard/student/reports/page.tsx`

- [ ] **Migrate all student pages**

All follow the same pattern:
```typescript
// Before:
const data = useLiveQuery(() => db.table.toArray());

// After:
const { data, isLoading } = useTableName(filters);
```

### Task 21: Migrate Profile Page

**Files:**
- Modify: `app/(dashboard)/dashboard/profile/page.tsx`

- [ ] **Replace reads**

`useGroups()`, `useDrafts()`

### Task 22: Update useAppText Hook

**Files:**
- Modify: `hooks/useAppText.ts`

- [ ] **Replace useLiveQuery with useAppTexts hook**

```typescript
// Before:
const overrides = useLiveQuery(() => db.appTexts.toArray());

// After:
const { data: overrides } = useAppTexts();
```

### Task 23: Update Auth Service

**Files:**
- Modify: `lib/services/authService.ts`

- [ ] **Remove IndexedDB dependency**

Remove:
- `import { db } from '@/lib/db/db'`
- All `db.users.put/get` calls in `login()`, `getCurrentUser()`
- Role resolution still works: `profiles` table in Supabase via API route
- `cached_user_profile` in localStorage stays as fast cache (not backed by IndexedDB)

### Task 24: Remove Sync Infrastructure

**Files:**
- Delete: `lib/contexts/SyncContext.tsx`
- Delete: `lib/services/dbService.ts`
- Delete: `app/(dashboard)/dashboard/admin/export/page.tsx`

- [ ] **Delete obsolete files**

Also remove SyncContext import/usage from:
- `app/layout.tsx` (remove `<SyncProvider>` wrapper)

### Task 25: Remove Dexie Dependencies

- [ ] **Delete `lib/db/db.ts`**

- [ ] **Remove dexie packages**

```bash
npm uninstall dexie dexie-react-hooks
```

### Task 26: TypeScript Fixes

- [ ] **Fix any remaining type errors**

Run `tsc --noEmit` and fix any issues from removed imports or type changes.

### Task 27: Data Migration

- [ ] **Migrate existing data from localhost + Vercel to Supabase**

1. Export data from each source using the (still-working) export page
2. Merge JSONs deduplicating by `id`
3. Create a one-time migration page or script that POSTs each record to the API routes
4. Verify data in Supabase
