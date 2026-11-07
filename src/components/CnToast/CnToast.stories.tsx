import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/react";
import { CnButton } from "../CnButton";
import type { CnToastPosition } from "./CnToast";
import { CnToastProvider, useToast } from "./CnToast";
import { CnToastSkeleton } from "./CnToastSkeleton";

const meta: Meta<typeof CnToastProvider> = {
  title: "Feedback/CnToast",
  component: CnToastProvider,
  tags: ["autodocs"],
  args: { position: "top-right", max: 4 },
  argTypes: {
    position: {
      control: "select",
      options: [
        "top-right",
        "top-center",
        "top-left",
        "bottom-right",
        "bottom-center",
        "bottom-left",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CnToastProvider>;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const Buttons = () => {
  const toast = useToast();
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <CnButton color="success" onClick={() => toast.success("Cliente guardado")}>
        Éxito
      </CnButton>
      <CnButton color="info" onClick={() => toast.info("Hay 3 tareas nuevas")}>
        Info
      </CnButton>
      <CnButton color="warning" onClick={() => toast.warning("Tu sesión expira en 5 minutos")}>
        Advertencia
      </CnButton>
      <CnButton
        color="error"
        onClick={() =>
          toast.error({
            response: {
              data: {
                message: "No se pudo guardar",
                errors: {
                  rfc: ["El RFC ya está registrado"],
                  "contacts.0.email": ["Correo inválido"],
                },
              },
            },
          })
        }
      >
        Error de API
      </CnButton>
      <CnButton
        variant="outlined"
        onClick={() =>
          toast.success("Registro eliminado", {
            action: { label: "Deshacer", onClick: () => toast.info("Restaurado") },
          })
        }
      >
        Con acción
      </CnButton>
      <CnButton
        variant="outlined"
        onClick={() =>
          void toast
            .promise(wait(1500), { loading: "Generando reporte…", success: "Reporte listo" })
            .catch(() => {})
        }
      >
        Promesa
      </CnButton>
      <CnButton variant="text" color="neutral" onClick={() => toast.dismiss()}>
        Cerrar todos
      </CnButton>
    </Stack>
  );
};

export const Playground: Story = {
  render: (args) => (
    <CnToastProvider position={args.position as CnToastPosition} max={args.max}>
      <Buttons />
    </CnToastProvider>
  ),
};

const SkeletonButton = () => {
  const toast = useToast();
  return (
    <CnButton
      variant="outlined"
      onClick={() => {
        const id = toast({
          severity: "success",
          message: "…",
          action: { label: "Ver", onClick: () => {} },
          skeleton: true,
          duration: null,
        });
        void wait(1500).then(() =>
          toast.update(id, {
            severity: "success",
            message: "Pedido #1024 confirmado",
            action: { label: "Ver", onClick: () => {} },
          }),
        );
      }}
    >
      Aviso con skeleton
    </CnButton>
  );
};

/** Estado de carga: `CnToastSkeleton` suelto o la opción `skeleton` de un aviso. */
export const Skeleton: Story = {
  render: () => (
    <CnToastProvider>
      <Stack spacing={2} alignItems="flex-start">
        <SkeletonButton />
        <CnToastSkeleton severity="success" />
        <CnToastSkeleton severity="info" lines={2} />
        <CnToastSkeleton severity="warning" action />
        <CnToastSkeleton severity="error" details={2} />
        <CnToastSkeleton severity="loading" />
      </Stack>
    </CnToastProvider>
  ),
};
