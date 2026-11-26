/** Utilidades de `CnEmailComposer`: correos y variables de plantilla. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** `true` si parece un correo válido (forma básica `nombre@dominio.tld`). */
export const isEmail = (value: string) => EMAIL.test(value.trim());

export type CnEmailVariable = {
  /** Se escribe en el texto como `{{key}}`. */
  key: string;
  /** Nombre que ve la persona («Nombre del contacto»). */
  label: string;
  /** Valor para la vista previa y el envío. */
  value?: string;
};

/**
 * Reemplaza `{{clave}}` por su valor. Las variables sin valor se dejan como están
 * (y `missingVariables` las reporta) para que nunca salga un correo con huecos.
 */
export const fillVariables = (text: string, variables: readonly CnEmailVariable[] = []) =>
  text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (all, key: string) => {
    const v = variables.find((x) => x.key === key)?.value;
    return v == null || v === "" ? all : v;
  });

/** Claves usadas en el texto que no tienen valor. */
export const missingVariables = (text: string, variables: readonly CnEmailVariable[] = []) => {
  const keys = new Set<string>();
  for (const m of text.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) {
    const v = variables.find((x) => x.key === m[1])?.value;
    if (v == null || v === "") keys.add(m[1]);
  }
  return [...keys];
};
