import { addDays, normalizeText, startOfDay } from "./calendar-utils";
import type { CnEventCategory } from "./CnEventCalendar.types";

/*
 * Alta rápida en lenguaje natural (es-MX), pensada para frases cortas:
 *   "Reunión con Ana mañana 10:00–11:30 #trabajo"
 *   "Dentista el viernes a las 5pm 45 min @Consultorio_3"
 *   "Cierre de mes 30/11 todo el día #finanzas"
 *
 * Reconoce:
 * - Días: hoy, mañana, pasado mañana, ayer, lunes…domingo (con "próximo"/"este"),
 *   "en 3 días", "la próxima semana", dd/mm[/aaaa], "el dd-mm[-aaaa]",
 *   "15 de noviembre [de 2027]", "15 nov".
 * - Horas: 10, 10:30, 10am, 5 pm, 17h, "a las 10", "10 de la noche",
 *   "mediodía"; rangos 10–11:30, "de 10 a 12", "10-11am".
 *   Las horas sin am/pm de 1 a 7 se toman como de la tarde.
 * - Duración: 1h, 90 min, 1h30, 1.5 h, "media hora", "hora y media".
 * - "todo el día", #categoría (por id o etiqueta) y @lugar (`_` = espacio).
 */

export type CnQuickParseOptions = {
  /** Referencia para "hoy" (por defecto ahora). */
  now?: Date;
  categories?: CnEventCategory[];
  /** Duración por defecto con hora de inicio (min). */
  defaultDuration?: number;
};

export type CnQuickParseResult = {
  title: string;
  start: Date;
  /** Fin exclusivo (todo el día: medianoche siguiente). */
  end: Date;
  allDay: boolean;
  category?: string;
  /** Todas las etiquetas `#` encontradas. */
  tags: string[];
  location?: string;
  /** ¿Se reconoció fecha y/u hora? (para mostrar la vista previa). */
  hasDate: boolean;
  hasTime: boolean;
};

const L0 = "(?<![\\p{L}\\p{N}])";
const L1 = "(?![\\p{L}\\p{N}])";
const re = (source: string) => new RegExp(source, "iu");

const WEEKDAYS: [RegExp, number][] = [
  [/^domingo$/, 0],
  [/^lunes$/, 1],
  [/^martes$/, 2],
  [/^mi[eé]rcoles$/, 3],
  [/^jueves$/, 4],
  [/^viernes$/, 5],
  [/^s[aá]bado$/, 6],
];

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const MARK = "\u0001";

type TimeOfDay = { h: number; m: number; explicitMeridiem: boolean };

const applyMeridiem = (h: number, meridiem: string | undefined): number => {
  const mer = meridiem ? normalizeText(meridiem).replace(/[.\s]/g, "") : "";
  if (mer.startsWith("p") || mer === "delatarde" || mer === "delanoche") return h < 12 ? h + 12 : h;
  if (mer.startsWith("a") || mer === "delamanana") return h === 12 ? 0 : h;
  return h;
};

const MERIDIEM = "(a\\.?\\s?m\\.?|p\\.?\\s?m\\.?|de la (?:tarde|noche|ma[ñn]ana)|h(?:rs?)?|hs)";

