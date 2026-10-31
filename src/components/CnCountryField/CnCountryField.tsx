import { forwardRef, useMemo } from "react";
import { PHONE_COUNTRIES } from "../../utils/phone-countries";
import type { CnAutocompleteFieldProps } from "../CnAutocompleteField";
import { CnAutocompleteField } from "../CnAutocompleteField";
import type { CnFieldOption } from "../CnForm/CnForm.types";

/** Códigos ISO 3166-1 alfa-2. */
export const ISO_COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO " +
  "JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR " +
  "MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO " +
  "RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV " +
  "TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

export type CnCountryFieldProps = Omit<CnAutocompleteFieldProps, "options"> & {
  /** Países disponibles (por defecto, todos). */
  countries?: readonly string[];
  /** Países que aparecen primero (p. ej. `["MX", "US"]`). */
  priority?: readonly string[];
  /** Idioma de los nombres. */
  locale?: string;
};

/** Construye las opciones de país con nombre localizado, bandera y lada. */
export const getCountryOptions = (
  codes: readonly string[] = ISO_COUNTRY_CODES,
  locale = "es-MX",
  priority: readonly string[] = [],
): CnFieldOption[] => {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    names = null;
  }
  const collator = new Intl.Collator(locale);
  const toOption = (code: string, group?: string): CnFieldOption => {
    const dial = PHONE_COUNTRIES[code as keyof typeof PHONE_COUNTRIES]?.dialCode;
    return {
      value: code,
      label: names?.of(code) ?? code,
      flag: code,
      group,
      searchText: [code, dial].filter(Boolean).join(" "),
    };
  };
  const prioritized = priority.filter((code) => codes.includes(code));
  const rest = codes
    .filter((code) => !prioritized.includes(code))
    .map((code) => toOption(code, prioritized.length ? "Todos los países" : undefined))
    .sort((a, b) => collator.compare(a.label, b.label));
  return [...prioritized.map((code) => toOption(code, "Frecuentes")), ...rest];
};

/** Selector de país con búsqueda (nombre, código ISO o lada), bandera y destacados. */
export const CnCountryField = forwardRef<HTMLDivElement, CnCountryFieldProps>(
  function CnCountryField(
    { countries, priority = [], locale = "es-MX", placeholder = "Busca un país", ...rest },
    ref,
  ) {
    const options = useMemo(
      () => getCountryOptions(countries ?? ISO_COUNTRY_CODES, locale, priority),
      // Las listas suelen declararse inline: se comparan por contenido.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [(countries ?? []).join(","), locale, priority.join(",")],
    );
    return <CnAutocompleteField ref={ref} {...rest} placeholder={placeholder} options={options} />;
  },
);
