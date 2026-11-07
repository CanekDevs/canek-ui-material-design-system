import type { GridSize } from "@mui/material";
import {
  DEFAULT_PHONE_COUNTRIES,
  isValidNationalNumber,
  parsePhoneValue,
  PHONE_COUNTRIES,
} from "../../utils/phone-countries";
import { buildDateRangeRules } from "../CnDateField/CnDateField";
import { buildDateRangeValueRules } from "../CnDateField/CnDateRangeField";
import { COLOR_RULE } from "../CnColorField/CnColorField";
import { KEY_VALUE_RULE } from "../CnKeyValueField/CnKeyValueField";
import { buildMaskRules } from "../CnMaskedField/CnMaskedField";
import { NUMBER_RANGE_RULES } from "../CnNumberRangeField/CnNumberRangeField";
import { buildPasswordRule } from "../CnPasswordField/CnPasswordField";
import { MASK_PRESETS } from "../../utils/mask-utils";
import { getNestedValue, isDeepEqual, setNestedValue } from "./CnForm.helpers";
import type {
  CnFormCustomElement,
  CnFormDynamicValue,
  CnFormField,
  CnFormFieldOrCustom,
  CnFormGroup,
  CnFormProps,
  CnFormSection,
  CnFormSectionContext,
  CnFormStep,
  CnFormTab,
  CnFormValues,
  CnFormVariant,
  CnValidationRule,
} from "./CnForm.types";
import { combineRules, validateFieldValue } from "./CnForm.validation";

export type CnResolvedField = {
  field: CnFormField;
  /** Ruta completa del valor (`contacts.0.email`). */
  path: string;
  ctx?: CnFormSectionContext;
  /** Pestaña / paso al que pertenece (`root` en formularios simples). */
  groupId: string;
  sectionId?: string;
  visible: boolean;
};

export type CnLayoutGroup = CnFormGroup & { id: string };

export const isCustomElement = (item: CnFormFieldOrCustom): item is CnFormCustomElement =>
  item.type === "custom" && "component" in item && !("name" in item && item.name);

export const evaluate = <T>(
  value: CnFormDynamicValue<T> | undefined,
  formValues: CnFormValues,
  ctx?: CnFormSectionContext,
): T | undefined => {
  if (typeof value === "function") {
    return (value as (fv: CnFormValues, c?: CnFormSectionContext) => T)(formValues, ctx);
  }
  return value;
};

export const resolveVariant = (
  props: Pick<CnFormProps, "variant" | "steps" | "tabs" | "sections">,
): CnFormVariant => {
  if (props.variant) return props.variant;
  if (props.steps?.length) return "wizard";
  if (props.tabs?.length) return "tabbed";
  if (props.sections?.length) return "sectioned";
  return "simple";
};

/** Grupos de layout según la variante: raíz, pestañas o pasos. */
export const getLayoutGroups = (
  variant: CnFormVariant,
  props: Pick<CnFormProps, "fields" | "sections" | "tabs" | "steps">,
): CnLayoutGroup[] => {
  if (variant === "tabbed") return (props.tabs ?? []).map((tab) => ({ ...tab }));
  if (variant === "wizard") return (props.steps ?? []).map((step) => ({ ...step }));
  return [{ id: "root", fields: props.fields, sections: props.sections }];
};

export const getVisibleGroups = <T extends CnFormTab | CnFormStep>(
  groups: readonly T[] | undefined,
  values: CnFormValues,
): T[] => (groups ?? []).filter((group) => !group.visibleWhen || group.visibleWhen(values));

// ─── Dependencias entre campos ──────────────────────────────────────────

/**
 * Rutas absolutas de `dependsOn`. Dentro de una sección repetible las rutas
 * son relativas al elemento; con el prefijo `$.` se refieren a la raíz.
 */
export const resolveDependencyPaths = (
  dependsOn: readonly string[] | undefined,
  ctx?: CnFormSectionContext,
): string[] =>
  (dependsOn ?? []).map((dep) => {
    if (dep.startsWith("$.")) return dep.slice(2);
    return ctx ? `${ctx.sectionId}.${ctx.index}.${dep}` : dep;
  });

const pathTouches = (changed: string, dep: string) =>
  changed === dep || changed.startsWith(`${dep}.`) || dep.startsWith(`${changed}.`);

/**
 * Limpia en cascada los campos cuyo `dependsOn` incluye alguna de las rutas
 * modificadas. Devuelve los valores nuevos y las rutas que se limpiaron.
 */
