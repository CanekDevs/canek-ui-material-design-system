import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnButton } from "../CnButton";
import type { CnConfirmVariant } from "./CnConfirmDialog";
import { CnConfirmDialog, CnConfirmProvider, useConfirm } from "./CnConfirmDialog";

const meta: Meta<typeof CnConfirmDialog> = {
  title: "Feedback/CnConfirmDialog",
  component: CnConfirmDialog,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CnConfirmDialog>;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const VARIANTS: CnConfirmVariant[] = [
  "delete",
  "danger",
  "warning",
  "info",
  "success",
  "update",
  "neutral",
];

const VariantsStory = () => {
  const [variant, setVariant] = useState<CnConfirmVariant | null>(null);
  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {VARIANTS.map((item) => (
          <CnButton key={item} variant="outlined" color="neutral" onClick={() => setVariant(item)}>
            {item}
          </CnButton>
        ))}
      </Stack>
      <CnConfirmDialog
        open={variant !== null}
        variant={variant ?? "neutral"}
        onClose={() => setVariant(null)}
        onConfirm={() => wait(700)}
      />
    </>
  );
};

export const Variants: Story = { render: () => <VariantsStory /> };

const UseConfirmDemo = () => {
  const confirm = useConfirm();
  const [log, setLog] = useState("—");
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Stack direction="row" spacing={1}>
        <CnButton
          color="error"
          startIcon="delete"
          onClick={async () =>
            setLog(
              String(
                await confirm({
                  variant: "delete",
                  title: "¿Eliminar a ACME Corp?",
                  message: "Se eliminarán también sus 12 contratos.",
                  requireText: "ACME",
                  onConfirm: () => wait(800),
                }),
              ),
            )
          }
        >
          Con texto obligatorio
        </CnButton>
        <CnButton
          variant="outlined"
          onClick={async () =>
            setLog(
              String(
                await confirm({
                  variant: "update",
                  onConfirm: async () => {
                    await wait(600);
                    throw {
                      response: {
                        data: { message: "El registro fue modificado por otro usuario" },
                      },
                    };
                  },
                }),
              ),
            )
          }
        >
          Con error del servidor
        </CnButton>
      </Stack>
      <span>Resultado: {log}</span>
    </Stack>
  );
};

export const UseConfirm: Story = {
  render: () => (
    <CnConfirmProvider>
      <UseConfirmDemo />
    </CnConfirmProvider>
  ),
};
