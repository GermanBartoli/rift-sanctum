# Publicación automática

`.github/workflows/cloudflare.yml` publica cada push a `main` en el proyecto Cloudflare Pages `rift-sanctum`. Primero verifica el acceso al proyecto y luego ejecuta `npm ci`, `npm test` y `npm run build`; si fallan, no publica. Usa `cloudflare/wrangler-action@v4`, que incluye Wrangler 4. Wrangler incluye `functions/` junto con `dist/`. También admite ejecución manual desde Actions.

## Credenciales de GitHub Actions

En los secretos de Actions del repositorio deben existir:

- `CLOUDFLARE_API_TOKEN`: token vigente con permiso Account / Cloudflare Pages / Edit, limitado a la cuenta que contiene el proyecto.
- `CLOUDFLARE_ACCOUNT_ID`: ID de esa misma cuenta (32 caracteres hexadecimales). No usar el ID de zona ni el nombre del proyecto.

No guardar valores en archivos. La sesión local de Wrangler y la conexión de Cloudflare en Codex no autentican GitHub Actions. Conservar `RIOT_API_KEY` como secreto del proyecto Pages; no sustituye el token de publicación.

## Error de autenticación 10000

El intento 2 de la ejecución `41054629898` del 30/10/2026 pasó las seis pruebas y el build, pero Cloudflare rechazó la consulta al proyecto con `Authentication error [code: 10000]`. Ambos secretos estaban presentes; eso no garantiza que sus valores sean válidos ni que tengan permisos suficientes.

Comprobar la cuenta del proyecto en Cloudflare y reemplazar el secreto `CLOUDFLARE_API_TOKEN` por un token vigente con el permiso indicado. Corregir también `CLOUDFLARE_ACCOUNT_ID` si pertenece a otra cuenta. No reutilizar una clave de Riot, una Global API Key ni un token de otro servicio como API token de Cloudflare.

Después de actualizar los secretos, reintentar el trabajo fallido en Actions. Para ejecutar cambios del workflow, primero deben publicarse en `main` y luego iniciarse una nueva ejecución; reintentar una ejecución anterior conserva su versión del workflow.

Comprobar el resultado en Actions y el despliegue en https://rift-sanctum.pages.dev/. Las credenciales corregidas se verificaron con la publicación exitosa del intento 3 de la ejecución 41054629898.

Referencia: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
