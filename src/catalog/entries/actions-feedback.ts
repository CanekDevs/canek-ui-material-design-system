import type { CnCatalogEntry } from "../types";

/** Acciones, fundamentos y retroalimentación. */
export const CATALOG_ACTIONS_FEEDBACK: CnCatalogEntry[] = [
  {
    name: "CnButton",
    category: "acciones",
    domains: ["general"],
    status: "estable",
    summary: "Botón de acción con variantes, tamaños, íconos, estado de carga y modo solo ícono.",
    purpose:
      "Disparar una acción del usuario (guardar, enviar, abrir, eliminar) con la jerarquía visual adecuada: `contained` para la acción principal, `outlined` para secundarias y `text` para terciarias. Incluye íconos por nombre, `loading` que bloquea el doble envío, tooltip y versión solo ícono para barras de herramientas.",
    whenNot:
      "Para navegar a otra página usa un enlace (`href`) o `CnTabs`; para elegir una opción entre varias usa `CnSegmentedField` o `CnRadioGroupField`; para encender/apagar un ajuste usa `CnSwitchField`; para una acción destructiva que requiere confirmación combínalo con `CnConfirmDialog`.",
    neighbors:
      "Es la base de las acciones de `CnDialog`, `CnDrawer`, `CnAlert` y `CnDataTable`. `CnChip` es para etiquetas o filtros, no para acciones principales.",
    related: ["CnButtonSkeleton"],
  },
  {
    name: "CnIcon",
    category: "fundamentos",
    domains: ["general"],
    status: "estable",
    summary: "Ícono por nombre desde un registro central, con tamaños y colores semánticos.",
    purpose:
      'Dar un vocabulario visual único a toda la aplicación: cada ícono se pide por nombre (`name="edit"`) y sale del mismo registro, así los componentes que aceptan `icon` como texto usan exactamente los mismos glifos. Ofrece escala de tamaños (`xs`–`2xl` o px), colores de la paleta (`primary`, `success`, `muted`…), animaciones `spin`/`pulse`, rotación, `label` accesible (decorativo si se omite) y `registerIcons()` para ampliar el registro con íconos propios.',
    whenNot:
      "Para una acción clicable usa `CnButton` con `iconOnly` (tiene foco, tooltip y área táctil), no un ícono con `onClick`; para banderas de países usa `CnFlagIcon`; para la foto o iniciales de una persona usa `CnAvatar`; para ilustrar un estado sin datos usa `CnEmptyState`.",
    neighbors:
      "Es la pieza común de casi todo el sistema: `CnButton`, `CnChip`, `CnAlert`, `CnTabs`, `CnSectionCard` y los campos de formulario reciben el nombre del ícono como texto y lo resuelven con este registro. `CnBadge` se coloca sobre un ícono para mostrar contadores.",
    related: ["CnIconSkeleton", "ICON_REGISTRY", "registerIcons"],
  },
  {
    name: "CnFlagIcon",
    category: "fundamentos",
    domains: ["general", "ecommerce", "crm", "pagos"],
    status: "estable",
    summary: "Bandera de país por código ISO, sola o con nombre y lada.",
    purpose:
      "Identificar un país de forma visual en selectores, tablas y fichas: recibe el código ISO 3166-1 (`MX`, `US`, `ES`…) y dibuja la bandera en proporción 3:2 con SVG integrado, sin peticiones a terceros. Variantes `icon`, `with-name` (bandera y nombre) y `full` (bandera, nombre y lada telefónica); `getFlagUrl` permite usar banderas detalladas de un servidor propio.",
    whenNot:
      "Para elegir un país usa `CnCountryField` y para capturar un teléfono con lada `CnPhoneField` (ya muestran la bandera); para íconos de interfaz usa `CnIcon`; para elegir un idioma no uses banderas, usa el nombre del idioma.",
    neighbors:
      "`CnPhoneField` lo usa en su selector de lada y `CnDataTable` en sus celdas de país. Se combina con `CnChip` o `CnList` para listar países, mercados o sucursales.",
    related: ["CnFlagIconSkeleton", "BUILT_IN_FLAG_CODES"],
  },
  {
    name: "CnBadge",
    category: "retroalimentacion",
    domains: ["general", "dashboards"],
    status: "estable",
    summary: "Insignia de contador, punto o etiqueta superpuesta a otro elemento.",
    purpose:
      'Señalar que algo tiene novedades o requiere atención sin ocupar espacio propio: notificaciones sobre una campana, mensajes sin leer en un avatar o un punto de "nuevo". Variantes `count` (con tope `max`, p. ej. 99+, y `showZero`), `dot` y `label` (texto corto); colores semánticos, `pulse` para llamar la atención, tamaños y posición configurable (`anchorOrigin`, `overlap`).',
    whenNot:
      'Para una etiqueta de estado independiente ("Pagado", "Pendiente") o un filtro usa `CnChip`; para el estado de conexión de una persona usa la prop `status` de `CnAvatar`; para un indicador numérico principal usa `CnMetricCard`; para avisos con texto usa `CnAlert` o `CnToast`.',
    neighbors:
      "Envuelve a `CnIcon`, `CnButton` o `CnAvatar`. `CnNotificationCenter` lo usa para el contador de su campana, y `CnTabs` ya tiene un `badge` por pestaña, así que no hace falta anidarlo ahí.",
    related: ["CnBadgeSkeleton"],
  },
  {
    name: "CnChip",
    category: "datos",
    domains: ["general", "crm", "ecommerce", "erp"],
    status: "estable",
    summary: "Etiqueta compacta para estados, categorías, filtros y elementos removibles.",
    purpose:
      'Mostrar en poco espacio un estado ("Pagado", "Vencido"), una categoría o un filtro activo. Admite variantes `filled`, `outlined`, `soft`, `light` y `ghost`; colores semánticos; ícono por nombre o avatar; subtítulo; formas `pill`, `rounded` y `circle`; botón para quitar (`onDelete`), clic con chevrón para abrir opciones y efectos `pulse`/`glow` para estados en vivo.',
    whenNot:
      "Para la acción principal de una pantalla usa `CnButton`; para un contador superpuesto usa `CnBadge`; para capturar varias etiquetas escritas por el usuario usa `CnTagsField`; para elegir una sola opción de un grupo usa `CnSegmentedField` o `CnChoiceCardsField`.",
    neighbors:
      "Es la etiqueta de estado estándar en `CnList`, `CnTimeline`, `CnDocCard`, `CnProfileCard`, `CnMetricCard` y `CnSectionCard` (su `badge`). Se parece a `CnBadge` en variante `label`, pero el chip vive por sí mismo y el badge siempre se superpone a otro elemento.",
    related: ["CnChipSkeleton"],
  },
  {
    name: "CnAvatar",
    category: "datos",
    domains: ["general", "crm", "rrhh", "reservas"],
    status: "estable",
    summary:
      "Foto, iniciales o ícono de una persona o entidad, con estado e insignia; incluye grupo apilado.",
    purpose:
      'Representar a una persona, empresa o recurso de forma reconocible: usa la foto si existe (con `fallbackSrc`) y, si no, iniciales calculadas del `name` sobre un color estable. Ofrece tamaños `xs`–`2xl`, formas circular, redondeada y cuadrada, indicador de presencia (`online`, `busy`, `away`, `offline`), insignia, borde y versión clicable o con enlace. `CnAvatarGroup` apila varios avatares con tope y contador de excedente ("+3").',
    whenNot:
      "Para mostrar a una persona con su información (cargo, contacto, acciones) usa `CnProfileCard`; para listas de personas con datos secundarios usa `CnList`; para íconos de interfaz usa `CnIcon`; para contadores de notificaciones usa `CnBadge`.",
    neighbors:
      "`CnProfileCard`, `CnList`, `CnTimeline`, `CnDocCard`, `CnEventCalendar` y `CnSectionCard` (prop `avatar`) lo usan internamente. `CnAvatarGroup` es la forma de mostrar participantes o responsables en tablas y tarjetas.",
    related: ["CnAvatarGroup", "CnAvatarSkeleton", "CnAvatarGroupSkeleton"],
  },
  {
    name: "CnAlert",
    category: "retroalimentacion",
    domains: ["general"],
    status: "estable",
    summary:
      "Mensaje con semántica de estado (éxito, info, advertencia, error) en línea, como popup o toast.",
    purpose:
      "Comunicar algo que el usuario debe leer en contexto: un error de validación sobre un formulario, una advertencia de saldo, una nota informativa. Severidades `success`, `info`, `warning` y `error`; variantes `standard`, `filled`, `outlined` y `left-accent` (callout de contenido); fila de `actions` (botones o enlaces que hacen wrap), `details` plegables, cierre autogestionado (`dismissible`) y modos `inline`, `popup` y `toast` con autocierre.",
    whenNot:
      'Para avisos globales que se apilan y desaparecen tras una acción usa `CnToast` (`useToast()`); para pedir confirmación usa `CnConfirmDialog`; para mostrar un dato o KPI (etiqueta y valor) usa `CnMetricCard` (`layout="inline"`); para agrupar contenido con encabezado y cuerpo usa `CnSectionCard`; para tarjetas con imagen, clic o enlace usa `CnCard`; para una lista o tabla sin datos usa `CnEmptyState`.',
    neighbors:
      'Comparte severidades e íconos con `CnToast`, que es el canal para avisos efímeros en cola; el `mode="toast"` de `CnAlert` sirve solo para un aviso suelto que el propio componente controla. Sus acciones usan `CnButton`, y `CnSectionCard` o `CnDialog` lo incluyen en su cuerpo para errores de carga o guardado.',
    related: ["CnAlertSkeleton"],
  },
  {
    name: "CnToast",
    category: "retroalimentacion",
    domains: ["general"],
    status: "estable",
    summary: "Avisos efímeros en cola, lanzados desde cualquier parte con `useToast()`.",
    purpose:
      'Confirmar el resultado de una acción sin interrumpir ("Cliente guardado", "No se pudo enviar") desde cualquier componente: `CnToastProvider` en la raíz y `useToast()` con `success`, `info`, `warning`, `error` y `loading`. `toast.error(err)` acepta errores de API y extrae el mensaje y los errores por campo (`describeError`); `toast.promise()` muestra "cargando" y lo cambia a éxito o error; admite acción ("Deshacer"), detalles, duración o aviso fijo, actualización por `id`, tope de avisos visibles y seis posiciones.',
    whenNot:
      "Si el mensaje debe quedarse junto al contenido al que se refiere (errores de un formulario, avisos de una sección) usa `CnAlert`; si el usuario debe decidir antes de continuar usa `CnConfirmDialog`; para un historial de avisos consultable usa `CnNotificationCenter`.",
    neighbors:
      "Usa la misma semántica de severidad que `CnAlert`. Se combina con `CnConfirmDialog` (confirmar y luego avisar el resultado) y con `CnForm` para informar del guardado; `CnNotificationCenter` guarda lo persistente y el toast lo pasajero.",
    related: ["CnToastProvider", "useToast", "describeError", "CnToastSkeleton"],
  },
  {
    name: "CnEmptyState",
    category: "retroalimentacion",
    domains: ["general", "dashboards"],
    status: "estable",
    summary: "Estado vacío con ícono o ilustración, título, descripción y acción sugerida.",
    purpose:
      'Explicar por qué no hay nada que mostrar y qué hacer a continuación: una lista sin registros, una búsqueda sin resultados, un módulo aún sin configurar. Ícono por nombre o ilustración propia, título, descripción, acción (p. ej. "Crear cliente"), variantes `default`, `compact` y `card`, tamaños, colores semánticos y rol accesible (`status`, `alert` o ninguno).',
    whenNot:
      "Mientras los datos se cargan usa `CnSkeleton` (o la prop `skeleton` del componente); para un error de carga usa `CnAlert`; si el vacío vive dentro de una sección o tabla, usa el estado vacío integrado de `CnSectionCard` (`empty`) o `CnDataTable` en lugar de componerlo a mano.",
    neighbors:
      "`CnDataTable`, `CnList`, `CnTimeline`, las gráficas (`CnBarChart`, `CnLineChart`, `CnChartCard`…), `CnCarousel`, `CnEventCalendar` y `CnSectionCard` lo usan para su estado sin datos. Su acción suele ser un `CnButton`.",
    related: ["CnEmptyStateSkeleton"],
  },
  {
    name: "CnSkeleton",
    category: "retroalimentacion",
    domains: ["general"],
    status: "estable",
    summary:
      "Marcador de carga (bloque, círculo o líneas de texto) y kit para construir skeletons.",
    purpose:
      'Reservar el espacio del contenido mientras llega, para evitar saltos de diseño y dar sensación de rapidez. Variantes `rectangular`, `rounded`, `circular` y `text` (con varias `lines`), animaciones `pulse`, `wave` o ninguna, y medidas libres. El kit (`CnSkeletonGroup`, `CnFieldSkeleton`, `SkLines`, `SkBlock`…) agrupa las piezas bajo un solo `role="status"` accesible y replica las medidas exactas de los campos reales.',
    whenNot:
      "Para un componente concreto usa su propio skeleton (`CnButtonSkeleton`, `CnAlertSkeleton`…) o su prop `skeleton`, que ya imitan su forma; para un formulario completo usa `CnFormSkeleton`; para una acción en curso usa `loading` de `CnButton`; cuando la carga terminó sin datos usa `CnEmptyState`.",
    neighbors:
      "Es la base de todos los skeletons del sistema y de la prop `skeleton`/`loading` de componentes como `CnCard`, `CnSectionCard` y `CnPageContainer`. `CnFieldSkeleton` es la pieza que usan los skeletons de campos y `CnFormSkeleton`.",
    related: [
      "CnSkeletonGroup",
      "CnFieldSkeleton",
      "CnSkeletonPartContext",
      "useSkeletonGroup",
      "SkBlock",
      "SkLabeled",
      "SkLines",
      "SkText",
      "varyWidth",
    ],
  },
  {
    name: "CnConfirmDialog",
    category: "superposiciones",
    domains: ["general"],
    status: "estable",
    summary:
      "Diálogo de confirmación con presets, carga asíncrona, errores y confirmación por texto.",
    purpose:
      'Pedir un "sí/no" explícito antes de una acción con consecuencias (eliminar, cancelar un pedido, publicar). Presets `delete`, `danger`, `warning`, `info`, `success`, `update` y `neutral` con textos, ícono y color; si `onConfirm` devuelve una promesa muestra "cargando", se cierra al resolverse y, si falla, muestra el error y sigue abierto. `requireText` exige escribir un texto (p. ej. el nombre del registro) en acciones irreversibles y `details` resume lo afectado. `useConfirm()` (con `CnConfirmProvider`) lo abre de forma imperativa y devuelve una promesa.',
    whenNot:
      'Para formularios, detalle de registros o cualquier contenido más allá de una pregunta usa `CnDialog`; para trabajar sin perder la página de vista usa `CnDrawer`; para avisar que algo ya ocurrió usa `CnToast`; en acciones reversibles suele ser mejor ejecutar y ofrecer "Deshacer" en `CnToast` que preguntar.',
    neighbors:
      'Su botón de confirmar es un `CnButton`. `CnDialog` y `CnDrawer` lo reutilizan para la pregunta "¿Descartar cambios?" cuando hay cambios sin guardar, y `CnDataTable` lo usa para confirmar acciones sobre filas.',
    related: ["CnConfirmProvider", "useConfirm", "CN_CONFIRM_PRESETS", "CnConfirmDialogSkeleton"],
  },
];
