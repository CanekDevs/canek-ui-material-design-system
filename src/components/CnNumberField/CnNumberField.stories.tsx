import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnCurrencyField } from "../CnCurrencyField";
import { CnPhoneField } from "../CnPhoneField";
import { CnNumberField, CnQuantityField } from "./CnNumberField";

const meta: Meta<typeof CnNumberField> = {
  title: "Forms/CnNumberField",
  component: CnNumberField,
  tags: ["autodocs"],
  args: { label: "Cantidad", min: 0, max: 100 },
  argTypes: { controls: { control: "select", options: ["stacked", "split", "inline", "none"] } },
};

export default meta;
type Story = StoryObj<typeof CnNumberField>;

export const Default: Story = {};

export const Controls: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 320 }}>
      <CnNumberField label="Flechas apiladas (stacked)" defaultValue={10} />
      <CnNumberField
        label="Botones a los lados (split)"
        controls="split"
        defaultValue={2}
        min={0}
      />
      <CnNumberField label="Botones juntos (inline)" controls="inline" defaultValue={5} />
      <CnNumberField label="Sin controles (none)" controls="none" defaultValue={7} />
      <Box sx={{ fontSize: 11, color: "var(--cn-color-text-muted)" }}>
        Mantén presionado un botón para repetir. ↑/↓ suman el paso, Shift ×10, Alt ÷10, Re Pág/Av
        Pág saltos grandes, Inicio/Fin van al mínimo/máximo.
      </Box>
    </Stack>
  ),
};

const QuantityStory = () => {
  const [qty, setQty] = useState<number | null>(1);
  return (
    <Box sx={{ maxWidth: 180 }}>
      <CnQuantityField
        label="Piezas"
        value={qty}
        onChange={setQty}
        max={20}
        size="lg"
        helperText="Máximo 20 por pedido"
      />
    </Box>
  );
};

export const Quantity: Story = { render: () => <QuantityStory /> };

export const Decimals: Story = {
  args: {
    label: "Peso",
    decimals: 2,
    step: 0.25,
    suffix: "kg",
    thousandSeparator: true,
    max: undefined,
    allowWheel: true,
    helperText: "Con rueda del mouse habilitada",
  },
};

export const SnapAndRequired: Story = {
  args: {
    label: "Minutos (múltiplos de 15)",
    step: 15,
    min: 0,
    max: 240,
    snapToStep: true,
    allowEmpty: false,
    clearable: true,
    helperText: "Al salir se ajusta al múltiplo de 15 más cercano",
  },
};

const NumericFamilyStory = () => {
  const [amount, setAmount] = useState<number | null>(1250.5);
  const [currency, setCurrency] = useState("MXN");
  const [phone, setPhone] = useState("+525512345678");
  return (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <CnCurrencyField
        label="Monto"
        value={amount}
        onChange={setAmount}
        currency={currency}
        onCurrencyChange={setCurrency}
        currencySelectorMode="editable"
      />
      <CnCurrencyField
        label="Propina (con flechas)"
        defaultValue={50}
        controls="stacked"
        step={10}
      />
      <CnPhoneField
        label="Teléfono"
        value={phone}
        onChange={setPhone}
        helperText={`Valor: ${phone || "—"}`}
      />
    </Stack>
  );
};

export const NumericFamily: Story = { render: () => <NumericFamilyStory /> };
