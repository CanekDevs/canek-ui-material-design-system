import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import type { Meta, StoryObj } from "@storybook/react";
import type { ProfilerOnRenderCallback, ReactNode } from "react";
import { Profiler, useEffect, useRef, useState } from "react";
import { CnAutocompleteField } from "../components/CnAutocompleteField";
import { CnForm } from "../components/CnForm";
import type { CnFieldOption, CnFormField } from "../components/CnForm";
import { CnSelectField } from "../components/CnSelectField";
import { CnTransferListField } from "../components/CnTransferListField";
import { CnTreeSelectField } from "../components/CnTreeSelectField";
import type { CnTreeOption } from "../components/CnTreeSelectField";
import type { CnLoadOptionsContext } from "./use-async-options";

const meta: Meta = {
  title: "Forms/Large lists",
  parameters: {
    docs: {
      description: {
        component:
          "Listas con miles de registros: virtualización automática (>100 opciones), " +
          "carga paginada con scroll infinito, `resolveOptions` para formularios de edición, " +
          "filtro sin acentos precalculado y `maxResults`. El contador muestra commits de React, " +
          "tiempo de render y filas realmente presentes en el DOM.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Datos de ejemplo ───────────────────────────────────────────────────────

const FIRST = ["Ana", "Luis", "María", "Jorge", "Sofía", "Diego", "Valeria", "Andrés", "Lucía"];
const LAST = ["López", "Pérez", "Hernández", "Ramírez", "Torres", "Morales", "Núñez", "Ávila"];
const CITIES = ["Guadalajara", "Monterrey", "Mérida", "Querétaro", "Puebla", "León", "Tijuana"];

const personAt = (index: number): CnFieldOption => ({
  value: index + 1,
  label: `${FIRST[index % FIRST.length]} ${LAST[(index * 7) % LAST.length]} #${index + 1}`,
  description: CITIES[(index * 3) % CITIES.length],
  initials: true,
  group: CITIES[(index * 3) % CITIES.length],
});

const TEN_THOUSAND: CnFieldOption[] = Array.from({ length: 10_000 }, (_, index) => {
  const { group: _group, ...person } = personAt(index);
  return person;
});
const GROUPED: CnFieldOption[] = Array.from({ length: 10_000 }, (_, index) => personAt(index));

/** Servidor simulado de 100,000 registros con latencia, filtros y errores opcionales. */
const SERVER_ROWS = 100_000;
const createServer = (options: { latency?: number; errorRate?: () => number } = {}) => {
  const { latency = 450, errorRate = () => 0 } = options;
  const searchIndex: string[] = [];
  const textAt = (index: number) => {
    if (searchIndex[index] === undefined) {
      searchIndex[index] = personAt(index).label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    }
    return searchIndex[index];
  };
  return {
    load: ({ input, page, pageSize, signal }: CnLoadOptionsContext) =>
      new Promise<{ options: CnFieldOption[]; hasMore: boolean; total: number }>(
        (resolve, reject) => {
          const timer = setTimeout(
            () => {
              if (page > 0 && Math.random() < errorRate()) {
                reject(new Error("El servidor no respondió"));
                return;
              }
              const needle = input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
              const matches: number[] = [];
              for (let index = 0; index < SERVER_ROWS; index += 1) {
                if (!needle || textAt(index).includes(needle)) matches.push(index);
              }
              const slice = matches.slice(page * pageSize, (page + 1) * pageSize);
              resolve({
                options: slice.map((index) => {
                  const { group: _group, ...person } = personAt(index);
                  return person;
                }),
                hasMore: (page + 1) * pageSize < matches.length,
                total: matches.length,
              });
            },
            latency + Math.random() * latency,
          );
          signal.addEventListener("abort", () => clearTimeout(timer));
        },
      ),
    resolve: async (values: Array<string | number>) => {
      await new Promise((done) => setTimeout(done, latency));
      return values.map((value) => {
        const { group: _group, ...person } = personAt(Number(value) - 1);
        return person;
      });
    },
  };
};

// ─── Contador de renders ────────────────────────────────────────────────────

type Stats = { commits: number; last: number; total: number; rows: number };

/** Muestra commits de React, duración del último render y filas presentes en el DOM. */
const RenderStats = ({ id, children }: { id: string; children: ReactNode }) => {
  const statsRef = useRef<Stats>({ commits: 0, last: 0, total: 0, rows: 0 });
  const [stats, setStats] = useState<Stats>(statsRef.current);
  const onRender: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
    statsRef.current = {
      ...statsRef.current,
      commits: statsRef.current.commits + 1,
      last: actualDuration,
      total: statsRef.current.total + actualDuration,
    };
  };
  useEffect(() => {
    const timer = setInterval(() => {
      const rows = document.querySelectorAll("[role='option'], [role='treeitem']").length;
      setStats({ ...statsRef.current, rows });
    }, 400);
    return () => clearInterval(timer);
  }, []);
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Box
        data-render-stats={id}
        sx={{
          fontFamily: "monospace",
          fontSize: 12,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
          color: "var(--cn-color-text-muted, #6e7682)",
        }}
      >
        commits: {stats.commits} · último render: {stats.last.toFixed(1)} ms · acumulado:{" "}
        {stats.total.toFixed(0)} ms · filas en el DOM: {stats.rows}
      </Box>
      <Profiler id={id} onRender={onRender}>
        {children}
      </Profiler>
    </Box>
  );
};

// ─── Historias ──────────────────────────────────────────────────────────────

/** 10,000 opciones locales: se virtualizan solas y el filtro sin acentos está precalculado. */
export const StaticTenThousand: Story = {
  name: "10,000 opciones locales",
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 520 }}>
      <RenderStats id="autocomplete">
        <CnAutocompleteField
          label="Autocomplete (10,000)"
          options={TEN_THOUSAND}
          placeholder="Busca por nombre o número"
          helperText="Escribe 'nunez' o '#9999'. Fin/Inicio llegan a los extremos."
        />
      </RenderStats>
      <RenderStats id="autocomplete-max">
        <CnAutocompleteField
          label="Autocomplete con maxResults=50"
          options={TEN_THOUSAND}
          maxResults={50}
          multiple
        />
      </RenderStats>
      <RenderStats id="select">
        <CnSelectField
          label="Select múltiple agrupado (10,000)"
          options={GROUPED}
          multiple
          chips
          selectAll
          helperText="Menú virtual con buscador, marcas y 'Seleccionar todo' sobre lo filtrado."
        />
      </RenderStats>
    </Stack>
  ),
};

