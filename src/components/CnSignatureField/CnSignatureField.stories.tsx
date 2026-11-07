import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnSignatureField } from "./CnSignatureField";
import { CnSignatureFieldSkeleton } from "./CnSignatureFieldSkeleton";

const meta: Meta<typeof CnSignatureField> = {
  title: "Forms/CnSignatureField",
  component: CnSignatureField,
  tags: ["autodocs"],
  args: { label: "Firma del colaborador", required: true },
};

export default meta;
type Story = StoryObj<typeof CnSignatureField>;

const PreviewStory = () => {
  const [value, setValue] = useState("");
  return (
    <Box sx={{ maxWidth: 520, display: "grid", gap: 2 }}>
      <CnSignatureField label="Firma" value={value} onChange={setValue} />
      <Box sx={{ fontSize: 11, color: "var(--cn-color-text-muted)", wordBreak: "break-all" }}>
        {value ? `${value.slice(0, 80)}… (${Math.round(value.length / 1024)} KB)` : "Sin firma"}
      </Box>
    </Box>
  );
};

export const Default: Story = { render: () => <PreviewStory /> };
export const DrawOnly: Story = { args: { allowTyped: false, height: 140 } };

/** Estado de carga: el skeleton sigue las variantes del campo (`skeleton` o `CnSignatureFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Box sx={{ maxWidth: 520, display: "grid", gap: 4 }}>
      <CnSignatureField
        label="Firma del colaborador"
        helperText="Firma dentro del recuadro"
        skeleton
      />
      <CnSignatureFieldSkeleton allowTyped={false} height={140} />
      <CnSignatureFieldSkeleton readOnly label={false} height={120} />
    </Box>
  ),
};
