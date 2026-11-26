import Box from "@mui/material/Box";
import { hotkeyKeys } from "../../utils/hotkeys";

/**
 * Teclas de un atajo dibujadas como `<kbd>` (uso interno de `CnCommandPalette` y `CnTopBar`).
 * El componente público `CnKbd` sigue en la hoja de ruta.
 */
export const KbdKeys = ({ hotkey, keys }: { hotkey?: string; keys?: string[] }) => {
  const list = keys ?? (hotkey ? hotkeyKeys(hotkey) : []);
  if (!list.length) return null;
  return (
    <Box component="span" sx={{ display: "inline-flex", gap: "4px", flex: "none" }}>
      {list.map((key, i) => (
        <Box
          key={`${key}-${i}`}
          component="kbd"
          sx={{
            minWidth: 20,
            height: 20,
            px: "5px",
            boxSizing: "border-box",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
            fontSize: "var(--cn-font-size-xs, 11px)",
            fontWeight: 600,
            lineHeight: 1,
            color: "var(--cn-color-text-muted, #6e7682)",
            backgroundColor: "var(--cn-color-surface-sunken, #f4f5f7)",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderBottomWidth: "2px",
            borderRadius: "var(--cn-radius-xs, 4px)",
          }}
        >
          {key}
        </Box>
      ))}
    </Box>
  );
};
