import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { KeyboardEvent } from "react";
import { useEffect, useRef } from "react";
import { pad2, parseIsoTime } from "../../utils/date-utils";

export type CnTimePanelProps = {
  /** `HH:mm` */
  value?: string;
  onChange: (value: string) => void;
  minutesStep?: number;
  ampm?: boolean;
  /** Límites `HH:mm` (inclusive). */
  minTime?: string;
  maxTime?: string;
  shouldDisableTime?: (time: string) => boolean;
  disabled?: boolean;
};

const columnSx = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  maxHeight: 252,
  overflowY: "auto",
  padding: "4px",
  scrollbarWidth: "thin",
  "&:not(:last-of-type)": { borderRight: "1px solid var(--cn-color-border-subtle, #e9ecef)" },
} as const;

const optionSx = {
  minWidth: 48,
  height: 32,
  borderRadius: "var(--cn-radius-sm, 6px)",
  fontSize: "var(--cn-font-size-sm, 12px)",
  fontVariantNumeric: "tabular-nums",
  color: "var(--cn-color-text, #222831)",
  "&:hover": { backgroundColor: "var(--cn-color-brand-50, #eef3fb)" },
  "&.Mui-focusVisible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
  "&[aria-selected='true']": {
    backgroundColor: "var(--cn-color-brand-600, #254d87)",
    color: "var(--cn-color-text-inverse, #ffffff)",
  },
  "&.Mui-disabled": { color: "var(--cn-color-neutral-300, #c5cad0)" },
} as const;

const handleListKeys = (event: KeyboardEvent<HTMLDivElement>) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const options = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='option']:not([disabled])"),
  );
  const index = options.indexOf(document.activeElement as HTMLButtonElement);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? options.length - 1
        : Math.min(options.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)));
  options[next]?.focus();
};

/** Selector de hora por columnas (hora / minutos / a. m.–p. m.). */
export const CnTimePanel = ({
  value,
  onChange,
  minutesStep = 5,
  ampm = false,
  minTime,
  maxTime,
  shouldDisableTime,
  disabled = false,
}: CnTimePanelProps) => {
  const parsed = parseIsoTime(value);
  const hours = parsed?.hours ?? null;
  const minutes = parsed?.minutes ?? null;
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    rootRef.current
      ?.querySelectorAll<HTMLElement>("[aria-selected='true']")
      .forEach((node) => node.scrollIntoView?.({ block: "center" }));
  }, []);

  const isDisabled = (h: number, m: number) => {
    const time = `${pad2(h)}:${pad2(m)}`;
    if (minTime && time < minTime) return true;
    if (maxTime && time > maxTime) return true;
    return Boolean(shouldDisableTime?.(time));
  };

  const emit = (h: number, m: number) => onChange(`${pad2(h)}:${pad2(m)}`);
  const step = Math.max(1, Math.min(30, minutesStep));
  const minuteOptions = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  // Si el valor no cae en el paso, igual se muestra como opción.
  if (minutes !== null && !minuteOptions.includes(minutes)) minuteOptions.push(minutes);
  minuteOptions.sort((a, b) => a - b);

  const hourOptions = ampm
    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : Array.from({ length: 24 }, (_, i) => i);
  const isPm = hours !== null && hours >= 12;
  const to24 = (h12: number, pm: boolean) => (h12 % 12) + (pm ? 12 : 0);
  const baseMinute = minutes ?? 0;

  return (
    <Box ref={rootRef} data-cn-time-panel sx={{ display: "flex", alignItems: "stretch" }}>
      <Box role="listbox" aria-label="Hora" onKeyDown={handleListKeys} sx={columnSx}>
        {hourOptions.map((h) => {
          const h24 = ampm ? to24(h, isPm) : h;
          const selected = hours === h24;
          const allDisabled = minuteOptions.every((m) => isDisabled(h24, m));
          return (
            <ButtonBase
              key={h}
              role="option"
              aria-selected={selected}
              tabIndex={selected || (hours === null && h === hourOptions[0]) ? 0 : -1}
              disabled={disabled || allDisabled}
              onClick={() => {
                const firstValid = minuteOptions.find((m) => !isDisabled(h24, m)) ?? baseMinute;
                emit(h24, isDisabled(h24, baseMinute) ? firstValid : baseMinute);
              }}
              sx={optionSx}
            >
              {pad2(h)}
            </ButtonBase>
          );
        })}
      </Box>
      <Box role="listbox" aria-label="Minutos" onKeyDown={handleListKeys} sx={columnSx}>
        {minuteOptions.map((m) => {
          const selected = minutes === m;
          return (
            <ButtonBase
              key={m}
              role="option"
              aria-selected={selected}
              tabIndex={selected || (minutes === null && m === 0) ? 0 : -1}
              disabled={disabled || (hours !== null && isDisabled(hours, m))}
              onClick={() => emit(hours ?? 0, m)}
              sx={optionSx}
            >
              {pad2(m)}
            </ButtonBase>
          );
        })}
      </Box>
      {ampm && (
        <Box role="listbox" aria-label="Periodo" onKeyDown={handleListKeys} sx={columnSx}>
          {(["a. m.", "p. m."] as const).map((label, index) => {
            const pm = index === 1;
            const selected = hours !== null && isPm === pm;
            return (
              <ButtonBase
                key={label}
                role="option"
                aria-selected={selected}
                tabIndex={selected || (hours === null && !pm) ? 0 : -1}
                disabled={disabled}
                onClick={() => emit(to24((hours ?? 0) % 12 || 12, pm), baseMinute)}
                sx={optionSx}
              >
                {label}
              </ButtonBase>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
