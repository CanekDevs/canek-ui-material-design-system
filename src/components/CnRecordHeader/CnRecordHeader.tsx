import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, useId, useState } from "react";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import type { CnChipColor } from "../CnChip";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import { CnRecordHeaderSkeleton } from "./CnRecordHeaderSkeleton";

export type CnRecordHeaderAction = {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  /** Acción destructiva: en el menú "Más" va en rojo. */
  danger?: boolean;
};

export type CnRecordHeaderFact = {
  id?: string;
  label: string;
  value: ReactNode;
  icon?: string;
};

export type CnRecordHeaderStatus = {
  label: string;
  color?: CnChipColor;
};

export type CnRecordHeaderProps = {
  /** Nombre del registro (persona, empresa, oportunidad). */
  title: ReactNode;
  /** Línea secundaria: puesto y empresa, folio, tipo de registro. */
  subtitle?: ReactNode;
  /** Avatar del registro. Sin `src`, muestra iniciales de `name` o el ícono. */
  avatar?: { name?: string; src?: string; icon?: string };
  /** Etiqueta de tipo sobre el título ("Contacto", "Empresa", "Oportunidad"). */
  overline?: ReactNode;
  status?: CnRecordHeaderStatus;
  /** Etiquetas cortas junto al estado. */
  tags?: readonly string[];
  /** Datos clave en una fila bajo el título (responsable, valor, última actividad). */
  facts?: readonly CnRecordHeaderFact[];
  /** Acciones. La primera es la principal; las que pasan de `maxVisibleActions` van a "Más". */
  actions?: readonly CnRecordHeaderAction[];
  /** Cuántas acciones se ven como botón (el resto va al menú "Más"). */
  maxVisibleActions?: number;
  /** Muestra el botón "Seguir" (recibir avisos de cambios). */
  following?: boolean;
  onFollowChange?: (following: boolean) => void;
  /** Muestra "Volver" antes del avatar. */
  onBack?: () => void;
  backLabel?: string;
  /** `card` agrega borde y fondo. */
  variant?: "plain" | "card";
  /** Nivel del encabezado del título. */
  headingLevel?: 1 | 2 | 3;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

/** Encabezado de registro: avatar, nombre, estado, datos clave, seguir y acciones. */
export const CnRecordHeader = forwardRef<HTMLElement, CnRecordHeaderProps>(function CnRecordHeader(
  {
    title,
    subtitle,
    avatar,
    overline,
    status,
    tags = [],
    facts = [],
    actions = [],
    maxVisibleActions = 2,
    following,
    onFollowChange,
    onBack,
    backLabel = "Volver",
    variant = "plain",
    headingLevel = 1,
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();

  if (skeleton) {
    return (
      <CnRecordHeaderSkeleton
        facts={facts.length || 3}
        actions={
          Math.min(actions.length, maxVisibleActions) + (actions.length > maxVisibleActions ? 1 : 0)
        }
        variant={variant}
        sx={sx}
        className={className}
      />
    );
  }

  const visible = actions.slice(0, maxVisibleActions);
  const overflow = actions.slice(maxVisibleActions);
  const showFollow = following !== undefined || Boolean(onFollowChange);

  return (
    <Box
      ref={ref}
      component="header"
      data-cn-record-header
      className={className}
      sx={[
        {
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          color: "var(--cn-color-text, #222831)",
        },
        variant === "card" && {
          p: "24px",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-lg, 12px)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: "16px",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            flex: "1 1 280px",
            minWidth: 0,
          }}
        >
          {onBack && (
            <CnButton
              iconOnly
              icon="arrow_back"
              variant="text"
              color="neutral"
              aria-label={backLabel}
              onClick={onBack}
              sx={{ flexShrink: 0, mt: "8px" }}
            />
          )}
          {avatar && (
            <CnAvatar
              name={avatar.name}
              src={avatar.src}
              icon={avatar.icon}
              size="xl"
              sx={{ flexShrink: 0 }}
            />
          )}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
            {overline && (
              <Typography
                sx={{
                  m: 0,
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                {overline}
              </Typography>
            )}
            <Typography
              component={`h${headingLevel}`}
              sx={{
                m: 0,
                fontSize: "22px",
                fontWeight: 500,
                lineHeight: 1.3,
                overflowWrap: "anywhere",
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  m: 0,
                  fontSize: "14px",
                  color: "var(--cn-color-text-muted, #6e7682)",
                  overflowWrap: "anywhere",
                }}
              >
                {subtitle}
              </Typography>
            )}
            {(status || tags.length > 0) && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", mt: "4px" }}>
                {status && (
                  <CnChip size="small" color={status.color ?? "primary"} label={status.label} />
                )}
                {tags.map((tag) => (
                  <CnChip key={tag} size="small" variant="outlined" color="neutral" label={tag} />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {(showFollow || actions.length > 0) && (
          <Box
            role="group"
            aria-label="Acciones del registro"
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
              ml: "auto",
              maxWidth: "100%",
            }}
          >
            {showFollow && (
              <CnButton
                variant="outlined"
                color="neutral"
                startIcon={following ? "notification_important" : "notifications"}
                aria-pressed={Boolean(following)}
                onClick={() => onFollowChange?.(!following)}
              >
                {following ? "Siguiendo" : "Seguir"}
              </CnButton>
            )}
            {visible.map((action, index) => (
              <CnButton
                key={action.id}
                variant={index === 0 ? "contained" : "outlined"}
                color={action.danger ? "error" : index === 0 ? "primary" : "neutral"}
                startIcon={action.icon}
                disabled={action.disabled}
                href={action.href}
                onClick={action.onClick}
              >
                {action.label}
              </CnButton>
            ))}
            {overflow.length > 0 && (
              <>
                <CnButton
                  iconOnly
                  icon="more_vert"
                  variant="outlined"
                  color="neutral"
                  aria-label="Más acciones"
                  aria-haspopup="menu"
                  aria-expanded={Boolean(menuAnchor)}
                  aria-controls={menuAnchor ? menuId : undefined}
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                />
                <Menu
                  id={menuId}
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  {overflow.map((action) => (
                    <MenuItem
                      key={action.id}
                      disabled={action.disabled}
                      onClick={() => {
                        setMenuAnchor(null);
                        action.onClick?.();
                      }}
                      sx={{
                        gap: "12px",
                        fontSize: "14px",
                        color: action.danger ? "var(--cn-color-error-600, #b52f2f)" : undefined,
                      }}
                    >
                      {action.icon && <CnIcon name={action.icon} size={18} />}
                      {action.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>
        )}
      </Box>

      {facts.length > 0 && (
        <Box
          component="dl"
          sx={{
            m: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px 24px",
            pt: "16px",
            borderTop: "1px solid var(--cn-color-border-subtle, var(--cn-color-border, #dde0e4))",
            minWidth: 0,
          }}
        >
          {facts.map((fact, index) => (
            <Box
              key={fact.id ?? index}
              sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <Box
                component="dt"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--cn-color-text-muted, #6e7682)",
                  overflowWrap: "anywhere",
                }}
              >
                {fact.icon && <CnIcon name={fact.icon} size={16} />}
                {fact.label}
              </Box>
              <Box
                component="dd"
                sx={{ m: 0, fontSize: "14px", fontWeight: 500, overflowWrap: "anywhere" }}
              >
                {fact.value}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
});
