import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";

export type CnTransferListFieldSkeletonProps = CnSkeletonCommonProps & {
  label?: boolean | string;
  helperText?: boolean | string;
  /** Buscador en cada lista (como el campo). */
  searchable?: boolean;
  /** Alto de cada lista en px (como el campo). */
  listHeight?: number;
  /** Elementos de la lista de disponibles. */
  availableItems?: number;
  /** Elementos de la lista de seleccionados. */
  selectedItems?: number;
  /** Avatar/iniciales al inicio de cada opción. */
  withAvatar?: boolean;
  /**
   * Disposición: `responsive` (como el campo: en columna en pantallas chicas y en
   * fila desde `sm`), o fija en `horizontal`/`vertical`.
   */
  orientation?: "responsive" | "horizontal" | "vertical";
};

const ITEM_HEIGHT = 34;

const Pane = ({
  items,
  searchable,
  height,
  withAvatar,
  seed,
}: {
  items: number;
  searchable: boolean;
  height: number;
  withAvatar: boolean;
  seed: number;
}) => {
  const visible = Math.min(items, Math.max(1, Math.floor((height - 8) / ITEM_HEIGHT)));
  return (
    <Box
      data-sk-part="pane"
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-md, 8px)",
        backgroundColor: "var(--cn-color-surface, #ffffff)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          px: "14px",
          height: 46,
          boxSizing: "border-box",
          borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
        }}
      >
        <SkBlock width={16} height={16} radius={3} />
        <SkText width="34%" size={12} />
        <Box sx={{ flex: 1 }} />
        <SkText width={22} size={11} />
      </Box>
      {searchable && (
        <Box
          data-sk-part="search"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            px: "10px",
            height: 33,
            boxSizing: "border-box",
            borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
          }}
        >
          <SkBlock circle width={14} />
          <SkText width="30%" size={12} />
        </Box>
      )}
      <Box sx={{ height, overflow: "hidden", py: "4px", boxSizing: "border-box" }}>
        {Array.from({ length: visible }, (_, i) => (
          <Box
            key={i}
            data-sk-part="item"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              px: "14px",
              height: ITEM_HEIGHT,
            }}
          >
            <SkBlock width={16} height={16} radius={3} />
            {withAvatar && <SkBlock circle width={22} />}
            <SkText width={varyWidth(i + seed, 35, 35)} size={13} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/** Skeleton de `CnTransferListField`: dos listas (encabezado, buscador, opciones) y botones de traspaso. */
export const CnTransferListFieldSkeleton = ({
  label = true,
  helperText = false,
  searchable = true,
  listHeight = 240,
  availableItems = 5,
  selectedItems = 2,
  withAvatar = false,
  orientation = "responsive",
  animation,
  ariaLabel = "Cargando lista de transferencia",
  sx,
  className,
}: CnTransferListFieldSkeletonProps) => {
  const direction =
    orientation === "responsive"
      ? ({ xs: "column", sm: "row" } as const)
      : orientation === "vertical"
        ? "column"
        : "row";
  const buttonsDirection =
    orientation === "responsive"
      ? ({ xs: "row", sm: "column" } as const)
      : orientation === "vertical"
        ? "row"
        : "column";

  return (
    <CnSkeletonGroup
      name="transfer-list-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {label && <SkText width={150} size={13} sx={{ mb: "10px" }} />}
      <Box
        data-sk-orientation={orientation}
        sx={{ display: "flex", flexDirection: direction, alignItems: "stretch", gap: "8px" }}
      >
        <Pane
          items={availableItems}
          searchable={searchable}
          height={listHeight}
          withAvatar={withAvatar}
          seed={0}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: buttonsDirection,
            justifyContent: "center",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              data-sk-part="transfer"
              sx={{
                width: 34,
                height: 34,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--cn-color-border, #dde0e4)",
                borderRadius: "var(--cn-radius-sm, 6px)",
              }}
            >
              <SkBlock width={14} height={14} radius={3} />
            </Box>
          ))}
        </Box>
        <Pane
          items={selectedItems}
          searchable={searchable}
          height={listHeight}
          withAvatar={withAvatar}
          seed={3}
        />
      </Box>
      {helperText && <SkText width="40%" size={11} sx={{ mt: "8px" }} />}
    </CnSkeletonGroup>
  );
};
