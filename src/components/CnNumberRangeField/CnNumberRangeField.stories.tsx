import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnCountryField } from "../CnCountryField";
import { BUILT_IN_FLAG_CODES, CnFlagIcon } from "../CnFlagIcon";
import { CnFormSkeleton } from "../CnFormSkeleton";
import { CnNumberRangeField } from "./CnNumberRangeField";

const meta: Meta<typeof CnNumberRangeField> = {
  title: "Forms/CnNumberRangeField",
  component: CnNumberRangeField,
  tags: ["autodocs"],
  args: { label: "Rango de precio", prefix: "$", thousandSeparator: true, min: 0 },
};

export default meta;
type Story = StoryObj<typeof CnNumberRangeField>;

export const Default: Story = {};

export const CountryAndFlags: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnCountryField label="País de residencia" priority={["MX", "US", "CO", "ES"]} />
      <CnCountryField
        label="Países donde opera"
        multiple
        countries={["MX", "GT", "SV", "HN", "NI", "CR", "PA"]}
      />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {BUILT_IN_FLAG_CODES.map((code) => (
          <CnFlagIcon key={code} code={code} size={20} />
        ))}
      </Stack>
    </Stack>
  ),
};

export const FormSkeleton: Story = {
  render: () => <CnFormSkeleton rows={3} columns={2} showHeader showActions withTextarea />,
};
