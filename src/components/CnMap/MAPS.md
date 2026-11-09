# Mapas en Canek: evaluación del Styling Wizard de Google

> Revisado contra la documentación oficial de Google Maps Platform (noviembre 2026).

## ¿Se puede integrar el Styling Wizard (mapstyle.withgoogle.com)?

**Sí, pero no con el iframe que usábamos.** El JSON que exporta el wizard es un arreglo de
`MapTypeStyle` (`featureType` / `elementType` / `stylers`). Ese JSON solo lo aplican:

| Superficie                                     | ¿Acepta el JSON del wizard?                                                                            | Requisitos                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Iframe `maps.google.com/maps?...&output=embed` | **No.** No admite estilos.                                                                             | Ninguno (no oficial, sin key)     |
| Maps Embed API (`/maps/embed/v1/...`)          | **No.** Sin parámetro de estilos.                                                                      | API key (uso ilimitado sin costo) |
| Maps JavaScript API, mapa raster sin `mapId`   | **Sí**, en `MapOptions.styles` (o `map.setOptions`).                                                   | API key + facturación             |
| Maps JavaScript API con `mapId` / vectorial    | **No.** La referencia indica que `styles` no está disponible con `mapId`; se usa el estilo de la nube. | API key + `mapId` + facturación   |
| Maps Static API                                | **Sí**, convirtiendo cada regla a un parámetro `style=feature:…\|element:…\|color:0xRRGGBB`.           | API key + facturación             |

Notas sobre el wizard: Google ya no lo presenta como la vía principal; la documentación recomienda
**Cloud-based maps styling** (estilos administrados en la consola, ligados a un `mapId`). El JSON
«embebido» sigue documentado y no aparece como deprecado, pero Google aconseja preferir `color`
absoluto sobre `hue`/`lightness`/`saturation`/`gamma`/`invert_lightness`, porque estos dependen del
estilo base y pueden cambiar. El editor de estilos «legacy» de la nube se retiró a partir del
18-mar-2025 (migración automática), y el esquema JSON de la nube es distinto e incompatible con el
del wizard (se puede **importar** el JSON del wizard en la consola para crear un estilo de nube).

## Qué ruta usar y cuándo

1. **Sin API key** (estado actual de muchos consumidores): iframe embebido. Funciona igual que
   antes, sin estilos. `CnMap` cae aquí automáticamente y muestra «Abrir en Google Maps».
2. **API key, sin `mapId`**: Maps JavaScript API raster + `styles`. Aquí entra el JSON del wizard
   tal cual (`<CnMap styles={json} />`) o los presets de Canek (`stylePreset`). Marcadores clásicos
   (`google.maps.Marker`, deprecado desde feb-2024 pero sin fecha de retiro).
3. **API key + `mapId`** (recomendado para producción): estilo administrado en la consola,
   cambiable sin desplegar, modo oscuro con `colorScheme`, y marcadores avanzados
   (`AdvancedMarkerElement`, que **requiere** `mapId`; `DEMO_MAP_ID` sirve solo para pruebas y no
   aplica estilos de nube). Si se pasan `mapId` y `styles`, `mapId` gana y `styles` se ignora.
4. **Imagen estática** (PDF, impresión, correos, export PNG): `getStaticMapUrl()` convierte el mismo
   JSON del wizard a parámetros `style=` de la Static API.

## Requisitos

- Proyecto de Google Cloud con **facturación activa** y la API correspondiente habilitada (Maps
  JavaScript API y/o Maps Static API). Cada carga de mapa dinámico se cobra en el SKU _Dynamic Maps_
  (el uso de `mapId` también); revisar el crédito mensual vigente en la página de precios.
- API key **restringida por referrer HTTP** (dominios propios) y por API. La key viaja al navegador
  (es pública por diseño); la restricción es la protección real.
- Carga: usamos el mecanismo del _dynamic library import_ oficial (`google.maps.importLibrary`,
  parámetros `key`, `v=weekly`, `language`, `region`, `libraries`, `mapIds`,
  `authReferrerPolicy`). La API solo se carga una vez por página; una segunda carga con otras
  opciones se ignora (Google lo advierte en consola).

## Limitaciones

- El JSON del wizard **no** aplica a mapas vectoriales ni con `mapId`; en satélite/híbrido solo
  afecta etiquetas y geometría.
- Si el arreglo de estilos excede la longitud máxima, Google no aplica ningún estilo.
- En la Static API, la URL completa tiene límite de longitud (≈16 384 caracteres); estilos muy
  largos pueden no caber.
- Direcciones de texto (sin coordenadas) requieren geocodificación (Geocoding API, con costo);
  `CnMap` las muestra con el iframe embebido aunque haya key.
- `language` / `region` se fijan en la primera carga de la API para toda la página.
- Un error de autenticación (key inválida o referrer no permitido) lo pinta Google dentro del mapa;
  no lo detectamos desde el componente sin definir el global `gm_authFailure` (no lo hacemos para no
  contaminar `window`; la app puede definirlo si lo necesita).

## Privacidad y CSP

- Cualquier mapa (iframe o JS) envía al menos la IP, el referrer y las coordenadas mostradas a
  Google. Para datos sensibles (domicilios de personas) considerar `mapPreview: false` en celdas o
  pedir consentimiento.
- La carga JS añade un `<script>` de `maps.googleapis.com`; CSP mínima recomendada por Google:
  `script-src https://*.googleapis.com https://*.gstatic.com *.google.com 'unsafe-eval'` (requerido
  por algunas funciones), `img-src https://*.googleapis.com https://*.gstatic.com *.google.com
data: blob:`, `connect-src https://*.googleapis.com *.google.com https://*.gstatic.com data:
blob:`, `frame-src *.google.com`, `font-src https://fonts.gstatic.com`,
  `style-src 'unsafe-inline' https://fonts.googleapis.com`. Si usan nonce, pasar `nonce` a
  `CnMapsProvider`.
- El iframe embebido solo necesita `frame-src https://maps.google.com https://www.google.com`.
- `authReferrerPolicy: "origin"` reduce el referrer enviado (requiere que la restricción de la key
  sea solo el dominio, sin ruta).

## Storybook

Las historias leen `import.meta.env.STORYBOOK_GOOGLE_MAPS_KEY` (y opcionalmente
`STORYBOOK_GOOGLE_MAPS_MAP_ID`). Definirlas en `.env.local` en la raíz:

```
STORYBOOK_GOOGLE_MAPS_KEY=AIza...
STORYBOOK_GOOGLE_MAPS_MAP_ID=abcd1234
```

Sin esas variables, todas las historias muestran el iframe de respaldo (sin estilos).

## Fuentes

- Referencia de estilos JSON: https://developers.google.com/maps/documentation/javascript/style-reference
- `MapOptions` (`styles`, `mapId`, `colorScheme`): https://developers.google.com/maps/documentation/javascript/reference/map
- Cloud-based maps styling: https://developers.google.com/maps/documentation/javascript/cloud-customization
- Carga dinámica (`importLibrary`): https://developers.google.com/maps/documentation/javascript/load-maps-js-api
- Advanced markers (requieren `mapId`): https://developers.google.com/maps/documentation/javascript/advanced-markers/start
- Maps Embed API: https://developers.google.com/maps/documentation/embed/get-started
- Estilos en Static API: https://developers.google.com/maps/documentation/maps-static/styling
- Retiro del editor legacy de nube: https://developers.google.com/maps/documentation/javascript/cloud-customization/legacy-overview
