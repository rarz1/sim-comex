# Production Data Architecture - SIM

**Date:** 2026-07-05
**Status:** Approved

## Objective

Eliminate IndexedDB/Dexie as the primary data store. Make Supabase the single source of truth. Remove offline-first complexity. All data operations go through server-side API routes.

## Architecture

```
Browser (React + React Query)          Server (Next.js / Vercel)
┌─────────────────────────┐            ┌───────────────────────────────┐
│  Pages & Components     │  fetch()   │  /api/data/[table]/route.ts  │
│  ┌───────────────────┐  │ ─────────→ │  → createAdminClient()       │
│  │ React Query Hooks │  │ ←───────── │  → supabase.from(table)     │
│  │ (caching + fetch)  │  │   JSON    │    .select() / .upsert()     │
│  └───────────────────┘  │            │    / .delete()               │
│         ↕               │            └──────────┬────────────────────┘
│  ┌───────────────────┐  │                       │
│  │ UI Components     │  │                ┌──────▼──────┐
│  │ (loading/error    │  │                │  Supabase   │
│  │  states via hooks)│  │                │ (source of  │
│  └───────────────────┘  │                │  truth)     │
└─────────────────────────┘                └─────────────┘
```

## Files to Create

### 1. Generic CRUD API Route - `/app/api/data/[table]/route.ts`

Handles all tables with a single route pattern.

- **GET** - List records. Supports query params for filtering (e.g. `?userId=abc&groupId=def`). Maps to `supabase.from(table).select('*').eq(key, value)` for each param.
- **POST** - Upsert record. Body is the record object. Maps to `supabase.from(table).upsert(body).select()`.
- **DELETE** - Delete record by id. ID from query param `?id=xxx`. Maps to `supabase.from(table).delete().eq('id', id)`.

Uses `createAdminClient()` from `lib/supabase/admin.ts` (service_role_key) — bypasses RLS, works server-side.

Returns `{ data, error }` consistent format.

### 2. Data Service - `/lib/services/dataService.ts`

Typed wrapper around fetch calls.

```typescript
class DataService {
  async getAll<T>(table: string, filters?: Record<string, string>): Promise<T[]>
  async getById<T>(table: string, id: string): Promise<T | null>
  async save<T>(table: string, data: Partial<T> & { id: string }): Promise<T>
  async delete(table: string, id: string): Promise<boolean>
}
```

### 3. React Query Hooks - `/hooks/useData.ts`

Named hooks per table for type safety and convenience:

```typescript
// Generic base hooks
function useTable<T>(table: string, filters?: Record<string, string>)
function useTableItem<T>(table: string, id?: string)
function useCreateOrUpdate<T>(table: string)
function useRemove(table: string)

// Specific hooks for complex queries (e.g. drafts by user+group)
export function useUsers()
export function useGroups()
export function useModules()
export function useTemplates()
export function useCatalogs()
export function useDrafts(filters?: Record<string, string>)
export function useExerciseFolders(filters?: Record<string, string>)
export function useExercises(filters?: Record<string, string>)
export function useExerciseAssignments(filters?: Record<string, string>)
export function useAppTexts()
```

### 4. React Query Provider - `/app/providers.tsx`

Wraps children in `QueryClientProvider`. Used in root layout.

### 5. Auth Update - Update `/lib/services/authService.ts`

Remove all IndexedDB dependencies. Auth flow:
- `login()` → POST `/api/auth/login` → Supabase Auth → returns user
- `getCurrentUser()` → checks Supabase session → returns `UserProfile` from `profiles` table via API
- Role comes from `profiles` table (Supabase), not from local cache

## Files to Modify (~22 files)

Every file that uses `useLiveQuery` or writes to IndexedDB `db.*` must be updated.

**Pattern for reads:**
```typescript
// Before:
const groups = useLiveQuery(() => db.groups.toArray());

// After:
const { data: groups, isLoading, error } = useGroups();
```

**Pattern for writes:**
```typescript
// Before:
await db.groups.put(group);
await dbService.pushGroup(group);

// After:
await createOrUpdateGroup.mutateAsync(group);
```

## Files to Delete

| File | Reason |
|------|--------|
| `lib/db/db.ts` | Dexie schema no longer needed |
| `lib/contexts/SyncContext.tsx` | No sync engine |
| `lib/services/dbService.ts` | Replaced by dataService.ts |
| `app/(dashboard)/dashboard/admin/export/page.tsx` | Export/import of IndexedDB obsolete |

## Dependencies to Remove

- `dexie`
- `dexie-react-hooks`

## Data Migration (One-Time)

1. Export from localhost using existing export page at `/dashboard/admin/export`
2. Export from Vercel using same page
3. Merge JSONs (deduplicate by `id`)
4. Create a migration script or use a simple admin page that POSTs each record to `/api/data/[table]`
5. Verify data in Supabase directly or via app

## Edge Cases

- **Loading states**: All pages must show loading spinners while fetching. Currently they rely on `useLiveQuery` synchronous reads from IndexedDB.
- **Error states**: API failures must show error UI, not silently break.
- **Empty states**: Pages must handle empty data arrays gracefully.
- **Race conditions**: React Query dedupes requests and handles stale data. Optimistic updates for mutations to keep UI snappy.

## Implementation Order

1. API route + data service + hooks + provider (infrastructure)
2. Migrate admin pages (users, groups, modules, templates, catalogs, builder)
3. Migrate teacher pages (groups, library, documents)
4. Migrate student pages (dashboard, groups, documents, cases, reports)
5. Migrate auth service
6. Delete obsolete files
7. Remove dependencies
8. Data migration from localhost + Vercel
9. Verify build (`tsc --noEmit`)
