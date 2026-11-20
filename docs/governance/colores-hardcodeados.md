# Colores hardcodeados en componentes

Archivo generado por `npm run docs:catalog` (`src/__governance__/colors.test.ts`). No editar a mano.

Los componentes deben usar tokens (`var(--cn-color-*)`, `theme.palette.*`, `CN_TONES`). Un hex
como respaldo de un token (`var(--cn-color-border, #dde0e4)`) no cuenta. La línea base solo puede
bajar: al corregir un archivo, regenera este reporte.

Total pendiente: **108** en **34** archivos.

| Archivo                                                   | Hex sin token |
| --------------------------------------------------------- | ------------- |
| `src/components/CnDataTable/cells.tsx`                    | 23            |
| `src/components/CnEventCalendar/calendar-utils.ts`        | 11            |
| `src/components/CnContentCarousel/CnContentCarousel.tsx`  | 6             |
| `src/components/CnEventCalendar/views/MonthView.tsx`      | 6             |
| `src/components/CnMetricCard/CnMetricCard.tsx`            | 6             |
| `src/components/CnProfileCard/CnProfileCard.tsx`          | 6             |
| `src/components/CnMap/CnMap.tsx`                          | 5             |
| `src/components/CnMaskedField/CnMaskedField.tsx`          | 5             |
| `src/components/CnEventCalendar/CalendarSidebar.tsx`      | 3             |
| `src/components/CnEventCalendar/views/TimeGridView.tsx`   | 3             |
| `src/components/CnFileField/CnFileField.tsx`              | 3             |
| `src/components/CnFileField/FileLightbox.tsx`             | 3             |
| `src/components/CnCharts/CnGauge.tsx`                     | 2             |
| `src/components/CnCharts/CnSparkline.tsx`                 | 2             |
| `src/components/CnEventCalendar/views/AgendaView.tsx`     | 2             |
| `src/components/CnEventCalendar/views/MultiMonthView.tsx` | 2             |
| `src/components/CnEventCalendar/views/YearView.tsx`       | 2             |
| `src/components/CnRichTextField/CnRichTextField.tsx`      | 2             |
| `src/components/CnCharts/chart-common.tsx`                | 1             |
| `src/components/CnCharts/CnCandlestickChart.tsx`          | 1             |
| `src/components/CnCharts/CnCartesianChart.tsx`            | 1             |
| `src/components/CnCharts/CnFunnelChart.tsx`               | 1             |
| `src/components/CnCharts/CnHeatmap.tsx`                   | 1             |
| `src/components/CnCharts/CnRadialCharts.tsx`              | 1             |
| `src/components/CnCharts/CnTreemap.tsx`                   | 1             |
| `src/components/CnDataTable/CnDataTable.types.ts`         | 1             |
| `src/components/CnDocCard/CnDocCard.tsx`                  | 1             |
| `src/components/CnDocCard/FileThumb.tsx`                  | 1             |
| `src/components/CnEventCalendar/CnEventCalendar.tsx`      | 1             |
| `src/components/CnEventCalendar/CnEventCalendar.types.ts` | 1             |
| `src/components/CnEventCalendar/event-badges.tsx`         | 1             |
| `src/components/CnEventCalendar/EventPopover.tsx`         | 1             |
| `src/components/CnSignatureField/CnSignatureField.tsx`    | 1             |
| `src/components/CnWeekdaysField/CnWeekdaysField.tsx`      | 1             |

## Permitidos por naturaleza

| Archivo                                        | Motivo                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/components/CnMap/map-styles.ts`           | Estilos de mapa de Google: el proveedor exige colores literales.                         |
| `src/components/CnFlagIcon/CnFlagIcon.tsx`     | Arte de banderas: colores oficiales de cada país.                                        |
| `src/components/CnColorField/CnColorField.tsx` | Paleta sugerida del selector: son valores del usuario.                                   |
| `src/components/CnCharts/chart-theme.ts`       | Paleta de gráficas con respaldo para exportar PNG/SVG fuera del DOM (sin CSS variables). |
| `src/components/CnCharts/chart-export.ts`      | Exportación a imagen: el canvas no resuelve CSS variables.                               |
| `src/components/CnDataTable/export.ts`         | Exportación XLSX/HTML/PDF: los archivos no leen CSS variables.                           |
