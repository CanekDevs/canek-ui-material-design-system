/**
 * Lógica pura (sin React) de los tipos de celda: interpreta valores, calcula
 * urgencias, versiones, rangos… La comparten la vista, el texto plano
 * (búsqueda / exportación) y el orden de la tabla.
 */

export type CnCellToneName =
  "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral";

const num = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ─── Prioridad ──────────────────────────────────────────────────────────

export type CnPriorityOption = {
  label?: string;
  tone?: CnCellToneName;
  /** Nivel 1–4 (barras llenas y orden). */
  level?: number;
  icon?: string;
};

export type CnResolvedPriority = Required<CnPriorityOption> & { key: string };

const PRIORITY_BASE: Record<string, Required<CnPriorityOption>> = {
  low: { label: "Baja", tone: "neutral", level: 1, icon: "keyboard_arrow_down" },
  medium: { label: "Media", tone: "info", level: 2, icon: "drag_handle" },
  high: { label: "Alta", tone: "warning", level: 3, icon: "keyboard_arrow_up" },
  critical: { label: "Crítica", tone: "error", level: 4, icon: "priority_high" },
};

const PRIORITY_ALIASES: Record<string, keyof typeof PRIORITY_BASE> = {
  "1": "low",
  baja: "low",
  bajo: "low",
  lowest: "low",
  "2": "medium",
  media: "medium",
  medio: "medium",
  normal: "medium",
  "3": "high",
  alta: "high",
  alto: "high",
  "4": "critical",
  critica: "critical",
  crítica: "critical",
  critico: "critical",
  crítico: "critical",
  urgente: "critical",
  urgent: "critical",
  highest: "critical",
  blocker: "critical",
};

/** Prioridad de un valor (`"high"`, `"alta"`, `3`…) con el mapa propio encima. */
export const resolvePriority = (
  value: unknown,
  map?: Record<string, CnPriorityOption>,
): CnResolvedPriority => {
  const key = String(value);
  const custom = map?.[key];
  const lower = key.toLowerCase().trim();
  const baseKey = (lower in PRIORITY_BASE ? lower : PRIORITY_ALIASES[lower]) as
    keyof typeof PRIORITY_BASE | undefined;
  const base = baseKey
    ? PRIORITY_BASE[baseKey]
    : { label: key, tone: "neutral" as const, level: 0, icon: "flag" };
  return { key, ...base, ...custom } as CnResolvedPriority;
};

// ─── Vencimiento (SLA) ──────────────────────────────────────────────────

export type CnCellThresholds = {
  /** deadline: horas restantes para tono de error. score: mínimo para éxito. */
  danger?: number;
  /** deadline: horas restantes para tono de advertencia. score: mínimo para advertencia. */
  warning?: number;
  /** score: valor mínimo para tono de éxito. */
  success?: number;
};

export type CnDeadlineInfo = {
  /** "vence en 3 h", "vencido hace 2 d". */
  label: string;
  tone: CnCellToneName;
  icon: string;
  overdue: boolean;
  /** Milisegundos restantes (negativo si venció). */
  remaining: number;
};

