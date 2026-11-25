# Changelog

Todos los cambios relevantes de `@canek-ui/material-design-system`. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/). Mientras la versión sea `0.x`, un `minor` puede
incluir cambios incompatibles; se marcan como **Cambios de comportamiento**.

## [Sin publicar]

### Corregido

- Modo oscuro de `CnAlert` y `CnTabs`: el texto, el ícono y la barra lateral de las alertas y el texto de las pestañas (incluida la de error) usan los roles `--cn-color-control-*`; el fondo de las pestañas `pill` ya no es claro en oscuro. `CnAvatar` toma el blanco sobre relleno de `--cn-color-tone-on-solid`. En claro se ven igual.
- Modo oscuro de `CnButton` y `CnChip`: el texto, borde e ícono de las variantes sin relleno (outlined, text, soft, light, ghost) usan los nuevos roles `--cn-color-control-<color>-fg`, que en oscuro pasan 4.5:1; el botón neutral relleno ya no pinta un fondo claro con texto claro. En claro se ven igual.
- Modo oscuro de los tonos (`CN_TONES`): nuevos roles `--cn-color-tone-*` en `tokens.css`. En claro dan los mismos colores; en oscuro el texto de cada tono pasa 4.5:1 y los íconos 3:1, el tono neutral ya no pinta fondos blancos y el texto sobre rellenos sólidos es blanco en los dos modos. Afecta a `CnSectionCard`, `CnProfileCard`, `CnTimeline`, `CnNotificationCenter`, `CnContentCarousel` y `CnDialog`.

### Agregado

- `CnDocCard`: tarjeta de documento con tipo por mime/extensión, miniatura, metadatos, estado,
  etiquetas, versión, acciones (ver, descargar, compartir, menú), selección, progreso de carga y error;
  vista previa de imágenes, video, audio y PDF.
- `CnProfileCard` y `CnProfileCardGroup`: personas con contacto (correo, teléfono, WhatsApp) y eventos
  (cumpleaños, aniversario, nuevo ingreso, ausencia, vacaciones) con cuenta regresiva; grupo con
  orden por fecha, filtro por mes y secciones Hoy/Próximos.
- `CnSectionCard`: contenedor de sección plegable con encabezado, pie, estados y modo repetible.
- `CnCarousel`: carrusel genérico con slides por vista por ancho del contenedor, autoplay accesible,
  flechas, puntos/progreso/miniaturas, arrastre y teclado.
- `CnContentCarousel`: banners (hero con imagen o video, CTA, overlay) y fila de tarjetas.
- Cada uno con su skeleton y prop `skeleton`.

- `CnDialog` (modal general con acciones asíncronas, guarda de cambios sin guardar, tamaños,
  `useDialog`), `CnDrawer` (panel lateral temporal, persistente o mini, redimensionable),
  `CnTimeline` (historial, bitácora y seguimiento) y `CnNotificationCenter` (campana con bandeja de
  notificaciones, pestañas, tiempo real y vista previa flotante).
- `CnAlert`: variante `left-accent`, `actions`, detalles plegables, `dismissible` y `role="note"`.
- `CnMetricCard`: `layout="inline"` (dato con etiqueta), `badge`, `href`, variantes `soft` y
  `left-accent`, `value` como nodo.
- `CnCarousel`: loop continuo sin salto, progreso sincronizado con el autoplay, deslizamiento por
  umbral y velocidad, `slideAspectRatio`, `onSlideView` y soporte RTL. `CnContentCarousel`: textos que
  escalan con el ancho, CTA apilados en pantallas chicas, `imageSrcSet` y placeholder difuminado.
- `CnFileField` y `CnDocCard` comparten el manejo de tipos de archivo (`src/utils/file-utils.ts`):
  el campo es la entrada y muestra sus archivos con `CnDocCard`; en `readOnly` se ve igual que una
  lista de `CnDocCard`.
- Tipos públicos que faltaban en la entrada principal: `CnAlertAction`, `CnRow`, `CnContact`,
  `CnEmptyContext`, `CnExportKind` y `CnExportRow`.
- Repositorio: `AGENTS.md` (guía para personas y agentes), `CONTRIBUTING.md`, plantillas de PR e
  issues, `npm run new:component` (andamiaje con la definición de terminado), `npm run docs:catalog`
  (catálogo en el README, `docs/catalog.json` y hoja de ruta `docs/ROADMAP.md`), `npm run verify:all`
  (también en CI) y pruebas de gobierno de estructura, exports, colores y docs generadas.

### Corregido

- `CnButton` con `iconOnly` ignoraba `sx` cuando era un arreglo.
- `CnChip` con ícono: el margen se multiplicaba por el spacing del tema.
- `CnImageViewer`: el nombre accesible ahora está en el elemento con `role="dialog"`.

### Cambiado

- Se quitó `CnInfoCard` (nunca se publicó): sus avisos pasan a `CnAlert` y su modo dato a
  `CnMetricCard`.
- `CnFileField` variante `card`: la descarga pasa al menú "⋮"; los nombres accesibles de las
  acciones incluyen el nombre del archivo.
- La carpeta local `.claude/` ya no se versiona.
- El workflow de release publica en npm solo si existe `NPM_TOKEN` y la versión es nueva.

## [0.13.0] - 2026-11-19

### Agregado

- **Formularios**: sistema completo `CnForm`: secciones, pestañas, pasos,
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

[Sin publicar]: https://github.com/CanekDevs/canek-ui-material-design-system/compare/v0.13.0...develop
[0.13.0]: https://github.com/CanekDevs/canek-ui-material-design-system/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/CanekDevs/canek-ui-material-design-system/releases/tag/v0.12.0
