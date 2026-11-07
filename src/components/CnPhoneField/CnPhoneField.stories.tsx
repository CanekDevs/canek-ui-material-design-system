import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnPhoneField } from "./CnPhoneField";
import { CnPhoneFieldSkeleton } from "./CnPhoneFieldSkeleton";

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

/** Estado de carga: bandera, lada y número (`skeleton` o `CnPhoneFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 360 }}>
      <CnPhoneField label="Teléfono" helperText="Con lada" skeleton />
      <CnPhoneFieldSkeleton size="sm" />
      <CnPhoneFieldSkeleton size="lg" helperText />
      <CnPhoneFieldSkeleton showCountrySelect={false} />
      <CnPhoneFieldSkeleton variant="filled" value={false} />
    </Stack>
  ),
};
