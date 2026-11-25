import type { CnCatalogEntry } from "../types";

/** Contenido, tarjetas, medios y mapas. */
export const CATALOG_CONTENT_MEDIA: CnCatalogEntry[] = [
  {
    name: "CnDocCard",
    category: "contenido",
    domains: ["cms", "erp", "rrhh", "crm", "general"],
    status: "beta",
    summary:
      "Tarjeta de un documento o archivo existente: tipo, miniatura, metadatos, estado, versión y acciones.",
    purpose:
      "Mostrar un archivo ya guardado para consultarlo o actuar sobre él: repositorios documentales, adjuntos de un expediente, contratos, facturas, recursos de un curso. Detecta el tipo por mime o extensión (ícono, color o miniatura, incluido un cuadro de video), muestra nombre, tamaño, páginas, fecha y autor, estado, versión y etiquetas, y ofrece ver (vista previa de imagen, video, audio y PDF), descargar, compartir, menú de más acciones, quitar y selección. También representa la subida en curso o el error de un archivo puntual. Layouts `list`, `grid` y `compact`.",
    whenNot:
      "Para que el usuario elija o suba archivos dentro de un formulario usa `CnFileField` (valida, reordena y entrega el valor); para muchos archivos con orden, filtros por columna y acciones masivas usa `CnDataTable` (tipo de celda `file`); para una galería de fotos usa `CnFileField` en `grid`/`masonry` o `CnCarousel`; para una tarjeta de contenido genérico usa `CnCard`.",
    neighbors:
      "`CnFileField` dibuja su lista y su variante `card` con `CnDocCard`, así que un archivo se ve igual antes y después de guardarse (acepta el mismo valor con la prop `file`). La vista previa usa `CnImageViewer` de `CnDataTable`. Se construye sobre `CnCard` y puede ser diapositiva de `CnContentCarousel` (preset `cards`).",
    related: ["CnDocCardSkeleton"],
  },
  {
    name: "CnProfileCard",
    category: "contenido",
    domains: ["rrhh", "crm", "general"],
    status: "beta",
    summary:
      "Tarjeta de persona con avatar, puesto, contacto, evento con cuenta regresiva y acciones rápidas.",
    purpose:
      'Presentar a una persona y facilitar el contacto: directorios, equipo asignado, ejecutivo de cuenta, cumpleaños y aniversarios del mes. Muestra avatar con estado, puesto, área, ubicación, detalles y etiquetas; correo, teléfono y WhatsApp; un evento (cumpleaños, aniversario, nuevo ingreso, ausencia, vacaciones, promoción) con cuenta regresiva y resaltado de "hoy"; y acciones rápidas ("Felicitar"). Layouts horizontal, vertical y compacto con portada opcional; se adapta al ancho de su contenedor y agrupa en "Más acciones" lo que no cabe. `CnProfileCardGroup` las agrupa por proximidad (Hoy / Próximos días), filtra por mes y resume con "Ver todos".',
    whenNot:
      "Para un usuario en una fila de tabla o lista densa usa `CnAvatar` dentro de `CnList` o `CnDataTable` (tipo de celda `contact`); para un bloque de información genérico con título usa `CnSectionCard`; para archivos usa `CnDocCard`; para un KPI usa `CnMetricCard`; para elegir personas en un formulario usa `CnAutocompleteField`.",
    neighbors:
      "Se construye sobre `CnCard`, `CnAvatar` y `CnChip`; `CnProfileCardGroup` usa `CnSectionCard` como contenedor. Encaja como diapositiva de `CnContentCarousel` (preset `cards`) o `CnCarousel`.",
    related: ["CnProfileCardGroup", "CnProfileCardSkeleton"],
  },
  {
    name: "CnCarousel",
    category: "medios",
    domains: ["ecommerce", "landing", "cms", "general"],
    status: "beta",
    summary:
      "Carrusel genérico para cualquier contenido: diapositivas por vista, bucle, autoplay accesible, arrastre e indicadores.",
    purpose:
      'Recorrer contenido que no cabe a la vista sin cambiar de página: galerías de producto, fotos de un inmueble, tarjetas relacionadas, pasos de una bienvenida. Calcula diapositivas por vista según el ancho del contenedor (por breakpoint), vistazo de la siguiente (`peek`), bucle continuo sin saltos (`loopMode="seamless"`), autoplay con progreso que se pausa al pasar el cursor, al enfocar o con el botón (y respeta movimiento reducido), flechas, puntos, progreso, fracción o miniaturas, arrastre y deslizamiento táctil con umbral y velocidad, teclado, RTL, carga diferida, proporción por breakpoint y `onSlideView` para analítica.',
    whenNot:
      "Para banners con imagen, título y CTA o una fila de tarjetas con encabezado usa `CnContentCarousel` (ya trae esos presets); para navegar entre secciones usa `CnTabs`; para listas que el usuario debe recorrer completas usa `CnList` o una cuadrícula; para ver archivos a pantalla completa usa `CnImageViewer`.",
    neighbors:
      "`CnContentCarousel` está construido encima de este componente. `CnProfileCard`, `CnDocCard` o `CnSectionCard` pueden ser sus diapositivas; el estado vacío sigue a `CnEmptyState`.",
    related: ["CnCarouselSkeleton"],
  },
  {
    name: "CnContentCarousel",
    category: "medios",
    domains: ["landing", "ecommerce", "cms", "rrhh", "general"],
    status: "beta",
    summary:
      "Carrusel de contenido destacado: banners hero con imagen o video y CTA, o fila de tarjetas con encabezado.",
    purpose:
      'Comunicar contenido destacado listo para usar. Preset `hero`: anuncios, promociones y comunicados internos con imagen responsiva (`srcSet`/`sizes` y marcador desenfocado), video o degradado, velo que refuerza el contraste en anchos chicos, título y descripción con líneas y tamaño según el ancho del carrusel, y CTA que se apilan cuando no caben. Preset `cards`: fila de tarjetas con título, ícono, acción de encabezado, flechas arriba y avance por página ("Productos recomendados", "Cumpleaños del mes").',
    whenNot:
      "Para una galería o un carrusel con contenido arbitrario sin estos presets usa `CnCarousel`; para un aviso único usa `CnAlert`; para una lista de personas con eventos que el usuario debe ver completa usa `CnProfileCardGroup`; para un bloque de contenido fijo usa `CnCard` o `CnSectionCard`.",
    neighbors:
      "Se construye sobre `CnCarousel` (hereda bucle continuo, autoplay, deslizamiento y `onSlideView`). En el preset `cards` suele llevar `CnProfileCard`, `CnDocCard` o `CnSectionCard`; sus CTA son `CnButton`.",
    related: ["CnContentCarouselSkeleton"],
  },
  {
    name: "CnMap",
    category: "medios",
    domains: ["reservas", "ecommerce", "crm", "erp", "landing", "general"],
    status: "estable",
    summary:
      "Mapa con marcadores, selector de ubicación, estilos y modo oscuro, que funciona con o sin API key.",
    purpose:
      "Ubicar lugares en contexto: sucursales, dirección de entrega, zona de un inmueble, ruta de visitas. Muestra uno o varios marcadores (ajusta la vista a todos), búsqueda por dirección, modo selector con marcador arrastrable, estilos propios o presets, estilo administrado por `mapId`, tema claro/oscuro automático, controles configurables, gestos cooperativos y una lista accesible de marcadores. Sin API key cae a un mapa embebido con enlace para abrirlo fuera; las utilidades generan imágenes estáticas para PDF, impresión o correos. `CnMapsProvider` comparte la configuración en toda la app.",
    whenNot:
      "Para capturar una dirección postal en un formulario usa `CnAddressField`; para que el usuario elija un punto como valor de formulario usa `CnLocationField`; para mostrar coordenadas o una ubicación en una tabla usa los tipos de celda `location` y `coordinates` de `CnDataTable`; para densidad de actividad sin geografía usa `CnHeatmap`.",
    neighbors:
      "`CnLocationField` muestra su vista previa con `CnMap` y la ficha de las celdas `location` de `CnDataTable` también lo incrusta. Suele ir dentro de `CnCard` o `CnSectionCard` junto a `CnAddressField`.",
    related: ["CnMapsProvider", "CnMapSkeleton", "useMaps"],
  },
  {
    name: "CnDealCard",
    category: "contenido",
    domains: ["crm"],
    status: "beta",
    summary:
      "Tarjeta de oportunidad: monto, probabilidad, responsable, próxima actividad y estado.",
    purpose:
      "Resumir una oportunidad de venta en el espacio de una tarjeta para tableros, listas y paneles laterales: nombre y empresa, monto en la moneda indicada (con monto ponderado opcional), barra de probabilidad accesible con color según el avance, responsable con avatar, próxima actividad (marcada como vencida en rojo), etiquetas y fecha estimada de cierre. Muestra el estado Ganada o Perdida, tiene versión compacta para tableros densos y, con `onClick`, toda la tarjeta se vuelve un botón con estado seleccionado.",
    whenNot:
      "Para una persona o contacto usa `CnProfileCard`; para un indicador con tendencia usa `CnMetricCard`; para listar muchas oportunidades con columnas, orden y filtros usa `CnDataTable`; para el encabezado de la ficha completa de la oportunidad usa `CnRecordHeader`.",
    neighbors:
      "Es la tarjeta natural de `CnKanbanBoard` (embudo de ventas) y se filtra con `CnFilterBar`. Usa `CnAvatar` e `CnIcon`; comparte el formato de moneda con `CnCurrencyField`.",
    related: ["CnDealCardSkeleton"],
  },
];
