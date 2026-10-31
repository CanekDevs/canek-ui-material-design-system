import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { PointerEvent, Ref } from "react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import { CnButton } from "../CnButton";
import { getSafeUrl } from "../CnFileField/file-utils";
import { CnSegmentedField } from "../CnSegmentedField";
import { CnTextField } from "../CnTextField";

export type CnSignatureFieldProps = CnFieldBaseProps<string> & {
  /** Alto del área de firma en px. */
  height?: number;
  penColor?: string;
  penWidth?: number;
  /** Permite escribir el nombre como alternativa accesible a dibujar. */
  allowTyped?: boolean;
  /** Fuente para la firma escrita. */
  typedFont?: string;
};

type Point = { x: number; y: number };

/**
 * Firma autógrafa: se dibuja con mouse, dedo o lápiz (o se escribe, como
 * alternativa accesible). El valor es una imagen PNG en data URL; vacía = `""`.
 */
export const CnSignatureField = forwardRef<HTMLDivElement, CnSignatureFieldProps>(
  function CnSignatureField(
    {
      id,
      name,
      label,
      helperText,
      error,
      required,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      onBlur,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs,
      internalValidation,
      reserveHelperSpace,
      sx,
      className,
      height = 180,
      penColor = "#14213d",
      penWidth = 2.2,
      allowTyped = true,
      typedFont = "italic 36px 'Segoe Script', 'Brush Script MT', 'Lucida Handwriting', cursive",
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableValue<string>(value, defaultValue, "", onChange);
    const [mode, setMode] = useState<"draw" | "type">("draw");
    const [typed, setTyped] = useState("");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const strokesRef = useRef<Point[][]>([]);
    const drawingRef = useRef(false);
    const [strokeCount, setStrokeCount] = useState(0);
    const control = useFieldControl(current, {
      id,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs: debounceMs ?? 0,
      internalValidation,
      error,
      helperText,
      reserveHelperSpace,
    });
    const blocked = Boolean(disabled || readOnly);

    const context = () => canvasRef.current?.getContext("2d") ?? null;

    const resize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const { width } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.round(height * ratio);
      const ctx = context();
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }, [height]);

    const redraw = useCallback(() => {
      const ctx = context();
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of strokesRef.current) {
        ctx.beginPath();
        stroke.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else {
            // Curvas suaves entre puntos medios.
            const prev = stroke[index - 1];
            ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + point.x) / 2, (prev.y + point.y) / 2);
          }
        });
        if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
        ctx.stroke();
      }
    }, [penColor, penWidth]);

    useEffect(() => {
      resize();
      redraw();
      if (typeof ResizeObserver === "undefined" || !canvasRef.current) return;
      const observer = new ResizeObserver(() => {
        resize();
        redraw();
      });
      observer.observe(canvasRef.current);
      return () => observer.disconnect();
    }, [redraw, resize]);

    const exportImage = () => {
      const canvas = canvasRef.current;
      if (!canvas || strokesRef.current.length === 0) return "";
      try {
        return canvas.toDataURL("image/png");
      } catch {
        return "";
      }
    };

    const commit = (dataUrl: string) => {
      control.markChanged();
      setCurrent(dataUrl);
    };

    const pointFrom = (event: PointerEvent<HTMLCanvasElement>): Point => {
      const rect = event.currentTarget.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const clear = () => {
      strokesRef.current = [];
      setStrokeCount(0);
      setTyped("");
      redraw();
      commit("");
    };

    const undo = () => {
      strokesRef.current = strokesRef.current.slice(0, -1);
      setStrokeCount(strokesRef.current.length);
      redraw();
      commit(exportImage());
    };

    const renderTyped = (text: string) => {
      const canvas = canvasRef.current;
      const ctx = context();
      if (!canvas || !ctx) return "";
      const width = canvas.getBoundingClientRect().width || 400;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!text.trim()) return "";
      ctx.fillStyle = penColor;
      ctx.font = typedFont;
      ctx.textBaseline = "middle";
      ctx.fillText(text, 16, height / 2, width - 32);
      try {
        return canvas.toDataURL("image/png");
      } catch {
        return "";
      }
    };

    const existing =
      readOnly || (current && strokeCount === 0 && !typed) ? getSafeUrl(current) : undefined;

    return (
      <FormControl
        ref={ref as Ref<HTMLFieldSetElement>}
        component="fieldset"
        fullWidth
        error={control.error}
        disabled={disabled}
        required={required}
        className={className}
        data-cn-signature-field
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0, gap: "6px" }, sx)}
      >
        {label && (
          <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        {name && <input type="hidden" name={name} value={current} />}
        {allowTyped && !blocked && (
          <CnSegmentedField
            size="sm"
            value={mode}
            onChange={(next) => {
              setMode(next as "draw" | "type");
              clear();
            }}
            options={[
              { value: "draw", label: "Dibujar", icon: "edit" },
              { value: "type", label: "Escribir", icon: "text_fields" },
            ]}
          />
        )}
        {mode === "type" && !blocked && (
          <CnTextField
            label="Escribe tu nombre"
            value={typed}
            onChange={(text) => {
              setTyped(text);
              commit(renderTyped(text));
            }}
            autoComplete="name"
          />
        )}
        <Box
          sx={{
            position: "relative",
            height,
            borderRadius: "var(--cn-radius-md, 8px)",
            border: "1px dashed",
            borderColor: control.error
              ? "var(--cn-color-error-500, #d63c3c)"
              : "var(--cn-color-border-strong, #c5cad0)",
            backgroundColor: disabled
              ? "var(--cn-color-neutral-100, #f4f5f7)"
              : "var(--cn-color-surface, #ffffff)",
            overflow: "hidden",
          }}
        >
          <Box
            component="canvas"
            ref={canvasRef}
            id={control.id}
            role="img"
            aria-label={
              current
                ? "Firma capturada"
                : mode === "draw"
                  ? "Área para firmar con el mouse, dedo o lápiz"
                  : "Vista previa de la firma"
            }
            aria-describedby={control.helperText ? control.helperId : undefined}
            onPointerDown={(event: PointerEvent<HTMLCanvasElement>) => {
              if (blocked || mode !== "draw") return;
              event.preventDefault();
              event.currentTarget.setPointerCapture?.(event.pointerId);
              drawingRef.current = true;
              strokesRef.current = [...strokesRef.current, [pointFrom(event)]];
              redraw();
            }}
            onPointerMove={(event: PointerEvent<HTMLCanvasElement>) => {
              if (!drawingRef.current) return;
              strokesRef.current[strokesRef.current.length - 1].push(pointFrom(event));
              redraw();
            }}
            onPointerUp={() => {
              if (!drawingRef.current) return;
              drawingRef.current = false;
              setStrokeCount(strokesRef.current.length);
              commit(exportImage());
              control.markBlurred();
              onBlur?.();
            }}
            sx={{
              width: "100%",
              height: "100%",
              display: existing ? "none" : "block",
              touchAction: "none",
              cursor: blocked || mode !== "draw" ? "default" : "crosshair",
            }}
          />
          {existing && (
            <Box
              component="img"
              src={existing}
              alt="Firma"
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          )}
          {!current && mode === "draw" && !blocked && (
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 28,
                borderBottom: "1px solid var(--cn-color-neutral-300, #c5cad0)",
                pointerEvents: "none",
                fontSize: "var(--cn-font-size-xs, 11px)",
                color: "var(--cn-color-text-subtle, #9aa1aa)",
                pb: "2px",
              }}
            >
              ✕ Firma aquí
            </Box>
          )}
        </Box>
        {!blocked && (
          <Box sx={{ display: "flex", gap: "8px" }}>
            {mode === "draw" && (
              <CnButton
                size="small"
                variant="text"
                color="neutral"
                startIcon="undo"
                onClick={undo}
                disabled={strokeCount === 0}
              >
                Deshacer trazo
              </CnButton>
            )}
            <CnButton
              size="small"
              variant="text"
              color="error"
              startIcon="delete"
              onClick={clear}
              disabled={!current}
            >
              Limpiar
            </CnButton>
          </Box>
        )}
        {control.helperText && (
          <FormHelperText id={control.helperId} sx={helperTextSx}>
            {control.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);
