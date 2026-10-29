import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

type DivProps = {
  children?: ReactNode;
  sx?: SxProps<Theme>;
  className?: string;
};

export function CnCardHeader({
  title,
  subtitle,
  actions,
  icon,
  children,
  sx,
  className,
}: DivProps & {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Box
      className={className}
      sx={[
        {
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          mb: "12px",
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon && <Box sx={{ flexShrink: 0 }}>{icon}</Box>}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Typography
            component="div"
            sx={{
              fontSize: "var(--cn-font-size-base, 13px)",
              fontWeight: "var(--cn-font-weight-bold, 700)",
              color: "var(--cn-color-text, #222831)",
              lineHeight: 1.35,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography
            component="div"
            sx={{
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
              lineHeight: 1.4,
              mt: title ? "2px" : 0,
            }}
          >
            {subtitle}
          </Typography>
        )}
        {children}
      </Box>
      {actions && (
        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}

export function CnCardBody({ children, sx, className }: DivProps) {
  return (
    <Box className={className} sx={sx}>
      {children}
    </Box>
  );
}

export function CnCardFooter({ children, sx, className }: DivProps) {
  return (
    <Box
      className={className}
      sx={[
        {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          mt: "12px",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

export function CnCardMedia({
  children,
  sx,
  className,
  aspectRatio,
}: DivProps & { aspectRatio?: string }) {
  return (
    <Box
      className={className}
      sx={[
        {
          width: "100%",
          overflow: "hidden",
          borderRadius: "var(--cn-radius-md, 8px)",
          aspectRatio,
          "& > *": { width: "100%", display: "block", height: "100%", objectFit: "cover" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
