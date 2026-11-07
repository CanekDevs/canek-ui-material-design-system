import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnForm } from "./CnForm";
import type { CnFormSection, CnFormValues } from "./CnForm.types";

const meta: Meta<typeof CnForm> = {
  title: "Forms/CnForm/Enterprise",
  component: CnForm,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CnForm>;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const money = (value: unknown) =>
  Number(value ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const STATES = [
  { value: "JAL", label: "Jalisco" },
  { value: "NL", label: "Nuevo León" },
  { value: "CDMX", label: "Ciudad de México" },
];
const CITIES: Record<string, { value: string; label: string }[]> = {
  JAL: [
    { value: "GDL", label: "Guadalajara" },
    { value: "ZAP", label: "Zapopan" },
  ],
  NL: [
    { value: "MTY", label: "Monterrey" },
    { value: "SPG", label: "San Pedro Garza García" },
  ],
  CDMX: [
    { value: "COY", label: "Coyoacán" },
    { value: "CUA", label: "Cuauhtémoc" },
  ],
};
const PEOPLE = [
  "Ana López",
  "Luis Pérez",
  "María Hernández",
  "Jorge Ramírez",
  "Sofía Torres",
  "Diego Morales",
].map((label, index) => ({ value: index + 1, label, initials: true as const }));

const sections: CnFormSection[] = [
  {
    id: "general",
    title: "Datos generales",
    icon: "badge",
    columns: 2,
    fields: [
      { name: "id", type: "hidden" },
      {
        name: "plan",
        type: "choicecards",
        label: "Plan",
        required: true,
        optionColumns: 3,
        options: [
          {
            value: "basic",
            label: "Básico",
            description: "Hasta 5 usuarios",
            meta: "$0",
            icon: "person",
          },
          {
            value: "team",
            label: "Equipo",
            description: "Hasta 50 usuarios",
            meta: "$499",
            icon: "groups",
          },
          {
            value: "corp",
            label: "Corporativo",
            description: "Sin límite + SSO",
            meta: "$1,999",
            icon: "apartment",
          },
        ],
      },
      { name: "state", type: "select", label: "Estado", options: STATES, required: true },
      {
        name: "city",
        type: "select",
        label: "Ciudad",
        dependsOn: ["state"],
        required: true,
        helperText: "Se carga al elegir el estado",
        loadOptions: async ({ formValues }) => {
          await wait(500);
          return CITIES[String(formValues.state)] ?? [];
        },
      },
      {
        name: "owner",
        type: "autocomplete",
        label: "Responsable",
        helperText: "Búsqueda remota; escribe un nombre nuevo para crearlo",
        loadOptions: async ({ input }) => {
          await wait(350);
          const query = input.toLowerCase();
          return PEOPLE.filter((person) => person.label.toLowerCase().includes(query));
        },
        onCreateOption: async (input) => {
          await wait(300);
          return { value: Date.now(), label: input, initials: true };
        },
      },
      {
        name: "area",
        type: "treeselect",
        label: "Área",
        componentProps: { showPath: true },
        options: [
          {
            value: "ops",
            label: "Operaciones",
            children: [
              { value: "ops-log", label: "Logística" },
              { value: "ops-wh", label: "Almacén" },
            ],
          },
          {
            value: "adm",
            label: "Administración",
            children: [
              { value: "adm-fin", label: "Finanzas" },
              { value: "adm-hr", label: "Recursos humanos" },
            ],
          },
        ],
      },
      { name: "notify", type: "switch", label: "Notificar por correo" },
      {
        name: "email",
        type: "email",
        label: "Correo de notificación",
        rules: [{ type: "required", when: (values) => values.notify === true }],
        helperText: "Obligatorio solo si se notifica",
      },
    ],
  },
  {
    id: "lines",
    title: "Partida",
    repeatable: true,
    minItems: 0,
    initialItems: 1,
    emptyText: "Agrega al menos una partida",
    columns: 4,
    fields: [
      { name: "concept", type: "text", label: "Concepto", required: true },
      { name: "qty", type: "number", label: "Cantidad", min: 1, required: true },
      { name: "price", type: "currency", label: "Precio", required: true },
      {
        name: "amount",
        type: "display",
        label: "Importe",
        compute: (_values, ctx) => Number(ctx?.item?.qty ?? 0) * Number(ctx?.item?.price ?? 0),
        format: money,
      },
    ],
  },
  {
    id: "summary",
    title: "Resumen",
    headerRight: <span style={{ fontSize: 12, color: "#6e7682" }}>Calculado</span>,
    columns: 3,
    fields: [
      {
        name: "subtotal",
        type: "display",
        label: "Subtotal",
        compute: (values) =>
          ((values.lines as Array<{ amount?: number }>) ?? []).reduce(
            (sum, line) => sum + Number(line.amount ?? 0),
            0,
          ),
        format: money,
      },
      {
        name: "tax",
        type: "display",
        label: "IVA 16 %",
        compute: (values) => Math.round(Number(values.subtotal ?? 0) * 16) / 100,
        format: money,
      },
      {
        name: "total",
        type: "display",
        label: "Total",
        compute: (values) => Number(values.subtotal ?? 0) + Number(values.tax ?? 0),
        format: (value) => <strong>{money(value)}</strong>,
      },
    ],
  },
  {
    id: "access",
    title: "Acceso y metadatos",
    collapsible: true,
    fields: [
      {
        name: "permissions",
        type: "transferlist",
        label: "Permisos",
        options: [
          { value: "read", label: "Consultar" },
          { value: "create", label: "Crear" },
          { value: "update", label: "Editar" },
          { value: "delete", label: "Eliminar" },
          { value: "export", label: "Exportar" },
          { value: "admin", label: "Administrar", disabled: true },
        ],
      },
      {
        name: "metadata",
        type: "keyvalue",
        label: "Metadatos",
        componentProps: { keySuggestions: ["centro_costo", "proyecto", "referencia"] },
      },
    ],
  },
];

const EnterpriseStory = () => {
  const [values, setValues] = useState<CnFormValues>({});
  return (
    <Box sx={{ display: "grid", gap: 3, maxWidth: 960 }}>
      <CnForm
        title="Alta de contrato"
        description="Cascada remota, búsqueda con alta, árbol, tarjetas, calculados y reglas condicionales."
        icon="description"
        sections={sections}
        defaultValues={{ id: 123, lines: [{ concept: "Licencia", qty: 2, price: 499 }] }}
        onChange={(_patch, next) => setValues(next)}
        onSubmit={async () => {
          await wait(800);
        }}
        warnOnUnsavedChanges
      />
      <Box
        component="pre"
        sx={{ m: 0, p: 2, fontSize: 12, bgcolor: "#f4f5f7", borderRadius: 2, overflow: "auto" }}
      >
        {JSON.stringify(values, null, 2)}
      </Box>
    </Box>
  );
};

export const EnterpriseFeatures: Story = { render: () => <EnterpriseStory /> };

const PHOTOS = [
  { id: 1, url: "https://picsum.photos/id/1015/600/400", name: "rio.jpg" },
  { id: 2, url: "https://picsum.photos/id/1025/400/600", name: "perro.jpg" },
  { id: 3, url: "https://picsum.photos/id/1035/600/600", name: "cascada.jpg" },
  { id: 4, url: "https://picsum.photos/id/1043/600/350", name: "ciudad.jpg" },
];

export const DatesFilesAndLayout: Story = {
  render: () => (
    <Box sx={{ maxWidth: 960 }}>
      <CnForm
        title="Fechas, archivos y apariencia"
        icon="event"
        sections={[
          {
            id: "dates",
            title: "Fechas",
            appearance: "elevated",
            columns: 2,
            fields: [
              {
                name: "fiscalYear",
                type: "year",
                label: "Ejercicio fiscal",
                minDate: "2015",
                maxDate: "2030",
                shouldDisableYear: (year) => year === 2020,
                helperText: "2020 está cerrado",
              },
              {
                name: "period",
                type: "month",
                label: "Periodo",
                displayFormat: "MMMM [de] YYYY",
                shouldDisableMonth: (month) => month.endsWith("-12"),
              },
              {
                name: "meeting",
                type: "datetime",
                label: "Cita",
                minTime: "08:00",
                maxTime: "18:00",
                displayFormat: "dddd D [de] MMMM, HH:mm",
                disableWeekends: true,
              },
              {
                name: "phone",
                type: "tel",
                label: "Teléfono",
                showCountrySelect: true,
                defaultCountry: "MX",
              },
            ],
          },
          {
            id: "files",
            title: "Galería",
            appearance: "filled",
            fields: [
              {
                name: "photos",
                type: "file",
                label: "Fotos",
                multiple: true,
                accept: "image/*",
                fileVariant: "masonry",
                gridColumns: 3,
                maxSize: 500,
                fileSizeUnit: "KB",
                removedFilesName: "removedPhotoIds",
              },
            ],
          },
          {
            id: "notes",
            title: "Notas",
            appearance: "plain",
            fields: [
              { name: "detailed", type: "switch", label: "Notas extensas" },
              {
                name: "notes",
                type: "textarea",
                label: "Notas",
                rows: (values) => (values.detailed ? 8 : 3),
              },
            ],
          },
        ]}
        defaultValues={{ photos: PHOTOS, period: "2024-05", fiscalYear: "2024" }}
        onSubmit={() => wait(600)}
      />
    </Box>
  ),
};
