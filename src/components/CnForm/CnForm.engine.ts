import type { GridSize } from "@mui/material";
import {
  DEFAULT_PHONE_COUNTRIES,
  isValidNationalNumber,
  parsePhoneValue,
  PHONE_COUNTRIES,
} from "../../utils/phone-countries";
import { buildDateRangeRules } from "../CnDateField/CnDateField";
import { buildDateRangeValueRules } from "../CnDateField/CnDateRangeField";
import { getNestedValue, setNestedValue } from "./CnForm.helpers";
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

export const getInitialItemCount = (section: CnFormSection): number =>
  Math.max(section.minItems ?? 0, 1);

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

  switch (field.type) {
    case "email":
      if (!has("email")) rules.push({ type: "email" });
      break;
    case "url":
      if (!has("url")) rules.push({ type: "url" });
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
      rules.push(
        ...buildDateRangeRules({
          type: field.type,
          min: evaluate(field.minDate, values, ctx),
          max: evaluate(field.maxDate, values, ctx),
          disablePast: field.disablePast,
          disableFuture: field.disableFuture,
          format: field.dateFormat,
          ampm: field.ampm,
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
    case "file":
      if (field.maxFiles !== undefined && !has("maxFiles")) {
        rules.push({ type: "maxFiles", value: field.maxFiles });
      }
      break;
    default:
      if (field.maxLength !== undefined && !has("maxLength")) {
        rules.push({ type: "maxLength", value: field.maxLength });
      }
  }
  return rules;
};

export const validateResolvedField = (resolved: CnResolvedField, values: CnFormValues): string => {
  if (!resolved.visible) return "";
  const value = getNestedValue(values, resolved.path);
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
  "textarea",
  "file",
  "custom",
  "radio",
  "slider",
  "range",
  "daterange",
  "richtext",
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
