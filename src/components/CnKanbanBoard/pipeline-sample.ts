import type { CnDealCardProps } from "../CnDealCard";
import type { CnKanbanColumn, CnKanbanItem } from "./CnKanbanBoard";

/** Datos de ejemplo de un embudo de ventas (historias y pruebas). */
export type SampleDeal = CnKanbanItem & Omit<CnDealCardProps, "title"> & { title: string };

export const SAMPLE_STAGES: CnKanbanColumn[] = [
  { id: "lead", title: "Prospecto", tone: "neutral" },
  { id: "qualified", title: "Calificado", tone: "info" },
  { id: "proposal", title: "Propuesta", tone: "primary", limit: 3 },
  { id: "negotiation", title: "Negociación", tone: "warning", limit: 2 },
  { id: "won", title: "Ganada", tone: "success" },
];

const deal = (
  id: string,
  columnId: string,
  title: string,
  company: string,
  value: number,
  probability: number,
  owner: string,
  extra: Partial<SampleDeal> = {},
): SampleDeal => ({
  id,
  columnId,
  title,
  label: title,
  company,
  value,
  amount: value,
  probability,
  owner: { name: owner },
  ...extra,
});

export const SAMPLE_DEALS: SampleDeal[] = [
  deal(
    "d1",
    "lead",
    "Renovación de flotilla",
    "Transportes del Norte",
    450000,
    10,
    "Lucía Ramírez",
  ),
  deal("d2", "lead", "Piloto de sensores", "Agroindustrias Sol", 120000, 15, "Carlos Méndez", {
    nextActivity: { label: "Primera llamada", due: "Hoy" },
  }),
  deal(
    "d3",
    "qualified",
    "Equipo de cómputo 2027",
    "Colegio Valle Alto",
    890000,
    30,
    "Ana Torres",
    {
      nextActivity: { label: "Visita a campus", due: "Lun 1 dic" },
    },
  ),
  deal(
    "d4",
    "proposal",
    "Licencias anuales planta Monterrey",
    "Grupo Altavista",
    1280000,
    60,
    "Carlos Méndez",
    {
      nextActivity: { label: "Demo con TI", due: "Jue 28 nov" },
      tags: ["Cliente clave"],
    },
  ),
  deal(
    "d5",
    "proposal",
    "Mantenimiento preventivo",
    "Hospital San Rafael",
    340000,
    50,
    "Lucía Ramírez",
    {
      nextActivity: { label: "Enviar propuesta", due: "Ayer", overdue: true },
    },
  ),
  deal(
    "d6",
    "negotiation",
    "Contrato marco 3 años",
    "Cadena Farmacias Vida",
    4200000,
    75,
    "Jorge Salinas",
    {
      nextActivity: { label: "Revisión legal", due: "Vie 29 nov" },
      tags: ["Legal"],
    },
  ),
  deal("d7", "negotiation", "Ampliación de bodega", "Logística Bajío", 760000, 70, "Ana Torres"),
  deal("d8", "negotiation", "Capacitación anual", "Grupo Altavista", 180000, 80, "Carlos Méndez"),
  deal("d9", "won", "Implementación ERP", "Muebles Arce", 2100000, 100, "Jorge Salinas", {
    status: "won",
  }),
];
