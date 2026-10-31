import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { CnFlagIcon } from "../components/CnFlagIcon";
import { getSafeUrl } from "../components/CnFileField/file-utils";
import type { CnFieldOption } from "../components/CnForm/CnForm.types";
import { CnIcon } from "../components/CnIcon";

export const hasOptionMedia = (option: CnFieldOption): boolean =>
  Boolean(option.icon || option.avatar || option.initials || option.flag);

export const getInitials = (label: string): string =>
  label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase() ?? "")
    .join("");

/** Ícono, bandera, avatar o iniciales de una opción. */
export const OptionMedia = ({ option, size = 24 }: { option: CnFieldOption; size?: number }) => {
  if (option.flag) return <CnFlagIcon code={option.flag} size={Math.round(size * 0.6)} />;
  if (option.icon) {
    return (
      <Box
        component="span"
        sx={{ display: "inline-flex", color: "var(--cn-color-neutral-500, #6e7682)" }}
      >
        <CnIcon name={option.icon} size={Math.round(size * 0.75)} />
      </Box>
    );
  }
  const src = getSafeUrl(option.avatar);
  if (!src && !option.initials) return null;
  const initials =
    option.initials === true || !option.initials ? getInitials(option.label) : option.initials;
  return (
    <Avatar
      src={src}
      alt=""
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        fontWeight: 600,
        color: "var(--cn-color-brand-700, #1c3d6d)",
        backgroundColor: "var(--cn-color-brand-100, #d4e0f4)",
      }}
    >
      {initials}
    </Avatar>
  );
};

/** Contenido estándar de una opción: medio + etiqueta + descripción. */
export const OptionContent = ({ option, extra }: { option: CnFieldOption; extra?: ReactNode }) => (
  <Box
    component="span"
    sx={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, width: "100%" }}
  >
    {hasOptionMedia(option) && <OptionMedia option={option} size={option.description ? 30 : 24} />}
    <Box component="span" sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {option.label}
      </Box>
      {option.description && (
        <Box
          component="span"
          sx={{
            fontSize: "var(--cn-font-size-xs, 11px)",
            color: "var(--cn-color-text-muted, #6e7682)",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {option.description}
        </Box>
      )}
    </Box>
    {extra}
  </Box>
);
