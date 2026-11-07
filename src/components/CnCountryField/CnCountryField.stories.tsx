import type { Meta, StoryObj } from "@storybook/react";
import { CnCountryField } from "./CnCountryField";

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
