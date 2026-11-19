# Changelog

Todos los cambios relevantes de `@canek-ui/material-design-system`. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/). Mientras la versión sea `0.x`, un `minor` puede
incluir cambios incompatibles; se marcan como **Cambios de comportamiento**.

## [0.13.0] - 2026-11-19

### Agregado

- **Formularios**: sistema completo `CnForm` (paridad con TbForm y más): secciones, pestañas, pasos,
  campos dinámicos y calculados, opciones remotas en cascada, validaciones mexicanas (RFC, CURP, NSS…),
  API imperativa y errores del servidor.
- **Campos nuevos**: teléfono, país, moneda, rating, slider, OTP, máscara, contraseña con fortaleza,
  color, etiquetas, segmentado, tarjetas de opción, árbol, lista doble, clave–valor, firma, texto
  enriquecido (entrada `/rich-text`), archivos (dropzone, cuadrícula, masonry), rango de fechas y de
  números; y además dirección MX con código postal, lista repetible, duración, búsqueda con
  sugerencias, código/JSON, horario semanal, ubicación, días de la semana y rango de horas.
- **Retroalimentación y layout**: `CnConfirmDialog`/`useConfirm`, `CnToastProvider`/`useToast`,
  `CnPageContainer`, `CnMetricCard`.
- **Tabla de datos** `CnDataTable` (motor TanStack): orden múltiple, filtros, agrupación, columnas
  fijas/redimensionables/reordenables, selección, acciones, detalle expandible, modo servidor,
  exportación XLSX/CSV/TSV/JSON/HTML/PDF, copiar, imprimir, pantalla completa y tarjetas en móvil;
  53 tipos de celda con tarjetas de detalle (fechas, montos, RFC/CURP, mapas…) y visor de imágenes.
- **Gráficas** (entrada `/charts`, MUI X Community): barras, líneas, áreas, combinadas, histograma,
  pastel/dona, dispersión/burbujas, gauge, radar, sparkline; y propias sin licencia: heatmap,
  calendario de actividad, embudo/pirámide, sankey, velas, barras y líneas radiales, treemap.
  `CnChartCard` con periodo, tipo, resumen, PNG/SVG/CSV/XLSX/JSON y pantalla completa.
- **Skeletons** para todos los componentes (prop `skeleton` y `<Nombre>Skeleton`), kit
  `CnSkeletonGroup`/`CnFieldSkeleton` y tokens `--cn-skeleton-*` que siguen el tema.
- **Calendario de eventos** `CnEventCalendar`: mes, semana, día, agenda, trimestre, año, varios meses
  y recursos; recurrencia, arrastrar/redimensionar, fuentes múltiples, zonas horarias, creación
  rápida en lenguaje natural, conflictos, importar/exportar `.ics`, enlaces a Google/Outlook/Yahoo y
  videollamadas.
- **Listas** `CnList`/`CnListItem`: selección, grupos fijos, árbol, búsqueda, reordenar, deslizar,
  carga incremental y virtualización.
- **Mapas** `CnMap`/`CnMapsProvider`: Google Maps con el JSON del Styling Wizard, `mapId` o presets;
  sin API key usa el mapa embebido.
- **Listas grandes**: virtualización automática y carga paginada (`loadOptions` con páginas,
  `resolveOptions`, caché) en select, autocomplete, país, árbol, lista doble y búsqueda.
- Historias de Storybook para cada componente, cada tipo de celda y cada estado de carga.

### Corregido

- La descarga PNG de gráficas fallaba en silencio con textos centrales (`foreignObject`).
- La pantalla completa de la tabla quedaba encerrada por ancestros con `transform`.
- `CnSkeleton` usaba el modo oscuro del sistema operativo en lugar del tema de Canek.
- `CnButton` ignoraba `aria-label` en botones con texto; `CnChip` multiplicaba el padding de la
  etiqueta por el spacing del tema.

### Cambios de comportamiento

- `type: "search"` en `CnForm` usa ahora `CnSearchField` (con sugerencias).
- `CnMetricCard` y `CnPageContainer` muestran su skeleton completo con `loading`.
- Nuevas dependencias peer opcionales: `@mui/x-charts` (solo para `/charts`) y `@tiptap/*` (solo
  para `/rich-text`). `@tanstack/react-table` es dependencia directa.

## [0.12.0] - 2026-10-31

Última versión publicada antes de este changelog. Ver el historial de git hasta `v0.12.0`.

[0.13.0]: https://github.com/CanekDevs/canek-ui-material-design-system/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/CanekDevs/canek-ui-material-design-system/releases/tag/v0.12.0