export const applyDependencyResets = (
  values: CnFormValues,
  changedPaths: readonly string[],
  resolveFields: (values: CnFormValues) => CnResolvedField[],
): { values: CnFormValues; reset: string[] } => {
  let next = values;
  const reset: string[] = [];
  let pending = [...changedPaths];
  // Límite de seguridad ante dependencias circulares.
  for (let round = 0; round < 10 && pending.length > 0; round += 1) {
    const fresh: string[] = [];
    for (const item of resolveFields(next)) {
      const { field } = item;
      if (!field.dependsOn?.length || field.resetOnDependencyChange === false) continue;
      if (reset.includes(item.path) || changedPaths.includes(item.path)) continue;
      const deps = resolveDependencyPaths(field.dependsOn, item.ctx);
      if (!pending.some((changed) => deps.some((dep) => pathTouches(changed, dep)))) continue;
      const empty = getFieldDefault({ ...field, defaultValue: undefined }, next);
      next = setNestedValue(next, item.path, empty);
      reset.push(item.path);
      fresh.push(item.path);
    }
    pending = fresh;
  }
  return { values: next, reset };
};

// ─── Campos calculados ──────────────────────────────────────────────────

/**
 * Recalcula los campos con `compute`. Se repite unas pocas veces para que un
 * calculado pueda depender de otro (subtotal → total).
 */
export const applyComputedFields = (
  values: CnFormValues,
  resolveFields: (values: CnFormValues) => CnResolvedField[],
): { values: CnFormValues; changed: string[] } => {
  let next = values;
  const changed = new Set<string>();
  for (let round = 0; round < 5; round += 1) {
    let dirty = false;
    for (const item of resolveFields(next)) {
      if (!item.field.compute) continue;
      const ctx = item.ctx
        ? {
            ...item.ctx,
            item: getNestedValue(next, `${item.ctx.sectionId}.${item.ctx.index}`) as CnFormValues,
          }
        : undefined;
      let computed: unknown;
      try {
        computed = item.field.compute(next, ctx);
      } catch {
        continue;
      }
      if (isDeepEqual(getNestedValue(next, item.path), computed)) continue;
      next = setNestedValue(next, item.path, computed);
      changed.add(item.path);
      dirty = true;
    }
    if (!dirty) break;
  }
  return { values: next, changed: [...changed] };
};

// ─── Valores por defecto ────────────────────────────────────────────────

export const getFieldDefault = (field: CnFormField, values: CnFormValues): unknown => {
  if (typeof field.defaultValue === "function") {
    return (field.defaultValue as (fv: CnFormValues) => unknown)(values);
  }
  if (field.defaultValue !== undefined) return field.defaultValue;
  switch (field.type) {
    case "checkbox":
      return field.options ? [] : false;
    case "switch":
      return false;
    case "select":
      return field.multiple ? [] : "";
    case "autocomplete":
      return field.multiple ? [] : null;
    case "number":
    case "currency":
    case "rating":
      return null;
    case "slider":
      return evaluate(field.min, values) ?? 0;
    case "range":
      return [evaluate(field.min, values) ?? 0, evaluate(field.max, values) ?? 100];
    case "file":
      return [];
    case "daterange":
      return ["", ""];
    case "tags":
      return [];
    case "segmented":
      return field.multiple ? [] : "";
    case "country":
      return field.multiple ? [] : null;
    case "numberrange":
      return [null, null];
    case "choicecards":
      return field.multiple ? [] : "";
    case "transferlist":
      return [];
    case "treeselect":
      return field.multiple ? [] : null;
    case "keyvalue":
      return field.valueFormat === "object" ? {} : [];
    default:
      return "";
  }
};

const applyFieldDefaults = (
  fields: readonly CnFormFieldOrCustom[] | undefined,
  target: CnFormValues,
  values: CnFormValues,
): CnFormValues => {
  let result = target;
  for (const item of fields ?? []) {
    if (isCustomElement(item)) continue;
    if (getNestedValue(result, item.name) !== undefined) continue;
    result = setNestedValue(result, item.name, getFieldDefault(item, values));
  }
  return result;
};

export const buildSectionItem = (section: CnFormSection, values: CnFormValues): CnFormValues => {
  const base =
    typeof section.newItem === "function"
      ? section.newItem(values)
      : { ...(section.newItem ?? {}) };
  return applyFieldDefaults(section.fields, base, values);
};

export const getInitialItemCount = (section: CnFormSection): number => {
  if (section.initialItems !== undefined) {
    return Math.max(section.initialItems, section.minItems ?? 0);
  }
  return section.minItems === 0 ? 0 : Math.max(section.minItems ?? 1, 1);
};

