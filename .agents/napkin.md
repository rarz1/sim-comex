# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-05-24] Leer AI_CONTEXT.md al inicio**
   Do instead: Read AI_CONTEXT.md before any work. Update at session end.
2. **[2026-05-24] Verificar patrones existentes antes de cambios**
   Do instead: Check neighboring files for conventions before editing.
3. **[2026-05-24] Correr build después de cambios**
   Do instead: Run `npm run build` or `npx tsc --noEmit` to verify.

## Domain Behavior Guardrails
1. **[2026-05-24] Catálogos son 2 columnas: label + value**
   Do instead: Usar `CatalogoEntry { label: string; value: string }`. No field `value2`.
2. **[2026-05-24] Offline-first con Dexie/IndexedDB**
   Do instead: Guardar local primero, sync a Supabase después. No depender de conexión.
3. **[2026-05-24] Tag ID autogenerado**
   Do instead: 3 primeras letras de cada palabra del label, separadas por guión. Ej: "Puerto de Embarque" → `pue-de-emb`.
4. **[2026-05-24] Sync automático en onBlur para catálogos**
   Do instead: Disparar `handleCloudSync()` en `onBlur` de inputs de catálogo.
5. **[2026-05-24] Validación cruzada de Tag ID entre documentos**
   Do instead: Verificar duplicados local + contra otros documentos con `tagExistsInOtherDocuments()`.

## Shell & Command Reliability
1. **[2026-05-24] Preferir Read/Write/Edit sobre PowerShell para archivos**
   Do instead: Usar herramientas nativas para file ops. PowerShell solo para npm/git/scripts.
