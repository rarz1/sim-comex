# Contexto de la IA - SIM 1

> **IMPORTANTE**: Este documento es la memoria del proyecto. Toda IA debe leerlo al inicio y actualizarlo después de cada sesión de trabajo.

## Fecha de inicio
- Inicio del proyecto: Mayo 2026

## Estado actual del proyecto
- **Tipo**: Aplicación web educativa (Next.js + Supabase + Dexie/IndexedDB)
- **Nombre**: SIM - Sistema Interactivo de Aprendizaje
- **Descripción**: Plataforma de simulación académica para estudiantes y profesores
- **Stack**: Next.js 14, TypeScript, Tailwind CSS, Supabase, IndexedDB (Dexie), Shadcn UI

---

## Estructura del proyecto

```
SIM 1/
├── app/                    # Páginas Next.js (App Router)
│   ├── (dashboard)/        # Layout autenticado
│   │   ├── dashboard/
│   │   │   ├── student/    # Panel estudiante
│   │   │   ├── teacher/   # Panel profesor
│   │   │   ├── admin/     # Panel admin
│   │   │   └── reports/   # Reportes
│   │   └── layout.tsx     # Layout con Sidebar
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page pública
├── components/             # Componentes React
│   ├── admin/              # Componentes administración
│   ├── auth/               # Autenticación
│   ├── form-builder/       # Constructor de formularios + renderer
│   ├── layout/             # Header, Sidebar, theme-provider
│   ├── marketing/          # Landing page
│   ├── reports/            # Reportes
│   ├── teacher/            # Componentes profesor
│   └── ui/                 # Componentes UI (shadcn)
├── lib/                    # Utilidades y servicios
│   ├── contexts/           # React contexts (SyncContext)
│   ├── db/                 # Configuración Dexie
│   ├── pdf/                # Generación PDF
│   ├── services/           # Servicios (auth, db, validation)
│   ├── supabase/           # Cliente Supabase
│   ├── defaultCatalogs.ts  # Catálogos por defecto
│   └── utils.ts            # Utilidades generales
├── hooks/                  # React hooks personalizados
├── types/                  # TypeScript types
└── public/                 # Archivos estáticos
```

---

## Roles en la aplicación

### Administrador
- Gestionar usuarios (crear, editar, eliminar)
- Gestionar módulos educativos
- Gestionar grupos
- Generar datos de prueba (seed)
- Configuración global
- Reportes globales

### Profesor
- Ver grupos asignados
- Ver progreso de estudiantes
- Revisar documentos enviados
- Validar módulos
- Reportes por grupo

### Estudiante
- Ver módulos asignados
- Completar formularios/documentos
- Ver progreso personal
- Descargar documentos completados
- Reportes personales

---

## Funcionalidades implementadas

### Autenticación
- Login con email/password
- Roles: admin, teacher, student
- Protección de rutas por rol
- Sesión con Supabase Auth

### Base de datos local (IndexedDB/Dexie)
- `users` - Usuarios
- `groups` - Grupos
- `modules` - Módulos educativos
- `moduleContainers` - Contenedores de módulos por grupo
- `templates` - Plantillas de formularios
- `drafts` - Borradores (con sync)
- `documents` - Documentos finalizados
- `catalogs` - Catálogos maestros (tipos: simple, two_column, three_column)

### Formularios dinámicos
- Constructor visual de formularios
- Tipos: texto, número, fecha, select (con catálogo de 2 columnas), checkbox, área de texto
- Validación de campos
- Validación cruzada entre documentos (por tagId autogenerado)
- Tag ID automático: 3 primeras letras de cada palabra del label, separadas por guión
- Detección de nombres duplicados (local y cruzada entre documentos)
- Renderizado de formularios
- Guardado automático (drafts)
- Finalización de documentos

### Sincronización
- SyncContext para manejar offline/online
- Detección de conexión
- Pending changes (drafts no sincronizados)
- Sincronización manual

### Reportes
- Resúmenes de validación por módulo
- Generación de PDFs
- Reportes por rol (admin, teacher, student)

---

## Decisiones de diseño importantes

1. **Offline-first**: La app funciona sin conexión usando IndexedDB
2. **Sincronización gradual**: Los drafts se guardan local y se syncan después
3. **UI con shadcn/ui**: Componentes base estilizados con Tailwind
4. **i18n básica**: Hook useAppText para textos simples

---

## Errores conocidos y soluciones

- **Registro de usuarios en grupos solo local**: `pullGroups()` llamaba `db.groups.clear()` ANTES de verificar que Supabase tuviera datos válidos. Si `pushGroup()` fallaba (o no se había llamado), al recargar la app se perdían todos los datos locales de grupos/miembros. Corregido: ahora `pullGroups()` solo hace `clear()` si la respuesta de Supabase contiene datos (`data.length > 0`). Si la fetch falla o devuelve vacío, se conservan los datos locales. Misma corrección aplicada a `pullModules`, `pullTemplates`, `pullExerciseFolders`, `pullExercises`, `pullExerciseAssignments`, `pullUsers`, `pullCatalogs`.
- **Falta de re-push de grupos**: `syncNow()` (sincronización manual) no subía los grupos locales a Supabase. Agregado `pushAllGroups()` en `dbService` y llamado desde `syncNow()` antes de sincronizar drafts.
- **Pérdida de miembros al recargar por initialSync sin push previo**: El `initialSync()` solo hacía pull. Si datos locales tenían miembros que no estaban en Supabase (push falló), el pull los sobrescribía. Corregido: `initialSync()` ahora hace `pushAllGroups()` antes de `pullGroups()`.

---

## Pendientes y tareas futuras

### Prioritario
3. **Migrar `getCurrentUser()` a API route**: Aunque ahora funciona con cached profile, conviene migrar `supabase.auth.getSession()` y `refreshSession()` a API route server-side para evitar cualquier bloqueo.
4. **Migrar `getSession()`, `hasValidSession()`, `getConnectionStatus()`**: Todas usan `createClient()` que lee cookie de Supabase. Si la cookie no es legible (formato incorrecto, HttpOnly, Secure), fallan. Ideal: una API route `/api/auth/session` que verifique la sesión server-side.

### Mediano plazo
5. **Sync SQL desactualizada**: `supabase_migration.sql` tiene columnas viejas (`exercise_id`, `teacher_id`, `module_ids`) que la Sesión 20 refactorizó a `caseId`, etc. Si se migra desde 0, `pullExerciseAssignments` mapearía `d.case_id` que no existe en Supabase.
6. **Implementar generación real de PDFs** (actualmente simulada)
7. **Mejorar experiencia offline con service workers**
8. **Tests unitarios y de integración**
9. **Curar napkin.md periódicamente** (quitar items obsoletos, mantener máximo 10 por categoría)

---

## Historial de sesiones

### Sesión 18 - Junio 2026
- **Fix REAL pérdida de miembros en grupos al recargar**:
  - El fix de la Sesión 17 solo corrigió `pullGroups()` pero dejó los otros 7 métodos `pull*` con el patrón roto de `clear()` incondicional.
  - **Corregido `pullUsers()`**: Movido `db.users.clear()` DENTRO del `if (data && data.length > 0)`. Antes siempre limpiaba usuarios locales incluso si Supabase devolvía vacío/error → los usuarios desaparecían al recargar.
  - **Corregido `pullCatalogs()`**: Mismo fix. `clear()` solo si hay datos.
  - **Corregido `pullModules()`**: Cambiado `if (data)` por `if (data && data.length > 0)`. Antes hacía `clear()` incluso cuando `data = []`.
  - **Corregido `pullTemplates()`**: Mismo fix que `pullModules`.
  - **Corregido `pullExerciseFolders()`**: Mismo fix.
  - **Corregido `pullExercises()`**: Mismo fix.
  - **Corregido `pullExerciseAssignments()`**: Mismo fix.
  - **Agregado `pushAllGroups()` antes de `pullGroups()` en `initialSync()`** (SyncContext.tsx): Si los datos locales son más recientes (ej: push a Supabase falló por estar offline), ahora se suben ANTES de hacer pull, evitando que el pull sobrescriba miembros con datos obsoletos de la nube. Envuelto en try-catch para que no bloquee el sync si falla.
  - **`pullGroups()` merge de miembros locales**: Ahora preserva `members` locales si la nube tiene `members: []` (push falló). Compara local vs cloud y usa el que tenga datos.
  - **`pullModules()` merge de `groupIds`/`sections`**: Mismo patrón que `pullGroups` para evitar pérdida de datos anidados.
  - **`pushGroup()` mejor logging**: Agregado `JSON.stringify(error)` para ver error vacío `{}` y fallback `|| error.code || 'Error desconocido'`.
- Errores: 7 métodos `pull*` compartían el mismo bug de `clear()` prematuro. Todos corregidos. Push a Supabase falla con error `{}` (posible sesión expirada o proyecto pausado).
- Pendientes: Monitorear persistencia de miembros en grupos. Verificar que `pullUsers` ya no pierde usuarios al recargar.

