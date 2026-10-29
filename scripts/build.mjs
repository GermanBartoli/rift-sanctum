import { mkdir, cp, readFile } from "node:fs/promises";
const catalog = JSON.parse(await readFile("public/data/catalog.json", "utf8"));
for (const key of ["backgrounds", "icons", "frames"]) {
  if (!Array.isArray(catalog[key]) || !catalog[key].length)
    throw new Error(`Catálogo vacío: ${key}`);
}
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
console.log(
  `Sitio generado: ${catalog.backgrounds.length} fondos, ${catalog.icons.length} íconos y ${catalog.frames.length} marcos.`,
);
