# Arquitectura

## Primera etapa: el perfil

La aplicación es estática y se publica en Cloudflare Pages. `profile.js` separa los valores transcritos de las capturas de la presentación. `catalog.json` contiene los metadatos de la colección; las imágenes se solicitan al navegar por ella. La paginación limita cada página a 24 elementos y las miniaturas usan carga diferida.

La apariencia usa tres identificadores: `background`, `icon` y `frame`. Antes de aplicarlos se comprueba que existan en el catálogo. El navegador persiste esos identificadores bajo `rift-sanctum:appearance:v1`; no almacena URLs arbitrarias ni datos de autenticación. Un valor inexistente o dañado vuelve al original. Si el navegador impide escribir en almacenamiento local, se informa y los cambios siguen visibles durante la sesión.

El personalizador trabaja con una copia temporal. Seleccionar recursos actualiza la vista previa; guardar los aplica al perfil. Cerrar con el botón, el fondo del diálogo o Escape descarta la copia. Restaurar original también requiere guardar para hacerse efectivo.

Los detalles de rango y maestría funcionan con hover, foco y clic. El diálogo nativo conserva el foco dentro del personalizador y lo devuelve al control de apertura al cerrar. Las pestañas admiten flechas, Inicio y Fin. Las animaciones respetan `prefers-reduced-motion`.

## Evolución prevista

1. Incorporar un servicio backend para resolver Riot ID y región LAS mediante una clave de Riot almacenada exclusivamente en el servidor.
2. Separar la identidad pública del jugador y la sesión del propietario. Verificar propiedad antes de permitir guardar cambios públicos.
3. Persistir perfiles y preferencias por usuario; definir permisos de lectura y escritura.
4. Incorporar rangos, estadísticas, maestrías e historial con caché, fechas de actualización, límites de uso y estados de error.
5. Añadir búsqueda real. La sección actual es informativa, sin resultados simulados.

Estas capacidades no están implementadas en esta entrega. No se creó una base de datos ni se almacenaron secretos de Riot.

## Mantenimiento

`npm run catalog` reconstruye la colección desde CommunityDragon. Las rutas `latest` pueden variar con las versiones del juego; conviene revisar los recursos después de actualizar el catálogo. Los recursos originales locales permiten que el primer perfil siga funcionando si esa fuente no responde.

La compilación verifica que las tres colecciones no estén vacías y copia únicamente `public/` a `dist/`. El servidor local limita el acceso a esa carpeta. Cloudflare recibe cabeceras de protección frente a inclusión en marcos y detección incorrecta de tipos MIME. No se requieren dependencias de ejecución.
