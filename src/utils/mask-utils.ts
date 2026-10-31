/**
 * Máscaras de captura. Tokens:
 * - `#` dígito
 * - `A` letra (se convierte a mayúscula)
 * - `*` letra o dígito (letras en mayúscula)
 * Cualquier otro carácter es literal y se inserta solo.
 */
export type CnMaskPreset = {
  mask: string;
  placeholder?: string;
  /** Validación adicional del valor sin máscara. */
  validate?: (raw: string) => boolean;
  message?: string;
  inputMode?: "numeric" | "text";
};

const TOKENS: Record<string, RegExp> = { "#": /\d/, A: /[a-zñ]/i, "*": /[a-z0-9ñ]/i };

export const isMaskToken = (char: string): boolean => char in TOKENS;

/** Cantidad de caracteres capturables (sin literales). */
export const maskCapacity = (mask: string): number => Array.from(mask).filter(isMaskToken).length;

/** Quita literales y caracteres no válidos; devuelve solo lo capturable. */
export const unmask = (text: string, mask: string): string => {
  const tokens = Array.from(mask).filter(isMaskToken);
  let result = "";
  let tokenIndex = 0;
  for (const char of Array.from(text)) {
    const token = tokens[tokenIndex];
    if (!token) break;
    if (TOKENS[token].test(char)) {
      result += token === "#" ? char : char.toLocaleUpperCase();
      tokenIndex += 1;
    }
  }
  return result;
};

/** Aplica la máscara a un valor sin formato. */
export const applyMask = (raw: string, mask: string): string => {
  const clean = unmask(raw, mask);
  let result = "";
  let index = 0;
  for (const char of Array.from(mask)) {
    if (index >= clean.length) break;
    if (isMaskToken(char)) {
      result += clean[index];
      index += 1;
    } else {
      result += char;
    }
  }
  return result;
};

/** Algoritmo de Luhn (tarjetas). */
export const luhnCheck = (digits: string): boolean => {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

/** Dígito verificador de CLABE interbancaria (México, 18 dígitos). */
export const clabeCheck = (digits: string): boolean => {
  if (!/^\d{18}$/.test(digits)) return false;
  const weights = [3, 7, 1];
  const sum = Array.from(digits.slice(0, 17)).reduce(
    (acc, d, i) => acc + ((Number(d) * weights[i % 3]) % 10),
    0,
  );
  return (10 - (sum % 10)) % 10 === Number(digits[17]);
};

export type CnCardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export const detectCardBrand = (digits: string): CnCardBrand => {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|65|64[4-9])/.test(digits)) return "discover";
  return "unknown";
};

export const MASK_PRESETS = {
  creditCard: {
    mask: "#### #### #### ####",
    validate: luhnCheck,
    message: "Número de tarjeta no válido",
    inputMode: "numeric",
  },
  cardExpiry: {
    mask: "##/##",
    placeholder: "MM/AA",
    validate: (raw: string) => {
      const month = Number(raw.slice(0, 2));
      const year = 2000 + Number(raw.slice(2, 4));
      if (month < 1 || month > 12) return false;
      const now = new Date();
      return (
        year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
      );
    },
    message: "Fecha de vencimiento no válida o vencida",
    inputMode: "numeric",
  },
  cvv: {
    mask: "####",
    inputMode: "numeric",
    validate: (raw: string) => raw.length >= 3,
    message: "CVV no válido",
  },
  clabe: {
    mask: "### ### ########### #",
    validate: clabeCheck,
    message: "CLABE no válida (revisa el dígito verificador)",
    inputMode: "numeric",
  },
  postalCodeMX: { mask: "#####", inputMode: "numeric" },
  phoneMX: { mask: "## #### ####", inputMode: "numeric" },
  nss: { mask: "## ## ## #### #", inputMode: "numeric", message: "NSS no válido" },
  curp: { mask: "AAAA######AAAAAA**", message: "CURP no válida" },
  rfcMoral: { mask: "AAA######***", message: "RFC no válido" },
  rfcFisica: { mask: "AAAA######***", message: "RFC no válido" },
  time: { mask: "##:##", placeholder: "HH:MM", inputMode: "numeric" },
} satisfies Record<string, CnMaskPreset>;

export type CnMaskPresetName = keyof typeof MASK_PRESETS;
