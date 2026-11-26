import type { AlertProps } from "@mui/material/Alert";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import type { CollapseProps } from "@mui/material/Collapse";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import type { SnackbarOrigin, SnackbarProps } from "@mui/material/Snackbar";
import Snackbar from "@mui/material/Snackbar";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, isValidElement, useCallback, useId, useState } from "react";
import { prefersReducedMotion } from "../../utils/tones";
import type { CnButtonColor } from "../CnButton";
import { CnButton } from "../CnButton";
import { CnIcon } from "../CnIcon";
import { CnAlertSkeleton } from "./CnAlertSkeleton";

export type CnAlertMode = "inline" | "popup" | "toast";
export type CnAlertSeverity = "success" | "info" | "warning" | "error";
/** `left-accent`: superficie blanca con borde izquierdo de color (callout / nota destacada). */
export type CnAlertVariant = "standard" | "filled" | "outlined" | "left-accent";

/** Acción de la fila inferior (`actions`). */
export type CnAlertAction = {
  label: ReactNode;
  onClick?: () => void;
  href?: string;
  target?: "_blank" | "_self";
  /** Nombre de ícono (`ICON_REGISTRY`) al inicio del botón. */
  icon?: string;
  /**
   * `link` = botón de texto compacto y subrayado ("Más información").
   * Por defecto, la primera acción es `contained` y las demás `text`.
   */
  variant?: "contained" | "outlined" | "text" | "link";
  disabled?: boolean;
  "aria-label"?: string;
};
export type CnAlertColor = CnAlertSeverity | "primary" | "secondary" | "accent" | "neutral";
export type CnAlertIconMode = "icon" | "none";
/**
 * `alert`/`status` se anuncian al aparecer; `note` es un callout de contenido que no
 * interrumpe; `none` quita el rol (MUI pondría `alert` por defecto).
 */
export type CnAlertRole = "alert" | "status" | "note" | "none";
export type CnAlertCloseReason = "close" | "auto" | "clickaway" | "escape";

