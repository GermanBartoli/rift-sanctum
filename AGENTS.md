# Rift Sanctum

Antes de cambiar las integraciones de Riot, leer [las políticas del proyecto](docs/POLITICAS_RIOT.md).

Proyecto personal. Antes de modificar el despliegue, leer [docs/despliegue.md](docs/despliegue.md).

Los pushes a main ejecutan pruebas, build y publicación en Cloudflare Pages mediante GitHub Actions. Preservar CRLF.

## WakaTime

Usar el cliente instalado en C:/Users/barto/.wakatime/wakatime-cli.exe con la configuración existente de C:/Users/barto/.wakatime.cfg. Registrar actividad real sobre los archivos trabajados con --entity y --write cuando corresponda. No copiar la clave al repositorio ni generar actividad simulada. Cuenta verificada: GermanBartoli.

## Desarrollo y verificación

La búsqueda de perfiles LAS y la partida en vivo usan `public/profile.js`, `public/live.js` y las funciones de `functions`. Revisá las pruebas de perfiles y de Riot al cambiar cómo se interpretan esas respuestas.

Corré `pnpm test` y `pnpm run build`. Para revisar la interfaz local usá `pnpm run dev`.

Consultá los pasos de publicación en [el flujo de GitHub Actions](.github/workflows/cloudflare.yml). Para verificar los dos sitios publicados, seguí [la guía de publicación](docs/PUBLICACION.md).
