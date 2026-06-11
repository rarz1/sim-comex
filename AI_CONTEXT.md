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
│   ├── form-builder/       # Constructor de formularios
│   ├── layout/             # Header, Sidebar
│   ├── marketing/          # Landing page
│   ├── reports/            # Reportes
│   ├── sync/               # Sincronización offline
│   ├── teacher/            # Componentes profesor
│   └── ui/                 # Componentes UI (shadcn)
├── lib/                    # Utilidades y servicios
│   ├── db/                 # Configuración Dexie
│   ├── pdf/                # Generación PDF
│   ├── services/           # Servicios (auth, db, validation)
│   ├── supabase/           # Cliente Supabase
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
- `catalogs` - Catálogos maestros (listas de 2 columnas: etiqueta + valor)

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

*(Agregar aquí errores encontrados y cómo se resolvieron)*

---

## Pendientes y tareas futuras

- Revisar y optimizar la sincronización en tiempo real con Supabase
- Implementar generación real de PDFs (actualmente simulada)
- Mejorar la experiencia offline con service workers
- Tests unitarios y de integración
- Curar napkin.md periódicamente (quitar items obsoletos, mantener máximo 10 por categoría)

---

## Historial de sesiones

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

### Sesión 13 - Junio 2026 (sesión actual)
- **Despliegue en Vercel + GitHub**:
  - Inicializado repositorio Git y subido a GitHub (rarz1/sim-comex)
  - Instalado GitHub CLI (gh) para autenticación
  - Configurado .gitignore para excluir .env* y napkin embebido
  - Desplegado en Vercel (plan Hobby) con variables de entorno de Supabase real
  - App accesible públicamente para pruebas externas
- **Fix login en producción**: El admin no existía en Supabase Auth del proyecto cloud. Creado usuario admin@test.com manualmente desde Authentication > Users con password 123456. Asignado rol 'admin' vía UPDATE en tabla profiles via SQL Editor.
- Errores: La tabla es `profiles` (plural), no `profile`. Warning "destructive operations" es normal, solo un safety check de Supabase.
- **Nueva funcionalidad: creación de usuarios desde el panel admin con sync a Supabase Auth**:
  - Creado `lib/supabase/admin.ts`: cliente Supabase con service_role key para operaciones admin
  - Creado `app/api/admin/users/route.ts`: API route POST que crea usuarios en Auth + profiles
  - Modificado `UserManager.tsx`: agregado campo de contraseña, sincronización con Auth al guardar
  - Carga masiva: agrega campo "Contraseña por defecto", sincroniza todos los usuarios con Auth
  - Agregada `SUPABASE_SERVICE_ROLE_KEY` a env vars (local + Vercel)

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

---

## Notas importantes para nuevas IAs

1. **SIEMPRE** leer este archivo al inicio de cada sesión
2. **SIEMPRE** actualizar este documento con cambios realizados
3. Antes de hacer cambios significativos, documentar qué se hará
4. Al terminar una sesión, resumir lo hecho en "Historial de sesiones"
5. Incluir errores encontrados y soluciones en "Errores conocidos"