export type CnAlertProps = {
  mode?: CnAlertMode;
  severity?: CnAlertSeverity;
  variant?: CnAlertVariant;
  color?: CnAlertColor;
  title?: ReactNode;
  message?: string;
  children?: ReactNode;
  icon?: ReactNode | string | false;
  iconMode?: CnAlertIconMode;
  /** Acción compacta a la derecha (junto al botón de cerrar). */
  action?: ReactNode;
  /**
   * Fila de acciones bajo el mensaje (hace wrap en anchos chicos). Acepta
   * descriptores (`CnAlertAction[]`) o nodos propios.
   */
  actions?: CnAlertAction[] | ReactNode;
  /** Contenido plegable bajo el mensaje, con botón "Ver detalles". */
  details?: ReactNode;
  detailsLabel?: string;
  hideDetailsLabel?: string;
  /** Estado controlado de `details`. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Muestra el botón de cerrar; requiere `onClose` (o usa `dismissible`). */
  closable?: boolean;
  /**
   * Cierre autogestionado: muestra el botón de cerrar aunque no haya `onClose`
   * y oculta la alerta al pulsarlo, salvo que `visible` (en línea) u `open`
   * (popup/toast) la controlen.
   */
  dismissible?: boolean;
  /** Nombre accesible del botón de cerrar. */
  closeLabel?: string;
  onClose?: (reason: CnAlertCloseReason) => void;
  visible?: boolean;
  role?: CnAlertRole;
  open?: boolean;
  autoHideDuration?: number | null;
  position?: SnackbarOrigin;
  disableClickawayClose?: boolean;
  /** Muestra el skeleton de la alerta (mismas variantes y piezas) en línea. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
  alertProps?: Omit<
    AlertProps,
    | "severity"
    | "variant"
    | "color"
    | "icon"
    | "action"
    | "onClose"
    | "children"
    | "sx"
    | "className"
    | "role"
  >;
  snackbarProps?: Omit<
    SnackbarProps,
    "anchorOrigin" | "autoHideDuration" | "children" | "onClose" | "open"
  >;
  collapseProps?: Omit<CollapseProps, "in" | "children">;
};

type ColorTokens = {
  main: string;
  dark: string;
  soft: string;
  text: string;
  icon: string;
  rgb: string;
};

const COLOR_TOKENS: Record<CnAlertColor, ColorTokens> = {
  success: {
    main: "var(--cn-color-success-600, #228740)",
    dark: "var(--cn-color-success-700, #176230)",
    soft: "rgba(var(--cn-color-rgb-success-500, 46, 158, 79), 0.10)",
    text: "var(--cn-color-control-success-fg-strong, var(--cn-color-success-700, #176230))",
    icon: "var(--cn-color-control-success-fg, var(--cn-color-success-600, #228740))",
    rgb: "var(--cn-color-rgb-success-600, 34, 135, 64)",
  },
  info: {
    main: "var(--cn-color-info-600, #2367a8)",
    dark: "var(--cn-color-info-700, #1a4f82)",
    soft: "rgba(var(--cn-color-rgb-info-500, 44, 123, 200), 0.10)",
    text: "var(--cn-color-control-info-fg-strong, var(--cn-color-info-700, #1a4f82))",
    icon: "var(--cn-color-control-info-fg, var(--cn-color-info-600, #2367a8))",
    rgb: "var(--cn-color-rgb-info-600, 35, 103, 168)",
  },
  warning: {
    main: "var(--cn-color-warning-600, #b8831a)",
    dark: "var(--cn-color-warning-700, #8a6312)",
    soft: "rgba(var(--cn-color-rgb-warning-500, 224, 160, 32), 0.10)",
    text: "var(--cn-color-control-warning-fg-strong, var(--cn-color-warning-700, #8a6312))",
    icon: "var(--cn-color-control-warning-fg, var(--cn-color-warning-600, #b8831a))",
    rgb: "var(--cn-color-rgb-warning-600, 184, 131, 26)",
  },
  error: {
    main: "var(--cn-color-error-600, #b52f2f)",
    dark: "var(--cn-color-error-700, #8e2424)",
    soft: "rgba(var(--cn-color-rgb-error-500, 214, 60, 60), 0.10)",
    text: "var(--cn-color-control-error-fg-strong, var(--cn-color-error-700, #8e2424))",
    icon: "var(--cn-color-control-error-fg, var(--cn-color-error-600, #b52f2f))",
    rgb: "var(--cn-color-rgb-error-600, 181, 47, 47)",
  },
  primary: {
    main: "var(--cn-color-brand-600, #254d87)",
    dark: "var(--cn-color-brand-700, #1c3d6d)",
    soft: "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.10)",
    text: "var(--cn-color-control-primary-fg-strong, var(--cn-color-brand-700, #1c3d6d))",
    icon: "var(--cn-color-control-primary-fg, var(--cn-color-brand-600, #254d87))",
    rgb: "var(--cn-color-rgb-brand-600, 37, 77, 135)",
  },
  secondary: {
    main: "var(--cn-color-neutral-700, #363d45)",
    dark: "var(--cn-color-neutral-800, #222831)",
    soft: "rgba(var(--cn-color-rgb-neutral-600, 78, 86, 96), 0.10)",
    text: "var(--cn-color-control-secondary-fg-strong, var(--cn-color-neutral-800, #222831))",
    icon: "var(--cn-color-control-secondary-fg, var(--cn-color-neutral-700, #363d45))",
    rgb: "var(--cn-color-rgb-neutral-700, 54, 61, 69)",
  },
  accent: {
    main: "var(--cn-color-accent-500, #3d5afe)",
    dark: "var(--cn-color-accent-600, #304ffe)",
    soft: "rgba(var(--cn-color-rgb-accent-500, 61, 90, 254), 0.10)",
    text: "var(--cn-color-control-accent-fg-strong, var(--cn-color-accent-600, #304ffe))",
    icon: "var(--cn-color-control-accent-fg, var(--cn-color-accent-500, #3d5afe))",
    rgb: "var(--cn-color-rgb-accent-500, 61, 90, 254)",
  },
  neutral: {
    main: "var(--cn-color-neutral-600, #4e5660)",
    dark: "var(--cn-color-neutral-700, #363d45)",
    soft: "rgba(var(--cn-color-rgb-neutral-500, 110, 118, 130), 0.10)",
    text: "var(--cn-color-control-neutral-fg-strong, var(--cn-color-neutral-700, #363d45))",
    icon: "var(--cn-color-control-neutral-fg, var(--cn-color-neutral-600, #4e5660))",
    rgb: "var(--cn-color-rgb-neutral-600, 78, 86, 96)",
  },
};

const SEVERITY_ICONS: Record<CnAlertSeverity, string> = {
  success: "check_circle",
  info: "info",
  warning: "warning",
  error: "error",
};

const NATIVE_SEVERITIES: ReadonlySet<CnAlertSeverity> = new Set([
  "success",
  "info",
  "warning",
  "error",
]);

const DEFAULT_ROLE: Record<CnAlertSeverity, CnAlertRole> = {
  error: "alert",
  warning: "alert",
  success: "status",
  info: "status",
};

function parseMessage(message: string): ReactNode {
  if (!message) return null;
  if (!message.includes("\n")) return message;

  const lines = message.split("\n").filter((line) => line.trim() !== "");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {lines.map((line, index) => {
        const bulletMatch = line.match(/^•\s*([^:]+):\s*(.+)$/);
        if (bulletMatch) {
          const [, label, text] = bulletMatch;
          return (
            <Box
              key={index}
              sx={{
                display: "flex",
                gap: "6px",
                alignItems: "flex-start",
                fontSize: "inherit",
                lineHeight: 1.45,
                wordBreak: "break-word",
              }}
            >
              <Box component="span" sx={{ flexShrink: 0 }}>
                •
              </Box>
              <Box component="span" sx={{ fontWeight: 600, flexShrink: 0 }}>
                {label.trim()}:
              </Box>
              <Box component="span">{text}</Box>
            </Box>
          );
        }
        return (
          <Box
            key={index}
            component="div"
            sx={{
              fontSize: "inherit",
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {line}
          </Box>
        );
      })}
    </Box>
  );
}

const isNativeSeverity = (value: CnAlertColor): value is CnAlertSeverity =>
  NATIVE_SEVERITIES.has(value as CnAlertSeverity);

const BUTTON_COLOR: Record<CnAlertColor, CnButtonColor> = {
  success: "success",
  info: "info",
  warning: "warning",
  error: "error",
  primary: "primary",
  secondary: "neutral",
  accent: "accent",
  neutral: "neutral",
};

const isActionList = (value: unknown): value is CnAlertAction[] =>
  Array.isArray(value) &&
  value.every((item) => item && typeof item === "object" && !isValidElement(item));

export const CnAlert = forwardRef<HTMLDivElement, CnAlertProps>(function CnAlert(
  {
    mode = "inline",
    severity = "info",
    variant = "standard",
    color,
    title,
    message = "",
    children,
    icon,
    iconMode = "icon",
    action,
    actions,
    details,
    detailsLabel = "Ver detalles",
    hideDetailsLabel = "Ocultar detalles",
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    closable = false,
    dismissible = false,
    closeLabel = "Cerrar alerta",
    onClose,
    visible: visibleProp,
    role,
    open: externalOpen,
    autoHideDuration = 4000,
    position = { vertical: "top", horizontal: "right" },
    disableClickawayClose = true,
    skeleton = false,
    sx,
    className,
    alertProps,
    snackbarProps,
    collapseProps,
    ...rest
  },
  ref,
) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const detailsId = useId();

  const isPopup = mode === "popup" || mode === "toast";
  const isControlled = externalOpen !== undefined;
  const resolvedOpen = isControlled ? Boolean(externalOpen) : internalOpen;
  // En línea: `visible` controla; sin él, solo `dismissible` puede ocultarla.
  const visible = visibleProp ?? !dismissed;
  const showClose = (closable && Boolean(onClose)) || dismissible;
  const expanded = expandedProp ?? expandedState;
  const hasActions = isActionList(actions) ? actions.length > 0 : Boolean(actions);

  const resolvedColor: CnAlertColor = color ?? severity;
  const tokens = COLOR_TOKENS[resolvedColor];
  const isNativeColor = isNativeSeverity(resolvedColor);

  const resolvedSeverity: CnAlertSeverity = isNativeColor ? resolvedColor : "info";

  const resolvedRole: CnAlertRole = role ?? DEFAULT_ROLE[resolvedSeverity];

  const handleClose = useCallback(
    (reason: CnAlertCloseReason) => {
      if (!isControlled && isPopup) {
        setInternalOpen(false);
      }
      if (!isPopup && dismissible && visibleProp === undefined && reason === "close") {
        setDismissed(true);
      }
      onClose?.(reason);
    },
    [isControlled, isPopup, dismissible, visibleProp, onClose],
  );

  if (skeleton) {
    if (isPopup ? !resolvedOpen : !visible) return null;
    return (
      <CnAlertSkeleton
        variant={variant}
        severity={resolvedSeverity}
        mode={mode}
        title={typeof title === "string" ? title : Boolean(title)}
        message={message || Boolean(children)}
        icon={icon !== false && iconMode !== "none"}
        action={Boolean(action)}
        actions={isActionList(actions) ? actions.length : actions ? 1 : 0}
        details={Boolean(details)}
        closable={showClose}
        sx={sx}
        className={className}
      />
    );
  }

  const isFilled = variant === "filled";
  const buttonColor = BUTTON_COLOR[resolvedColor];
  const reduced = prefersReducedMotion();

  const toggleDetails = () => {
    const next = !expanded;
    if (expandedProp === undefined) setExpandedState(next);
    onExpandedChange?.(next);
  };

  const detailsBlock = details ? (
    <>
      <Collapse in={expanded} timeout={reduced ? 0 : "auto"} unmountOnExit>
        <Box id={detailsId} data-cn-alert-details sx={{ mt: "8px", overflowWrap: "anywhere" }}>
          {details}
        </Box>
      </Collapse>
      <Box sx={{ display: "flex", mt: "4px" }}>
        <CnButton
          size="small"
          variant="text"
          color={buttonColor}
          endIcon={
            <CnIcon
              name="expand_more"
              size={16}
              color="inherit"
              sx={{
                transition: reduced ? "none" : "transform 160ms ease",
                transform: expanded ? "rotate(180deg)" : "none",
              }}
            />
          }
          aria-expanded={expanded}
          aria-controls={expanded ? detailsId : undefined}
          onClick={toggleDetails}
          sx={{
            ml: "-4px",
            px: "4px",
            minWidth: 0,
            ...(isFilled && { color: "inherit" }),
          }}
        >
          {expanded ? hideDetailsLabel : detailsLabel}
        </CnButton>
      </Box>
    </>
  ) : null;

  const actionNodes = isActionList(actions)
    ? actions.map((item, index) => {
        const isLink = item.variant === "link";
        const buttonVariant: "contained" | "outlined" | "text" =
          item.variant === undefined
            ? index > 0
              ? "text"
              : "contained"
            : item.variant === "link"
              ? "text"
              : item.variant;
        return (
          <CnButton
            key={index}
            size="small"
            variant={buttonVariant}
            color={buttonColor}
            startIcon={item.icon}
            href={item.href}
            target={item.target}
            rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
            disabled={item.disabled}
            aria-label={item["aria-label"]}
            onClick={item.onClick}
            sx={[
              { maxWidth: "100%" },
              isLink ? { px: "4px", minWidth: 0, textDecoration: "underline" } : {},
              isFilled
                ? buttonVariant === "contained"
                  ? {
                      backgroundColor: "var(--cn-color-neutral-0, #ffffff)",
                      color: tokens.main,
                      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.9)" },
                    }
                  : { color: "inherit", borderColor: "rgba(255, 255, 255, 0.6)" }
                : {},
            ]}
          >
            {item.label}
          </CnButton>
        );
      })
    : actions;

  const actionsBlock = hasActions ? (
    <Box
      data-cn-alert-actions
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        mt: "10px",
        minWidth: 0,
      }}
    >
      {actionNodes}
    </Box>
  ) : null;

  const resolvedIcon: ReactNode = (() => {
    if (icon === false || iconMode === "none") return false;
    if (icon) {
      if (typeof icon === "string") {
        return <CnIcon name={icon} size={22} color="inherit" aria-hidden />;
      }
      return icon;
    }
    return <CnIcon name={SEVERITY_ICONS[resolvedSeverity]} size={22} color="inherit" aria-hidden />;
  })();

  const resolvedAction: ReactNode = (() => {
    const closeButton = showClose ? (
      <IconButton
        size="small"
        aria-label={closeLabel}
        onClick={() => handleClose("close")}
        sx={{
          color: "inherit",
          padding: "4px",
          marginTop: "2px",
          transition: "opacity 140ms ease",
          opacity: 0.7,
          "&:hover": { opacity: 1, backgroundColor: "transparent" },
        }}
      >
        <CnIcon name="close" size={16} color="inherit" />
      </IconButton>
    ) : null;

    if (action && closeButton) {
      return (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "4px" }}>
          {action}
          {closeButton}
        </Box>
      );
    }
    return action ?? closeButton;
  })();

  const variantSx: Record<string, unknown> = (() => {
    if (variant === "filled") {
      return {
        backgroundColor: tokens.main,
        color: "var(--cn-color-neutral-0, #ffffff)",
        border: "none",
        "& .MuiAlert-icon": { color: "inherit", opacity: 1 },
        "& .MuiAlertTitle-root": { color: "inherit" },
      };
    }
    if (variant === "outlined") {
      return {
        backgroundColor: "transparent",
        color: tokens.text,
        border: `1px solid rgba(${tokens.rgb}, 0.35)`,
        "& .MuiAlert-icon": { color: tokens.icon },
        "& .MuiAlertTitle-root": { color: tokens.text },
      };
    }
    if (variant === "left-accent") {
      return {
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        color: "var(--cn-color-text, #222831)",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderLeftWidth: "4px",
        borderLeftColor: tokens.icon,
        "& .MuiAlert-icon": { color: tokens.icon },
        "& .MuiAlertTitle-root": { color: tokens.text },
      };
    }
    return {
      backgroundColor: tokens.soft,
      color: tokens.text,
      border: "none",
      "& .MuiAlert-icon": { color: tokens.icon },
      "& .MuiAlertTitle-root": { color: tokens.text },
    };
  })();

  const baseSx: Record<string, unknown> = {
    alignItems: "flex-start",
    borderRadius: "var(--cn-radius-md, 8px)",
    paddingBlock: "10px",
    paddingInline: "12px",
    "& .MuiAlert-icon": {
      marginRight: "10px",
      padding: 0,
      flexShrink: 0,
    },
    "& .MuiAlert-message": {
      width: "100%",
      minWidth: 0,
      overflowWrap: "anywhere",
      padding: "2px 0 0",
      fontSize: "var(--cn-font-size-sm, 12px)",
      lineHeight: 1.5,
    },
    "& .MuiAlertTitle-root": {
      fontSize: "var(--cn-font-size-base, 13px)",
      fontWeight: "var(--cn-font-weight-semibold, 600)",
      marginBottom: "4px",
      lineHeight: 1.35,
    },
    "& .MuiAlert-action": {
      padding: 0,
      marginLeft: "8px",
      alignItems: "flex-start",
      paddingTop: 0,
    },
  };

  const mainContent: ReactNode =
    children ??
    (message ? (
      title ? (
        <>
          <AlertTitle>{title}</AlertTitle>
          {parseMessage(message)}
        </>
      ) : (
        parseMessage(message)
      )
    ) : title ? (
      <AlertTitle>{title}</AlertTitle>
    ) : null);

  const alertContent: ReactNode =
    detailsBlock || actionsBlock ? (
      <>
        {mainContent}
        {detailsBlock}
        {actionsBlock}
      </>
    ) : (
      mainContent
    );

  const alertElement = (
    <Alert
      ref={ref}
      severity={resolvedSeverity}
      variant={isNativeColor && variant !== "left-accent" ? variant : "standard"}
      icon={resolvedIcon}
      action={resolvedAction}
      role={resolvedRole}
      className={className}
      sx={[baseSx, variantSx, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
      {...alertProps}
    >
      {alertContent}
    </Alert>
  );

  if (isPopup) {
    if (!resolvedOpen) return null;

    const handleSnackbarClose: NonNullable<SnackbarProps["onClose"]> = (_event, reason) => {
      if (reason === "clickaway") {
        if (disableClickawayClose) return;
        handleClose("clickaway");
        return;
      }
      if (reason === "escapeKeyDown") {
        handleClose("escape");
        return;
      }
      handleClose("auto");
    };

    return (
      <Snackbar
        {...snackbarProps}
        open={resolvedOpen}
        anchorOrigin={position}
        autoHideDuration={autoHideDuration ?? undefined}
        onClose={handleSnackbarClose}
      >
        <Box
          sx={{
            width: "100%",
            minWidth: { xs: "auto", sm: 320 },
            maxWidth: 560,
            boxShadow: "var(--cn-shadow-lg, 0 10px 24px rgba(15, 23, 42, 0.10))",
            borderRadius: "var(--cn-radius-lg, 12px)",
          }}
        >
          {alertElement}
        </Box>
      </Snackbar>
    );
  }

  return (
    <Collapse in={visible} {...collapseProps}>
      {alertElement}
    </Collapse>
  );
});
