import type { CnCatalogEntry } from "../types";

/** Formularios: campos (M–Z). */
export const CATALOG_FORMS_B: CnCatalogEntry[] = [
  {
    name: "CnMaskedField",
    category: "formularios",
    domains: ["general", "pagos", "rrhh", "erp", "ecommerce"],
    status: "estable",
    summary: "Campo de texto con máscara de captura y presets mexicanos y de pagos validados.",
    purpose:
      "Capturar datos con formato fijo sin que el usuario escriba separadores ni se equivoque de longitud: máscara propia (`#` dígito, `A` letra, `*` alfanumérico) o presets listos para tarjeta (Luhn y marca detectada), vencimiento, CVV, CLABE (dígito verificador), NSS, CURP, RFC, código postal, teléfono y hora. Emite el valor limpio (`raw`) o con separadores (`masked`) y exige que la máscara esté completa.",
    whenNot:
      "Para texto libre sin formato usa `CnTextField`; para cantidades que se suman, comparan o tienen mínimo/máximo usa `CnNumberField` (o `CnCurrencyField` si son montos), porque una máscara no entiende de valores numéricos; para teléfonos con selector de país y formato internacional usa `CnPhoneField`; para códigos de verificación de un solo uso usa `CnOtpField`; para fechas y horas con selector usa `CnDateField`.",
    neighbors:
      "Es la versión con formato de `CnTextField`: comparte tamaños y validación, y sus reglas (`buildMaskRules`) las usa `CnForm`. Frente a `CnNumberField`: el número de tarjeta, la CLABE o el CP son identificadores, no cantidades, por eso van aquí. `CnPhoneField` resuelve la lada y la longitud por país; el preset de teléfono de este campo sirve solo para números nacionales de formato fijo.",
    related: ["CnMaskedFieldSkeleton"],
  },
  {
    name: "CnNumberField",
    category: "formularios",
    domains: ["general", "erp", "ecommerce", "pos", "dashboards"],
    status: "estable",
    summary:
      "Campo numérico con pasos, límites, decimales, separador de miles y controles configurables.",
    purpose:
      "Capturar una cantidad exacta (piezas, porcentaje, peso, días) con teclado, rueda o botones: pasos normales, grandes (Shift) y finos (Alt), decimales permitidos, ajuste a `min`/`max` y al múltiplo del paso al salir, separador de miles o formato propio sin foco, botón para vaciar y repetición acelerada al mantener presionado. Los controles pueden ser flechas apiladas, − y + a los lados (selector de cantidad), juntos a la derecha o ninguno.",
    whenNot:
      "Para montos con moneda usa `CnCurrencyField`; para identificadores numéricos con formato (tarjeta, CLABE, CP, NSS) usa `CnMaskedField`; para un intervalo “desde – hasta” capturado con precisión usa `CnNumberRangeField`; cuando el valor exacto importa menos que la posición dentro de una escala (descuento, volumen, umbral) usa `CnSliderField`; para tiempos en horas y minutos usa `CnDurationField`; para calificar con estrellas usa `CnRatingField`.",
    neighbors:
      '`CnQuantityField` es su atajo con `controls="split"` para carritos y punto de venta. Es la base de `CnNumberRangeField` y de `CnCurrencyField`. Frente a `CnTextField` con `transform="numeric"`: ese solo filtra la entrada y emite texto; este emite `number | null` y entiende de pasos y límites. Frente a `CnSliderField`: el deslizador es más rápido para valores aproximados y este para valores exactos.',
    related: ["CnQuantityField", "CnNumberFieldSkeleton"],
  },
  {
    name: "CnNumberRangeField",
    category: "formularios",
    domains: ["ecommerce", "erp", "crm", "dashboards", "general"],
    status: "estable",
    summary: "Rango numérico “desde – hasta” con dos campos numéricos validados entre sí.",
    purpose:
      "Capturar límites exactos de un intervalo (precio, edad, superficie, antigüedad, cantidad) para filtros de búsqueda y reglas de negocio. Cada extremo puede quedar vacío (rango abierto), comparte prefijo, sufijo, decimales y separador de miles, y la validación (`NUMBER_RANGE_RULES`) impide que el inicio supere al fin.",
    whenNot:
      "Si el usuario solo necesita ajustar el intervalo de forma aproximada dentro de una escala conocida, usa `CnSliderField` con `range`; para un solo valor usa `CnNumberField`; para intervalos de horas usa `CnTimeRangeField`; para rangos de fechas usa la variante de rango de `CnDateField`; para duraciones usa `CnDurationField`.",
    neighbors:
      "Está construido con dos `CnNumberField` y acepta sus mismos estilos de controles. Frente a `CnSliderField` con `range`: este admite valores exactos y extremos abiertos (sin mínimo o sin máximo); el deslizador exige una escala acotada pero es más rápido y visual. Suele vivir en paneles de filtros junto a `CnSelectField` y `CnSearchField` sobre un `CnDataTable`.",
    related: ["CnNumberRangeFieldSkeleton", "NUMBER_RANGE_RULES"],
  },
  {
    name: "CnOtpField",
    category: "formularios",
    domains: ["general", "pagos", "ecommerce"],
    status: "estable",
    summary: "Captura de códigos de verificación (OTP/2FA) con un recuadro por carácter.",
    purpose:
      "Verificar identidad con un código enviado por SMS, correo o app autenticadora: un recuadro por carácter, pegado del código completo, navegación con flechas, autocompletado del SMS (`one-time-code`), modo numérico o alfanumérico, ocultar caracteres, agrupación visual (“123 456”) y aviso `onComplete` para enviar automáticamente.",
    whenNot:
      "Para contraseñas o PIN que el usuario define usa `CnPasswordField`; para identificadores con formato fijo (CURP, RFC, folios) usa `CnMaskedField`; para códigos de descuento o cupones de longitud variable usa `CnTextField`.",
    neighbors:
      "Se usa después de `CnPhoneField` o del inicio de sesión con `CnPasswordField`, normalmente dentro de `CnDialog` o `CnForm` con un `CnButton` para reenviar el código. Comparte con `CnMaskedField` la idea de longitud fija, pero este está pensado para códigos efímeros y escritura carácter a carácter.",
    related: ["CnOtpFieldSkeleton"],
  },
  {
    name: "CnPasswordField",
    category: "formularios",
    domains: ["general", "rrhh", "pagos"],
    status: "estable",
    summary:
      "Contraseña con requisitos visibles, medidor de fortaleza, mostrar/ocultar y generador seguro.",
    purpose:
      "Crear o cambiar contraseñas cumpliendo la política de seguridad sin adivinar: lista de requisitos que se van marcando al escribir (configurable, con requisitos propios), medidor de fortaleza, botón mostrar/ocultar, generador con `crypto.getRandomValues` y copia al portapapeles, y `autoComplete` correcto para registro (`new-password`) o inicio de sesión (`current-password`). Exporta la misma regla para `CnForm`.",
    whenNot:
      'Para códigos de verificación de un solo uso usa `CnOtpField`; para iniciar sesión basta `CnTextField` con `type="password"` y `passwordToggle` si no quieres mostrar requisitos (o este campo con `requirements={false}`); para claves de API o secretos de solo lectura muéstralos como texto con copia, no como campo editable.',
    neighbors:
      'Está construido sobre `CnTextField` y usa `CnButton` para el generador. Frente a `CnTextField` con `type="password"` y `showPasswordStrength`: aquel solo muestra el medidor; este añade requisitos explicados, generador y la regla de validación equivalente. Suele seguirle `CnOtpField` en flujos de doble factor.',
    related: [
      "CnPasswordFieldSkeleton",
      "buildPasswordRequirements",
      "buildPasswordRule",
      "generatePassword",
      "DEFAULT_PASSWORD_REQUIREMENTS",
    ],
  },
  {
    name: "CnPhoneField",
    category: "formularios",
    domains: ["general", "crm", "ecommerce", "reservas", "rrhh"],
    status: "estable",
    summary: "Teléfono con selector de país y bandera, formato por país y valor E.164 o nacional.",
    purpose:
      "Capturar teléfonos de clientes, empleados o reservas sin errores de lada: selector de país con bandera (o país fijo), formato mientras se escribe, validación de longitud según el país y valor en E.164 (`+525512345678`) listo para SMS o WhatsApp, o en formato nacional.",
    whenNot:
      "Para elegir solo el país (sin número) usa `CnCountryField`; para un número nacional de formato fijo dentro de un formulario muy simple puede bastar el preset de teléfono de `CnMaskedField`; para extensiones, conmutadores o números internos sin país usa `CnTextField`.",
    neighbors:
      "Comparte banderas con `CnCountryField` (vía `CnFlagIcon`) y suele ir junto a `CnAddressField` en datos de contacto. Frente a `CnMaskedField`: este conoce la lada y la longitud de cada país; la máscara no. Precede a `CnOtpField` cuando el número se verifica por SMS.",
    related: ["CnPhoneFieldSkeleton"],
  },
  {
    name: "CnRadioGroupField",
    category: "formularios",
    domains: ["general", "erp", "crm", "ecommerce", "pagos"],
    status: "estable",
    summary:
      "Grupo de radios para elegir una sola opción visible, en fila, columna o como tarjetas.",
    purpose:
      'Pedir una decisión excluyente entre pocas opciones (2 a 6 aprox.) que el usuario debe comparar antes de elegir: frecuencia de pago, tipo de persona, modalidad. Todas las opciones quedan a la vista con descripción opcional, en fila o columna, o como tarjetas seleccionables (`appearance="card"`).',
    whenNot:
      "Para muchas opciones o espacio reducido usa `CnSelectField`; si la lista es larga y se busca escribiendo usa `CnAutocompleteField`; para opciones con ícono, precio o metadato (planes, métodos de pago, envíos) usa `CnChoiceCardsField`; para cambiar una vista o filtro inmediato con etiquetas cortas usa `CnSegmentedField`; para elegir varias usa `CnCheckboxField` con `options`; para un sí/no usa `CnSwitchField` o `CnCheckboxField`.",
    neighbors:
      "Es el equivalente de selección simple de `CnCheckboxField` en modo grupo. Frente a `CnChoiceCardsField`: el modo `card` de este campo sirve para título más descripción; las tarjetas de elección agregan ícono, metadato y modo múltiple. Frente a `CnSegmentedField`: los segmentos son compactos y aplican el cambio al momento; los radios son para decisiones de formulario que se envían.",
    related: ["CnRadioGroupFieldSkeleton"],
  },
  {
    name: "CnRatingField",
    category: "formularios",
    domains: ["ecommerce", "crm", "reservas", "rrhh", "general"],
    status: "estable",
    summary: "Calificación con estrellas (completas o medias) y texto descriptivo por valor.",
    purpose:
      "Recoger una valoración subjetiva rápida: reseñas de producto, satisfacción de atención, evaluación de desempeño o de proveedores. Escala configurable (`max`), medias estrellas (`precision`) y etiquetas por valor (“Muy mala” … “Excelente”) que dan contexto a cada puntuación.",
    whenNot:
      "Para una cantidad o porcentaje exacto usa `CnNumberField`; para una escala continua o un umbral usa `CnSliderField`; para niveles con nombre propio (Baja, Media, Alta) usa `CnSegmentedField` o `CnRadioGroupField`; para mostrar una calificación ya dada en una tabla, usa la celda correspondiente de `CnDataTable` en lugar de un campo editable.",
    neighbors:
      "Suele acompañar a `CnTextField` multilínea (comentario de la reseña) dentro de `CnForm`. Frente a `CnSegmentedField`: las estrellas comunican “más es mejor”; los segmentos, categorías sin orden de calidad.",
    related: ["CnRatingFieldSkeleton"],
  },
  {
    name: "CnRepeaterField",
    category: "formularios",
    domains: ["general", "erp", "cms", "rrhh", "crm"],
    status: "beta",
    summary:
      "Lista editable para agregar, quitar y reordenar elementos de texto o de contenido propio.",
    purpose:
      "Capturar una lista ordenada de longitud variable donde cada elemento se edita en su lugar: pasos de un procedimiento, requisitos de una vacante, conceptos de una cotización, contactos adicionales. Admite mínimo y máximo de elementos, contador, reordenar arrastrando o con teclado, texto vacío propio y `renderItem` para que cada elemento sea un mini formulario (`newItem` crea el valor inicial). Exporta `buildRepeaterRules` para `CnForm`.",
    whenNot:
      "Para valores cortos sin orden ni edición posterior (correos, palabras clave, folios) usa `CnTagsField`; para pares clave–valor (atributos, metadatos, variables) usa `CnKeyValueField`; para elegir elementos de un catálogo existente usa `CnTransferListField` o `CnAutocompleteField` con `multiple`; para muchos registros con columnas, orden y filtros usa `CnDataTable`.",
    neighbors:
      "Es el caso general de `CnKeyValueField` (que fija dos columnas clave y valor) y la alternativa estructurada a `CnTagsField` (que no se reordena ni edita en su lugar). Dentro de `renderItem` se combinan otros campos como `CnTextField`, `CnNumberField` o `CnSelectField`. Para listas que solo se muestran, usa `CnList`.",
    related: ["CnRepeaterFieldSkeleton", "buildRepeaterRules"],
  },
  {
    name: "CnRichTextField",
    category: "formularios",
    domains: ["cms", "ecommerce", "crm", "rrhh", "general"],
    status: "estable",
    summary:
      "Editor de texto enriquecido con barra configurable, enlaces seguros, imágenes y tablas.",
    purpose:
      'Redactar contenido con formato que se publicará o enviará: descripciones de producto, artículos, plantillas de correo, notas de expediente. Barras `basic`, `standard`, `full` o propias, enlaces normalizados y seguros, imágenes subidas a tu servidor (`onUploadImage`) o incrustadas con límite de tamaño, tablas, alto mínimo/máximo, contador y validación integrada. El valor es HTML; un editor vacío emite `""`.',
    whenNot:
      "Para texto plano de una o varias líneas (comentarios, observaciones) usa `CnTextField` con `multiline`; para código, JSON o configuraciones usa `CnCodeField`; para listas de valores usa `CnTagsField` o `CnRepeaterField`; para adjuntar documentos usa `CnFileField`.",
    neighbors:
      "Frente a `CnTextField` multilínea: este produce HTML con formato y aquel texto plano, más fácil de validar y buscar. `CnCodeField` es el editor para contenido técnico. Suele ir dentro de `CnForm` junto a `CnFileField` para adjuntos.",
    related: ["CnRichTextFieldSkeleton", "RICH_TEXT_TOOLBARS", "normalizeLink"],
  },
  {
    name: "CnScheduleField",
    category: "formularios",
    domains: ["reservas", "rrhh", "pos", "ecommerce", "general"],
    status: "beta",
    summary: "Disponibilidad semanal: días habilitados con uno o varios rangos de horas por día.",
    purpose:
      "Definir horarios que cambian según el día: horario de atención de una sucursal, disponibilidad de un profesional, turnos de un empleado, ventanas de entrega. Cada día se activa o se marca cerrado, admite varios rangos (p. ej. 09:00–14:00 y 16:00–19:00) con máximo configurable, copiar un día a los demás, paso de minutos e inicio de semana en lunes o domingo. `getScheduleIssues` y `buildScheduleRules` detectan traslapes y rangos inválidos.",
    whenNot:
      "Si todos los días comparten el mismo horario, combina `CnWeekdaysField` (qué días) con `CnTimeRangeField` (de qué hora a qué hora); para un solo intervalo de horas usa `CnTimeRangeField`; para citas o eventos con fecha concreta usa `CnEventCalendar`; para elegir una fecha usa `CnDateField`.",
    neighbors:
      "Generaliza a `CnWeekdaysField` + `CnTimeRangeField`: es la opción cuando cada día puede tener horas distintas. Sus horarios pueden alimentar las horas laborales de `CnEventCalendar`.",
    related: ["CnScheduleFieldSkeleton", "buildScheduleRules", "getScheduleIssues"],
  },
  {
    name: "CnSearchField",
    category: "formularios",
    domains: ["general", "ecommerce", "crm", "erp", "cms", "dashboards"],
    status: "beta",
    summary:
      "Búsqueda con sugerencias fijas o remotas, búsquedas recientes y navegación con teclado.",
    purpose:
      "Encontrar algo escribiendo: buscador global, búsqueda de clientes o productos, filtro de texto sobre un listado. Sugerencias locales o remotas (`onSearch` con cancelación y espera tras teclear), caracteres mínimos, búsquedas recientes guardadas por clave, `onSelect` al elegir una sugerencia y `onSubmit` al confirmar el texto, botón para limpiar, indicador de carga y virtualización para muchas sugerencias. El valor es el texto buscado.",
    whenNot:
      "Si el formulario debe guardar una opción de un catálogo (un id de cliente, un producto) usa `CnAutocompleteField`, que guarda el valor de la opción y no el texto; para elegir de una lista corta sin escribir usa `CnSelectField`; para filtrar columnas de una tabla usa la búsqueda integrada de `CnDataTable` o de `CnList`.",
    neighbors:
      "Frente a `CnAutocompleteField`: ambos sugieren mientras se escribe, pero este dispara una búsqueda o navegación (su valor es la consulta) y aquel llena un campo de formulario con una opción válida. Suele vivir en barras de filtros junto a `CnSelectField` y `CnNumberRangeField`, encima de `CnDataTable` o `CnList`.",
    related: ["CnSearchFieldSkeleton", "filterSuggestions", "clearRecentSearches"],
  },
  {
    name: "CnSegmentedField",
    category: "formularios",
    domains: ["general", "dashboards", "erp", "crm", "pos"],
    status: "estable",
    summary: "Botones segmentados para elegir entre pocas opciones visibles, simple o múltiple.",
    purpose:
      "Cambiar rápidamente entre 2 y 5 opciones cortas que conviene ver todas a la vez: vista (lista/tarjetas), periodo (día/semana/mes), prioridad, filtros rápidos. Selección simple o múltiple, permite deseleccionar, ancho completo, solo íconos y orientación horizontal o vertical.",
    whenNot:
      "Para más de 5 opciones o etiquetas largas usa `CnSelectField`; para decisiones de formulario que necesitan descripción por opción usa `CnRadioGroupField`; para opciones ricas con ícono, precio o metadato usa `CnChoiceCardsField`; para elegir días de la semana usa `CnWeekdaysField`, que ya trae atajos y límites; para navegar entre secciones de contenido usa `CnTabs`; para encender o apagar un ajuste usa `CnSwitchField`.",
    neighbors:
      "Frente a `CnRadioGroupField`: mismo tipo de decisión, pero los segmentos son compactos y suelen aplicar el cambio de inmediato (filtros, vistas). Frente a `CnTabs`: las pestañas cambian el contenido mostrado; los segmentos cambian un valor. `CnWeekdaysField` es su variante especializada para días. En selección múltiple compite con `CnCheckboxField` en grupo, que es mejor cuando las etiquetas son largas.",
    related: ["CnSegmentedFieldSkeleton"],
  },
  {
    name: "CnSelectField",
    category: "formularios",
    domains: ["general", "erp", "crm", "ecommerce", "rrhh", "pos"],
    status: "estable",
    summary:
      "Lista desplegable de selección simple o múltiple, con grupos, chips, búsqueda y opciones remotas.",
    purpose:
      "Elegir uno o varios valores de una lista cerrada sin ocupar espacio: estado, categoría, sucursal, responsable. Admite grupos y descripción por opción, chips y “Seleccionar todo” en modo múltiple, botón para limpiar, renderizado propio de opciones y del valor, y para listas grandes un menú virtualizado con buscador sin acentos (automático con más de 100 opciones), opciones remotas paginadas (`loadOptions`), resolución de etiquetas al editar y caché compartida.",
    whenNot:
      "Si lo natural es escribir para encontrar la opción, o se pueden crear opciones nuevas, usa `CnAutocompleteField`; si las opciones forman una jerarquía (áreas, categorías anidadas) usa `CnTreeSelectField`; para 2 a 5 opciones que conviene comparar a la vista usa `CnRadioGroupField` o `CnSegmentedField`; para opciones ricas (planes, métodos de pago) usa `CnChoiceCardsField`; para asignar muchos elementos revisando qué queda fuera usa `CnTransferListField`; para elegir país usa `CnCountryField`.",
    neighbors:
      "Forma la familia de selección con `CnAutocompleteField` (se escribe para filtrar y puede crear valores), `CnTreeSelectField` (jerarquía) y `CnTransferListField` (asignación masiva con dos listas). Comparten la forma de las opciones y la carga remota (`loadOptions`, `resolveOptions`). Para pocas opciones visibles, `CnRadioGroupField` (decisión de formulario), `CnSegmentedField` (cambio inmediato) y `CnChoiceCardsField` (opciones con contenido).",
    related: ["CnSelectFieldSkeleton"],
  },
  {
    name: "CnSignatureField",
    category: "formularios",
    domains: ["rrhh", "erp", "reservas", "pagos", "general"],
    status: "estable",
    summary: "Firma autógrafa dibujada con mouse, dedo o lápiz, con alternativa escrita accesible.",
    purpose:
      'Recabar la conformidad del usuario en el momento: recepción de mercancía, contratos, cartas responsivas, entregas de equipo, consentimientos. Se dibuja sobre un área configurable (alto, color y grosor del trazo) o se escribe el nombre con una fuente manuscrita como alternativa accesible. El valor es una imagen PNG en data URL; vacía emite `""`.',
    whenNot:
      "Para subir una firma o documento ya escaneado usa `CnFileField`; para aceptar términos sin firma basta un `CnCheckboxField` obligatorio; para confirmar una acción en pantalla usa `CnConfirmDialog`.",
    neighbors:
      "Suele cerrar un `CnForm` después de `CnCheckboxField` de aceptación y antes del `CnButton` de envío. Frente a `CnFileField`: este captura la firma en vivo; aquel adjunta archivos existentes.",
    related: ["CnSignatureFieldSkeleton"],
  },
  {
    name: "CnSliderField",
    category: "formularios",
    domains: ["general", "ecommerce", "dashboards", "erp"],
    status: "estable",
    summary:
      "Deslizador para elegir un valor o un rango dentro de una escala, con marcas y valor visible.",
    purpose:
      "Ajustar valores aproximados dentro de límites conocidos de forma rápida y visual: descuento, porcentaje, volumen, umbral de alerta, rango de precio en filtros. Admite paso, marcas (por paso o con etiqueta), modo rango (`[desde, hasta]`), formato propio del valor y mostrar el valor junto a la etiqueta.",
    whenNot:
      "Cuando el valor exacto importa (cantidades, importes, folios) usa `CnNumberField` o `CnCurrencyField`; para un intervalo con extremos exactos o abiertos usa `CnNumberRangeField`; para calificaciones usa `CnRatingField`; para pocas opciones con nombre usa `CnSegmentedField`.",
    neighbors:
      "Frente a `CnNumberField`: el deslizador es más rápido para valores aproximados y comunica la escala; el campo numérico es preciso y accesible al teclado sin arrastrar. Con `range` compite con `CnNumberRangeField`: elige el deslizador si la escala está acotada y la precisión no es crítica.",
    related: ["CnSliderFieldSkeleton"],
  },
  {
    name: "CnSwitchField",
    category: "formularios",
    domains: ["general", "erp", "dashboards", "crm"],
    status: "estable",
    summary: "Interruptor de encendido/apagado con etiqueta y descripción opcional.",
    purpose:
      "Activar o desactivar un ajuste cuyo efecto se entiende como un estado: notificaciones, modo oscuro, producto visible, usuario activo. Admite descripción bajo la etiqueta y posición de la etiqueta a cualquier lado. El valor es booleano.",
    whenNot:
      "Para aceptar términos o confirmar algo que se envía con el formulario usa `CnCheckboxField`; para elegir varias opciones de una lista usa `CnCheckboxField` con `options`; para elegir entre dos opciones con nombre propio (Mensual/Anual) usa `CnSegmentedField` o `CnRadioGroupField`; para disparar una acción usa `CnButton`.",
    neighbors:
      "Frente a `CnCheckboxField` simple: ambos son booleanos, pero el interruptor sugiere un ajuste que entra en vigor (preferencias, estados) y la casilla una selección o aceptación que se confirma al enviar. En pantallas de configuración se agrupa dentro de `CnSectionCard` o `CnForm`.",
    related: ["CnSwitchFieldSkeleton"],
  },
  {
    name: "CnTagsField",
    category: "formularios",
    domains: ["general", "crm", "cms", "ecommerce", "erp"],
    status: "estable",
    summary: "Lista libre de valores cortos como chips, validados uno por uno.",
    purpose:
      "Capturar varios valores cortos que el usuario escribe: correos para invitar, palabras clave, folios, códigos de producto, dominios. Valida cada etiqueta antes de agregarla (reglas como `email` o validación propia), separa al pegar listas, borra con Retroceso, limita la cantidad, evita duplicados, transforma a minúsculas o mayúsculas y muestra sugerencias mientras se escribe.",
    whenNot:
      "Si los valores deben pertenecer a un catálogo existente usa `CnAutocompleteField` con `multiple` (o `CnSelectField` con `multiple`); si cada elemento es largo, se reordena o tiene varios campos usa `CnRepeaterField`; para pares clave–valor usa `CnKeyValueField`; para buscar usa `CnSearchField`.",
    neighbors:
      "Frente a `CnAutocompleteField` múltiple: ambos muestran chips, pero aquí el valor es texto libre y allá una opción del catálogo (salvo `freeSolo`). Frente a `CnRepeaterField`: los chips son compactos y sin orden; el repetidor edita cada elemento en su lugar. Para mostrar etiquetas ya guardadas fuera de un formulario usa `CnChip`.",
    related: ["CnTagsFieldSkeleton"],
  },
  {
    name: "CnTextField",
    category: "formularios",
    domains: ["general"],
    status: "estable",
    summary:
      "Campo de texto base: una línea o multilínea, tipos, adornos, contador, transformaciones y validación.",
    purpose:
      "Capturar texto libre: nombres, correos, URLs, comentarios, observaciones. Tipos `text`, `email`, `tel`, `url`, `search`, `password` y `textarea`; variantes y tamaños; multilínea con filas mínimas y máximas, contador y `maxLength`; botón para limpiar, carga, íconos y adornos; transformación de la entrada (mayúsculas, minúsculas, capitalizar, numérico) y reglas de validación con eventos y espera configurables. Es la base visual del resto de campos.",
    whenNot:
      "Para datos con formato fijo (tarjeta, CURP, RFC, CLABE, CP) usa `CnMaskedField`; para cantidades con pasos y límites usa `CnNumberField` y para montos `CnCurrencyField`; para teléfonos usa `CnPhoneField`; para contraseñas con requisitos usa `CnPasswordField`; para texto con formato usa `CnRichTextField`; para código o JSON usa `CnCodeField`; para buscar con sugerencias usa `CnSearchField`; para varios valores cortos usa `CnTagsField`; para fechas usa `CnDateField`.",
    neighbors:
      'Es la pieza sobre la que se construyen `CnPasswordField` y muchos otros campos, y el tipo de campo más común en `CnForm`. Frente a `CnMaskedField`: si el dato tiene una forma fija conocida, la máscara evita errores; si no, usa este. Frente a `CnNumberField`: `transform="numeric"` solo filtra dígitos y emite texto; el campo numérico emite un número con pasos y límites.',
    related: ["CnTextFieldSkeleton"],
  },
  {
    name: "CnTimeRangeField",
    category: "formularios",
    domains: ["reservas", "rrhh", "pos", "general"],
    status: "beta",
    summary: "Rango de horas “de – a” con duración calculada y soporte de turnos nocturnos.",
    purpose:
      "Capturar un intervalo de horas de un día: horario de atención, turno, ventana de entrega, duración de una cita. Muestra la duración calculada, valida duración mínima y máxima, permite que el fin sea al día siguiente (22:00–06:00) y ajusta el paso de minutos. Exporta `getTimeRangeMinutes` y `buildTimeRangeRules`.",
    whenNot:
      'Si cada día de la semana tiene horas distintas o varios tramos usa `CnScheduleField`; para una sola hora usa `CnDateField` con `type="time"`; para una duración sin hora de inicio usa `CnDurationField`; para rangos de fechas usa la variante de rango de `CnDateField`; para eventos en calendario usa `CnEventCalendar`.',
    neighbors:
      "Con `CnWeekdaysField` forma el horario “mismos días, mismas horas”; `CnScheduleField` es la versión por día con varios rangos. Frente a `CnDurationField`: este parte de dos horas del reloj; aquel captura solo cuánto dura algo.",
    related: ["CnTimeRangeFieldSkeleton", "buildTimeRangeRules", "getTimeRangeMinutes"],
  },
  {
    name: "CnTransferListField",
    category: "formularios",
    domains: ["erp", "rrhh", "crm", "dashboards", "general"],
    status: "estable",
    summary:
      "Lista doble para asignar elementos moviéndolos entre “Disponibles” y “Seleccionados”.",
    purpose:
      "Asignar muchos elementos cuando importa ver tanto lo elegido como lo que queda fuera: permisos de un rol, usuarios de un grupo, productos de una promoción, columnas visibles de un reporte. Buscador en cada lista, mover uno (doble clic o Enter), varios o todos, máximo de seleccionados, virtualización para listas grandes y disponibles cargados del servidor por páginas con resolución de etiquetas al editar.",
    whenNot:
      "Para elegir unos pocos valores de una lista usa `CnSelectField` o `CnAutocompleteField` con `multiple`, que ocupan mucho menos espacio; si los elementos forman una jerarquía usa `CnTreeSelectField` con `multiple`; para opciones fijas y cortas usa `CnCheckboxField` con `options`; para listas libres que el usuario escribe usa `CnTagsField` o `CnRepeaterField`.",
    neighbors:
      "Es el extremo “asignación masiva” de la familia `CnSelectField` / `CnAutocompleteField` / `CnTreeSelectField`, con la misma forma de opciones y carga remota. Frente a `CnCheckboxField` en grupo: la lista doble escala a cientos de elementos con búsqueda y deja claro qué quedó fuera. Para seleccionar filas de registros completos usa la selección de `CnDataTable`.",
    related: ["CnTransferListFieldSkeleton"],
  },
  {
    name: "CnTreeSelectField",
    category: "formularios",
    domains: ["erp", "rrhh", "ecommerce", "cms", "general"],
    status: "estable",
    summary:
      "Selector jerárquico con búsqueda, selección simple o múltiple en cascada y ruta visible.",
    purpose:
      "Elegir dentro de catálogos anidados: departamentos, categorías de producto, ubicaciones, centros de costo, cuentas contables. La búsqueda conserva los ancestros, la selección múltiple marca en cascada con estado indeterminado y guarda todos, solo hojas o el nodo más alto (`valueMode`), la simple puede limitarse a hojas, muestra la ruta (`Ventas / Norte`), navega por teclado y virtualiza árboles grandes.",
    whenNot:
      "Si las opciones no tienen jerarquía usa `CnSelectField` (o `CnAutocompleteField` si se busca escribiendo); si la jerarquía es solo un agrupador visual de un nivel, basta `CnSelectField` con grupos; para asignar cientos de elementos planos viendo lo que queda fuera usa `CnTransferListField`; para mostrar un árbol navegable fuera de un formulario usa `CnList`.",
    neighbors:
      "Es la variante jerárquica de `CnSelectField` y comparte con él la forma de las opciones (con `children`). Frente a `CnSelectField` con grupos: los grupos no se seleccionan y tienen un solo nivel; aquí cada nodo puede elegirse y hay niveles ilimitados. `CnList` también muestra árboles, pero como lista de contenido, no como campo.",
    related: ["CnTreeSelectFieldSkeleton"],
  },
  {
    name: "CnWeekdaysField",
    category: "formularios",
    domains: ["reservas", "rrhh", "pos", "general"],
    status: "beta",
    summary:
      "Selector de días de la semana con atajos (laborables, fin de semana, todos) y límites.",
    purpose:
      "Elegir en qué días aplica algo: días de servicio, recurrencia de una tarea, días de entrega, días de descanso. Botones por día en formato inicial, abreviado o completo, semana que empieza en lunes o domingo, atajos configurables, mínimo y máximo de días y días deshabilitados. Exporta `buildWeekdaysRules` y `DEFAULT_WEEKDAY_PRESETS`.",
    whenNot:
      "Si además cada día tiene su propio horario usa `CnScheduleField`; para fechas concretas usa `CnDateField` o `CnCalendar`; para opciones que no son días usa `CnSegmentedField` o `CnCheckboxField` con `options`.",
    neighbors:
      "Es un `CnSegmentedField` especializado en días, con atajos y límites incluidos. Junto a `CnTimeRangeField` describe un horario uniforme; `CnScheduleField` lo reemplaza cuando las horas cambian por día.",
    related: ["CnWeekdaysFieldSkeleton", "buildWeekdaysRules", "DEFAULT_WEEKDAY_PRESETS"],
  },
];
