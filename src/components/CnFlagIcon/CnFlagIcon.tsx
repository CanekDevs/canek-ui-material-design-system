import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useState } from "react";
import { mergeSx } from "../../utils/field-styles";

export type CnFlagIconVariant = "icon" | "with-name" | "full";

export type CnFlagIconProps = {
  /** Código ISO 3166-1 alfa-2 (MX, US, ES…). */
  code: string;
  /** Alto en px; el ancho sigue la proporción 3:2. */
  size?: number;
  variant?: CnFlagIconVariant;
  name?: string;
  dialCode?: string;
  /**
   * Opcional: URL de una bandera detallada (p. ej. un CDN propio). Por defecto
   * se usan banderas SVG integradas, sin peticiones a terceros.
   */
  getFlagUrl?: (code: string) => string;
  sx?: SxProps<Theme>;
  className?: string;
};

const W = 30;
const H = 20;

const hStripes = (colors: string[], weights?: number[]) => {
  const total = (weights ?? colors.map(() => 1)).reduce((a, b) => a + b, 0);
  let y = 0;
  return colors.map((color, i) => {
    const h = (H * (weights?.[i] ?? 1)) / total;
    const rect = <rect key={`h${i}`} x={0} y={y} width={W} height={h + 0.05} fill={color} />;
    y += h;
    return rect;
  });
};

const vStripes = (colors: string[], weights?: number[]) => {
  const total = (weights ?? colors.map(() => 1)).reduce((a, b) => a + b, 0);
  let x = 0;
  return colors.map((color, i) => {
    const w = (W * (weights?.[i] ?? 1)) / total;
    const rect = <rect key={`v${i}`} x={x} y={0} width={w + 0.05} height={H} fill={color} />;
    x += w;
    return rect;
  });
};

const star = (cx: number, cy: number, r: number, fill: string, key: string) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
  return <polygon key={key} points={points} fill={fill} />;
};

/** Banderas simplificadas (reconocibles a tamaño de ícono). */
const FLAGS: Record<string, () => ReactNode> = {
  MX: () => [
    ...vStripes(["#006847", "#ffffff", "#ce1126"]),
    <circle key="e" cx={15} cy={10} r={2.6} fill="#8c5a2b" />,
  ],
  US: () => [
    ...hStripes(Array.from({ length: 13 }, (_, i) => (i % 2 === 0 ? "#b22234" : "#ffffff"))),
    <rect key="c" x={0} y={0} width={12} height={10.8} fill="#3c3b6e" />,
    ...[2, 5, 8].flatMap((y) =>
      [2.5, 6, 9.5].map((x) => (
        <circle key={`s${x}${y}`} cx={x} cy={y + 0.4} r={0.7} fill="#ffffff" />
      )),
    ),
  ],
  CA: () => [
    ...vStripes(["#d52b1e", "#ffffff", "#d52b1e"], [1, 2, 1]),
    star(15, 10, 4.2, "#d52b1e", "leaf"),
  ],
  ES: () => hStripes(["#aa151b", "#f1bf00", "#aa151b"], [1, 2, 1]),
  AR: () => [
    ...hStripes(["#74acdf", "#ffffff", "#74acdf"]),
    <circle key="sun" cx={15} cy={10} r={2} fill="#f6b40e" />,
  ],
  CO: () => hStripes(["#fcd116", "#003893", "#ce1126"], [2, 1, 1]),
  CL: () => [
    <rect key="w" x={0} y={0} width={W} height={10} fill="#ffffff" />,
    <rect key="r" x={0} y={10} width={W} height={10} fill="#d52b1e" />,
    <rect key="b" x={0} y={0} width={10} height={10} fill="#0039a6" />,
    star(5, 5, 2.6, "#ffffff", "s"),
  ],
  BR: () => [
    <rect key="g" x={0} y={0} width={W} height={H} fill="#009c3b" />,
    <polygon key="y" points="15,2.2 27.5,10 15,17.8 2.5,10" fill="#ffdf00" />,
    <circle key="b" cx={15} cy={10} r={4.2} fill="#002776" />,
  ],
  PE: () => vStripes(["#d91023", "#ffffff", "#d91023"]),
  GT: () => [
    ...vStripes(["#4997d0", "#ffffff", "#4997d0"]),
    <circle key="e" cx={15} cy={10} r={2.2} fill="#6c9a3f" />,
  ],
  CR: () => hStripes(["#002b7f", "#ffffff", "#ce1126", "#ffffff", "#002b7f"], [1, 1, 2, 1, 1]),
  PA: () => [
    <rect key="a" x={0} y={0} width={15} height={10} fill="#ffffff" />,
    <rect key="b" x={15} y={0} width={15} height={10} fill="#d21034" />,
    <rect key="c" x={0} y={10} width={15} height={10} fill="#005293" />,
    <rect key="d" x={15} y={10} width={15} height={10} fill="#ffffff" />,
    star(7.5, 5, 2.4, "#005293", "s1"),
    star(22.5, 15, 2.4, "#d21034", "s2"),
  ],
  DO: () => [
    <rect key="bg" x={0} y={0} width={W} height={H} fill="#ffffff" />,
    <rect key="a" x={0} y={0} width={13} height={8.5} fill="#002d62" />,
    <rect key="b" x={17} y={0} width={13} height={8.5} fill="#ce1126" />,
    <rect key="c" x={0} y={11.5} width={13} height={8.5} fill="#ce1126" />,
    <rect key="d" x={17} y={11.5} width={13} height={8.5} fill="#002d62" />,
  ],
  EC: () => [
    ...hStripes(["#ffdd00", "#034ea2", "#ed1c24"], [2, 1, 1]),
    <circle key="e" cx={15} cy={9} r={2.4} fill="#7a5a1e" />,
  ],
  UY: () => [
    ...hStripes(Array.from({ length: 9 }, (_, i) => (i % 2 === 0 ? "#ffffff" : "#0038a8"))),
    <rect key="c" x={0} y={0} width={11} height={11.1} fill="#ffffff" />,
    <circle key="sun" cx={5.5} cy={5.5} r={3} fill="#fcd116" />,
  ],
  VE: () => [
    ...hStripes(["#ffcc00", "#00247d", "#cf142b"]),
    ...[8, 10.5, 13, 15, 17, 19.5, 22].map((x, i) => (
      <circle
        key={`s${i}`}
        cx={x}
        cy={i === 0 || i === 6 ? 11.8 : i === 1 || i === 5 ? 10.4 : 9.6}
        r={0.6}
        fill="#ffffff"
      />
    )),
  ],
  SV: () => hStripes(["#0047ab", "#ffffff", "#0047ab"]),
  HN: () => [
    ...hStripes(["#00bce4", "#ffffff", "#00bce4"]),
    ...[
      [11, 8.2],
      [19, 8.2],
      [15, 10],
      [11, 11.8],
      [19, 11.8],
    ].map(([x, y], i) => star(x, y, 1, "#00bce4", `h${i}`)),
  ],
  NI: () => [
    ...hStripes(["#0067c6", "#ffffff", "#0067c6"]),
    <polygon key="t" points="15,7.6 17.4,11.8 12.6,11.8" fill="#4ba3e3" />,
  ],
  BO: () => hStripes(["#d52b1e", "#f9e300", "#007934"]),
  PY: () => [
    ...hStripes(["#d52b1e", "#ffffff", "#0038a8"]),
    <circle key="e" cx={15} cy={10} r={2} fill="none" stroke="#0038a8" strokeWidth={0.6} />,
  ],
  GB: () => [
    <rect key="bg" x={0} y={0} width={W} height={H} fill="#012169" />,
    <path key="wd" d="M0,0 L30,20 M30,0 L0,20" stroke="#ffffff" strokeWidth={4} />,
    <path key="rd" d="M0,0 L30,20 M30,0 L0,20" stroke="#c8102e" strokeWidth={1.4} />,
    <path key="wc" d="M15,0 V20 M0,10 H30" stroke="#ffffff" strokeWidth={6} />,
    <path key="rc" d="M15,0 V20 M0,10 H30" stroke="#c8102e" strokeWidth={3.4} />,
  ],
  FR: () => vStripes(["#002395", "#ffffff", "#ed2939"]),
  DE: () => hStripes(["#000000", "#dd0000", "#ffce00"]),
  IT: () => vStripes(["#009246", "#ffffff", "#ce2b37"]),
  PT: () => [
    ...vStripes(["#006600", "#ff0000"], [2, 3]),
    <circle key="e" cx={12} cy={10} r={3.6} fill="#ffcc00" />,
    <circle key="s" cx={12} cy={10} r={2.2} fill="#ff0000" stroke="#ffffff" strokeWidth={0.6} />,
  ],
};

