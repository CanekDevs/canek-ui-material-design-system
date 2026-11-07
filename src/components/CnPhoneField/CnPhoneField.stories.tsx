import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnPhoneField } from "./CnPhoneField";

const meta: Meta<typeof CnPhoneField> = {
  title: "Forms/CnPhoneField",
  component: CnPhoneField,
  tags: ["autodocs"],
  args: { label: "Teléfono", defaultCountry: "MX" },
  decorators: [(Story) => <div style={{ maxWidth: 380 }}>{Story()}</div>],
};

export default meta;
type Story = StoryObj<typeof CnPhoneField>;

const ValueStory = () => {
  const [value, setValue] = useState("");
  return (
    <Stack spacing={1}>
      <CnPhoneField
        label="Teléfono"
        value={value}
        onChange={setValue}
        rules={[{ type: "phone" }]}
      />
      <span>Valor (E.164): {value || "—"}</span>
    </Stack>
  );
};

export const Default: Story = { render: () => <ValueStory /> };
export const National: Story = { args: { valueFormat: "national", label: "Teléfono (nacional)" } };
export const WithoutSelector: Story = { args: { showCountrySelect: false, label: "Celular MX" } };
export const LimitedCountries: Story = {
  args: { countries: ["MX", "US", "CA"], label: "Norteamérica" },
};
