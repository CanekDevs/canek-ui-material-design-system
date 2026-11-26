import type { CnSidebarNavSection } from "./CnSidebarNav";

/** Navegación de ejemplo de un CRM (historias y pruebas de `CnSidebarNav` y `CnAppShell`). */
export const CRM_NAV: CnSidebarNavSection[] = [
  {
    id: "principal",
    items: [
      { id: "inicio", label: "Inicio", icon: "home", href: "#inicio" },
      { id: "bandeja", label: "Bandeja", icon: "inbox", href: "#bandeja", badge: 12 },
      { id: "tareas", label: "Tareas", icon: "check_circle", href: "#tareas", badge: 3 },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    collapsible: true,
    items: [
      { id: "contactos", label: "Contactos", icon: "contacts", href: "#contactos" },
      { id: "empresas", label: "Empresas", icon: "business", href: "#empresas" },
      {
        id: "oportunidades",
        label: "Oportunidades",
        icon: "attach_money",
        children: [
          { id: "embudo", label: "Embudo", href: "#embudo" },
          { id: "pronostico", label: "Pronóstico", href: "#pronostico" },
          { id: "cotizaciones", label: "Cotizaciones", href: "#cotizaciones", badge: 4 },
        ],
      },
      { id: "actividades", label: "Actividades", icon: "event", href: "#actividades" },
    ],
  },
  {
    id: "analisis",
    label: "Análisis",
    collapsible: true,
    items: [
      { id: "reportes", label: "Reportes", icon: "bar_chart", href: "#reportes" },
      { id: "tableros", label: "Tableros", icon: "dashboard", href: "#tableros" },
      { id: "metas", label: "Metas", icon: "flag", href: "#metas", disabled: true },
    ],
  },
  {
    id: "ajustes",
    label: "Configuración",
    items: [
      { id: "equipo", label: "Equipo", icon: "groups", href: "#equipo" },
      { id: "integraciones", label: "Integraciones", icon: "hub", href: "#integraciones" },
      { id: "ajustes-generales", label: "Ajustes", icon: "settings", href: "#ajustes" },
    ],
  },
];