/** Interpreta una frase corta en español como evento. `null` si no hay texto útil. */
export const parseQuickEvent = (
  text: string,
  options: CnQuickParseOptions = {},
): CnQuickParseResult | null => {
  const { now = new Date(), categories = [], defaultDuration = 60 } = options;
  let w = ` ${text.replace(/\s+/g, " ").trim()} `;
  if (!w.trim()) return null;
  const today = startOfDay(now);

  const take = (regex: RegExp): RegExpExecArray | null => {
    const m = regex.exec(w);
    if (m) w = `${w.slice(0, m.index)} ${MARK} ${w.slice(m.index + m[0].length)}`;
    return m;
  };

  // ─── Etiquetas y lugar ───────────────────────────────────────────────
  const tags: string[] = [];
  for (
    let m = take(re(`(?:^|\\s)#([\\p{L}\\p{N}_-]+)`));
    m;
    m = take(re(`(?:^|\\s)#([\\p{L}\\p{N}_-]+)`))
  ) {
    tags.push(m[1]);
  }
  w = w.replace(new RegExp(` ${MARK} `, "g"), " ");
  const category =
    tags
      .map((t) => {
        const key = normalizeText(t.replace(/_/g, " "));
        return categories.find((c) => normalizeText(c.id) === key || normalizeText(c.label) === key)
          ?.id;
      })
      .find(Boolean) ?? (tags[0] ? tags[0] : undefined);

  const locMatch = /(?:^|\s)@("([^"]+)"|[^\s]+)/u.exec(w);
  let location: string | undefined;
  if (locMatch) {
    location = (locMatch[2] ?? locMatch[1]).replace(/_/g, " ");
    w = `${w.slice(0, locMatch.index)} ${w.slice(locMatch.index + locMatch[0].length)}`;
  }

  // ─── Todo el día ─────────────────────────────────────────────────────
  const allDayExplicit = Boolean(take(re(`${L0}todo el d[ií]a${L1}`)));

  // ─── Parte del día ("en la mañana", "por la tarde") ──────────────────
  let dayPart: "am" | "pm" | null = null;
  const part = take(re(`${L0}(?:en|por|de) la (ma[ñn]ana|tarde|noche)${L1}`));
  if (part) dayPart = normalizeText(part[1]).startsWith("man") ? "am" : "pm";

  // ─── Fecha ────────────────────────────────────────────────────────────
  let date: Date | null = null;
  const year = (y: string | undefined, month: number, day: number): Date => {
    if (y) return new Date(y.length === 2 ? 2000 + Number(y) : Number(y), month, day);
    const candidate = new Date(today.getFullYear(), month, day);
    return candidate < today ? new Date(today.getFullYear() + 1, month, day) : candidate;
  };

  let m: RegExpExecArray | null;
  if ((m = take(re(`${L0}pasado ma[ñn]ana${L1}`)))) date = addDays(today, 2);
  else if ((m = take(re(`${L0}ma[ñn]ana${L1}`)))) date = addDays(today, 1);
  else if ((m = take(re(`${L0}hoy${L1}`)))) date = today;
  else if ((m = take(re(`${L0}ayer${L1}`)))) date = addDays(today, -1);
  else if ((m = take(re(`${L0}en (\\d{1,3}) d[ií]as?${L1}`)))) date = addDays(today, Number(m[1]));
  else if ((m = take(re(`${L0}(?:la )?(?:pr[oó]xima|siguiente) semana${L1}`)))) {
    date = addDays(today, 7);
  } else if (
    (m = take(
      re(
        `${L0}(?:el )?(?:(pr[oó]ximo|siguiente|este) )?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)${L1}`,
      ),
    ))
  ) {
    const name = m[2].toLocaleLowerCase();
    const weekday = WEEKDAYS.find(([r]) => r.test(name))?.[1] ?? 1;
    let delta = (weekday - today.getDay() + 7) % 7;
    if (delta === 0 && m[1] && !/^este$/i.test(m[1])) delta = 7;
    date = addDays(today, delta);
  } else if ((m = take(re(`${L0}(?:el )?(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?${L1}`)))) {
    date = year(m[3], Number(m[2]) - 1, Number(m[1]));
  } else if ((m = take(re(`${L0}el (\\d{1,2})-(\\d{1,2})(?:-(\\d{2,4}))?${L1}`)))) {
    date = year(m[3], Number(m[2]) - 1, Number(m[1]));
  } else if ((m = take(re(`${L0}(\\d{1,2})-(\\d{1,2})-(\\d{4})${L1}`)))) {
    date = year(m[3], Number(m[2]) - 1, Number(m[1]));
  } else if (
    (m = take(
      re(
        `${L0}(?:el )?(\\d{1,2})(?: de)? (ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep(?:tiembre)?|sept|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)\\.?(?:(?: de)? (\\d{4}))?${L1}`,
      ),
    ))
  ) {
    const month = MONTHS.indexOf(m[2].slice(0, 3).toLocaleLowerCase());
    date = year(m[3], month, Number(m[1]));
  }
  const hasDate = Boolean(date);
  if (date && Number.isNaN(date.getTime())) date = null;

  // ─── Horas (antes de la duración: "a las 17h" no es una duración) ────
  const fixDefault = (t: TimeOfDay): TimeOfDay => {
    if (t.explicitMeridiem) return t;
    if (dayPart === "pm" && t.h < 12) return { ...t, h: t.h + 12 };
    if (dayPart === "am") return t;
    // Sin am/pm: de 1 a 7 se asume la tarde (horario laboral).
    return t.h >= 1 && t.h <= 7 ? { ...t, h: t.h + 12 } : t;
  };
  const time = (h: string, min: string | undefined, mer: string | undefined): TimeOfDay => {
    const isClock = mer ? /^h/i.test(mer.trim()) : false;
    const explicit = Boolean(mer) && !isClock;
    return {
      h: explicit ? applyMeridiem(Number(h), mer) : Number(h),
      m: Number(min ?? 0),
      explicitMeridiem: explicit || isClock || Number(h) > 12 || Number(h) === 0,
    };
  };

  let startTime: TimeOfDay | null = null;
  let endTime: TimeOfDay | null = null;
  const rangeRe = re(
    `${L0}(de |desde |entre )?(?:las? )?(\\d{1,2})(?::(\\d{2}))?\\s?${MERIDIEM}?\\s?(-|–|—|a|hasta|y)\\s?(?:las? )?(\\d{1,2})(?::(\\d{2}))?\\s?${MERIDIEM}?${L1}`,
  );
  if ((m = rangeRe.exec(w))) {
    // Exige alguna marca de hora (":", am/pm, guion, "de… a…") para no confundir números.
    const hint = Boolean(m[1] || m[3] || m[4] || m[7] || m[8]) || /^[-–—]$/.test(m[5]);
    const valid = Number(m[2]) <= 24 && Number(m[6]) <= 24 && Number(m[3] ?? 0) < 60;
    if (hint && valid) {
      take(rangeRe);
      const endMer = m[8];
      const startMer = m[4] ?? (endMer && !/^h/i.test(endMer) ? endMer : undefined);
      startTime = time(m[2], m[3], startMer);
      endTime = time(m[6], m[7], endMer);
      if (
        !m[4] &&
        startMer &&
        startTime.h > endTime.h &&
        startTime.h - 12 >= 0 &&
        startTime.h - 12 < endTime.h
      ) {
        // "11-1pm": el inicio queda en la mañana.
        startTime = { ...startTime, h: startTime.h - 12 };
      }
    }
  }
  if (!startTime) {
    const single = take(
      re(`${L0}(?:a las|a la|las|@)\\s?(\\d{1,2})(?::(\\d{2}))?\\s?${MERIDIEM}?${L1}`),
    );
    if (single && Number(single[1]) <= 24) {
      startTime = time(single[1], single[2], single[3]);
    }
  }

  // ─── Duración ─────────────────────────────────────────────────────────
  let duration: number | null = null;
  if ((m = take(re(`${L0}(?:por |durante )?hora y media${L1}`)))) duration = 90;
  else if ((m = take(re(`${L0}(?:por |durante )?media hora${L1}`)))) duration = 30;
  else if (
    (m = take(
      re(
        `${L0}(?:por |durante )?(\\d+(?:[.,]\\d+)?)\\s?(?:h|hr|hrs|horas?)(?:\\s?(\\d{1,2})\\s?(?:m|min|mins|minutos)?)?${L1}`,
      ),
    ))
  ) {
    duration = Math.round(Number(m[1].replace(",", ".")) * 60) + Number(m[2] ?? 0);
  } else if ((m = take(re(`${L0}(?:por |durante )?(\\d{1,3})\\s?(?:m|min|mins|minutos)${L1}`)))) {
    duration = Number(m[1]);
  }

  if (!startTime) {
    const single =
      take(re(`${L0}(\\d{1,2}):(\\d{2})\\s?${MERIDIEM}?${L1}`)) ??
      take(re(`${L0}(\\d{1,2})()\\s?(a\\.?\\s?m\\.?|p\\.?\\s?m\\.?)(?![\\p{L}\\p{N}])`)) ??
      take(re(`${L0}(\\d{1,2})()\\s?(de la (?:tarde|noche|ma[ñn]ana))${L1}`));
    if (single && Number(single[1]) <= 24) {
      startTime = time(single[1], single[2] || undefined, single[3]);
    } else if (take(re(`${L0}(?:al |a )?medio ?d[ií]a${L1}`))) {
      startTime = { h: 12, m: 0, explicitMeridiem: true };
    } else if (hasDate) {
      // "mañana 10": número suelto justo después de la fecha.
      const bare = re(`${MARK}\\s+(\\d{1,2})(?::(\\d{2}))?${L1}`).exec(w);
      if (bare && Number(bare[1]) <= 23) {
        w = w.replace(bare[0], `${MARK} ${MARK}`);
        startTime = time(bare[1], bare[2], undefined);
      }
    }
  }
  if (startTime) startTime = fixDefault(startTime);
  if (endTime) {
    endTime = endTime.explicitMeridiem ? endTime : fixDefault(endTime);
    if (
      startTime &&
      endTime.h * 60 + endTime.m <= startTime.h * 60 + startTime.m &&
      endTime.h < 12
    ) {
      endTime = { ...endTime, h: endTime.h + 12 };
    }
  }

  // ─── Título ──────────────────────────────────────────────────────────
  const title = w
    .split(MARK)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/(?:^|\s)(?:el|a las|a la|las|de|para|a|en|por)\s*$/iu, "")
    .replace(/^[,.;:\-–\s]+|[,.;:\-–\s]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!title && !hasDate && !startTime) return null;

  const day = date ?? today;
  const allDay = allDayExplicit || !startTime;
  if (allDay) {
    const days = duration && duration >= 1440 ? Math.round(duration / 1440) : 1;
    return {
      title: capitalizeFirst(title) || "Nuevo evento",
      start: day,
      end: addDays(day, days),
      allDay: true,
      category,
      tags,
      location,
      hasDate,
      hasTime: false,
    };
  }
  const st = startTime as TimeOfDay;
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), st.h, st.m);
  let end: Date;
  if (endTime) {
    end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endTime.h, endTime.m);
    if (end <= start) end = addDays(end, 1);
  } else {
    end = new Date(start.getTime() + (duration ?? defaultDuration) * 60_000);
  }
  return {
    title: capitalizeFirst(title) || "Nuevo evento",
    start,
    end,
    allDay: false,
    category,
    tags,
    location,
    hasDate,
    hasTime: true,
  };
};

const capitalizeFirst = (text: string) =>
  text ? text.charAt(0).toLocaleUpperCase("es-MX") + text.slice(1) : text;
