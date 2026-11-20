# CLAUDE.md

Las instrucciones para agentes de este repositorio están en [`AGENTS.md`](./AGENTS.md). Léelo
completo antes de cambiar código: arquitectura, definición de terminado de un componente, regla de
utilidad primero, flujo de ramas y versiones, comandos de verificación y errores comunes.

Lo mínimo, por si solo lees esto:

- Nunca menciones sistemas externos de referencia ni prefijos de componentes ajenos.
- Nunca agregues atribución a IA en commits ni PRs.
- Interfaz y documentación en español; colores con tokens `--cn-*`.
- Componente nuevo: `npm run new:component -- CnNombre --category <categoria>`.
- Antes de terminar: `npm run docs:catalog` y `npm run verify:all`.
