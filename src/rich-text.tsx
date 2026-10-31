/**
 * Punto de entrada `@canek-ui/material-design-system/rich-text`.
 *
 * Vive aparte del paquete principal porque depende de tiptap (peer opcional):
 * las apps que no usan el editor no lo instalan ni lo cargan.
 */
import { CnRichTextField } from "./components/CnRichTextField";
import type { CnRichTextFieldProps } from "./components/CnRichTextField";
import { registerFormFieldType } from "./components/CnForm/CnFormField";

export { CnRichTextField, normalizeLink, RICH_TEXT_TOOLBARS } from "./components/CnRichTextField";
export type { CnRichTextFieldProps, CnRichTextTool } from "./components/CnRichTextField";

/**
 * Habilita `type: "richtext"` en `CnForm`. Llamar una vez al iniciar la app.
 * Las props del editor se pasan con `componentProps` en el campo.
 */
export const registerRichTextFieldType = (): void => {
  registerFormFieldType("richtext", ({ field, value, formValues, sectionContext, ...props }) => (
    <CnRichTextField
      {...props}
      value={typeof value === "string" ? value : ""}
      formValues={formValues}
      sectionContext={sectionContext}
      maxLength={field.maxLength}
      showCount={field.showCounter}
      internalValidation={false}
      reserveHelperSpace
      {...(field.componentProps as Partial<CnRichTextFieldProps> | undefined)}
    />
  ));
};
