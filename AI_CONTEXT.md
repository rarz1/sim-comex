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

### Sesión 30 - Julio 2026
- **Fix Vercel no reflejaba datos migrados**: Vercel apuntaba a proyecto Supabase distinto al de `.env.local`.
  - Actualizadas Environment Variables en Vercel Dashboard con las del `.env.local`.
  - Primer redeploy con build cache no funcionó (URLs viejas en bundle).
  - Segundo redeploy sin build cache tampoco (código en Vercel era viejo).
  - **Causa raíz**: Commits de Sesiones 22-29 nunca se habían subido a GitHub.
  - `git push` de 77 archivos (migración Supabase-first + API routes).
  - API routes ahora funcionan: `GET /api/data/profiles` → 200.
- **Fix `RangeError: Invalid time value`**: `template.updatedAt` nullable en builder page. Agregado guard.
- Errores: Vercel tenía código viejo. `new Date(null)` crasheaba.
- Pendientes: N/A.

---

## Notas importantes para nuevas IAs

1. **SIEMPRE** leer este archivo al inicio de cada sesión
2. **SIEMPRE** actualizar este documento con cambios realizados
3. Antes de hacer cambios significativos, documentar qué se hará
4. Al terminar una sesión, resumir lo hecho en "Historial de sesiones"
5. Incluir errores encontrados y soluciones en "Errores conocidos"