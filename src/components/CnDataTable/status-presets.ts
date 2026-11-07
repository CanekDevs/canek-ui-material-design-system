import type { CnStatusOption } from "./cells";

/**
 * Presets de estados para `cellOptions.statusMap` (mismos que Tabantaj):
 * `statusMap: CN_STATUS_PRESETS.approval`.
 */
export const CN_STATUS_PRESETS = {
  activeInactive: {
    active: {
      label: "Activo",
      color: "success",
      icon: "check_circle",
      description: "Registro activo",
    },
    inactive: {
      label: "Inactivo",
      color: "error",
      icon: "cancel",
      description: "Registro inactivo",
    },
  },

  enabledDisabled: {
    enabled: {
      label: "Habilitado",
      color: "success",
      icon: "check_circle",
      description: "Habilitado",
    },
    disabled: {
      label: "Deshabilitado",
      color: "error",
      icon: "cancel",
      description: "Deshabilitado",
    },
  },

  yesNo: {
    true: {
      label: "Sí",
      color: "success",
      icon: "check_circle",
      description: "Aplica",
    },
    false: {
      label: "No",
      color: "error",
      icon: "cancel",
      description: "No aplica",
    },
  },

  trueFalse: {
    true: {
      label: "Activo",
      color: "success",
      icon: "check_circle",
      description: "Verdadero",
    },
    false: {
      label: "Inactivo",
      color: "error",
      icon: "cancel",
      description: "Falso",
    },
  },

  onOff: {
    on: {
      label: "Encendido",
      color: "success",
      icon: "power_settings_new",
      description: "Encendido",
    },
    off: {
      label: "Apagado",
      color: "error",
      icon: "power_settings_new",
      description: "Apagado",
    },
  },

  openClosed: {
    open: {
      label: "Abierto",
      color: "success",
      icon: "unfold_more",
      description: "Abierto",
    },
    closed: {
      label: "Cerrado",
      color: "error",
      icon: "unfold_less",
      description: "Cerrado",
    },
  },

  privatePublic: {
    private: {
      label: "Privado",
      color: "secondary",
      icon: "lock",
      description: "Privado",
    },
    public: {
      label: "Público",
      color: "success",
      icon: "lock_open",
      description: "Público",
    },
  },

  internalExternal: {
    internal: {
      label: "Interno",
      color: "primary",
      icon: "business",
      description: "Interno",
    },
    external: {
      label: "Externo",
      color: "accent",
      icon: "public",
      description: "Externo",
    },
  },

  approval: {
    approved: {
      label: "Aprobado",
      color: "success",
      icon: "check_circle",
      description: "Aprobado",
    },
    pending: {
      label: "Pendiente",
      color: "warning",
      icon: "pending",
      description: "Pendiente",
    },
    rejected: {
      label: "Rechazado",
      color: "error",
      icon: "cancel",
      description: "Rechazado",
    },
    cancelled: {
      label: "Cancelado",
      color: "error",
      icon: "cancel",
      description: "Cancelado",
    },
    review: {
      label: "En revisión",
      color: "info",
      icon: "visibility",
      description: "En revisión",
    },
  },

  payment: {
    paid: {
      label: "Pagado",
      color: "success",
      icon: "paid",
      description: "Pagado",
    },
    pending: {
      label: "Pendiente",
      color: "warning",
      icon: "schedule",
      description: "Pendiente",
    },
    overdue: {
      label: "Vencido",
      color: "error",
      icon: "warning",
      description: "Vencido",
    },
    partially: {
      label: "Parcial",
      color: "info",
      icon: "price_change",
      description: "Parcial",
    },
    failed: {
      label: "Fallido",
      color: "error",
      icon: "error",
      description: "Fallido",
    },
    refunded: {
      label: "Reembolsado",
      color: "neutral",
      icon: "money_off",
      description: "Reembolsado",
    },
  },

  priority: {
    critical: {
      label: "Crítica",
      color: "error",
      icon: "priority_high",
      description: "Prioridad crítica",
    },
    high: {
      label: "Alta",
      color: "error",
      icon: "priority_high",
      description: "Alta prioridad",
    },
    medium: {
      label: "Media",
      color: "warning",
      icon: "drag_handle",
      description: "Prioridad media",
    },
    low: {
      label: "Baja",
      color: "success",
      icon: "low_priority",
      description: "Baja prioridad",
    },
    lowest: {
      label: "Mínima",
      color: "neutral",
      icon: "low_priority",
      description: "Prioridad mínima",
    },
  },

  user: {
    active: {
      label: "Activo",
      color: "success",
      icon: "check_circle",
      description: "Usuario activo",
    },
    suspended: {
      label: "Suspendido",
      color: "warning",
      icon: "pause_circle",
      description: "Suspendido",
    },
    blocked: {
      label: "Bloqueado",
      color: "error",
      icon: "block",
      description: "Bloqueado",
    },
    pending: {
      label: "Pendiente",
      color: "info",
      icon: "pending",
      description: "Pendiente de activación",
    },
    deleted: {
      label: "Eliminado",
      color: "error",
      icon: "delete",
      description: "Eliminado",
    },
  },

  session: {
    online: {
      label: "En línea",
      color: "success",
      icon: "online_prediction",
      description: "Conectado",
    },
    offline: {
      label: "Desconectado",
      color: "neutral",
      icon: "offline_bolt",
      description: "Desconectado",
    },
    away: {
      label: "Ausente",
      color: "warning",
      icon: "snooze",
      description: "Ausente",
    },
    busy: {
      label: "Ocupado",
      color: "error",
      icon: "do_not_disturb_on",
      description: "Ocupado",
    },
  },

  project: {
    planning: {
      label: "Planificación",
      color: "info",
      icon: "assignment",
      description: "Planificación",
    },
    in_progress: {
      label: "En progreso",
      color: "primary",
      icon: "play_circle",
      description: "En progreso",
    },
    on_hold: {
      label: "En pausa",
      color: "warning",
      icon: "pause_circle",
      description: "En pausa",
    },
    completed: {
      label: "Completado",
      color: "success",
      icon: "check_circle",
      description: "Completado",
    },
    cancelled: {
      label: "Cancelado",
      color: "error",
      icon: "cancel",
      description: "Cancelado",
    },
    delayed: {
      label: "Retrasado",
      color: "error",
      icon: "timer_off",
      description: "Retrasado",
    },
  },

  task: {
    todo: {
      label: "Por hacer",
      color: "neutral",
      icon: "check_box_outline_blank",
      description: "Pendiente",
    },
    in_progress: {
      label: "En progreso",
      color: "primary",
      icon: "play_circle",
      description: "En progreso",
    },
    review: {
      label: "En revisión",
      color: "warning",
      icon: "visibility",
      description: "En revisión",
    },
    done: {
      label: "Completada",
      color: "success",
      icon: "check_circle",
      description: "Completada",
    },
    blocked: {
      label: "Bloqueada",
      color: "error",
      icon: "block",
      description: "Bloqueada",
    },
  },

  incident: {
    new: {
      label: "Nueva",
      color: "info",
      icon: "new_releases",
      description: "Nueva",
    },
    assigned: {
      label: "Asignada",
      color: "primary",
      icon: "assignment_ind",
      description: "Asignada",
    },
    in_progress: {
      label: "En progreso",
      color: "warning",
      icon: "play_circle",
      description: "En progreso",
    },
    resolved: {
      label: "Resuelta",
      color: "success",
      icon: "check_circle",
      description: "Resuelta",
    },
    closed: {
      label: "Cerrada",
      color: "neutral",
      icon: "check_circle",
      description: "Cerrada",
    },
    reopened: {
      label: "Reabierta",
      color: "error",
      icon: "replay",
      description: "Reabierta",
    },
  },

  type: {
    physical: {
      label: "Físico",
      color: "primary",
      icon: "inventory",
      description: "Tipo físico",
    },
    digital: {
      label: "Digital",
      color: "accent",
      icon: "cloud",
      description: "Tipo digital",
    },
    service: {
      label: "Servicio",
      color: "success",
      icon: "handshake",
      description: "Tipo servicio",
    },
    product: {
      label: "Producto",
      color: "info",
      icon: "shopping_cart",
      description: "Tipo producto",
    },
  },

  phase: {
    initial: {
      label: "Inicial",
      color: "info",
      icon: "start",
      description: "Fase inicial",
    },
    development: {
      label: "Desarrollo",
      color: "primary",
      icon: "code",
      description: "Fase de desarrollo",
    },
    testing: {
      label: "Pruebas",
      color: "warning",
      icon: "bug_report",
      description: "Fase de pruebas",
    },
    production: {
      label: "Producción",
      color: "success",
      icon: "rocket",
      description: "Fase de producción",
    },
    maintenance: {
      label: "Mantenimiento",
      color: "neutral",
      icon: "build",
      description: "Fase de mantenimiento",
    },
  },

  quality: {
    excellent: {
      label: "Excelente",
      color: "success",
      icon: "star",
      description: "Excelente",
    },
    good: {
      label: "Buena",
      color: "success",
      icon: "star_half",
      description: "Buena",
    },
    fair: {
      label: "Aceptable",
      color: "warning",
      icon: "star_border",
      description: "Aceptable",
    },
    poor: {
      label: "Deficiente",
      color: "error",
      icon: "star_border",
      description: "Deficiente",
    },
    unacceptable: {
      label: "Inaceptable",
      color: "error",
      icon: "cancel",
      description: "Inaceptable",
    },
  },

  validation: {
    valid: {
      label: "Válido",
      color: "success",
      icon: "check_circle",
      description: "Válido",
    },
    invalid: {
      label: "Inválido",
      color: "error",
      icon: "cancel",
      description: "Inválido",
    },
    pending: {
      label: "Pendiente",
      color: "warning",
      icon: "pending",
      description: "Pendiente",
    },
    expired: {
      label: "Expirado",
      color: "error",
      icon: "timer_off",
      description: "Expirado",
    },
  },

  risk: {
    low: {
      label: "Bajo",
      color: "success",
      icon: "shield",
      description: "Riesgo bajo",
    },
    medium: {
      label: "Medio",
      color: "warning",
      icon: "shield",
      description: "Riesgo medio",
    },
    high: {
      label: "Alto",
      color: "error",
      icon: "shield",
      description: "Riesgo alto",
    },
    critical: {
      label: "Crítico",
      color: "error",
      icon: "warning",
      description: "Riesgo crítico",
    },
  },

  size: {
    xs: {
      label: "XS",
      color: "neutral",
      icon: "crop_square",
      description: "Extra pequeño",
    },
    sm: {
      label: "S",
      color: "neutral",
      icon: "crop_square",
      description: "Pequeño",
    },
    md: {
      label: "M",
      color: "primary",
      icon: "crop_square",
      description: "Mediano",
    },
    lg: {
      label: "L",
      color: "primary",
      icon: "crop_square",
      description: "Grande",
    },
    xl: {
      label: "XL",
      color: "accent",
      icon: "crop_square",
      description: "Extra grande",
    },
  },

  trust: {
    verified: {
      label: "Verificado",
      color: "success",
      icon: "verified",
      description: "Verificado",
    },
    trusted: {
      label: "Confiable",
      color: "primary",
      icon: "verified",
      description: "Confiable",
    },
    unverified: {
      label: "No verificado",
      color: "warning",
      icon: "verified",
      description: "No verificado",
    },
    suspicious: {
      label: "Sospechoso",
      color: "error",
      icon: "warning",
      description: "Sospechoso",
    },
  },

  integration: {
    connected: {
      label: "Conectado",
      color: "success",
      icon: "link",
      description: "Conectado",
    },
    disconnected: {
      label: "Desconectado",
      color: "error",
      icon: "link_off",
      description: "Desconectado",
    },
    syncing: {
      label: "Sincronizando",
      color: "warning",
      icon: "sync",
      description: "Sincronizando",
    },
    error: {
      label: "Error",
      color: "error",
      icon: "error",
      description: "Error",
    },
  },

  availability: {
    available: {
      label: "Disponible",
      color: "success",
      icon: "check_circle",
      description: "Disponible",
    },
    unavailable: {
      label: "No disponible",
      color: "error",
      icon: "block",
      description: "No disponible",
    },
    occupied: {
      label: "Ocupado",
      color: "warning",
      icon: "event_busy",
      description: "Ocupado",
    },
  },

  successFailure: {
    success: {
      label: "Éxito",
      color: "success",
      icon: "check_circle",
      description: "Exitoso",
    },
    failure: {
      label: "Falla",
      color: "error",
      icon: "error",
      description: "Fallido",
    },
  },

  connection: {
    online: {
      label: "En línea",
      color: "success",
      icon: "wifi",
      description: "Conectado",
    },
    offline: {
      label: "Sin conexión",
      color: "error",
      icon: "wifi_off",
      description: "Sin conexión",
    },
    unstable: {
      label: "Inestable",
      color: "warning",
      icon: "wifi_find",
      description: "Inestable",
    },
  },

  notification: {
    read: {
      label: "Leído",
      color: "neutral",
      icon: "drafts",
      description: "Leído",
    },
    unread: {
      label: "No leído",
      color: "primary",
      icon: "mark_email_unread",
      description: "No leído",
    },
    important: {
      label: "Importante",
      color: "error",
      icon: "priority_high",
      description: "Importante",
    },
  },

  sharing: {
    shared: {
      label: "Compartido",
      color: "success",
      icon: "share",
      description: "Compartido",
    },
    not_shared: {
      label: "No compartido",
      color: "neutral",
      icon: "share",
      description: "No compartido",
    },
    shared_edit: {
      label: "Compartido (edición)",
      color: "warning",
      icon: "edit",
      description: "Con edición",
    },
    shared_view: {
      label: "Compartido (vista)",
      color: "info",
      icon: "visibility",
      description: "Solo vista",
    },
  },

  backup: {
    completed: {
      label: "Completado",
      color: "success",
      icon: "backup",
      description: "Completado",
    },
    in_progress: {
      label: "En progreso",
      color: "warning",
      icon: "backup",
      description: "En progreso",
    },
    failed: {
      label: "Fallido",
      color: "error",
      icon: "error",
      description: "Fallido",
    },
  },

  sync: {
    synced: {
      label: "Sincronizado",
      color: "success",
      icon: "sync",
      description: "Sincronizado",
    },
    pending: {
      label: "Pendiente",
      color: "warning",
      icon: "sync",
      description: "Pendiente",
    },
    error: {
      label: "Error",
      color: "error",
      icon: "sync_problem",
      description: "Error",
    },
  },

  server: {
    running: {
      label: "Ejecutándose",
      color: "success",
      icon: "check_circle",
      description: "Ejecutándose",
    },
    stopped: {
      label: "Detenido",
      color: "error",
      icon: "stop_circle",
      description: "Detenido",
    },
    restarting: {
      label: "Reiniciando",
      color: "warning",
      icon: "restart_alt",
      description: "Reiniciando",
    },
    maintenance: {
      label: "Mantenimiento",
      color: "info",
      icon: "build",
      description: "En mantenimiento",
    },
  },

  license: {
    active: {
      label: "Activa",
      color: "success",
      icon: "check_circle",
      description: "Activa",
    },
    inactive: {
      label: "Inactiva",
      color: "error",
      icon: "cancel",
      description: "Inactiva",
    },
    trial: {
      label: "Prueba",
      color: "info",
      icon: "science",
      description: "En prueba",
    },
    expired: {
      label: "Expirada",
      color: "error",
      icon: "timer_off",
      description: "Expirada",
    },
  },

  version: {
    latest: {
      label: "Última versión",
      color: "success",
      icon: "new_releases",
      description: "Actualizada",
    },
    outdated: {
      label: "Desactualizada",
      color: "warning",
      icon: "warning",
      description: "Desactualizada",
    },
    deprecated: {
      label: "Deprecada",
      color: "error",
      icon: "error",
      description: "Deprecada",
    },
    beta: {
      label: "Beta",
      color: "info",
      icon: "science",
      description: "En beta",
    },
  },

  compatibility: {
    compatible: {
      label: "Compatible",
      color: "success",
      icon: "check_circle",
      description: "Compatible",
    },
    incompatible: {
      label: "Incompatible",
      color: "error",
      icon: "cancel",
      description: "Incompatible",
    },
    partial: {
      label: "Parcial",
      color: "warning",
      icon: "warning",
      description: "Parcialmente compatible",
    },
  },
} satisfies Record<string, Record<string, CnStatusOption>>;
