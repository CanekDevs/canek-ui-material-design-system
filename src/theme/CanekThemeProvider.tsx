import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

declare module "@mui/material/styles" {
  interface Palette {
    accent: Palette["primary"];
  }
  interface PaletteOptions {
    accent?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    accent: true;
  }
}

export type CanekThemeMode = "light" | "dark";

export type CanekThemeProviderProps = {
  children: ReactNode;
  mode?: CanekThemeMode;
  fontFamily?: string;
};

type CssVarName = `--${string}`;

function readCssVar(name: CssVarName): string | null {
  if (typeof globalThis === "undefined") return null;
  if (typeof document === "undefined") return null;

  const value = globalThis.getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  return value || null;
}

function readCssColor(name: CssVarName, fallback: string): string {
  return readCssVar(name) ?? fallback;
}

/**
 * Lee roles que cambian por modo (fondo, superficie, texto, borde). En oscuro los lee de un
 * elemento sonda con `data-cn-theme="dark"`: así no depende de que `<html>` ya tenga el atributo
 * (el proveedor lo pone en un efecto, después de crear el tema).
 */
function readModeColors<K extends string>(
  mode: CanekThemeMode,
  roles: Record<K, [CssVarName, string]>,
): Record<K, string> {
  const keys = Object.keys(roles) as K[];
  const fallback = () => Object.fromEntries(keys.map((k) => [k, roles[k][1]])) as Record<K, string>;
  if (typeof document === "undefined" || !document.body) return fallback();
  if (mode === "light") {
    // Al volver de oscuro, `<html>` aún trae el atributo: se quita un momento para leer el claro.
    const root = document.documentElement;
    const previous = root.getAttribute("data-cn-theme");
    if (previous) root.removeAttribute("data-cn-theme");
    try {
      return Object.fromEntries(
        keys.map((k) => [k, readCssColor(roles[k][0], roles[k][1])]),
      ) as Record<K, string>;
    } finally {
      if (previous) root.setAttribute("data-cn-theme", previous);
    }
  }
  const probe = document.createElement("div");
  probe.setAttribute("data-cn-theme", mode);
  probe.style.display = "none";
  document.body.appendChild(probe);
  try {
    const style = globalThis.getComputedStyle(probe);
    return Object.fromEntries(
      keys.map((k) => [k, style.getPropertyValue(roles[k][0]).trim() || roles[k][1]]),
    ) as Record<K, string>;
  } finally {
    probe.remove();
  }
}

export function createCanekTheme(mode: CanekThemeMode = "light", fontFamily?: string): Theme {
  const primary = readCssColor("--cn-color-brand-600", "#254d87");
  const primaryDark = readCssColor("--cn-color-brand-700", "#1c3d6d");
  const primaryLight = readCssColor("--cn-color-brand-400", "#5081c4");

  const secondary = readCssColor("--cn-color-neutral-700", "#363d45");
  const secondaryDark = readCssColor("--cn-color-neutral-800", "#222831");
  const secondaryLight = readCssColor("--cn-color-neutral-500", "#6e7682");

  const success = readCssColor("--cn-color-success-500", "#2e9e4f");
  const successDark = readCssColor("--cn-color-success-700", "#176230");
  const successLight = readCssColor("--cn-color-success-100", "#c8e6d0");

  const warning = readCssColor("--cn-color-warning-500", "#e0a020");
  const warningDark = readCssColor("--cn-color-warning-700", "#8a6312");
  const warningLight = readCssColor("--cn-color-warning-100", "#fbe5b8");

  const error = readCssColor("--cn-color-error-500", "#d63c3c");
  const errorDark = readCssColor("--cn-color-error-700", "#8e2424");
  const errorLight = readCssColor("--cn-color-error-100", "#f9c8c8");

  const info = readCssColor("--cn-color-info-500", "#2c7bc8");
  const infoDark = readCssColor("--cn-color-info-700", "#1a4f82");
  const infoLight = readCssColor("--cn-color-info-100", "#c2dff7");

  const accent = readCssColor("--cn-color-accent-500", "#3d5afe");
  const accentDark = readCssColor("--cn-color-accent-600", "#304ffe");
  const accentLight = readCssColor("--cn-color-accent-300", "#8c9eff");

  const light = mode === "light";
  const { backgroundDefault, backgroundPaper, textPrimary, textSecondary, divider } =
    readModeColors(mode, {
      backgroundDefault: ["--cn-color-bg", light ? "#fafbfc" : "#0f1116"],
      backgroundPaper: ["--cn-color-surface", light ? "#ffffff" : "#181b22"],
      textPrimary: ["--cn-color-text", light ? "#222831" : "#eef0f3"],
      textSecondary: ["--cn-color-text-muted", light ? "#6e7682" : "#9aa1aa"],
      divider: ["--cn-color-border", light ? "#dde0e4" : "#2a2f38"],
    });

  const resolvedFontFamily = fontFamily ?? readCssColor("--cn-font-sans", "system-ui, sans-serif");

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
        dark: primaryDark,
        light: primaryLight,
        contrastText: "#ffffff",
      },
      secondary: {
        main: secondary,
        dark: secondaryDark,
        light: secondaryLight,
        contrastText: "#ffffff",
      },
      accent: {
        main: accent,
        dark: accentDark,
        light: accentLight,
        contrastText: "#ffffff",
      },
      success: {
        main: success,
        dark: successDark,
        light: successLight,
        contrastText: "#ffffff",
      },
      warning: {
        main: warning,
        dark: warningDark,
        light: warningLight,
        contrastText: "#ffffff",
      },
      error: {
        main: error,
        dark: errorDark,
        light: errorLight,
        contrastText: "#ffffff",
      },
      info: {
        main: info,
        dark: infoDark,
        light: infoLight,
        contrastText: "#ffffff",
      },
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
      },
      divider,
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: resolvedFontFamily,
      fontSize: 13,
      button: {
        textTransform: "none",
        fontWeight: 600,
        letterSpacing: 0,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}

export function CanekThemeProvider({
  children,
  mode = "light",
  fontFamily,
}: CanekThemeProviderProps) {
  const theme = useMemo(() => createCanekTheme(mode, fontFamily), [mode, fontFamily]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-cn-theme", mode);
    return () => {
      document.documentElement.removeAttribute("data-cn-theme");
    };
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
