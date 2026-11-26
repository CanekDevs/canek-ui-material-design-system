/** Atajos de teclado compartidos (centro de notificaciones, paleta de comandos). */

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

const isMacPlatform = () =>
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform);

/** Teclas de un atajo para mostrarlas por separado: `"mod+k"` → `["Ctrl", "K"]` (o `["⌘", "K"]` en Mac). */
export const hotkeyKeys = (hotkey: string): string[] =>
  hotkey.split("+").map((p) => {
    const t = p.trim().toLowerCase();
    if (t === "mod") return isMacPlatform() ? "⌘" : "Ctrl";
    if (t === "cmd" || t === "meta") return "⌘";
    if (t === "ctrl") return "Ctrl";
    if (t === "alt") return isMacPlatform() ? "⌥" : "Alt";
    if (t === "shift") return "Mayús";
    if (t === "enter") return "Intro";
    if (t === "escape" || t === "esc") return "Esc";
    return t.length === 1 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1);
  });
