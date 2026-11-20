import { toPlainText, toValidDate } from "../CnTimeline/timeline-utils";
import type { CnNotification, CnNotificationSnoozeOption } from "./CnNotificationCenter.types";

/*
 * Utilidades del centro de notificaciones: orígenes, posponer, atajos y
 * alertas opcionales (sonido y vibración).
 */

/** Clave estable del origen (`sourceId` o el texto de `source`). */
export const notificationSourceKey = (n: CnNotification): string =>
  n.sourceId ?? toPlainText(n.source);

/** Pospuesta y aún no vence. */
export const isSnoozed = (n: CnNotification, now: Date = new Date()): boolean => {
  const until = toValidDate(n.snoozedUntil);
  return Boolean(until && until.getTime() > now.getTime());
};

export const CN_NOTIFICATION_SNOOZE_OPTIONS: readonly CnNotificationSnoozeOption[] = [
  { id: "1h", label: "Posponer 1 hora", until: (now) => new Date(now.getTime() + 3600000) },
  {
    id: "tomorrow",
    label: "Posponer hasta mañana",
    until: (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0),
  },
  {
    id: "week",
    label: "Posponer una semana",
    until: (now) => new Date(now.getTime() + 7 * 86400000),
  },
];

/** Texto de búsqueda de una notificación. */
export const notificationSearchText = (n: CnNotification): string =>
  [toPlainText(n.title), toPlainText(n.message), toPlainText(n.source), n.category ?? ""].join(" ");

/**
 * `"alt+n"`, `"ctrl+shift+k"`, `"mod+."` (mod = Ctrl o ⌘). Compara con la
 * tecla física cuando es letra o número para no depender de la distribución.
 */
export const matchesHotkey = (event: KeyboardEvent, hotkey: string): boolean => {
  const parts = hotkey
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  const isMac = typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform);
  const wantCtrl = mods.has("ctrl") || (mods.has("mod") && !isMac);
  const wantMeta = mods.has("meta") || mods.has("cmd") || (mods.has("mod") && isMac);
  if (event.ctrlKey !== wantCtrl || event.metaKey !== wantMeta) return false;
  if (event.altKey !== mods.has("alt") || event.shiftKey !== mods.has("shift")) return false;
  const physical = event.code?.toLowerCase().replace(/^key|^digit/, "");
  return event.key.toLowerCase() === key || physical === key;
};

/** Texto legible del atajo ("Alt+N"). */
export const formatHotkey = (hotkey: string): string =>
  hotkey
    .split("+")
    .map((p) => {
      const t = p.trim();
      return t.length === 1 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join("+");

let audioContext: AudioContext | null = null;

/** Tono breve y suave con Web Audio (sin archivos). No hace nada si el navegador no puede. */
export const playNotificationChime = (): void => {
  try {
    const Ctx =
      typeof window !== "undefined"
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (!Ctx) return;
    audioContext ??= new Ctx();
    const ctx = audioContext;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = t + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    // Sin audio (política de reproducción automática, navegador sin soporte).
  }
};

/** Vibración breve en dispositivos que la soportan. */
export const vibrateNotification = (): void => {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([60, 40, 60]);
    }
  } catch {
    // Sin vibración.
  }
};
