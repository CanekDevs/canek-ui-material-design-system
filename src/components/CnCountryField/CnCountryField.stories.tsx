import type { Meta, StoryObj } from "@storybook/react";
import { CnCountryField } from "./CnCountryField";
import Stack from "@mui/material/Stack";
import { CnCountryFieldSkeleton } from "./CnCountryFieldSkeleton";

const meta: Meta<typeof CnCountryField> = {
  title: "Forms/CnCountryField",
  component: CnCountryField,
  tags: ["autodocs"],
  args: { label: "País", priority: ["MX", "US", "CA"] },
  decorators: [(Story) => <div style={{ maxWidth: 360 }}>{Story()}</div>],
};

export default meta;
type Story = StoryObj<typeof CnCountryField>;

export const Default: Story = { args: { defaultValue: "MX" } };
export const Multiple: Story = {
  args: { label: "Países de operación", multiple: true, defaultValue: ["MX", "CO"] },
};
export const Restricted: Story = {
  args: { label: "País (LatAm)", countries: ["MX", "GT", "CO", "PE", "CL", "AR", "BR"] },
};

/** Estado de carga: bandera + nombre o chips (`skeleton` o `CnCountryFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3}>
      <CnCountryField label="País" helperText="Residencia fiscal" skeleton />
      <CnCountryFieldSkeleton size="sm" />
      <CnCountryFieldSkeleton size="lg" />
      <CnCountryFieldSkeleton multiple selectedCount={5} limitTags={3} />
      <CnCountryFieldSkeleton variant="filled" value={false} />
    </Stack>
  ),
};
