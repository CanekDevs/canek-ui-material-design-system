## Listas grandes (miles de opciones)

Los campos con opciones (`CnSelectField`, `CnAutocompleteField`, `CnCountryField`,
`CnTreeSelectField`, `CnTransferListField` y las sugerencias de `CnSearchField`) están
preparados para cientos de miles de registros sin cargar todo de una vez ni pintar miles de
nodos.

### 1. Virtualización automática

Solo se pintan las filas visibles (más un margen). Se activa sola con **más de 100
opciones** y se controla con `virtualize`:

```tsx
<CnAutocompleteField options={diezMil} />          // automático (>100)
<CnSelectField options={lista} virtualize={false} />  // nunca
<CnTreeSelectField options={arbol} virtualize={50} /> // umbral propio
```

- **Autocomplete / país**: listbox virtual dentro de MUI (`slotProps.listbox`); conserva
  grupos, avatares/iconos/banderas, `aria-setsize`/`aria-posinset` y el teclado de MUI
  (flechas, Re/Av Pág, Inicio/Fin llegan a los extremos).
- **Select**: al virtualizar abre un menú propio con buscador, `aria-activedescendant`,
  marcas en selección múltiple y `selectAll` ("Seleccionar todo" sobre lo filtrado). Sin
  buscador (`searchable={false}`) admite búsqueda por tecleo.
- **TreeSelect**: virtualiza el árbol visible (expandido o filtrado); el foco por teclado
  alcanza nodos fuera de la ventana.
- **TransferList**: ambas listas, con foco itinerante (una sola fila tabulable).

Para listas propias: `useVirtualList({ count, itemSize | estimateSize, overscan,
onEndReached })` devuelve `scrollRef`, `items`, `totalSize`, `scrollToIndex` y
`measureElement`; `getVirtualSlots(items, totalSize)` intercala los huecos.

### 2. Carga paginada desde el servidor

`loadOptions` puede devolver un arreglo (como antes) **o una página**:

```tsx
const loadOptions = async ({ input, page, pageSize, signal }) => {
  const res = await fetch(
    `/api/clientes?q=${encodeURIComponent(input)}&page=${page}&size=${pageSize}`,
    { signal },
  );
  const { items, total } = await res.json();
  return {
    options: items.map((c) => ({ value: c.id, label: c.nombre })),
    hasMore: (page + 1) * pageSize < total,
    total,
  };
};

<CnAutocompleteField loadOptions={loadOptions} pageSize={50} minSearchLength={2} />;
```

- Scroll infinito: al acercarse al final se pide la siguiente página, con fila
  "Cargando más…" y fila "Reintentar" si falla. Se detiene con `hasMore: false`.
- Búsqueda con espera (`searchDebounceMs`, 300 ms) y **cancelación**: cada búsqueda nueva
  aborta la anterior (`signal`).
- `minSearchLength` muestra "Escribe al menos N caracteres"; sin coincidencias, "Sin
  resultados"; con `total`, el pie "Mostrando 50 de 12,340".
- **Caché LRU por búsqueda** (30 búsquedas). `cacheKey` la comparte entre campos;
  cambiar `loadOptionsDeps` (o `dependsOn` en `CnForm`) la invalida. `clearOptionsCache(key)`
  la vacía a mano.
- En `CnSelectField` y `CnTransferListField`, pasar `loadOptions` activa el buscador remoto
  y el scroll infinito ("Mover todos" mueve solo lo cargado).

### 3. Valores seleccionados fuera de la página

Al editar un registro el valor guardado (ids) puede no estar en la primera página:

```tsx
<CnAutocompleteField
  multiple
  loadOptions={loadOptions}
  resolveOptions={async (ids, { signal }) => api.clientesPorId(ids, { signal })}
  value={[1200, 98765]}
/>
```

`resolveOptions(values)` se llama **una vez por lote** de valores desconocidos y se guarda en
una pequeña caché (compartida con `cacheKey`). Alternativas: `selectedOptions` (opciones ya
conocidas) o `getValueLabel(value)` como etiqueta de respaldo.

### 4. Arreglos locales grandes

- Filtro sin acentos ni mayúsculas, por palabras, con el texto normalizado **precalculado**
  por opción (no se normaliza en cada tecla).
- `maxResults` limita lo que se pinta y muestra "N más, refina tu búsqueda".
- `filterOptions(options, input)` reemplaza el filtro.

### 5. En `CnForm`

```ts
{
  name: "cliente",
  type: "select",            // también autocomplete, transferlist
  loadOptions: ({ input, page, pageSize, signal, formValues }) => api.buscar(...),
  resolveOptions: (ids, { signal, formValues }) => api.porId(ids),
  pageSize: 50,              // en select/transferlist activa la búsqueda en servidor
  virtualize: true,          // select, autocomplete, country, treeselect, transferlist, search
  maxResults: 100,           // select, autocomplete, country, search (maxSuggestions)
  optionsCacheKey: "clientes",
}
```

`getOptionLabel` también sirve de respaldo para valores sin resolver. Un `select` cuyo
`loadOptions` devuelve páginas pasa solo a modo servidor; con un arreglo se comporta como
siempre (carga al montar).

### Recomendaciones

- Más de ~1,000 registros o datos que cambian: `loadOptions` paginado + `resolveOptions`.
- Hasta ~50,000 opciones fijas (catálogos): arreglo local; la virtualización y el filtro
  precalculado bastan. Declara el arreglo fuera del componente (o con `useMemo`) para
  aprovechar la caché del texto normalizado.
- Usa `pageSize` entre 25 y 100 y devuelve `total` cuando sea barato calcularlo.
- `minSearchLength` de 2–3 en catálogos enormes donde listar sin filtro no aporta.
- `treeselect` necesita el árbol completo (sin paginación); se virtualiza igual.