const mergeDeep = (base: CnFormValues, override: CnFormValues): CnFormValues => {
  const result: CnFormValues = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    const bothObjects =
      value &&
      current &&
      typeof value === "object" &&
      typeof current === "object" &&
      !Array.isArray(value) &&
      !Array.isArray(current) &&
      !(value instanceof Date) &&
      !(typeof File !== "undefined" && value instanceof File);
    result[key] = bothObjects ? mergeDeep(current as CnFormValues, value as CnFormValues) : value;
  }
  return result;
};

/** Valores iniciales: defaults de todos los campos + `defaultValues` del consumidor. */
export const buildInitialValues = (
  groups: readonly CnLayoutGroup[],
  provided: CnFormValues = {},
): CnFormValues => {
  let defaults: CnFormValues = {};
  for (const group of groups) {
    defaults = applyFieldDefaults(group.fields, defaults, provided);
    for (const section of group.sections ?? []) {
      if (section.repeatable) {
        if (getNestedValue(defaults, section.id) === undefined) {
          const items = Array.from({ length: getInitialItemCount(section) }, () =>
            buildSectionItem(section, provided),
          );
          defaults = setNestedValue(defaults, section.id, items);
        }
      } else {
        defaults = applyFieldDefaults(section.fields, defaults, provided);
      }
    }
  }
  return mergeDeep(defaults, provided);
};

// ─── Resolución de campos ───────────────────────────────────────────────

const collectFromFields = (
  fields: readonly CnFormFieldOrCustom[] | undefined,
  values: CnFormValues,
  groupId: string,
  parentVisible: boolean,
  out: CnResolvedField[],
  section?: { id: string; ctx?: CnFormSectionContext; prefix?: string },
) => {
  for (const item of fields ?? []) {
    if (isCustomElement(item)) continue;
    const ctx = section?.ctx;
    const path = section?.prefix ? `${section.prefix}.${item.name}` : item.name;
    const visible = parentVisible && (!item.visibleWhen || item.visibleWhen(values, ctx));
    out.push({ field: item, path, ctx, groupId, sectionId: section?.id, visible });
  }
};

export const getSectionItems = (values: CnFormValues, sectionId: string): CnFormValues[] => {
  const raw = getNestedValue(values, sectionId);
  if (Array.isArray(raw)) return raw as CnFormValues[];
  if (raw && typeof raw === "object") return Object.values(raw) as CnFormValues[];
  return [];
};

export const collectGroupFields = (
  group: CnLayoutGroup,
  values: CnFormValues,
  groupVisible = true,
): CnResolvedField[] => {
  const out: CnResolvedField[] = [];
  collectFromFields(group.fields, values, group.id, groupVisible, out);
  for (const section of group.sections ?? []) {
    const sectionVisible = groupVisible && (!section.visibleWhen || section.visibleWhen(values));
    if (section.repeatable) {
      getSectionItems(values, section.id).forEach((item, index) => {
        collectFromFields(section.fields, values, group.id, sectionVisible, out, {
          id: section.id,
          prefix: `${section.id}.${index}`,
          ctx: { sectionId: section.id, index, item },
        });
      });
    } else {
      collectFromFields(section.fields, values, group.id, sectionVisible, out, { id: section.id });
    }
  }
  return out;
};

// ─── Reglas y validación ────────────────────────────────────────────────

