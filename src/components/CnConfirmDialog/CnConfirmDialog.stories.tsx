import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CnButton } from "../CnButton";
import type { CnConfirmVariant } from "./CnConfirmDialog";
import { CnConfirmDialog, CnConfirmProvider, useConfirm } from "./CnConfirmDialog";
import { CnConfirmDialogSkeleton } from "./CnConfirmDialogSkeleton";

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

/**
 * Estado de carga: el skeleton del cuerpo se dibuja en línea (`CnConfirmDialogSkeleton`) o
 * dentro del diálogo abierto con la prop `skeleton` mientras llegan los datos.
 */
export const Skeleton: Story = {
  render: function SkeletonStory() {
    const [open, setOpen] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    return (
      <Stack spacing={3} alignItems="flex-start">
        <CnButton
          variant="outlined"
          color="neutral"
          onClick={() => {
            setOpen(true);
            setLoadingData(true);
            void wait(1500).then(() => setLoadingData(false));
          }}
        >
          Abrir con datos que tardan
        </CnButton>
        <CnConfirmDialog
          open={open}
          variant="delete"
          title="¿Eliminar a ACME Corp?"
          message="Se eliminarán también sus 12 contratos."
          skeleton={loadingData}
          onClose={() => setOpen(false)}
          onConfirm={() => wait(700)}
        />
        <CnConfirmDialogSkeleton surface variant="delete" />
        <CnConfirmDialogSkeleton surface variant="info" lines={3} />
        <CnConfirmDialogSkeleton surface variant="update" details requireText />
        <CnConfirmDialogSkeleton surface variant="success" icon={false} hideCancel lines={1} />
      </Stack>
    );
  },
};
