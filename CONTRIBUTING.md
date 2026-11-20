# Contribuir

Gracias por ayudar a crecer el design system. La guía completa (arquitectura, definición de
terminado, reglas de gobierno y errores comunes) está en [`AGENTS.md`](./AGENTS.md); sirve igual
para personas y para agentes de IA.

## En resumen

1. **Busca antes de crear.** Revisa el catálogo (README, `docs/catalog.json`) y la hoja de ruta
   (`docs/ROADMAP.md`). Si un componente existente puede cubrir el caso con una prop o variante,
   se extiende; no se duplica.
2. **Rama desde `develop`** actualizado: `feat/*`, `fix/*`, `docs/*`, `chore/*`.
3. **Componente nuevo** con el andamiaje:

   ```bash
   npm run new:component -- CnNombre --category formularios
   ```

   Completa la lista que imprime: catálogo, historias (con `Responsive` a 320/480/1200 px), skeleton,
   pruebas de accesibilidad y teclado, exports, README y CHANGELOG.

4. **Verifica**:

   ```bash
   npm run docs:catalog
   npm run verify:all
   ```

5. **Commit** con Conventional Commits y sufijo de autor:
   `feat(price-tag): add CnPriceTag - por: Nombre Apellido`.
6. **PR hacia `develop`** con la plantilla completa.

## Reglas que revisa CI

Las pruebas de `src/__governance__` fallan si falta la entrada de catálogo, el skeleton, las
pruebas o las historias de un componente; si un export no llega a la entrada pública; si suben los
colores sin token; si las docs generadas están desactualizadas, o si aparece un nombre de un
sistema externo de referencia.

## Reportar errores o pedir componentes

Usa las plantillas de _Issues_: **Error** o **Solicitud de componente** (incluye las preguntas de
la regla de utilidad).
