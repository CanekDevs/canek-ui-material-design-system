import type { CnPhoneCountryCode } from "../components/CnForm/CnForm.types";

export type CnPhoneCountry = {
  code: CnPhoneCountryCode;
  name: string;
  dialCode: string;
  /** Dígitos del número nacional (sin código de país). */
  minLength: number;
  maxLength: number;
  /** Máscara de visualización: `#` = dígito. */
  mask?: string;
  example: string;
};

export const PHONE_COUNTRIES: Record<CnPhoneCountryCode, CnPhoneCountry> = {
  MX: {
    code: "MX",
    name: "México",
    dialCode: "+52",
    minLength: 10,
    maxLength: 10,
    mask: "## #### ####",
    example: "55 1234 5678",
  },
  US: {
    code: "US",
    name: "Estados Unidos",
    dialCode: "+1",
    minLength: 10,
    maxLength: 10,
    mask: "(###) ###-####",
    example: "(212) 555-1234",
  },
  CA: {
    code: "CA",
    name: "Canadá",
    dialCode: "+1",
    minLength: 10,
    maxLength: 10,
    mask: "(###) ###-####",
    example: "(416) 555-1234",
  },
  ES: {
    code: "ES",
    name: "España",
    dialCode: "+34",
    minLength: 9,
    maxLength: 9,
    mask: "### ### ###",
    example: "612 345 678",
  },
  AR: {
    code: "AR",
    name: "Argentina",
    dialCode: "+54",
    minLength: 10,
    maxLength: 11,
    example: "11 2345 6789",
  },
  CO: {
    code: "CO",
    name: "Colombia",
    dialCode: "+57",
    minLength: 10,
    maxLength: 10,
    mask: "### ### ####",
    example: "312 345 6789",
  },
  CL: {
    code: "CL",
    name: "Chile",
    dialCode: "+56",
    minLength: 9,
    maxLength: 9,
    mask: "# #### ####",
    example: "9 1234 5678",
  },
  BR: {
    code: "BR",
    name: "Brasil",
    dialCode: "+55",
    minLength: 10,
    maxLength: 11,
    example: "11 91234 5678",
  },
  PE: {
    code: "PE",
    name: "Perú",
    dialCode: "+51",
    minLength: 9,
    maxLength: 9,
    mask: "### ### ###",
    example: "912 345 678",
  },
  GT: {
    code: "GT",
    name: "Guatemala",
    dialCode: "+502",
    minLength: 8,
    maxLength: 8,
    mask: "#### ####",
    example: "5123 4567",
  },
  CR: {
    code: "CR",
    name: "Costa Rica",
    dialCode: "+506",
    minLength: 8,
    maxLength: 8,
    mask: "#### ####",
    example: "8312 3456",
  },
  PA: {
    code: "PA",
    name: "Panamá",
    dialCode: "+507",
    minLength: 7,
    maxLength: 8,
    example: "6123 4567",
  },
  DO: {
    code: "DO",
    name: "República Dominicana",
    dialCode: "+1",
    minLength: 10,
    maxLength: 10,
    mask: "(###) ###-####",
    example: "(809) 234-5678",
  },
  EC: {
    code: "EC",
    name: "Ecuador",
    dialCode: "+593",
    minLength: 8,
    maxLength: 9,
    example: "99 123 4567",
  },
  UY: {
    code: "UY",
    name: "Uruguay",
    dialCode: "+598",
    minLength: 8,
    maxLength: 9,
    example: "94 231 234",
  },
  VE: {
    code: "VE",
    name: "Venezuela",
    dialCode: "+58",
    minLength: 10,
    maxLength: 10,
    mask: "### ### ####",
    example: "412 123 4567",
  },
  SV: {
    code: "SV",
    name: "El Salvador",
    dialCode: "+503",
    minLength: 8,
    maxLength: 8,
    mask: "#### ####",
    example: "7012 3456",
  },
  HN: {
    code: "HN",
    name: "Honduras",
    dialCode: "+504",
    minLength: 8,
    maxLength: 8,
    mask: "#### ####",
    example: "9123 4567",
  },
  NI: {
    code: "NI",
    name: "Nicaragua",
    dialCode: "+505",
    minLength: 8,
    maxLength: 8,
    mask: "#### ####",
    example: "8123 4567",
  },
  BO: {
    code: "BO",
    name: "Bolivia",
    dialCode: "+591",
    minLength: 8,
    maxLength: 8,
    mask: "#### ####",
    example: "7123 4567",
  },
  PY: {
    code: "PY",
    name: "Paraguay",
    dialCode: "+595",
    minLength: 7,
    maxLength: 9,
    example: "961 456 789",
  },
  GB: {
    code: "GB",
    name: "Reino Unido",
    dialCode: "+44",
    minLength: 9,
    maxLength: 10,
    example: "7400 123456",
  },
  FR: {
    code: "FR",
    name: "Francia",
    dialCode: "+33",
    minLength: 9,
    maxLength: 9,
    mask: "# ## ## ## ##",
    example: "6 12 34 56 78",
  },
  DE: {
    code: "DE",
    name: "Alemania",
    dialCode: "+49",
    minLength: 6,
    maxLength: 11,
    example: "1512 3456789",
  },
  IT: {
    code: "IT",
    name: "Italia",
    dialCode: "+39",
    minLength: 6,
    maxLength: 11,
    example: "312 345 6789",
  },
  PT: {
    code: "PT",
    name: "Portugal",
    dialCode: "+351",
    minLength: 9,
    maxLength: 9,
    mask: "### ### ###",
    example: "912 345 678",
  },
};

