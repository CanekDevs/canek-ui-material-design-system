import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/react";
import { CnButton } from "../CnButton";
import { CnConfirmProvider, useConfirm } from "../CnConfirmDialog";
import { CnMetricCard } from "../CnMetricCard";
import { CnToastProvider, useToast } from "../CnToast";
import { CnPageContainer } from "./CnPageContainer";

const meta: Meta<typeof CnPageContainer> = {
  title: "Layout/CnPageContainer",
  component: CnPageContainer,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CnPageContainer>;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const Actions = () => {
  const confirm = useConfirm();
  const toast = useToast();
  return (
    <>
      <CnButton
        variant="outlined"
        color="neutral"
        startIcon="download"
        onClick={() =>
          void toast.promise(wait(1200), {
            loading: "Generando reporte…",
            success: "Reporte listo para descargar",
          })
        }
      >
        Exportar
      </CnButton>
      <CnButton
        variant="outlined"
        color="error"
        startIcon="delete"
        onClick={async () => {
          const ok = await confirm({
            variant: "delete",
            title: "¿Eliminar a ACME Corp?",
            message: "Se eliminarán también sus 12 contratos. Esta acción no se puede deshacer.",
            requireText: "ACME",
            onConfirm: () => wait(800),
          });
          if (ok) {
            toast.success("Cliente eliminado", {
              action: { label: "Deshacer", onClick: () => toast.info("Restaurado") },
            });
          }
        }}
      >
        Eliminar
      </CnButton>
      <CnButton
        startIcon="save"
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
        Guardar
      </CnButton>
    </>
  );
};

const Page = ({ loading = false }: { loading?: boolean }) => (
  <CnToastProvider>
    <CnConfirmProvider>
      <CnPageContainer
        title="ACME Corp"
        subtitle="Cliente desde marzo de 2020 · RFC ACM010101AB1"
        icon="apartment"
        back
        onNavigate={() => {}}
        breadcrumbs={[
          { label: "Inicio", href: "#", icon: "home" },
          { label: "Clientes", href: "#" },
          { label: "ACME Corp" },
        ]}
        actions={<Actions />}
        loading={loading}
        maxWidth="lg"
      >
        <Box
          sx={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          }}
        >
          <CnMetricCard
            title="Ventas del mes"
            value={1284500}
            format={money}
            icon="payments"
            trend={{ value: 12.4, label: "vs. mes anterior" }}
            sparkline={[8, 9, 7, 11, 10, 13, 14]}
          />
          <CnMetricCard
            title="Costos operativos"
            value={384200}
            format={money}
            icon="receipt_long"
            color="warning"
            trend={{ value: 6.1, upIsGood: false, label: "vs. mes anterior" }}
            sparkline={[5, 6, 6, 7, 7, 8, 9]}
            sparklineType="bar"
          />
          <CnMetricCard
            title="Meta trimestral"
            value={68}
            suffix="%"
            icon="flag"
            color="success"
            progress={{ value: 68, label: "6.8 de 10 M" }}
          />
          <CnMetricCard
            title="Tickets abiertos"
            value={23}
            icon="support_agent"
            variant="filled"
            color="primary"
            trend={{ value: -18, label: "esta semana" }}
            footer="Actualizado hace 5 min"
            onClick={() => {}}
          />
        </Box>
      </CnPageContainer>
    </CnConfirmProvider>
  </CnToastProvider>
);

export const Complete: Story = { render: () => <Page /> };
export const Loading: Story = { render: () => <Page loading /> };