const shortSpan = (ms: number): string => {
  const minutes = Math.round(Math.abs(ms) / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} d`;
  if (days < 60) return plural(Math.round(days / 7), "sem", "sem");
  return plural(Math.round(days / 30), "mes", "meses");
};

/** Urgencia de un vencimiento: texto relativo, tono e ícono. */
export const describeDeadline = (
  due: Date,
  now: Date = new Date(),
  thresholds: CnCellThresholds = {},
): CnDeadlineInfo => {
  const remaining = due.getTime() - now.getTime();
  const hours = remaining / 3600000;
  const danger = thresholds.danger ?? 24;
  const warning = thresholds.warning ?? 72;
  if (remaining < 0) {
    return {
      label: `vencido hace ${shortSpan(remaining)}`,
      tone: "error",
      icon: "timer_off",
      overdue: true,
      remaining,
    };
  }
  const label = `vence en ${shortSpan(remaining)}`;
  if (hours <= danger) return { label, tone: "error", icon: "alarm", overdue: false, remaining };
  if (hours <= warning) {
    return { label, tone: "warning", icon: "hourglass_full", overdue: false, remaining };
  }
  return { label, tone: "success", icon: "hourglass_empty", overdue: false, remaining };
};

// ─── IP ─────────────────────────────────────────────────────────────────

export type CnIpInfo = {
  address: string;
  version: 4 | 6 | null;
  valid: boolean;
  prefix?: number;
  scope?: "privada" | "pública" | "loopback" | "enlace local" | "reservada";
};

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const isIpv6 = (text: string): boolean => {
  if (!/^[0-9a-f:.]+$/i.test(text) || !text.includes(":")) return false;
  const doubles = text.split("::").length - 1;
  if (doubles > 1) return false;
  let groups = text.split(":").filter((g, i, all) => g !== "" || (i > 0 && i < all.length - 1));
  let budget = 8;
  const last = groups[groups.length - 1];
  if (last && last.includes(".")) {
    if (!IPV4_RE.test(last)) return false;
    groups = groups.slice(0, -1);
    budget = 6;
  }
  const filled = groups.filter(Boolean);
  if (filled.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return false;
  return doubles ? filled.length < budget : filled.length === budget;
};

/** Valida y clasifica una IPv4 / IPv6 (con prefijo CIDR opcional). */
export const parseIp = (value: unknown): CnIpInfo => {
  const raw = String(value).trim();
  const [address, prefixText] = raw.split("/");
  const prefix = prefixText !== undefined ? Number(prefixText) : undefined;
  const prefixOk = prefix === undefined || (Number.isInteger(prefix) && prefix >= 0);
  if (IPV4_RE.test(address) && prefixOk && (prefix ?? 0) <= 32) {
    const [a, b] = address.split(".").map(Number);
    const scope =
      a === 127
        ? "loopback"
        : a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
          ? "privada"
          : a === 169 && b === 254
            ? "enlace local"
            : a === 0 || a >= 224
              ? "reservada"
              : "pública";
    return { address, version: 4, valid: true, prefix, scope };
  }
  if (isIpv6(address) && prefixOk && (prefix ?? 0) <= 128) {
    const lower = address.toLowerCase();
    const scope =
      lower === "::1"
        ? "loopback"
        : /^f[cd]/.test(lower)
          ? "privada"
          : /^fe[89ab]/.test(lower)
            ? "enlace local"
            : "pública";
    return { address, version: 6, valid: true, prefix, scope };
  }
  return {
    address: raw,
    version: raw.includes(":") ? 6 : raw.includes(".") ? 4 : null,
    valid: false,
  };
};

// ─── UUID / hash ────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown) => UUID_RE.test(String(value));

/** "3f2a9c1e…a91b": conserva el inicio y el final. */
export const truncateMiddle = (text: string, head = 8, tail = 4): string =>
  text.length <= head + tail + 1 ? text : `${text.slice(0, head)}…${text.slice(-tail)}`;

// ─── Versión (semver) ───────────────────────────────────────────────────

export type CnVersionInfo = {
  /** "v1.2.3-beta.1" (o el texto original si no es semver). */
  text: string;
  valid: boolean;
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
};

const SEMVER_RE = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9a-z.-]+))?(?:\+[0-9a-z.-]+)?$/i;

export const parseVersion = (value: unknown): CnVersionInfo => {
  const raw = String(value).trim();
  const match = SEMVER_RE.exec(raw);
  if (!match) return { text: raw, valid: false, major: 0, minor: 0, patch: 0 };
  const major = Number(match[1]);
  const minor = Number(match[2] ?? 0);
  const patch = Number(match[3] ?? 0);
  const prerelease = match[4];
  return {
    text: `v${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ""}`,
    valid: true,
    major,
    minor,
    patch,
    prerelease,
  };
};

/** Compara versiones semver: negativo si `a` es anterior a `b`. */
export const compareVersions = (a: unknown, b: unknown): number => {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  const diff = va.major - vb.major || va.minor - vb.minor || va.patch - vb.patch;
  if (diff) return diff;
  if (va.prerelease && !vb.prerelease) return -1;
  if (!va.prerelease && vb.prerelease) return 1;
  return (va.prerelease ?? "").localeCompare(vb.prerelease ?? "", "en", { numeric: true });
};

// ─── Texto enriquecido ──────────────────────────────────────────────────

export type CnRichFormat = "auto" | "html" | "markdown";

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  Ntilde: "Ñ",
  uuml: "ü",
  iexcl: "¡",
  iquest: "¿",
};

export const decodeEntities = (text: string): string =>
  text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : whole;
    }
    return ENTITIES[code] ?? ENTITIES[code.toLowerCase()] ?? whole;
  });

export const looksLikeHtml = (text: string) => /<\/?[a-z][a-z0-9]*[\s>/]/i.test(text);

export const detectRichFormat = (text: string, format: CnRichFormat = "auto") =>
  format === "auto" ? (looksLikeHtml(text) ? "html" : "markdown") : format;

/** HTML o Markdown → texto plano (para vista previa, búsqueda y exportación). */
export const stripRichText = (value: unknown, format: CnRichFormat = "auto"): string => {
  const raw = String(value ?? "");
  if (detectRichFormat(raw, format) === "html") {
    return decodeEntities(
      raw
        .replace(/<(script|style|template|iframe|object)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|pre)>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ")
        .replace(/<[^>]+>/g, ""),
    )
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\s*\n\s*/g, "\n")
      .trim();
  }
  return raw
    .replace(/```[a-z]*\n?([\s\S]*?)```/gi, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

// ─── Días de la semana ──────────────────────────────────────────────────

/** Iniciales en orden ISO (lunes primero). */
export const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];
export const WEEKDAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const WEEKDAY_WORDS: Record<string, number> = {
  l: 1,
  lu: 1,
  lun: 1,
  lunes: 1,
  mon: 1,
  monday: 1,
  ma: 2,
  mar: 2,
  martes: 2,
  tue: 2,
  tuesday: 2,
  x: 3,
  mi: 3,
  mie: 3,
  mié: 3,
  miercoles: 3,
  miércoles: 3,
  wed: 3,
  wednesday: 3,
  j: 4,
  ju: 4,
  jue: 4,
  jueves: 4,
  thu: 4,
  thursday: 4,
  v: 5,
  vi: 5,
  vie: 5,
  viernes: 5,
  fri: 5,
  friday: 5,
  s: 6,
  sa: 6,
  sab: 6,
  sáb: 6,
  sabado: 6,
  sábado: 6,
  sat: 6,
  saturday: 6,
  d: 7,
  do: 7,
  dom: 7,
  domingo: 7,
  sun: 7,
  sunday: 7,
};

/**
 * Días seleccionados en ISO (1 = lunes … 7 = domingo). Acepta números
 * (0 o 7 = domingo), nombres en español o inglés y textos separados por comas.
 */
export const parseWeekdays = (value: unknown): number[] => {
  const list = Array.isArray(value) ? value : String(value ?? "").split(/[,;\s]+/);
  const days = new Set<number>();
  for (const item of list) {
    const n = num(item);
    if (n !== null && Number.isInteger(n) && n >= 0 && n <= 7) {
      days.add(n === 0 ? 7 : n);
      continue;
    }
    const word = WEEKDAY_WORDS[String(item).trim().toLowerCase()];
    if (word) days.add(word);
  }
  return [...days].sort((a, b) => a - b);
};

/** "Lunes a viernes", "Fin de semana", "Lun, Mié, Vie". */
export const weekdaysText = (days: number[]): string => {
  const key = days.join(",");
  if (key === "1,2,3,4,5,6,7") return "Todos los días";
  if (key === "1,2,3,4,5") return "Lunes a viernes";
  if (key === "1,2,3,4,5,6") return "Lunes a sábado";
  if (key === "6,7") return "Fin de semana";
  return days.map((d) => WEEKDAY_SHORT[d - 1]).join(", ");
};

// ─── Horario ────────────────────────────────────────────────────────────

const toClock = (value: unknown): number | null => {
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = /(\d{1,2}):(\d{2})/.exec(String(value ?? ""));
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h <= 24 && m < 60 ? h * 60 + m : null;
};

const clockText = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export type CnTimeRangeInfo = {
  start?: string;
  end?: string;
  /** Duración en minutos (cruza la medianoche si el fin es menor). */
  minutes?: number;
  overnight: boolean;
};

/** `["09:00", "18:00"]`, `{ start, end }` o `"09:00-18:00"`. */
export const parseTimeRange = (value: unknown): CnTimeRangeInfo => {
  let from: unknown;
  let to: unknown;
  if (Array.isArray(value)) [from, to] = value;
  else if (value && typeof value === "object" && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    from = obj.start ?? obj.from ?? obj.open;
    to = obj.end ?? obj.to ?? obj.close;
  } else {
    [from, to] = String(value ?? "").split(/\s*(?:–|—|-)\s*|\s+a\s+/);
  }
  const a = toClock(from);
  const b = toClock(to);
  const overnight = a !== null && b !== null && b <= a;
  return {
    start: a !== null ? clockText(a) : undefined,
    end: b !== null ? clockText(b) : undefined,
    minutes: a !== null && b !== null ? (overnight ? b + 1440 - a : b - a) : undefined,
    overnight,
  };
};

/** 510 → "8 h 30 min". */
export const minutesText = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return [h ? `${h} h` : "", m || !h ? `${m} min` : ""].filter(Boolean).join(" ");
};

// ─── Edad ───────────────────────────────────────────────────────────────

export type CnAgeInfo = {
  years: number;
  months: number;
  birth?: Date;
  /** Días para el próximo cumpleaños (0 = hoy). */
  nextBirthdayIn?: number;
  text: string;
};

/** Edad desde la fecha de nacimiento (o años ya calculados). */
export const ageFrom = (birthOrYears: Date | number, now: Date = new Date()): CnAgeInfo => {
  if (typeof birthOrYears === "number") {
    const years = Math.floor(birthOrYears);
    return { years, months: 0, text: plural(years, "año", "años") };
  }
  const birth = birthOrYears;
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const nextBirthdayIn = Math.round((next.getTime() - today.getTime()) / 86400000);
  const text =
    years >= 1 ? plural(years, "año", "años") : plural(Math.max(0, months), "mes", "meses");
  return { years, months, birth, nextBirthdayIn, text };
};

// ─── Rango numérico ─────────────────────────────────────────────────────

/** `[min, max]`, `{ min, max }` o `{ from, to }`. */
export const parseNumericRange = (value: unknown): [number | null, number | null] => {
  if (Array.isArray(value)) return [num(value[0]), num(value[1])];
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return [num(obj.min ?? obj.from ?? obj.start), num(obj.max ?? obj.to ?? obj.end)];
  }
  const parts = String(value ?? "").split(/\s*(?:–|—|\.\.)\s*|\s+a\s+|(?<=\d)\s*-\s*/);
  return [num(parts[0]), num(parts[1])];
};

// ─── Sentimiento ────────────────────────────────────────────────────────

export type CnSentimentInfo = {
  /** -2 (muy negativo) … 2 (muy positivo). */
  level: -2 | -1 | 0 | 1 | 2;
  label: string;
  tone: CnCellToneName;
  /** Puntuación original (si era numérica). */
  score?: number;
};

const SENTIMENT_LEVELS: Record<string, CnSentimentInfo["level"]> = {
  very_positive: 2,
  "muy positivo": 2,
  muy_positivo: 2,
  excelente: 2,
  positive: 1,
  positivo: 1,
  pos: 1,
  good: 1,
  bueno: 1,
  neutral: 0,
  neutro: 0,
  mixed: 0,
  mixto: 0,
  negative: -1,
  negativo: -1,
  neg: -1,
  bad: -1,
  malo: -1,
  very_negative: -2,
  "muy negativo": -2,
  muy_negativo: -2,
  pésimo: -2,
  pesimo: -2,
};

const SENTIMENT_LOOK: Record<CnSentimentInfo["level"], { label: string; tone: CnCellToneName }> = {
  2: { label: "Muy positivo", tone: "success" },
  1: { label: "Positivo", tone: "success" },
  0: { label: "Neutral", tone: "neutral" },
  [-1]: { label: "Negativo", tone: "warning" },
  [-2]: { label: "Muy negativo", tone: "error" },
};

/**
 * Sentimiento de un texto (`"positive"`, `"negativo"`…) o una puntuación:
 * `-1…1` (escala `unit`) o `1…5` (escala `five`). En `auto`, valores mayores
 * que 1 se leen en escala de 5.
 */
export const resolveSentiment = (
  value: unknown,
  scale: "auto" | "unit" | "five" = "auto",
): CnSentimentInfo | null => {
  const n = num(value);
  let level: CnSentimentInfo["level"] | undefined;
  if (n !== null) {
    const useFive = scale === "five" || (scale === "auto" && Math.abs(n) > 1);
    if (useFive) level = Math.max(-2, Math.min(2, Math.round(n) - 3)) as CnSentimentInfo["level"];
    else level = n >= 0.6 ? 2 : n >= 0.2 ? 1 : n > -0.2 ? 0 : n > -0.6 ? -1 : -2;
  } else {
    level = SENTIMENT_LEVELS[String(value).trim().toLowerCase()];
  }
  if (level === undefined) return null;
  return { level, ...SENTIMENT_LOOK[level], score: n ?? undefined };
};

// ─── Pasos y etapas ─────────────────────────────────────────────────────

export type CnStepsInfo = { current: number; total: number; labels: string[] };

/** `3`, `[3, 5]` o `{ current, total }`; el total sale de las etiquetas o `max`. */
export const parseSteps = (value: unknown, labels: string[] = [], max?: number): CnStepsInfo => {
  let current: number | null = null;
  let total: number | null = null;
  if (Array.isArray(value)) [current, total] = [num(value[0]), num(value[1])];
  else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    current = num(obj.current ?? obj.value ?? obj.done);
    total = num(obj.total ?? obj.max ?? obj.of);
  } else if (typeof value === "string" && value.includes("/")) {
    const [a, b] = value.split("/");
    [current, total] = [num(a), num(b)];
  } else current = num(value);
  const finalTotal = Math.max(1, total ?? (labels.length || max || 5));
  return {
    current: Math.max(0, Math.min(finalTotal, current ?? 0)),
    total: finalTotal,
    labels,
  };
};

export type CnStageOption = { value: string; label?: string; tone?: CnCellToneName };

export const normalizeStages = (stages: readonly (string | CnStageOption)[] = []) =>
  stages.map((stage) =>
    typeof stage === "string"
      ? { value: stage, label: stage }
      : { ...stage, label: stage.label ?? stage.value },
  );

// ─── Referencia ─────────────────────────────────────────────────────────

export type CnReference = {
  label: string;
  id?: string | number;
  subtitle?: string;
  href?: string;
};

export const asReference = (value: unknown): CnReference => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return {
      label: String(obj.label ?? obj.name ?? obj.title ?? obj.id ?? ""),
      id: (obj.id ?? obj.code ?? obj.folio) as string | number | undefined,
      subtitle: obj.subtitle !== undefined ? String(obj.subtitle) : undefined,
      href: (obj.href ?? obj.url) as string | undefined,
    };
  }
  return { label: String(value) };
};

// ─── Variación ──────────────────────────────────────────────────────────

export type CnDeltaInfo = {
  /** Cambio en las unidades del formato (puntos %, número o importe). */
  change: number;
  /** Cambio porcentual (si hay valor anterior). */
  percent?: number;
  direction: "up" | "down" | "flat";
};

/** Variación: con `previous` se calcula; sin él el valor ya es el cambio. */
export const computeDelta = (
  value: number,
  previous: number | undefined,
  format: "percent" | "number" | "currency" = "percent",
): CnDeltaInfo => {
  if (previous === undefined) {
    return { change: value, direction: value > 0 ? "up" : value < 0 ? "down" : "flat" };
  }
  const diff = value - previous;
  const percent = previous ? (diff / Math.abs(previous)) * 100 : undefined;
  const change = format === "percent" ? (percent ?? 0) : diff;
  return { change, percent, direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat" };
};
