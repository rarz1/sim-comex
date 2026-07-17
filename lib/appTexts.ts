export interface AppText {
    id: string; // The key, e.g., 'admin.dashboard.title'
    value: string;
}

export const defaultTexts: Record<string, string> = {
    // --- BRANDING ---
    "common.app.name": "SIM-COMEX Cloud",
    "common.app.description": "Simulador de Comercio Exterior de Alto Rendimiento",

    // --- MARKETING: NAVBAR ---
    "marketing.navbar.brand_text": "SC",
    "marketing.navbar.brand_name": "SIM_COMEX",
    "marketing.navbar.link_simulators": "Simuladores",
    "marketing.navbar.link_contact": "Contacto",
    "marketing.navbar.btn_login": "Ingresar",

    // --- MARKETING: HERO ---
    "marketing.hero.icon": "Zap",
    "marketing.hero.line_1": "APRENDIZAJE BASADO",
    "marketing.hero.line_2": "EN SIMULACION PARA LA",
    "marketing.hero.line_3": "GESTION DOCUMENTAL",
    "marketing.hero.line_4": "DEL COMERCIO EXTERIOR",
    "marketing.hero.badge": "Simuladores Asistidos con IA para el Comercio Exterior",
    "marketing.hero.description": "Un entorno tecnológico de aprendizaje interactivo asistido con IA, que transforma la teoría en práctica de la gestión en procesos documentales, convergiendo en la formación y preparación de profesionales para el comercio global.",
    "marketing.hero.btn_text": "INGRESAR",
    "marketing.hero.btn_arrow": "→",

    // --- MARKETING: SIMULATORS ---
    "marketing.simulators.icon_1": "Ship",
    "marketing.simulators.icon_2": "Package",
    "marketing.simulators.icon_3": "Search",
    "marketing.simulators.icon_4": "RefreshCw",
    "marketing.simulators.icon_5": "Truck",
    "marketing.simulators.badge": "Plataforma de Simulación",
    "marketing.simulators.title_before": "Nuestros",
    "marketing.simulators.title_highlight": "Simuladores",
    "marketing.simulators.card_hint": "Click para más",
    "marketing.simulators.card_1_title": "Procesos de Exportación",
    "marketing.simulators.card_1_desc": "Régimen que regula la salida legal de mercancías del territorio nacional hacia mercados externos.",
    "marketing.simulators.card_2_title": "Procesos de Importación",
    "marketing.simulators.card_2_desc": "Régimen que regula el ingreso legal de mercancías extranjeras para consumo o uso nacional.",
    "marketing.simulators.card_3_title": "Operaciones de Clasificación Arancelaria",
    "marketing.simulators.card_3_desc": "Sistema de codificación universal de las mercancías objeto de comercio internacional.",
    "marketing.simulators.card_4_title": "Operaciones Cambiarias",
    "marketing.simulators.card_4_desc": "Régimen que regula el control y canalización legal de las divisas derivadas de las operaciones internacionales.",
    "marketing.simulators.card_5_title": "Operaciones Logísticas",
    "marketing.simulators.card_5_desc": "Gestión física y eficiente de la carga en la cadena de suministro.",

    // --- MARKETING: ACCESS ---
    "marketing.access.icon": "ShieldCheck",
    "marketing.access.icon_arrow": "ArrowRight",
    "marketing.access.title_1": "Seguridad",
    "marketing.access.title_2": "Control",
    "marketing.access.description": "Un entorno seguro donde la información está protegida con estándares de clase mundial, y la gestión documental y de procesos se adapta al ritmo y rol de cada usuario con la mejor experiencia educativa.",
    "marketing.access.btn_text": "Ingresar",

    // --- MARKETING: CONTACT ---
    "marketing.contact.icon_send": "Send",
    "marketing.contact.icon_success": "CheckCircle",
    "marketing.contact.badge": "Comunicación",
    "marketing.contact.title": "Contáctanos",
    "marketing.contact.subtitle": "Estamos aquí para asistirte",
    "marketing.contact.success_title": "Mensaje Enviado",
    "marketing.contact.success_msg": "Nos pondremos en contacto pronto.",
    "marketing.contact.field_name_label": "Nombre Completo",
    "marketing.contact.field_name_placeholder": "Juan Pérez",
    "marketing.contact.field_email_label": "Correo Electrónico",
    "marketing.contact.field_email_placeholder": "juan@ejemplo.com",
    "marketing.contact.field_subject_label": "Asunto",
    "marketing.contact.field_subject_placeholder": "¿Cómo podemos ayudarte?",
    "marketing.contact.btn_submit": "Enviar Mensaje",

    // --- MARKETING: FOOTER ---
    "marketing.footer.icon": "Ship",
    "marketing.footer.icon_mail": "Mail",
    "marketing.footer.icon_shield": "Shield",
    "marketing.footer.brand_name": "SIM_COMEX",
    "marketing.footer.description": "Plataforma integral de simulación y gestión para el comercio exterior con asistencia de IA.",
    "marketing.footer.copyright": "SIM_COMEX. Todos los derechos reservados.",
    "marketing.footer.badge_security": "Datos Seguros",
    "marketing.footer.email": "soporte@simcomex.com",
    "marketing.footer.col_plataforma": "Plataforma",
    "marketing.footer.link_simulators": "Simuladores",
    "marketing.footer.link_contact": "Contacto",
    "marketing.footer.link_access": "Acceso",
    "marketing.footer.col_legal": "Legal",
    "marketing.footer.link_terms": "Términos y Condiciones",
    "marketing.footer.link_privacy": "Política de Privacidad",
    "marketing.footer.link_security": "Seguridad",
    "marketing.footer.col_soporte": "Soporte",
    "marketing.footer.link_help": "Centro de Ayuda",
    "marketing.footer.link_docs": "Documentación",
    "marketing.footer.link_status": "Estado del Sistema",

    // --- MARKETING: BACKGROUND ---
    "marketing.bg.img_alt": "Logística y comercio internacional",
    "marketing.bg.hero_color": "#F5F3F0",
    "marketing.bg.hero_opacity": "40",
    "marketing.bg.simulators_color": "#15123A",
    "marketing.bg.simulators_opacity": "50",
    "marketing.bg.contact_color": "#F5F3F0",
    "marketing.bg.contact_opacity": "50",
    "marketing.bg.access_color": "#15123A",
    "marketing.bg.access_opacity": "70",
    "marketing.bg.footer_color": "#F5F3F0",
    "marketing.bg.footer_opacity": "30",

    // --- DESIGN TOKENS ---
    "design.color_navy": "#15123A",
    "design.color_gold": "#C4953C",
    "design.color_teal": "#0D9488",
    "design.color_cream": "#F5F3F0",
    "design.title_font": "Syne",
    "design.title_size": "48",
    "design.title_color_light": "#0F0B29",
    "design.title_color_dark": "#FFFFFF",
    "design.subtitle_font": "DM Sans",
    "design.subtitle_size": "13",
    "design.subtitle_color_light": "#2D2960",
    "design.subtitle_color_dark": "#D4C8B0",
    "design.body_font": "DM Sans",
    "design.body_size": "16",
    "design.body_color_light": "#1A1740",
    "design.body_color_dark": "#E8E0D0",

    // --- LANDING PAGE (legacy) ---
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
    "common.sidebar.dashboard": "Panel de Control",
    "common.sidebar.reports": "Evaluaciones",
    "common.sidebar.builder": "Documentos",
    "common.sidebar.groups": "Grupos",
    "common.sidebar.users": "Usuarios",
    "common.sidebar.modules": "Módulos",
    "common.sidebar.catalogs": "Catálogos",
    "common.sidebar.admin_exercises": "Banco de Casos",
    "common.sidebar.settings": "Configuración",
    "common.sidebar.migrate": "Migrar a Nube",
    "common.sidebar.teacher_panel": "Panel de Control",
    "common.sidebar.teacher_groups": "Mis Grupos",
    "common.sidebar.teacher_library": "Banco de Casos",
    "common.sidebar.teacher_reports": "Evaluaciones",
    "common.sidebar.student_panel": "Panel de Control",
    "common.sidebar.student_groups": "Mis Grupos",
    "common.sidebar.student_docs": "Mis Documentos",
    "common.sidebar.student_cases": "Mis Casos",
    "common.sidebar.student_reports": "Mis Evaluaciones",
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
    "student.reports.title": "Mis Evaluaciones",
    "student.reports.subtitle": "Consulta la consistencia de los datos en tus simulaciones.",
    "student.reports.config_title": "Configuración",
    "student.reports.btn_print": "Imprimir PDF",
    "student.reports.btn_exit": "Salir"
};
