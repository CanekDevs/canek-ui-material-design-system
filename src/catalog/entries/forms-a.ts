import type { CnCatalogEntry } from "../types";

/** Formularios: CnForm, skeleton y campos (A–L). */
export const CATALOG_FORMS_A: CnCatalogEntry[] = [
  {
    name: "CnForm",
    category: "formularios",
    domains: ["general", "erp", "crm", "cms", "ecommerce", "rrhh", "reservas", "pagos"],
    status: "estable",
    summary:
      "Motor de formularios declarativo: describe los campos en un arreglo y obtén estado, validación, diseño y envío.",
    purpose:
      "Construir altas, ediciones y filtros sin cablear cada campo a mano. A partir de `fields` (más de 40 tipos: texto, números, fechas, archivos, direcciones, repetidores…) arma la cuadrícula en 1 a 4 columnas, valida con reglas síncronas y asíncronas (`blur`, `change` o `submit`), muestra u oculta campos con `visibleWhen`, resuelve dependencias entre campos y envía como JSON o `FormData` (archivos incluidos). Tiene cuatro variantes (`simple`, `sectioned`, `tabbed`, `wizard`), modo `inline` o `modal`, errores del servidor por campo, resumen de errores, aviso de cambios sin guardar, acciones fijas y un `formRef` para enviar, reiniciar o leer valores desde fuera. Los campos se pueden usar sueltos y `registerFormFieldType` permite registrar tipos propios.",
    whenNot:
      "Para un solo control aislado (un buscador, un interruptor en una barra) usa el campo directamente: `CnSearchField`, `CnSwitchField`, `CnSelectField`. Para editar datos en filas de una tabla usa `CnDataTable`; para una confirmación de sí/no usa `CnConfirmDialog`. Mientras carga la estructura del formulario usa su prop `skeleton` o `CnFormSkeleton`, no un spinner.",
    neighbors:
      "Orquesta todos los campos `Cn*Field` (`CnTextField`, `CnDateField`, `CnFileField`, `CnRepeaterField`…) con el mismo contrato de valor, error y reglas. En modo `modal` se dibuja dentro de un diálogo propio, así que no hace falta envolverlo en `CnDialog`; dentro de un panel lateral se combina con `CnDrawer`. `CnFormSkeleton` reproduce su forma (secciones, pestañas, pasos) y es lo que dibuja con `skeleton`. Para agrupar visualmente bloques fuera del formulario usa `CnSectionCard`.",
    related: [
      "CnFormFieldControl",
      "registerFormFieldType",
      "registerValidator",
      "useFieldValidation",
      "validateFieldValue",
      "buildFormData",
      "parseServerErrors",
    ],
  },
  {
    name: "CnFormSkeleton",
    category: "retroalimentacion",
    domains: ["general", "erp", "crm", "cms", "ecommerce", "rrhh"],
    status: "estable",
    summary:
      "Marcador de carga con la forma exacta de un formulario: encabezado, campos por tipo, secciones, pestañas, pasos y botones.",
    purpose:
      "Evitar saltos de diseño mientras llegan los datos de un formulario de edición o su configuración. Acepta los mismos `fields`, `sections`, `tabs` o `steps` que `CnForm` y dibuja cada campo con la silueta de su tipo y su ancho de columna (casillas, radios, sliders, áreas de texto, archivos), respetando `visibleWhen` si recibe `formValues`. Sin campos, genera filas genéricas con `rows` y `columns`.",
    whenNot:
      "Si ya usas `CnForm`, pasa `skeleton` o `isLoading` al formulario en lugar de montar este componente aparte. Para un solo campo usa la prop `skeleton` del campo (p. ej. `CnDateField`); para tablas, `CnDataTable` con su estado de carga; para bloques de contenido genérico, `CnSkeleton`.",
    neighbors:
      "Es la vista de carga de `CnForm` y comparte sus tipos de variante, tamaño y alineación de acciones. Cada campo tiene además su skeleton propio (`CnDateFieldSkeleton`, `CnFileFieldSkeleton`…) para cuando se usan sueltos. `CnSkeleton` es la primitiva genérica sobre la que se apoya.",
  },
  {
    name: "CnAddressField",
    category: "formularios",
    domains: ["erp", "crm", "ecommerce", "rrhh", "pagos", "reservas"],
    status: "beta",
    summary:
      "Domicilio postal completo en un solo campo: calle, números, código postal, colonia, municipio, estado y país.",
    purpose:
      "Capturar domicilios fiscales, de entrega o de empleados con la estructura mexicana sin armar siete campos a mano. Valida el código postal de 5 dígitos, con `onPostalCodeLookup` autocompleta municipio y estado y convierte la colonia en lista si el código tiene varias, permite elegir qué partes se ven (`fields`) y cuáles son obligatorias (`requiredParts`), e incluye el catálogo de estados (o texto libre con `states={false}`). Su valor es un objeto con cada parte.",
    whenNot:
      "Para un punto geográfico (latitud/longitud, pin en mapa) usa `CnLocationField`; para elegir solo el país usa `CnCountryField`; para una dirección de una línea sin estructura usa `CnTextField`. Si necesitas varias direcciones (entrega, facturación…) envuélvelo en `CnRepeaterField`.",
    neighbors:
      "`CnLocationField` es su complemento: uno guarda la dirección postal y el otro las coordenadas; en sucursales o entregas suelen ir juntos. `CnCountryField` cubre el país cuando la dirección es internacional. Dentro de `CnForm` es el tipo `address` y sus reglas (`buildAddressRules`) informan qué partes faltan.",
    related: ["CnAddressFieldSkeleton", "buildAddressRules", "getMissingAddressParts", "MX_STATES"],
  },
  {
    name: "CnAutocompleteField",
    category: "formularios",
    domains: ["general", "erp", "crm", "ecommerce", "pos", "rrhh"],
    status: "estable",
    summary:
      "Campo con búsqueda mientras se escribe para elegir una o varias opciones de listas largas o remotas.",
    purpose:
      "Elegir clientes, productos, ciudades o empleados entre cientos de miles de registros escribiendo parte del nombre. Filtra sin acentos, virtualiza la lista (más de 100 opciones), busca en el servidor con `loadOptions` (debounce, cancelación, paginación con scroll infinito y caché compartida por `cacheKey`), resuelve las etiquetas de valores ya guardados al editar (`resolveOptions`), permite crear opciones nuevas (`onCreateOption`), valores libres (`freeSolo`), selección múltiple con chips y opciones con avatar, ícono o bandera.",
    whenNot:
      "Con pocas opciones conocidas (menos de ~15) usa `CnSelectField`, o `CnRadioGroupField` / `CnSegmentedField` si caben a la vista. Para datos jerárquicos (categorías, centros de costo) usa `CnTreeSelectField`; para países usa `CnCountryField`, que ya trae la lista con banderas. Para etiquetas libres sin catálogo usa `CnTagsField`; para mover muchos elementos entre dos listas, `CnTransferListField`; para buscar y filtrar una pantalla (no capturar un valor) usa `CnSearchField`.",
    neighbors:
      "`CnSelectField` es la opción para listas cortas o cuando no se escribe; ambos comparten virtualización y `loadOptions`. `CnCountryField` es un autocompletado preconfigurado. `CnTagsField` se parece a su modo `multiple` + `freeSolo`, pero está pensado para etiquetas sin catálogo. Dentro de `CnForm` es el tipo `autocomplete` y admite selects en cascada con `loadOptionsDeps`.",
    related: [
      "CnAutocompleteFieldSkeleton",
      "CnVirtualListbox",
      "CnListStatus",
      "normalizeSearchText",
    ],
  },
  {
    name: "CnCheckboxField",
    category: "formularios",
    domains: ["general"],
    status: "estable",
    summary:
      "Casilla única (booleano) o grupo de casillas (arreglo) con opción de seleccionar todo.",
    purpose:
      'Aceptar términos y consentimientos con una sola casilla obligatoria, o marcar varias opciones independientes de una lista corta (canales de contacto, permisos, días de servicio). Sin `options` su valor es `true`/`false`; con `options` es un arreglo y puede mostrar "Seleccionar todo", acomodarse en fila o columna y mostrar una descripción bajo la etiqueta.',
    whenNot:
      "Para un ajuste que se aplica de inmediato (activar notificaciones) usa `CnSwitchField`. Si solo se puede elegir una opción usa `CnRadioGroupField` o `CnSegmentedField`. Con más de ~8 opciones o un catálogo largo usa `CnSelectField` múltiple o `CnAutocompleteField`; si cada opción necesita descripción, ícono o precio, `CnChoiceCardsField` con `multiple`. Para días de la semana usa `CnWeekdaysField`.",
    neighbors:
      "`CnSwitchField` es su par para ajustes inmediatos; `CnRadioGroupField` es la versión de selección única. `CnChoiceCardsField` en modo `multiple` es la versión con tarjetas ricas. Dentro de `CnForm` es el tipo `checkbox`.",
    related: ["CnCheckboxFieldSkeleton"],
  },
  {
    name: "CnChoiceCardsField",
    category: "formularios",
    domains: ["ecommerce", "reservas", "pagos", "landing", "general"],
    status: "estable",
    summary:
      "Selección única o múltiple presentada como tarjetas con ícono, descripción y dato destacado.",
    purpose:
      "Elegir entre pocas opciones que el usuario necesita comparar: método de envío, plan de suscripción, forma de pago, tipo de cuenta. Cada tarjeta muestra ícono, título, descripción y un `meta` (precio, plazo), se acomoda en 1 a 4 columnas (una en móvil), admite selección múltiple, deseleccionar y contenido propio por tarjeta.",
    whenNot:
      "Para opciones cortas sin explicación usa `CnRadioGroupField` (única) o `CnCheckboxField` (múltiple); para 2 a 5 opciones compactas tipo interruptor, `CnSegmentedField`. Con más de ~8 opciones o un catálogo dinámico usa `CnSelectField` o `CnAutocompleteField`. Para mostrar información (no elegir) usa `CnCard`.",
    neighbors:
      "Es la versión rica de `CnRadioGroupField` y, con `multiple`, de `CnCheckboxField`: mismo valor, más espacio y contexto. `CnSegmentedField` es su alternativa compacta. Dentro de `CnForm` es el tipo `choicecards`.",
    related: ["CnChoiceCardsFieldSkeleton"],
  },
  {
    name: "CnCodeField",
    category: "formularios",
    domains: ["general", "cms", "ia", "erp"],
    status: "beta",
    summary:
      "Editor de código monoespaciado con números de línea, sangría con Tab y validación/formateo de JSON.",
    purpose:
      'Capturar configuración técnica dentro de un formulario: JSON de integraciones, plantillas, consultas SQL, prompts o fragmentos de texto plano. Numera líneas, sangra con Tab/Shift+Tab (y se sale con Esc + Tab), ajusta o desplaza líneas largas, crece entre `minRows` y `maxRows` y, con `language="json"`, valida la sintaxis señalando el error y ofrece un botón "Formatear".',
    whenNot:
      "Para texto con formato para personas (negritas, listas, enlaces) usa `CnRichTextField`; para texto largo normal, `CnTextField` multilínea. Para pares clave/valor sencillos (encabezados, atributos) usa `CnKeyValueField`, que no obliga al usuario a escribir JSON.",
    neighbors:
      "`CnKeyValueField` es la alternativa guiada cuando el JSON solo es un objeto plano; `CnRichTextField` cubre el contenido editorial. Dentro de `CnForm` es el tipo `code`.",
    related: ["CnCodeFieldSkeleton", "buildCodeRules", "formatJson", "getJsonError"],
  },
  {
    name: "CnColorField",
    category: "formularios",
    domains: ["cms", "landing", "general", "ecommerce"],
    status: "estable",
    summary: "Selector de color hexadecimal con paleta sugerida y captura manual opcional.",
    purpose:
      "Elegir el color de una marca, etiqueta, categoría o evento de calendario. Ofrece una paleta (`presets`, por defecto la de Canek), normaliza y valida el valor hexadecimal y permite escribirlo a mano o restringirse solo a la paleta (`allowInput={false}`).",
    whenNot:
      "Para elegir una variante de producto por color (con nombre y existencias) usa `CnChoiceCardsField` o `CnSelectField` con opciones; para solo mostrar un color usa `CnChip` o `CnBadge`.",
    neighbors:
      "Se apoya en `CnTextField` para la captura manual. Su valor suele dar color a `CnChip` o `CnBadge`. Dentro de `CnForm` es el tipo `color`.",
    related: ["CnColorFieldSkeleton", "COLOR_RULE", "DEFAULT_COLOR_PRESETS", "normalizeHex"],
  },
  {
    name: "CnCountryField",
    category: "formularios",
    domains: ["general", "ecommerce", "crm", "pagos", "rrhh"],
    status: "estable",
    summary:
      "Autocompletado de países con bandera, nombres localizados y países prioritarios al inicio.",
    purpose:
      "Elegir país (o varios) por su código ISO sin mantener listas propias: nacionalidad, residencia fiscal, países de operación o de envío. Trae todos los países con bandera, nombres en el idioma de `locale`, permite limitarlos (`countries`) y fijar los más usados arriba (`priority`), con búsqueda sin acentos y selección múltiple.",
    whenNot:
      "Para un teléfono con lada usa `CnPhoneField`, que ya incluye el selector de país; para un domicilio completo, `CnAddressField`. Para estados, ciudades u otras listas usa `CnAutocompleteField` o `CnSelectField`. Para solo mostrar la bandera usa `CnFlagIcon`.",
    neighbors:
      "Es un `CnAutocompleteField` preconfigurado: hereda sus props (múltiple, virtualización, skeleton). Comparte catálogo de países con `CnPhoneField` y banderas con `CnFlagIcon`. Dentro de `CnForm` es el tipo `country`.",
    related: ["CnCountryFieldSkeleton", "getCountryOptions", "ISO_COUNTRY_CODES"],
  },
  {
    name: "CnCurrencyField",
    category: "formularios",
    domains: ["erp", "pos", "pagos", "ecommerce", "crm"],
    status: "estable",
    summary:
      "Importe monetario con símbolo, separadores de miles, decimales de la moneda y selector de moneda opcional.",
    purpose:
      "Capturar precios, montos de pago, presupuestos o salarios mostrando el importe formateado mientras se escribe y guardando un número limpio. La moneda (ISO 4217) define símbolo y decimales y se muestra oculta, de solo lectura o como selector editable (`currencySelectorMode`) con su propio valor controlado.",
    whenNot:
      "Para cantidades sin moneda (piezas, porcentajes, pesos) usa `CnNumberField`; para un rango de precios en filtros usa `CnNumberRangeField`. Para identificadores con formato fijo (CLABE, tarjeta, RFC) usa `CnMaskedField`, no un campo numérico.",
    neighbors:
      "Está construido sobre `CnNumberField` (mismos límites, pasos y teclado); `CnNumberRangeField` cubre rangos y `CnMaskedField` los códigos con patrón. Dentro de `CnForm` es el tipo `currency`.",
    related: ["CnCurrencyFieldSkeleton", "getCurrencySymbol"],
  },
  {
    name: "CnDateField",
    category: "formularios",
    domains: ["general", "erp", "crm", "rrhh", "reservas", "pagos"],
    status: "estable",
    summary:
      "Fecha, hora, fecha y hora, mes o año con máscara de captura y calendario o reloj desplegable.",
    purpose:
      'Capturar un instante puntual (fecha de nacimiento, vencimiento, cita, mes de cierre) tecleando con máscara o eligiendo en el calendario. Un solo componente cubre `date`, `time`, `datetime`, `month` y `year` y siempre entrega un texto ISO local sin zona horaria. Admite mínimos y máximos, días deshabilitados, horario laboral (`minTime`/`maxTime`), pasos de minutos, reloj de 12 h, formato de presentación propio ("mayo de 2024"), botón "Hoy", fechas resaltadas y números de semana.',
    whenNot:
      'Para un periodo con inicio y fin usa `CnDateRangeField`; para un horario de inicio a fin dentro del día, `CnTimeRangeField`; para una cantidad de tiempo ("1 h 30 min") que no es un momento del calendario, `CnDurationField`. Para horarios semanales recurrentes usa `CnScheduleField` o `CnWeekdaysField`, y para un calendario siempre visible, `CnCalendar` o `CnEventCalendar`.',
    neighbors:
      "Usa `CnCalendar` como selector desplegable; `CnDateRangeField` (misma carpeta) es su versión de rango y `CnTimePanel` el panel de horas que comparten. `CnDurationField` mide lapsos y `CnTimeRangeField` acota horas, así que no se sustituyen entre sí. Dentro de `CnForm` son los tipos `date`, `time`, `datetime`, `month` y `year`.",
    related: [
      "CnDateFieldSkeleton",
      "CnTimePanel",
      "buildDateRangeRules",
      "resolveDateBounds",
      "toLocalIsoValue",
    ],
  },
  {
    name: "CnDateRangeField",
    folder: "CnDateField",
    category: "formularios",
    domains: ["dashboards", "erp", "crm", "reservas", "pagos", "rrhh"],
    status: "estable",
    summary:
      "Rango de fechas de inicio a fin con calendario de selección y atajos (últimos 7 días, este mes…).",
    purpose:
      "Filtrar reportes y tableros por periodo o capturar estancias, vacaciones y vigencias. El valor es un par `[inicio, fin]` en ISO; trae atajos predefinidos o propios (`presets`), bloquea pasado o futuro, limita la duración máxima (`maxDays`) y valida que el fin no sea anterior al inicio.",
    whenNot:
      "Para una sola fecha usa `CnDateField`; para un rango de horas dentro del día, `CnTimeRangeField`; para un rango numérico (precios, cantidades), `CnNumberRangeField`. Para reservar sobre disponibilidad visible usa `CnEventCalendar`.",
    neighbors:
      "Comparte máscara, formatos y calendario con `CnDateField` y usa `CnCalendar` en modo rango. En filtros de `CnDataTable` y tableros suele ir junto a `CnSelectField`. Dentro de `CnForm` es el tipo `daterange`.",
    related: ["CnDateRangeFieldSkeleton", "buildDateRangeValueRules", "DEFAULT_DATE_RANGE_PRESETS"],
  },
  {
    name: "CnDurationField",
    category: "formularios",
    domains: ["erp", "reservas", "rrhh", "general"],
    status: "beta",
    summary:
      "Cantidad de tiempo en días, horas, minutos o segundos, guardada como un número de minutos o segundos.",
    purpose:
      "Capturar cuánto dura algo sin pedir cuentas al usuario: duración de un servicio o cita, tiempo estimado de una tarea, tiempo de preparación, SLA. Divide el valor en las unidades elegidas, ofrece atajos (15 min, 1 h, 1 día…), respeta mínimos y máximos y entrega un solo número (`valueUnit`) fácil de sumar o guardar.",
    whenNot:
      'Para una hora del día ("14:30") usa `CnDateField` con `type="time"`; para un horario de inicio a fin, `CnTimeRangeField`; para un periodo entre dos fechas, `CnDateRangeField`. Para cantidades que no son tiempo usa `CnNumberField`.',
    neighbors:
      "`CnTimeRangeField` define cuándo ocurre algo y `CnDurationField` cuánto dura; en reservas suelen ir juntos con `CnScheduleField`. Dentro de `CnForm` es el tipo `duration`.",
    related: ["CnDurationFieldSkeleton", "buildDurationRules", "formatDuration", "splitDuration"],
  },
  {
    name: "CnFileField",
    category: "formularios",
    domains: ["general", "erp", "crm", "cms", "ecommerce", "rrhh"],
    status: "estable",
    summary:
      "Campo para elegir archivos: arrastrar, seleccionar, pegar o usar la cámara, con validación, vista previa y reordenamiento.",
    purpose:
      "Adjuntar documentos, fotos de producto, comprobantes o avatares dentro de un formulario. Valida tipo (`accept`), tamaño por archivo y total, cantidad y dimensiones de imagen; muestra miniaturas y metadatos, abre un visor, permite reordenar, marcar el principal y descargar; muestra progreso y reintento si el consumidor sube los archivos (`fileStatus`, `onFilesAdded`) y combina archivos nuevos (`File`) con existentes (`CnExistingFile`). Tiene variantes `dropzone`, `button`, `compact`, `grid`, `card`, `avatar` y `masonry`.",
    whenNot:
      "Para mostrar documentos ya guardados (repositorios, adjuntos de un registro) usa `CnDocCard`; para firmas a mano alzada, `CnSignatureField`; para una galería de solo consulta, `CnCarousel`; para insertar imágenes dentro de un texto con formato, `CnRichTextField`.",
    neighbors:
      'Las variantes `dropzone` y `button` dibujan cada archivo con `CnDocCard` en lista y `card` con `CnDocCard` en cuadrícula, así que un archivo se ve igual antes y después de guardarse; con `readOnly` el campo es exactamente una lista o cuadrícula de `CnDocCard`. `compact` (chips), `grid`/`masonry` (galería) y `avatar` son visuales propios. Junto con `CnDocCard` comparte tipos, íconos, URLs seguras y metadatos de `src/utils/file-utils.ts`. Dentro de `CnForm` es el tipo `file`; con `submitMode="auto"` el formulario se envía como `FormData` cuando hay archivos.',
    related: ["CnFileFieldSkeleton", "FileLightbox", "downloadFile", "isViewableFile"],
  },
  {
    name: "CnKeyValueField",
    category: "formularios",
    domains: ["ecommerce", "cms", "erp", "general"],
    status: "estable",
    summary: "Lista editable de pares clave/valor de texto, como arreglo ordenado u objeto.",
    purpose:
      "Capturar atributos libres sin definir un esquema: especificaciones de producto, metadatos, encabezados HTTP, variables de entorno, parámetros de una integración. Agrega y quita filas, sugiere claves, limita filas (`maxRows`), detecta claves vacías o repetidas y entrega un arreglo `{ key, value }` o un objeto (`valueFormat`).",
    whenNot:
      "Si cada fila tiene varios campos tipados (cantidad, fecha, select) usa `CnRepeaterField`; si los atributos son siempre los mismos, campos normales en `CnForm`. Para una estructura anidada o un JSON completo usa `CnCodeField`; para etiquetas sueltas sin valor, `CnTagsField`.",
    neighbors:
      'Es la versión ligera de `CnRepeaterField` (dos textos por fila, sin subformulario). `CnCodeField` con `language="json"` cubre objetos complejos. Dentro de `CnForm` es el tipo `keyvalue`.',
    related: ["CnKeyValueFieldSkeleton", "findKeyValueIssues", "KEY_VALUE_RULE"],
  },
  {
    name: "CnLocationField",
    category: "formularios",
    domains: ["erp", "reservas", "ecommerce", "crm", "pos"],
    status: "beta",
    summary:
      'Coordenadas geográficas (latitud/longitud) con mapa de vista previa, pin arrastrable y "Usar mi ubicación".',
    purpose:
      "Ubicar sucursales, puntos de entrega, visitas de campo o eventos con precisión. Captura latitud y longitud a mano o con la geolocalización del navegador, muestra el punto en un mapa (interactivo con API key: clic o arrastre del pin) con enlace para abrirlo, valida las coordenadas, redondea a `decimals` y opcionalmente guarda una dirección o referencia de texto.",
    whenNot:
      "Para un domicilio postal estructurado (calle, colonia, código postal) usa `CnAddressField`; para solo mostrar ubicaciones o varias marcas, `CnMap`; para elegir país, `CnCountryField`.",
    neighbors:
      "Usa `CnMap` para la vista previa. `CnAddressField` es su complemento postal: en altas de sucursales suelen ir juntos. Dentro de `CnForm` es el tipo `location`.",
    related: [
      "CnLocationFieldSkeleton",
      "buildLocationRules",
      "isValidCoordinates",
      "getGoogleMapsEmbedUrl",
    ],
  },
  {
    name: "CnActivityComposer",
    category: "formularios",
    domains: ["crm", "erp", "rrhh"],
    status: "beta",
    summary: "Registrar nota, llamada, correo, reunión o tarea con plantillas y menciones con @.",
    purpose:
      "Capturar rápido una interacción con un cliente, proveedor o empleado sin salir de su ficha. Tiene pestañas por tipo de actividad y cada tipo agrega solo los campos que necesita: asunto en correo, resultado y duración en llamada, fecha y hora en reunión, vencimiento y prioridad en tarea. Al escribir @ sugiere personas (sin acentos ni mayúsculas, con flechas, Enter y Escape) y entrega sus ids; las plantillas insertan textos frecuentes. Guarda con el botón o con Ctrl + Enter, muestra carga mientras la promesa de `onSubmit` se resuelve, limpia al terminar y, si falla, conserva el texto y muestra el error.",
    whenNot:
      "Para formularios largos con validación por campo, secciones o pasos usa `CnForm`; para redactar un correo completo con destinatarios, adjuntos y formato usa `CnRichTextField` dentro de un `CnForm`; para comentar un evento ya registrado usa la respuesta de `CnTimeline`.",
    neighbors:
      "Es el compositor en línea de `CnContactTimeline`. Usa `CnTabs`, `CnTextField`, `CnSelectField`, `CnDateField` y `CnButton`; las sugerencias de mención muestran `CnAvatar`. Suele ir dentro de `CnSectionCard` o en un `CnDrawer` lateral.",
    related: ["CnActivityComposerSkeleton"],
  },
];
