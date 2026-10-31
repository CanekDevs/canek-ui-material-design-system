import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { registerRichTextFieldType } from "../../rich-text";
import { CnButton } from "../CnButton";
import { CnForm } from "./CnForm";
import type {
  CnFormField,
  CnFormHandle,
  CnFormSection,
  CnFormStep,
  CnFormTab,
  CnFormValues,
} from "./CnForm.types";

registerRichTextFieldType();

const meta: Meta<typeof CnForm> = {
  title: "Forms/CnForm",
  component: CnForm,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CnForm>;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const Preview = ({ value }: { value: unknown }) => (
  <Box
    component="pre"
    sx={{
      mt: 2,
      p: 1.5,
      fontSize: 11,
      borderRadius: 1,
      backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
      overflow: "auto",
      maxHeight: 240,
    }}
  >
    {JSON.stringify(value, (_, v) => (v instanceof File ? `File(${v.name})` : v), 2)}
  </Box>
);

// ─── Simple ───────────────────────────────────────────────────────────

const simpleFields: CnFormField[] = [
  {
    name: "name",
    type: "text",
    label: "Nombre completo",
    required: true,
    autoComplete: "name",
    transform: "capitalize",
  },
  { name: "email", type: "email", label: "Correo", required: true, autoComplete: "email" },
  {
    name: "password",
    type: "password",
    label: "Contraseña",
    required: true,
    showPasswordStrength: true,
    rules: [{ type: "passwordStrength", level: "medium" }],
  },
  {
    name: "confirm",
    type: "password",
    label: "Confirmar contraseña",
    required: true,
    rules: [{ type: "equalTo", field: "password", message: "Las contraseñas no coinciden" }],
  },
  { name: "phone", type: "phone", label: "Teléfono", defaultCountry: "MX" },
  { name: "birth", type: "date", label: "Fecha de nacimiento", disableFuture: true },
  { name: "bio", type: "textarea", label: "Biografía", maxLength: 280, showCounter: true },
  {
    name: "terms",
    type: "checkbox",
    label: "Acepto los términos y condiciones",
    rules: [{ type: "required", message: "Debes aceptar los términos" }],
  },
];

const SimpleStory = () => {
  const [value, setValue] = useState<CnFormValues>({});
  return (
    <Box sx={{ maxWidth: 720 }}>
      <CnForm
        title="Crear cuenta"
        description="Los campos marcados con * son obligatorios."
        fields={simpleFields}
        columns={2}
        value={value}
        onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
        onSubmit={async () => {
          await wait(900);
        }}
        onCancel={() => setValue({})}
        warnOnUnsavedChanges
      />
      <Preview value={value} />
    </Box>
  );
};

export const Simple: Story = { render: () => <SimpleStory /> };

// ─── Todos los tipos ──────────────────────────────────────────────────

const allFields: CnFormField[] = [
  { name: "text", type: "text", label: "Texto", startIcon: "person" },
  { name: "email", type: "email", label: "Email" },
  { name: "url", type: "url", label: "Sitio web", placeholder: "https://" },
  { name: "search", type: "search", label: "Búsqueda", clearable: true },
  { name: "number", type: "number", label: "Número", min: 0, max: 100, showSteppers: true },
  {
    name: "price",
    type: "currency",
    label: "Precio",
    currencyName: "currencyCode",
    currencies: ["MXN", "USD", "EUR"],
  },
  { name: "phone", type: "phone", label: "Teléfono", countries: ["MX", "US", "CO", "ES"] },
  {
    name: "role",
    type: "select",
    label: "Rol",
    placeholder: "Selecciona…",
    clearable: true,
    options: [
      { value: "admin", label: "Administrador", description: "Acceso total" },
      { value: "editor", label: "Editor" },
      { value: "viewer", label: "Lector" },
    ],
  },
  {
    name: "skills",
    type: "select",
    label: "Habilidades",
    multiple: true,
    chips: true,
    options: [
      { value: "react", label: "React" },
      { value: "ts", label: "TypeScript" },
      { value: "node", label: "Node.js" },
    ],
  },
  {
    name: "city",
    type: "autocomplete",
    label: "Ciudad",
    options: [
      { value: "cdmx", label: "Ciudad de México", group: "México", searchText: "CDMX DF" },
      { value: "gdl", label: "Guadalajara", group: "México" },
      { value: "bog", label: "Bogotá", group: "Colombia" },
      { value: "mad", label: "Madrid", group: "España" },
    ],
  },
  { name: "date", type: "date", label: "Fecha", clearable: true },
  { name: "time", type: "time", label: "Hora" },
  { name: "datetime", type: "datetime", label: "Fecha y hora" },
  { name: "month", type: "month", label: "Mes" },
  { name: "period", type: "daterange", label: "Periodo", maxDays: 90 },
  {
    name: "plan",
    type: "radio",
    label: "Plan",
    options: [
      { value: "basic", label: "Básico", description: "$0 / mes" },
      { value: "pro", label: "Pro", description: "$199 / mes" },
    ],
  },
  {
    name: "channels",
    type: "checkbox",
    label: "Canales de contacto",
    direction: "row",
    options: [
      { value: "email", label: "Correo" },
      { value: "sms", label: "SMS" },
      { value: "whatsapp", label: "WhatsApp" },
    ],
  },
  { name: "active", type: "switch", label: "Cuenta activa", description: "Puede iniciar sesión" },
  { name: "volume", type: "slider", label: "Volumen", min: 0, max: 100, step: 10, marks: true },
  { name: "budget", type: "range", label: "Presupuesto", min: 0, max: 10000, step: 500 },
  { name: "rating", type: "rating", label: "Satisfacción" },
  { name: "avatar", type: "file", label: "Foto de perfil", fileVariant: "avatar", maxSize: 2 },
  {
    name: "gallery",
    type: "file",
    label: "Galería",
    fileVariant: "grid",
    multiple: true,
    accept: "image/*",
    reorderable: true,
  },
  {
    name: "notes",
    type: "richtext",
    label: "Notas",
    maxLength: 1000,
    componentProps: { toolbar: "standard", minHeight: 140 },
  },
  {
    name: "docs",
    type: "file",
    label: "Documentos",
    multiple: true,
    accept: ".pdf,image/*",
    maxSize: 5,
    maxFiles: 3,
    reorderable: true,
  },
];

const AllTypesStory = () => {
  const [value, setValue] = useState<CnFormValues>({ currencyCode: "MXN" });
  return (
    <Box sx={{ maxWidth: 900 }}>
      <CnForm
        title="Todos los tipos de campo"
        fields={allFields}
        columns={2}
        value={value}
        onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
        submitMode="auto"
        onSubmit={async () => wait(600)}
      />
      <Preview value={value} />
    </Box>
  );
};

export const AllFieldTypes: Story = { render: () => <AllTypesStory /> };

// ─── Secciones y repetibles ───────────────────────────────────────────

const sections: CnFormSection[] = [
  {
    id: "company",
    title: "Empresa",
    description: "Datos fiscales",
    icon: "business",
    columns: 2,
    fields: [
      { name: "company.name", type: "text", label: "Razón social", required: true },
      {
        name: "company.rfc",
        type: "text",
        label: "RFC",
        transform: "uppercase",
        rules: [{ type: "rfc", personType: "moral" }],
      },
    ],
  },
  {
    id: "contacts",
    title: "Contacto",
    icon: "contacts",
    repeatable: true,
    minItems: 1,
    maxItems: 4,
    canReorder: true,
    collapsible: true,
    columns: 2,
    itemTitle: (index, item) => (item.name ? String(item.name) : `Contacto ${index + 1}`),
    fields: [
      { name: "name", type: "text", label: "Nombre", required: true },
      { name: "email", type: "email", label: "Correo", required: true },
      {
        name: "isPrimary",
        type: "switch",
        label: "Contacto principal",
        md: 12,
      },
    ],
  },
  {
    id: "extra",
    title: "Opciones avanzadas",
    collapsible: true,
    defaultCollapsed: true,
    fields: [{ name: "notes", type: "textarea", label: "Notas internas" }],
  },
];

export const Sectioned: Story = {
  render: () => (
    <Box sx={{ maxWidth: 820 }}>
      <CnForm
        title="Alta de cliente"
        sections={sections}
        onSubmit={async (payload) => {
          await wait(600);
          console.info(payload);
        }}
      />
    </Box>
  ),
};

// ─── Pestañas ─────────────────────────────────────────────────────────

const tabs: CnFormTab[] = [
  {
    id: "general",
    label: "General",
    icon: "person",
    fields: [
      { name: "firstName", type: "text", label: "Nombre", required: true },
      { name: "lastName", type: "text", label: "Apellido", required: true },
    ],
  },
  {
    id: "address",
    label: "Dirección",
    icon: "location_on",
    fields: [
      { name: "address.street", type: "text", label: "Calle", required: true },
      {
        name: "address.zip",
        type: "text",
        label: "Código postal",
        rules: [{ type: "postalCode", format: "mx" }],
      },
    ],
  },
  {
    id: "preferences",
    label: "Preferencias",
    icon: "settings",
    fields: [{ name: "newsletter", type: "switch", label: "Recibir boletín" }],
  },
];

export const Tabbed: Story = {
  render: () => (
    <Box sx={{ maxWidth: 820 }}>
      <CnForm title="Perfil" tabs={tabs} columns={2} onSubmit={async () => wait(500)} />
    </Box>
  ),
};

// ─── Wizard ───────────────────────────────────────────────────────────

const steps: CnFormStep[] = [
  {
    id: "account",
    title: "Cuenta",
    description: "Crea tus credenciales de acceso.",
    fields: [
      { name: "email", type: "email", label: "Correo", required: true },
      {
        name: "username",
        type: "text",
        label: "Usuario",
        required: true,
        helperText: 'Prueba con "admin" para ver la validación asíncrona.',
        validateAsync: async (v) => {
          await wait(400);
          return v === "admin" ? "Ese usuario ya existe" : null;
        },
      },
    ],
  },
  {
    id: "profile",
    title: "Perfil",
    fields: [
      { name: "fullName", type: "text", label: "Nombre completo", required: true },
      { name: "avatar", type: "file", label: "Foto", accept: "image/*", maxSize: 2 },
    ],
  },
  {
    id: "billing",
    title: "Facturación",
    optional: true,
    fields: [
      { name: "needsInvoice", type: "switch", label: "Requiero factura" },
      {
        name: "rfc",
        type: "text",
        label: "RFC",
        required: true,
        transform: "uppercase",
        rules: [{ type: "rfc" }],
        visibleWhen: (v) => Boolean(v.needsInvoice),
      },
    ],
  },
];

export const Wizard: Story = {
  render: () => (
    <Box sx={{ maxWidth: 820 }}>
      <CnForm
        title="Registro"
        steps={steps}
        submitMode="auto"
        onSubmit={async () => wait(800)}
        omitHiddenFields
      />
    </Box>
  ),
};

// ─── Modal ────────────────────────────────────────────────────────────

const ModalStory = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CnButton onClick={() => setOpen(true)} startIcon="edit">
        Editar producto
      </CnButton>
      <CnForm
        mode="modal"
        open={open}
        onClose={() => setOpen(false)}
        title="Editar producto"
        description="Los cambios se guardan al confirmar."
        defaultValues={{ name: "Café de olla", price: 45 }}
        columns={2}
        fields={[
          { name: "name", type: "text", label: "Nombre", required: true },
          { name: "price", type: "currency", label: "Precio", required: true },
          { name: "description", type: "textarea", label: "Descripción" },
        ]}
        warnOnUnsavedChanges
        onSubmit={async () => {
          await wait(700);
          setOpen(false);
        }}
      />
    </>
  );
};

