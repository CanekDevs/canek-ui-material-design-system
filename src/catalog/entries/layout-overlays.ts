import type { CnCatalogEntry } from "../types";

/** Layout, navegación y superposiciones. */
export const CATALOG_LAYOUT_OVERLAYS: CnCatalogEntry[] = [
  {
    name: "CnCard",
    category: "layout",
    domains: ["general", "ecommerce", "cms", "landing", "dashboards"],
    status: "estable",
    summary:
      "Tarjeta genérica con encabezado, medio, cuerpo y pie; clicable, con acento y estados de carga y vacío.",
    purpose:
      "Presentar una unidad de contenido autocontenida (un producto, un plan, un artículo, un acceso directo) que se repite en rejillas o se abre al hacer clic. Ofrece título, subtítulo, descripción e ícono, `media` (imagen o video), `headerActions` y `footer`; variantes `elevated`, `outlined`, `filled` y `ghost`; disposición vertical u horizontal; sombra, radio y relleno configurables; franja de acento; efecto `glass`; modo `interactive` con `onClick` o `href`; y estados `loading`, `skeleton` y `empty`. Las piezas `CnCardHeader`, `CnCardMedia`, `CnCardBody` y `CnCardFooter` permiten componer diseños propios.",
    whenNot:
      "Para una sección de página o de formulario con título, acciones y plegado usa `CnSectionCard`; para un KPI usa `CnMetricCard`; para una persona usa `CnProfileCard`; para un archivo o documento usa `CnDocCard`; para un aviso con severidad usa `CnAlert`; para listas densas de registros usa `CnList` o `CnDataTable`.",
    neighbors:
      "Es la superficie base de `CnSectionCard`, `CnDocCard` y `CnProfileCard`, que añaden la estructura de su caso de uso. En rejillas se combina con `CnCarousel` o `CnContentCarousel`, y sus acciones suelen ser `CnButton` y sus etiquetas `CnChip`.",
    related: ["CnCardHeader", "CnCardMedia", "CnCardBody", "CnCardFooter", "CnCardSkeleton"],
  },
  {
    name: "CnTabs",
    category: "navegacion",
    domains: ["general", "erp", "crm"],
    status: "estable",
    summary:
      "Pestañas para alternar vistas del mismo contexto, con íconos, contadores, errores y carga.",
    purpose:
      "Dividir una pantalla o registro en vistas hermanas (General, Facturas, Historial) sin cambiar de página. Cada pestaña admite ícono, subtítulo, `badge` con contador, `disabled`, `hasError` (marca la pestaña que tiene campos inválidos) e `isLoading`. Variantes `line`, `pill`, `soft`, `contained` y `outlined`; orientación horizontal o vertical; tamaños; ancho completo o centrado; desplazamiento con flechas cuando no caben y modo solo ícono.",
    whenNot:
      'Para elegir un valor que forma parte de un formulario o filtro usa `CnSegmentedField`; para pasos secuenciales con validación usa `CnForm` con `variant="wizard"`; para mostrar y ocultar bloques de contenido dentro de una página usa `CnSectionCard` con `collapsible`; para navegación principal de la aplicación usa el menú del layout, no pestañas.',
    neighbors:
      '`CnForm` (`variant="tabbed"`) lo usa para repartir formularios largos en pestañas (marcando las que tienen errores) y `CnNotificationCenter` para sus filtros. Suele vivir en `headerExtra` de `CnPageContainer`. Visualmente se parece a `CnSegmentedField`, pero las pestañas cambian la vista y el segmentado cambia un valor.',
    related: ["CnTabsSkeleton"],
  },
  {
    name: "CnPageContainer",
    category: "layout",
    domains: ["general", "erp", "crm", "cms", "dashboards"],
    status: "estable",
    summary:
      "Estructura de página con breadcrumbs, título, botón atrás, acciones y contenido con ancho máximo.",
    purpose:
      'Dar a todas las pantallas de un sistema la misma cabecera y márgenes: breadcrumbs (el último es la página actual), título con ícono y subtítulo, botón "atrás" (ruta, función o el breadcrumb anterior), acciones a la derecha, `headerExtra` para filtros o pestañas, encabezado fijo al desplazar, superficie opcional (`paper`) y `maxWidth`. Se integra con cualquier router mediante `linkComponent` y `onNavigate`, y `loading` muestra el skeleton de la página con la forma del contenido (bloques, tarjetas o tabla).',
    whenNot:
      "Para dividir el contenido de la página en bloques con título usa `CnSectionCard`; para alternar vistas dentro de la página usa `CnTabs`; para contenido que se abre encima de la página usa `CnDialog` o `CnDrawer`.",
    neighbors:
      "Es el contenedor de nivel superior: dentro van `CnSectionCard`, `CnDataTable`, `CnForm` o rejillas de `CnMetricCard`, y en `headerExtra` suelen ir `CnTabs` o `CnChip` de estado. Sus acciones son `CnButton`.",
    related: ["CnPageContainerSkeleton"],
  },
  {
    name: "CnSectionCard",
    category: "layout",
    domains: ["general", "erp", "crm", "rrhh", "dashboards"],
    status: "beta",
    summary:
      "Sección con encabezado (ícono, título, insignia, acciones), cuerpo y pie; plegable y con estados de carga, vacío y error.",
    purpose:
      "Organizar una página o un formulario largo en bloques con título claro (Datos generales, Dirección fiscal, Contactos). Encabezado con ícono o avatar, subtítulo, nota, insignia y acciones; nivel de encabezado accesible (`h2`–`h6`); variantes `outlined`, `elevated`, `filled` y `ghost`; franja de acento; plegado controlado o no (`collapsible`); encabezado fijo; estados `loading` (mantiene el encabezado), `skeleton`, `empty` y `error` con reintento; y soporte para secciones repetibles o reordenables (`onAdd`, `onRemove`, asa de arrastre).",
    whenNot:
      "Para una tarjeta de contenido que se repite en rejilla o se abre con clic usa `CnCard`; para un KPI usa `CnMetricCard`; para un aviso con severidad usa `CnAlert`; para alternar entre vistas hermanas usa `CnTabs`; para listas de elementos repetibles dentro de un formulario usa `CnRepeaterField`.",
    neighbors:
      "Se construye sobre `CnCard` y usa `CnEmptyState`, `CnChip` y `CnAvatar` en sus estados e insignias. Vive dentro de `CnPageContainer` y en su cuerpo suelen ir `CnForm`, `CnDataTable` o `CnList`; `CnProfileCard` la usa como contenedor de sus grupos.",
    related: ["CnSectionCardSkeleton"],
  },
  {
    name: "CnDialog",
    category: "superposiciones",
    domains: ["general", "erp", "crm"],
    status: "beta",
    summary:
      "Modal de propósito general con encabezado y pie fijos, acciones con carga y guarda de cambios sin guardar.",
    purpose:
      'Resolver tareas que requieren la atención del usuario sin salir de la pantalla: formularios de alta o edición, detalle de un registro, asistentes de pasos, vistas previas. Incluye encabezado y pie fijos, cuerpo con scroll y sombras, acciones con carga, tamaños `sm`–`xl` y `fullscreen`, pantalla completa en móvil, motivos de cierre (`onClose(reason)`), confirmación "¿Descartar cambios?" con `dirty`, diálogos apilados, apertura asíncrona (`loading`) y foco inicial. `useDialog()` (con `CnDialogProvider`) los abre de forma imperativa y devuelve una promesa.',
    whenNot:
      'Para pedir un "sí/no" antes de una acción usa `CnConfirmDialog` / `useConfirm()` (rol `alertdialog`, presets, confirmación por texto); para avisos pasajeros usa `CnToast` y para mensajes dentro de la página `CnAlert`; si el usuario necesita seguir viendo la página (detalle de una fila, filtros) usa `CnDrawer`.',
    neighbors:
      'Comparte encabezado, pie y guarda de cambios con `CnDrawer`; la confirmación de descarte reutiliza `CnConfirmDialog`. `CnForm` puede vivir en su cuerpo (con `onSubmit` y una acción `type: "submit"`), y sus botones son `CnButton`.',
    related: ["CnDialogProvider", "useDialog", "CnDialogSkeleton", "CN_DISCARD_CONFIRM_DEFAULTS"],
  },
  {
    name: "CnDrawer",
    category: "superposiciones",
    domains: ["general", "erp", "crm", "ecommerce"],
    status: "beta",
    summary:
      "Panel lateral o inferior para trabajar sin perder de vista la página, con variantes modal, persistente y mini.",
    purpose:
      'Mostrar detalle, filtros, edición rápida, bitácora o carrito junto a la página: anclado a izquierda, derecha o abajo. Variantes `temporary` (modal), `persistent` (empuja el contenido) y `mini` (franja con íconos al contraerse); tamaños `sm`–`xl`, `full` o medida propia; ancho ajustable arrastrando el borde (`resizable`, también con teclado); paneles anidados con `onBack`; y el mismo encabezado, cuerpo con scroll, pie con acciones, `loading`/`skeleton` y "¿Descartar cambios?" que `CnDialog`.',
    whenNot:
      "Si la tarea exige toda la atención o es corta y bloqueante usa `CnDialog`; para confirmar una acción usa `CnConfirmDialog`; para la navegación principal de la aplicación usa el menú del layout, no un panel de contenido.",
    neighbors:
      "Reutiliza las piezas de `CnDialog` (encabezado, pie y guarda de cambios con `CnConfirmDialog`). Se combina con `CnDataTable` (`onRowClick` abre el detalle) y `CnTimeline` (historial dentro del panel); `CnNotificationCenter` lo usa como panel en móvil.",
    related: ["CnDrawerSkeleton"],
  },
];
