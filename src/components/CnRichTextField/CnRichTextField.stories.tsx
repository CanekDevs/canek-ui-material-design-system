import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnRichTextField } from "./CnRichTextField";

const meta: Meta<typeof CnRichTextField> = {
  title: "Forms/CnRichTextField",
  component: CnRichTextField,
  tags: ["autodocs"],
  args: { label: "Descripción", placeholder: "Escribe la descripción del producto…" },
  argTypes: { toolbar: { control: "select", options: ["basic", "standard", "full"] } },
};

export default meta;
type Story = StoryObj<typeof CnRichTextField>;

export const Standard: Story = {};

export const Full: Story = {
  args: {
    toolbar: "full",
    showCount: true,
    maxLength: 2000,
    defaultValue:
      '<h2>Políticas de envío</h2><p>Los pedidos se envían en <strong>24–48 h</strong>. Consulta <a href="https://canek.mx">nuestro sitio</a>.</p><ul><li>CDMX: mismo día</li><li>Resto del país: 2 a 4 días</li></ul>',
  },
};

export const Basic: Story = { args: { toolbar: "basic", minHeight: 100 } };

const ControlledStory = () => {
  const [html, setHtml] = useState("<p>Edita y mira el HTML abajo.</p>");
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <CnRichTextField
        label="Contenido"
        value={html}
        onChange={setHtml}
        rules={[{ type: "required" }]}
      />
      <Box component="pre" sx={{ fontSize: 11, whiteSpace: "pre-wrap" }}>
        {html || "(vacío)"}
      </Box>
    </Box>
  );
};

export const Controlled: Story = { render: () => <ControlledStory /> };

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "<p>Solo lectura con <em>formato</em>.</p>" },
};
