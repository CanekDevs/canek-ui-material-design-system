import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnEmailComposer } from "./CnEmailComposer";
import type { CnEmailDraft, CnEmailTemplate } from "./CnEmailComposer";
import { CnEmailComposerSkeleton } from "./CnEmailComposerSkeleton";
import type { CnEmailVariable } from "./email-utils";

const SUGGESTIONS = [
  "lucia.mendez@grupobajio.mx",
  "andres.nunez@ferremex.mx",
  "compras@ferremex.mx",
];
const VARIABLES: CnEmailVariable[] = [
  { key: "nombre", label: "Nombre del contacto", value: "Lucía" },
  { key: "empresa", label: "Empresa", value: "Grupo Bajío" },
  { key: "folio", label: "Folio de la cotización", value: "2026-0142" },
  { key: "fecha_entrega", label: "Fecha de entrega" },
];
const TEMPLATES: CnEmailTemplate[] = [
  {
    id: "cotizacion",
    name: "Envío de cotización",
    subject: "Cotización {{folio}} para {{empresa}}",
    body: "<p>Hola {{nombre}},</p><p>Te comparto la cotización <strong>{{folio}}</strong>. Quedo atento a tus comentarios.</p><p>Saludos.</p>",
  },
  {
    id: "seguimiento",
    name: "Seguimiento después de la visita",
    subject: "Gracias por la visita, {{nombre}}",
    body: "<p>Hola {{nombre}},</p><p>Gracias por recibirnos. Te confirmo la entrega para el {{fecha_entrega}}.</p>",
  },
];

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const meta: Meta<typeof CnEmailComposer> = {
  title: "Components/CnEmailComposer",
  component: CnEmailComposer,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnEmailComposer") } } },
  args: {
    fromOptions: ["ventas@miempresa.mx", "lucia@miempresa.mx"],
    suggestions: SUGGESTIONS,
    templates: TEMPLATES,
    variables: VARIABLES,
    onSend: async () => wait(1000),
    onSaveDraft: async () => wait(500),
    onDiscard: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof CnEmailComposer>;

/** Elige «Plantillas» → «Envío de cotización» y abre la vista previa para ver las variables resueltas. */
export const Default: Story = {
  render: (args) => (
    <Box sx={{ maxWidth: 760 }}>
      <CnEmailComposer {...args} />
    </Box>
  ),
};

/** «Seguimiento después de la visita» usa {{fecha_entrega}}, que no tiene valor: no deja enviar. */
export const MissingVariable: Story = {
  render: (args) => (
    <Box sx={{ maxWidth: 760 }}>
      <CnEmailComposer
        {...args}
        defaultValue={{
          to: ["lucia.mendez@grupobajio.mx"],
          subject: TEMPLATES[1].subject,
          body: TEMPLATES[1].body,
        }}
      />
    </Box>
  ),
};

export const SendError: Story = {
  args: {
    onSend: async () => {
      await wait(600);
      throw new Error("El servidor de correo rechazó el envío (límite diario alcanzado).");
    },
    defaultValue: {
      to: ["compras@ferremex.mx"],
      subject: "Pedido 2026-0142",
      body: "<p>Hola, ¿me confirman el pedido?</p>",
    },
  },
  render: (args) => (
    <Box sx={{ maxWidth: 760 }}>
      <CnEmailComposer {...args} />
    </Box>
  ),
};

export const Controlled: Story = {
  render: function Controlled(args) {
    const [draft, setDraft] = useState<CnEmailDraft>({
      to: [],
      cc: [],
      bcc: [],
      subject: "",
      body: "",
      attachments: [],
    });
    return (
      <Box sx={{ maxWidth: 760, display: "grid", gap: "12px" }}>
        <CnEmailComposer {...args} value={draft} onChange={setDraft} />
        <Typography
          component="pre"
          sx={{ fontSize: "12px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {JSON.stringify({ ...draft, attachments: draft.attachments.length }, null, 2)}
        </Typography>
      </Box>
    );
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px", maxWidth: 760 }}>
      <CnEmailComposerSkeleton />
      <CnEmailComposer skeleton />
    </Box>
  ),
};

const LONG =
  "Seguimiento de oportunidades comerciales de la región Bajío y Occidente con distribuidores autorizados";

/** Datos extremos (asunto de 100+ caracteres, correos larguísimos, muchos destinatarios) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: (args) => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <CnEmailComposer
            {...args}
            defaultValue={{
              to: [
                "direccion.general.de.compras.y.abastecimiento@distribuidoradeloccidenteyelbajio.com.mx",
                ...SUGGESTIONS,
              ],
              cc: ["sinespaciossinespaciossinespaciossinespacios@sinespacios.mx"],
              subject: LONG,
              body: `<p>${LONG}</p><p>SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios</p>`,
            }}
          />
        </Box>
      ))}
    </Box>
  ),
};
