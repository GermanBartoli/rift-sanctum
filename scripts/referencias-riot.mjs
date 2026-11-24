import { writeFile } from "node:fs/promises";
const origen = "https://ddragon.leagueoflegends.com";
async function json(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw Error("Data Dragon " + r.status);
  return r.json();
}
const [version] = await json(origen + "/api/versions.json");
const base = origen + "/cdn/" + version + "/data/es_AR/";
const [c, o, h, arboles] = await Promise.all(
  ["champion.json", "item.json", "summoner.json", "runesReforged.json"].map(
    (x) => json(base + x),
  ),
);
const campeones = Object.fromEntries(
  Object.values(c.data).map((x) => [x.key, { id: x.id, nombre: x.name }]),
);
const objetos = Object.fromEntries(
  Object.entries(o.data).map(([id, x]) => [id, x.name]),
);
const hechizos = Object.fromEntries(
  Object.values(h.data).map((x) => [x.key, x.name]),
);
const runas = Object.fromEntries(
  arboles.flatMap((a) =>
    a.slots.flatMap((s) => s.runes.map((r) => [r.id, r.name])),
  ),
);
const indiceIconos = await json(base + "profileicon.json");
const icons = Object.values(indiceIconos.data).map((x) => ({
  id: String(x.id),
  name: "Ícono " + x.id,
  image: origen + "/cdn/" + version + "/img/profileicon/" + x.image.full,
}));
const backgrounds = [];
const lista = Object.values(c.data);
for (let inicio = 0; inicio < lista.length; inicio += 6) {
  const grupos = await Promise.all(
    lista.slice(inicio, inicio + 6).map(async (x) => {
      const ficha = (await json(base + "champion/" + x.id + ".json")).data[
        x.id
      ];
      return ficha.skins.map((s) => ({
        id: String(s.id),
        name: s.num === 0 ? x.name : s.name,
        champion: x.name,
        image:
          origen + "/cdn/img/champion/splash/" + x.id + "_" + s.num + ".jpg",
      }));
    }),
  );
  backgrounds.push(...grupos.flat());
}
await writeFile(
  "public/data/apariencia-riot.json",
  JSON.stringify({ version, backgrounds, icons }) + "\r\n",
);
await writeFile(
  "public/data/referencias-riot.json",
  JSON.stringify({ version, campeones, objetos, hechizos, runas }) + "\r\n",
);