### Sesión 19 - Junio 2026
- **Rich Text Editor para contenido de secciones**:
  - Creado `components/admin/RichTextEditor.tsx`: Editor WYSIWYG con TipTap. Toolbar completa: Negrita, Cursiva, Subrayado, H1/H2/H3, Listas, Alineación, inserción de imágenes, Undo/Redo.
  - Creado `components/ui/toggle.tsx`: Componente Toggle de shadcn/ui para el toolbar.
  - Actualizado `ModuleEditor.tsx`: Reemplazado `<Textarea>` por `<RichTextEditor>` en contenido de secciones.
  - Paquetes instalados: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-text-align`, `@tiptap/extension-image`, `@tiptap/extension-underline`, `@tiptap/extension-placeholder`.
- **Vista Estudiante: Documentos dentro de secciones**:
  - `student/groups/[id]/page.tsx`: Documentos (formularios) ahora se renderizan DENTRO de cada sección, con estado y progreso. Eliminada la card separada "Contenido del Módulo".
  - Recursos imagen/video se renderizan como `<img>` y `<video>` inline (no como links).
- **Vista Profesor: HTML rendering**:
  - `teacher/groups/[id]/page.tsx`: Cambiado `whitespace-pre-wrap` por `dangerouslySetInnerHTML` + `prose`.
- **Instalado `@tailwindcss/typography`**: Agregado `@plugin` en `globals.css`.
- Errores: Ninguno. `tsc --noEmit` pasa.
- Pendientes: N/A.

### Sesión 16 - Junio 2026
- **Sincronización de Usuarios con Supabase**:
  - Implementado pull de perfiles de usuario desde Supabase (`profiles` table) a la base de datos local Dexie (`db.users`) durante la sincronización inicial (`initialSync` en `SyncContext`).
  - Corregido error donde la creación de nuevos usuarios o edición de existentes no se guardaba/sincronizaba en la nube si ya existían o si se editaban.
  - Modificado el endpoint `/api/admin/users` para permitir operaciones de actualización/upsert de perfiles y contraseñas.
  - Actualizada la política RLS de la tabla `profiles` para lectura pública para todos los usuarios autenticados, permitiendo que docentes y estudiantes vean nombres/perfiles.
- **Gestión de Permisos de Docentes**:
  - Agregada columna `can_create_users` a perfiles en Supabase e IndexedDB.
  - Habilitada interfaz en `UserManager` para que los administradores concedan permisos a docentes seleccionados.
  - Permitido a docentes autorizados registrar nuevos usuarios (uno a uno o masivos) pero restringida la edición/eliminación.
  - Adaptada la barra lateral (`Sidebar.tsx`) y ruta guardada (`page.tsx`) para permitir el acceso a docentes con el permiso.

### Sesión 1 - Mayo 2026
- Inicio del proyecto
- Configuración de Next.js 14
- Setup de Supabase y autenticación
- Estructura básica de roles (admin, teacher, student)
- Creación de componentes UI base

### Sesión 2 - Mayo 2026
- Implementado sistema de memoria para IAs (AI_CONTEXT.md)
- Creado AGENTS.md con reglas obligatorias
- Creado skill `/ai-context` (no funcional en esta sesión)
- Agregada funcionalidad de Banco de Ejercicios en vista docente:
  - Carpetas para organizar casos prácticos
  - Asociación de carpetas a módulos y grupos
  - Asignación de ejercicios a estudiantes específicos
  - Listas jerárquicas: Módulo → Grupo → Estudiantes
  - Ver estado de ejercicios asignados (pendiente, en progreso, completado)
  - Vista Repositorio para gestión global de ejercicios
  - Creación de ejercicios individuales
  - Importación masiva (dos columnas: título - contenido)
  - Asociación de ejercicios a módulos del docente
  - Vista de carpeta detallada: Módulos → Grupos → Ejercicios
  - Botón "Repartir" para distribuir ejercicios a estudiantes

### Sesión 3 - Mayo 2026
- Solucionado problema de pérdida de datos en catálogos del administrador.
- Creado sistema de catálogos maestros en `lib/data/defaultCatalogs.ts`.
- Implementada funcionalidad de "Restaurar Catálogos" en la vista de Seed.
- Automatizada la restauración de catálogos (Puertos, Países, Monedas, Incoterms, etc.) al generar datos de prueba.

### Sesión 4 - Mayo 2026
- Activada la sincronización real con Supabase para catálogos, módulos y borradores.
- Implementado el guardado persistente de perfiles de usuario en la nube.
- Añadida funcionalidad de descarga automática de datos (pull) al iniciar sesión o cargar la app.
- Integrado el botón de "Sincronizar Nube" en el gestor de catálogos para el administrador.
- Asegurada la persistencia de datos entre dispositivos y sesiones de navegador.

### Sesión 5 - Mayo 2026
- Instalada la suite de skills `JuliusBrussee/caveman` mediante comando npx.
- Skills instalados: `cavecrew`, `caveman`, `caveman-commit`, `caveman-compress`, `caveman-help`, `caveman-review`, `caveman-stats`.
- Instalada y adaptada la skill `napkin` para crear y curar un runbook de conocimiento `.agents/napkin.md`.
- Activado de manera global el modo `caveman` en las reglas de sistema.
- Instalada la skill `ui-ux-pro-max` (herramienta de diseño e interfaz con soporte nativo para Antigravity) de forma global.

### Sesión 14 - Junio 2026
- **Reorganización de estructura del proyecto**:
  - Movido `components/sync/SyncContext.tsx` → `lib/contexts/SyncContext.tsx` (es un contexto, no componente UI)
  - Movido `components/theme-provider.tsx` → `components/layout/theme-provider.tsx`
  - Movido `components/document-renderer/FormRenderer.tsx` y `FormVisualizer.tsx` → `components/form-builder/` (consolidación con constructor de formularios)
  - Movido `lib/data/defaultCatalogs.ts` → `lib/defaultCatalogs.ts` (eliminada carpeta `lib/data/`)
  - Eliminados directorios vacíos: `features/`, `components/offline/`
  - Eliminada carpeta `components/sync/` y `components/document-renderer/`
  - Actualizados todos los imports (4 archivos): `app/layout.tsx`, `Header.tsx`, `TeacherDocumentViewer.tsx`, `student/documents/[id]/page.tsx`
- **Verificación**: `tsc --noEmit` pasa con 0 errores. Lint pre-existing sin cambios nuevos.
- Pendientes: `lib/db/db.ts` tiene 27 imports → se deja quieto por ahora (alto riesgo de cambios).

### Sesión 15 - Junio 2026
- **Catálogos: Nuevo tipo de 3 columnas**:
  - Agregado selector de tipo (Simple, Dos Columnas, Tres Columnas) al crear catálogo nuevo
  - Actualizado `lib/db/db.ts`: tipo `three_column` agregado a la unión de tipos
  - Renderizado condicional de columnas según tipo (simple: 1 col, two_column: 2 cols, three_column: 3 cols)
  - Catálogos se ordenan alfabéticamente automáticamente
  - Bulk add adaptado para formato de 3 columnas (Etiqueta;Valor;Valor2)
  - Tipo visible en el accordion header del catálogo
- **Módulos: Función de duplicar/copiar**:
  - Agregado botón `Copy` en la tabla de módulos (visible al hover)
  - `handleDuplicate()`: copia todo el contenido (título, descripción, secciones, recursos, documentos adjuntos)
  - Lo que NO se copia: `teacherId`, `groupIds`, estudiantes/docentes asociados
  - La copia se crea como "borrador" con nuevo ID y "(Copia)" en el título
  - Sincronización inmediata con la nube (`pushModule`)
  - Toast de confirmación al duplicar
- **Build**: `tsc --noEmit` pasa con 0 errores

### Sesión 12 - Junio 2026
- **Ajustes finales landing page** (múltiples iteraciones con feedback del usuario):
  - Hero: texto reducido de tamaño (`3xl/4xl/5xl`), `whitespace-nowrap` por línea, alineado a la izquierda.
  - Hero cambiado a 4 líneas: "APRENDIZAJE BASADO / EN SIMULACION PARA LA / GESTION DOCUMENTAL / DEL COMERCIO EXTERIOR".
  - Las 4 líneas con gradient animado navy↔gold + LetterHover.
  - "COMERCIO INTERNACIONAL" → "COMERCIO EXTERIOR". 
  - Letras más altas (`leading-[1.1]`), más estrechas (`tracking-[-0.07em]`), gap reducido (`gap-1`).
  - Frase secundaria nueva: "Un entorno tecnológico de aprendizaje interactivo asistido con IA... convergiendo en la formación y preparación de profesionales para el comercio global."
  - "con IA" unido con `whitespace-nowrap` para evitar separación entre líneas.
  - Botón "Ingresar" movido a la derecha de la frase secundaria (flex row).
  - Video de YouTube reemplazado por imagen Unsplash de logística portuaria.
  - Imagen de fondo más visible (`opacity-25` → `opacity-40`, overlay cream menos opaco).
  - SimulatorsGrid: todos los cards navy (eliminado gold), fondos más transparentes (`/50`, gradientes `/40/30/40`).
  - Títulos actualizados: "Procesos de Exportación", "Procesos de Importación", "Operaciones de Clasificación Arancelaria".
  - AccessSection: nuevo texto sobre seguridad/gestion documental personalizada, fondo más opaco (`/70 /60 /70`), botón menos alto (`h-14 md:h-16`).
  - Secciones 2 y 4 sincronizadas en transparencia.
- **Build exitoso** en todas las iteraciones.

### Sesión 19 - Junio 2026
- **TipTap rich text editor**: Instalados `@tiptap/*` packages y `@tailwindcss/typography`.
  - `components/admin/RichTextEditor.tsx`: WYSIWYG toolbar (bold, italic, underline, H1/H2/H3, lists, alignment, image insert, undo/redo).
  - `ModuleEditor.tsx`: Reemplazado `<Textarea>` por `<RichTextEditor>` para contenido de secciones.
  - Student `groups/[id]/page.tsx`: Documentos renderizados dentro de cada sección (no en card separada). Imágenes/videos inline como `<img>`/`<video>`.
  - Teacher `groups/[id]/page.tsx`: Cambiado `whitespace-pre-wrap` a `dangerouslySetInnerHTML` + `prose` classes.
  - `globals.css`: Agregado `@plugin "@tailwindcss/typography"`.
- **Fix `record "new" has no field "updated_at"`**: Supabase `groups` table requiere `ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();`.

### Sesión 18 - Junio 2026
- **Fix persistencia de miembros de grupo al recargar**: 
  - `pullGroups()` y `pullModules()` ahora preservan `members`/`sections` locales cuando cloud data está vacía (merge defensivo).
  - `SyncContext.tsx`: `pushAllGroups()` ejecutado antes de `pullGroups()` en `initialSync()` para evitar pérdida de miembros locales.

### Sesión 17 - Junio 2026
- **Fix data loss en pull methods**: Varios métodos `pull*()` en `dbService.ts` hacían `clear()` incondicional antes de verificar datos cloud. Corregidos para preservar datos locales si Supabase está vacío.

### Sesión 22 (final) - Junio 2026
- **Fix login congelado definitivo**: Creado `app/api/auth/login/route.ts` (proxy server-side a Supabase Auth). `authService.login()` reemplazado por fetch directo a `/api/auth/login` desde LoginForm. Setea cookie de sesión Supabase server-side con formato `base64-<base64_json>` que `@supabase/ssr` puede leer.
- **Fix logout congelado**: Creado `app/api/auth/logout/route.ts` para signOut server-side. Logout page usa fetch a esta API route.
- **Fix race condition en useAuth**: Eliminada subscripción `onAuthStateChange` que causaba `setUser(null)` antes de que `getCurrentUser()` completara, resultando en redirect a login por `RoleGuard`.
- **Fix `hasValidSession()`**: Ahora retorna true si hay cached profile (aunque cookie de sesión no sea legible por browser). `getConnectionStatus()` simplificado a `'cloud'` si `hasValidSession()` o `'local'` si no.
- **Fix sync bloqueado por browser**: Creado `app/api/sync/pull/route.ts` que usa `createAdminClient()` (service role key) para hacer fetch de TODAS las tablas desde Supabase sin bloqueos del browser.
- **SyncContext.initialSync()**: Reemplazadas las llamadas directas a `dbService.pull*()` (que usan supabase client en browser y fallan) por un solo fetch a `/api/sync/pull` que escribe todo en IndexedDB.
- **Nuevos archivos**: `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/sync/pull/route.ts`
- **Archivos modificados**: `hooks/useAuth.ts` (eliminada subscripción onAuthStateChange), `lib/contexts/SyncContext.tsx` (initialSync usa API proxy), `lib/services/authService.ts` (hasValidSession con fallback a cached profile), `components/auth/LoginForm.tsx` (fetch directo + role resolution), `app/(auth)/logout/page.tsx` (usa fetch API)
- **Causa raíz**: Browser/Windows bloquea requests directos a `supabase.co`. Solución: proxy server-side via API routes de Next.js.
- Pendientes: push operations también necesitan API routes proxy para crear/actualizar datos en Supabase.

### Sesión 22 - Junio 2026
- **Fix login congelado (no response, CSP/firewall de Windows bloquea Supabase Auth)**:
  - Diagnóstico: Login se quedaba en "Conectando..." sin error. Confirmado que browser (Chrome/Edge) no puede hacer fetch directo a `supabase.co/auth/v1/token` aunque CORS esté configurado y curl funcione. Probablemente Windows Defender Network Protection o firewall corporativo bloquea el request.
  - Creado `app/api/auth/login/route.ts`: API route server-side que recibe `{ email, password }` del browser, llama a `createRouteHandlerClient` → `supabase.auth.signInWithPassword()`, y devuelve `{ user, access_token, refresh_token }` al cliente. Las cookies de sesión se setean via `setAll` del handler.
  - `authService.login()` refactorizado: ahora hace POST a `/api/auth/login` (mismo origen, sin restricciones de CSP/CORS) en vez de fetch directo a Supabase Auth. El `Promise.race` con timeout de 20s maneja el caso de servidor caído.
  - Sesión inyectada al cliente Supabase via `setSession()` para que REST calls (profiles, etc.) funcionen.
- Errores: Login se congelaba porque el browser/Windows bloqueaba el request a Supabase Auth. El `AbortSignal.timeout` no funcionaba en ese contexto. Solución: proxy server-side.
- Pendientes: Migrar también `getCurrentUser()` y `getSession()` a API routes server-side para evitar el bloqueo también en carga inicial.

### Sesión 21 - Junio 2026
- **Fix arquitectura de sync: los datos ahora sí llegan a Supabase**:
  - **Problema original**: `getCurrentUser()` retorna perfil cacheado (`cached_user_profile` en localStorage) aunque la sesión real de Supabase haya expirado. `SyncContext` ve un `user` truthy e inicia sync, pero los `push*()` y `pull*()` fallan con error `{}` (sin sesión Supabase). Los datos quedan solo en IndexedDB.
  - **`authService.hasValidSession()`**: Nueva función que verifica `supabase.auth.getSession()`.
  - **`authService.getConnectionStatus()`**: Retorna `'cloud' | 'local' | 'mock'` según el estado real de la sesión.
  - **Guard en todos los `push*()` y `delete*Cloud()`**: `pushGroup`, `pushModule`, `pushTemplate`, `pushExerciseFolder`, `pushExercise`, `pushExerciseAssignment`, `pushCatalogs`, `pushAllGroups` y todos los `delete*Cloud` — ahora verifican `hasValidSession()` antes de intentar la operación. Si no hay sesión, skip con `console.warn` en vez de fallar con `{}`.
  - **Guard en `pullCatalogs()`**: Faltaba el guard de sesión y además hacía `throw error` (cortaba todo el `initialSync`). Cambiado a `console.error + return` como los demás pull.
  - **`getCurrentUser()` ahora intenta refresh de sesión**: Cuando hay cached profile pero no session, llama a `supabase.auth.refreshSession()` antes de caer en modo local. Esto permite recuperación automática de sesiones expiradas.
  - **Indicador visual en Header**: Muestra badge "Cloud" (verde) o "Local" (ámbar) según `connectionStatus`, spin durante sync, contador de cambios pendientes.
  - **Banner flotante "Modo local"**: Aparece en la esquina inferior derecha cuando no hay sesión, con botón "Reintentar".
  - **Sesión refrescada periódicamente**: Cada 30s se verifica `getConnectionStatus()`.
  - **`pullCatalogs`**: Arreglado `throw error` que cortaba todo el `initialSync` — ahora log + return como los demás.
- **`syncAll()` en SyncContext**: Nuevo método de sincronización bidireccional completa:
  - Push: grupos, módulos, templates, exercise folders, exercises, assignments, catálogos
  - Pull: catálogos, usuarios, grupos, módulos, templates, exercise folders, exercises, assignments
  - No lanza error si un push individual falla (`.catch(() => {})`)
- **Timer periódico cada 5 minutos**: Llama `syncAll()` automáticamente para mantener datos frescos sin intervención.
- **Botón "Sincronizar" en admin dashboard**: Al lado del botón "Diseñador de Documentos". Muestra spinner durante sync, icono Cloud (verde) o CloudOff (ámbar) según estado. Se deshabilita si está en modo local.
- **`tsc --noEmit`**: Pasa sin errores.
- Pendientes: `supabase_migration.sql` desactualizada (columnas viejas `exercise_id`, `teacher_id`). Si se ejecuta desde 0, `d.case_id` fallará.

### Sesión 20 - Junio 2026
- **Rediseño completo del Exercise Bank** como repositorio compartido de casos PDF:
  - `types/exercises.ts`: Reemplazados `ExerciseFolder`/`Exercise`/`ExerciseAssignment` por `CaseFolder`/`CaseItem`/`CaseAssignment`.
  - `lib/db/db.ts`: Dexie version 16, nuevas tablas `caseFolders`/`cases`/`caseAssignments` con `caseId` index. Upgrade handler limpia datos viejos.
  - `components/teacher/ExerciseBank.tsx`: UI renovada con vista de repositorio (grilla de carpetas) y vista de detalle de carpeta con selector de grupo, dos listas (casos/estudiantes), subida inline de PDF como base64 data URL, y flujo de asignación. Admite `isAdmin` prop.
  - `app/(dashboard)/dashboard/admin/exercises/page.tsx`: Nueva ruta admin que wrappea `ExerciseBank` con `isAdmin`.
  - `app/(dashboard)/dashboard/student/cases/page.tsx`: Nueva ruta estudiante que muestra casos asignados con visor PDF embebido, estado de asignación, badge de compañeros asignados al mismo caso.
  - `components/layout/Sidebar.tsx`: Agregados links "Banco Ejercicios" (admin) y "Mis Casos" (student).
  - `lib/appTexts.ts`: Agregadas claves `common.sidebar.admin_exercises` y `common.sidebar.student_cases`.
  - `lib/services/dbService.ts`: Actualizados métodos `pullExerciseFolders`, `pushExerciseFolder`, `pullExercises`, `pushExercise`, `pullExerciseAssignments`, `pushExerciseAssignment` y sus `deleteCloud` hermanos para usar `CaseFolder`/`CaseItem`/`CaseAssignment` (sin `teacherId`, `moduleIds`, `groupIds`, `moduleId`, `dueDate`; renombrado `exerciseId` → `caseId`).
  - `app/(dashboard)/dashboard/student/groups/[id]/page.tsx`: Actualizado para usar `caseId` en assignments y mostrar `content` como objeto con soporte PDF.
- **Build exitoso**: `tsc --noEmit` sin errores.

### Sesión 11 - Junio 2026
- **Rediseño completo de la landing page** con diseño premium editorial/trade:
  - **Tipografía**: Syne (headings via `next/font/google`) + DM Sans (body), reemplazando Inter.
  - **Paleta**: Navy `#15123A` (reemplaza `#21165E`), Gold `#C4953C` (acento trading/premium), Teal `#14B8A6` (toque tech), Cream `#F5F3F0` (fondo editorial).
  - **Animaciones clave**:
    - Hero: letras que saltan individualmente al hover (`LetterHover` component).
    - Gradient text animado en la línea "LOGISTICA EFICIENTE" (`animate-gradient-shift`).
    - Stagger reveal en tarjetas de simuladores (`containerVariants` + `cardVariants`).
    - Parallax scroll en orbes del fondo (via `useScroll` + `useTransform`).
    - Líneas SVG animadas tipo "rutas de navegación" sobre el background con `animate-route-dash`.
    - Glow dinámico en `TiltCard` que sigue el cursor usando `useMotionValue`.
  - **Componentes rediseñados**:
    - `Navbar.tsx`: Glass effect mejorado, hover con letras que suben, underline dorado animado en links.
    - `Hero.tsx`: LetterHover (letras saltan y se vuelven doradas al hover), scroll indicator animado, badge premium.
    - `SimulatorsGrid.tsx`: Grid responsivo 5-columnas, gradientes navy/gold, icon hover effects, modal con layoutId animation.
    - `ContactSection.tsx`: Floating labels animados (suben al focus), estado de submit con CheckCircle.
    - `AccessSection.tsx`: Parallax background, gradientes radiales decorativos, botón gold con flecha animada.
    - `Footer.tsx`: Grid 4-columnas con links agrupados (Plataforma, Legal, Soporte), badges de seguridad.
    - `TiltCard.tsx`: Glow spotlight que sigue el cursor radialmente.
    - `InteractiveBackground.tsx`: Orbes con parallax diferencial, SVG routes animados, gradiente fade inferior.
  - `globals.css`: Variables de color navy/gold/teal/cream, animaciones CSS personalizadas (gradient-shift, route-dash, float-slow, pulse-glow), `font-heading` utility.
  - `layout.tsx`: Syne + DM Sans via next/font, `font-heading` CSS variable.
- **Build exitoso**: Sin errores TypeScript ni de compilación.

### Sesión 10 - Junio 2026
- **Migración a Supabase real**: Creado `supabase_migration.sql` con 9 tablas (profiles, catalogs, groups, modules, templates, drafts, exercise_folders, exercises, exercise_assignments), índices, triggers updated_at, y políticas RLS completas.
- **Corregido error de tipos SQL**: `auth.uid()::text = id` causaba "operator does not exist: text = uuid". Cambiado a `auth.uid() = id` (UUID vs UUID).
- **Agregada política admin para catalogs**: Solo admins pueden escribir; autenticados pueden leer.
- **Fix login con Supabase real**: `authService.login()` y `getCurrentUser()` ahora resuelven el rol en este orden:
  1. `user_metadata.role` del JWT
  2. IndexedDB (para migración desde modo mock)
  3. Inferencia por email (admin@test.com → admin, etc.)
  4. `profiles` table en Supabase (corrige si el trigger dejó 'student' por defecto)
  Esto permite crear usuarios manualmente en Supabase Auth Dashboard y que la app asigne el rol correcto sin importar metadata.
- **Actualizado `.env.local`** con credenciales reales de Supabase.
- **LoginForm.tsx**: Eliminados "Accesos Rápidos" (quick login buttons), botón "Restablecer Datos de Prueba", y dependencias no utilizadas (useLiveQuery, dbService, db). Ahora solo muestra formulario email+password.
- **Seed page eliminada**: Borrada ruta `/dashboard/admin/seed`, su sidebar link, y claves de traducción asociadas en `appTexts.ts`.
- **Fix build error**: Corregido type mismatch de `PromiseExtended` vs `Promise<void>` en `export/page.tsx` (bulkPut).
- **Fix sync pull no reflejaba borrados remotos**: Todos los métodos `pull*()` en `dbService.ts` ahora hacen `clear()` antes de `bulkPut()`, asegurando que eliminaciones hechas directo en Supabase se reflejen en IndexedDB. Afecta: catalogs, groups, modules, templates, exercise_folders, exercises, exercise_assignments.
- **Fix pantalla de usuarios se quedaba cargando**: `getCurrentUser()` ahora usa caché en localStorage (`cached_user_profile`) para retornar inmediatamente en la primera carga, y refresca el rol en segundo plano desde Supabase/profiles. Agregado timeout de 5s a `supabase.auth.getSession()` para evitar que la autenticación se cuelgue. Refactorizada lógica de resolución de rol a `resolveUserRole()` para reutilización.
- **Fix usuarios duplicados en IndexedDB**: `login()` en `authService.ts` y `handleSave()` en `UserManager.tsx` ahora buscan registro existente por `userId` antes de insertar (upsert real). Agregado efecto de deduplicación automática en `UserManager.tsx` que limpia duplicados al cargar la página.
- **Fix botón eliminar en UserManager**: Eliminada restricción que ocultaba el botón de borrar para usuarios admin. Ahora todos los usuarios pueden eliminarse (con confirmación).
- **Fix builder (Sidebar.tsx) — Drag & Drop y reordenamiento**:
  - Reordenamiento dentro de una misma sección mediante botones flecha (ArrowUp/ArrowDown) que aparecen al hover.
  - Movimiento entre secciones mediante HTML5 Drag & Drop nativo a nivel de sección.
  - Eliminadas imágenes fantasma del drag usando `setDragImage()` con GIF transparente de 1x1 pixel.
  - Scroll automático al final de los campos al usar "Añadir Masivo".
  - Código simplificado: eliminada lógica compleja de drop por campo con stale closures.
- Errores: El SQL original falló por type mismatch text vs uuid en RLS. Login fallaba porque `getCurrentUser()` no resolvía roles correctamente. DnD del builder tenía stale closures y ghost images del navegador.

### Sesión 9 - Junio 2026
- **Implementación de Sincronización Completa con Supabase**:
  - `dbService.ts`: Agregados métodos `pull` (descarga), `push` (subida/upsert) y `deleteCloud` para `groups`, `modules`, `templates`, `exercise_folders`, `exercises`, y `exercise_assignments`.
  - `SyncContext.tsx`: Agregadas llamadas a los métodos `pull` de todas las entidades durante la fase de `initialSync()`. Esto asegura que al recargar la app se obtengan los datos frescos de la nube.
  - Modificados componentes de UI (`GroupManager.tsx`, `ModuleEditor.tsx`, `ModulesPage`, `FormDesigner.tsx`, `BuilderPage`, y `ExerciseBank.tsx`) para disparar llamadas directas a la nube mediante `dbService.push*` o `deleteCloud*` inmediatamente después de interactuar con Dexie (guardado offline-first con impacto en tiempo real a Supabase).

### Sesión 8 - Junio 2026
- **Diagnóstico de datos**: Mapeado dónde vive cada tabla (IndexedDB vs Supabase).
  - Solo `catalogs`, `profiles`, `drafts` tenían sync con Supabase.
  - `groups`, `modules`, `templates`, `exercises` vivían solo en IndexedDB.
- **Página de exportación creada**: `/dashboard/admin/export` (nueva ruta).
  - Lee todas las tablas de Dexie y descarga un `sim-backup-YYYY-MM-DD.json`.
  - También permite importar el JSON de vuelta a IndexedDB (para migrar entre dispositivos).
- **Link añadido al sidebar**: Ícono `HardDriveDownload`, solo visible para admin.
- **SQL de migración generado**: `supabase_migration.md` (en artifacts).
  - 12 bloques SQL para crear todas las tablas en Supabase.
  - Incluye RLS, índices, triggers de `updated_at`.
  - Tablas nuevas: `groups`, `modules`, `templates`, `exercise_folders`, `exercises`, `exercise_assignments`.
- **Pendiente próxima sesión**: 
  - Ejecutar el SQL en Supabase (si no se ha hecho).
  - Testear flujos completos de sincronización (crear admin, verificar si profesores/estudiantes ven los datos).

### Sesión 7 - Mayo 2026
- Activados skills de memoria y compresión permanentemente:
  - **ai-context**: Lectura/escritura obligatoria de AI_CONTEXT.md
  - **napkin**: Creado `.agents/napkin.md` con runbook vivo del proyecto
  - **caveman**: Comunicación ultracomprimida (modo ya activo)
  - **caveman-compress**: Comprimir archivos .md cuando sea necesario
- Creado napkin inicial con reglas de ejecución, dominio y shell

### Sesión 6 - Mayo 2026
- **Catálogos estandarizados a 2 columnas**: Todas las listas en `CatalogManager.tsx` ahora tienen "Etiqueta Visible" (label) y "Valor Principal" (value). Eliminado selector de tipo y columna `value2`.
- **Sincronización automática**: Añadido `onBlur` en inputs de catálogos para disparar `handleCloudSync()` y persistir en Supabase.
- **Eliminado tipo `two_column_select`**: Removido de `FieldType` en `types/form.ts`, de `Sidebar.tsx` (opciones de tipo de campo), de `Canvas.tsx` (icono LayoutGrid), y de `FormRenderer.tsx` (lógica de renderizado).
- **Select con catálogo mejorado**: En vista docente/estudiante, el dropdown muestra 2 columnas (etiqueta + valor). Al seleccionar, solo se guarda la "Etiqueta Visible" en `formData`.
- **Auto-generación de Tag ID**: En `Sidebar.tsx`, el `tagId` se genera automáticamente a partir de las 3 primeras letras de cada palabra del nombre del campo, separadas por guión.
- **Validación de duplicados**: Implementada detección de nombres repetidos dentro del mismo documento y validación cruzada de Tag ID entre otros documentos (con alertas visuales).
- **Modo Caveman activado**: Configurado permanentemente para todas las sesiones futuras. Respuestas siempre en español.

### Sesión 23 - Junio 2026
- **Banco de Ejercicios: Repositorio + Espacio Personal**:
  - `types/exercises.ts`: Agregados campos `space: 'repository' | 'personal'` y `ownerId: string | null` a `CaseFolder` y `CaseItem`.
  - `lib/db/db.ts`: Dexie version 17 con nuevos índices `space`, `ownerId`, `[space+ownerId]` y upgrade handler que migra datos existentes sin pérdida.
  - `lib/services/dbService.ts`: Pull methods ahora preservan items personales (solo limpian `space: 'repository'`). Push/delete de items personales se omiten del cloud sync.
  - **Admin** (`/dashboard/admin/exercises`): Vista completa del repositorio con CRUD (crear, editar, eliminar carpetas/casos). Sin cambios visuales respecto a la versión anterior.
  - **Teacher** (`/dashboard/teacher/library`): Nueva interfaz con dos tabs:
    - **Repositorio**: Vista de solo lectura. El teacher puede explorar carpetas, ver casos y copiarlos a su espacio personal mediante botón "Copiar a Mi Espacio" que despliega selector de carpeta destino.
    - **Mi Espacio**: CRUD completo sobre sus propias carpetas y casos (crear, editar, eliminar, subir PDF, asignar a estudiantes). Filtrando por `space: 'personal'` y `ownerId: teacherId`.
  - **Folder editing**: Nueva funcionalidad de editar carpetas (renombrar, cambiar descripción) disponible vía botón `Pencil` al hover en el grid y en la vista detalle.
  - Solo visible para admin y teachers (students no ven estos links).
- **Build**: `tsc --noEmit` pasa sin errores.
- Errores: Ninguno.
- Pendientes: Migrar `push*` ops a API routes proxy (ver Pendientes anteriores).

### Sesión 24 - Junio 2026
- **Student page: Casos dentro del card del módulo**:
  - `student/groups/[id]/page.tsx`: Movida la sección "Casos de Estudio" (antes en Card separado) **dentro del mismo Card del módulo**, debajo de las secciones. Separada por `border-t`.
  - Eliminado Card duplicado que quedó de la estructura anterior.
- **Build**: `tsc --noEmit` pasa sin errores.
- Errores: Ninguno.
- Pendientes: N/A.

### Sesión 27 - Julio 2026
- **Migración masiva de IndexedDB (Dexie/useLiveQuery) a React Query hooks**:
  - `admin/page.tsx`: Reemplazados 5 `useLiveQuery` con hooks.
  - `CatalogManager.tsx`: `useLiveQuery` → `useCatalogs()`, escrituras migradas a mutations.
  - `GroupManager.tsx`: 4 `useLiveQuery` reemplazados, escrituras a mutations.
  - `ModuleEditor.tsx`, `UserManager.tsx`, `admin/modules/page.tsx`, `admin/builder/page.tsx`, `admin/settings/page.tsx`, `FormRenderer.tsx`, `Sidebar.tsx`, `hooks/useAppText.ts`.
- Build: `tsc --noEmit` pasa (solo error pre-existente en API route).
- Pendientes: Migrar student pages, profile page, FormDesigner. Migrar push ops a API routes proxy.

### Sesión 28 - Julio 2026
- **Migración student pages + profile de IndexedDB (Dexie/useLiveQuery) a React Query hooks**:
  - `student/page.tsx`: `useGroups()`, `useModules()`, `useTemplates()`, `useUsers()`, `useDrafts()` reemplazan 5 `useLiveQuery`.
  - `student/groups/page.tsx`: Misma migración. `myDbUser` field names actualizados a `UserProfile` (`id`/`fullName`).
  - `student/groups/[id]/page.tsx`: `useGroup()`, `useModule()` (con `enabled` automático), `useTemplates()` + `useMemo` para filtrar templates por módulo/adjuntos. `useDrafts()` con filtro `{ userId, groupId }`. `useExerciseAssignments()` y `useExercises()` + `useMemo` para filtrar casos asignados.
  - `student/documents/page.tsx`: 5 hooks reemplazan `useLiveQuery`.
  - `student/documents/[id]/page.tsx`: `useTemplate(templateId)` reemplaza `db.templates.get()`.
  - `student/cases/page.tsx`: `useExercises()`, `useExerciseAssignments()`, `useUsers()`, `useExerciseFolders()`.
  - `student/reports/page.tsx`: Eliminado `dbService.getGroups/getUsers` del useEffect. `useGroups()`, `useModules()`, `useUsers()` con `useMemo` para derivar `myGroups` y `teacherName`. Eliminado `loading` state (usa `isLoading` del hook).
  - `profile/page.tsx`: `useGroups()`, `useDrafts()` reemplazan `useLiveQuery`.
- Errores: `UserProfile` type mismatch (`id`/`fullName` vs `userId`/`name`). Misma solución que Sesión 27: callback params anotados con `: any`. Pre-existing errors en `teacher/` pages y `ExerciseBank.tsx` persisten sin cambios.
- Build: `tsc --noEmit` pasa con 0 errores nuevos (30 pre-existing sin cambios).
- Pendientes: Migrar `FormDesigner.tsx` (aún usa `dbService`). Migrar push ops a API routes proxy.

### Sesión 27 - Julio 2026
- **Página de migración de datos**: Creada `/dashboard/admin/migrate` con mapeo campo-por-campo (camelCase IndexedDB → snake_case Supabase) para migrar datos locales a la nube.
- **Fix reportes admin/teacher**: Corregido `teacher.userId` → `teacher.id` y `teacher.name` → `teacher.fullName` por cambio a UserProfile.
- **Fix Sidebar**: Reemplazado link "Exportar / Importar" por "Migrar a Nube" → `/dashboard/admin/migrate`.
- **Fix authService**: Removidas todas las dependencias de IndexedDB. Eliminado el fallback de resolución de rol desde Dexie.
- **Limpieza**: Eliminados archivos `db.ts`, `SyncContext.tsx`, `dbService.ts`, `export/page.tsx`. Desinstalados `dexie` y `dexie-react-hooks`.
- **Build**: `tsc --noEmit` y `next build` pasan sin errores.

### Sesión 26 - Julio 2026
- **REFACTOR COMPLETO: Eliminada dependencia de IndexedDB. Arquitectura Supabase-first**:
  - **Creado** `app/api/data/[table]/route.ts`: API route genérica CRUD (GET/POST/DELETE) que usa `createAdminClient()` (service_role_key) para todas las tablas.
  - **Creado** `lib/services/dataService.ts`: Cliente fetch tipado que reemplaza `dbService.ts`.
  - **Creado** `hooks/useData.ts`: 19 hooks de React Query (useGroups, useModules, useDrafts, useCatalogs, useExercises, etc.) con mutations que invalidan cache automáticamente.
  - **Creado** `app/providers.tsx`: QueryClientProvider con staleTime 30s.
  - **Creado** `types/index.ts`: Barrel file con todos los tipos, incluyendo `Draft` (antes en `db.ts`).
  - **Creado** `app/(dashboard)/dashboard/admin/migrate/page.tsx`: Página de migración única que lee datos del viejo IndexedDB (Dexie) via API nativa y los envía a Supabase via dataService.
  - **Migrados ~22 archivos**: admin (dashboard, CatalogManager, GroupManager, ModuleEditor, UserManager, builder, modules, settings), teacher (dashboard, groups, ExerciseBank, TeacherDocumentViewer, reports), student (dashboard, groups, documents, cases, reports), profile, FormRenderer, Sidebar, FormDesigner, Header, validationService, useAppText.
  - **Auth**: Removidas todas las referencias a IndexedDB en authService. Login usa cached profile (localStorage) + API routes.
  - **Eliminados**: `lib/db/db.ts`, `lib/contexts/SyncContext.tsx`, `lib/services/dbService.ts`, `app/(dashboard)/dashboard/admin/export/page.tsx`.
  - **Dependencias eliminadas**: `dexie`, `dexie-react-hooks` (npm uninstall).
  - **Sync removido**: Eliminado SyncProvider del layout, botón Sync del header/dashboard, indicadores de estado cloud/local.
- **Build**: `tsc --noEmit` + `next build` pasan sin errores.
- Errores: Ninguno.
- Pendientes: Migrar datos de localhost+Vercel a Supabase usando `/dashboard/admin/migrate`.

### Sesión 25 - Junio 2026
- **Fix `case_id` column not found**: `exercise_assignments` en Supabase tenía `exercise_id` (schema viejo). El push enviaba `case_id` y fallaba.
  - `dbService.ts`: push envía `exercise_id` + pull lee `d.case_id ?? d.exercise_id` (compatible ambos schemas).
  - `pullExercises()`: maneja `content` como string (viejo) u objeto (nuevo).
  - `supabase_migration_fix_case_id.sql`: migración para renombrar `exercise_id` → `case_id`, drop `module_id`/`due_date`, y cambiar `content TEXT` → `JSONB`.
  - `supabase_migration.sql`: actualizado con schema correcto.
  - Después de migración: push/pull actualizados a solo `case_id`.
- **Admin asigna casos**: `canAssign` cambiado de `currentTab === 'personal' && !isAdmin` a `isAdmin || currentTab === 'personal'`.
- **Eliminar asignación**: Agregado botón ❌ en cada badge de estudiante asignado en ExerciseBank detail view. Función `removeAssignment()` que borra de IndexedDB y Supabase.
- **Tarjetas sin scroll**: Student page cambiado de `overflow-x-auto` horizontal a `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3` responsivo.
- **Fix doble scrollbar**:
  - Eliminados `max-h-[600px] overflow-y-auto` y `max-h-[400px] overflow-y-auto` del ExerciseBank (detail view).
  - Eliminado `h-[calc(100vh-4rem)] overflow-y-auto` del admin builder page.
- **Build**: `tsc --noEmit` pasa sin errores.
- Errores: Migración falló inicialmente porque `content TEXT DEFAULT ''` no se castea a `jsonb`. Fix: drop default primero, `CASE WHEN content = '' THEN '{}'::jsonb ELSE content::jsonb END`, luego set default.
- Pendientes: N/A.

### Sesión 29 - Julio 2026
- **IndexedDB (Dexie) migration completa**: Eliminados todos los accesos directos a `db.*`, `dbService.*`, y `SyncContext.*`.
- **Archivos editados**:
  - `FormDesigner.tsx`: `db.templates.put` + `dbService.pushTemplate` → `dataService.save('templates', ...)`
  - `FormRenderer.tsx`: `db.drafts.where/add/update` → `useDrafts()` hook + `useCreateOrUpdateDraft()` mutation
  - `Header.tsx`: Eliminado `useSync`, íconos de cloud/sync, badges de estado de conexión, contador de pending changes, spinner de syncing
  - `validationService.ts`: `db.drafts.where` + `dbService.*` → `dataService.getAll/getById`
  - `teacher/reports/page.tsx`: `dbService.getGroups/getGroupById/getModuleById/getUserByUserId` → `dataService.getAll/getById`
  - `admin/reports/page.tsx`: Mismo patrón que teacher reports
  - `UserManager.tsx`: `db.users.bulkDelete/where/update/add/delete` → `dataService.save/delete` + `queryClient.invalidateQueries`
- **Archivos eliminados**:
  - `app/(dashboard)/dashboard/admin/export/page.tsx` (obsolete export page)
  - `lib/contexts/SyncContext.tsx` (obsolete sync engine)
  - `lib/services/dbService.ts` (replaced by dataService.ts)
  - `lib/db/db.ts` (Dexie schema — Draft type already in types/index.ts)
- **Build**: `tsc --noEmit` pasa. 30 errors pre-existentes sin cambios (UserProfile type mismatch, API route type).
- Errores nuevos: 0.
- Pendientes: Migrar push ops a API routes proxy (pre-existing).

### Sesión 35 - Julio 2026
- **Separation repo/personal sin migración DB**: Almacenamos ownership DENTRO de campos existentes:
  - `embedMeta`/`extractMeta`: guarda `{ownerId,space}` como JSON en `description` de folders.
  - `addCaseMeta`/`caseOwner`: guarda `{_o,_s}` dentro del `content` JSONB de casos.
  - Filtros de folders/casos ahora usan metadata extraída en vez de columnas DB.
  - `copyFolderToPersonal`/`copyCaseToPersonal`/`bulkCopyToPersonal`: copian metadata correcta.
  - `updateFolder`: preserva metadata original al editar descripción.
  - Descripción mostrada en UI: siempre limpia (sin JSON).
- **Permisos corregidos**:
  - `canDelete = isAdmin` (solo admin elimina casos/carpetas).
  - `canRename = isAdmin`.
  - Teacher en repo: read-only. Teacher en personal: crea carpetas + sube casos.
- **Fix nombre estudiante en asignaciones**: `getAssignedStudents()` usa `fullName`, fallback a `name` (columna del trigger Supabase), luego `email`.
- **Fix nombres no aparecían en lista de estudiantes**: Agregado helper `userName(u)` que retorna `fullName || name || email || 'Usuario'` y usado en todos los `<span>` de nombre.
- **Fix duplicación de asignaciones**: `assignCases()` ahora detecta asignaciones existentes ANTES de mutar. Muestra alert si ya existen, confirm si hay mezcla. Limpia `selectedCaseIds` y `selectedStudentIds` después de asignar.
- Build: `tsc --noEmit` + `next build` pasan.

### Sesión 34 - Julio 2026
- **Fix asignaciones: mostrar nombre estudiante + agrupar por grupo**:
  - `getAssignedStudents()` ahora incluye `groupId`/`groupName` y mejor fallback para nombre (email o UUID truncado).
  - Display de asignaciones agrupado por grupo: cada grupo es un botón clickeable que selecciona el grupo en el panel lateral.
  - `components/teacher/ExerciseBank.tsx`
- **Fix carpetas personales de docente no aparecían**:
  - Filtro client-side: si no hay carpetas con `ownerId` matching, muestra TODAS (fallback para cuando columnas no existen).
  - `createFolder` incluye `ownerId` si aplica, con retry si la columna no existe.
  - Copia de casos (`copyCaseToPersonal`, `bulkCopyToPersonal`) incluye `ownerId` con retry.
- **Nuevo: Copiar carpeta entera**:
  - Botón `Download` en cada carpeta en vista repositorio (solo teachers).
  - `copyFolderToPersonal()`: copia la carpeta + todos sus casos al espacio personal del docente.
  - Diálogo de confirmación antes de copiar.
- Build: `tsc --noEmit` + `next build` pasan.

### Sesión 33 - Julio 2026
- **Fix crear carpetas en Banco de Ejercicios no funcionaba**:
  - Las tablas `exercise_folders` y `exercises` en Supabase no tenían las columnas `space`/`owner_id` (agregadas en Sesión 23 para espacio personal).
  - Creado `supabase_migration_add_space_owner.sql` para agregar las columnas faltantes. (Ejecutar en Supabase SQL Editor).
  - Mientras no se ejecute la migración, las operaciones de guardado ya no envían `space`, `ownerId`, `createdAt`, `updatedAt` para evitar errores de columna inexistente.
  - Filtros de GET: cambiados de server-side (`.eq('space',...)`) a client-side (`.filter(f => f.space === ...)`) para que no fallen si la columna no existe. `useExerciseFolders()` y `useExercises()` se llaman sin filtros.
  - Agregado `try/catch` con `alert()` en `createFolder` y `updateFolder` para que el usuario vea errores.
- **Soporte JPG en subida de archivos**:
  - `app/api/storage/upload/route.ts`: Bucket ahora acepta `image/jpeg`. `contentType` dinámico según tipo de archivo. Validación acepta `application/pdf` e `image/jpeg`.
  - `ExerciseBank.tsx`: `handleFilesSelect` filtra PDF + JPG. Input accept `.pdf,.jpg,.jpeg`. Título extrae extensión `.pdf|.jpg|.jpeg`. Visor muestra `<img>` si es JPG, `<iframe>` si es PDF.
  - Build: `tsc --noEmit` + `next build` pasan.

### Sesión 32 - Julio 2026
- **Fix documentos adjuntos no visibles en vista docente**:
  - `dataService.ts`: `mapKeys()` no procesaba arrays anidados → `toCamelObj`/`toSnakeObj` dejaban intactas las keys dentro de `sections` JSONB. Si Supabase almacenaba `attached_document_ids`, el código leía `section.attachedDocumentIds` (undefined).
  - Fix: `mapKeys` ahora recorre arrays recursivamente con `obj.map(item => mapKeys(item, transform))` y valores de objetos anidados con `mapKeys(v, transform)`.
- **Fix "No hay imagen de fondo configurada" en FormVisualizer**:
  - `hooks/useData.ts`: `useTemplates()` no incluía `pdf_url` en el `select` → `template.pdfUrl` era undefined.
  - Fix: agregado `pdf_url` al select.
- **Fix drafts no aparecían en TeacherDocumentViewer**:
  - `app/api/data/[table]/route.ts`: Los filtros GET usaban camelCase (`userId`, `moduleId`) pero Supabase columnas son snake_case (`user_id`, `module_id`). `query.eq('userId', val)` retornaba 0 resultados.

### Sesión 37 (actual) - Julio 2026
- **ContactSection.tsx**: Importados `useDesignSettings` y `hexToRgba` para usar colores dinámicos. Reemplazados todos los colores hardcodeados por inline styles dinámicos. Agregado `<style>` block con CSS dinámico para hover/focus/placeholder del formulario. Duplicados fijos: imports duplicados eliminados, variable `shadowStyle` duplicada eliminada.
- **Footer.tsx**: Reescribir completo con colores dinámicos desde `useDesignSettings()`. Usa `hexToRgba` para backgrounds, borders, y texto. Sin cambios estructurales.
- **SimulatorsGrid.tsx**: Ya tenía colores dinámicos correctos (de Sesión 12). Sin cambios.
- **AccessSection.tsx**: Reescribir con colores dinámicos. Reemplazados gradientes hardcodeados por inline styles con `hexToRgba`. Agregado hover state para botón gold.
- **ContactSection.tsx**: Colores dinámicos en formulario, floating labels, input fields, botón submit. Shadow dinámico.
- Errores: Ninguno. `tsc --noEmit` pasa.
- Pendientes: Verificar que los colores dinámicos se reflejen correctamente en la landing page.
  - Fix: API route convierte camelCase → snake_case en filter keys via `toSnakeCase()`.
- **Mejora: documentos clickeables en módulo**:
  - `teacher/groups/[id]/page.tsx`: Los documentos adjuntos usan `FormVisualizer` directo con `trigger` prop (sin `Dialog` anidado). Click al ojo → abre preview directo.
  - Docente puede ver el documento que los estudiantes diligencian (read-only).
  - `FormVisualizer.tsx`: Agregado `DialogClose` con icono `ArrowLeft` junto al botón "Imprimir Documento" para cerrar la ventana.
- **Mejora: FormVisualizer sin pdfUrl**:
  - `FormVisualizer.tsx`: Cuando no hay `pdfUrl` pero el template tiene campos en `schema`, muestra una grilla con labels y valores, en vez de solo "No hay imagen de fondo".
- **Build**: `tsc --noEmit` + `next build` pasan sin errores.

### Sesión 31 - Julio 2026
- **Fix `Cannot read properties of undefined (reading 'toLowerCase')` en teacher/groups/[id]**:
  - `s.fullName.toLowerCase()` fallaba cuando `s.fullName` era undefined/null.
  - Agregado optional chaining `?.toLowerCase()` + fallback `|| ''` en el filter de estudiantes.
  - Archivo: `app/(dashboard)/dashboard/teacher/groups/[id]/page.tsx:37-40`

### Sesión 30 - Julio 2026
- **Fix Vercel no reflejaba datos migrados**: Vercel apuntaba a proyecto Supabase distinto al de `.env.local`.
  - Actualizadas Environment Variables en Vercel Dashboard con las del `.env.local`.
  - Primer redeploy con build cache no funcionó (URLs viejas en bundle).
  - Segundo redeploy sin build cache tampoco (código en Vercel era viejo).
  - **Causa raíz**: Commits de Sesiones 22-29 nunca se habían subido a GitHub.
  - `git push` de 77 archivos (migración Supabase-first + API routes).
  - API routes ahora funcionan: `GET /api/data/profiles` → 200.
- **Fix `RangeError: Invalid time value`**: `template.updatedAt` nullable en builder page. Agregado guard.
- **Fix imágenes de fondo + campos no aparecían en builder**:
  - Causa 1: `useTemplates()` no incluía `pdf_url` en el `select` (para mantener respuestas ligeras). Al hacer clic para editar, `FormDesigner` recibía plantilla sin `pdfUrl`.
  - Causa 2: `FormDesigner` se montaba antes de que `useTemplate()` terminara la consulta completa. `useState` se inicializaba con plantilla vacía y no se actualizaba cuando llegaban los datos.
  - Fix 1: Agregado `select` param a API route `/api/data/[table]` para especificar campos.
  - Fix 2: Builder page carga plantilla completa via `useTemplate(id)` y espera a que esté lista antes de montar `FormDesigner`.
- **Fix snake_case ↔ camelCase**: Supabase devuelve `pdf_url`, `teacher_id`, etc. App espera `pdfUrl`, `teacherId`.
  - Agregado `mapKeys/toCamelCase/toSnakeCase` en `dataService.ts` para normalizar keys al leer (snake→camel) y al escribir (camel→snake).
  - Aplica a todas las tablas (groups, templates, modules, etc.) de forma transparente.
- **Fix `deleteSelectedTemplate` residual**: Error de compilación por variable renombrada. Corregido.
- Errores: Base64 data URLs de imágenes hacen respuestas pesadas (>5MB para todas las plantillas).
- Pendientes: N/A.

---

### Sesión 36 - Julio 2026
- **Fix copiar carpeta (ExerciseBank)**: Botón "Copiar" siempre visible (quitado `opacity-0 group-hover:opacity-100`). Diálogo de copia agregado en vista detalle y grilla.
- **Fix `getAssignedStudents` para teacher**: Filtra assignments por grupos del docente (`teacherGroupIds`).
- **Fix `assignCases` con detalle de duplicados**: Muestra alert/confirm con nombre del estudiante, título del caso, grupo y módulo.
- **Fix permisos teacher**: `canDelete` y `canRename` ahora `isAdmin || (isTeacher && currentTab === 'personal')`.
- **Fix `userName()`**: Cambiado `fullName || name` → `name || fullName` (la DB devuelve `name`, no `fullName`).
- **Fix GroupManager docente selector**: `t.userId` → `t.id` (el campo real de Supabase es `id`).
- **Fix GroupManager student list**: `student.userId` → `student.id`.
- **Fix GroupManager member resolution**: `u.userId` → `u.id`.
- **Fix UserManager**: `user.userId` → `user.id` en tabla, filtro y acciones. Agregada columna **Grupo(s)** con `useGroups`.
- **Fix vista estudiante (dashboard/groups)**: `?.fullName` → `?.name` en display de docente.
- **Fix student/cases**: Nombres de compañeros usan `u?.name || u?.fullName`. Agregado módulo+grupo en tarjetas. Eliminado badge "Pendiente" e info de carpeta. Dialog muestra `pdfName`.
- **Fix student/groups/[id]**: `?.fullName` → `?.name`. Dialog de ejercicio muestra `pdfName`.
- **Fix storage path**: `buildRepoPath`/`buildPersonalPath` ya no incluyen `{caseId-}` como prefijo. Archivos nuevos se guardan con solo su nombre original.
- **Fix `assignCases` mensaje duplicados (3 intentos)**:
  - Iteración 1: alert/confirm con nombres de estudiantes y títulos de casos
  - Iteración 2: agregado grupo y módulo al mensaje. Fetch directo a API para datos frescos
  - Iteración 3: vuelta a `allAssignments` del hook + alert diagnóstico con total de asignaciones, casos y estudiantes seleccionados si no hay coincidencias
- **Fix `assignCases` salta if no coincidencias**: Agregado `filter + includes` en vez de `find` por par. Alert diagnóstico si `coincidencias.length === 0`.
- Errores: Mensaje de duplicados no aparece — posiblemente `allAssignments` no tiene datos o los field names no matchean. Alert diagnóstico agregado para identificar causa.
- Pendientes: Diagnosticar por qué `allAssignments` no detecta asignaciones existentes.

### Sesión 37 - Julio 2026
- **UserManager: Reorganización de columnas + mejoras**:
  - Columna "Nombre" ahora incluye identificación debajo: "Nombre / ID" con `documentType documentNumber` en gris.
  - Antigua columna "Identificación" reemplazada por "Grupo / Módulo", que muestra los grupos del usuario y su módulo asociado.
  - Eliminada columna "Grupo(s)" (info movida a "Grupo / Módulo").
  - Filtro de búsqueda unificado: busca por nombre, email, ID, grupo y módulo en un solo input.
  - Eliminado filtro separado de grupo/módulo.
  - Carga masiva: contraseña fija `123456` no editable, banner ámbar con recordatorio de cambio.
- Build: `tsc --noEmit` pasa sin errores.

### Sesión 38 - Julio 2026
- **Fix `invalid input syntax for type timestamp with time zone: ''` al crear grupos**:
  - **Causa raíz**: `GroupManager.tsx` enviaba `endDate: ""` (cadena vacía) en el payload, y la columna `end_date` en Supabase es `TIMESTAMPTZ` (no `TEXT` como dice la migración). PostgreSQL rechaza cadenas vacías en columnas timestamp.
  - **Fix en `handleSave()`**: Ahora sanitiza el payload antes de enviar:
    - `createdAt` → siempre valor válido (existente o `new Date().toISOString()`)
    - `startDate`/`endDate` vacíos → se eliminan del payload (DB usa DEFAULT o NULL)
  - Archivo: `components/admin/GroupManager.tsx:95-109`
- **Fix `value` prop on `input` should not be null**:
  - **Causa**: `formData.startDate`/`endDate` podían ser `null` (DB devuelve NULL en `start_date`/`end_date`). React no acepta `null` en `value`.
  - **Fix**: `value={formData.startDate ?? ""}` y `value={formData.endDate ?? ""}`
- **Reemplazada columna "Agregar Manualmente" por diálogo de registro de estudiante**:
  - **Antes**: Input de texto que agregaba un nombre suelto a `members[]`
  - **Ahora**: Botón "Registrar Estudiante" abre `Dialog` idéntico al de `UserManager` con rol fijo "Estudiante"
  - Crea el usuario en Supabase Auth + `profiles` y lo agrega automáticamente al grupo
  - Funciones agregadas: `syncToSupabase()`, `generateDeterministicId()`, `handleCreateStudent()`
  - Archivo: `components/admin/GroupManager.tsx`
- Build: `tsc --noEmit` pasa sin errores.

### Sesión 39 - Julio 2026
- **Contraseña fija `123456` para registro de usuarios**:
  - `UserManager.tsx`: Eliminado input de contraseña editable. Campo disabled con valor fijo `123456`. Eliminada validación que exigía contraseña. Al crear, envía `defaultPassword`; al editar no envía password.
  - `GroupManager.tsx`: Mismo cambio en diálogo "Nuevo Estudiante". Password fijo `123456` enviado a Supabase Auth. Eliminado `password` del estado `studentForm`.
  - Aplica a todos los roles (student, teacher, admin). Usuarios cambian contraseña después en settings.
- **Fix reportes admin/teacher: nombres de usuarios incorrectos**:
  - Causa: `profile?.fullName` no existe (el campo DB es `name`). `dataService` devuelve `name`, no `fullName`.
  - Fix admin `reports/page.tsx`: teachers usan `teacher.name`, estudiantes usan `profile?.name || profile?.email || memberId`.
  - Fix teacher `reports/page.tsx`: misma corrección. Además optimizado `generateReports` con `Promise.all` (paralelo) y una sola carga de perfiles.
- **Banco Ejercicios: alerta de estudiantes en múltiples casos del mismo grupo**:
  - `ExerciseBank.tsx` `assignCases()`: Agregada detección de estudiantes ya asignados a OTROS casos dentro del mismo grupo.
  - Muestra confirm dialog con nombres y casos existentes. Usuario elige si proceder o cancelar.
  - Separada lógica en 2 fases: cross-case duplicates primero, exact duplicates después.
- **Reorganización del layout**:
  - Sidebar reducido de `w-64` a `w-52` (~19% menos).
  - Outer container cambiado de `min-h-screen` a `h-screen overflow-hidden` (sin scroll de página).
  - Sidebar: `overflow-y-auto` como único scroll de la app, `sticky top-0`, `h-full`.
  - Main content: sin scroll propio, contenido fluye naturalmente.
  - Build: `tsc --noEmit` pasa sin errores.

### Sesión 41 - Julio 2026
- **Landing Page: Todos los textos ahora editables desde Settings**:
  - Agregadas ~60 nuevas keys en `lib/appTexts.ts` con prefijo `marketing.*` cubriendo textos de Navbar, Hero, Simulators, Access, Contact, Footer y Background.
  - Navbar: brand text, brand name, nav links, login button.
  - Hero: 4 líneas principales, badge, descripción, botón y flecha.
  - Simulators badge, título, hint, 5 títulos de cards y 5 descripciones.
  - Access: 2 partes del título, descripción, botón.
  - Contact: badge, título, subtítulo, mensajes de éxito, labels y placeholders de 3 campos, botón submit.
  - Footer: brand name, descripción, copyright, badge seguridad, email, 3 títulos de columna y 9 links.
  - Background: alt text de imagen.
- **7 componentes de marketing actualizados para usar `useAppText().t()`**:
  - `Navbar.tsx`, `Hero.tsx`, `SimulatorsGrid.tsx`, `AccessSection.tsx`, `ContactSection.tsx`, `Footer.tsx`, `InteractiveBackground.tsx`.
  - Arrays de constantes (`heroLines`, `simulators`, `footerLinks`) convertidos a `useMemo` con `t()`.
- **LandingPageDesigner.tsx actualizado**: Textos tab ahora muestra 7 secciones (Barra de Navegación, Hero, Simuladores, Acceso, Contacto, Footer, Fondo) con conteo de textos por sección.
- **Columna `location` en `app_texts`**: Creada migración SQL (`supabase_migration_add_location_to_app_texts.sql`) que crea la tabla `app_texts` (no existía en Supabase) con columnas `id`, `key`, `value`, `location`, `created_at`, `updated_at`, más RLS policies y trigger.
  - `hooks/useData.ts`: tipos `useAppTexts()` y `useCreateOrUpdateAppText()` actualizados para incluir `location`.
  - `LandingPageDesigner.tsx`: cada tarjeta de texto ahora tiene un campo "Ubicación" debajo del textarea. Se guarda automáticamente al hacer blur junto con el valor actual.
  - `tsc --noEmit` pasa.
- Errores: Ninguno.
- Build: `tsc --noEmit` pasa sin errores.

### Sesión 43 - Julio 2026
- **523 iconos Lucide**: Expandido `lib/iconMap.ts` de 13 a 523 iconos (negocio, educación, transporte, tecnología, objetos).
- **DynamicIcon**: Creado `components/shared/DynamicIcon.tsx` — renderiza `<img>` si el valor es URL (PNG subido) o el LucideIcon correspondiente. Reemplazado el patrón IIFE `iconMap[t(...)]` en los 5 componentes marketing.
- **IconPicker.tsx**: Agregado buscador textual (`<Input>`), grid con scroll infinito, y botón "Subir PNG personalizado" que sube a Supabase Storage y almacena URL.
- **Iconos movidos a pestaña Fondo**: En LandingPageDesigner, las keys `.icon` se filtran de la pestaña Textos y se muestran en un card dedicado en la pestaña Fondo.
- **Secciones card funcional**: Conectado color picker + slider de opacidad a keys persistentes (`marketing.bg.{section}_color/opacity`). Orden reordenado a Hero → Simuladores → Contacto → Acceso → Footer.
- **Keys agregadas a appTexts.ts**: `hero_color/opacity`, `simulators_color/opacity`, `contact_color/opacity`, `access_color/opacity`, `footer_color/opacity`.
- **4 componentes leen background desde stored keys**: Hero, SimulatorsGrid, AccessSection, ContactSection, Footer — ahora usan `t('marketing.bg.{section}_color', fallback)` + `t('marketing.bg.{section}_opacity', fallback)` en vez de opacidades hardcodeadas.
- **Glassmorphism premium**: SimulatorsGrid y AccessSection unificados con `backdrop-blur-sm`, overlay depth gradient (`from-white/3% via-transparent to-black/8%`), radial glow gold, cards con `backdropFilter: blur(12px)` y borde gold glow al hover. Acceso: removido gradient lineal duplicado, mantenido parallax radial gold.
- Errores: Ninguno. `tsc --noEmit` pasa.
- Pendientes: N/A.

### Sesión 42 - Julio 2026
- **Restaurado Footer.tsx**: Recuperada la estructura original con grid de links (Plataforma, Legal, Soporte), branding SIM_COMEX, badges de seguridad. Colores dinámicos vía `useDesignSettings()` + `hexToRgba()`.
- **Fix Navbar hover bug**: `e.target` → `e.currentTarget` en `Navbar.tsx:60-61`. Las letras individuales ya no se quedan con color de hover permanentemente.
- **LandingPageDesigner**: Eliminados nombres fijos de presets de paleta y labels de color pickers individuales. Eliminado card "Colores de Texto".
- **Selector de fondo**: Acepta solo PNG, sube a Supabase Storage vía `/api/storage/upload`, guarda URL en `marketing.bg.url`. Image/png agregado a `ALLOWED_TYPES`.
- **Secciones de fondo reordenadas**: Hero → Simuladores → Contacto → Acceso → Footer.
- **Colores de texto auto-derivados de la paleta**: `useDesignSettings.ts` ahora calcula `textColors` usando `getContrastColor()` (luminance-based) en vez de valores fijos. El color de texto es navy sobre cream, cream sobre navy. Agregado `getLuminance()` y `getContrastColor()` a `colorUtils.ts`.
- **Iconos editables**: Creado `lib/iconMap.ts` con mapeo de 13 iconos Lucide. Creado `components/admin/IconPicker.tsx` con selector visual vía Popover. Agregadas 12 keys de iconos a `appTexts.ts`. LandingPageDesigner detecta keys `.icon` y renderiza `IconPicker` en vez de Textarea. Todos los 5 componentes marketing actualizados para leer iconos dinámicamente desde `appTexts` a través de `iconMap[t(key)]`.
- Build: `tsc --noEmit` pasa sin errores.

---

### Sesión 44 - Julio 2026
- **Fix schema cache error al crear módulos**: Reemplazado `@supabase/supabase-js` client en `app/api/data/[table]/route.ts` por `fetch` directo a REST API de Supabase.
  - `supabase.from(table).upsert(body).select()` fallaba con "Could not find the '0' column of 'modules' in the schema cache" aunque la tabla existía y GET funcionaba.
  - GET handler reescrito para usar raw fetch con headers `apikey` + `Authorization: Bearer` (service_role_key).
  - POST handler usa `Prefer: return=representation` y extrae `value` del response paginado de Supabase.
  - DELETE handler usa `DELETE /rest/v1/table?id=eq.xxx`.
  - `fetchFromSupabase()` normaliza response: extrae `.value` del formato `{ value: [...], Count: N }`.
- **Fix controlled/uncontrolled input**: `ModuleEditor.tsx` — defensivo con `?? ''` en `useEffect` (title, description, status) y en section title Input. Evita que spread de `fetchedModule` pise campos con undefined/null.
- Errores: Schema cache de PostgREST no se refrescaba ni con `NOTIFY pgrst, 'reload schema'` ni reiniciando proyecto. Solución: bypass del cliente supabase-js.
- Pendientes: N/A.

### Sesión 45 - Julio 2026
- **Fix cambios no reflejados en Vercel**: Los cambios de Sesiones 41-44 (landing editable, icon picker, design settings, etc.) estaban solo en working directory local, sin commit ni push. Vercel servía código de `aff5645`.
  - Commit: `feat: landing page fully editable (texts, colors, icons, backgrounds)` — 43 archivos, +2546/-713 líneas.
  - Push exitoso a `origin/main`.
- Errores: Ninguno. Vercel auto-deploy en progreso.
- Pendientes: Verificar que los cambios se reflejen en la app de Vercel tras el deploy.

### Sesión 46 - Julio 2026
- **Fix `duplicate key value violates unique constraint "groups_pkey"` al crear/editar grupos**:
  - Causa raíz: POST handler en API route hacía INSERT puro.
  - Fix: `resolution=merge-duplicates` en header `Prefer` → upsert.
  - Archivo: `app/api/data/[table]/route.ts:71`
- **Fix `No autorizado` al crear estudiantes**:
  - Causa raíz: `/api/admin/users` usaba `createRouteHandlerClient` que leía cookie de sesión (no confiable, mismo problema Sesión 22).
  - Fix: Cliente envía `callerUserId` desde `cached_user_profile` en localStorage. Server verifica rol via admin client (service role key). Sin cookies.
  - Archivos: `app/api/admin/users/route.ts`, `GroupManager.tsx`, `UserManager.tsx`
- **Fix schema cache al crear perfiles**:
  - Causa raíz: `supabase.from('profiles').upsert()` con `@supabase/supabase-js` fallaba por schema cache de PostgREST (columna `can_create_users`).
  - Fix: Creada `rawUpsert()` con fetch directo a REST API + `Prefer: resolution=merge-duplicates`. Eliminada `can_create_users` del payload (columna no existente en Supabase real).
  - Archivo: `app/api/admin/users/route.ts`
- **Fix perfil faltante/login sin rol**:
  - Causa raíz: Usuarios creados via Supabase Auth Dashboard no tenían perfil en `profiles` ni `user_metadata.role`. Login infería rol por email pero server no.
  - Fix: Server ahora resuelve rol: `profiles` → `user_metadata` → inferencia por email. Si no hay perfil, lo crea automáticamente.
  - Archivo: `app/api/admin/users/route.ts`
- Build: `tsc --noEmit` pasa en todos los fixes.
- Pendientes: Pushear a GitHub para Vercel.

### Sesión 47 - Julio 2026
- **Fix React 19 ref error en SelectValue** (`FormRenderer.tsx:177`): `<SelectValue>` tenía children de texto (`{formData[field.id] || undefined}`), lo que React 19 prohíbe en elementos con ref usados como portales. Radix SelectValue ya maneja el valor seleccionado internamente. Eliminados los children.
- **Fix UUID crash en validación cruzada** (`validationService.ts:25`): `getModuleDataMap()` hacía `dataService.getById('modules', moduleId)` con `moduleId = "mod-1"` (no UUID), causando error de PostgreSQL. Agregado regex UUID validation que retorna `{}` si no es UUID válido. También envuelto en try-catch.
- **Fix unhandled rejection en handleInputChange** (`FormRenderer.tsx:70`): Agregado try-catch alrededor de `validationService.evaluateField()` para que errores de validación no rompan el form.
- **Fix cambio de contraseña en admin** (`UserManager.tsx`): El diálogo de edición de usuarios no tenía campo de contraseña. Agregado input opcional (tipo password) en edición. Si se llena, se envía al API (`updateUserById` ya lo soportaba). Save handler ahora envía `formData.password || undefined` cuando edita (antes siempre enviaba `undefined`).
- **Fix default moduleId "mod-1"** (`FormDesigner.tsx:19`): Cambiado de `"mod-1"` a `""` para evitar seeded data con IDs inválidos.
- **Fix error message genérico** (`FormDesigner.tsx:49`): Ahora muestra `error.message` real en lugar de "Error al guardar la plantilla." genérico, para facilitar diagnóstico.
- Build: `tsc --noEmit` pasa sin errores.
- Pendientes: Monitorear si el error de guardado de plantilla persiste ahora que se ve el mensaje real.

### Sesión 48 - Julio 2026
- **Feature: Lista de estudiantes en vista teacher/groups/[id]**: Nombre real (`student.name || student.fullName`) en vez de "Usuario". Email inline al lado.
  - Fix TS: `UserProfile` type agregó `name?: string` (el campo real de DB).
  - Archivo: `app/(dashboard)/dashboard/teacher/groups/[id]/page.tsx`, `types/roles.ts`
- **Feature: Toggle visibilidad de evaluaciones por grupo** (teacher/reports):
  - Nuevo switch "Visible para estudiantes" en la tabla de grupos que guarda `eval_visibility_{groupId}` en `app_texts`.
  - `loadEvalVisibility()` y `toggleEvalVisibility()` en teacher/reports/page.tsx.
  - Archivo: `app/(dashboard)/dashboard/teacher/reports/page.tsx`
- **Feature: Evaluaciones ocultas bloquean reportes estudiante** (student/reports):
  - `student/reports/page.tsx` verifica `eval_visibility_{groupId}`. Si `false`, muestra "Evaluaciones deshabilitadas" con icono EyeOff.
- **Feature: Admin copia casos a docente en ExerciseBank**:
  - Nuevo diálogo con selector de docente + carpeta destino (filtrado por `ownerId + space: 'personal'`).
  - Botón "Copiar a Docente" en toolbar del detalle (solo visible si `isAdmin`).
  - Archivo: `components/teacher/ExerciseBank.tsx`
- Build: `tsc --noEmit` pasa sin errores.

### Sesión 49 - Julio 2026
- **Admin reports: split view reemplazada por lista full-width + modal**:
  - Eliminada la cuadrícula grid (ModuleValidationSummary izquierda + ValidationReportCard derecha).
  - Lista de estudiantes ocupa todo el ancho, sin scroll horizontal.
  - Al hacer clic en un estudiante se abre modal con el reporte (misma apariencia ValidationReportCard) + botones "Imprimir" y "Volver".
  - Agregada función `formatDate()`, `getScoreColor()`, `handlePrint()`, `handleGroupReport()`.
  - Archivo: `app/(dashboard)/dashboard/admin/reports/page.tsx`
- **Teacher reports: reporte individual ahora con misma apariencia que admin**:
  - Reemplazado contenido inline del modal (con CSS classNames planos) por la misma estructura visual que ValidationReportCard: iconos CheckCircle/XCircle, Badges verde/rojo, grid 12-columnas, colores por score.
  - El contenido imprimible (`printRef`) también usa la nueva apariencia.
  - Archivo: `app/(dashboard)/dashboard/teacher/reports/page.tsx`
- **Reporte Grupal (admin + teacher)**:
  - Nuevo botón "Reporte Grupal" en el header de la tabla de estudiantes (ambas vistas).
  - Abre ventana imprimible con: info del grupo, resumen de promedios/aprobados/en riesgo, tabla con todos los estudiantes, variables, coincidencias, errores y score.
  - Sin datos cruzados, solo información general.
  - Archivos: `admin/reports/page.tsx`, `teacher/reports/page.tsx`
- **Fix null id en app_texts**: `toggleEvalVisibility()` ahora incluye `id` en el payload (existente o `crypto.randomUUID()`). Guarda el ID devuelto para reuso en toggles sucesivos.

### Sesión 50 - Julio 2026
- **Fix cambio de contraseña en settings**: La página de configuración tenía inputs y botón sin handlers (sin `value`, `onChange`, `onClick`). No existía API route ni función en authService.
  - Creado `app/api/auth/change-password/route.ts`: usa `createServerClient` de `@supabase/ssr` para leer session cookie y llama `supabase.auth.updateUser({ password })`.
  - Agregado `authService.changePassword(password)` que hace fetch a la API route.
  - Settings page conectada: `currentPassword`, `newPassword`, `confirmPassword` con `useState`, validación de coincidencia y mínimo 6 caracteres, toast de éxito/error, estado de carga.
  - Archivos: `app/api/auth/change-password/route.ts` (nuevo), `lib/services/authService.ts`, `app/(dashboard)/dashboard/settings/page.tsx`
- Build: `tsc --noEmit` pasa sin errores.

### Sesión 51 - Julio 2026
- **Admin: Asignación de casos desde repositorio a espacio de docente sin contaminar el repositorio**:
  - **Problema**: En la vista admin (pestaña Repositorio), cuando el admin asignaba casos a estudiantes, las asignaciones se creaban directamente para los casos del repositorio. Esto contaminaba el repositorio: cuando otro docente entraba a buscar casos, veía estudiantes ya asignados.
  - **Solución**: El admin ahora selecciona un docente como filtro dentro de la carpeta del repositorio, elige una carpeta destino del espacio personal del docente (o crea automática), selecciona el grupo del docente y los estudiantes. Al hacer clic en "Copiar a Docente y Asignar":
    1. Casos se copian al espacio personal del docente
    2. Asignaciones se crean para las COPIAS (no para los originales del repositorio)
    3. El repositorio permanece limpio sin asignaciones
  - **Nueva función**: `adminCopyAndAssign()` — copia casos + crea asignaciones
  - **Nuevo estado**: `selectedTeacherId`, `adminAssignFolderId`
  - **Filtro anidado** en detail view (admin+repo): Docente → Carpeta destino → Grupo del docente → Estudiantes
  - **Botón condicional**: "Copiar a Docente y Asignar" (admin+repo) vs "Asignar" (teacher/personal)
  - **Asignaciones ocultas** en casos del repositorio para admin
  - **Auto-creación de carpeta**: Si el docente no tiene carpeta personal, se crea automáticamente con el nombre de la carpeta del repositorio (opción "+ Crear carpeta automática")
  - Archivo: `components/teacher/ExerciseBank.tsx`
- Build: `tsc --noEmit` + `next build` pasan sin errores.

### Sesión 53 (actual) - Julio 2026
- **ExerciseBank: Checkbox movido al lado izquierdo** de cada card (opuesto a las acciones).
- **Reportes grupales: Eliminado auto-close al imprimir** — `window.close()` reemplazado por `window.focus()` en admin y teacher reports. El preview ya no se cierra al cancelar la impresión.
- **Contadores + filtros en cada tab admin**:
  - Módulos: contador `X módulos` + búsqueda + filtro por estado (pub/draft) + filtro por docente
  - Documentos: contador `X plantillas` + búsqueda + filtro por estado
  - Grupos: contador `X grupos` + filtro por módulo + filtro por docente
  - Usuarios: contador `X usuarios (est. · doc. · adm.)` + búsqueda + filtro por rol + filtro por módulo
  - Catálogos: contador `X catálogos` + filtro por tipo
- **ExerciseBank: Vista de detalle de carpeta cambiada de grilla de cards a tabla**:
  - 3 columnas fijas: Caso (30%), Estudiantes Asignados (55%), Acciones (15%)
  - Info del PDF (badge, tamaño, ojito) inline dentro del caso
  - Estudiantes agrupados por grupo, con nombre del grupo y badges por estudiante
  - `table-fixed` con `overflow-x-auto` para evitar scroll horizontal
- **Commit y push a main** (`ffd037f`): 18 archivos, +1624/-376 líneas. Vercel hace deploy automático.
- Build: `tsc --noEmit` + `next build` pasan sin errores.
- Errores: Ninguno.
- Pendientes: N/A.

### Sesión 52 - Julio 2026
- **ExerciseBank: Lista de casos como tarjetas en grilla**:
  - Reemplazada la lista vertical (`space-y-2`) por grilla responsiva `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3` en la vista detalle de carpeta.
  - Cada caso es una card compacta con icono, título (line-clamp-2), descripción, badge PDF/tamaño, acciones (eye/rename/delete) visibles al hover, checkbox para selección, y badges de estudiantes asignados.
  - Archivo: `components/teacher/ExerciseBank.tsx`
- **Reportes individuales premium para impresión (admin y teacher)**:
  - Rediseño completo del template HTML inline de `handlePrint()` en ambas páginas.
  - Nuevo letterhead con branding SIM-COMEX (navy/gold), info-grid de 4 campos (estudiante, grupo, docente, módulo), score card con color dinámico, tabla profesional con zebra stripes y filas inconsistentes destacadas en rojo, y footer académico.
  - Archivos: `admin/reports/page.tsx`, `teacher/reports/page.tsx`
- **Reportes grupales premium con estadísticas avanzadas (admin y teacher)**:
  - Nuevo template `handleGroupReport()` con 6 tarjetas estadísticas (promedio, mediana, puntaje más alto, puntaje más bajo, desviación estándar, total estudiantes).
  - Barra de distribución visual (excelente verde ≥90%, alerta ámbar ≥70%, riesgo rojo <70%) con leyenda.
  - Ranking de estudiantes numerado (#1, #2, etc.) ordenado por consistencia descendente.
  - Mismo letterhead branding consistente con reportes individuales.
  - Archivos: `admin/reports/page.tsx`, `teacher/reports/page.tsx`
- Build: `tsc --noEmit` + `next build` pasan sin errores.

## Notas importantes para nuevas IAs

1. **SIEMPRE** leer este archivo al inicio de cada sesión
2. **SIEMPRE** actualizar este documento con cambios realizados
3. Antes de hacer cambios significativos, documentar qué se hará
4. Al terminar una sesión, resumir lo hecho en "Historial de sesiones"
5. Incluir errores encontrados y soluciones en "Errores conocidos"