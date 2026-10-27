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

  const value = globalThis
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || null;
}

function readCssColor(name: CssVarName, fallback: string): string {
  return readCssVar(name) ?? fallback;
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

  const backgroundDefault =
    mode === "light"
      ? readCssColor("--cn-color-bg", "#fafbfc")
      : readCssColor("--cn-color-bg", "#0f1116");

  const backgroundPaper =
    mode === "light"
      ? readCssColor("--cn-color-surface", "#ffffff")
      : readCssColor("--cn-color-surface", "#181b22");

  const textPrimary =
    mode === "light"
      ? readCssColor("--cn-color-text", "#222831")
      : readCssColor("--cn-color-text", "#eef0f3");

  const textSecondary =
    mode === "light"
      ? readCssColor("--cn-color-text-muted", "#6e7682")
      : readCssColor("--cn-color-text-muted", "#9aa1aa");

  const divider =
    mode === "light"
      ? readCssColor("--cn-color-border", "#dde0e4")
      : readCssColor("--cn-color-border", "#2a2f38");

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
