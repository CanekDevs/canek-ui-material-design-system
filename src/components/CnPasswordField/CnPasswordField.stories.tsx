import type { Meta, StoryObj } from "@storybook/react";
import { CnPasswordField } from "./CnPasswordField";
import Stack from "@mui/material/Stack";
import { CnPasswordFieldSkeleton } from "./CnPasswordFieldSkeleton";

const meta: Meta<typeof CnPasswordField> = {
  title: "Forms/CnPasswordField",
  component: CnPasswordField,
  tags: ["autodocs"],
  args: { label: "Nueva contraseña" },
};

export default meta;
type Story = StoryObj<typeof CnPasswordField>;

export const Default: Story = {};
export const StrictWithGenerator: Story = {
  args: {
    allowGenerate: true,
    requirements: { minLength: 12, uppercase: true, lowercase: true, number: true, symbol: true },
  },
};
export const Login: Story = {
  args: {
    label: "Contraseña",
    requirements: false,
    showStrength: false,
    autoComplete: "current-password",
  },
};

/** Estado de carga: fortaleza, requisitos y generador (`skeleton` o `CnPasswordFieldSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <CnPasswordField label="Contraseña" allowGenerate skeleton />
      <CnPasswordFieldSkeleton size="sm" showStrength={false} />
      <CnPasswordFieldSkeleton showRequirements />
      <CnPasswordFieldSkeleton
        size="lg"
        showRequirements
        requirements={5}
        allowGenerate
        helperText
      />
      <CnPasswordFieldSkeleton variant="filled" />
    </Stack>
  ),
};
