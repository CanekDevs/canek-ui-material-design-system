import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { BUILT_IN_FLAG_CODES, CnFlagIcon } from "./CnFlagIcon";
import { CnFlagIconSkeleton } from "./CnFlagIconSkeleton";

const meta: Meta<typeof CnFlagIcon> = {
  title: "Data Display/CnFlagIcon",
  component: CnFlagIcon,
  tags: ["autodocs"],
  args: { code: "MX", size: 32 },
};

export default meta;
type Story = StoryObj<typeof CnFlagIcon>;

export const Default: Story = {};
export const AllBuiltIn: Story = {
  render: () => (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 72px)", gap: "12px" }}>
      {BUILT_IN_FLAG_CODES.map((code) => (
        <Box
          key={code}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            fontSize: 11,
          }}
        >
          <CnFlagIcon code={code} size={32} />
          {code}
        </Box>
      ))}
    </Box>
  ),
};

/** Estado de carga: bandera 3:2 con nombre y lada según la variante (`skeleton` o `CnFlagIconSkeleton`). */
export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
      <CnFlagIcon code="MX" name="México" variant="with-name" size={20} skeleton />
      <CnFlagIconSkeleton size={16} />
      <CnFlagIconSkeleton size={32} />
      <CnFlagIconSkeleton variant="with-name" name="Estados Unidos" size={20} />
      <CnFlagIconSkeleton variant="full" name="España" dialCode="+34" size={20} />
    </Box>
  ),
};