/** Reglas declaradas + reglas implícitas que se derivan del tipo y sus props. */
export const getFieldRules = (
  resolved: CnResolvedField,
  values: CnFormValues,
): CnValidationRule[] => {
  const { field, ctx } = resolved;
  const required = Boolean(evaluate(field.required, values, ctx));
  const declared = evaluate(field.rules, values, ctx);
  const rules = [...(combineRules(required, declared) ?? [])];
  const has = (type: CnValidationRule["type"]) => rules.some((rule) => rule.type === type);

  // `tel` con selector de país se valida igual que `phone`.
  const kind = field.type === "tel" && field.showCountrySelect ? "phone" : field.type;
  switch (kind) {
    case "email":
      if (!has("email")) rules.push({ type: "email" });
      break;
    case "url":
      if (!has("url")) rules.push({ type: "url" });
      break;
    case "tel":
      if (!has("tel") && !has("phone")) {
        rules.push(
          field.defaultCountry
            ? { type: "tel", country: field.defaultCountry }
            : {
                type: "custom",
                message: "Teléfono no válido",
                validate: (v) => {
                  if (!v) return true;
                  const digits = String(v).replace(/\D/g, "");
                  return (
                    /^\+?[\d\s().-]+$/.test(String(v).trim()) &&
                    digits.length >= 7 &&
                    digits.length <= 15
                  );
                },
              },
        );
      }
      if (field.maxLength !== undefined && !has("maxLength")) {
        rules.push({ type: "maxLength", value: field.maxLength });
      }
      break;
    case "phone": {
      const preferred = field.defaultCountry ?? "MX";
      const allowed = field.countries ?? DEFAULT_PHONE_COUNTRIES;
      rules.push({
        type: "custom",
        message: () => {
          const raw = String(getNestedValue(values, resolved.path) ?? "");
          const country = PHONE_COUNTRIES[parsePhoneValue(raw, allowed, preferred).country];
          return `Número inválido para ${country.name}. Ejemplo: ${country.example}`;
        },
        validate: (v) => {
          if (!v) return true;
          const parsed = parsePhoneValue(String(v), allowed, preferred);
          return isValidNationalNumber(parsed.national, PHONE_COUNTRIES[parsed.country]);
        },
      });
      break;
    }
    case "date":
    case "time":
    case "datetime":
    case "month":
    case "year":
      rules.push(
        ...buildDateRangeRules({
          type: field.type as "date" | "time" | "datetime" | "month" | "year",
          min: evaluate(field.minDate, values, ctx),
          max: evaluate(field.maxDate, values, ctx),
          disablePast: field.disablePast,
          disableFuture: field.disableFuture,
          format: field.dateFormat,
          ampm: evaluate(field.ampm, values, ctx),
          minTime: evaluate(field.minTime, values, ctx),
          maxTime: evaluate(field.maxTime, values, ctx),
        }),
      );
      break;
    case "daterange": {
      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const min =
        evaluate(field.minDate, values, ctx) ?? (field.disablePast ? todayIso : undefined);
      const max =
        evaluate(field.maxDate, values, ctx) ?? (field.disableFuture ? todayIso : undefined);
      rules.push(...buildDateRangeValueRules({ required, maxDays: field.maxDays, min, max }));
      break;
    }
    case "number":
    case "currency": {
      const min = evaluate(field.min, values, ctx) ?? (field.type === "currency" ? 0 : undefined);
      const max = evaluate(field.max, values, ctx);
      if (min !== undefined && !has("min")) rules.push({ type: "min", value: min });
      if (max !== undefined && !has("max")) rules.push({ type: "max", value: max });
      break;
    }
    case "password":
      if (field.passwordRequirements) rules.push(buildPasswordRule(field.passwordRequirements));
      if (field.maxLength !== undefined && !has("maxLength")) {
        rules.push({ type: "maxLength", value: field.maxLength });
      }
      break;
    case "masked": {
      const preset = field.maskPreset ? MASK_PRESETS[field.maskPreset] : undefined;
      const mask = field.mask ?? preset?.mask;
      if (mask) rules.push(...buildMaskRules(mask, preset));
      break;
    }
    case "otp": {
      const length = field.otpLength ?? 6;
      rules.push({
        type: "custom",
        message: `Ingresa los ${length} caracteres`,
        validate: (v) => !v || String(v).length === length,
      });
      break;
    }
    case "color":
      rules.push(COLOR_RULE);
      break;
    case "numberrange":
      rules.push(...NUMBER_RANGE_RULES);
      if (required) {
        rules.push({
          type: "custom",
          message: "Indica el mínimo y el máximo",
          validate: (v) => Array.isArray(v) && v.every((n) => n !== null && n !== undefined),
        });
      }
      break;
    case "file":
      if (field.maxFiles !== undefined && !has("maxFiles")) {
        rules.push({ type: "maxFiles", value: field.maxFiles });
      }
      break;
    case "keyvalue":
      rules.push(KEY_VALUE_RULE);
      if (required) {
        rules.push({
          type: "custom",
          message: "Campo requerido",
          validate: (v) =>
            Array.isArray(v)
              ? v.some((pair) => String(pair?.key ?? "").trim())
              : Boolean(v && typeof v === "object" && Object.keys(v).length),
        });
      }
      break;
    case "transferlist": {
      const max = evaluate(field.max, values, ctx);
      if (max !== undefined && !has("maxItems")) rules.push({ type: "maxItems", value: max });
      break;
    }
    default:
      if (field.maxLength !== undefined && !has("maxLength")) {
        rules.push({ type: "maxLength", value: field.maxLength });
      }
  }
  return rules;
};

const DATE_TYPES = new Set(["date", "time", "datetime", "month", "year"]);
const pad = (n: number) => String(n).padStart(2, "0");
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Convierte lo que llega de una API (objetos `Date`, ISO con zona horaria,
 * `"2024-05-01 10:30:00"` de Laravel/MySQL) al valor ISO local que usan los
 * campos de fecha. Lo que no reconoce se devuelve como texto.
 */
