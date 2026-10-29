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
import { forwardRef, useCallback, useState } from "react";
import { CnIcon } from "../CnIcon";

export type CnAlertMode = "inline" | "popup" | "toast";
export type CnAlertSeverity = "success" | "info" | "warning" | "error";
export type CnAlertVariant = "standard" | "filled" | "outlined";
export type CnAlertColor = CnAlertSeverity | "primary" | "secondary" | "accent" | "neutral";
export type CnAlertIconMode = "icon" | "none";
export type CnAlertRole = "alert" | "status" | "none";
export type CnAlertCloseReason = "close" | "auto" | "clickaway" | "escape";

export type CnAlertProps = {
  mode?: CnAlertMode;
  severity?: CnAlertSeverity;
  variant?: CnAlertVariant;
  color?: CnAlertColor;
  title?: string;
  message?: string;
  children?: ReactNode;
  icon?: ReactNode | string | false;
  iconMode?: CnAlertIconMode;
  action?: ReactNode;
  closable?: boolean;
  onClose?: (reason: CnAlertCloseReason) => void;
  visible?: boolean;
  role?: CnAlertRole;
  open?: boolean;
  autoHideDuration?: number | null;
  position?: SnackbarOrigin;
  disableClickawayClose?: boolean;
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
    text: "var(--cn-color-success-700, #176230)",
    icon: "var(--cn-color-success-600, #228740)",
    rgb: "var(--cn-color-rgb-success-600, 34, 135, 64)",
  },
  info: {
    main: "var(--cn-color-info-600, #2367a8)",
    dark: "var(--cn-color-info-700, #1a4f82)",
    soft: "rgba(var(--cn-color-rgb-info-500, 44, 123, 200), 0.10)",
    text: "var(--cn-color-info-700, #1a4f82)",
    icon: "var(--cn-color-info-600, #2367a8)",
    rgb: "var(--cn-color-rgb-info-600, 35, 103, 168)",
  },
  warning: {
    main: "var(--cn-color-warning-600, #b8831a)",
    dark: "var(--cn-color-warning-700, #8a6312)",
    soft: "rgba(var(--cn-color-rgb-warning-500, 224, 160, 32), 0.10)",
    text: "var(--cn-color-warning-700, #8a6312)",
    icon: "var(--cn-color-warning-600, #b8831a)",
    rgb: "var(--cn-color-rgb-warning-600, 184, 131, 26)",
  },
  error: {
    main: "var(--cn-color-error-600, #b52f2f)",
    dark: "var(--cn-color-error-700, #8e2424)",
    soft: "rgba(var(--cn-color-rgb-error-500, 214, 60, 60), 0.10)",
    text: "var(--cn-color-error-700, #8e2424)",
    icon: "var(--cn-color-error-600, #b52f2f)",
    rgb: "var(--cn-color-rgb-error-600, 181, 47, 47)",
  },
  primary: {
    main: "var(--cn-color-brand-600, #254d87)",
    dark: "var(--cn-color-brand-700, #1c3d6d)",
    soft: "rgba(var(--cn-color-rgb-brand-500, 53, 98, 166), 0.10)",
    text: "var(--cn-color-brand-700, #1c3d6d)",
    icon: "var(--cn-color-brand-600, #254d87)",
    rgb: "var(--cn-color-rgb-brand-600, 37, 77, 135)",
  },
  secondary: {
    main: "var(--cn-color-neutral-700, #363d45)",
    dark: "var(--cn-color-neutral-800, #222831)",
    soft: "rgba(var(--cn-color-rgb-neutral-600, 78, 86, 96), 0.10)",
    text: "var(--cn-color-neutral-800, #222831)",
    icon: "var(--cn-color-neutral-700, #363d45)",
    rgb: "var(--cn-color-rgb-neutral-700, 54, 61, 69)",
  },
  accent: {
    main: "var(--cn-color-accent-500, #3d5afe)",
    dark: "var(--cn-color-accent-600, #304ffe)",
    soft: "rgba(var(--cn-color-rgb-accent-500, 61, 90, 254), 0.10)",
    text: "var(--cn-color-accent-600, #304ffe)",
    icon: "var(--cn-color-accent-500, #3d5afe)",
    rgb: "var(--cn-color-rgb-accent-500, 61, 90, 254)",
  },
  neutral: {
    main: "var(--cn-color-neutral-600, #4e5660)",
    dark: "var(--cn-color-neutral-700, #363d45)",
    soft: "rgba(var(--cn-color-rgb-neutral-500, 110, 118, 130), 0.10)",
    text: "var(--cn-color-neutral-700, #363d45)",
    icon: "var(--cn-color-neutral-600, #4e5660)",
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
    closable = false,
    onClose,
    visible = true,
    role,
    open: externalOpen,
    autoHideDuration = 4000,
    position = { vertical: "top", horizontal: "right" },
    disableClickawayClose = true,
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

  const isPopup = mode === "popup" || mode === "toast";
  const isControlled = externalOpen !== undefined;
  const resolvedOpen = isControlled ? Boolean(externalOpen) : internalOpen;

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
      onClose?.(reason);
    },
    [isControlled, isPopup, onClose],
  );

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
    const closeButton =
      closable && onClose ? (
        <IconButton
          size="small"
          aria-label="Cerrar alerta"
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

  const alertContent: ReactNode =
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

  const alertElement = (
    <Alert
      ref={ref}
      severity={resolvedSeverity}
      variant={isNativeColor ? variant : "standard"}
      icon={resolvedIcon}
      action={resolvedAction}
      role={resolvedRole === "none" ? undefined : resolvedRole}
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
