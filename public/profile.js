export const profile = Object.freeze({
  name: "KillerBiss",
  level: 414,
  region: "LAS",
  masteryScore: 654,
  referenceDate: "2026-10-29",
  ranks: [
    {
      queue: "FLEXIBLE · 5V5",
      tier: "MAESTRO",
      wins: 289,
      lp: 420,
      emblem: "master",
    },
    {
      queue: "SOLO / DÚO",
      tier: "MAESTRO",
      wins: 339,
      lp: 79,
      emblem: "master",
    },
    {
      queue: "5V5",
      tier: "[P] DIAMANTE IV",
      wins: 2,
      lp: 50,
      emblem: "diamond",
    },
    { queue: "TFT", tier: "[P] SIN CLASIFICAR", emblem: "unranked" },
    { queue: "DÚO DINÁMICO", tier: "[P] SIN CLASIFICAR", emblem: "unranked" },
    { queue: "ÚLTIMA TEMPORADA", tier: "MAESTRO", emblem: "master" },
  ],
  champions: [
    { name: "Jarvan IV", mastery: 55, grade: "B+", asset: "jarvan" },
    { name: "Miss Fortune", mastery: 78, grade: "S+", asset: "missFortune" },
    { name: "Thresh", mastery: 47, grade: "N/D", asset: "thresh" },
  ],
});

export const storageKey = "rift-sanctum:appearance:v1";
export const normalize = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function filterCatalog(items, query = "", champion = "") {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return items.filter(
    (item) =>
      (!champion || item.champion === champion) &&
      terms.every((term) =>
        normalize(`${item.name} ${item.champion || ""} ${item.id}`).includes(
          term,
        ),
      ),
  );
}

export function validateAppearance(candidate, catalog) {
  const result = {};
  for (const [key, collection] of [
    ["background", "backgrounds"],
    ["icon", "icons"],
    ["frame", "frames"],
  ]) {
    const id = String(candidate?.[key] ?? "");
    result[key] = catalog[collection].some((item) => String(item.id) === id)
      ? id
      : String(catalog.defaults[key]);
  }
  return result;
}