/** 100,000 registros en un servidor simulado: páginas de 50, latencia y errores. */
export const ServerHundredThousand: Story = {
  name: "100,000 en servidor (paginado)",
  render: function Render() {
    const [errors, setErrors] = useState(false);
    const errorsRef = useRef(errors);
    errorsRef.current = errors;
    const [server] = useState(() =>
      createServer({ errorRate: () => (errorsRef.current ? 0.35 : 0) }),
    );
    return (
      <Stack spacing={3} sx={{ maxWidth: 520 }}>
        <FormControlLabel
          control={<Switch checked={errors} onChange={(_, next) => setErrors(next)} />}
          label="Simular errores al cargar más páginas (35%)"
        />
        <RenderStats id="remote-autocomplete">
          <CnAutocompleteField
            label="Cliente (autocomplete)"
            loadOptions={server.load}
            pageSize={50}
            cacheKey="story-clientes"
            helperText="Desplázate para cargar más; cambia la búsqueda para cancelar la anterior."
          />
        </RenderStats>
        <RenderStats id="remote-min">
          <CnAutocompleteField
            label="Cliente (mínimo 3 caracteres)"
            loadOptions={server.load}
            minSearchLength={3}
            multiple
            cacheKey="story-clientes"
          />
        </RenderStats>
        <RenderStats id="remote-select">
          <CnSelectField
            label="Cliente (select)"
            loadOptions={server.load}
            resolveOptions={server.resolve}
            cacheKey="story-clientes"
          />
        </RenderStats>
      </Stack>
    );
  },
};

/** Formulario de edición: los ids guardados se resuelven sin descargar la lista. */
export const EditFormResolve: Story = {
  name: "Edición con resolveOptions",
  render: function Render() {
    const [server] = useState(() => createServer({ latency: 300 }));
    const fields: CnFormField[] = [
      {
        name: "owner",
        type: "select",
        label: "Responsable",
        loadOptions: server.load,
        resolveOptions: server.resolve,
        pageSize: 50,
        optionsCacheKey: "story-edit",
      },
      {
        name: "watchers",
        type: "autocomplete",
        label: "Observadores",
        multiple: true,
        loadOptions: server.load,
        resolveOptions: server.resolve,
        optionsCacheKey: "story-edit",
      },
      {
        name: "team",
        type: "transferlist",
        label: "Equipo",
        loadOptions: server.load,
        resolveOptions: server.resolve,
        pageSize: 50,
        optionsCacheKey: "story-edit",
      },
    ];
    return (
      <RenderStats id="edit-form">
        <CnForm
          fields={fields}
          defaultValues={{ owner: 87_654, watchers: [12, 45_678, 99_999], team: [3, 70_001] }}
          onSubmit={() => {}}
        />
      </RenderStats>
    );
  },
};

const TREE: CnTreeOption[] = Array.from({ length: 50 }, (_, region) => ({
  value: `r${region}`,
  label: `Región ${region + 1}`,
  icon: "apartment",
  children: Array.from({ length: 99 }, (_, branch) => ({
    value: `r${region}-s${branch}`,
    label: `Sucursal ${CITIES[(region + branch) % CITIES.length]} ${region + 1}-${branch + 1}`,
  })),
}));

/** 5,000 nodos: se virtualiza el árbol visible (expandido o filtrado). */
export const TreeSelectFiveThousand: Story = {
  name: "TreeSelect con 5,000 nodos",
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 520 }}>
      <RenderStats id="tree">
        <CnTreeSelectField
          label="Sucursales"
          options={TREE}
          multiple
          defaultExpandAll
          helperText="Inicio/Fin, Re Pág/Av Pág y búsqueda sobre los 5,000 nodos."
        />
      </RenderStats>
    </Stack>
  ),
};

/** 5,000 elementos: ambas listas se virtualizan. */
export const TransferListFiveThousand: Story = {
  name: "TransferList con 5,000 elementos",
  render: () => (
    <RenderStats id="transfer">
      <CnTransferListField
        label="Permisos"
        options={TEN_THOUSAND.slice(0, 5000)}
        defaultValue={Array.from({ length: 1200 }, (_, index) => index * 3 + 1)}
        listHeight={320}
      />
    </RenderStats>
  ),
};
