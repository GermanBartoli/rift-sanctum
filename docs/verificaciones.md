# Verificaciones de la primera versión

Publicado en [Cloudflare Pages](https://rift-sanctum.pages.dev/). Se comprobó HTTP 200 y coincidencia SHA-256 con el build local para `index.html`, `app.js`, `styles.css`, `data/catalog.json` y el fondo original. La revisión del sitio público no registró errores de consola.

- `node --check public/app.js`: sintaxis JavaScript válida.
- `npm test`: búsqueda por nombre, ID y campeón; normalización de acentos; validación de preferencias dañadas; correspondencia de rangos y maestrías con las capturas.
- `npm run build`: generación de `dist/` y validación de las tres colecciones.
- Navegador integrado: apertura de los paneles de rango y maestría mediante hover real y clic.
- Navegador integrado: búsqueda de Ahri, búsqueda del ícono 7167, selección de marco Diamante, guardado y permanencia al recargar. Marco Maestro restaurado después de la prueba.
- Vista de escritorio y móvil de 390 px: sin desbordamiento horizontal, diálogo utilizable y estado de búsqueda sin resultados.
- Recursos: descarga correcta de los archivos iniciales y comprobación HTTP de los 30 marcos remotos.

Las estadísticas del perfil no fueron verificadas contra la API de Riot: provienen de las capturas suministradas. No se comprobó individualmente cada imagen de los miles de elementos del catálogo.
