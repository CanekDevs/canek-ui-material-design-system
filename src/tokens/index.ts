export const colors = {
  brand: {
    50: "#eef3fb",
    100: "#d4e0f4",
    200: "#a8c0e8",
    300: "#7c9fdc",
    400: "#5081c4",
    500: "#3562a6",
    600: "#254d87",
    700: "#1c3d6d",
    800: "#142c50",
    900: "#0b1a33",
  },
  neutral: {
    0: "#ffffff",
    50: "#fafbfc",
    100: "#f4f5f7",
    150: "#e9ecef",
    200: "#dde0e4",
    300: "#c5cad0",
    400: "#9aa1aa",
    500: "#6e7682",
    600: "#4e5660",
    700: "#363d45",
    800: "#222831",
    900: "#111418",
  },
  success: {
    50: "#e8f5ec",
    100: "#c8e6d0",
    500: "#2e9e4f",
    600: "#228740",
    700: "#176230",
    900: "#0d3b1d",
  },
  warning: {
    50: "#fef5e7",
    100: "#fbe5b8",
    500: "#e0a020",
    600: "#b8831a",
    700: "#8a6312",
    900: "#523a08",
  },
  error: {
    50: "#fdecec",
    100: "#f9c8c8",
    500: "#d63c3c",
    600: "#b52f2f",
    700: "#8e2424",
    900: "#551414",
  },
  info: {
    50: "#e7f2fc",
    100: "#c2dff7",
    500: "#2c7bc8",
    600: "#2367a8",
    700: "#1a4f82",
    900: "#0f2f4e",
  },
  accent: {
    50: "#eef0ff",
    100: "#d8deff",
    300: "#8c9eff",
    500: "#3d5afe",
    600: "#304ffe",
    900: "#1a2a99",
  },
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const shadows = {
  none: "none",
  xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
  sm: "0 2px 4px rgba(15, 23, 42, 0.06)",
  md: "0 4px 12px rgba(15, 23, 42, 0.08)",
  lg: "0 10px 24px rgba(15, 23, 42, 0.10)",
  xl: "0 18px 44px rgba(15, 23, 42, 0.14)",
  "2xl": "0 24px 64px rgba(15, 23, 42, 0.18)",
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Menlo', 'Monaco', monospace",
  },
  fontSize: {
    xs: 11,
    sm: 12,
    base: 13,
    md: 14,
    lg: 16,
    xl: 18,
    "2xl": 22,
    "3xl": 28,
    "4xl": 34,
    "5xl": 42,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.45,
    relaxed: 1.65,
  },
  letterSpacing: {
    tight: "-0.02em",
    snug: "-0.01em",
    normal: "0",
    wide: "0.04em",
    wider: "0.08em",
    widest: "0.12em",
  },
} as const;

export const motion = {
  duration: {
    instant: 0,
    fast: 140,
    base: 200,
    slow: 320,
    slower: 480,
  },
  ease: {
    linear: "linear",
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)",
    accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    emphasized: "cubic-bezier(0.22, 1, 0.36, 1)",
    spring: "cubic-bezier(0.5, 1.5, 0.5, 1)",
  },
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

export type CnColorScale = keyof typeof colors;
export type CnColorStep = keyof typeof colors.brand;
export type CnRadius = keyof typeof radii;
export type CnSpacing = keyof typeof spacing;
export type CnShadow = keyof typeof shadows;