export const Modal: Story = { render: () => <ModalStory /> };

// ─── Errores del servidor ─────────────────────────────────────────────

export const ServerErrors: Story = {
  render: () => (
    <Box sx={{ maxWidth: 560 }}>
      <CnForm
        title="Errores del servidor"
        description="Al enviar, la API responde 422 con errores por campo (formato Laravel)."
        defaultValues={{ email: "ana@canek.mx", rfc: "XAXX010101000" }}
        fields={[
          { name: "email", type: "email", label: "Correo", required: true },
          { name: "rfc", type: "text", label: "RFC", transform: "uppercase" },
        ]}
        onSubmit={async () => {
          await wait(500);
          throw {
            response: {
              status: 422,
              data: {
                message: "Los datos no son válidos.",
                errors: { email: ["El correo ya está registrado."] },
              },
            },
          };
        }}
      />
    </Box>
  ),
};

// ─── API imperativa / no controlado ───────────────────────────────────

const ImperativeStory = () => {
  const formRef = useRef<CnFormHandle>(null);
  const [result, setResult] = useState<unknown>(null);
  return (
    <Box sx={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 2 }}>
      <CnForm
        formRef={formRef}
        hideActions
        defaultValues={{ name: "" }}
        fields={[{ name: "name", type: "text", label: "Nombre", required: true }]}
        onSubmit={(payload) => setResult(payload)}
      />
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <CnButton onClick={() => formRef.current?.setFieldValue("name", "Ana López")}>
          Rellenar
        </CnButton>
        <CnButton variant="outlined" onClick={() => formRef.current?.reset()}>
          Reset
        </CnButton>
        <CnButton variant="outlined" onClick={() => void formRef.current?.submit()}>
          Enviar desde fuera
        </CnButton>
      </Box>
      <Preview value={result} />
    </Box>
  );
};

export const Imperative: Story = { render: () => <ImperativeStory /> };

export const LoadingAndReadOnly: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: 4, maxWidth: 560 }}>
      <CnForm title="Cargando" isLoading fields={simpleFields.slice(0, 4)} onSubmit={() => {}} />
      <CnForm
        title="Solo lectura"
        readOnly
        defaultValues={{ name: "Ana", email: "ana@canek.mx" }}
        fields={simpleFields.slice(0, 2)}
        onSubmit={() => {}}
      />
    </Box>
  ),
};
