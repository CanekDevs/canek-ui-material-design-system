import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useId } from "react";
import { useSortableList } from "../../utils/use-sortable-list";
import { CnButton } from "../CnButton";
import { CnIcon } from "../CnIcon";
import type { CnFormLabels, CnFormSection, CnFormValues } from "./CnForm.types";

type HeaderProps = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: string;
  errorCount: number;
  collapsible: boolean;
  collapsed: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  labels: CnFormLabels;
  level: "section" | "item";
  contentId: string;
  /** Contenido antes del título (p. ej. el asa para reordenar). */
  leading?: ReactNode;
};

const ErrorBadge = ({ count }: { count: number }) => (
  <Box
    component="span"
    aria-label={`${count} ${count === 1 ? "error" : "errores"}`}
    sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 18,
      height: 18,
      paddingInline: "5px",
      borderRadius: "999px",
      fontSize: "var(--cn-font-size-xs, 11px)",
      fontWeight: 700,
      color: "var(--cn-color-text-inverse, #ffffff)",
      backgroundColor: "var(--cn-color-error-500, #d63c3c)",
    }}
  >
    {count}
  </Box>
);

const SectionHeader = ({
  title,
  description,
  icon,
  errorCount,
  collapsible,
  collapsed,
  onToggle,
  actions,
  labels,
  level,
  contentId,
  leading,
}: HeaderProps) => {
  if (!title && !description && !actions && !collapsible && !leading) return null;
  const titleNode = (
    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
      {icon && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: "var(--cn-radius-sm, 6px)",
            backgroundColor: "var(--cn-color-brand-50, #eef3fb)",
            color: "var(--cn-color-brand-600, #254d87)",
          }}
        >
          <CnIcon name={icon} size="sm" />
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {title && (
          <Typography
            component={level === "section" ? "h3" : "h4"}
            sx={{
              m: 0,
              fontSize:
                level === "section"
                  ? "var(--cn-font-size-md, 14px)"
                  : "var(--cn-font-size-base, 13px)",
              fontWeight: 600,
              color: "var(--cn-color-text, #222831)",
              lineHeight: 1.4,
            }}
          >
            {title}
          </Typography>
        )}
        {description && (
          <Typography
            component="div"
            sx={{
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {errorCount > 0 && <ErrorBadge count={errorCount} />}
    </Box>
  );

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}
    >
      {leading}
      {collapsible ? (
        <Box
          component="button"
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={contentId}
          sx={{
            all: "unset",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flex: 1,
            minWidth: 0,
            cursor: "pointer",
            borderRadius: "var(--cn-radius-sm, 6px)",
            "&:focus-visible": {
              outline: "2px solid var(--cn-color-brand-300, #7c9fdc)",
              outlineOffset: 2,
            },
          }}
        >
          <ExpandMoreIcon
            fontSize="small"
            aria-label={collapsed ? labels.expand : labels.collapse}
            sx={{
              color: "var(--cn-color-neutral-500, #6e7682)",
              transform: collapsed ? "rotate(-90deg)" : "none",
              transition: "transform 160ms ease",
            }}
          />
          {titleNode}
        </Box>
      ) : (
        <Box sx={{ flex: 1, minWidth: 0 }}>{titleNode}</Box>
      )}
      {actions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
};

const cardSx = (level: "section" | "item", hasError: boolean) => ({
  display: "flex",
  flexDirection: "column",
  padding: level === "section" ? "16px" : "12px",
  borderRadius: level === "section" ? "var(--cn-radius-lg, 12px)" : "var(--cn-radius-md, 8px)",
  border: "1px solid",
  borderColor: hasError ? "var(--cn-color-error-500, #d63c3c)" : "var(--cn-color-border, #dde0e4)",
  backgroundColor:
    level === "section"
      ? "var(--cn-color-surface, #ffffff)"
      : "var(--cn-color-neutral-50, #fafbfc)",
  transition: "border-color 140ms ease",
});

export type CnFormSectionViewProps = {
  section: CnFormSection;
  values: CnFormValues;
  labels: CnFormLabels;
  disabled: boolean;
  /** Renderiza los campos (grid incluido) de la sección o de un elemento. */
  renderFields: (index?: number) => ReactNode;
  errorCount: (index?: number) => number;
  isCollapsed: (key: string) => boolean;
  onToggle: (key: string) => void;
  items: CnFormValues[];
  itemKeys: string[];
  canAdd: boolean;
  canRemove: boolean;
  canReorder: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  /** Mueve el elemento `from` a la posición `to`. */
  onMove: (from: number, to: number) => void;
  loading?: ReactNode;
};

export const CnFormSectionView = ({
  section,
  labels,
  disabled,
  renderFields,
  errorCount,
  isCollapsed,
  onToggle,
  items,
  itemKeys,
  canAdd,
  canRemove,
  canReorder,
  onAdd,
  onRemove,
  onMove,
  loading,
}: CnFormSectionViewProps) => {
  const baseId = useId().replace(/:/g, "");
  const collapsible = Boolean(section.collapsible);
  const sectionCollapsed = collapsible && isCollapsed(section.id);
  const totalErrors = errorCount();
  const contentId = `cn-section-${baseId}`;
  const itemLabel = typeof section.title === "string" ? section.title : "Elemento";
  const titleFor = (index: number): string => {
    const custom = section.itemTitle?.(index, items[index] ?? {});
    return typeof custom === "string" ? custom : `${itemLabel} ${index + 1}`;
  };
  const sortable = useSortableList({
    count: items.length,
    onMove,
    disabled: disabled || !canReorder,
    getItemLabel: titleFor,
  });
  const showHandle = canReorder && !disabled && items.length > 1;

  const body =
    loading ??
    (section.repeatable ? (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item, index) => {
          const key = itemKeys[index];
          const collapsedKey = `${section.id}:${key}`;
          const itemCollapsed = collapsible && isCollapsed(collapsedKey);
          const itemErrors = errorCount(index);
          const itemContentId = `${contentId}-${key}`;
          const title = section.itemTitle
            ? section.itemTitle(index, item)
            : `${itemLabel} ${index + 1}`;
          return (
            <Box
              key={key}
              {...sortable.getItemProps(index)}
              role="group"
              aria-label={typeof title === "string" ? title : `${itemLabel} ${index + 1}`}
              data-cn-section-item={index}
              sx={cardSx("item", itemErrors > 0)}
            >
              <SectionHeader
                title={title}
                errorCount={itemErrors}
                collapsible={collapsible}
                collapsed={itemCollapsed}
                onToggle={() => onToggle(collapsedKey)}
                labels={labels}
                level="item"
                contentId={itemContentId}
                leading={
                  showHandle && (
                    <Box
                      {...sortable.getHandleProps(index)}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        borderRadius: "var(--cn-radius-sm, 6px)",
                        color: "var(--cn-color-neutral-400, #9aa1aa)",
                        "&:hover": {
                          color: "var(--cn-color-neutral-600, #4e5660)",
                          backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
                        },
                        "&:focus-visible": {
                          outline: "2px solid var(--cn-color-brand-400, #5081c4)",
                          outlineOffset: 1,
                        },
                      }}
                    >
                      <DragIndicatorIcon fontSize="small" />
                    </Box>
                  )
                }
                actions={
                  !disabled && (
                    <>
                      {canRemove && (
                        <Tooltip title={labels.remove}>
                          <IconButton
                            size="small"
                            aria-label={`${labels.remove} ${index + 1}`}
                            onClick={() => onRemove(index)}
                            sx={{ color: "var(--cn-color-error-600, #b52f2f)" }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )
                }
              />
              <Collapse in={!itemCollapsed} id={itemContentId}>
                <Box sx={{ pt: "12px" }}>{renderFields(index)}</Box>
              </Collapse>
            </Box>
          );
        })}
        <Box
          aria-live="polite"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
          }}
        >
          {sortable.announcement}
        </Box>
        {!disabled && canAdd && (
          <Box>
            <CnButton variant="text" color="primary" size="small" startIcon="add" onClick={onAdd}>
              {section.addLabel ?? `${labels.add} ${itemLabel.toLowerCase()}`}
            </CnButton>
          </Box>
        )}
      </Box>
    ) : (
      renderFields()
    ));

  return (
    <Box
      component="section"
      aria-label={typeof section.title === "string" ? section.title : undefined}
      data-cn-section={section.id}
      sx={cardSx("section", totalErrors > 0 && sectionCollapsed)}
    >
      <SectionHeader
        title={section.title}
        description={section.description}
        icon={section.icon}
        errorCount={sectionCollapsed ? totalErrors : 0}
        collapsible={collapsible && !section.repeatable}
        collapsed={sectionCollapsed && !section.repeatable}
        onToggle={() => onToggle(section.id)}
        labels={labels}
        level="section"
        contentId={contentId}
      />
      {section.repeatable ? (
        <Box sx={{ pt: section.title || section.description ? "12px" : 0 }}>{body}</Box>
      ) : (
        <Collapse in={!sectionCollapsed} id={contentId}>
          <Box sx={{ pt: section.title || section.description || collapsible ? "12px" : 0 }}>
            {body}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};
