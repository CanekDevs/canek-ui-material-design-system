import type { CnCatalogEntry } from "../types";

/**
 * Guía de elección de gráfica por forma del dato. Cada gráfica la incluye en "Cuándo NO usarlo"
 * sin repetir su propia forma, para que siempre quede claro qué usar en su lugar.
 */
type ChartShape =
  | "comparacion"
  | "tendencia"
  | "composicion"
  | "distribucion"
  | "relacion"
  | "flujo"
  | "jerarquia"
  | "kpi";

const CHART_GUIDE: Record<ChartShape, string> = {
  comparacion:
    "comparar categorías → `CnBarChart` (o `CnRadarChart` para perfiles en varias métricas)",
  tendencia:
    "tendencia en el tiempo → `CnLineChart`, `CnAreaChart` si importa el volumen acumulado, `CnCandlestickChart` para precios OHLC",
  composicion:
    "composición o partes de un todo → `CnDonutChart`/`CnPieChart` con pocas partes, `CnBarChart` apilada al 100 % para compararla entre periodos",
  distribucion:
    "distribución de valores → `CnHistogram`, o `CnHeatmap` para densidad en dos dimensiones",
  relacion: "relación entre dos o tres variables → `CnScatterChart` o `CnBubbleChart`",
  flujo: "flujo entre etapas → `CnSankeyChart`; conversión por pasos → `CnFunnelChart`",
  jerarquia: "jerarquía o peso de partes anidadas → `CnTreemap`",
  kpi: "un KPI aislado → `CnMetricCard` (con mini tendencia), `CnGauge` contra rangos o `CnRadialBarChart` para avance de varias metas",
};

const chartGuide = (...skip: ChartShape[]) =>
  "Guía por forma del dato: " +
  (Object.keys(CHART_GUIDE) as ChartShape[])
    .filter((shape) => !skip.includes(shape))
    .map((shape) => CHART_GUIDE[shape])
    .join("; ") +
  ".";

const CHART_NEIGHBORS =
  "Todas las gráficas comparten encabezado, periodos, exportación (PNG/SVG/CSV/XLSX/JSON), pantalla completa y estados de carga/vacío/error a través de `CnChartCard`; cada una tiene su skeleton con la misma forma.";

