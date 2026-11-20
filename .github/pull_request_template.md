## Qué cambia

<!-- Una o dos frases en lenguaje de producto. Enlaza el issue si existe. -->

## Tipo

- [ ] Componente nuevo
- [ ] Mejora de un componente existente (prop, variante, comportamiento)
- [ ] Corrección
- [ ] Documentación, pruebas o mantenimiento

## Regla de utilidad (solo componentes nuevos)

<!-- Ver AGENTS.md → "Regla de utilidad primero". -->

- **Problema de producto que resuelve:**
- **Componente existente más cercano:**
- **Por qué no basta una prop, variante o composición del existente:**

## Definición de terminado

- [ ] Entrada en `src/catalog/entries` con _Para qué sirve_, _Cuándo NO usarlo_ y _Relación con vecinos_ (y fuera de `roadmap.ts` si estaba planeado)
- [ ] Historias con `catalogDocs("CnX")`, variantes, estados y `Responsive` revisada a 320 / 480 / 1200 px con datos extremos
- [ ] `CnXSkeleton` fiel a las medidas reales y prop `skeleton`
- [ ] Pruebas de comportamiento, accesibilidad, teclado y casos límite
- [ ] Exportado desde `index.ts` de la carpeta y desde la entrada correcta (`src/index.ts`, `src/charts.ts` o `src/rich-text.tsx`)
- [ ] Sección en el README y línea en `CHANGELOG.md` (`## [Sin publicar]`)
- [ ] Sin desbordes, colores con tokens, textos en español, sin nombres de sistemas externos
- [ ] `npm run docs:catalog` ejecutado y archivos generados versionados
- [ ] `npm run verify:all` en verde

## Capturas

<!-- Storybook: historia principal y Responsive. -->