export const DEFAULT_PHONE_COUNTRIES: CnPhoneCountryCode[] = Object.keys(
  PHONE_COUNTRIES,
) as CnPhoneCountryCode[];

export const onlyDigits = (value: string): string => value.replace(/\D/g, "");

/** Aplica la máscara del país o agrupa en bloques de 3-4 dígitos. */
export const formatNationalNumber = (digits: string, country: CnPhoneCountry): string => {
  if (!digits) return "";
  if (country.mask) {
    let result = "";
    let index = 0;
    for (const char of country.mask) {
      if (index >= digits.length) break;
      if (char === "#") {
        result += digits[index];
        index += 1;
      } else {
        result += char;
      }
    }
    return index < digits.length ? `${result}${digits.slice(index)}` : result;
  }
  return digits.replace(/(\d{3})(?=\d{4})/g, "$1 ").trim();
};

/**
 * Detecta país y número nacional a partir de un valor E.164 (`+525512345678`).
 * Si varios países comparten prefijo (+1), se prefiere `preferred`.
 */
export const parsePhoneValue = (
  value: string,
  allowed: readonly CnPhoneCountryCode[],
  preferred: CnPhoneCountryCode,
): { country: CnPhoneCountryCode; national: string } => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) {
    return { country: preferred, national: onlyDigits(trimmed) };
  }
  const digits = onlyDigits(trimmed);
  const candidates = allowed
    .map((code) => PHONE_COUNTRIES[code])
    .filter((country) => digits.startsWith(onlyDigits(country.dialCode)))
    .sort((a, b) => {
      const byLength = b.dialCode.length - a.dialCode.length;
      if (byLength !== 0) return byLength;
      if (a.code === preferred) return -1;
      if (b.code === preferred) return 1;
      return 0;
    });
  const match = candidates[0];
  if (!match) return { country: preferred, national: digits };
  return { country: match.code, national: digits.slice(onlyDigits(match.dialCode).length) };
};

export const toE164 = (national: string, country: CnPhoneCountry): string =>
  national ? `${country.dialCode}${national}` : "";

export const isValidNationalNumber = (national: string, country: CnPhoneCountry): boolean =>
  national.length >= country.minLength && national.length <= country.maxLength;
