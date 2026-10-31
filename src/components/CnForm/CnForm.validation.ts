import { useCallback, useEffect, useRef, useState } from "react";
import {
  isValidNationalNumber,
  onlyDigits,
  parsePhoneValue,
  PHONE_COUNTRIES,
} from "../../utils/phone-countries";
import type {
  CnFormDynamicMessage,
  CnFormDynamicValue,
  CnFormSectionContext,
  CnPhoneCountryCode,
  CnValidationRule,
} from "./CnForm.types";

export type ValidatorFn = (
  value: unknown,
  rule: CnValidationRule,
  formValues: Record<string, unknown>,
  ctx?: CnFormSectionContext,
) => string | null;

const resolveMessage = (
  message: CnFormDynamicMessage | undefined,
  formValues: Record<string, unknown>,
  ctx?: CnFormSectionContext,
): string | undefined => {
  if (message === undefined) return undefined;
  if (typeof message === "function") return message(formValues, ctx);
  return message;
};

const resolveDynamicValue = <T>(
  value: CnFormDynamicValue<T> | undefined,
  formValues: Record<string, unknown>,
  ctx?: CnFormSectionContext,
): T | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "function") {
    return (value as (fv: Record<string, unknown>, c?: CnFormSectionContext) => T)(formValues, ctx);
  }
  return value;
};

export const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "") ||
  value === false ||
  (typeof value === "number" && Number.isNaN(value)) ||
  (Array.isArray(value) && value.length === 0);

const EMPTY_FORM_VALUES: Record<string, unknown> = Object.freeze({}) as Record<string, unknown>;