/** Códigos con bandera integrada. */
export const BUILT_IN_FLAG_CODES = Object.keys(FLAGS);

/**
 * Bandera de un país. Usa SVG integrado (sin peticiones externas) y, si se
 * pasa `getFlagUrl`, una imagen con respaldo al SVG si falla la carga.
 */
export const CnFlagIcon = ({
  code,
  size = 16,
  variant = "icon",
  name,
  dialCode,
  getFlagUrl,
  sx,
  className,
}: CnFlagIconProps) => {
  const upper = code.toUpperCase();
  const [imageFailed, setImageFailed] = useState(false);
  const width = Math.round(size * 1.5);
  const render = FLAGS[upper];
  const url = getFlagUrl && !imageFailed ? getFlagUrl(upper) : undefined;

  const flag = url ? (
    <Box
      component="img"
      src={url}
      alt=""
      width={width}
      height={size}
      onError={() => setImageFailed(true)}
      sx={{ objectFit: "cover", borderRadius: "2px", display: "block" }}
    />
  ) : render ? (
    <svg
      width={width}
      height={size}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden
      focusable="false"
      style={{ display: "block", borderRadius: 2 }}
    >
      {render()}
      <rect
        x={0.25}
        y={0.25}
        width={W - 0.5}
        height={H - 0.5}
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={0.5}
        rx={1}
      />
    </svg>
  ) : (
    <Box
      component="span"
      aria-hidden
      sx={{
        width,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "2px",
        fontSize: Math.max(8, size * 0.55),
        fontWeight: 700,
        color: "var(--cn-color-neutral-600, #4e5660)",
        backgroundColor: "var(--cn-color-neutral-150, #e9ecef)",
      }}
    >
      {upper}
    </Box>
  );

  return (
    <Box
      component="span"
      role="img"
      aria-label={name ?? upper}
      className={className}
      data-cn-flag={upper}
      sx={mergeSx(
        { display: "inline-flex", alignItems: "center", gap: "6px", flexShrink: 0, lineHeight: 1 },
        sx,
      )}
    >
      {flag}
      {variant !== "icon" && name && (
        <Box component="span" sx={{ fontSize: "inherit" }}>
          {name}
        </Box>
      )}
      {variant === "full" && dialCode && (
        <Box component="span" sx={{ color: "var(--cn-color-text-muted, #6e7682)" }}>
          {dialCode}
        </Box>
      )}
    </Box>
  );
};
