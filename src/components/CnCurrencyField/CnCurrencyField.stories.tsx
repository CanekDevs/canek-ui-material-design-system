import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnCurrencyField } from "./CnCurrencyField";

const meta: Meta<typeof CnCurrencyField> = {
  title: "Forms/CnCurrencyField",
  component: CnCurrencyField,
  tags: ["autodocs"],
  args: { label: "Importe", defaultValue: 1250.5, currency: "MXN" },
  argTypes: {
    currencySelectorMode: { control: "inline-radio", options: ["hidden", "readonly", "editable"] },
  },
  decorators: [(Story) => <div style={{ maxWidth: 360 }}>{Story()}</div>],
};

export default meta;
type Story = StoryObj<typeof CnCurrencyField>;

export const Default: Story = {};
export const Modes: Story = {
  render: () => (
    <Stack spacing={2}>
      <CnCurrencyField
        label="Oculto"
        defaultValue={100}
        currency="MXN"
        currencySelectorMode="hidden"
      />
      <CnCurrencyField
        label="Solo lectura"
        defaultValue={100}
        currency="USD"
        currencySelectorMode="readonly"
      />
      <CnCurrencyField
        label="Editable"
        defaultValue={100}
        defaultCurrency="EUR"
        currencies={["MXN", "USD", "EUR"]}
        currencySelectorMode="editable"
      />
    </Stack>
  ),
};
