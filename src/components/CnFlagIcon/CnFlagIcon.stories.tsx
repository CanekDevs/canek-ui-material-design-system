import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { BUILT_IN_FLAG_CODES, CnFlagIcon } from "./CnFlagIcon";

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
