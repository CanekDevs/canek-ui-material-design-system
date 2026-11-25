import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { catalogDocs } from "../../catalog";
import { CnButton } from "../CnButton";
import type { CnFilterBarProps, CnFilterDefinition, CnFilterValue } from "./CnFilterBar";
import { CnFilterBar } from "./CnFilterBar";
import { CnFilterBarSkeleton } from "./CnFilterBarSkeleton";

const FILTERS: CnFilterDefinition[] = [
  {
    id: "stage",
    label: "Etapa",
    type: "multiselect",
    options: [
      { value: "lead", label: "Prospecto" },
      { value: "qualified", label: "Calificado" },
      { value: "proposal", label: "Propuesta" },
      { value: "negotiation", label: "Negociación" },
    ],
  },
  {
    id: "owner",
    label: "Responsable",
    type: "select",
    options: [
      { value: "carlos", label: "Carlos Méndez" },
      { value: "lucia", label: "Lucía Ramírez" },
      { value: "ana", label: "Ana Torres" },
    ],
  },
  { id: "company", label: "Empresa", type: "text", placeholder: "Nombre o RFC" },
];

const QUICK = [
  { id: "mine", label: "Mis oportunidades", icon: "person", count: 12 },
  { id: "overdue", label: "Actividad vencida", icon: "warning", count: 3 },
  { id: "closing", label: "Cierran este mes", icon: "event", count: 5 },
];

const VIEWS = [
  { id: "all", label: "Todas las oportunidades" },
  { id: "q4", label: "Cierre del 4.º trimestre" },
];

const Demo = (props: Partial<CnFilterBarProps>) => {
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState<string[]>(["mine"]);
  const [values, setValues] = useState<Record<string, CnFilterValue | undefined>>({
    stage: ["proposal", "negotiation"],
  });
  const [views, setViews] = useState(VIEWS);
  const [view, setView] = useState("all");
  return (
    <CnFilterBar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar oportunidades"
      quickFilters={QUICK}
      activeQuickFilters={quick}
      onQuickFiltersChange={setQuick}
      filters={FILTERS}
      values={values}
      onValuesChange={setValues}
      views={views}
      activeViewId={view}
      onViewChange={setView}
      onSaveView={(name) => {
        const id = `v${views.length}`;
        setViews((current) => [...current, { id, label: name }]);
        setView(id);
      }}
      resultCount={24}
      resultNoun="oportunidades"
      actions={
        <CnButton variant="outlined" color="neutral" startIcon="download">
          Exportar
        </CnButton>
      }
      {...props}
    />
  );
};

const meta: Meta<typeof CnFilterBar> = {
  title: "Data Display/CnFilterBar",
  component: CnFilterBar,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("CnFilterBar") } } },
  render: (args) => <Demo {...args} />,
};

export default meta;
type Story = StoryObj<typeof CnFilterBar>;

export const Default: Story = {};

export const SearchAndFilters: Story = {
  args: { views: [], quickFilters: [], actions: undefined },
};

export const QuickFiltersOnly: Story = {
  render: () => {
    const QuickOnly = () => {
      const [quick, setQuick] = useState<string[]>([]);
      return (
        <CnFilterBar
          quickFilters={QUICK}
          activeQuickFilters={quick}
          onQuickFiltersChange={setQuick}
        />
      );
    };
    return <QuickOnly />;
  },
};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      <CnFilterBarSkeleton views />
      <CnFilterBar skeleton onSearchChange={() => undefined} quickFilters={QUICK} />
    </Box>
  ),
};

const LONG =
  "Comercializadora Internacional de Productos Industriales y Servicios Logísticos del Bajío, S.A.P.I. de C.V.";

/** Datos extremos (textos de 100+ caracteres, conteos enormes) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box sx={{ border: "1px dashed var(--cn-color-border, #dde0e4)", p: "4px" }}>
            <Demo
              views={[{ id: "all", label: LONG }]}
              activeViewId="all"
              quickFilters={[
                ...QUICK,
                { id: "x", label: "SINESPACIOSSINESPACIOSSINESPACIOS", count: 123456 },
              ]}
              values={{ company: LONG }}
              resultCount={1234567}
            />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};
