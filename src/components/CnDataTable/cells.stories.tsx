import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { CnCellOptions, CnCellType } from "./cells";
import { CnCell, formatCellText } from "./cells";
import { CN_STATUS_PRESETS } from "./status-presets";

/**
 * Cada tipo de celda de `CnDataTable` por separado, con sus variantes y
 * opciones. `<CnCell type="…" value={…} />` sirve igual dentro de la tabla
 * (`column.type` + `column.cellOptions`) que fuera de ella.
 */
const meta: Meta = {
  title: "Data Display/Cells",
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj;

type Variant = {
  caption: string;
  value: unknown;
  options?: CnCellOptions;
  row?: unknown;
  /** Contenido propio (variantes interactivas). */
  render?: () => ReactNode;
};

type Showcase = { description: string; variants: Variant[] };

// ─── Datos de ejemplo ─────────────────────────────────────────────────────

const HOUR = 3600000;
const DAY = 24 * HOUR;
const fromNow = (ms: number) => new Date(Date.now() + ms);
const isoDay = (ms: number) => {
  const d = fromNow(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const LONG_TEXT =
  "Activo revisado en la última auditoría. Se recomienda renovar el contrato de mantenimiento antes del cierre del trimestre y actualizar el inventario de refacciones.";

const PIPELINE = ["Prospecto", "Calificado", "Propuesta", "Negociación", "Cerrado"];
const ONBOARDING = ["Alta", "Documentos", "Revisión", "Firma", "Activo"];

const log = (label: string) => (value: unknown) => console.info(label, value);

/** Interruptor con estado local para la historia de `toggle`. */
const ToggleDemo = ({ initial, labels }: { initial: boolean; labels?: [string, string] }) => {
  const [row, setRow] = useState({ id: 1, active: initial });
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <CnCell
        type="toggle"
        value={row.active}
        row={row}
        trueLabel={labels?.[0]}
        falseLabel={labels?.[1]}
        onChange={(_, next) => setRow((prev) => ({ ...prev, active: next }))}
      />
      <Box component="code" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
        row.active = {String(row.active)}
      </Box>
    </Box>
  );
};

const SHOWCASE: Record<CnCellType, Showcase> = {
  text: {
    description:
      'Texto con ícono, negritas, píldora, transformación, truncado, subtítulo, acción y "Ver completo" para textos largos.',
    variants: [
      { caption: "Simple", value: "Servidor norte" },
      { caption: "icon + bold", value: "Servidor norte", options: { icon: "dns", bold: true } },
      { caption: "pill + tone", value: "Prioritario", options: { pill: true, tone: "accent" } },
      {
        caption: "transform: capitalize",
        value: "ana garcía lópez",
        options: { transform: "capitalize" },
      },
      { caption: "maxLength: 12", value: "Bodega principal del Bajío", options: { maxLength: 12 } },
      {
        caption: "subtitle",
        value: "Planta sur",
        row: { city: "Monterrey" },
        options: { subtitle: (row) => (row as { city: string }).city },
      },
      { caption: "Texto largo (Ver completo)", value: LONG_TEXT },
      { caption: "lines: 1", value: LONG_TEXT, options: { lines: 1, detail: false } },
      { caption: "onClick", value: "Abrir registro", options: { onClick: log("text") } },
      { caption: "Vacío", value: null },
      { caption: "emptyText", value: "", options: { emptyText: "Por definir" } },
    ],
  },
  id: {
    description: "Identificador en píldora mono con botón de copiar.",
    variants: [
      { caption: "Simple", value: 42 },
      { caption: "prefix", value: 1024, options: { prefix: "EMP-" } },
      { caption: "prefix + suffix", value: 7, options: { prefix: "#", suffix: "/A" } },
      { caption: "tone: accent", value: "A-551", options: { tone: "accent" } },
      { caption: "copyable: false", value: 99, options: { copyable: false } },
    ],
  },
  code: {
    description: "Códigos (SKU, folios, claves) con ícono propio, transformación y truncado.",
    variants: [
      { caption: "Simple", value: "SKU-AX-2291" },
      { caption: "icon", value: "INV-0045", options: { icon: "inventory_2" } },
      { caption: "transform: uppercase", value: "mx-cdmx-01", options: { transform: "uppercase" } },
      { caption: "maxLength: 10", value: "ABCDEF-1234567890", options: { maxLength: 10 } },
      { caption: "tone: info", value: "API-KEY", options: { tone: "info" } },
    ],
  },
  rfc: {
    description:
      "Valida el formato del RFC; si es válido, el detalle muestra persona, fecha y homoclave.",
    variants: [
      { caption: "Persona física", value: "GAAA800101AB1" },
      { caption: "Persona moral", value: "ABC010203XY1" },
      { caption: "Formato no reconocido", value: "XXXX" },
      { caption: "detail: false", value: "GAAA800101AB1", options: { detail: false } },
      { caption: "Vacío", value: null },
    ],
  },
  curp: {
    description: "Valida la CURP; el detalle muestra nacimiento, sexo y entidad.",
    variants: [
      { caption: "Válida", value: "GAAA800101HDFRRN09" },
      { caption: "No reconocida", value: "NO-VALIDA" },
      { caption: "Vacío", value: "" },
    ],
  },
  number: {
    description: "Números con unidad, decimales y tendencia contra el valor anterior.",
    variants: [
      { caption: "Simple", value: 1234.5 },
      { caption: "suffix: kg", value: 82.4, options: { suffix: "kg" } },
      { caption: "decimals: 0", value: 1234.56, options: { decimals: 0 } },
      { caption: "previous (sube)", value: 120, options: { previous: () => 100 } },
      { caption: "previous (baja)", value: 80, options: { previous: () => 100 } },
      { caption: "prefix", value: 15, options: { prefix: "×" } },
    ],
  },
  currency: {
    description:
      "Importes: píldora con detalle (importe con letra, variación), modo plano, otras monedas y negativos.",
    variants: [
      { caption: "Detalle con importe con letra", value: 1250.5 },
      { caption: "previous (tendencia)", value: 1450000, options: { previous: () => 1100000 } },
      { caption: "currency: USD", value: 99.9, options: { currency: "USD" } },
      { caption: "Negativo", value: -3200 },
      { caption: "plain", value: 18500, options: { plain: true } },
      { caption: "amountInWords: false", value: 500, options: { amountInWords: false } },
      { caption: "detail: false", value: 750, options: { detail: false } },
    ],
  },
  percent: {
    description: "Porcentaje con semáforo automático, barra, escala 0–1 y modo plano.",
    variants: [
      { caption: "Alto (≥ 80)", value: 92 },
      { caption: "Medio (≥ 50)", value: 64 },
      { caption: "Bajo", value: 23 },
      { caption: "percentScale: fraction", value: 0.455, options: { percentScale: "fraction" } },
      { caption: "bar", value: 72, options: { bar: true } },
      { caption: "plain", value: 72, options: { plain: true } },
      { caption: "previous", value: 40, options: { previous: () => 55 } },
    ],
  },
  progress: {
    description: "Barra de avance con color por umbral.",
    variants: [
      { caption: "30 %", value: 30 },
      { caption: "75 %", value: 75 },
      { caption: "100 %", value: 100 },
      { caption: "max: 8 (6 de 8)", value: 6, options: { max: 8 } },
    ],
  },
  date: {
    description: "Fecha con relativo y ficha con calendario, semana e ISO.",
    variants: [
      { caption: "Con relativo", value: isoDay(-3 * DAY) },
      { caption: "Futura", value: isoDay(40 * DAY) },
      { caption: "relative: false", value: "2024-05-06", options: { relative: false } },
      { caption: "dateFormat", value: "2024-05-06", options: { dateFormat: "D [de] MMMM YYYY" } },
      { caption: "detail: false", value: "2024-05-06", options: { detail: false } },
      { caption: "Vacío", value: null },
    ],
  },
  datetime: {
    description: "Fecha y hora; la ficha incluye la hora en formato de 12 h.",
    variants: [
      { caption: "Hace unas horas", value: fromNow(-5 * HOUR) },
      { caption: "Texto ISO", value: "2026-02-14 18:45" },
      {
        caption: "dateFormat",
        value: "2026-02-14 18:45",
        options: { dateFormat: "DD/MM/YYYY HH:mm" },
      },
    ],
  },
  time: {
    description: "Hora sola.",
    variants: [
      { caption: "Simple", value: "09:30" },
      { caption: "Con segundos", value: "18:05:22" },
      { caption: "Vacío", value: null },
    ],
  },
  duration: {
    description: "Duración legible a partir de minutos, segundos u horas.",
    variants: [
      { caption: "Minutos (por defecto)", value: 45 },
      { caption: "durationUnit: seconds", value: 3700, options: { durationUnit: "seconds" } },
      { caption: "durationUnit: hours", value: 26, options: { durationUnit: "hours" } },
    ],
  },
  boolean: {
    description: "Sí / No con etiquetas y colores propios.",
    variants: [
      { caption: "true", value: true },
      { caption: "false", value: false },
      {
        caption: "trueLabel / falseLabel",
        value: true,
        options: { trueLabel: "Verificado", falseLabel: "Sin verificar" },
      },
      {
        caption: "statusMap",
        value: false,
        options: { statusMap: { false: { label: "Bloqueado", color: "error", icon: "lock" } } },
      },
    ],
  },
  status: {
    description: "Estados con presets (`CN_STATUS_PRESETS`) o un mapa propio.",
    variants: [
      { caption: "Fallback: active", value: "active" },
      { caption: "Fallback: pending", value: "pending" },
      {
        caption: "Preset approval",
        value: "review",
        options: { statusMap: CN_STATUS_PRESETS.approval },
      },
      {
        caption: "Preset priority",
        value: "critical",
        options: { statusMap: CN_STATUS_PRESETS.priority },
      },
      {
        caption: "statusMap propio",
        value: "shipped",
        options: {
          statusMap: { shipped: { label: "Enviado", color: "info", icon: "local_shipping" } },
        },
      },
      { caption: "Desconocido", value: "otro" },
    ],
  },
  tags: {
    description: 'Etiquetas con "+N" que abre la lista completa.',
    variants: [
      { caption: "Dos", value: ["Ventas", "Norte"] },
      { caption: "maxTags: 2 (con +N)", value: ["Ventas", "Norte", "VIP", "2026", "Mayoreo"] },
      { caption: "Texto separado por comas", value: "rojo, verde, azul", options: { maxTags: 3 } },
      { caption: "Vacío", value: [] },
    ],
  },
  avatar: {
    description: "Persona con iniciales o foto, subtítulo, insignia, forma y acción.",
    variants: [
      { caption: "Iniciales", value: "Ana García" },
      {
        caption: "image",
        value: "Luis Pérez",
        options: { image: () => "https://i.pravatar.cc/80?img=12" },
      },
      {
        caption: "subtitle + badge",
        value: "María Ruiz",
        options: {
          subtitle: () => "Gerente de ventas",
          badge: () => ({ label: "Admin", tone: "accent" }),
        },
      },
      { caption: "avatarShape: rounded", value: "Jorge Díaz", options: { avatarShape: "rounded" } },
      { caption: "avatarShape: square", value: "Sofía León", options: { avatarShape: "square" } },
      { caption: "onClick", value: "Carlos Mena", options: { onClick: log("avatar") } },
      { caption: "Vacío", value: null },
    ],
  },
  contact: {
    description: "Uno o varios contactos; al hacer clic muestra la ficha con correo y teléfono.",
    variants: [
      {
        caption: "Uno",
        value: {
          name: "Ana García",
          position: "Compras",
          email: "ana@acme.mx",
          phone: "5512345678",
        },
      },
      {
        caption: "Grupo",
        value: [
          { name: "Ana García", email: "ana@acme.mx" },
          { name: "Luis Pérez", phone: "3312345678" },
          { name: "María Ruiz" },
          { name: "Jorge Díaz" },
          { name: "Sofía León" },
        ],
      },
      {
        caption: "maxItems: 2",
        value: [{ name: "Ana García" }, { name: "Luis Pérez" }, { name: "María Ruiz" }],
        options: { maxItems: 2 },
      },
      { caption: "Vacío", value: null },
    ],
  },
  email: {
    description: "Correo con dominio y ficha para escribir o visitar el dominio.",
    variants: [
      { caption: "Con ficha", value: "ana.garcia@acme.mx" },
      { caption: "detail: false (mailto)", value: "ventas@acme.mx", options: { detail: false } },
      { caption: "subtitle", value: "luis@acme.mx", options: { subtitle: () => "Facturación" } },
      { caption: "Vacío", value: null },
    ],
  },
  phone: {
    description: "Teléfono formateado con ficha (llamar, WhatsApp, SMS).",
    variants: [
      { caption: "10 dígitos", value: "5512345678" },
      { caption: "Internacional", value: "+525512345678" },
      { caption: "whatsapp", value: "3312345678", options: { whatsapp: true } },
      { caption: "detail: false (tel:)", value: "8112345678", options: { detail: false } },
      { caption: "Vacío", value: null },
    ],
  },
  link: {
    description: "Enlace seguro que muestra el dominio.",
    variants: [
      { caption: "URL", value: "https://www.canek.mx/docs" },
      {
        caption: "linkLabel",
        value: "https://example.com/reporte.pdf",
        options: { linkLabel: () => "Reporte anual" },
      },
      { caption: "URL insegura (javascript:)", value: "javascript:alert(1)" },
      { caption: "Vacío", value: null },
    ],
  },
  location: {
    description: 'Dirección con ficha, mapa y "Cómo llegar".',
    variants: [
      {
        caption: "Objeto",
        value: {
          street: "Av. Reforma 222",
          city: "Ciudad de México",
          state: "CDMX",
          postalCode: "06600",
          country: "México",
        },
      },
      { caption: "Texto", value: "Av. Vallarta 1500, Guadalajara" },
      { caption: "mapPreview: false", value: "Monterrey, NL", options: { mapPreview: false } },
      {
        caption: "detail: false + mapLink",
        value: "Mérida, Yucatán",
        options: { detail: false, mapLink: true },
      },
      { caption: "Vacío", value: null },
    ],
  },
  image: {
    description: "Miniaturas apiladas con visor a pantalla completa.",
    variants: [
      { caption: "Una", value: "https://picsum.photos/seed/canek1/400/300" },
      {
        caption: "Varias (+N)",
        value: [1, 2, 3, 4, 5].map((n) => `https://picsum.photos/seed/canek${n}/400/300`),
      },
      {
        caption: "maxItems: 2",
        value: [1, 2, 3].map((n) => ({ url: `https://picsum.photos/seed/cn${n}/400/300` })),
        options: { maxItems: 2 },
      },
      { caption: "Vacío", value: null },
    ],
  },
  rating: {
    description: "Calificación con estrellas y color.",
    variants: [
      { caption: "4.5", value: 4.5 },
      { caption: "2", value: 2 },
      { caption: "max: 10", value: 7, options: { max: 10 } },
      { caption: "Sin valor", value: null },
    ],
  },
  file: {
    description: "Archivos con ícono por tipo, tamaño y ficha (abrir / descargar).",
    variants: [
      {
        caption: "PDF con tamaño",
        value: { name: "contrato.pdf", size: 250000, url: "https://example.com/contrato.pdf" },
      },
      { caption: "URL de Excel", value: "https://example.com/files/ventas-2026.xlsx" },
      {
        caption: "Varios",
        value: [{ name: "foto.jpg", size: 1200000 }, { name: "notas.docx" }, { name: "datos.csv" }],
      },
    ],
  },
  color: {
    description: "Muestra de color con su código.",
    variants: [
      { caption: "Hex", value: "#254d87" },
      { caption: "rgb()", value: "rgb(34, 135, 64)" },
      { caption: "Inválido (transparente)", value: "banana" },
    ],
  },
  country: {
    description: "Bandera, nombre localizado y código ISO.",
    variants: [
      { caption: "MX", value: "MX" },
      { caption: "US", value: "us" },
      { caption: "locale: en-US", value: "ES", options: { locale: "en-US" } },
    ],
  },
  json: {
    description: "Resumen del objeto con visor formateado.",
    variants: [
      { caption: "Objeto", value: { region: "norte", racks: 4, tags: ["prod"] } },
      { caption: "Arreglo", value: [1, 2, 3] },
      { caption: "Texto JSON", value: '{"ok":true}' },
    ],
  },
  daterange: {
    description: "Periodo con duración y estado (próximo, en curso, concluido).",
    variants: [
      { caption: "En curso", value: [isoDay(-5 * DAY), isoDay(10 * DAY)] },
      { caption: "Próximo", value: { start: isoDay(20 * DAY), end: isoDay(25 * DAY) } },
      { caption: "Concluido", value: ["2025-01-01", "2025-03-31"] },
      { caption: "Sin fin", value: [isoDay(-2 * DAY), null] },
    ],
  },
  bytes: {
    description: "Tamaño legible (KB, MB, GB…).",
    variants: [
      { caption: "Bytes", value: 512 },
      { caption: "MB", value: 1536000 },
      { caption: "GB", value: 5 * 1024 ** 3 },
    ],
  },
  sparkline: {
    description: "Mini gráfica con el último valor y color por tendencia.",
    variants: [
      { caption: "Sube", value: [12, 18, 15, 22, 30, 27, 35] },
      { caption: "Baja", value: [40, 38, 35, 33, 30, 31, 28] },
      { caption: "Insuficiente", value: [5] },
    ],
  },
  list: {
    description: 'Lista con viñetas y "+N más".',
    variants: [
      { caption: "Dos", value: ["Inventario", "Compras"] },
      { caption: "Con +N", value: ["Inventario", "Compras", "Ventas", "Nómina", "Reportes"] },
      { caption: "maxItems: 3", value: ["A", "B", "C", "D"], options: { maxItems: 3 } },
    ],
  },
  coordinates: {
    description: "Latitud y longitud con mapa en la ficha.",
    variants: [
      { caption: "Arreglo", value: [19.4326, -99.1332] },
      { caption: "Texto", value: "20.6597,-103.3496" },
      {
        caption: "Objeto + mapPreview: false",
        value: { lat: 21.16, lng: -86.85 },
        options: { mapPreview: false },
      },
    ],
  },
  masked: {
    description: "Dato sensible oculto que se puede mostrar y copiar.",
    variants: [
      { caption: "CLABE", value: "012180001234567891" },
      { caption: "visibleChars: 2", value: "4111111111111111", options: { visibleChars: 2 } },
      { caption: "copyable: false", value: "SECRETO-123", options: { copyable: false } },
    ],
  },
  delta: {
    description:
      "Variación con flecha y color. Con `previous` se calcula; sin él el valor ya es el cambio. `invertTrend` para métricas donde bajar es bueno.",
    variants: [
      { caption: "Ya es % de cambio", value: 12.5 },
      { caption: "Negativo", value: -8.2 },
      { caption: "Sin cambio", value: 0 },
      { caption: "previous (calcula %)", value: 1450, options: { previous: () => 1200 } },
      {
        caption: "deltaFormat: number",
        value: 340,
        options: { previous: () => 300, deltaFormat: "number" },
      },
      {
        caption: "deltaFormat: currency",
        value: -12500,
        options: { deltaFormat: "currency" },
      },
      {
        caption: "invertTrend (costos bajan = bien)",
        value: 85000,
        options: { previous: () => 100000, deltaFormat: "currency", invertTrend: true },
      },
      { caption: "percentScale: fraction", value: 0.034, options: { percentScale: "fraction" } },
    ],
  },
  priority: {
    description:
      "Prioridad baja / media / alta / crítica (y alias en español o 1–4) con barras, bandera o ícono.",
    variants: [
      { caption: "low", value: "low" },
      { caption: "medium", value: "media" },
      { caption: "high", value: "high" },
      { caption: "critical", value: "critical" },
      { caption: "priorityStyle: flag", value: "high", options: { priorityStyle: "flag" } },
      { caption: "priorityStyle: icon", value: 4, options: { priorityStyle: "icon" } },
      {
        caption: "priorityMap propio",
        value: "p0",
        options: {
          priorityMap: { p0: { label: "Bloqueante", tone: "error", level: 4, icon: "block" } },
        },
      },
      { caption: "Vacío", value: null },
    ],
  },
  deadline: {
    description:
      'Vencimiento (SLA): "vence en 3 h" / "vencido hace 2 d" con tono por urgencia y ficha con la fecha exacta.',
    variants: [
      { caption: "A tiempo", value: fromNow(9 * DAY) },
      { caption: "Próximo (< 72 h)", value: fromNow(50 * HOUR) },
      { caption: "Urgente (< 24 h)", value: fromNow(3 * HOUR) },
      { caption: "Vencido", value: fromNow(-2 * DAY) },
      {
        caption: "thresholds: { danger: 4, warning: 12 }",
        value: fromNow(10 * HOUR),
        options: { thresholds: { danger: 4, warning: 12 } },
      },
      { caption: "done (cumplido)", value: fromNow(-DAY), options: { done: () => true } },
      { caption: "Vacío", value: null },
    ],
  },
  ip: {
    description:
      "IPv4 / IPv6 en mono con copiar, validación, versión y alcance (privada, pública…).",
    variants: [
      { caption: "IPv4 privada", value: "192.168.1.10" },
      { caption: "IPv4 pública", value: "8.8.8.8" },
      { caption: "CIDR", value: "10.0.0.0/8" },
      { caption: "IPv6", value: "2001:db8:85a3::8a2e:370:7334" },
      { caption: "Loopback IPv6", value: "::1" },
      { caption: "No válida", value: "999.10.1.1" },
      { caption: "Vacío", value: null },
    ],
  },
  uuid: {
    description: "UUID o hash truncado al centro, valor completo en el tooltip y botón de copiar.",
    variants: [
      { caption: "UUID", value: "3f2a9c1e-7b4d-4c2a-9f1e-1234567890ab" },
      { caption: "Hash SHA-1", value: "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3" },
      {
        caption: "visibleChars: 4",
        value: "3f2a9c1e-7b4d-4c2a-9f1e-1234567890ab",
        options: { visibleChars: 4 },
      },
      { caption: "Corto (sin truncar)", value: "abc123" },
    ],
  },
  version: {
    description: 'Versión semver en píldora con marca de "Última", "Desactualizada" o preliminar.',
    variants: [
      { caption: "Simple", value: "1.2.3" },
      { caption: 'Normaliza ("2.1")', value: "2.1" },
      {
        caption: "latestVersion (es la última)",
        value: "3.0.0",
        options: { latestVersion: "3.0.0" },
      },
      {
        caption: "latestVersion (desactualizada)",
        value: "2.4.1",
        options: { latestVersion: "3.0.0" },
      },
      { caption: "Preliminar", value: "3.1.0-beta.2" },
      { caption: "Sin formato semver", value: "build-2026" },
      { caption: "Vacío", value: null },
    ],
  },
  richtext: {
    description:
      'HTML o Markdown como vista previa en texto plano; "Ver completo" muestra el contenido con un subconjunto seguro (sin scripts, atributos ni enlaces inseguros).',
    variants: [
      {
        caption: "HTML",
        value:
          "<h3>Resumen</h3><p>El cliente <strong>aprobó</strong> la propuesta. Ver <a href='https://canek.mx'>detalle</a>.</p><ul><li>Entrega en 2 semanas</li><li>Pago 50/50</li></ul>",
      },
      {
        caption: "Markdown",
        value:
          "## Notas\n\nLlamar a **Ana** el lunes.\n\n- Revisar `contrato.pdf`\n- Confirmar [agenda](https://canek.mx)\n\n> Prioridad alta",
      },
      {
        caption: "HTML malicioso (se neutraliza)",
        value:
          "<p>Texto <img src=x onerror=alert(1)> seguro <a href='javascript:alert(1)'>sin enlace</a></p><script>alert(1)</script>",
      },
      { caption: "Corto sin formato", value: "Sin observaciones" },
      {
        caption: "richFormat: markdown, lines: 1",
        value: "**Uno** dos tres cuatro cinco seis siete ocho nueve diez",
        options: { richFormat: "markdown", lines: 1 },
      },
      { caption: "Vacío", value: null },
    ],
  },
  icon: {
    description: "Ícono con etiqueta y tono; el nombre sale del valor, de `icon` o de `statusMap`.",
    variants: [
      { caption: "Nombre de ícono como valor", value: "local_shipping" },
      {
        caption: "Objeto { icon, label, tone }",
        value: { icon: "bolt", label: "Express", tone: "warning" },
      },
      {
        caption: "statusMap (preset)",
        value: "approved",
        options: { statusMap: CN_STATUS_PRESETS.approval },
      },
      {
        caption: "icon + tone fijos",
        value: "Oficina central",
        options: { icon: "apartment", tone: "info" },
      },
      {
        caption: "iconOnly",
        value: { icon: "verified", label: "Verificado", tone: "success" },
        options: { iconOnly: true },
      },
      { caption: "subtitle", value: "cloud_done", options: { subtitle: () => "Sincronizado" } },
    ],
  },
  toggle: {
    description:
      "Interruptor en línea. `onChange(row, next)` recibe la fila; el clic no dispara el clic de la fila. Sin `onChange` queda deshabilitado.",
    variants: [
      { caption: "Interactivo (encendido)", value: true, render: () => <ToggleDemo initial /> },
      {
        caption: "Interactivo (apagado)",
        value: false,
        render: () => <ToggleDemo initial={false} />,
      },
      {
        caption: "trueLabel / falseLabel",
        value: true,
        render: () => <ToggleDemo initial labels={["Publicado", "Oculto"]} />,
      },
      { caption: "Sin onChange (deshabilitado)", value: true },
      { caption: "null = apagado", value: null },
    ],
  },
  steps: {
    description:
      "Avance por pasos (3/5) como barra segmentada o puntos, con las etiquetas en el tooltip.",
    variants: [
      { caption: "Número + max", value: 2, options: { max: 5 } },
      { caption: "stepLabels", value: 3, options: { stepLabels: ONBOARDING } },
      {
        caption: "stepsStyle: dots",
        value: 2,
        options: { stepLabels: ONBOARDING, stepsStyle: "dots" },
      },
      { caption: "{ current, total }", value: { current: 4, total: 4 } },
      { caption: 'Texto "1/3"', value: "1/3" },
      { caption: "Sin empezar", value: 0, options: { max: 4 } },
    ],
  },
  stage: {
    description: "Etapa actual de un embudo entre etapas ordenadas, como flechas o puntos.",
    variants: [
      { caption: "Inicio", value: "Prospecto", options: { stages: PIPELINE } },
      { caption: "Intermedia", value: "Propuesta", options: { stages: PIPELINE } },
      { caption: "Final", value: "Cerrado", options: { stages: PIPELINE } },
      {
        caption: "stageStyle: dots",
        value: "Negociación",
        options: { stages: PIPELINE, stageStyle: "dots" },
      },
      {
        caption: "Etapas con tono",
        value: "lost",
        options: {
          stages: [
            { value: "new", label: "Nuevo" },
            { value: "review", label: "Revisión" },
            { value: "lost", label: "Perdido", tone: "error" },
          ],
        },
      },
      { caption: "Fuera de la lista", value: "Archivado", options: { stages: PIPELINE } },
      { caption: "Vacío", value: null },
    ],
  },
  weekdays: {
    description:
      "Días de la semana L M M J V S D resaltados; acepta números (0/7 = domingo) o nombres.",
    variants: [
      { caption: "Lunes a viernes", value: [1, 2, 3, 4, 5] },
      { caption: "Fin de semana", value: ["sab", "dom"] },
      { caption: "Alternos", value: "lun, mié, vie" },
      { caption: "Todos", value: [0, 1, 2, 3, 4, 5, 6] },
      { caption: "tone: success", value: [2, 4], options: { tone: "success" } },
      { caption: "Vacío", value: [] },
    ],
  },
  timerange: {
    description: 'Horario "09:00 – 18:00" con duración (y aviso si cruza la medianoche).',
    variants: [
      { caption: "Arreglo", value: ["09:00", "18:00"] },
      { caption: "Objeto", value: { start: "08:30", end: "14:00" } },
      { caption: "Nocturno (texto)", value: "22:00-06:00" },
      {
        caption: "showDuration: false",
        value: ["10:00", "19:00"],
        options: { showDuration: false },
      },
      { caption: "Vacío", value: null },
    ],
  },
  age: {
    description:
      "Edad desde la fecha de nacimiento (con ficha de cumpleaños) o años ya calculados.",
    variants: [
      { caption: "Fecha de nacimiento", value: "1990-01-15" },
      {
        caption: "Cumple hoy",
        value: (() => {
          const d = new Date();
          return `${d.getFullYear() - 30}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })(),
      },
      { caption: "Bebé (meses)", value: isoDay(-200 * DAY) },
      { caption: "Años como número", value: 42 },
      { caption: "Vacío", value: null },
    ],
  },
  range: {
    description: "Rango mínimo–máximo numérico, de moneda o porcentaje, con mini barra opcional.",
    variants: [
      { caption: "Moneda", value: [10000, 25000], options: { rangeFormat: "currency" } },
      { caption: "Número", value: { min: 18, max: 35 } },
      { caption: "Porcentaje", value: [15, 40], options: { rangeFormat: "percent" } },
      {
        caption: "bar + max",
        value: [10000, 25000],
        options: { rangeFormat: "currency", bar: true, max: 50000 },
      },
      { caption: "Abierto", value: [500, null] },
    ],
  },
  sentiment: {
    description:
      "Sentimiento positivo / neutral / negativo, o puntuación −1…1 o 1…5, con cara y tono.",
    variants: [
      { caption: "positive", value: "positive" },
      { caption: "neutral", value: "neutral" },
      { caption: "negativo", value: "negativo" },
      { caption: "Puntuación −1…1", value: 0.82 },
      { caption: "Puntuación 1…5", value: 2, options: { sentimentScale: "five" } },
      { caption: "Desconocido", value: "???" },
    ],
  },
  score: {
    description: "Anillo de puntuación con el valor dentro y tono por umbrales.",
    variants: [
      { caption: "Alto", value: 92 },
      { caption: "Medio", value: 64 },
      { caption: "Bajo", value: 31 },
      { caption: "max: 10", value: 7.5, options: { max: 10, decimals: 1 } },
      {
        caption: "thresholds propios",
        value: 70,
        options: { thresholds: { success: 60, warning: 40 } },
      },
      { caption: "subtitle", value: 88, options: { subtitle: () => "NPS" } },
    ],
  },
  reference: {
    description: "Registro vinculado (etiqueta + id / subtítulo) con enlace o acción.",
    variants: [
      {
        caption: "Con id y subtítulo",
        value: { label: "Pedido 1024", id: "PO-1024", subtitle: "Acme SA" },
        options: { prefix: "" },
      },
      { caption: "href", value: { label: "Factura A-551", url: "https://example.com/f/551" } },
      {
        caption: "onClick",
        value: { label: "Cliente Acme", id: 88 },
        options: { onClick: log("reference") },
      },
      { caption: "Texto", value: "Proyecto Norte", options: { icon: "folder" } },
      { caption: "Vacío", value: null },
    ],
  },
  counter: {
    description:
      "Insignia numérica (notificaciones, pendientes) con tope y opción de ocultar el cero.",
    variants: [
      { caption: "Simple", value: 3 },
      { caption: "max: 99", value: 150, options: { max: 99 } },
      { caption: "Cero", value: 0 },
      { caption: "hideZero", value: 0, options: { hideZero: true } },
      { caption: "tone: primary", value: 12, options: { tone: "primary" } },
      { caption: "icon (sobre ícono)", value: 5, options: { icon: "notifications" } },
    ],
  },
};

// ─── Presentación ─────────────────────────────────────────────────────────

const describeOptions = (options?: CnCellOptions) => {
  if (!options) return "";
  return Object.entries(options)
    .map(([key, v]) =>
      typeof v === "function" ? `${key}={fn}` : `${key}={${JSON.stringify(v)?.slice(0, 40)}}`,
    )
    .join(" ");
};

const VariantCard = ({ type, variant }: { type: CnCellType; variant: Variant }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      p: "14px",
      minWidth: 0,
      borderRadius: "12px",
      border: "1px solid var(--cn-color-border, #dde0e4)",
      backgroundColor: "var(--cn-color-surface, #fff)",
    }}
  >
    <Box
      sx={{
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "var(--cn-color-text-muted, #6e7682)",
      }}
    >
      {variant.caption}
    </Box>
    <Box sx={{ minHeight: 40, display: "flex", alignItems: "center", minWidth: 0 }}>
      {variant.render ? (
        variant.render()
      ) : (
        <CnCell type={type} value={variant.value} row={variant.row} {...variant.options} />
      )}
    </Box>
    <Box
      component="code"
      sx={{
        fontSize: "0.62rem",
        lineHeight: 1.5,
        color: "var(--cn-color-text-muted, #6e7682)",
        overflowWrap: "anywhere",
      }}
    >
      {`<CnCell type="${type}" ${describeOptions(variant.options)} />`}
    </Box>
  </Box>
);

const ShowcaseView = ({ type }: { type: CnCellType }) => {
  const { description, variants } = SHOWCASE[type];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Box sx={{ fontSize: "0.85rem", color: "var(--cn-color-text-muted, #6e7682)" }}>
        <Box component="code" sx={{ fontWeight: 700, mr: "8px" }}>
          type=&quot;{type}&quot;
        </Box>
        {description}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "12px",
        }}
      >
        {variants.map((variant) => (
          <VariantCard key={variant.caption} type={type} variant={variant} />
        ))}
      </Box>
    </Box>
  );
};

const show = (type: CnCellType): Story => ({
  name: type,
  render: () => <ShowcaseView type={type} />,
});

// ─── Resumen ──────────────────────────────────────────────────────────────

/** Todos los tipos en una tabla: ejemplo visual y su texto plano (búsqueda / exportación). */
export const AllTypes: Story = {
  name: "Todos los tipos",
  render: () => (
    <Box component="table" sx={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
      <thead>
        <tr>
          {["Tipo", "Descripción", "Ejemplo", "Texto plano"].map((head) => (
            <Box
              component="th"
              key={head}
              sx={{
                textAlign: "left",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--cn-color-text-muted, #6e7682)",
                p: "8px 12px",
                borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
              }}
            >
              {head}
            </Box>
          ))}
        </tr>
      </thead>
      <tbody>
        {(Object.keys(SHOWCASE) as CnCellType[]).map((type) => {
          const first = SHOWCASE[type].variants[0];
          return (
            <Box
              component="tr"
              key={type}
              sx={{
                "& td": {
                  p: "8px 12px",
                  borderBottom: "1px solid #f0f1f3",
                  verticalAlign: "middle",
                },
              }}
            >
              <td>
                <Box component="code" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                  {type}
                </Box>
              </td>
              <Box component="td" sx={{ fontSize: "0.75rem", maxWidth: 320 }}>
                {SHOWCASE[type].description}
              </Box>
              <td>
                {first.render ? (
                  first.render()
                ) : (
                  <CnCell type={type} value={first.value} row={first.row} {...first.options} />
                )}
              </td>
              <Box component="td" sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
                {formatCellText(type, first.value, first.row ?? {}, first.options)}
              </Box>
            </Box>
          );
        })}
      </tbody>
    </Box>
  ),
};

/** Contextos de celda vacía (`emptyContext`) disponibles para cualquier tipo. */
export const EmptyStates: Story = {
  name: "Vacíos (emptyContext)",
  render: () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "12px",
      }}
    >
      {(
        [
          "empty",
          "not_assigned",
          "not_available",
          "not_applicable",
          "pending",
          "none",
          "no_data",
          "not_found",
          "inactive",
          "deleted",
          "success",
          "active",
          "cancelled",
          "expired",
          "draft",
          "archived",
          "no_value",
          "null",
        ] as const
      ).map((context) => (
        <VariantCard
          key={context}
          type="text"
          variant={{ caption: context, value: null, options: { emptyContext: context } }}
        />
      ))}
    </Box>
  ),
};

// ─── Una historia por tipo ────────────────────────────────────────────────

export const TextCell = show("text");
export const IdCell = show("id");
export const CodeCell = show("code");
export const RfcCell = show("rfc");
export const CurpCell = show("curp");
export const NumberCell = show("number");
export const CurrencyCell = show("currency");
export const PercentCell = show("percent");
export const ProgressCell = show("progress");
export const DateCell = show("date");
export const DatetimeCell = show("datetime");
export const TimeCell = show("time");
export const DurationCell = show("duration");
export const BooleanCell = show("boolean");
export const StatusCell = show("status");
export const TagsCell = show("tags");
export const AvatarCell = show("avatar");
export const ContactCell = show("contact");
export const EmailCell = show("email");
export const PhoneCell = show("phone");
export const LinkCell = show("link");
export const LocationCell = show("location");
export const ImageCell = show("image");
export const RatingCell = show("rating");
export const FileCell = show("file");
export const ColorCell = show("color");
export const CountryCell = show("country");
export const JsonCell = show("json");
export const DaterangeCell = show("daterange");
export const BytesCell = show("bytes");
export const SparklineCell = show("sparkline");
export const ListCell = show("list");
export const CoordinatesCell = show("coordinates");
export const MaskedCell = show("masked");
export const DeltaCell = show("delta");
export const PriorityCell = show("priority");
export const DeadlineCell = show("deadline");
export const IpCell = show("ip");
export const UuidCell = show("uuid");
export const VersionCell = show("version");
export const RichtextCell = show("richtext");
export const IconCell = show("icon");
export const ToggleCell = show("toggle");
export const StepsCell = show("steps");
export const StageCell = show("stage");
export const WeekdaysCell = show("weekdays");
export const TimerangeCell = show("timerange");
export const AgeCell = show("age");
export const RangeCell = show("range");
export const SentimentCell = show("sentiment");
export const ScoreCell = show("score");
export const ReferenceCell = show("reference");
export const CounterCell = show("counter");