export const normalizeDateValue = (
  raw: unknown,
  type: "date" | "time" | "datetime" | "month" | "year",
): string => {
  if (raw === null || raw === undefined || raw === "") return "";
  let date: Date | null = null;
  if (raw instanceof Date) date = raw;
  else if (typeof raw === "number") date = new Date(raw);
  else if (typeof raw === "string" && ISO_WITH_ZONE.test(raw)) date = new Date(raw);
  if (date) {
    if (Number.isNaN(date.getTime())) return "";
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    if (type === "date") return day;
    if (type === "month") return day.slice(0, 7);
    if (type === "year") return day.slice(0, 4);
    if (type === "time") return time;
    return `${day}T${time}`;
  }
  const text = String(raw).trim();
  if (type === "date" && /^\d{4}-\d{2}-\d{2}[T ]/.test(text)) return text.slice(0, 10);
  if (type === "month" && /^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 7);
  if (type === "year" && /^\d{4}-\d{2}/.test(text)) return text.slice(0, 4);
  if (type === "datetime" && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(text)) {
    return text.replace(" ", "T").slice(0, 16);
  }
  if (type === "datetime" && /^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00`;
  if (type === "time" && /^\d{2}:\d{2}:\d{2}/.test(text)) return text.slice(0, 5);
  return text;
};

/** Valor ISO local → `Date` (o `null` si está vacío o incompleto). */
export const isoToDate = (
  iso: string,
  type: "date" | "time" | "datetime" | "month" | "year",
): Date | null => {
  if (!iso) return null;
  if (type === "year") return /^\d{4}$/.test(iso) ? new Date(Number(iso), 0, 1) : null;
  const match =
    /^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?$/.exec(iso) ??
    (type === "time" ? /^()()()(\d{2}):(\d{2})$/.exec(iso) : null);
  if (!match) return null;
  const now = new Date();
  const year = match[1] ? Number(match[1]) : now.getFullYear();
  const month = match[2] ? Number(match[2]) - 1 : now.getMonth();
  const day = match[3] ? Number(match[3]) : type === "month" ? 1 : now.getDate();
  const date = new Date(year, month, day, Number(match[4] ?? 0), Number(match[5] ?? 0));
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Valor del campo como lo validan las reglas (fechas normalizadas a ISO local). */
export const getComparableValue = (field: CnFormField, value: unknown): unknown => {
  if (DATE_TYPES.has(field.type)) {
    return normalizeDateValue(value, field.type as "date" | "time" | "datetime" | "month" | "year");
  }
  if (field.type === "daterange" && Array.isArray(value)) {
    return value.map((item) => normalizeDateValue(item, "date"));
  }
  return value;
};

export const validateResolvedField = (resolved: CnResolvedField, values: CnFormValues): string => {
  if (!resolved.visible) return "";
  const value = getComparableValue(resolved.field, getNestedValue(values, resolved.path));
  return validateFieldValue(value, getFieldRules(resolved, values), values, resolved.ctx);
};

export const validateResolvedFields = (
  fields: readonly CnResolvedField[],
  values: CnFormValues,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const resolved of fields) {
    const message = validateResolvedField(resolved, values);
    if (message) errors[resolved.path] = message;
  }
  return errors;
};

// ─── Layout ─────────────────────────────────────────────────────────────

const WIDE_TYPES = new Set([
  "choicecards",
  "transferlist",
  "keyvalue",
  "textarea",
  "file",
  "custom",
  "radio",
  "slider",
  "range",
  "daterange",
  "richtext",
  "signature",
  "tags",
  "numberrange",
]);

export const getDefaultGrid = (
  field: CnFormField,
  columns: number,
): { xs: GridSize; sm?: GridSize; md: GridSize; lg?: GridSize; xl?: GridSize } => {
  const isWide =
    WIDE_TYPES.has(field.type) || (field.type === "checkbox" && Array.isArray(field.options));
  const span = isWide ? 12 : Math.max(1, Math.round(12 / Math.max(1, Math.min(4, columns))));
  return {
    xs: field.xs ?? 12,
    sm: field.sm ?? (columns > 2 && !isWide ? 6 : undefined),
    md: field.md ?? span,
    lg: field.lg,
    xl: field.xl,
  };
};

/** Primer error en el orden en que aparecen los campos. */
export const getFirstErrorPath = (
  fields: readonly CnResolvedField[],
  errors: Record<string, string>,
): string | undefined =>
  fields.find((resolved) => errors[resolved.path])?.path ?? Object.keys(errors)[0];
