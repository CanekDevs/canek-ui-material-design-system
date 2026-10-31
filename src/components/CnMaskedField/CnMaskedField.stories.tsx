import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnMaskedField } from "./CnMaskedField";

const meta: Meta<typeof CnMaskedField> = {
  title: "Forms/CnMaskedField",
  component: CnMaskedField,
  tags: ["autodocs"],
  args: { label: "Tarjeta", preset: "creditCard" },
};

export default meta;
type Story = StoryObj<typeof CnMaskedField>;

export const CreditCard: Story = {};

export const Presets: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <CnMaskedField
        label="Tarjeta"
        preset="creditCard"
        helperText="Prueba con 4111 1111 1111 1111"
      />
      <CnMaskedField label="Vencimiento" preset="cardExpiry" />
      <CnMaskedField label="CVV" preset="cvv" />
      <CnMaskedField label="CLABE" preset="clabe" helperText="Valida el dígito verificador" />
      <CnMaskedField label="NSS" preset="nss" />
      <CnMaskedField label="CURP" preset="curp" />
      <CnMaskedField label="RFC (persona moral)" preset="rfcMoral" />
      <CnMaskedField label="Código postal" preset="postalCodeMX" />
      <CnMaskedField
        label="Máscara propia"
        mask="AAA-###-*"
        helperText="AAA-###-* (letras, dígitos, alfanumérico)"
      />
    </Stack>
  ),
};
