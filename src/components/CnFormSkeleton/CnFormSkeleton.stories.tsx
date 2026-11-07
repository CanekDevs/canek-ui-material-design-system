import type { Meta, StoryObj } from "@storybook/react";
import { CnFormSkeleton } from "./CnFormSkeleton";

const meta: Meta<typeof CnFormSkeleton> = {
  title: "Feedback/CnFormSkeleton",
  component: CnFormSkeleton,
  tags: ["autodocs"],
  args: { rows: 4, columns: 2, showHeader: true, showActions: true },
  decorators: [(Story) => <div style={{ maxWidth: 720 }}>{Story()}</div>],
};

export default meta;
type Story = StoryObj<typeof CnFormSkeleton>;

export const Default: Story = {};
export const SingleColumnWithTextarea: Story = { args: { columns: 1, withTextarea: true } };
