/** Ancho inicial (px) de cada tipo de celda; compartido por la tabla y su skeleton. */
export const DEFAULT_COLUMN_WIDTH: Partial<Record<string, number>> = {
  id: 150,
  code: 180,
  rfc: 220,
  curp: 280,
  number: 140,
  currency: 200,
  percent: 140,
  progress: 170,
  date: 200,
  datetime: 230,
  time: 140,
  duration: 140,
  boolean: 170,
  status: 170,
  tags: 230,
  avatar: 240,
  email: 280,
  phone: 210,
  link: 190,
  location: 240,
  image: 100,
  rating: 140,
  file: 230,
  color: 150,
  country: 200,
  json: 160,
  daterange: 260,
  bytes: 130,
  sparkline: 170,
  list: 220,
  coordinates: 220,
  masked: 190,
  delta: 150,
  priority: 150,
  deadline: 210,
  ip: 230,
  uuid: 210,
  version: 200,
  richtext: 280,
  icon: 180,
  toggle: 170,
  steps: 170,
  stage: 200,
  weekdays: 200,
  timerange: 190,
  age: 150,
  range: 250,
  sentiment: 170,
  score: 110,
  reference: 230,
  counter: 110,
};

/** Ancho cuando el tipo no tiene uno propio. */
export const FALLBACK_COLUMN_WIDTH = 190;

/** Relleno vertical de las celdas por densidad. */
export const DENSITY_PADDING = { compact: 6, comfortable: 10, spacious: 16 } as const;

/** Anchos de las columnas iniciales (selección, número de fila, detalle). */
export const LEAD_SELECT = 48;
export const LEAD_NUMBER = 52;
export const LEAD_EXPAND = 44;