/** Datos, tablas, listas, calendarios y gráficas. */
export const CATALOG_DATA: CnCatalogEntry[] = [
  {
    name: "CnDataTable",
    category: "datos",
    domains: ["erp", "crm", "cms", "ecommerce", "pos", "reservas", "pagos", "rrhh", "dashboards"],
    status: "estable",
    summary:
      "Tabla de datos con orden, filtros, búsqueda, selección, acciones, agrupación, exportación y más de 50 tipos de celda.",
    purpose:
      "Consultar y operar registros en volumen (pedidos, clientes, facturas, empleados). Resuelve orden multicolumna, búsqueda global y filtros por columna, paginación local o en servidor (`serverSide`), selección con acciones masivas, acciones por fila con confirmación, detalle expandible, agrupación con agregados al pie, columnas fijas, redimensionables, reordenables y ocultables, densidad, pantalla completa, impresión y exportación (CSV, XLSX, JSON, copiar). Las columnas declaran un `type` (moneda, estado, contacto, fecha límite, RFC, sparkline…) y la tabla formatea, ordena y exporta el valor sin código extra. En móvil cambia a tarjetas y recuerda la configuración del usuario con `persistKey`.",
    whenNot:
      "Para pocos elementos con título, avatar y acciones (bandejas, contactos, menús) usa `CnList`; para un solo registro con sus campos usa `CnSectionCard`; para elegir elementos dentro de un formulario usa `CnTransferListField` o `CnSelectField`; para fechas y horarios usa `CnEventCalendar`; para un historial cronológico usa `CnTimeline`; para un indicador agregado usa `CnMetricCard` o una gráfica como `CnBarChart`.",
    neighbors:
      "Sus celdas (`CnCell`, `CnCellDetail`, `CnImageViewer`) se reutilizan fuera de la tabla: `CnDocCard` abre su vista previa con `CnImageViewer` y `CnChartCard`/`CnEventCalendar` exportan e imprimen con sus mismas utilidades. Las acciones usan `CnButton` y `CnConfirmDialog`; el estado vacío sigue a `CnEmptyState`. Frente a `CnList`: la tabla compara columnas entre filas; la lista resume cada elemento en una línea rica.",
    related: ["CnDataTableSkeleton", "CnCell", "CnCellDetail", "CnImageViewer"],
  },
  {
    name: "CnList",
    category: "datos",
    domains: ["general", "crm", "cms", "ecommerce", "rrhh", "ia"],
    status: "estable",
    summary:
      "Lista de elementos con avatar, ícono, estado, acciones, selección, búsqueda, grupos, árbol y virtualización.",
    purpose:
      "Mostrar colecciones donde cada elemento se lee como una unidad: bandejas, contactos, tareas, conversaciones, menús de configuración, resultados. Ofrece variantes (`plain`, `divided`, `card`, `inset`), densidad y superficies; título, subtítulo, descripción, metadatos, insignias, no leído y enlaces; búsqueda con resaltado, orden, selección simple o múltiple con acciones masivas, acciones por elemento (en línea o en menú), deslizamiento en táctil, reordenar arrastrando, grupos con encabezados fijos y plegables, jerarquía expandible, carga incremental y virtualización automática para miles de elementos.",
    whenNot:
      "Para comparar varios atributos por columna, ordenar por campo o exportar usa `CnDataTable`; para eventos en el tiempo usa `CnTimeline` o `CnEventCalendar`; para notificaciones con campana usa `CnNotificationCenter`; para elegir valores en un formulario usa `CnSelectField`, `CnTreeSelectField` o `CnTransferListField`; para tarjetas visuales grandes usa `CnProfileCard` o `CnDocCard`.",
    neighbors:
      "`CnNotificationCenter` dibuja su bandeja con `CnList`. Usa `CnAvatar`, `CnBadge` y `CnChip` dentro de cada elemento y `CnEmptyState` cuando no hay resultados. `CnListItem` y `CnListSubheader` sirven para listas armadas a mano con el mismo estilo.",
    related: ["CnListItem", "CnListSubheader", "CnListSkeleton"],
  },
  {
    name: "CnEventCalendar",
    category: "datos",
    domains: ["reservas", "rrhh", "crm", "erp", "general"],
    status: "estable",
    summary:
      "Calendario de eventos con vistas de mes, semana, día, agenda, trimestre, año, varios meses y recursos.",
    purpose:
      "Planear y operar agendas: citas, reservas de salas, turnos de personal, entregas, clases. Permite crear con clic o texto natural (`quickAdd`), arrastrar y redimensionar, recurrencias con edición de una o todas las ocurrencias, detección de conflictos por recurso o asistente, disponibilidad y horario laboral, días festivos, zonas horarias (incluida una secundaria), varias fuentes con barra lateral, categorías filtrables, vista de recursos tipo línea de tiempo, mapa de calor y capacidad por día, importación/exportación ICS, enlaces a calendarios externos, deshacer, menú contextual e impresión.",
    whenNot:
      "Para elegir una fecha o un rango en un formulario usa `CnDateField` (o `CnCalendar` incrustado); para definir horarios recurrentes de atención usa `CnScheduleField`; para un historial de lo ocurrido usa `CnTimeline`; para una lista simple de próximos pendientes usa `CnList`; para mostrar actividad por día sin eventos usa `CnCalendarHeatmap`.",
    neighbors:
      "`CnCalendar` es su hermano pequeño: selecciona fechas, no gestiona eventos. Comparte exportación e impresión con `CnDataTable`; sus diálogos y avisos siguen a `CnDialog` y `CnToast`; las categorías se muestran como `CnChip`.",
    related: ["CnEventCalendarSkeleton"],
  },
  {
    name: "CnCalendar",
    category: "formularios",
    domains: ["general", "reservas"],
    status: "estable",
    summary:
      "Calendario incrustado para seleccionar una fecha o un rango, con vistas de día, mes y año.",
    purpose:
      "Elegir fechas a la vista, sin abrir un menú: en paneles de reserva, filtros laterales o como base de selectores de fecha. Admite modo `single` o `range`, uno o dos meses visibles, selector de mes o año (`views`), números de semana, fechas marcadas con un punto y reglas de deshabilitado (mínimo/máximo, pasado/futuro, fines de semana, días puntuales o una función propia).",
    whenNot:
      "Dentro de un formulario con etiqueta, validación y menú desplegable usa `CnDateField`; para ver y editar eventos usa `CnEventCalendar`; para horarios semanales usa `CnScheduleField` o `CnWeekdaysField`; para actividad por día usa `CnCalendarHeatmap`.",
    neighbors:
      "`CnDateField` abre `CnCalendar` en su menú, por lo que ambos comparten reglas de deshabilitado (`isDateDisabled`). `CnEventCalendar` cubre agendas completas con eventos.",
    related: ["CnCalendarSkeleton"],
  },
  {
    name: "CnMetricCard",
    category: "datos",
    domains: ["dashboards", "erp", "crm", "ecommerce", "pos", "pagos", "rrhh"],
    status: "estable",
    summary:
      "Tarjeta de indicador: valor destacado con tendencia, mini gráfica, avance a meta o dato con etiqueta.",
    purpose:
      'Mostrar un dato que se lee de un vistazo. `layout="stacked"` (por defecto) es el KPI con valor grande, formato (moneda, porcentaje), variación con color según mejora o empeora, mini gráfica de línea, área o barras y barra de avance hacia una meta. `layout="inline"` es el dato "etiqueta + valor" con ícono al lado, `badge`, `href` y variantes `soft`/`left-accent`, útil en fichas y encabezados de detalle.',
    whenNot:
      "Para avisos o mensajes con estado (info, advertencia, error) usa `CnAlert`; para bloques de contenido con encabezado usa `CnSectionCard`; para tarjetas con imagen o contenido libre usa `CnCard`; para ver la serie completa con ejes y detalle usa `CnLineChart` o `CnBarChart`; para un valor contra rangos (bajo/medio/alto) usa `CnGauge`.",
    neighbors:
      "Comparte la paleta semántica con `CnAlert` y `CnChip` (útil como `badge`). Su mini gráfica es una versión ligera independiente de `CnSparkline` de las gráficas, que agrega tooltip, extremos y promedio. Suele ir en filas sobre `CnChartCard` o `CnDataTable` en tableros.",
    related: ["CnMetricCardSkeleton"],
  },

  // ---------------------------------------------------------------- Gráficas
  {
    name: "CnBarChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "crm", "ecommerce", "pos", "pagos", "rrhh"],
    status: "estable",
    summary: "Barras verticales u horizontales, agrupadas, apiladas o al 100 %.",
    purpose:
      "Comparar magnitudes entre categorías (ventas por sucursal, tickets por agente, gasto por área) o composición entre periodos con barras apiladas o al 100 %. Incluye etiquetas de valor, gradiente, líneas y áreas de referencia (metas, umbrales), zoom, selector de tipo para cambiar a línea o área, eje derecho y clic por barra para profundizar.",
    whenNot: `Si el eje X es tiempo continuo con muchos puntos usa \`CnLineChart\`; para mezclar barras con líneas en doble eje usa \`CnComposedChart\`. ${chartGuide("comparacion")}`,
    neighbors: `Comparte motor (\`CnCartesianChart\`) con \`CnLineChart\`, \`CnAreaChart\`, \`CnComposedChart\` y \`CnHistogram\`. ${CHART_NEIGHBORS}`,
    related: ["CnCartesianChart", "CnBarChartSkeleton"],
  },
  {
    name: "CnLineChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "crm", "ecommerce", "pagos"],
    status: "estable",
    summary: "Líneas con curvas, marcadores, metas, media móvil y zoom.",
    purpose:
      "Mostrar la evolución de una o varias series en el tiempo (ingresos diarios, usuarios activos, tiempos de respuesta). Soporta curvas suaves, rectas o escalonadas, marcadores, unión de huecos, líneas y franjas de referencia, eje derecho, zoom por rango y tooltip por eje para comparar series en el mismo punto.",
    whenNot: `Para pocas categorías sin orden temporal usa \`CnBarChart\`; si importa el volumen acumulado o la suma de series usa \`CnAreaChart\`; para una tendencia mínima dentro de una tabla o tarjeta usa \`CnSparkline\`; para ciclos (horas del día, meses del año) usa \`CnRadialLineChart\`. ${chartGuide("tendencia")}`,
    neighbors: `Es el preset de línea de \`CnCartesianChart\`; \`CnComposedChart\` la combina con barras. ${CHART_NEIGHBORS}`,
    related: ["CnLineChartSkeleton"],
  },
  {
    name: "CnAreaChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "ecommerce", "pagos"],
    status: "estable",
    summary: "Áreas con gradiente, apiladas o al 100 %.",
    purpose:
      "Mostrar la evolución de un volumen y, apiladas, cómo contribuye cada serie al total en el tiempo (ingresos por canal, tráfico por fuente). La variante al 100 % muestra el cambio de participación.",
    whenNot: `Con muchas series que se cruzan usa \`CnLineChart\` (las áreas apiladas se tapan); para la composición de un solo momento usa \`CnDonutChart\`. ${chartGuide("tendencia")}`,
    neighbors: `Es el preset de área de \`CnCartesianChart\`; su skeleton es una línea con relleno. ${CHART_NEIGHBORS}`,
    related: ["CnAreaChartSkeleton"],
  },
  {
    name: "CnComposedChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "ecommerce", "pagos"],
    status: "estable",
    summary: "Gráfica combinada: cada serie elige barra, línea o área y eje izquierdo o derecho.",
    purpose:
      "Relacionar dos magnitudes de distinta escala en el mismo eje de tiempo: ventas (barras) contra margen % (línea), pedidos contra tiempo de entrega, presupuesto contra ejercido.",
    whenNot: `Si todas las series tienen la misma unidad usa \`CnBarChart\` o \`CnLineChart\` (el doble eje confunde cuando no hace falta); para relacionar dos variables sin tiempo usa \`CnScatterChart\`. ${chartGuide()}`,
    neighbors: `Usa el mismo motor y props que \`CnBarChart\` y \`CnLineChart\`, con \`type\` y \`axis\` por serie. ${CHART_NEIGHBORS}`,
    related: ["CnComposedChartSkeleton"],
  },
  {
    name: "CnHistogram",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "rrhh", "ecommerce"],
    status: "estable",
    summary: "Histograma: agrupa valores crudos en intervalos y cuenta cuántos caen en cada uno.",
    purpose:
      "Ver cómo se distribuyen valores individuales (montos de ticket, tiempos de atención, edades, calificaciones): dónde se concentran, si hay colas o valores atípicos. Recibe la lista cruda y calcula los intervalos (`bins`) con su formato; admite líneas de referencia (promedio, meta).",
    whenNot: `Si los datos ya vienen agregados por categoría usa \`CnBarChart\`; para distribución cruzada de dos variables usa \`CnHeatmap\` o \`CnScatterChart\`. ${chartGuide("distribucion")}`,
    neighbors: `Se construye sobre \`CnCartesianChart\` (barras) y las utilidades de intervalos de la paleta de gráficas. ${CHART_NEIGHBORS}`,
    related: ["CnHistogramSkeleton"],
  },
  {
    name: "CnPieChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "crm", "ecommerce", "pagos"],
    status: "estable",
    summary: "Pastel, dona, media dona y anillos anidados con total central.",
    purpose:
      'Mostrar cómo se reparte un total entre pocas partes (gasto por categoría, solicitudes por estado). Agrupa el resto en "Otros" con `maxSlices`, ordena, muestra porcentajes en etiquetas, tooltip y leyenda, admite media dona para avance de presupuesto y anillos anidados para dos niveles (región → canal). `CnDonutChart` es la variante con total al centro.',
    whenNot: `Con más de 6 partes o valores parecidos usa \`CnBarChart\` (se compara mejor por longitud); para partes anidadas en más de dos niveles usa \`CnTreemap\`; para un solo valor contra su meta usa \`CnGauge\` o \`CnRadialBarChart\`. ${chartGuide("composicion")}`,
    neighbors: `\`CnDonutChart\` es el mismo componente con \`variant="donut"\`. ${CHART_NEIGHBORS}`,
    related: ["CnDonutChart", "CnPieChartSkeleton", "CnDonutChartSkeleton"],
  },
  {
    name: "CnScatterChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "crm", "ecommerce", "rrhh"],
    status: "estable",
    summary: "Dispersión y burbujas con línea de tendencia y cuadrantes.",
    purpose:
      "Revelar la relación entre dos variables numéricas (precio vs. ventas, antigüedad vs. desempeño) y sus valores atípicos. Agrega regresión lineal, cuadrantes (por defecto en los promedios) con etiquetas para matrices de priorización, forma por serie y, con `CnBubbleChart`, una tercera variable en el tamaño del punto.",
    whenNot: `Si una de las variables es el tiempo usa \`CnLineChart\`; si solo hay una variable usa \`CnHistogram\`; para comparar perfiles en muchas métricas usa \`CnRadarChart\`. ${chartGuide("relacion")}`,
    neighbors: `\`CnBubbleChart\` es la misma gráfica con tamaño por punto. ${CHART_NEIGHBORS}`,
    related: ["CnBubbleChart", "CnScatterChartSkeleton"],
  },
  {
    name: "CnGauge",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "pos", "pagos"],
    status: "estable",
    summary: "Indicador radial de un valor con segmentos de color, aguja, meta y valor central.",
    purpose:
      "Ubicar un único valor dentro de un rango con significado (nivel de servicio, ocupación, cumplimiento, salud de un sistema): semicírculo, arco o círculo, segmentos bajo/medio/alto, color según el segmento, marca de objetivo y mínimo/máximo.",
    whenNot: `Para un KPI con variación y mini tendencia usa \`CnMetricCard\`; para varias metas a la vez usa \`CnRadialBarChart\`; para ver cómo cambió el valor usa \`CnLineChart\`. ${chartGuide("kpi")}`,
    neighbors: `Suele acompañar a \`CnMetricCard\` en tableros. ${CHART_NEIGHBORS}`,
    related: ["CnGaugeSkeleton"],
  },
  {
    name: "CnRadarChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "rrhh", "crm", "ecommerce"],
    status: "estable",
    summary: "Radar (araña) para comparar perfiles de una o varias series en varias métricas.",
    purpose:
      "Comparar perfiles multidimensionales: competencias de un colaborador contra el puesto, atributos de productos, evaluación de proveedores. Admite máximos por métrica, rejilla poligonal o circular y resaltado por métrica o por serie.",
    whenNot: `Con más de tres series o más de diez métricas usa \`CnBarChart\` agrupada (el radar se satura); para datos cíclicos en el tiempo usa \`CnRadialLineChart\`. ${chartGuide("comparacion")}`,
    neighbors: `\`CnRadialLineChart\` comparte las coordenadas polares pero su eje es temporal. ${CHART_NEIGHBORS}`,
    related: ["CnRadarChartSkeleton"],
  },
  {
    name: "CnSparkline",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "crm", "ecommerce", "pagos"],
    status: "estable",
    summary: "Mini gráfica de tendencia (línea, área o barras) para tarjetas, tablas y KPIs.",
    purpose:
      "Dar contexto de tendencia en poco espacio: junto a un valor, en una celda o en una lista. Colorea en verde o rojo según la tendencia (invertible para costos), marca mínimo y máximo, línea de promedio, valor final con variación y tooltip con etiquetas.",
    whenNot: `Si el usuario necesita ejes, valores exactos o varias series usa \`CnLineChart\`; para un KPI completo con título y variación usa \`CnMetricCard\`. ${chartGuide("tendencia")}`,
    neighbors:
      "`CnMetricCard` y el tipo de celda `sparkline` de `CnDataTable` usan una mini gráfica propia más ligera (sin tooltip ni extremos); esta versión es la completa de la entrada de gráficas. No usa `CnChartCard`.",
    related: ["CnSparklineSkeleton"],
  },
  {
    name: "CnHeatmap",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "crm", "reservas", "rrhh"],
    status: "estable",
    summary: "Mapa de calor de categorías (x × y) o calendario de actividad por día.",
    purpose:
      "Detectar patrones en dos dimensiones: ocupación por día y hora, ventas por sucursal y mes, incidencias por módulo y severidad. Escalas secuenciales o divergentes (variaciones ±), valor en celda, barra de escala y clic por celda. `CnCalendarHeatmap` muestra actividad diaria en un año (asistencia, contribuciones, ventas por día).",
    whenNot: `Para pocas categorías en una sola dimensión usa \`CnBarChart\`; para eventos con hora, duración y detalle usa \`CnEventCalendar\`; para ver la tendencia de una serie usa \`CnLineChart\`. ${chartGuide("distribucion")}`,
    neighbors: `\`CnCalendarHeatmap\` es la variante \`calendar\`. \`CnEventCalendar\` también ofrece un mapa de calor mensual sobre sus eventos. ${CHART_NEIGHBORS}`,
    related: ["CnCalendarHeatmap", "CnHeatmapSkeleton"],
  },
  {
    name: "CnFunnelChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["crm", "ecommerce", "dashboards", "rrhh", "landing"],
    status: "estable",
    summary: "Embudo de conversión por pasos con tasas, en trapecios, pirámide o barras centradas.",
    purpose:
      "Medir cuántos avanzan en un proceso secuencial y dónde se pierden: visitas → carrito → pago, prospecto → cierre, postulantes → contratados. Muestra conversión respecto al paso anterior, al primero o ambas, orientación vertical u horizontal y clic por paso. `CnPyramidChart` dibuja la variante con vértice arriba (niveles, segmentos).",
    whenNot: `Si los flujos se dividen o se juntan entre etapas usa \`CnSankeyChart\`; si los pasos no son secuenciales usa \`CnBarChart\`; para mostrar en qué etapa está un registro concreto usa el tipo de celda \`stage\` de \`CnDataTable\`. ${chartGuide("flujo")}`,
    neighbors: `\`CnPyramidChart\` es el mismo componente con \`variant="pyramid"\`. ${CHART_NEIGHBORS}`,
    related: ["CnPyramidChart", "CnFunnelChartSkeleton"],
  },
  {
    name: "CnSankeyChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "pagos", "ecommerce"],
    status: "estable",
    summary: "Diagrama de Sankey: flujos proporcionales entre etapas o categorías.",
    purpose:
      "Mostrar de dónde viene y a dónde va una cantidad: presupuesto por fuente y destino, tráfico por canal hasta conversión, inventario entre almacenes. Colorea el flujo por origen, destino o degradado, muestra valores por nodo y permite clic en nodos y enlaces.",
    whenNot: `Para un proceso lineal sin ramas usa \`CnFunnelChart\`; para composición sin flujo usa \`CnTreemap\` o \`CnDonutChart\`. ${chartGuide("flujo")}`,
    neighbors: `Complementa a \`CnFunnelChart\` (lineal) y a \`CnTreemap\` (estático). ${CHART_NEIGHBORS}`,
    related: ["CnSankeyChartSkeleton"],
  },
  {
    name: "CnCandlestickChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["pagos", "dashboards", "ecommerce"],
    status: "estable",
    summary: "Velas (apertura, máximo, mínimo, cierre) con volumen y medias móviles.",
    purpose:
      "Analizar la variación de un precio por periodo: tipo de cambio, precio de insumos, cotizaciones. Panel de volumen, medias móviles sobre el cierre, tonos de subida/bajada y velas huecas.",
    whenNot: `Si solo importa el valor de cierre usa \`CnLineChart\`; para una tendencia compacta usa \`CnSparkline\`. ${chartGuide("tendencia")}`,
    neighbors: `Comparte ejes y estilo con \`CnLineChart\`. ${CHART_NEIGHBORS}`,
    related: ["CnCandlestickChartSkeleton"],
  },
  {
    name: "CnRadialBarChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "rrhh", "crm", "erp"],
    status: "estable",
    summary: "Anillos concéntricos de avance hacia metas (círculo o media luna).",
    purpose:
      "Mostrar el avance de varias metas en un espacio compacto: cuotas por vendedor, cumplimiento por objetivo, capacidad usada por recurso. Pista de fondo, valor como porcentaje del máximo y texto central (promedio de avance o contenido propio).",
    whenNot: `Para comparar con precisión muchas metas usa \`CnBarChart\` horizontal; para una sola meta con rangos usa \`CnGauge\`; para un KPI con variación usa \`CnMetricCard\`. ${chartGuide("kpi")}`,
    neighbors: `Hermano de \`CnGauge\` (un valor) y \`CnDonutChart\` (partes de un todo). ${CHART_NEIGHBORS}`,
    related: ["CnRadialBarChartSkeleton"],
  },
  {
    name: "CnRadialLineChart",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "reservas", "ecommerce"],
    status: "estable",
    summary: "Líneas o áreas en coordenadas polares para datos cíclicos (horas, días, meses).",
    purpose:
      "Hacer visible la estacionalidad: demanda por hora del día, ventas por mes del año, visitas por día de la semana, comparando ciclos (este año vs. anterior). Curva suave o recta, marcadores y hueco central.",
    whenNot: `Si el ciclo no es lo importante usa \`CnLineChart\` (se leen mejor los valores); para varias métricas sin orden cíclico usa \`CnRadarChart\`; para ocupación por día y hora usa \`CnHeatmap\`. ${chartGuide("tendencia")}`,
    neighbors: `Comparte coordenadas polares con \`CnRadarChart\` y \`CnRadialBarChart\`. ${CHART_NEIGHBORS}`,
    related: ["CnRadialLineChartSkeleton"],
  },
  {
    name: "CnTreemap",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "ecommerce", "cms"],
    status: "estable",
    summary: "Treemap jerárquico con rectángulos proporcionales y navegación por niveles.",
    purpose:
      "Mostrar el peso de muchas partes anidadas: gasto por área → cuenta, ventas por categoría → producto, almacenamiento por carpeta. Navegación por niveles al hacer clic (`drillDown`) con ruta, porcentaje del total y clic por elemento.",
    whenNot: `Con pocas partes de un solo nivel usa \`CnDonutChart\`; para ordenar y leer valores exactos usa \`CnBarChart\`; para flujos entre niveles usa \`CnSankeyChart\`; para navegar una jerarquía como datos usa \`CnList\` en modo árbol. ${chartGuide("jerarquia")}`,
    neighbors: `Complementa a \`CnPieChart\` (un nivel) y \`CnSankeyChart\` (flujos). ${CHART_NEIGHBORS}`,
    related: ["CnTreemapSkeleton"],
  },
  {
    name: "CnChartCard",
    folder: "CnCharts",
    category: "graficas",
    domains: ["dashboards", "erp", "crm", "ecommerce", "pagos"],
    status: "estable",
    summary:
      "Tarjeta contenedora de gráficas: encabezado, resumen, periodo, tipo, exportación, pantalla completa y estados.",
    purpose:
      "Dar a cualquier gráfica (o contenido propio) el marco estándar de un tablero: título, subtítulo e ícono, resumen numérico, selector de periodo y rango personalizado, cambio de tipo de gráfica, refrescar, compartir, exportar a PNG, SVG, CSV, XLSX o JSON, pantalla completa y estados de carga, vacío y error con reintento. Las gráficas de Canek la usan automáticamente cuando reciben `title`.",
    whenNot:
      "Para un indicador numérico sin gráfica usa `CnMetricCard`; para una sección de formulario o detalle usa `CnSectionCard`; para una tarjeta genérica usa `CnCard`; si la gráfica ya tiene `title`, no la envuelvas otra vez (pasa las opciones con la prop `card`).",
    neighbors:
      "Todas las gráficas (`CnBarChart`, `CnLineChart`, `CnPieChart`, `CnTreemap`…) la usan como marco; exporta con las mismas utilidades que `CnDataTable`. Cada gráfica tiene un skeleton de su misma forma (`CnChartSkeleton` elige por tipo).",
    related: ["CnChartSkeleton", "CnChartSkeletonFrame", "CnChartLegend", "CnChartTooltipCard"],
  },
  {
    name: "CnDescriptionList",
    category: "datos",
    domains: ["general", "erp", "crm", "rrhh"],
    status: "beta",
    summary:
      "Lista de pares etiqueta–valor de solo lectura, en columnas responsivas, con copiar y enlaces.",
    purpose:
      'Mostrar el detalle de un registro (contacto, empresa, empleado, pedido) como pares etiqueta–valor sin armar la cuadrícula a mano. Usa una lista de descripción semántica (`dl`/`dt`/`dd`), baja de columnas sola cuando el contenedor se angosta, permite que un dato ocupe dos columnas o toda la fila, muestra un texto de vacío ("—" o "Sin capturar") para valores faltantes, convierte valores en enlaces (correo, teléfono, sitio) y agrega un botón para copiar con aviso de copiado. Tiene disposición apilada (etiqueta arriba) o en línea (etiqueta a la izquierda, con separadores) y variante en tarjeta con título y acción.',
    whenNot:
      "Para editar los datos usa `CnForm` (o el campo correspondiente, como `CnTextField`); para un solo indicador grande con tendencia usa `CnMetricCard`; para muchos registros con columnas, orden y filtros usa `CnDataTable`; para pares que el usuario agrega y quita usa `CnKeyValueField`.",
    neighbors:
      "Es la pieza de datos de `CnRecordHeader` y suele vivir dentro de `CnSectionCard` o `CnCard`. Los valores pueden ser `CnChip` o `CnAvatar`. Comparte los tokens de texto atenuado con `CnProfileCard`.",
    related: ["CnDescriptionListSkeleton"],
  },
  {
    name: "CnContactTimeline",
    category: "datos",
    domains: ["crm"],
    status: "beta",
    summary:
      "Historial multicanal de un contacto con filtros por canal, actividades fijadas y compositor en línea.",
    purpose:
      "Ver en un solo lugar todo lo que ha pasado con un contacto o empresa: notas, llamadas, correos, reuniones, tareas, mensajes, cambios de oportunidad y eventos del sistema. Cada canal tiene ícono y tono propios y aparece como chip de filtro solo si hay actividades de ese canal. Las actividades fijadas (acuerdos, datos que todo el equipo debe ver) suben a un bloque aparte y no se repiten abajo. Con `onCreate` muestra el compositor para registrar una actividad nueva sin salir de la ficha; con `onPinChange` agrega la acción Fijar o Quitar de fijadas. Hereda del historial la agrupación por día, búsqueda, paginado, estado vacío y error con reintentar.",
    whenNot:
      "Para una bitácora de auditoría o el seguimiento de un pedido sin canales de contacto usa `CnTimeline`; para avisos con leído/no leído usa `CnNotificationCenter`; para reuniones sobre un calendario usa `CnEventCalendar`; para listar contactos usa `CnDataTable`.",
    neighbors:
      "Compone `CnTimeline` (historial) y `CnActivityComposer` (captura). Suele ir bajo `CnRecordHeader` en la pestaña Actividad de la ficha, junto a `CnDescriptionList` con los datos del contacto.",
    related: ["CnContactTimelineSkeleton"],
  },
  {
    name: "CnKanbanBoard",
    category: "datos",
    domains: ["crm", "erp", "general"],
    status: "beta",
    summary:
      "Tablero por columnas: arrastrar entre etapas con mouse o teclado, límites WIP y totales por columna.",
    purpose:
      "Mover elementos entre etapas de un proceso (embudo de ventas, tickets, órdenes de trabajo, candidatos) viendo de un vistazo cuántos hay y cuánto suman. Cada columna es una región con su lista, contador, límite WIP que se marca al superarse y total de `value` con formato de moneda propio. Se arrastra con el mouse (indicador de dónde caerá) o con teclado: Espacio toma la tarjeta, flechas la mueven entre columnas y posiciones, Espacio la suelta y Escape cancela, con anuncios para lector de pantalla. `canDrop` bloquea destinos (etapas cerradas, permisos) y atenúa las columnas que no aceptan la tarjeta. El contenido de cada tarjeta lo pinta `renderCard`; `moveKanbanItem` aplica el movimiento a un arreglo plano.",
    whenNot:
      "Para reordenar una sola lista usa `CnList`; para registros con muchas columnas de datos usa `CnDataTable`; para pasos lineales de un proceso que el usuario recorre usa `CnTabs` o el modo por pasos de `CnForm`; para eventos con fecha usa `CnEventCalendar`.",
    neighbors:
      "Sus tarjetas suelen ser `CnDealCard` o `CnCard`. Encima lleva `CnFilterBar` para filtrar el tablero. El botón de agregar es `CnButton`; los tonos de columna salen de `CN_TONES`, como en `CnSectionCard`.",
    related: ["CnKanbanBoardSkeleton"],
  },
  {
    name: "CnFilterBar",
    category: "datos",
    domains: ["general", "erp", "crm", "ecommerce", "dashboards"],
    status: "beta",
    summary:
      "Barra de filtros con búsqueda, filtros rápidos, panel de filtros con chips activos y vistas guardadas.",
    purpose:
      'Filtrar listas de tarjetas, tableros y reportes con el mismo patrón en toda la aplicación. Reúne búsqueda, chips de filtro rápido de un clic (interruptores con conteo), un panel "Filtros" anclado con campos de selección, selección múltiple o texto que se aplican juntos con "Aplicar", chips de los filtros activos que se quitan con un clic, "Limpiar todo", el total de resultados anunciado y un menú de vistas guardadas con "Guardar vista actual". Todo es controlado: el componente no filtra datos, solo entrega los valores.',
    whenNot:
      "Para filtrar dentro de una tabla por columna usa los filtros de `CnDataTable`; para un formulario de búsqueda avanzada con validación usa `CnForm`; para solo buscar con sugerencias usa `CnSearchField`; para cambiar entre secciones de una página usa `CnTabs`.",
    neighbors:
      "Va encima de `CnKanbanBoard`, de listas de `CnDealCard` y de `CnList`. Usa `CnSearchField`, `CnSelectField`, `CnTextField`, `CnChip` y `CnButton`; su panel es un popover ligero, a diferencia de `CnDrawer` o `CnDialog`.",
    related: ["CnFilterBarSkeleton"],
  },
];
