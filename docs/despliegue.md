# Publicación automática

`.github/workflows/cloudflare.yml` publica cada push a `main` en el proyecto Cloudflare Pages `rift-sanctum`. Primero ejecuta `npm ci`, `npm test` y `npm run build`; si fallan, no publica. Wrangler incluye `functions/` junto con `dist/`. También admite ejecución manual desde Actions.

## Configuración inicial pendiente de verificar

En los secretos de Actions del repositorio deben existir `CLOUDFLARE_API_TOKEN` (permiso Account / Cloudflare Pages / Edit para la cuenta del proyecto) y `CLOUDFLARE_ACCOUNT_ID`. No guardar valores en archivos. La sesión local de Wrangler no autentica GitHub Actions. Conservar `RIOT_API_KEY` como secreto del proyecto Pages.

Después de subir el workflow, comprobar la ejecución en Actions y el despliegue en https://rift-sanctum.pages.dev/. Sin esos secretos no puede publicarse. No se ha ejecutado un despliegue desde este workflow todavía.

Referencia: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
