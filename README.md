# @canek-ui/material-design-system

Design system de [Canek](https://canek.mx). Componentes React construidos sobre MUI 7, con tokens de diseño como CSS variables, theming unificado y API consistente.

[![npm version](https://img.shields.io/npm/v/@canek-ui/material-design-system.svg)](https://www.npmjs.com/package/@canek-ui/material-design-system)
[![CI](https://github.com/CanekDevs/canek-ui-design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/CanekDevs/canek-ui-design-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## Tabla de contenido

- [Instalación](#instalación)
- [Uso](#uso)
- [Catálogo de componentes](#catálogo-de-componentes)
- [Componentes](#componentes)
- [Formularios](#formularios)
- [Retroalimentación y layout](#retroalimentación-y-layout)
- [Tabla de datos](#tabla-de-datos)
- [Listas grandes (miles de opciones)](#listas-grandes-miles-de-opciones)
- [Listas](#listas)
- [Tarjetas de contenido y carruseles](#tarjetas-de-contenido-y-carruseles)
- [Diálogos, paneles, historial y notificaciones](#diálogos-paneles-historial-y-notificaciones)
- [Estructura de aplicación](#estructura-de-aplicación)
- [Mapas](#mapas)
- [Calendario de eventos](#calendario-de-eventos)
- [Gráficas](#gráficas)
- [Estados de carga](#estados-de-carga)
- [Temas](#temas)
- [Tokens de diseño](#tokens-de-diseño)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Desarrollo](#desarrollo)
- [Convenciones](#convenciones)
- [Flujo de trabajo](#flujo-de-trabajo)
- [Publicación](#publicación)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Instalación

```bash
npm install @canek-ui/material-design-system @mui/material @mui/icons-material @emotion/react @emotion/styled
```

React 18, MUI 7, `@mui/icons-material` y `@emotion/*` son **peer dependencies**. No se incluyen en el bundle del paquete, el consumidor debe instalarlas explícitamente.

Si usas pnpm:

```bash
pnpm add @canek-ui/material-design-system @mui/material @mui/icons-material @emotion/react @emotion/styled
```

Si usas yarn:

```bash
yarn add @canek-ui/material-design-system @mui/material @mui/icons-material @emotion/react @emotion/styled
```

---

## Uso

### Componente suelto

```tsx
import { CnButton } from "@canek-ui/material-design-system";
import "@canek-ui/material-design-system/styles.css";

export function SaveButton() {
  return (
    <CnButton variant="contained" color="primary">
      Guardar cambios
    </CnButton>
  );
}
```

### Aplicación completa con tema

```tsx
import { CanekThemeProvider, CnButton } from "@canek-ui/material-design-system";
import "@canek-ui/material-design-system/styles.css";

export function App() {
  return (
    <CanekThemeProvider mode="light">
      <CnButton variant="contained" color="primary">
        Guardar cambios
      </CnButton>
    </CanekThemeProvider>
  );
}
```

El import del CSS es **obligatorio**. Los tokens de diseño se exponen como CSS variables con prefijo `--cn-*` y los componentes los consumen. Sin ese import, los componentes usan fallbacks pero el theming no funciona.

---

## Catálogo de componentes

Índice generado desde `src/catalog` (la misma fuente que las descripciones de Storybook). Para
regenerarlo: `npm run docs:catalog`. Una prueba de gobierno falla si queda desactualizado.

<!-- catalog:start -->

<!-- Generado por `npm run docs:catalog` desde `src/catalog`. No editar a mano. -->

**90 componentes documentados.** Cada uno tiene en Storybook las secciones _Para qué sirve_, _Cuándo NO usarlo_ y _Relación con vecinos_. El catálogo completo en JSON está en [`docs/catalog.json`](./docs/catalog.json) y los 112 componentes planeados en [`docs/ROADMAP.md`](./docs/ROADMAP.md).

### Fundamentos (2)

| Componente   | Qué es                                                                        | Dominios                        | Estado  |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------- | ------- |
| `CnFlagIcon` | Bandera de país por código ISO, sola o con nombre y lada.                     | General, E-commerce, CRM, Pagos | estable |
| `CnIcon`     | Ícono por nombre desde un registro central, con tamaños y colores semánticos. | General                         | estable |

### Acciones (1)

| Componente | Qué es                                                                             | Dominios | Estado  |
| ---------- | ---------------------------------------------------------------------------------- | -------- | ------- |
| `CnButton` | Botón de acción con variantes, tamaños, íconos, estado de carga y modo solo ícono. | General  | estable |

### Formularios (39)

| Componente            | Qué es                                                                                                                     | Dominios                                                     | Estado  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------- |
| `CnAddressField`      | Domicilio postal completo en un solo campo: calle, números, código postal, colonia, municipio, estado y país.              | ERP, CRM, E-commerce, RR. HH., Pagos, Reservas               | beta    |
| `CnAutocompleteField` | Campo con búsqueda mientras se escribe para elegir una o varias opciones de listas largas o remotas.                       | General, ERP, CRM, E-commerce, Punto de venta, RR. HH.       | estable |
| `CnCalendar`          | Calendario incrustado para seleccionar una fecha o un rango, con vistas de día, mes y año.                                 | General, Reservas                                            | estable |
| `CnCheckboxField`     | Casilla única (booleano) o grupo de casillas (arreglo) con opción de seleccionar todo.                                     | General                                                      | estable |
| `CnChoiceCardsField`  | Selección única o múltiple presentada como tarjetas con ícono, descripción y dato destacado.                               | E-commerce, Reservas, Pagos, Landing, General                | estable |
| `CnCodeField`         | Editor de código monoespaciado con números de línea, sangría con Tab y validación/formateo de JSON.                        | General, CMS, IA, ERP                                        | beta    |
| `CnColorField`        | Selector de color hexadecimal con paleta sugerida y captura manual opcional.                                               | CMS, Landing, General, E-commerce                            | estable |
| `CnCountryField`      | Autocompletado de países con bandera, nombres localizados y países prioritarios al inicio.                                 | General, E-commerce, CRM, Pagos, RR. HH.                     | estable |
| `CnCurrencyField`     | Importe monetario con símbolo, separadores de miles, decimales de la moneda y selector de moneda opcional.                 | ERP, Punto de venta, Pagos, E-commerce, CRM                  | estable |
| `CnDateField`         | Fecha, hora, fecha y hora, mes o año con máscara de captura y calendario o reloj desplegable.                              | General, ERP, CRM, RR. HH., Reservas, Pagos                  | estable |
| `CnDateRangeField`    | Rango de fechas de inicio a fin con calendario de selección y atajos (últimos 7 días, este mes…).                          | Tableros, ERP, CRM, Reservas, Pagos, RR. HH.                 | estable |
| `CnDurationField`     | Cantidad de tiempo en días, horas, minutos o segundos, guardada como un número de minutos o segundos.                      | ERP, Reservas, RR. HH., General                              | beta    |
| `CnFileField`         | Campo para elegir archivos: arrastrar, seleccionar, pegar o usar la cámara, con validación, vista previa y reordenamiento. | General, ERP, CRM, CMS, E-commerce, RR. HH.                  | estable |
| `CnForm`              | Motor de formularios declarativo: describe los campos en un arreglo y obtén estado, validación, diseño y envío.            | General, ERP, CRM, CMS, E-commerce, RR. HH., Reservas, Pagos | estable |
| `CnKeyValueField`     | Lista editable de pares clave/valor de texto, como arreglo ordenado u objeto.                                              | E-commerce, CMS, ERP, General                                | estable |
| `CnLocationField`     | Coordenadas geográficas (latitud/longitud) con mapa de vista previa, pin arrastrable y "Usar mi ubicación".                | ERP, Reservas, E-commerce, CRM, Punto de venta               | beta    |
| `CnMaskedField`       | Campo de texto con máscara de captura y presets mexicanos y de pagos validados.                                            | General, Pagos, RR. HH., ERP, E-commerce                     | estable |
| `CnNumberField`       | Campo numérico con pasos, límites, decimales, separador de miles y controles configurables.                                | General, ERP, E-commerce, Punto de venta, Tableros           | estable |
| `CnNumberRangeField`  | Rango numérico “desde – hasta” con dos campos numéricos validados entre sí.                                                | E-commerce, ERP, CRM, Tableros, General                      | estable |
| `CnOtpField`          | Captura de códigos de verificación (OTP/2FA) con un recuadro por carácter.                                                 | General, Pagos, E-commerce                                   | estable |
| `CnPasswordField`     | Contraseña con requisitos visibles, medidor de fortaleza, mostrar/ocultar y generador seguro.                              | General, RR. HH., Pagos                                      | estable |
| `CnPhoneField`        | Teléfono con selector de país y bandera, formato por país y valor E.164 o nacional.                                        | General, CRM, E-commerce, Reservas, RR. HH.                  | estable |
| `CnRadioGroupField`   | Grupo de radios para elegir una sola opción visible, en fila, columna o como tarjetas.                                     | General, ERP, CRM, E-commerce, Pagos                         | estable |
| `CnRatingField`       | Calificación con estrellas (completas o medias) y texto descriptivo por valor.                                             | E-commerce, CRM, Reservas, RR. HH., General                  | estable |
| `CnRepeaterField`     | Lista editable para agregar, quitar y reordenar elementos de texto o de contenido propio.                                  | General, ERP, CMS, RR. HH., CRM                              | beta    |
| `CnRichTextField`     | Editor de texto enriquecido con barra configurable, enlaces seguros, imágenes y tablas.                                    | CMS, E-commerce, CRM, RR. HH., General                       | estable |
| `CnScheduleField`     | Disponibilidad semanal: días habilitados con uno o varios rangos de horas por día.                                         | Reservas, RR. HH., Punto de venta, E-commerce, General       | beta    |
| `CnSearchField`       | Búsqueda con sugerencias fijas o remotas, búsquedas recientes y navegación con teclado.                                    | General, E-commerce, CRM, ERP, CMS, Tableros                 | beta    |
| `CnSegmentedField`    | Botones segmentados para elegir entre pocas opciones visibles, simple o múltiple.                                          | General, Tableros, ERP, CRM, Punto de venta                  | estable |
| `CnSelectField`       | Lista desplegable de selección simple o múltiple, con grupos, chips, búsqueda y opciones remotas.                          | General, ERP, CRM, E-commerce, RR. HH., Punto de venta       | estable |
| `CnSignatureField`    | Firma autógrafa dibujada con mouse, dedo o lápiz, con alternativa escrita accesible.                                       | RR. HH., ERP, Reservas, Pagos, General                       | estable |
| `CnSliderField`       | Deslizador para elegir un valor o un rango dentro de una escala, con marcas y valor visible.                               | General, E-commerce, Tableros, ERP                           | estable |
| `CnSwitchField`       | Interruptor de encendido/apagado con etiqueta y descripción opcional.                                                      | General, ERP, Tableros, CRM                                  | estable |
| `CnTagsField`         | Lista libre de valores cortos como chips, validados uno por uno.                                                           | General, CRM, CMS, E-commerce, ERP                           | estable |
| `CnTextField`         | Campo de texto base: una línea o multilínea, tipos, adornos, contador, transformaciones y validación.                      | General                                                      | estable |
| `CnTimeRangeField`    | Rango de horas “de – a” con duración calculada y soporte de turnos nocturnos.                                              | Reservas, RR. HH., Punto de venta, General                   | beta    |
| `CnTransferListField` | Lista doble para asignar elementos moviéndolos entre “Disponibles” y “Seleccionados”.                                      | ERP, RR. HH., CRM, Tableros, General                         | estable |
| `CnTreeSelectField`   | Selector jerárquico con búsqueda, selección simple o múltiple en cascada y ruta visible.                                   | ERP, RR. HH., E-commerce, CMS, General                       | estable |
| `CnWeekdaysField`     | Selector de días de la semana con atajos (laborables, fin de semana, todos) y límites.                                     | Reservas, RR. HH., Punto de venta, General                   | beta    |

### Datos (7)

| Componente        | Qué es                                                                                                                | Dominios                                                                      | Estado  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------- |
| `CnAvatar`        | Foto, iniciales o ícono de una persona o entidad, con estado e insignia; incluye grupo apilado.                       | General, CRM, RR. HH., Reservas                                               | estable |
| `CnChip`          | Etiqueta compacta para estados, categorías, filtros y elementos removibles.                                           | General, CRM, E-commerce, ERP                                                 | estable |
| `CnDataTable`     | Tabla de datos con orden, filtros, búsqueda, selección, acciones, agrupación, exportación y más de 50 tipos de celda. | ERP, CRM, CMS, E-commerce, Punto de venta, Reservas, Pagos, RR. HH., Tableros | estable |
| `CnEventCalendar` | Calendario de eventos con vistas de mes, semana, día, agenda, trimestre, año, varios meses y recursos.                | Reservas, RR. HH., CRM, ERP, General                                          | estable |
| `CnList`          | Lista de elementos con avatar, ícono, estado, acciones, selección, búsqueda, grupos, árbol y virtualización.          | General, CRM, CMS, E-commerce, RR. HH., IA                                    | estable |
| `CnMetricCard`    | Tarjeta de indicador: valor destacado con tendencia, mini gráfica, avance a meta o dato con etiqueta.                 | Tableros, ERP, CRM, E-commerce, Punto de venta, Pagos, RR. HH.                | estable |
| `CnTimeline`      | Línea de tiempo para historiales de actividad, bitácoras de auditoría y seguimiento de procesos.                      | General, ERP, CRM, E-commerce, RR. HH., Pagos                                 | beta    |

### Gráficas (18)

| Componente           | Qué es                                                                                                         | Dominios                                                       | Estado  |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------- |
| `CnAreaChart`        | Áreas con gradiente, apiladas o al 100 %.                                                                      | Tableros, ERP, E-commerce, Pagos                               | estable |
| `CnBarChart`         | Barras verticales u horizontales, agrupadas, apiladas o al 100 %.                                              | Tableros, ERP, CRM, E-commerce, Punto de venta, Pagos, RR. HH. | estable |
| `CnCandlestickChart` | Velas (apertura, máximo, mínimo, cierre) con volumen y medias móviles.                                         | Pagos, Tableros, E-commerce                                    | estable |
| `CnChartCard`        | Tarjeta contenedora de gráficas: encabezado, resumen, periodo, tipo, exportación, pantalla completa y estados. | Tableros, ERP, CRM, E-commerce, Pagos                          | estable |
| `CnComposedChart`    | Gráfica combinada: cada serie elige barra, línea o área y eje izquierdo o derecho.                             | Tableros, ERP, E-commerce, Pagos                               | estable |
| `CnFunnelChart`      | Embudo de conversión por pasos con tasas, en trapecios, pirámide o barras centradas.                           | CRM, E-commerce, Tableros, RR. HH., Landing                    | estable |
| `CnGauge`            | Indicador radial de un valor con segmentos de color, aguja, meta y valor central.                              | Tableros, ERP, Punto de venta, Pagos                           | estable |
| `CnHeatmap`          | Mapa de calor de categorías (x × y) o calendario de actividad por día.                                         | Tableros, ERP, CRM, Reservas, RR. HH.                          | estable |
| `CnHistogram`        | Histograma: agrupa valores crudos en intervalos y cuenta cuántos caen en cada uno.                             | Tableros, ERP, RR. HH., E-commerce                             | estable |
| `CnLineChart`        | Líneas con curvas, marcadores, metas, media móvil y zoom.                                                      | Tableros, ERP, CRM, E-commerce, Pagos                          | estable |
| `CnPieChart`         | Pastel, dona, media dona y anillos anidados con total central.                                                 | Tableros, ERP, CRM, E-commerce, Pagos                          | estable |
| `CnRadarChart`       | Radar (araña) para comparar perfiles de una o varias series en varias métricas.                                | Tableros, RR. HH., CRM, E-commerce                             | estable |
| `CnRadialBarChart`   | Anillos concéntricos de avance hacia metas (círculo o media luna).                                             | Tableros, RR. HH., CRM, ERP                                    | estable |
| `CnRadialLineChart`  | Líneas o áreas en coordenadas polares para datos cíclicos (horas, días, meses).                                | Tableros, Reservas, E-commerce                                 | estable |
| `CnSankeyChart`      | Diagrama de Sankey: flujos proporcionales entre etapas o categorías.                                           | Tableros, ERP, Pagos, E-commerce                               | estable |
| `CnScatterChart`     | Dispersión y burbujas con línea de tendencia y cuadrantes.                                                     | Tableros, CRM, E-commerce, RR. HH.                             | estable |
| `CnSparkline`        | Mini gráfica de tendencia (línea, área o barras) para tarjetas, tablas y KPIs.                                 | Tableros, ERP, CRM, E-commerce, Pagos                          | estable |
| `CnTreemap`          | Treemap jerárquico con rectángulos proporcionales y navegación por niveles.                                    | Tableros, ERP, E-commerce, CMS                                 | estable |

### Retroalimentación (7)

| Componente             | Qué es                                                                                                                     | Dominios                                                | Estado  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------- |
| `CnAlert`              | Mensaje con semántica de estado (éxito, info, advertencia, error) en línea, como popup o toast.                            | General                                                 | estable |
| `CnBadge`              | Insignia de contador, punto o etiqueta superpuesta a otro elemento.                                                        | General, Tableros                                       | estable |
| `CnEmptyState`         | Estado vacío con ícono o ilustración, título, descripción y acción sugerida.                                               | General, Tableros                                       | estable |
| `CnFormSkeleton`       | Marcador de carga con la forma exacta de un formulario: encabezado, campos por tipo, secciones, pestañas, pasos y botones. | General, ERP, CRM, CMS, E-commerce, RR. HH.             | estable |
| `CnNotificationCenter` | Bandeja de notificaciones de la aplicación: campana con contador y panel con pestañas, grupos y acciones.                  | General, ERP, CRM, E-commerce, Pagos, RR. HH., Reservas | beta    |
| `CnSkeleton`           | Marcador de carga (bloque, círculo o líneas de texto) y kit para construir skeletons.                                      | General                                                 | estable |
| `CnToast`              | Avisos efímeros en cola, lanzados desde cualquier parte con `useToast()`.                                                  | General                                                 | estable |

### Superposiciones (3)

| Componente        | Qué es                                                                                                         | Dominios                      | Estado  |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------- |
| `CnConfirmDialog` | Diálogo de confirmación con presets, carga asíncrona, errores y confirmación por texto.                        | General                       | estable |
| `CnDialog`        | Modal de propósito general con encabezado y pie fijos, acciones con carga y guarda de cambios sin guardar.     | General, ERP, CRM             | beta    |
| `CnDrawer`        | Panel lateral o inferior para trabajar sin perder de vista la página, con variantes modal, persistente y mini. | General, ERP, CRM, E-commerce | beta    |

### Navegación (4)

| Componente         | Qué es                                                                                                                                                 | Dominios                                  | Estado  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ------- |
| `CnCommandPalette` | Paleta de comandos (Ctrl + K): un diálogo con búsqueda para ir a páginas, registros y acciones solo con el teclado.                                    | General, ERP, CRM, CMS, IA                | beta    |
| `CnSidebarNav`     | Navegación lateral de aplicación con grupos plegables, subpáginas, modo mini con tooltips, insignias, página actual y favoritos.                       | General, ERP, CRM, CMS, Tableros, RR. HH. | beta    |
| `CnTabs`           | Pestañas para alternar vistas del mismo contexto, con íconos, contadores, errores y carga.                                                             | General, ERP, CRM                         | estable |
| `CnTopBar`         | Barra superior de aplicación: botón de menú, marca, título, búsqueda con atajo, acciones y menú de usuario; se compacta según el ancho del contenedor. | General, ERP, CRM, CMS, Tableros          | beta    |

### Layout (4)

| Componente        | Qué es                                                                                                                          | Dominios                                                  | Estado  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------- |
| `CnAppShell`      | Estructura de aplicación: navegación lateral, barra superior, contenido con scroll propio, cajón en móvil y paleta de comandos. | General, ERP, CRM, CMS, Tableros, RR. HH., Punto de venta | beta    |
| `CnCard`          | Tarjeta genérica con encabezado, medio, cuerpo y pie; clicable, con acento y estados de carga y vacío.                          | General, E-commerce, CMS, Landing, Tableros               | estable |
| `CnPageContainer` | Estructura de página con breadcrumbs, título, botón atrás, acciones y contenido con ancho máximo.                               | General, ERP, CRM, CMS, Tableros                          | estable |
| `CnSectionCard`   | Sección con encabezado (ícono, título, insignia, acciones), cuerpo y pie; plegable y con estados de carga, vacío y error.       | General, ERP, CRM, RR. HH., Tableros                      | beta    |

### Contenido (2)

| Componente      | Qué es                                                                                               | Dominios                        | Estado |
| --------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- | ------ |
| `CnDocCard`     | Tarjeta de un documento o archivo existente: tipo, miniatura, metadatos, estado, versión y acciones. | CMS, ERP, RR. HH., CRM, General | beta   |
| `CnProfileCard` | Tarjeta de persona con avatar, puesto, contacto, evento con cuenta regresiva y acciones rápidas.     | RR. HH., CRM, General           | beta   |

### Medios (3)

| Componente          | Qué es                                                                                                                 | Dominios                                         | Estado  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------- |
| `CnCarousel`        | Carrusel genérico para cualquier contenido: diapositivas por vista, bucle, autoplay accesible, arrastre e indicadores. | E-commerce, Landing, CMS, General                | beta    |
| `CnContentCarousel` | Carrusel de contenido destacado: banners hero con imagen o video y CTA, o fila de tarjetas con encabezado.             | Landing, E-commerce, CMS, RR. HH., General       | beta    |
| `CnMap`             | Mapa con marcadores, selector de ubicación, estilos y modo oscuro, que funciona con o sin API key.                     | Reservas, E-commerce, CRM, ERP, Landing, General | estable |

<!-- catalog:end -->

## Componentes

Ejemplos de uso de los componentes básicos. La lista completa y vigente está en el
[Catálogo de componentes](#catálogo-de-componentes); lo planeado, en [`docs/ROADMAP.md`](./docs/ROADMAP.md).

### `CnButton`

```tsx
<CnButton
  variant="contained" // "contained" | "outlined" | "text"
  color="primary" // primary | secondary | success | warning | info | error | accent | neutral
  size="medium" // "small" | "medium" | "large"
  shape="rounded" // "rounded" | "pill" | "square"
  startIcon="add" // string (usa CnIcon) o ReactNode
  endIcon="arrow_forward"
  loading={false}
  fullWidth={false}
  href="https://canek.mx" // renderiza <a> en lugar de <button>
  target="_blank"
  onClick={() => {}}
>
  Guardar cambios
</CnButton>
```

### `CnIcon`

```tsx
<CnIcon
  name="check" // string del registry
  size="md" // "xs" | "sm" | "md" | "lg" | "xl" | "2xl" o número
  color="success" // primary | secondary | success | warning | error | info | accent | muted | subtle | inherit
  spin={false}
  pulse={false}
  rotate={0}
  label="Éxito" // opcional, agrega role="img" y aria-label
/>
```

El registry incluye ~80 íconos comunes. Se puede extender con `registerIcons`:

```tsx
import { registerIcons } from "@canek-ui/material-design-system";
import CustomIcon from "@mui/icons-material/CustomIcon";

registerIcons({
  custom_thing: CustomIcon,
});
```

---

## Formularios

Todos los campos comparten la misma API base (`CnFieldBaseProps`): `label`, `helperText`,
`error`, `required`, `disabled`, `readOnly`, `value`/`defaultValue`/`onChange`, `onBlur`,
`size`, `rules` y `internalValidation`. Funcionan solos (con validación interna por `rules`)
o dentro de `CnForm`, que pasa a ser la única fuente de verdad de los errores.

### `CnForm` básico

```tsx
import { CnForm, type CnFormField } from "@canek-ui/material-design-system";

const fields: CnFormField[] = [
  { name: "name", type: "text", label: "Nombre", required: true, transform: "capitalize" },
  { name: "email", type: "email", label: "Correo", required: true },
  { name: "phone", type: "phone", label: "Teléfono", defaultCountry: "MX" },
  { name: "address.zip", type: "text", label: "CP", rules: [{ type: "postalCode", format: "mx" }] },
  {
    name: "plan",
    type: "select",
    label: "Plan",
    options: [
      { value: 1, label: "Básico" },
      { value: 2, label: "Pro" },
    ],
  },
];

// No controlado: el formulario guarda su propio estado.
<CnForm
  fields={fields}
  columns={2}
  defaultValues={{ plan: 1 }}
  onSubmit={(values) => api.save(values)}
/>;

// Controlado: `patch` trae claves de primer nivel completas (sirve con rutas anidadas).
const [value, setValue] = useState({});
<CnForm
  fields={fields}
  value={value}
  onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
  onSubmit={save}
/>;
```

### Variantes y layout

| Prop                         | Uso                                                                                                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`                     | Formulario simple.                                                                                                                                                                                             |
| `sections`                   | Secciones con título/ícono, colapsables, columnas propias y **repetibles** (`repeatable`, `minItems`, `maxItems`, `canReorder`, `itemTitle`). El valor de una sección repetible es un arreglo en `values[id]`. |
| `tabs`                       | Pestañas con indicador de error; al enviar salta a la pestaña del primer error.                                                                                                                                |
| `steps`                      | Wizard: valida el paso antes de avanzar (incluye validación asíncrona), Enter avanza, stepper navegable y barra de progreso en móvil.                                                                          |
| `mode="modal"`               | Mismo formulario dentro de un diálogo (pantalla completa en móvil).                                                                                                                                            |
| `columns`, `xs…xl` por campo | Grid responsivo; textarea, archivos, radios y grupos ocupan el ancho completo.                                                                                                                                 |

Las pestañas y los pasos aceptan `fields` **y** `sections`.

### Reglas, campos dinámicos y efectos

- `required`, `disabled`, `readOnly`, `label`, `placeholder`, `options`, `rules`, `min`, `max`,
  `currency`, `minDate`, `maxDate` aceptan un valor o una función `(values, ctx) => valor`.
- `visibleWhen(values, ctx)` oculta campos; los ocultos no se validan y con `omitHiddenFields` no se envían.
- En secciones repetibles `ctx` incluye `{ sectionId, index, item }`.
- `onFieldChange(value, values, path)` puede devolver otros valores a actualizar (`{ "address.city": "" }`).
- `validateAsync(value, values, ctx)` para validaciones remotas (se ignoran respuestas viejas).
- Reglas implícitas: `email`, `url`, `tel`, teléfono por país, rango de fechas, `min`/`max` numéricos, `maxLength`, `maxFiles`.
- **Reglas condicionales:** cualquier regla acepta `when(values, ctx, value)`, p. ej. `{ type: "required", when: (v) => v.notify }`.
- `equalTo`/`notEqualTo` comparan primero contra el elemento de la sección repetible (`$.campo` fuerza la raíz) y no marcan error si el campo está vacío. `between` acepta solo `min` o solo `max`; `exactLength` acepta `length` como alias.
- `validateOn`: `"blur"` (por defecto), `"change"` o `"submit"`. Tras el primer envío los errores se actualizan en vivo.
- `type: "custom"` con `render({ value, onChange, error, ... })` para controles propios enlazados al formulario. Enter dentro de un control propio no envía el formulario (salvo `submitOnEnter`).

### Opciones remotas y selects en cascada

```tsx
{ name: "state", type: "select", label: "Estado", options: STATES },
{
  name: "city",
  type: "select",
  label: "Ciudad",
  dependsOn: ["state"],                  // se limpia y recarga al cambiar el estado
  loadOptions: ({ formValues, signal }) => api.cities(formValues.state, { signal }),
},
{
  name: "owner",
  type: "autocomplete",
  label: "Responsable",
  loadOptions: ({ input, signal }) => api.users.search(input, { signal }), // debounce + cancelación
  minSearchLength: 2,
  selectedOptions: [{ value: 7, label: "María López" }], // etiqueta del valor al editar
  onCreateOption: async (input) => api.users.create({ name: input }),     // "Crear …"
},
```

- `loadOptions` funciona en `select`, `autocomplete`, `radio`, `checkbox` (grupo), `segmented`, `choicecards`, `transferlist` y `treeselect`; cachea por dependencias y cancela peticiones viejas (`signal`).
- Con `dependsOn` el campo se deshabilita mientras falte un padre y se limpia en cascada (`resetOnDependencyChange: false` lo evita). En secciones repetibles las rutas son relativas al elemento; `$.ruta` apunta a la raíz.
- `renderOption`, `renderValue` (select) y `getOptionLabel` personalizan cómo se ven las opciones.

### Campos calculados, ocultos y de solo lectura

```tsx
{ name: "id", type: "hidden" },                             // se envía, no se pinta
{
  name: "amount",
  type: "display",                                          // valor de solo lectura
  compute: (_values, ctx) => ctx.item.qty * ctx.item.price, // dentro de una partida
  format: (v) => money(v),
},
{ name: "total", type: "display", compute: (v) => sum(v.lines, "amount"), format: money },
```

`compute` funciona en cualquier tipo (el campo queda de solo lectura) y se recalcula en cadena (subtotal → IVA → total).

### Fechas

`CnDateField` no usa el selector nativo del navegador: se puede **escribir** con máscara
(`DD/MM/AAAA`, `HH:mm`, 12 h con `ampm`) o abrir el selector propio (icono o `Alt + ↓`).

- Calendario con vistas de día, mes y año, navegación completa por teclado (flechas, `Re Pág`/`Av Pág`, `Inicio`/`Fin`) y botones "Hoy"/"Limpiar".
- Restricciones: `min`, `max`, `disablePast`, `disableFuture`, `disableWeekends`, `disabledDays`, `disabledDates` (festivos) y `shouldDisableDate`.
- Hora por columnas con `minutesStep`, límites `min`/`max` y `shouldDisableTime`.
- `highlightedDates` marca días con un punto; `showWeekNumbers` muestra la semana ISO.
- El valor sigue siendo ISO local (`YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm`, `YYYY-MM`); un texto incompleto se emite tal cual para que la validación lo marque.
- `CnDateRangeField` (`type: "daterange"` en `CnForm`) guarda `[desde, hasta]` y valida orden, completitud y `maxDays`.
- `type: "year"` guarda `YYYY` con un selector de solo año (ejercicios fiscales, generaciones).
- `displayFormat` muestra un formato libre mientras el campo no tiene el foco: `"MMMM [de] YYYY"` → "mayo de 2024", `"dddd D [de] MMMM"`, `"hh:mm a"` (`formatIsoDisplay` para usarlo fuera del campo).
- `minTime` / `maxTime` definen una ventana horaria diaria (p. ej. 08:00–18:00) en `time` y `datetime`, con validación.
- `openTo`, `defaultCalendarMonth`, `shouldDisableMonth`, `shouldDisableYear` y `shouldDisableTime` también desde `CnForm`.

### Números

`CnNumberField` guarda `number | null` (nunca texto) y admite:

- `controls`: `stacked` (▲▼, por defecto), `split` (− valor +), `inline` o `none`. `CnQuantityField` es el atajo para cantidades.
- Mantener presionado repite con aceleración; ↑/↓ = `step`, Shift = `largeStep` (×10), Alt = `smallStep` (÷10), Re Pág/Av Pág, Inicio/Fin (mín./máx.).
- `allowWheel` (rueda con foco), `snapToStep`, `clampOnBlur`, `allowEmpty`, `clearable`, `decimals`, `thousandSeparator`, `prefix`/`suffix`, `textAlign`.

### Archivos

`CnFileField` cubre desde un adjunto simple hasta una galería de producto:

| Variante   | Uso                                                         |
| ---------- | ----------------------------------------------------------- |
| `dropzone` | Zona de arrastre + lista (por defecto).                     |
| `button`   | Botón + lista.                                              |
| `compact`  | Chips en línea para formularios densos.                     |
| `grid`     | Galería cuadrada, con "Principal" y arrastre en cuadrícula. |
| `card`     | Tarjetas con vista previa grande y metadatos.               |
| `avatar`   | Foto de perfil circular.                                    |
| `masonry`  | Galería en columnas que respeta la proporción de cada foto. |

- **Validación:** `accept`, `maxSize`, `maxFiles`, `maxTotalSize` (en `sizeUnit`: `KB`, `MB` o `GB`), `imageConstraints` (mín./máx. de px y proporción) y duplicados.
- `gridColumns` fija las columnas de `grid`, `card` y `masonry`. En `CnForm`: `fileSizeUnit`, `gridColumns`, `showPreviews`.
- **Metadatos** sin dependencias: dimensiones, duración de audio/video y páginas de PDF.
- **Subidas directas:** `onFilesAdded` para empezar a subir y `fileStatus` (`uploading` + `progress`, `success`, `error`) con `onRetry`.
- **Visor** de imágenes (zoom), video, audio y PDF, con descarga y navegación por teclado.
- Pegar con Ctrl+V (`allowPaste`), `capture` para la cámara del móvil, `renderFileActions` para acciones propias y `onRemoveExisting` para archivos del servidor.
- En `CnForm`, cualquier opción avanzada se pasa con `componentProps` (p. ej. `{ fileStatus, onFilesAdded }`).

### Más campos

| Tipo en `CnForm` | Componente            | Notas                                                                        |
| ---------------- | --------------------- | ---------------------------------------------------------------------------- |
| `password`       | `CnPasswordField`     | `passwordRequirements`, `allowGenerate`, `showPasswordStrength`.             |
| `otp`            | `CnOtpField`          | `otpLength`; valida longitud completa.                                       |
| `masked`         | `CnMaskedField`       | `mask` (`#` dígito, `A` letra, `*` alfanumérico) o `maskPreset`.             |
| `tags`           | `CnTagsField`         | `tagRules` por etiqueta, `maxTags`, `suggestions`; pegar listas.             |
| `segmented`      | `CnSegmentedField`    | `options` con `icon`, `multiple`, `iconOnly`.                                |
| `color`          | `CnColorField`        | `colorPresets`; valida `#RRGGBB`.                                            |
| `signature`      | `CnSignatureField`    | Valor PNG en data URL; alternativa escrita accesible.                        |
| `numberrange`    | `CnNumberRangeField`  | `[mín, máx]`, valida el orden.                                               |
| `country`        | `CnCountryField`      | Código ISO; `priorityCountries`, `multiple`.                                 |
| `choicecards`    | `CnChoiceCardsField`  | Tarjetas con ícono, descripción y `meta`; `multiple`, `optionColumns`.       |
| `transferlist`   | `CnTransferListField` | Lista doble con búsqueda (permisos, integrantes); `max`.                     |
| `treeselect`     | `CnTreeSelectField`   | Árbol con búsqueda; `multiple` + `cascade`, `treeValueMode`, `leavesOnly`.   |
| `keyvalue`       | `CnKeyValueField`     | Pares clave–valor; `valueFormat` `array`/`object`; detecta repetidas.        |
| `address`        | `CnAddressField`      | Dirección MX; `onPostalCodeLookup` autocompleta colonia, municipio y estado. |
| `repeater`       | `CnRepeaterField`     | Lista repetible; `minItems`/`maxItems`, `renderItem`, reordenar.             |
| `duration`       | `CnDurationField`     | Días/horas/minutos; valor en minutos o segundos; presets.                    |
| `search`         | `CnSearchField`       | Sugerencias estáticas o `onSearch` asíncrono, recientes, teclado.            |
| `code`           | `CnCodeField`         | Editor con números de línea; valida y formatea JSON.                         |
| `schedule`       | `CnScheduleField`     | Horario semanal con rangos por día; detecta traslapes.                       |
| `location`       | `CnLocationField`     | Latitud/longitud, "usar mi ubicación" y mapa.                                |
| `weekdays`       | `CnWeekdaysField`     | Días de la semana con presets (laborables, fin de semana).                   |
| `timerange`      | `CnTimeRangeField`    | Hora inicial y final; duración y turnos nocturnos.                           |
| `hidden`         | —                     | Valor que viaja en el payload sin pintarse.                                  |
| `display`        | —                     | Valor de solo lectura con `format`; ideal con `compute`.                     |

Las opciones de `select`, `autocomplete` y `segmented` aceptan `icon`, `avatar`, `initials` (o
`true` para calcularlas) y `flag`, útiles para selectores de personas o países.

### Texto enriquecido

El editor vive en una entrada aparte para que tiptap sea opcional:

```bash
npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extensions @tiptap/extension-text-align @tiptap/extension-highlight @tiptap/extension-image @tiptap/extension-table
```

```tsx
import {
  CnRichTextField,
  registerRichTextFieldType,
} from "@canek-ui/material-design-system/rich-text";

registerRichTextFieldType(); // una vez al iniciar: habilita type: "richtext" en CnForm

<CnForm
  fields={[
    {
      name: "body",
      type: "richtext",
      label: "Contenido",
      required: true,
      maxLength: 5000,
      componentProps: { toolbar: "full", onUploadImage: (file) => api.upload(file) },
    },
  ]}
  onSubmit={save}
/>;
```

Barra `basic` / `standard` / `full` o lista propia; enlaces solo `http(s)`, `mailto:` y `tel:`
(también al pegar); imágenes por URL https o subida (`onUploadImage`, si no se incrustan con límite
de tamaño); tablas; `Ctrl+K` para enlaces. Un editor vacío emite `""`, así que `required` funciona.
El HTML que guardes debe sanitizarse al **mostrarlo** en otras vistas.

### Tipos de campo propios

`registerFormFieldType(tipo, renderer)` agrega tipos reutilizables a `CnForm` (así se integra `richtext`):

```tsx
registerFormFieldType("color", ({ value, onChange, label, error, helperText }) => (
  <MiSelectorDeColor
    label={label}
    value={value}
    onChange={onChange}
    error={error}
    helperText={helperText}
  />
));
```

### Envío y errores del servidor

```tsx
<CnForm
  fields={fields}
  submitMode="auto" // "json" | "formdata" | "auto" (FormData si hay archivos)
  buildPayload={(v) => ({ ...v, total: Number(v.total) })}
  excludeFields={["confirmPassword"]}
  onSubmit={async (payload, { helpers }) => {
    await api.save(payload); // si lanza, sus errores por campo se muestran solos
  }}
  resetAfterSubmit
/>
```

`parseServerErrors` entiende `{ campo: "msg" }`, `{ campo: ["msg"] }`, Laravel `{ message, errors }`,
`{ data: {...} }`, arreglos `[{ path|field, message }]`, rutas `items[0].name` y errores de axios
(`error.response.data`). El mensaje general se muestra arriba del formulario. También puedes pasar
`serverError` como prop.

### Experiencia y accesibilidad

- Resumen de errores accesible (`errorSummary="inline" | "toast" | "none"`) con enlaces que llevan al campo.
- Foco y scroll al primer error (cambia de pestaña / paso / expande la sección si hace falta).
- Prevención de doble envío, `isSubmitting` interno, botones deshabilitados durante el envío.
- `warnOnUnsavedChanges`: confirma antes de cerrar el modal o salir de la página con cambios. `onDirtyChange` informa el estado.
- Skeletons de carga (`isLoading`, `loadingStates` por sección/pestaña/paso).
- Textos personalizables con `labels` (i18n).

### API imperativa

```tsx
const formRef = useRef<CnFormHandle>(null);
<CnForm formRef={formRef} hideActions fields={fields} onSubmit={save} />;

formRef.current?.submit(); // Promise<boolean>
formRef.current?.validate(); // Promise<boolean>
formRef.current?.setFieldValue("name", "Ana");
formRef.current?.setErrors({ email: "Ya existe" });
formRef.current?.reset();
formRef.current?.getValues();
formRef.current?.isDirty();
formRef.current?.setValues({ "address.city": "GDL", total: 10 });
formRef.current?.getFieldValue("address.city");
formRef.current?.setFieldError("rfc", "RFC ya registrado");
formRef.current?.clearErrors("rfc"); // sin argumentos borra todos
formRef.current?.validate(["rfc", "email"]); // solo esas rutas
formRef.current?.getErrors();
formRef.current?.focusField("items.2.qty"); // cambia de pestaña/paso y expande la sección
formRef.current?.markSaved();
```

Los `helpers` de `onSubmit` y `extraActions` incluyen `setValues`, `getFieldValue`, `setFieldError` y
`clearErrors`. `externalSubmitRef` se mantiene por compatibilidad.

### Más opciones del formulario

| Prop                                              | Uso                                                                                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `icon`, `dialogTitle`                             | Ícono del encabezado y título del modal distinto al inline.                                                                               |
| `reinitialize`                                    | (por defecto `true`) Si `defaultValues` llega después de montar y no hay cambios, el formulario se reinicia con esos datos.               |
| `resetOnOpen`                                     | (por defecto `true`) Un modal no controlado vuelve a sus valores iniciales cada vez que se abre.                                          |
| `disableActions`                                  | Deshabilita los botones sin deshabilitar los campos. `loadingStates.global` o cualquier sección/pestaña cargando también los deshabilita. |
| `nextButtonProps`, `backButtonProps`              | Personalizan los botones del wizard (`endIcon` disponible en todos los botones).                                                          |
| `showServerErrorAlert`                            | `false` si la página ya muestra el error general del servidor.                                                                            |
| `formDataOptions`                                 | `arrayFormat` (`indices` / `brackets` / `json`), `existingFiles` (`id` / `omit`), `booleanFormat`.                                        |
| `onSuccess(payload, values)`                      | Recibe lo enviado.                                                                                                                        |
| `extraActions[].visibleWhen`, `.loading`, `.size` | Acciones condicionales y con estado de carga.                                                                                             |

Secciones: `appearance` (`card` / `elevated` / `filled` / `plain`), `padding`, `headerRight`, `addIcon`, `removeIcon`, `removeLabel`, `emptyText`, `initialItems`, `minItems: 0` (arranca
vacía), `canRemove(values, { index, item })` por elemento y reordenamiento activo por defecto. Las
pestañas `disabled` no se validan.

Campos: `tel` con `showCountrySelect` (selector de país y validación por país, `phoneValueFormat`); `step`, `decimals`, `precision`, `rows`, `minRows`, `maxRows`, `ampm` y `minutesStep` aceptan funciones `(values, ctx)`; `size` por campo, adornos en `number`/`select`, `currencySelectorMode`, `valueType: "date"` en
fechas (además aceptan `Date`, ISO con zona y `"YYYY-MM-DD HH:mm:ss"` como valor inicial),
`removedFilesName` para acumular los ids de archivos existentes que el usuario quitó y URLs sueltas
como archivos existentes. `componentProps` llega a todos los tipos.

### Seguridad

- `CnFileField` valida tipo (`accept`), tamaño y cantidad antes de aceptar archivos, libera los
  `object URL` de las previews y solo enlaza URLs `http(s)`, `blob:` o relativas (bloquea `javascript:`, `data:` no-imagen y `//host`).
- Los mensajes y nombres de archivo se renderizan como texto (sin `innerHTML`).
- El visor de PDF usa `<object type="application/pdf">` (nunca interpreta HTML).
- Los filtros de entrada (`rules`) recortan caracteres no permitidos sin perder acentos ni `+` en correos.

### Notas de migración (desde v0.12)

- `type: "number"` ahora usa `CnNumberField` y guarda `number | null` (antes string).
- `onChange(patch)` de `CnForm` envía claves de primer nivel completas (antes `"a.b"` literal); se agrega un 2.º argumento con todos los valores.
- `select`/`radio` conservan el tipo original del valor de la opción (antes se convertía a string).
- Los íconos por nombre de `CnButton` (`startIcon="save"`) se renderizan con `CnIcon` (antes aparecía el texto).
- Mensaje por defecto de `equalTo`: "Los valores no coinciden".
- `CnDateField` ya no usa el input nativo; el formato de valor no cambia. `step` (segundos) queda obsoleto: usa `minutesStep`.
- En secciones repetibles y archivos, los botones subir/bajar se reemplazan por un asa para arrastrar (también funciona con flechas del teclado).
- `CnNumberField` muestra por defecto flechas apiladas (`controls="stacked"`); usa `controls="none"` para el aspecto anterior. `showSteppers` queda obsoleto.
- Los PDF en `CnFileField` ahora abren el visor en lugar de un enlace.
- Secciones repetibles: reordenar está activo por defecto (`canReorder: false` para desactivarlo) y `minItems: 0` arranca sin elementos.
- `onSuccess` recibe `(payload, values)`; las pestañas `disabled` ya no se validan.
- Un `defaultValues` que cambia después de montar reinicia el formulario si no hay cambios (`reinitialize={false}` para el comportamiento anterior); los modales no controlados se limpian al reabrir (`resetOnOpen={false}`).

---

## Retroalimentación y layout

### Confirmaciones: `CnConfirmDialog` y `useConfirm`

```tsx
// Una vez en la raíz de la app
<CnToastProvider>
  <CnConfirmProvider>
    <App />
  </CnConfirmProvider>
</CnToastProvider>;

const confirm = useConfirm();
const ok = await confirm({
  variant: "delete", // delete | danger | warning | info | success | update | neutral
  title: "¿Eliminar a ACME Corp?",
  message: "Se eliminarán sus contratos.",
  requireText: "ACME", // obliga a escribir el texto (acciones irreversibles)
  onConfirm: () => api.clients.delete(id), // async: muestra carga y, si falla, el error del servidor
});
```

`CnConfirmDialog` también se usa controlado (`open`, `onClose`, `onConfirm`). Es un `alertdialog`
accesible con foco en la acción y presets de texto, ícono y color.

### Notificaciones: `CnToastProvider` y `useToast`

```tsx
const toast = useToast();
toast.success("Cliente guardado", { action: { label: "Deshacer", onClick: undo } });
toast.error(error); // errores de axios/fetch/Laravel: mensaje + detalles por campo
await toast.promise(api.export(), { loading: "Generando…", success: "Reporte listo" });
const id = toast.loading("Subiendo…");
toast.update(id, { severity: "success", message: "Listo" });
```

Pila con `max` avisos, `position`, pausa al pasar el mouse o enfocar, `aria-live` y duración
mayor para errores. Para integrarlo con react-query basta con llamar a `toast.error(error)` en el
`onError` del `MutationCache`.

### `CnPageContainer`

Encabezado de página con breadcrumbs, botón atrás (`back` con ruta, función o `true` para el
breadcrumb anterior), ícono, título, subtítulo, `actions`, `headerExtra` (filtros o pestañas),
`stickyHeader`, `maxWidth`, `paper` y `loading`. Es independiente del router: pasa
`linkComponent` (p. ej. un `Link` de react-router que reciba `href`) y `onNavigate`.

### `CnMetricCard`

Indicadores con `format`, `prefix`/`suffix`, `icon`, `trend` (`upIsGood: false` cuando subir es
malo, p. ej. costos), `progress` hacia una meta, `sparkline` (línea, área o barras; también
disponible como `CnSparkline`), `footer`, variantes `outlined` / `elevated` / `filled`, `loading`
y `onClick`.

## Tabla de datos

`CnDataTable` es la tabla de datos completa: barra Descargar/Copiar/Imprimir, encabezados con orden,
asa para mover, menú por columna y filtros subrayados; celdas en píldora con botón de copiar. Usa `@tanstack/react-table` como motor (incluido).

```tsx
import { CN_STATUS_PRESETS, CnDataTable, type CnColumn } from "@canek-ui/material-design-system";

const columns: CnColumn<Contract>[] = [
  { id: "folio", header: "Folio", type: "code", sticky: true },
  {
    id: "client.name",
    header: "Cliente",
    type: "avatar",
    cellOptions: { subtitle: (r) => r.client.email },
  },
  {
    id: "status",
    header: "Estado",
    type: "status",
    filter: "select",
    cellOptions: { statusMap: CN_STATUS_PRESETS.approval },
  },
  { id: "amount", header: "Monto", type: "currency", aggregate: "sum", description: "Incluye IVA" },
  { id: "team", header: "Equipo", type: "contact" },
  { id: "rfc", header: "RFC", type: "rfc", hidden: true },
];

<CnDataTable
  title="Contratos"
  data={contracts}
  columns={columns}
  selectable
  rowNumbers
  bulkActions={[
    {
      id: "cancel",
      label: "Cancelar",
      color: "error",
      onClick: cancel,
      confirm: { variant: "danger" },
    },
  ]}
  rowActions={[
    { id: "edit", label: "Editar", icon: "edit", onClick: edit },
    {
      id: "delete",
      label: "Eliminar",
      icon: "delete",
      color: "error",
      confirm: { variant: "delete" },
      onClick: remove,
    },
  ]}
  renderDetail={(row) => <ContractSummary contract={row} />}
  exportDetail={{ accessor: (row) => row.items, columns: itemColumns }}
  persistKey="contracts"
/>;
```

**Celdas** (`type` + `cellOptions`, o `<CnCell>` dentro de `cell`):

| Tipo                                 | Qué muestra                                                     | Opciones destacadas                                                                    |
| ------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `text`                               | Texto (2 líneas, tooltip) o píldora                             | `pill`, `icon`, `transform`, `bold`, `maxLength`, `subtitle`, `expandAfter`, `onClick` |
| `id`, `code`                         | Píldora monoespaciada con copiar                                | `prefix`, `suffix`, `tone`, `maxLength`, `transform`                                   |
| `rfc`, `curp`                        | Píldora con validación de formato                               | —                                                                                      |
| `number`, `currency`, `percent`      | Números, moneda y % con tendencia                               | `decimals`, `currency`, `suffix`, `previous`, `plain`, `bar`, `percentScale`           |
| `progress`, `rating`, `duration`     | Barra, estrellas, "1 h 20 min"                                  | `max`, `durationUnit`                                                                  |
| `date`, `datetime`, `time`           | "15/Ene/2023" + "hace 3 años"                                   | `relative`, `dateFormat` (`"D [de] MMMM YYYY"`)                                        |
| `status`, `boolean`                  | Píldora con ícono y color                                       | `statusMap` (37 presets en `CN_STATUS_PRESETS`), `trueLabel`                           |
| `avatar`, `contact`                  | Avatar con color estable; contactos apilados con ficha          | `subtitle`, `image`, `badge`, `avatarShape`, `maxItems`                                |
| `email`, `phone`, `link`, `location` | Enlaces `mailto:`, `tel:`, WhatsApp, Google Maps                | `whatsapp`, `linkLabel`, `mapLink`                                                     |
| `tags`, `image`                      | Etiquetas y galería; clic abre el visor de imágenes             | `maxTags`, `maxItems`                                                                  |
| `file`                               | Archivo con ícono por tipo, tamaño y descarga                   | `maxItems`                                                                             |
| `color`, `country`                   | Muestra de color (hex/rgb) y bandera + nombre                   | —                                                                                      |
| `json`, `list`                       | Resumen de objeto/lista; el detalle muestra todo                | `maxItems`                                                                             |
| `daterange`                          | "01/Ene – 15/Oct" con duración y estado                         | `relative`                                                                             |
| `bytes`, `sparkline`                 | "2.4 MB" y mini gráfica de tendencia                            | `decimals`, `tone`                                                                     |
| `coordinates`                        | Lat/long con mapa en el detalle                                 | `mapPreview` (también `location`)                                                      |
| `masked`                             | Valor oculto (tarjeta, CLABE) con mostrar/ocultar               | `visibleChars`                                                                         |
| `delta`, `range`                     | Variación con flecha y color; rango mín–máx con barra           | `previous`, `deltaFormat`, `invertTrend`, `rangeFormat`                                |
| `priority`, `stage`, `steps`         | Prioridad con barras, etapa de un flujo, avance por pasos       | `priorityMap`, `stages`, `stepLabels`                                                  |
| `deadline`                           | "Vence en 3 h" / "Vencido hace 2 d" por urgencia                | `thresholds`, `done`                                                                   |
| `ip`, `uuid`, `version`              | IP con tipo y alcance; hash recortado; versión semver           | `visibleChars`, `latestVersion`                                                        |
| `richtext`                           | Vista previa de HTML/Markdown; completo y saneado en el detalle | `richFormat`, `lines`                                                                  |
| `icon`, `toggle`, `counter`          | Ícono con texto; interruptor editable; contador                 | `onChange`, `hideZero`, `max`                                                          |
| `weekdays`, `timerange`, `age`       | L M M J V S D; "09:00 – 18:00"; edad desde la fecha             | `showDuration`                                                                         |
| `sentiment`, `score`, `reference`    | Cara por sentimiento; anillo de puntuación; registro enlazado   | `sentimentScale`, `thresholds`, `href`                                                 |

Cada tipo de celda tiene su historia con sus variantes en Storybook ("Data Display/Cells"), y se
puede usar suelto con `<CnCell type="…" value={…} />`. La pantalla completa de la tabla se monta en
un portal: funciona aunque la tabla viva dentro de un diálogo o un panel con `transform`.

**Detalle al hacer clic** (`detail: false` lo desactiva): fechas abren una tarjeta con fecha completa,
hora, relativo, semana/trimestre, ISO y calendario; montos con variación y cantidad en letra
(`amountInWords`); RFC/CURP con tipo de persona, fecha, sexo y estado; correo y teléfono con acciones
(llamar, WhatsApp, SMS); direcciones y coordenadas con mapa; textos largos, archivos, JSON, rangos y
listas con el contenido completo. Las imágenes abren `CnImageViewer` (pantalla completa, flechas,
miniaturas, descarga). Ambos se exportan para usarse fuera de la tabla (`CnCellDetail`, `CnImageViewer`).

Los vacíos muestran contexto ("Sin teléfono", "Sin correo") o el que elijas con `emptyContext`
(`not_assigned`, `pending`, `not_applicable`… 18 contextos) o `emptyText`. El mismo formato
se usa para buscar, ordenar y exportar.

**Tabla**

- Búsqueda sin acentos, filtros por columna (texto o `filter: "select"`), orden múltiple (Shift + clic).
- Columnas: mover arrastrando el asa, redimensionar, fijar a la izquierda, ocultar, descripción (ⓘ) y
  menú por columna (ordenar, filtrar, **agrupar**, fijar, restablecer ancho, ocultar).
- **Agrupar** por una o varias columnas con conteo y totales por grupo (`defaultGrouping`).
- Selección (con casilla para mostrarla, `selectOnRowClick`, por grupo), acciones masivas con confirmación.
- Acciones por fila: menú u `inline`, con `visible`, `disabled`, `tooltip` y `confirm`.
- Detalle expandible, números de fila, totales en el pie, tono por fila (`getRowTone`, también color CSS).
- **Exportar**: XLSX real (números, moneda, % y fechas como valores, encabezado con estilo, filtro y fila
  congelada), CSV (BOM + CRLF), TSV, JSON, HTML y PDF; de todo, la página o la selección; con
  `exportDetail` una fila por partida. Copiar como tabla, Markdown o JSON. Imprimir. Protección contra
  inyección de fórmulas.
- Densidad (3 niveles), pantalla completa, encabezado fijo con `maxHeight`, tarjetas en móvil.
- Persistencia (`persistKey`): columnas, orden, anchos, fijadas, agrupación, densidad y tamaño de página.
- Modo servidor: `serverSide={{ rowCount, query, onQueryChange }}` + `fetchAllRows` para exportar todo.

## Listas grandes (miles de opciones)

Los campos con opciones (`CnSelectField`, `CnAutocompleteField`, `CnCountryField`,
`CnTreeSelectField`, `CnTransferListField` y las sugerencias de `CnSearchField`) están
preparados para cientos de miles de registros sin cargar todo de una vez ni pintar miles de
nodos.

### 1. Virtualización automática

Solo se pintan las filas visibles (más un margen). Se activa sola con **más de 100
opciones** y se controla con `virtualize`:

```tsx
<CnAutocompleteField options={diezMil} />          // automático (>100)
<CnSelectField options={lista} virtualize={false} />  // nunca
<CnTreeSelectField options={arbol} virtualize={50} /> // umbral propio
```

- **Autocomplete / país**: listbox virtual dentro de MUI (`slotProps.listbox`); conserva
  grupos, avatares/iconos/banderas, `aria-setsize`/`aria-posinset` y el teclado de MUI
  (flechas, Re/Av Pág, Inicio/Fin llegan a los extremos).
- **Select**: al virtualizar abre un menú propio con buscador, `aria-activedescendant`,
  marcas en selección múltiple y `selectAll` ("Seleccionar todo" sobre lo filtrado). Sin
  buscador (`searchable={false}`) admite búsqueda por tecleo.
- **TreeSelect**: virtualiza el árbol visible (expandido o filtrado); el foco por teclado
  alcanza nodos fuera de la ventana.
- **TransferList**: ambas listas, con foco itinerante (una sola fila tabulable).

Para listas propias: `useVirtualList({ count, itemSize | estimateSize, overscan,
onEndReached })` devuelve `scrollRef`, `items`, `totalSize`, `scrollToIndex` y
`measureElement`; `getVirtualSlots(items, totalSize)` intercala los huecos.

### 2. Carga paginada desde el servidor

`loadOptions` puede devolver un arreglo (como antes) **o una página**:

```tsx
const loadOptions = async ({ input, page, pageSize, signal }) => {
  const res = await fetch(
    `/api/clientes?q=${encodeURIComponent(input)}&page=${page}&size=${pageSize}`,
    { signal },
  );
  const { items, total } = await res.json();
  return {
    options: items.map((c) => ({ value: c.id, label: c.nombre })),
    hasMore: (page + 1) * pageSize < total,
    total,
  };
};

<CnAutocompleteField loadOptions={loadOptions} pageSize={50} minSearchLength={2} />;
```

- Scroll infinito: al acercarse al final se pide la siguiente página, con fila
  "Cargando más…" y fila "Reintentar" si falla. Se detiene con `hasMore: false`.
- Búsqueda con espera (`searchDebounceMs`, 300 ms) y **cancelación**: cada búsqueda nueva
  aborta la anterior (`signal`).
- `minSearchLength` muestra "Escribe al menos N caracteres"; sin coincidencias, "Sin
  resultados"; con `total`, el pie "Mostrando 50 de 12,340".
- **Caché LRU por búsqueda** (30 búsquedas). `cacheKey` la comparte entre campos;
  cambiar `loadOptionsDeps` (o `dependsOn` en `CnForm`) la invalida. `clearOptionsCache(key)`
  la vacía a mano.
- En `CnSelectField` y `CnTransferListField`, pasar `loadOptions` activa el buscador remoto
  y el scroll infinito ("Mover todos" mueve solo lo cargado).

### 3. Valores seleccionados fuera de la página

Al editar un registro el valor guardado (ids) puede no estar en la primera página:

```tsx
<CnAutocompleteField
  multiple
  loadOptions={loadOptions}
  resolveOptions={async (ids, { signal }) => api.clientesPorId(ids, { signal })}
  value={[1200, 98765]}
/>
```

`resolveOptions(values)` se llama **una vez por lote** de valores desconocidos y se guarda en
una pequeña caché (compartida con `cacheKey`). Alternativas: `selectedOptions` (opciones ya
conocidas) o `getValueLabel(value)` como etiqueta de respaldo.

### 4. Arreglos locales grandes

- Filtro sin acentos ni mayúsculas, por palabras, con el texto normalizado **precalculado**
  por opción (no se normaliza en cada tecla).
- `maxResults` limita lo que se pinta y muestra "N más, refina tu búsqueda".
- `filterOptions(options, input)` reemplaza el filtro.

### 5. En `CnForm`

```ts
{
  name: "cliente",
  type: "select",            // también autocomplete, transferlist
  loadOptions: ({ input, page, pageSize, signal, formValues }) => api.buscar(...),
  resolveOptions: (ids, { signal, formValues }) => api.porId(ids),
  pageSize: 50,              // en select/transferlist activa la búsqueda en servidor
  virtualize: true,          // select, autocomplete, country, treeselect, transferlist, search
  maxResults: 100,           // select, autocomplete, country, search (maxSuggestions)
  optionsCacheKey: "clientes",
}
```

`getOptionLabel` también sirve de respaldo para valores sin resolver. Un `select` cuyo
`loadOptions` devuelve páginas pasa solo a modo servidor; con un arreglo se comporta como
siempre (carga al montar).

### Recomendaciones

- Más de ~1,000 registros o datos que cambian: `loadOptions` paginado + `resolveOptions`.
- Hasta ~50,000 opciones fijas (catálogos): arreglo local; la virtualización y el filtro
  precalculado bastan. Declara el arreglo fuera del componente (o con `useMemo`) para
  aprovechar la caché del texto normalizado.
- Usa `pageSize` entre 25 y 100 y devuelve `total` cuando sea barato calcularlo.
- `minSearchLength` de 2–3 en catálogos enormes donde listar sin filtro no aporta.
- `treeselect` necesita el árbol completo (sin paginación); se virtualiza igual.

## Listas

`CnList` (y `CnListItem` suelto) cubre contactos, bandejas de notificaciones, tareas, ajustes y
árboles:

```tsx
<CnList
  title="Notificaciones"
  items={notifications}
  variant="divided"
  selectionMode="multiple"
  selectAll
  searchable
  groupBy={(n) => n.day}
  stickyHeaders
  itemActions={[{ id: "read", label: "Marcar como leída", icon: "done", onClick: markRead }]}
  bulkActions={[{ id: "archive", label: "Archivar", onClick: archive }]}
  hasMore={hasMore}
  onLoadMore={loadMore}
/>
```

- **Aspecto:** variantes `plain`, `divided`, `card` (también en cuadrícula) e `inset`; tres densidades.
- **Contenido de cada elemento:** avatar o ícono, metadato, estado, contador, fecha relativa y acciones.
- **Selección:** simple o múltiple, con "Seleccionar todo", rangos con Shift y acciones masivas.
- **Grupos y árboles:** grupos con encabezados fijos y plegables; elementos anidados.
- **Búsqueda:** sin acentos, con resaltado y ordenamiento.
- **Organización:** reordenar arrastrando o con el teclado; deslizar en pantallas táctiles.
- **Volumen:** "Cargar más" o scroll infinito, y virtualización automática con miles de elementos.
- **Estados:** skeleton, vacío y error con reintento.
- **Teclado y accesibilidad:** completo (flechas, Inicio/Fin, búsqueda por tecleo, Ctrl+A); usa los roles
  de lista, listbox o árbol según el caso.

## Tarjetas de contenido y carruseles

| Componente                             | Para qué                        | Destacado                                                                                                                                                         |
| -------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CnDocCard`                            | Documentos y archivos           | Tipo por mime/extensión, miniatura, versión, estado, progreso de carga, vista previa (imagen, video, PDF), acciones y selección; vistas lista/cuadrícula/compacta |
| `CnProfileCard` / `CnProfileCardGroup` | Personas y sus eventos          | Contacto (correo, teléfono, WhatsApp), cumpleaños/aniversarios/ingresos con cuenta regresiva; grupo por mes y "Hoy / Próximos"                                    |
| `CnSectionCard`                        | Secciones de una página         | Encabezado con acciones, cuerpo plegable animado, pie, estados, secciones anidadas y repetibles                                                                   |
| `CnCarousel`                           | Cualquier contenido en carrusel | Slides por vista según el ancho del contenedor, autoplay accesible, flechas, puntos/progreso/miniaturas, arrastre y teclado                                       |
| `CnContentCarousel`                    | Banners y filas de tarjetas     | Hero con imagen o video, CTA, overlay y relación de aspecto; preset de fila de tarjetas                                                                           |

```tsx
<CnContentCarousel
  slides={[{ id: "1", image: "/banner.jpg", title: "Bienvenida", description: "…", actions: [{ label: "Ver más" }] }]}
/>
<CnProfileCardGroup title="Cumpleaños del mes" people={empleados} month="current" groupByProximity />
```

## Diálogos, paneles, historial y notificaciones

| Componente               | Para qué                                                                                                                                                                          | Cuándo NO usarlo                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `CnDialog` / `useDialog` | Modal general: formularios, detalle de un registro, asistentes, vistas previas. Acciones asíncronas con carga, "¿Descartar cambios?" con `dirty`, tamaños hasta pantalla completa | Para un "sí/no" usa `CnConfirmDialog`; para un aviso pasajero, `CnToast`                               |
| `CnDrawer`               | Panel lateral (izquierda, derecha, abajo) para detalle de una fila, filtros o edición rápida sin perder la página; temporal, persistente o mini, redimensionable                  | Para tareas que deben bloquear la página usa `CnDialog`                                                |
| `CnTimeline`             | Historial, bitácora y seguimiento: agrupado por día, estados completado/actual/pendiente, adjuntos, "Ver más"                                                                     | Para listas seleccionables usa `CnList`; para una bandeja con leídos/no leídos, `CnNotificationCenter` |
| `CnNotificationCenter`   | Bandeja de notificaciones con campana y contador, pestañas, marcar como leído, tiempo real, vista previa flotante y notificaciones del navegador                                  | Para un aviso pasajero usa `CnToast`; para un mensaje fijo, `CnAlert`                                  |

```tsx
const dialog = useDialog();
const ok = await dialog.open({ title: "Editar cliente", content: <ClienteForm />, actions: [...] });

<CnDrawer open={Boolean(row)} title={row?.nombre} onClose={() => setRow(null)} resizable>…</CnDrawer>
<CnNotificationCenter notifications={items} onMarkRead={markRead} onMarkAllRead={markAll} />
```

## Estructura de aplicación

| Componente         | Para qué                                                                                                                                                         | Cuándo NO usarlo                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `CnAppShell`       | Marco de la aplicación: navegación lateral, barra superior, contenido con scroll propio, cajón en móvil (medido en el contenedor) y paleta de comandos conectada | Para el marco de una sola página usa `CnPageContainer` dentro del shell |
| `CnSidebarNav`     | Navegación lateral con grupos plegables, subpáginas, modo mini con tooltips, insignias, página actual y favoritos                                                | Para pocas secciones dentro de una página usa `CnTabs`                  |
| `CnTopBar`         | Barra superior: menú, marca, título, búsqueda con atajo, acciones y menú de usuario; se compacta en anchos chicos                                                | Para el encabezado de una página usa `CnPageContainer`                  |
| `CnCommandPalette` | Ctrl + K: ir a páginas, registros y acciones con el teclado; grupos, recientes y búsqueda remota                                                                 | Para filtrar una lista en pantalla usa `CnSearchField`                  |

```tsx
<CnAppShell
  nav={{
    sections: [
      {
        id: "ventas",
        label: "Ventas",
        items: [{ id: "contactos", label: "Contactos", icon: "contacts", href: "/contactos" }],
      },
    ],
    activeId: "contactos",
    onNavigate: (item, event) => {
      event.preventDefault();
      navigate(item.href!);
    },
  }}
  topBar={{
    title: "Contactos",
    user: {
      name: "Lucía Méndez",
      actions: [{ id: "salir", label: "Cerrar sesión", danger: true, onClick: logout }],
    },
  }}
  commandPalette={{
    commands: [{ id: "nuevo", label: "Crear contacto", group: "Acciones", onSelect: crear }],
  }}
>
  <CnPageContainer title="Contactos">…</CnPageContainer>
</CnAppShell>
```

## Mapas

`CnMap` muestra mapas de Google con estilos.

- **Sin API key:** usa el mapa embebido de siempre, así que nada se rompe.
- **Con API key** (con `CnMapsProvider`): carga la Maps JavaScript API bajo demanda, sin dependencias.

```tsx
<CnMapsProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
  <CnMap center={{ lat: 19.4326, lng: -99.1332 }} markers={sucursales} stylePreset="canek" />
  <CnMap center={centro} styles={jsonDelStylingWizard} /> {/* JSON tal cual del Styling Wizard */}
  <CnMap center={centro} mapId="TU_MAP_ID" /> {/* estilo administrado en la nube */}
</CnMapsProvider>
```

- **Estilos:**
  - `styles` acepta el JSON exportado de [mapstyle.withgoogle.com](https://mapstyle.withgoogle.com/).
  - `mapId` usa el estilo administrado en la nube (Cloud-based maps styling), que es lo que Google recomienda para producción.
  - Hay presets `silver`, `dark`, `night`, `retro`, `minimal` y `canek`. El tema oscuro de Canek se aplica solo.
- **Interacción:**
  - marcadores con tono y ventana de información;
  - ajuste automático a los marcadores;
  - modo selector: arrastrar el marcador o hacer clic en el mapa.
- **Usos:**
  - `CnLocationField` y la ficha de ubicación de la tabla ya lo usan;
  - `getStaticMapUrl` convierte el JSON del Wizard en una imagen estática para imprimir o hacer PDF.
- **Requisitos:** API key restringida por dominio y facturación activa en Google Cloud. Los detalles,
  límites, privacidad y CSP están en `src/components/CnMap/MAPS.md`.

## Calendario de eventos

`CnEventCalendar` muestra eventos en vistas de mes, semana, día, agenda, trimestre y año:

```tsx
<CnEventCalendar
  title="Agenda del equipo"
  events={events}
  categories={[{ id: "meeting", label: "Reuniones", color: "accent" }]}
  holidays={[{ date: "2026-11-16", label: "Día de la Revolución" }]}
  editable
  onEventChange={({ event, start, end }) => save(event.id, start, end)}
  onSlotClick={({ start, end }) => openNewEvent(start, end)}
  onRangeChange={(range) => fetchEvents(range)}
  searchable
  exportable
/>
```

- Eventos de todo el día y de varios días en barras; "+N más" cuando un día tiene muchos eventos.
- En semana y día, los eventos que se traslapan se acomodan en columnas, con línea de la hora actual
  y horario laboral sombreado.
- Recurrencia diaria, semanal, mensual y anual (intervalo, fin, número de repeticiones, excepciones).
- Arrastrar para mover o cambiar la duración (`editable`), seleccionar un rango de horas
  (`onSlotClick`), y filtrar desde la leyenda de categorías y la búsqueda.
- Días festivos y bloqueados, `minDate`/`maxDate`, semana desde lunes, es-MX.
- Exporta a `.ics` (Google Calendar, Outlook), imprime, y tiene pantalla completa, skeleton por vista
  y diseño compacto en móvil.

**Más integraciones y funciones:**

- **Vistas:**
  - `timeline` por recursos (salas, personas, vehículos), con capacidad, disponibilidad y choques de horario;
  - `multiMonth` (de 2 a 12 meses);
  - barra lateral con mini calendario, calendarios y próximos eventos.
- **Varios calendarios** (`sources`): cada uno con su color, se puede mostrar u ocultar y cargarse por rango.
- **Integraciones:**
  - enlaces "Agregar a Google, Outlook, Office 365 o Yahoo";
  - botón "Unirse" para Meet, Zoom, Teams y Webex;
  - "Ver en mapa";
  - importar `.ics` (`onImport`).
- **Creación rápida:**
  - `quickCreate`, un formulario pequeño al hacer clic o arrastrar;
  - `quickAdd`, que entiende frases en español, p. ej. "Reunión con Ana mañana 10:00–11:30 #trabajo".
- **Zonas horarias:** `timeZone` y una segunda zona en columna (`secondaryTimeZone`); semanas ISO;
  horario laboral por día.
- **Edición:**
  - mover y redimensionar con el teclado, deshacer con Ctrl+Z, menú contextual;
  - recurrencias como "segundo lunes" o "último viernes", y elegir si un cambio aplica a "solo este", "este y los siguientes" o "todos".
- **Personalización:** `renderEvent`, `renderDayCell`, `renderEventPopover`, densidad, mapa de calor del
  mes, capacidad por día e impresión en cuadrícula.

## Gráficas

Gráficas sobre **MUI X Charts Community (MIT)**, publicadas en una entrada aparte para que solo las
instale quien las use:

```bash
npm install @mui/x-charts
```

```tsx
import { CnBarChart, CnDonutChart } from "@canek-ui/material-design-system/charts";

<CnBarChart
  title="Ventas vs. meta"
  data={sales}
  xKey="month"
  valueFormat="compactCurrency"
  series={[
    { key: "ventas", label: "Ventas", tone: "primary" },
    { key: "costos", label: "Costos", tone: "accent", gradient: true },
  ]}
  referenceLines={[{ axis: "y", value: 150000, label: "Meta" }]}
  summary={{ value: "$2.1 M", label: "Acumulado", trend: 12.4 }}
  periods
  typeOptions
  zoom
  loading={isLoading}
/>;
```

| Gráfica                                 | Base   | Destacado                                                                                      |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `CnBarChart`                            | MUI X  | Vertical u horizontal, agrupada, apilada o 100 %, etiquetas, gradiente, esquinas redondeadas   |
| `CnLineChart`, `CnAreaChart`            | MUI X  | Curvas, marcadores, punteadas, media móvil, área con gradiente, apilada                        |
| `CnComposedChart`                       | MUI X  | Barras + líneas + áreas con doble eje (`axis: "right"`)                                        |
| `CnHistogram`                           | MUI X  | Distribución de valores crudos en intervalos                                                   |
| `CnPieChart`, `CnDonutChart`            | MUI X  | Pastel, dona, media dona, anillos anidados, total central que se recalcula, "Otros" automático |
| `CnScatterChart`, `CnBubbleChart`       | MUI X  | Formas por serie, burbujas por tamaño, línea de tendencia con R², cuadrantes                   |
| `CnGauge`                               | MUI X  | Semicírculo, arco o círculo; segmentos de color, aguja, meta, mínimo y máximo                  |
| `CnRadarChart`                          | MUI X  | Rejilla poligonal o circular, varias series                                                    |
| `CnSparkline`                           | MUI X  | Línea, área o barras; color por tendencia, extremos, promedio, valor y variación               |
| `CnHeatmap`, `CnCalendarHeatmap`        | Propia | Rejilla o calendario de actividad, escala secuencial o divergente                              |
| `CnFunnelChart`, `CnPyramidChart`       | Propia | Embudo, pirámide o barras; conversión vs. paso anterior y total                                |
| `CnSankeyChart`                         | Propia | Flujos por niveles, resaltado al pasar el cursor                                               |
| `CnCandlestickChart`                    | Propia | Velas OHLC, volumen, medias móviles, retícula                                                  |
| `CnRadialBarChart`, `CnRadialLineChart` | Propia | Anillos de avance; líneas polares para ciclos                                                  |
| `CnTreemap`                             | Propia | Jerárquico con navegación por niveles                                                          |

Las imágenes PNG y SVG incluyen título, subtítulo y leyenda.

Las marcadas como "Propia" cubren lo que en MUI X es Pro o Premium (heatmap, embudo, sankey, velas,
radiales, zoom y exportación) sin licencia ni marca de agua, con el mismo tema, tooltip y leyenda.

**Común a todas** (`CnChartCommonProps`): tarjeta con título, subtítulo, ícono, resumen con tendencia,
pie, acciones, selector de periodo (con rango personalizado), cambio de tipo, actualizar, pantalla
completa y descarga en **PNG, SVG, CSV, XLSX, JSON** o copiar; estados `loading` (skeleton propio),
`error` (con `onRetry`) y vacío; formatos `valueFormat` (`number`, `integer`, `currency`, `percent`,
`compact`, `compactCurrency`, `bytes`, `duration` o función) en es-MX; leyenda que oculta series;
colores por tono de Canek (`tone`) o propios (`colors`).

**Skeletons** (en la entrada principal, sin MUI X): `CnBarChartSkeleton`, `CnLineChartSkeleton`,
`CnAreaChartSkeleton`, `CnComposedChartSkeleton`, `CnScatterChartSkeleton`, `CnPieChartSkeleton`,
`CnDonutChartSkeleton`, `CnGaugeSkeleton`, `CnRadarChartSkeleton`, `CnRadialBarChartSkeleton`,
`CnRadialLineChartSkeleton`, `CnHeatmapSkeleton`, `CnFunnelChartSkeleton`, `CnSankeyChartSkeleton`,
`CnCandlestickChartSkeleton`, `CnTreemapSkeleton`, `CnHistogramSkeleton`, `CnSparklineSkeleton` o
`<CnChartSkeleton kind="donut" />`. Cada uno sigue las variantes de su gráfica (orientación, series,
apilado, segmentos, celdas…), con marco de tarjeta, encabezado y leyenda opcionales y animación
`wave`, `pulse` o `none`.

`CnChartCard` también sirve sola para envolver cualquier contenido con la misma barra y estados.

## Estados de carga

Cada componente tiene su propio skeleton, con la misma forma, medidas y variantes que el componente
real. Se usa de dos maneras:

```tsx
// 1. Prop `skeleton` en el componente: usa sus propias props visuales.
<CnSelectField label="Estado" size="lg" multiple skeleton={isLoading} />
<CnDataTable columns={columns} data={rows} loading={!rows} />   {/* skeleton desde sus columnas */}
<CnForm fields={fields} skeleton={isLoading} />                  {/* un placeholder por tipo de campo */}

// 2. Skeleton suelto: `<Nombre>Skeleton` con las mismas props de variante.
<CnButtonSkeleton variant="outlined" size="sm" startIcon label="Guardar" />
<CnMetricCardSkeleton size="lg" icon trend sparkline sparklineType="area" />
<CnTabsSkeleton tabs={4} variant="pill" icons panel />
```

Hay skeleton para todos los componentes (botón, chip, insignia, avatar y grupo, ícono, bandera,
alerta, estado vacío, tarjeta, pestañas, métrica, página, diálogo, toast, calendario, tabla,
formulario, todos los campos y todas las gráficas). Cada uno es un solo `role="status"` accesible,
acepta `animation` (`wave`, `pulse`, `none`) y respeta `prefers-reduced-motion`.

Sus colores salen de los tokens `--cn-skeleton-base`, `--cn-skeleton-soft`,
`--cn-skeleton-highlight` y `--cn-skeleton-shimmer`, que cambian con `[data-cn-theme="dark"]`.

Para skeletons propios, usa el kit: `CnSkeletonGroup` (la raíz accesible), `CnFieldSkeleton` (un
campo con borde, etiqueta flotante, adornos y filas) y las piezas `SkBlock`, `SkText`, `SkLines` y
`SkLabeled`.

## Temas

`CanekThemeProvider` acepta `mode`:

- `"light"` — tema claro (default)
- `"dark"` — tema oscuro

```tsx
<CanekThemeProvider mode="dark">
  <App />
</CanekThemeProvider>
```

El `mode` establece `data-cn-theme="dark"` en `<html>`, lo cual activa las variantes oscuras de los tokens CSS.

---

## Tokens de diseño

Los tokens se dividen en dos formatos complementarios:

- **CSS variables** en `src/styles/tokens.css` — consumidas por los componentes.
- **Objetos TypeScript** en `src/tokens/` — para lógica de aplicación.

### Sobreescribir tokens por proyecto

```css
/* src/styles/app-tokens.css, importado después de @canek-ui/material-design-system/styles.css */
:root {
  --cn-color-brand-600: #3d5afe;
  --cn-radius-md: 6px;
  --cn-font-sans: "Inter", system-ui, sans-serif;
}
```

### Tokens disponibles

| Grupo      | Prefijo                          | Ejemplo                               |
| ---------- | -------------------------------- | ------------------------------------- |
| Colores    | `--cn-color-*`                   | `--cn-color-brand-600`                |
| RGB (rgba) | `--cn-color-rgb-*`               | `--cn-color-rgb-brand-600`            |
| Spacing    | `--cn-space-*`                   | `--cn-space-4` (16px)                 |
| Radii      | `--cn-radius-*`                  | `--cn-radius-md` (8px)                |
| Shadows    | `--cn-shadow-*`                  | `--cn-shadow-md`                      |
| Tipografía | `--cn-font-*`                    | `--cn-font-sans`, `--cn-font-size-md` |
| Motion     | `--cn-duration-*`, `--cn-ease-*` | `--cn-duration-base` (200ms)          |
| Z-index    | `--cn-z-*`                       | `--cn-z-modal`                        |

---

## Estructura del proyecto

La guía completa de arquitectura y de cómo agregar componentes está en [`AGENTS.md`](./AGENTS.md).

```
canek-ui-design-system/
├── .github/
│   ├── workflows/ci.yml           # CI: npm run verify:all (tipos, lint, pruebas, build, Storybook)
│   ├── workflows/release.yml      # tag vX.Y.Z en main → verify + GitHub Release (+ npm opcional)
│   ├── ISSUE_TEMPLATE/            # error y solicitud de componente (regla de utilidad)
│   └── pull_request_template.md   # definición de terminado
├── .storybook/                    # Storybook 8 (preview con CanekThemeProvider y tokens)
├── docs/                          # GENERADO por npm run docs:catalog: catalog.json, ROADMAP.md, governance/
├── scripts/
│   ├── new-component.mjs          # andamiaje: npm run new:component -- CnNombre --category <cat>
│   ├── docs-catalog.mjs           # regenera README (catálogo), docs/catalog.json y docs/ROADMAP.md
│   └── copy-css.mjs               # copia tokens.css a dist/ después del build
├── src/
│   ├── __governance__/            # pruebas de gobierno: estructura, exports, colores, catálogo, docs
│   ├── catalog/
│   │   ├── entries/*.ts           # "Para qué sirve / Cuándo NO usarlo / Relación con vecinos"
│   │   ├── roadmap.ts             # componentes planeados (genera docs/ROADMAP.md)
│   │   ├── types.ts
│   │   └── index.ts               # CN_CATALOG, catalogDocs() para Storybook
│   ├── components/
│   │   ├── CnNombre/              # CnNombre.tsx, CnNombreSkeleton.tsx, .stories.tsx, .test.tsx, index.ts
│   │   ├── CnSkeleton/            # skeleton-kit.tsx: kit para los skeletons de cada componente
│   │   ├── CnForm/                # motor de formularios (engine, validación, secciones, estado)
│   │   ├── CnCharts/              # charts-index.ts se publica en /charts
│   │   ├── CnRichTextField/       # se publica en /rich-text
│   │   └── …
│   ├── utils/                     # campos, fechas, números, máscaras, archivos, listas grandes, tonos
│   ├── styles/tokens.css          # CSS variables --cn-* (claro + oscuro)
│   ├── theme/                     # CanekThemeProvider, createCanekTheme
│   ├── tokens/                    # tokens como objetos TS
│   ├── index.ts                   # entrada principal
│   ├── charts.ts                  # entrada /charts (@mui/x-charts)
│   └── rich-text.tsx              # entrada /rich-text (tiptap)
├── AGENTS.md                      # guía para personas y agentes de IA
├── CLAUDE.md                      # apunta a AGENTS.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── .editorconfig  .gitattributes  .nvmrc  .prettierrc  eslint.config.js
├── package.json  tsconfig.json  vite.config.ts  vitest.config.ts  vitest.setup.ts
└── README.md
```

---

## Desarrollo

### Requisitos

- **Node.js** `>=20.0.0` (probado con Node 22 y 26).
- **npm** `>=10.0.0`.
- **Git** (cualquier versión reciente).
- **VSCode** recomendado. El repo incluye `.editorconfig` y configs de Prettier/ESLint que se aplican automáticamente.

Verificar versiones:

```bash
node --version
npm --version
git --version
```

### Setup inicial

```bash
git clone git@github.com:CanekDevs/canek-ui-design-system.git
cd canek-ui-design-system
npm install
```

En Windows, si `npm install` muestra warnings de `install-scripts` (npm 11+), aprueba los scripts de esbuild:

```bash
npm install-scripts approve esbuild
npm rebuild esbuild
```

### Scripts disponibles

| Comando                   | Qué hace                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| `npm run storybook`       | Levanta Storybook en `http://localhost:6006` (desarrollo visual).         |
| `npm run dev`             | Alias de `storybook`.                                                     |
| `npm run build`           | Genera `dist/` (JS, CJS, tipos, tokens.css).                              |
| `npm run build-storybook` | Genera el Storybook estático en `storybook-static/`.                      |
| `npm run test`            | Ejecuta la suite con Vitest (una vez).                                    |
| `npm run test:watch`      | Ejecuta Vitest en modo watch (recomendado al iterar).                     |
| `npm run lint`            | Ejecuta ESLint sobre todo el proyecto.                                    |
| `npm run format`          | Formatea con Prettier.                                                    |
| `npm run format:check`    | Verifica formato sin modificar archivos.                                  |
| `npm run typecheck`       | Ejecuta `tsc --noEmit`.                                                   |
| `npm run verify`          | typecheck + lint + test + build.                                          |
| `npm run verify:all`      | `verify` + build de Storybook (lo mismo que corre CI).                    |
| `npm run new:component`   | Andamiaje de un componente: `-- CnNombre --category <cat>`.               |
| `npm run docs:catalog`    | Regenera el catálogo del README, `docs/catalog.json` y `docs/ROADMAP.md`. |

### Storybook

Storybook es la fuente de verdad visual del design system. Cada componente vive con sus stories al lado:

```bash
npm run storybook
```

Abre `http://localhost:6006`. Cada componente tiene al menos una story `Default` más stories de variantes, tamaños, colores y estados.

### Verificación antes de commitear

```bash
npm run docs:catalog   # si cambiaste el catálogo o la hoja de ruta
npm run verify:all     # tipos, lint, pruebas (incluye gobierno), build y Storybook
```

Todo debe pasar. Si algo falla, no se commitea.

---

## Convenciones

### Commits

Formato:

```
<tipo>(<scope>): <descripción corta> - por: <Nombre Apellido>
```

Tipos válidos: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`, `ci`, `perf`.

Scopes válidos: el nombre del componente en kebab-case (`button`, `icon`, `chip`, `theme`, `tokens`) o `repo` para cambios globales.

Ejemplos:

```
feat(icon): add CnIcon with registry and semantic tokens - por: Angel Rodriguez
fix(button): respect loadingPosition for center spinner - por: Angel Rodriguez
docs: expand README with developer setup - por: Angel Rodriguez
chore(deps): bump mui to 7.3.11 - por: Angel Rodriguez
```

### Branches

| Rama             | Propósito                                                |
| ---------------- | -------------------------------------------------------- |
| `develop`        | Rama por defecto. Integra el trabajo; los PRs van aquí.  |
| `main`           | Solo releases validados (PR de release desde `develop`). |
| `feat/<nombre>`  | Nueva funcionalidad.                                     |
| `fix/<nombre>`   | Corrección de bug.                                       |
| `chore/<nombre>` | Mantenimiento, dependencias, configs.                    |
| `docs/<nombre>`  | Solo documentación.                                      |

Ejemplo: `feat/cn-chip`, `fix/icon-spin-direction`, `chore/upgrade-storybook`. Cada cambio en una
rama nueva desde `develop` actualizado; no se reutilizan ramas ya fusionadas.

### Estilo de código

- **JSDoc breve en español** en props y tipos públicos (se ve en Storybook). Evita comentarios que narran el código: si un bloque lo necesita, refactorízalo.
- **`type` en lugar de `interface`** en TypeScript.
- **Funciones flecha** en lugar de `function` (excepto `forwardRef` que lo requiere).
- **`const`** sobre `let`.
- **Desestructuración** de props.
- **Alias `@/`** para imports absolutos dentro de `src/`.
- **Cero emojis** en código, commits o docs.

### Componentes

Cada componente nuevo se crea con `npm run new:component -- CnNombre --category <categoria>`, que
genera esta estructura y lo registra en el catálogo, en `src/index.ts` y en el CHANGELOG:

```
src/components/CnNombre/
├── CnNombre.tsx            # componente con prop `skeleton`
├── CnNombreSkeleton.tsx    # skeleton con el kit de CnSkeleton
├── CnNombre.stories.tsx    # catalogDocs("CnNombre"), Default, Skeleton, Responsive (320/480/1200)
├── CnNombre.test.tsx       # comportamiento, a11y, teclado, casos límite
└── index.ts
```

La definición de terminado completa está en [`AGENTS.md`](./AGENTS.md#definición-de-terminado-de-un-componente).

---

## Flujo de trabajo

| Rama                                   | Para qué                                                             | Quién sube                            |
| -------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| `develop`                              | **Rama por defecto.** Integra el trabajo del día a día.              | PR desde `feat/*`, `fix/*`, `chore/*` |
| `main`                                 | Solo código probado y validado; cada merge es una versión publicada. | PR de release desde `develop`         |
| `feat/*`, `fix/*`, `docs/*`, `chore/*` | Un cambio por rama, siempre desde `develop` actualizado.             | Quien desarrolla                      |

### 1. Crear rama desde `develop`

```bash
git checkout develop
git pull
git checkout -b feat/cn-chip
```

### 2. Desarrollar

```bash
npm run storybook     # iterar en Storybook
npm run test:watch    # tests mientras trabajas
```

### 3. Verificar todo

```bash
npm run docs:catalog   # si cambió el catálogo o la hoja de ruta
npm run verify:all     # typecheck + lint + test + build + Storybook (igual que CI)
```

### 4. Commitear (Conventional Commits)

```bash
git add src/components/CnChip src/index.ts
git commit -m "feat(chip): add CnChip with color variants - por: Angel Rodriguez"
```

| Prefijo                                | Uso                                 | Efecto en la versión                            |
| -------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| `feat`                                 | Componente, prop o capacidad nueva  | `minor`                                         |
| `fix`                                  | Corrección de un error              | `patch`                                         |
| `perf`, `refactor`                     | Mejora interna sin cambiar la API   | `patch`                                         |
| `docs`, `test`, `chore`, `ci`, `style` | Sin cambios en el paquete publicado | ninguno                                         |
| `feat!` / `BREAKING CHANGE:`           | API incompatible                    | `minor` mientras sea `0.x`; `major` desde `1.0` |

Nunca `git add .` si hay archivos que no quieres commitear. Siempre archivos específicos por ruta.

### 5. Push y PR hacia `develop`

```bash
git push -u origin feat/cn-chip
```

Abre el PR hacia **`develop`** (nunca directo a `main`). CI valida tipos, lint, tests, build y
Storybook. Una vez aprobado: **Squash and merge** y borra la rama.

### 6. Release: `develop` → `main`

Cuando lo acumulado en `develop` está probado y validado (Storybook revisado, CI en verde):

1. En `develop`, decide la versión según los commits desde el último tag (tabla de arriba),
   agrega la entrada en `CHANGELOG.md` y sube la versión **sin** crear tag todavía:

   ```bash
   npm version minor --no-git-tag-version   # o patch
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore(release): v0.14.0 - por: Angel Rodriguez"
   git push
   ```

2. Abre un PR `develop` → `main` titulado `release: v0.14.0` y haz **merge commit** (no squash).
3. Publica en npm desde `main` y sube el tag; el workflow **Release** crea el GitHub Release:

   ```bash
   git checkout main && git pull
   npm publish --access public   # pide el OTP de 2FA
   git tag -a v0.14.0 -m "v0.14.0"
   git push origin v0.14.0
   ```

4. Regresa `main` a `develop` para que queden iguales: `git checkout develop && git merge main && git push`.

---

## Publicación

Al subir un tag `vX.Y.Z` que esté en `main`, el workflow `.github/workflows/release.yml` comprueba
que el tag coincide con `package.json`, corre `npm run verify` y crea el GitHub Release con las
notas del `CHANGELOG.md`.

**npm:** hoy se publica a mano desde `main` (`npm publish --access public`, con el OTP de 2FA). Si
algún día se guarda un token de publicación como secret `NPM_TOKEN` en GitHub, el mismo workflow
publica solo (con _provenance_) y omite las versiones que ya estén en npm.

### Semantic versioning

| Cambio                             | Versión                               |
| ---------------------------------- | ------------------------------------- |
| Breaking change (API incompatible) | `minor` en `0.x`; `major` desde `1.0` |
| Nuevo componente, prop o capacidad | `minor`                               |
| Bug fix, corrección interna        | `patch`                               |

Cuando la API de los componentes más usados esté estable y lista para producción, se salta a `v1.0.0`.

### Publicar a mano (solo si el workflow no está disponible)

```bash
git checkout main && git pull
npm run verify
npm publish --access public   # pide el OTP de 2FA
```

### Verificar la publicación

- `https://www.npmjs.com/package/@canek-ui/material-design-system`
- `npm view @canek-ui/material-design-system`

### Si algo sale mal

**No se puede reemplazar una versión ya publicada.** Depreca y publica un `patch`:

```bash
npm deprecate @canek-ui/material-design-system@0.13.0 "Bug en CnX. Usar 0.13.1"
```

---

## Contribuir

Lee [`CONTRIBUTING.md`](./CONTRIBUTING.md) (resumen) y [`AGENTS.md`](./AGENTS.md) (guía completa
para personas y agentes de IA). En corto:

1. **Utilidad primero**: busca en el [catálogo](#catálogo-de-componentes) y en
   [`docs/ROADMAP.md`](./docs/ROADMAP.md); si un componente existente puede cubrir el caso con una
   prop o variante, se extiende.
2. Rama nueva desde `develop` y sigue el [flujo de trabajo](#flujo-de-trabajo).
3. PR hacia `develop` con la plantilla completa (es la definición de terminado), capturas de
   Storybook y el issue relacionado.

### Agregar un componente nuevo

```bash
npm run new:component -- CnNuevo --category formularios   # --dry-run para simular
```

Luego completa lo que imprime el script:

- [ ] Entrada del catálogo con _Para qué sirve_, _Cuándo NO usarlo_ y _Relación con vecinos_.
- [ ] Historias con variantes, estados y `Responsive` revisada a 320 / 480 / 1200 px con datos extremos.
- [ ] Skeleton fiel y prop `skeleton`.
- [ ] Pruebas de comportamiento, accesibilidad, teclado y casos límite.
- [ ] Exports en la entrada correcta, sección en este README y línea en `CHANGELOG.md`.
- [ ] `npm run docs:catalog` y `npm run verify:all` en verde.

---

## Licencia

MIT © [Canek](https://canek.mx). Ver [LICENSE](./LICENSE).