/** Parsea una fecha estricta (rechaza 2024-02-30) en hora local. */
export const parseDateInput = (raw: string, format: string = "YYYY-MM-DD"): Date | null => {
  const value = raw.trim();
  let year: number;
  let month: number;
  let day: number;
  if (format === "DD/MM/YYYY" || format === "MM/DD/YYYY") {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (!match) return null;
    const first = Number(match[1]);
    const second = Number(match[2]);
    year = Number(match[3]);
    day = format === "DD/MM/YYYY" ? first : second;
    month = format === "DD/MM/YYYY" ? second : first;
  } else {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(value);
    if (!match) return null;
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
};

const toDateBoundary = (
  bound: string | ((formValues: Record<string, unknown>) => string) | undefined,
  formValues: Record<string, unknown>,
): Date | null => {
  if (!bound) return null;
  const raw = typeof bound === "function" ? bound(formValues) : bound;
  if (!raw) return null;
  return parseDateInput(raw, "YYYY-MM-DD");
};

const formatDateEs = (date: Date): string =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

const cleanNumber = (value: string): string => value.replace(/\D/g, "");
const cleanSpaces = (value: string): string => value.replace(/\s/g, "");

const isAlphanumericWithAccents = (str: string): boolean => /^[\p{L}\p{N}\s]+$/u.test(str);
const isAlphabeticWithAccents = (str: string): boolean => /^[\p{L}\s]+$/u.test(str);

const getNestedFieldValue = (obj: Record<string, unknown>, path: string): unknown => {
  if (!path) return undefined;
  if (!path.includes(".")) return obj[path];
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
};

const baseValidators: Record<string, ValidatorFn> = {
  required: (value, rule, formValues, ctx) => {
    if (isEmptyValue(value)) {
      return resolveMessage(rule.message, formValues, ctx) ?? "Campo requerido";
    }
    return null;
  },

  email: (value, rule, formValues) => {
    if (value && typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return resolveMessage(rule.message, formValues) ?? "Email inválido";
    }
    return null;
  },

  url: (value, rule, formValues) => {
    if (value && typeof value === "string") {
      const regex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([/#?]?.*)$/i;
      if (!regex.test(value)) {
        return resolveMessage(rule.message, formValues) ?? "URL inválida";
      }
    }
    return null;
  },

  minLength: (value, rule, formValues) => {
    if (rule.type !== "minLength") return null;
    if (value && typeof value === "string" && value.length < rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Mínimo ${rule.value} caracteres`;
    }
    return null;
  },

  maxLength: (value, rule, formValues) => {
    if (rule.type !== "maxLength") return null;
    if (value && typeof value === "string" && value.length > rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Máximo ${rule.value} caracteres`;
    }
    return null;
  },

  exactLength: (value, rule, formValues) => {
    if (rule.type !== "exactLength") return null;
    if (value && typeof value === "string" && value.length !== rule.value) {
      return (
        resolveMessage(rule.message, formValues) ??
        `Debe tener exactamente ${rule.value} caracteres`
      );
    }
    return null;
  },

  min: (value, rule, formValues) => {
    if (rule.type !== "min") return null;
    if (value !== "" && value !== null && value !== undefined && Number(value) < rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Mínimo ${rule.value}`;
    }
    return null;
  },

  max: (value, rule, formValues) => {
    if (rule.type !== "max") return null;
    if (value !== "" && value !== null && value !== undefined && Number(value) > rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Máximo ${rule.value}`;
    }
    return null;
  },

  between: (value, rule, formValues) => {
    if (rule.type !== "between") return null;
    if (value === "" || value === null || value === undefined) return null;
    const num = Number(value);
    if (num < rule.min) {
      return resolveMessage(rule.message, formValues) ?? `Debe ser mayor o igual a ${rule.min}`;
    }
    if (num > rule.max) {
      return resolveMessage(rule.message, formValues) ?? `Debe ser menor o igual a ${rule.max}`;
    }
    return null;
  },

  numeric: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "number") return null;
    if (Number.isNaN(Number(value))) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser numérico";
    }
    return null;
  },

  integer: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(num)) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser un número entero";
    }
    return null;
  },

  positive: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    if (Number(value) <= 0) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser mayor a 0";
    }
    return null;
  },

  negative: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    if (Number(value) >= 0) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser menor a 0";
    }
    return null;
  },

  pattern: (value, rule, formValues) => {
    if (rule.type !== "pattern") return null;
    if (value && typeof value === "string" && !rule.value.test(value)) {
      return resolveMessage(rule.message, formValues) ?? "Formato inválido";
    }
    return null;
  },

  equalTo: (value, rule, formValues) => {
    if (rule.type !== "equalTo") return null;
    const other = getNestedFieldValue(formValues, rule.field);
    if (value !== other) {
      return resolveMessage(rule.message, formValues) ?? "Los valores no coinciden";
    }
    return null;
  },

  notEqualTo: (value, rule, formValues) => {
    if (rule.type !== "notEqualTo") return null;
    const other = getNestedFieldValue(formValues, rule.field);
    if (value === other) {
      return resolveMessage(rule.message, formValues) ?? `No puede ser igual a ${rule.field}`;
    }
    return null;
  },

  passwordStrength: (value, rule, formValues) => {
    if (rule.type !== "passwordStrength") return null;
    if (!value || typeof value !== "string") return null;
    const level = rule.level ?? "medium";
    let score = 0;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    const required = level === "weak" ? 3 : level === "medium" ? 4 : 5;
    if (score < required) {
      const missing: string[] = [];
      if (value.length < 8) missing.push("mínimo 8 caracteres");
      if (!/[A-Z]/.test(value)) missing.push("una mayúscula");
      if (!/[a-z]/.test(value)) missing.push("una minúscula");
      if (!/[0-9]/.test(value)) missing.push("un número");
      if (!/[^a-zA-Z0-9]/.test(value)) missing.push("un carácter especial");
      return (
        resolveMessage(rule.message, formValues) ??
        `Contraseña débil. Requiere: ${missing.join(", ")}`
      );
    }
    return null;
  },

  custom: (value, rule, formValues, ctx) => {
    if (rule.type !== "custom") return null;
    const isValid = rule.validate(value, formValues, ctx);
    if (!isValid) {
      return resolveMessage(rule.message, formValues, ctx) ?? "Validación fallida";
    }
    return null;
  },

  alphanumeric: (value, rule, formValues) => {
    if (value && !isAlphanumericWithAccents(value.toString())) {
      return (
        resolveMessage(rule.message, formValues) ??
        "Solo se permiten letras (incluyendo acentos), números y espacios"
      );
    }
    return null;
  },

  alphabetic: (value, rule, formValues) => {
    if (value && !isAlphabeticWithAccents(value.toString())) {
      return (
        resolveMessage(rule.message, formValues) ??
        "Solo se permiten letras (incluyendo acentos) y espacios"
      );
    }
    return null;
  },

  uppercase: (value, rule, formValues) => {
    if (value) {
      const str = value.toString();
      if (str !== str.toLocaleUpperCase()) {
        return resolveMessage(rule.message, formValues) ?? "Debe estar en mayúsculas";
      }
    }
    return null;
  },

  lowercase: (value, rule, formValues) => {
    if (value) {
      const str = value.toString();
      if (str !== str.toLocaleLowerCase()) {
        return resolveMessage(rule.message, formValues) ?? "Debe estar en minúsculas";
      }
    }
    return null;
  },

  noSpaces: (value, rule, formValues) => {
    if (value && /\s/.test(value.toString())) {
      return resolveMessage(rule.message, formValues) ?? "No debe contener espacios";
    }
    return null;
  },

  tel: (value, rule, formValues, ctx) => {
    if (!value) return null;
    const requested =
      (rule.type === "tel" || rule.type === "phone"
        ? resolveDynamicValue(rule.country, formValues, ctx)
        : undefined) ?? "MX";
    const raw = value.toString();
    const known = PHONE_COUNTRIES[requested as CnPhoneCountryCode];
    if (!known) {
      const cleaned = cleanNumber(raw);
      if (cleaned.length < 8 || cleaned.length > 15) {
        return resolveMessage(rule.message, formValues, ctx) ?? "Teléfono no válido";
      }
      return null;
    }
    // Acepta número nacional ("55 1234 5678") o E.164 ("+525512345678").
    const parsed = raw.trim().startsWith("+")
      ? parsePhoneValue(raw, [known.code], known.code)
      : { country: known.code, national: onlyDigits(raw) };
    const country = PHONE_COUNTRIES[parsed.country];
    if (!isValidNationalNumber(parsed.national, country)) {
      return (
        resolveMessage(rule.message, formValues, ctx) ??
        `Teléfono inválido para ${country.name}. Ejemplo: ${country.example}`
      );
    }
    return null;
  },

  phone: (value, rule, formValues, ctx) => baseValidators.tel(value, rule, formValues, ctx),

  whatsapp: (value, rule, formValues) => {
    if (value) {
      const cleaned = cleanNumber(value.toString());
      if (cleaned.length < 10 || cleaned.length > 15) {
        return resolveMessage(rule.message, formValues) ?? "Número de WhatsApp no válido";
      }
    }
    return null;
  },

  rfc: (value, rule, formValues, ctx) => {
    if (!value) return null;
    const cleaned = value.toString().toUpperCase().replace(/\s/g, "");
    const personType = resolveDynamicValue(
      rule.type === "rfc" ? rule.personType : undefined,
      formValues,
      ctx,
    );
    let isValid = false;
    if (personType === "moral") {
      isValid = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/.test(cleaned);
    } else if (personType === "fisica") {
      isValid = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/.test(cleaned);
    } else {
      isValid = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(cleaned);
    }
    if (!isValid) {
      return resolveMessage(rule.message, formValues, ctx) ?? "RFC inválido";
    }
    return null;
  },

  curp: (value, rule, formValues) => {
    if (value) {
      const cleaned = value.toString().toUpperCase().replace(/\s/g, "");
      if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(cleaned)) {
        return (
          resolveMessage(rule.message, formValues) ??
          "CURP no válido. Debe tener 18 caracteres alfanuméricos"
        );
      }
    }
    return null;
  },

  ine: (value, rule, formValues) => {
    if (value) {
      const cleaned = value.toString().toUpperCase().replace(/\s/g, "");
      if (!/^[A-Z]{6}\d{8}[A-Z0-9]{2}\d{2}$/.test(cleaned)) {
        return resolveMessage(rule.message, formValues) ?? "Clave INE no válida";
      }
    }
    return null;
  },

  nss: (value, rule, formValues) => {
    if (!value) return null;
    const cleaned = cleanNumber(value.toString());
    if (!/^\d{11}$/.test(cleaned)) {
      return (
        resolveMessage(rule.message, formValues) ??
        "NSS no válido. Debe tener 11 dígitos (ejemplo: 01088606536)"
      );
    }
    if (/^0+$/.test(cleaned)) {
      return resolveMessage(rule.message, formValues) ?? "NSS no válido. No puede ser solo ceros";
    }
    return null;
  },

  nssOrSsn: (value, rule, formValues, ctx) => {
    if (!value) return null;
    const cleaned = cleanNumber(value.toString());
    if (cleaned.length === 11) {
      const err = baseValidators.nss(value, rule, formValues, ctx);
      if (!err) return null;
    }
    if (cleaned.length === 9) {
      const err = baseValidators.ssn(value, rule, formValues, ctx);
      if (!err) return null;
    }
    return (
      resolveMessage(rule.message, formValues, ctx) ??
      "El número de seguridad social debe tener 9 dígitos (SSN) o 11 dígitos (NSS)"
    );
  },

  cpf: (value, rule, formValues) => {
    if (!value) return null;
    const cleaned = cleanNumber(value.toString());
    if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
      return resolveMessage(rule.message, formValues) ?? "CPF no válido";
    }
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number.parseInt(cleaned.charAt(i)) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== Number.parseInt(cleaned.charAt(9))) {
      return resolveMessage(rule.message, formValues) ?? "CPF no válido";
    }
    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number.parseInt(cleaned.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== Number.parseInt(cleaned.charAt(10))) {
      return resolveMessage(rule.message, formValues) ?? "CPF no válido";
    }
    return null;
  },

  cnpj: (value, rule, formValues) => {
    if (!value) return null;
    const cleaned = cleanNumber(value.toString());
    if (cleaned.length !== 14 || /^(\d)\1{13}$/.test(cleaned)) {
      return resolveMessage(rule.message, formValues) ?? "CNPJ no válido";
    }
    return null;
  },

  nif: (value, rule, formValues) => {
    if (!value) return null;
    const cleaned = value.toString().toUpperCase();
    if (!/^\d{8}[A-Z]$/.test(cleaned)) {
      return resolveMessage(rule.message, formValues) ?? "NIF no válido";
    }
    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const number = Number.parseInt(cleaned.slice(0, 8));
    if (cleaned[8] !== letters[number % 23]) {
      return resolveMessage(rule.message, formValues) ?? "NIF no válido";
    }
    return null;
  },

  nie: (value, rule, formValues) => {
    if (value && !/^[XYZ]\d{7}[A-Z]$/i.test(value.toString())) {
      return resolveMessage(rule.message, formValues) ?? "NIE no válido";
    }
    return null;
  },

  ssn: (value, rule, formValues) => {
    if (value && !/^\d{3}-\d{2}-\d{4}$/.test(value.toString())) {
      return resolveMessage(rule.message, formValues) ?? "SSN no válido (Formato: XXX-XX-XXXX)";
    }
    return null;
  },

  ein: (value, rule, formValues) => {
    if (value && !/^\d{2}-\d{7}$/.test(value.toString())) {
      return resolveMessage(rule.message, formValues) ?? "EIN no válido (Formato: XX-XXXXXXX)";
    }
    return null;
  },

  passport: (value, rule, formValues) => {
    if (value && !/^[A-Z0-9]{6,12}$/i.test(value.toString())) {
      return resolveMessage(rule.message, formValues) ?? "Número de pasaporte no válido";
    }
    return null;
  },

  licensePlate: (value, rule, formValues, ctx) => {
    if (!value) return null;
    const country =
      (rule.type === "licensePlate"
        ? resolveDynamicValue(rule.country, formValues, ctx)
        : undefined) ?? "MX";
    const patterns: Record<string, RegExp> = {
      MX: /^[A-Z]{3}-\d{3}$|^[A-Z]{2}\d{2}[A-Z]{2}$/,
      US: /^[A-Z0-9]{2,8}$/,
      ES: /^\d{4}[A-Z]{3}$/,
      AR: /^[A-Z]{3}\d{3}$/,
    };
    const pattern = patterns[country] ?? /^[A-Z0-9]{3,8}$/i;
    if (!pattern.test(value.toString().toUpperCase())) {
      return resolveMessage(rule.message, formValues, ctx) ?? "Placa no válida";
    }
    return null;
  },

  postalCode: (value, rule, formValues, ctx) => {
    if (!value) return null;
    const cleaned = cleanSpaces(value.toString());
    const format =
      (rule.type === "postalCode"
        ? resolveDynamicValue(rule.format, formValues, ctx)
        : undefined) ?? "mx";
    const patterns: Record<string, RegExp> = {
      mx: /^\d{5}$/,
      us: /^\d{5}(-\d{4})?$/,
      es: /^\d{5}$/,
      ar: /^\d{4}$/,
      co: /^\d{6}$/,
      cl: /^\d{7}$/,
      br: /^\d{5}-\d{3}$|^\d{8}$/,
      uk: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
      ca: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
      de: /^\d{5}$/,
      fr: /^\d{5}$/,
      it: /^\d{5}$/,
      pt: /^\d{4}-\d{3}$|^\d{7}$/,
      intl: /^[A-Z0-9]{3,10}$/i,
    };
    const pattern = patterns[format] ?? patterns.intl;
    if (!pattern.test(cleaned)) {
      return resolveMessage(rule.message, formValues, ctx) ?? "Código postal no válido";
    }
    return null;
  },

  creditCard: (value, rule, formValues) => {
    if (!value) return null;
    const cleaned = cleanNumber(value.toString());
    if (cleaned.length < 13 || cleaned.length > 19) {
      return resolveMessage(rule.message, formValues) ?? "Número de tarjeta no válido";
    }
    let sum = 0;
    let alternate = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let n = Number.parseInt(cleaned.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    if (sum % 10 !== 0) {
      return resolveMessage(rule.message, formValues) ?? "Número de tarjeta no válido";
    }
    return null;
  },

  creditCardExpiry: (value, rule, formValues) => {
    if (!value) return null;
    const regex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
    if (!regex.test(value.toString())) {
      return resolveMessage(rule.message, formValues) ?? "Fecha de expiración inválida (MM/AA)";
    }
    const parts = value.toString().match(regex);
    if (!parts) return null;
    const month = Number.parseInt(parts[1], 10);
    const year = Number.parseInt(parts[2], 10);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return resolveMessage(rule.message, formValues) ?? "La tarjeta ha expirado";
    }
    return null;
  },

  creditCardCVV: (value, rule, formValues) => {
    if (value && !/^\d{3,4}$/.test(value.toString())) {
      return resolveMessage(rule.message, formValues) ?? "CVV no válido (3 o 4 dígitos)";
    }
    return null;
  },

  date: (value, rule, formValues, ctx) => {
    if (!value) return null;
    const format =
      (rule.type === "date" ? resolveDynamicValue(rule.format, formValues, ctx) : undefined) ??
      "YYYY-MM-DD";
    const date = parseDateInput(value.toString(), format);
    if (!date) {
      return (
        resolveMessage(rule.message, formValues, ctx) ?? `Fecha no válida (Formato: ${format})`
      );
    }
    if (rule.type !== "date") return null;
    const minDate = toDateBoundary(rule.minDate, formValues);
    if (minDate && date < minDate) {
      return (
        resolveMessage(rule.message, formValues, ctx) ??
        `La fecha debe ser igual o posterior al ${formatDateEs(minDate)}`
      );
    }
    const maxDate = toDateBoundary(rule.maxDate, formValues);
    if (maxDate && date > maxDate) {
      return (
        resolveMessage(rule.message, formValues, ctx) ??
        `La fecha debe ser igual o anterior al ${formatDateEs(maxDate)}`
      );
    }
    return null;
  },

  time: (value, rule, formValues, ctx) => {
    if (!value) return null;
    const format =
      (rule.type === "time" ? resolveDynamicValue(rule.format, formValues, ctx) : undefined) ??
      "24h";
    const pattern24h = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const pattern12h = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    const valid =
      format === "12h" ? pattern12h.test(value.toString()) : pattern24h.test(value.toString());
    if (!valid) {
      return (
        resolveMessage(rule.message, formValues, ctx) ??
        `Hora no válida (Formato: ${format === "12h" ? "HH:MM AM/PM" : "HH:MM"})`
      );
    }
    return null;
  },

  datetime: (value, rule, formValues) => {
    if (value) {
      const date = new Date(value.toString());
      if (Number.isNaN(date.getTime())) {
        return resolveMessage(rule.message, formValues) ?? "Fecha y hora no válida";
      }
    }
    return null;
  },

  decimal: (value, rule, formValues) => {
    if (value === "" || value === null || value === undefined) return null;
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) {
      return resolveMessage(rule.message, formValues) ?? "Debe ser un número decimal";
    }
    const decimals = rule.type === "decimal" ? (rule.decimals ?? 2) : 2;
    const regex = new RegExp(`^-?\\d+(\\.\\d{1,${decimals}})?$`);
    if (!regex.test(String(num))) {
      return resolveMessage(rule.message, formValues) ?? `Debe tener máximo ${decimals} decimales`;
    }
    return null;
  },

  domain: (value, rule, formValues) => {
    if (value && !/^([\w-]+\.)+[\w-]+$/i.test(value.toString())) {
      return resolveMessage(rule.message, formValues) ?? "Dominio no válido (ej: ejemplo.com)";
    }
    return null;
  },

  ip: (value, rule, formValues) => {
    if (!value) return null;
    const version = rule.type === "ip" ? (rule.version ?? "both") : "both";
    const ipv4 = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
    const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    let valid = false;
    if (version === "ipv4") valid = ipv4.test(value.toString());
    else if (version === "ipv6") valid = ipv6.test(value.toString());
    else valid = ipv4.test(value.toString()) || ipv6.test(value.toString());
    if (!valid) {
      return (
        resolveMessage(rule.message, formValues) ??
        `IP no válida (${version === "both" ? "IPv4 o IPv6" : version.toUpperCase()})`
      );
    }
    return null;
  },

  minItems: (value, rule, formValues) => {
    if (rule.type !== "minItems") return null;
    if (Array.isArray(value) && value.length < rule.value) {
      return (
        resolveMessage(rule.message, formValues) ??
        `Selecciona al menos ${rule.value} ${rule.value === 1 ? "elemento" : "elementos"}`
      );
    }
    return null;
  },

  maxItems: (value, rule, formValues) => {
    if (rule.type !== "maxItems") return null;
    if (Array.isArray(value) && value.length > rule.value) {
      return (
        resolveMessage(rule.message, formValues) ??
        `Selecciona como máximo ${rule.value} ${rule.value === 1 ? "elemento" : "elementos"}`
      );
    }
    return null;
  },

  maxFiles: (value, rule, formValues) => {
    if (rule.type !== "maxFiles") return null;
    if (Array.isArray(value) && value.length > rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Máximo ${rule.value} archivos`;
    }
    return null;
  },

  minFiles: (value, rule, formValues) => {
    if (rule.type !== "minFiles") return null;
    if (Array.isArray(value) && value.length < rule.value) {
      return resolveMessage(rule.message, formValues) ?? `Mínimo ${rule.value} archivo(s)`;
    }
    return null;
  },

  maxSize: (value, rule, formValues) => {
    if (rule.type !== "maxSize") return null;
    if (
      Array.isArray(value) &&
      value.some(
        (f) =>
          (f as { size?: number }).size !== undefined &&
          (f as { size: number }).size > rule.value * 1024 * 1024,
      )
    ) {
      return resolveMessage(rule.message, formValues) ?? `Archivo excede ${rule.value}MB`;
    }
    return null;
  },

  fileType: (value, rule, formValues) => {
    if (rule.type !== "fileType") return null;
    if (Array.isArray(value) && value.length > 0) {
      const invalid = value.filter((file) => {
        const f = file as { type?: string; name?: string };
        return !rule.types.some((t) => f.type?.includes(t) || f.name?.endsWith(t));
      });
      if (invalid.length > 0) {
        return (
          resolveMessage(rule.message, formValues) ??
          `Tipo de archivo no permitido. Permitidos: ${rule.types.join(", ")}`
        );
      }
    }
    return null;
  },
};

const customValidators: Record<string, ValidatorFn> = {};

export const registerValidator = (type: string, fn: ValidatorFn): void => {
  customValidators[type] = fn;
};

export const validateFieldValue = (
  value: unknown,
  rules: CnValidationRule[] | undefined,
  formValues: Record<string, unknown> = {},
  ctx?: CnFormSectionContext,
): string => {
  if (!rules || rules.length === 0) return "";
  for (const rule of rules) {
    const validator = customValidators[rule.type] ?? baseValidators[rule.type];
    if (!validator) continue;
    const error = validator(value, rule, formValues, ctx);
    if (error) return error;
  }
  return "";
};

export const combineRules = (
  required: boolean | undefined,
  rules: CnValidationRule[] | undefined,
): CnValidationRule[] | undefined => {
  const result: CnValidationRule[] = [];
  if (required) {
    const already = rules?.some((rule) => rule.type === "required") ?? false;
    if (!already) result.push({ type: "required", message: "Campo requerido" });
  }
  if (rules && rules.length > 0) result.push(...rules);
  return result.length > 0 ? result : undefined;
};

export type UseFieldValidationOptions = {
  sectionContext?: CnFormSectionContext;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
};

export type UseFieldValidationReturn = {
  error: string;
  hasError: boolean;
  hasInteracted: boolean;
  validate: () => string;
  handleBlur: () => void;
  handleChange: () => void;
  reset: () => void;
};

export const useFieldValidation = (
  value: unknown,
  rules: CnValidationRule[] | undefined,
  formValues: Record<string, unknown> = EMPTY_FORM_VALUES,
  options: UseFieldValidationOptions = {},
): UseFieldValidationReturn => {
  const {
    sectionContext,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 400,
  } = options;
  const [error, setError] = useState<string>("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Las reglas y el contexto suelen declararse inline: se leen desde un ref para
  // no reiniciar el debounce en cada render del padre.
  const latestRef = useRef({ value, rules, formValues, sectionContext });
  latestRef.current = { value, rules, formValues, sectionContext };

  const validate = useCallback((): string => {
    const current = latestRef.current;
    const result = validateFieldValue(
      current.value,
      current.rules,
      current.formValues,
      current.sectionContext,
    );
    setError(result);
    return result;
  }, []);

  useEffect(() => {
    if (!validateOnChange || !hasInteracted) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(validate, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, formValues, validate, validateOnChange, hasInteracted, debounceMs]);

  const handleBlur = useCallback(() => {
    setHasInteracted(true);
    if (validateOnBlur) validate();
  }, [validate, validateOnBlur]);

  const handleChange = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHasInteracted(false);
    setError("");
  }, []);

  return {
    error,
    hasError: Boolean(error),
    hasInteracted,
    validate,
    handleBlur,
    handleChange,
    reset,
  };
};
