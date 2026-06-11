export interface AppText {
    id: string; // The key, e.g., 'admin.dashboard.title'
    value: string;
}

export const defaultTexts: Record<string, string> = {
    // --- BRANDING ---
    "common.app.name": "SIM-COMEX Cloud",
    "common.app.description": "Simulador de Comercio Exterior de Alto Rendimiento",

    // --- LANDING PAGE ---
    "common.home.title": "SIM-COMEX PRO",
    "common.home.subtitle": "Simulador Educativo de Comercio Exterior. Aprende a diligenciar documentos oficiales con nuestra plataforma offline-first.",
    "common.home.btn_enter": "Ingresar al Simulador",

    // --- LOGIN PAGE ---
    "common.login.title": "SIM-COMEX PRO",
    "common.login.subtitle": "Inicia sesión para continuar",
    "common.login.btn_submit": "Ingresar",
    "common.login.btn_reset": "Restablecer Datos de Prueba",
    "common.login.label_email": "Email",
    "common.login.label_password": "Contraseña",
    "common.login.quick_access": "Accesos Rápidos",

    // --- COMMON / SHARED ---
    "common.sidebar.menu": "Menú",
    "common.sidebar.dashboard": "Panel Principal",
    "common.sidebar.reports": "Reportes",
    "common.sidebar.builder": "Constructor Doc.",
    "common.sidebar.groups": "Gestión Grupos",
    "common.sidebar.users": "Usuarios",
    "common.sidebar.modules": "Módulos",
    "common.sidebar.catalogs": "Catálogos",
    "common.sidebar.settings": "Ajustes de Sistema",
    "common.sidebar.teacher_panel": "Panel Control",
    "common.sidebar.teacher_groups": "Mis Grupos",
    "common.sidebar.teacher_library": "Banco Ejercicios",
    "common.sidebar.student_panel": "Panel Control",
    "common.sidebar.student_groups": "Mis Grupos",
    "common.sidebar.student_docs": "Mis Documentos",
    "common.sidebar.student_simulator": "Simulador",

    // --- ADMIN SETTINGS PAGE (SELF) ---
    "admin.settings.title": "Gestión de Contenidos",
    "admin.settings.subtitle": "Personaliza todos los textos, títulos y botones de la plataforma en tiempo real.",
    "admin.settings.search_placeholder": "Buscar clave o contenido...",
    "admin.settings.tab_admin": "Administrador",
    "admin.settings.tab_teachers": "Docentes",
    "admin.settings.tab_students": "Estudiantes",
    "admin.settings.tab_global": "Sistema & Branding",
    "admin.settings.subtab_dashboard": "Dashboard",
    "admin.settings.subtab_reports": "Reportes",
    "admin.settings.subtab_groups": "Grupos",
    "admin.settings.subtab_users": "Usuarios",
    "admin.settings.subtab_branding": "Identidad",
    "admin.settings.subtab_sidebar": "Menú Lateral",
    "admin.settings.card_original": "POR DEFECTO",
    "admin.settings.btn_save": "Guardar",
    "admin.settings.toast_success": "Contenido actualizado correctamente",
    "admin.settings.toast_error": "Error al actualizar contenido",
    "admin.settings.empty": "No hay resultados para tu búsqueda.",

    // --- ADMIN DASHBOARD ---
    "admin.dashboard.title": "Panel de Administrador",
    "admin.dashboard.subtitle": "Resumen de actividad en tiempo real.",
    "admin.dashboard.btn_builder": "Diseñador de Documentos",
    "admin.dashboard.card_users_title": "Usuarios (Estudiantes + Docentes)",
    "admin.dashboard.card_users_active": "Activos",
    "admin.dashboard.card_users_inactive": "Inactivos",
    "admin.dashboard.card_docs_title": "Documentos / Guías",
    "admin.dashboard.card_docs_total": "Total Creados",
    "admin.dashboard.card_docs_desc": "Plantillas disponibles en el sistema.",
    "admin.dashboard.card_modules_title": "Módulos Educativos",
    "admin.dashboard.card_groups_title": "Grupos de Estudiantes",

    // --- ADMIN BUILDER ---
    "admin.builder.title": "Constructor de Documentos",
    "admin.builder.subtitle": "Diseña plantillas y campos digitales para el simulador.",
    "admin.builder.btn_new": "+ Nueva Plantilla",

    // --- ADMIN REPORTS ---
    "admin.reports.title": "Reportes Administrativos",
    "admin.reports.subtitle": "Supervisión global de validación de datos.",
    "admin.reports.filter_teacher": "Docente",
    "admin.reports.filter_group": "Grupo",
    "admin.reports.btn_refresh": "Actualizar",

    // --- ADMIN USERS ---
    "admin.users.title": "Gestión de Usuarios",
    "admin.users.subtitle": "Administra las cuentas de estudiantes, docentes y administradores.",

    // --- ADMIN MODULES ---
    "admin.modules.title": "Módulos Académicos",
    "admin.modules.subtitle": "Configura la estructura y contenido de los módulos.",

    // --- ADMIN GROUPS ---
    "admin.groups.title": "Gestión de Grupos",
    "admin.groups.subtitle": "Crea y administra grupos de estudiantes y asigna docentes.",

    // --- ADMIN CATALOGS ---
    "admin.catalogs.title": "Gestión de Catálogos",
    "admin.catalogs.subtitle": "Administra los datos maestros del sistema.",

    // --- TEACHER DASHBOARD ---
    "teacher.dashboard.title": "Panel de Control",
    "teacher.dashboard.subtitle": "Bienvenido, aquí tienes un resumen de tus grupos y actividad reciente.",
    "teacher.dashboard.card_summary_title": "Resumen Diario",
    "teacher.dashboard.card_summary_desc": "Grupos con sesiones programadas para hoy.",
    "teacher.dashboard.btn_my_groups": "Ir a Mis Grupos",
    "teacher.dashboard.card_performance_title": "Rendimiento por Grupo",

    // --- TEACHER GROUPS ---
    "teacher.groups.title": "Gestión de Grupos",
    "teacher.groups.subtitle": "Administra tus grupos académicos y realiza seguimiento a tus estudiantes.",
    "teacher.groups.card_active": "Activo",
    "teacher.groups.card_finished": "Finalizado",

    // --- TEACHER REPORTS ---
    "teacher.reports.title": "Reportes de Estudiantes",
    "teacher.reports.subtitle": "Analiza el desempeño y validación de tus grupos.",

    // --- TEACHER LIBRARY ---
    "teacher.library.title": "Banco de Ejercicios",
    "teacher.library.subtitle": "Biblioteca de casos prácticos y documentos base.",
    "teacher.library.btn_new": "+ Nuevo Ejercicio",

    // --- STUDENT DASHBOARD ---
    "student.dashboard.title": "Mi Espacio Académico",
    "student.dashboard.subtitle": "Hola de nuevo. Aquí puedes ver tu progreso y actividades pendientes.",
    "student.dashboard.card_progress_title": "Tu Progreso",
    "student.dashboard.card_stats_groups": "Grupos activos",
    "student.dashboard.card_stats_assigned": "Asignadas",
    "student.dashboard.card_stats_process": "En proceso",
    "student.dashboard.card_stats_finished": "Finalizados",
    "student.dashboard.section_pending_title": "Trámites en Curso",
    "student.dashboard.section_groups_title": "Mis Grupos",

    // --- STUDENT GROUPS ---
    "student.groups.title": "Mis Grupos",
    "student.groups.subtitle": "Lista de grupos en los que estás matriculado.",
    "student.groups.btn_access": "Acceder al Grupo",

    // --- STUDENT DOCUMENTS ---
    "student.docs.title": "Mis Documentos",
    "student.docs.subtitle": "Gestiona y diligencia los formularios asignados a tus módulos.",
    "student.docs.card_progress": "Progreso",
    "student.docs.btn_start": "Iniciar",
    "student.docs.btn_continue": "Continuar",

    // --- STUDENT REPORTS ---
    "student.reports.title": "Mis Reportes de Validación",
    "student.reports.subtitle": "Consulta la consistencia de los datos en tus simulaciones.",
    "student.reports.config_title": "Configuración",
    "student.reports.btn_print": "Imprimir PDF",
    "student.reports.btn_exit": "Salir"
};
