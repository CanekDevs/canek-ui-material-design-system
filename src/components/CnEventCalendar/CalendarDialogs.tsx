import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputBase from "@mui/material/InputBase";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { CnButton } from "../CnButton";
import { CnIcon } from "../CnIcon";
import {
  addDays,
  formatDayShort,
  formatTime,
  pad2,
  startOfDay,
  toDate,
  toIsoDate,
} from "./calendar-utils";
import type {
  CnCalendarResource,
  CnEventCategory,
  CnEventDraft,
  CnRecurrenceScope,
} from "./CnEventCalendar.types";
import { parseQuickEvent } from "./natural-language";

const localDateTime = (d: Date) => `${toIsoDate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

// ─── Creación rápida ─────────────────────────────────────────────────

export type QuickCreatePopoverProps = {
  draft: CnEventDraft | null;
  anchorPosition: { top: number; left: number } | null;
  categories: CnEventCategory[];
  resources: CnCalendarResource[];
  onCancel: () => void;
  onSave: (draft: CnEventDraft) => void;
};

/** Formulario chico para crear un evento en el horario seleccionado. */
export const QuickCreatePopover = ({
  draft,
  anchorPosition,
  categories,
  resources,
  onCancel,
  onSave,
}: QuickCreatePopoverProps) => {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [category, setCategory] = useState("");
  const [resourceId, setResourceId] = useState("");

  useEffect(() => {
    if (!draft) return;
    setTitle(draft.title);
    setAllDay(draft.allDay);
    setStart(draft.allDay ? toIsoDate(draft.start) : localDateTime(draft.start));
    setEnd(draft.allDay ? toIsoDate(addDays(draft.end, -1)) : localDateTime(draft.end));
    setCategory(draft.category ?? "");
    setResourceId(draft.resourceId ?? "");
  }, [draft]);

  const toggleAllDay = (next: boolean) => {
    const s = toDate(start);
    const e = toDate(end);
    setAllDay(next);
    if (!s || !e) return;
    if (next) {
      setStart(toIsoDate(s));
      setEnd(toIsoDate(e < s ? s : e));
    } else {
      const base = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 9);
      setStart(localDateTime(base));
      setEnd(localDateTime(new Date(base.getTime() + 3_600_000)));
    }
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const s = toDate(start);
    let en = toDate(end);
    if (!s || !draft) return;
    if (!en || en < s) en = allDay ? s : new Date(s.getTime() + 3_600_000);
    onSave({
      ...draft,
      title: title.trim() || "Nuevo evento",
      allDay,
      start: allDay ? startOfDay(s) : s,
      end: allDay
        ? addDays(startOfDay(en), 1)
        : en.getTime() === s.getTime()
          ? new Date(s.getTime() + 1_800_000)
          : en,
      category: category || undefined,
      resourceId: resourceId || undefined,
    });
  };

  return (
    <Popover
      open={Boolean(draft && anchorPosition)}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? { top: 0, left: 0 }}
      onClose={onCancel}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-label": "Nuevo evento",
          sx: { width: 320, maxWidth: "calc(100vw - 32px)", borderRadius: "12px", p: "14px" },
        },
      }}
    >
      <Box
        component="form"
        data-cn-quick-create
        onSubmit={submit}
        sx={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <Box sx={{ fontSize: "0.9rem", fontWeight: 700 }}>Nuevo evento</Box>
        <TextField
          autoFocus
          size="small"
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Agrega un título"
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={allDay}
              onChange={(e) => toggleAllDay(e.target.checked)}
            />
          }
          label="Todo el día"
          slotProps={{ typography: { fontSize: "0.82rem" } }}
          sx={{ ml: 0 }}
        />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <TextField
            size="small"
            label="Inicio"
            type={allDay ? "date" : "datetime-local"}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { "aria-label": "Inicio" } }}
          />
          <TextField
            size="small"
            label="Fin"
            type={allDay ? "date" : "datetime-local"}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { "aria-label": "Fin" } }}
          />
        </Box>
        {categories.length > 0 && (
          <TextField
            select
            size="small"
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="">Sin categoría</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        {resources.length > 0 && (
          <TextField
            select
            size="small"
            label="Recurso"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
          >
            <MenuItem value="">Sin asignar</MenuItem>
            {resources.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
          <CnButton size="small" variant="text" color="neutral" onClick={onCancel}>
            Cancelar
          </CnButton>
          <CnButton size="small" variant="contained" color="accent" type="submit">
            Guardar
          </CnButton>
        </Box>
      </Box>
    </Popover>
  );
};

// ─── Alcance de recurrentes ──────────────────────────────────────────

export type RecurrenceScopeDialogProps = {
  open: boolean;
  action: "change" | "delete";
  onCancel: () => void;
  onConfirm: (scope: CnRecurrenceScope) => void;
};

/** "Solo este / este y los siguientes / todos" para eventos que se repiten. */
export const RecurrenceScopeDialog = ({
  open,
  action,
  onCancel,
  onConfirm,
}: RecurrenceScopeDialogProps) => {
  const [scope, setScope] = useState<CnRecurrenceScope>("this");
  useEffect(() => {
    if (open) setScope("this");
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="cn-recurrence-scope-title"
      slotProps={{ paper: { sx: { borderRadius: "14px", minWidth: 300 } } }}
    >
      <DialogTitle id="cn-recurrence-scope-title" sx={{ fontSize: "1rem", fontWeight: 700 }}>
        {action === "delete" ? "Eliminar evento recurrente" : "Editar evento recurrente"}
      </DialogTitle>
      <DialogContent sx={{ pb: 0 }}>
        <RadioGroup
          aria-label="Alcance"
          value={scope}
          onChange={(e) => setScope(e.target.value as CnRecurrenceScope)}
        >
          <FormControlLabel
            value="this"
            control={<Radio size="small" />}
            label="Solo este evento"
          />
          <FormControlLabel
            value="following"
            control={<Radio size="small" />}
            label="Este y los siguientes"
          />
          <FormControlLabel
            value="all"
            control={<Radio size="small" />}
            label="Todos los eventos"
          />
        </RadioGroup>
      </DialogContent>
      <DialogActions sx={{ px: "20px", pb: "16px" }}>
        <CnButton size="small" variant="text" color="neutral" onClick={onCancel}>
          Cancelar
        </CnButton>
        <CnButton
          size="small"
          variant="contained"
          color={action === "delete" ? "error" : "accent"}
          onClick={() => onConfirm(scope)}
        >
          Aceptar
        </CnButton>
      </DialogActions>
    </Dialog>
  );
};

// ─── Menú contextual ─────────────────────────────────────────────────

export type EventContextMenuAction =
  "open" | "edit" | "duplicate" | "delete" | "copy-link" | "export" | "google";

export type EventContextMenuProps = {
  position: { top: number; left: number } | null;
  title?: string;
  onClose: () => void;
  onAction: (action: EventContextMenuAction) => void;
  canEdit: boolean;
  canDuplicate: boolean;
  canDelete: boolean;
};

const ITEMS: {
  action: EventContextMenuAction;
  label: string;
  icon: string;
  when?: "canEdit" | "canDuplicate" | "canDelete";
  divider?: boolean;
}[] = [
  { action: "open", label: "Ver detalle", icon: "visibility" },
  { action: "edit", label: "Editar", icon: "edit", when: "canEdit" },
  { action: "duplicate", label: "Duplicar", icon: "content_copy", when: "canDuplicate" },
  { action: "copy-link", label: "Copiar enlace", icon: "link", divider: true },
  { action: "export", label: "Exportar .ics", icon: "download" },
  { action: "google", label: "Agregar a Google Calendar", icon: "event_available" },
  { action: "delete", label: "Eliminar", icon: "delete_outline", when: "canDelete", divider: true },
];

/** Menú de clic derecho sobre un evento. */
export const EventContextMenu = ({
  position,
  title,
  onClose,
  onAction,
  ...flags
}: EventContextMenuProps) => (
  <Menu
    open={Boolean(position)}
    onClose={onClose}
    anchorReference="anchorPosition"
    anchorPosition={position ?? undefined}
    slotProps={{
      paper: {
        "aria-label": title ? `Acciones: ${title}` : "Acciones",
        sx: { minWidth: 220, borderRadius: "10px" },
      } as object,
    }}
  >
    {ITEMS.filter((item) => !item.when || flags[item.when]).flatMap((item) => [
      item.divider ? <Divider key={`d-${item.action}`} /> : null,
      <MenuItem
        key={item.action}
        data-cn-context-action={item.action}
        onClick={() => {
          onClose();
          onAction(item.action);
        }}
        sx={item.action === "delete" ? { color: "var(--cn-color-error-600, #b42727)" } : undefined}
      >
        <ListItemIcon sx={item.action === "delete" ? { color: "inherit" } : undefined}>
          <CnIcon name={item.icon} size="sm" />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 600 }}
        />
      </MenuItem>,
    ])}
  </Menu>
);

// ─── Alta rápida en lenguaje natural ────────────────────────────────

export type QuickAddInputProps = {
  categories: CnEventCategory[];
  locale: string;
  placeholder?: string;
  now: Date;
  onSubmit: (draft: CnEventDraft) => void;
};

/** Campo "Reunión con Ana mañana 10:00 #trabajo" con vista previa. */
export const QuickAddInput = ({
  categories,
  locale,
  placeholder = "Agregar rápido: “Junta con Ana mañana 10–11 #trabajo”",
  now,
  onSubmit,
}: QuickAddInputProps) => {
  const [text, setText] = useState("");
  const parsed = useMemo(
    () => (text.trim() ? parseQuickEvent(text, { now, categories }) : null),
    // `now` cambia cada minuto; basta con el texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, categories],
  );
  const categoryLabel = parsed?.category
    ? (categories.find((c) => c.id === parsed.category)?.label ?? `#${parsed.category}`)
    : null;
  const preview = parsed
    ? [
        parsed.title,
        formatDayShort(parsed.start, locale),
        parsed.allDay ? "Todo el día" : `${formatTime(parsed.start)} – ${formatTime(parsed.end)}`,
        categoryLabel,
        parsed.location,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const submit = () => {
    if (!parsed) return;
    onSubmit({
      title: parsed.title,
      start: parsed.start,
      end: parsed.end,
      allDay: parsed.allDay,
      category: parsed.category,
      location: parsed.location,
      text,
    });
    setText("");
  };
  return (
    <Box
      data-cn-quick-add
      sx={{
        position: "relative",
        flex: { xs: "1 1 100%", md: "1 1 280px" },
        order: { xs: 11, md: 0 },
      }}
    >
      <InputBase
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") setText("");
        }}
        placeholder={placeholder}
        inputProps={{
          "aria-label": "Agregar evento rápido",
          "aria-describedby": "cn-quick-add-preview",
        }}
        startAdornment={
          <CnIcon
            name="add"
            size={18}
            sx={{ color: "var(--cn-color-accent-600, #304ffe)", mr: "6px" }}
          />
        }
        sx={{
          width: "100%",
          height: 34,
          px: "10px",
          fontSize: "0.82rem",
          borderRadius: "999px",
          backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          "&.Mui-focused": {
            backgroundColor: "var(--cn-color-surface, #fff)",
            borderColor: "var(--cn-color-accent-500, #3d5afe)",
            boxShadow: "0 0 0 3px rgba(61, 90, 254, 0.15)",
          },
        }}
      />
      {preview && (
        <Box
          id="cn-quick-add-preview"
          role="status"
          data-cn-quick-add-preview
          sx={{
            position: "absolute",
            zIndex: 6,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            p: "6px 12px",
            borderRadius: "10px",
            fontSize: "0.76rem",
            color: "var(--cn-color-text, #222831)",
            backgroundColor: "var(--cn-color-surface, #fff)",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            boxShadow: "0 8px 24px rgba(17,20,24,0.12)",
          }}
        >
          <CnIcon name="event" size={13} sx={{ mr: "6px", verticalAlign: "-2px" }} />
          {preview}
          <Box component="span" sx={{ ml: "8px", color: "var(--cn-color-text-muted, #6e7682)" }}>
            Enter para crear
          </Box>
        </Box>
      )}
    </Box>
  );
};
