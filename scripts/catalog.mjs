import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Reconstruye el catálogo público sin claves privadas ni dependencias externas.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://raw.communitydragon.org/latest/plugins/";
const game = `${base}rcp-be-lol-game-data/global/default/`;
const localized = `${base}rcp-be-lol-game-data/global/es_mx/`;
const statics = `${base}rcp-fe-lol-static-assets/global/default/`;
const shared = `${base}rcp-fe-lol-shared-components/global/default/`;
const convert = (value) =>
  value.replace("/lol-game-data/assets/", game).toLowerCase();
async function request(url) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`No se pudo descargar ${url}: ${response.status}`);
  return response;
}
const json = async (url) => (await request(url)).json();
const [skins, iconData, champions, generic, profileIcons, trophies, banners] =
  await Promise.all([
    json(`${localized}v1/skins.json`),
    json(`${localized}v1/summoner-icons.json`),
    json(`${localized}v1/champion-summary.json`),
    json(`${game}v1/generic-assets.json`),
    json(`${game}v1/profile-icons.json`),
    json(`${game}v1/summoner-trophies.json`),
    json(`${game}v1/summoner-banners.json`),
  ]);
const names = new Map(champions.map((item) => [item.id, item.name]));
const allSkins = new Map();
for (const skin of Object.values(skins)) {
  if (skin.splashPath) allSkins.set(String(skin.id), skin);
  for (const tier of skin.questSkinInfo?.tiers || [])
    if (tier.splashPath) allSkins.set(String(tier.id), tier);
}
const backgrounds = [...allSkins.values()]
  .map((item) => ({
    id: String(item.id),
    name: item.name,
    champion: names.get(Math.floor(item.id / 1000)) || item.name,
    image: convert(item.splashPath),
  }))
  .sort(
    (a, b) =>
      a.champion.localeCompare(b.champion, "es") ||
      a.name.localeCompare(b.name, "es"),
  );
const icons = iconData
  .filter((item) => item.imagePath)
  .map((item) => ({
    id: String(item.id),
    name: item.title || `Ícono ${item.id}`,
    image: convert(item.imagePath),
  }))
  .sort((a, b) => Number(b.id) - Number(a.id));
for (const item of profileIcons)
  if (item.iconPath && !icons.some((icon) => icon.id === String(item.id)))
    icons.push({
      id: String(item.id),
      name: "Ícono " + item.id,
      image: convert(item.iconPath),
    });
const tierNames = {
  iron: "Hierro",
  bronze: "Bronce",
  silver: "Plata",
  gold: "Oro",
  platinum: "Platino",
  emerald: "Esmeralda",
  diamond: "Diamante",
  master: "Maestro",
  grandmaster: "Gran Maestro",
  challenger: "Retador",
};
const frames = Object.entries(tierNames).map(([id, name]) => ({
  id,
  name,
  type: "ranked",
  image: `${statics}ranked-emblem/wings/wings_${id}.png`,
}));
for (let level = 1; level <= 21; level++)
  frames.push({
    id: `level-${level}`,
    name: `Marco de nivel ${level === 1 ? 1 : (level - 1) * 25}`,
    type: "level",
    image: `${statics}images/uikit/themed-borders/theme-${level}-border.png`,
  });
const assets = {
  master: `${statics}ranked-emblem/emblem-master.png`,
  diamond: `${statics}ranked-emblem/emblem-diamond.png`,
  honor: `${statics}honor/profile/emblem_5.png`,
  unranked: `${statics}unranked-emblem.png`,
  mastery: `${shared}mastery-10.png`,
  missFortune: `${game}v1/champion-icons/21.png`,
  jarvan: `${game}v1/champion-icons/59.png`,
  thresh: `${game}v1/champion-icons/412.png`,
  banner: convert(generic["regalia-bannerskins-pastrank"].master),
  bannerTrim: convert(generic["regalia-banner-trims"].master),
};
assets.trophy = convert(
  trophies.Trophies.find(
    (item) => item.theme === "Demacia" && item.bracket === 8,
  ).profileIcon,
);
assets.pedestal = convert(
  trophies.TrophyPedestals.find((item) => item.tier === 3).profileIcon,
);
assets.voidBanner = convert(
  banners.BannerFlags.find((item) => item.theme === "Void" && item.level === 3)
    .profileIcon,
);
assets.voidFrame = convert(
  banners.BannerFrames.find((item) => item.level === 3).inventoryIcon,
);
assets.eternalSupport = `${game}assets/loadouts/statstones/categories/lcu/ss_icon_support_unique_3.png`;
assets.eternalGoal = `${game}assets/loadouts/statstones/categories/lcu/ss_icon_goal_common_3.png`;
await mkdir(path.join(root, "public/assets"), { recursive: true });
await mkdir(path.join(root, "public/data"), { recursive: true });
for (const [key, url] of Object.entries(assets)) {
  const extension = path.extname(new URL(url).pathname);
  const local = `/assets/${key}${extension}`;
  await writeFile(
    path.join(root, "public", local),
    Buffer.from(await (await request(url)).arrayBuffer()),
  );
  assets[key] = local;
}
const defaults = { background: "21069", icon: "7167", frame: "master" };
for (const [list, id, filename] of [
  [backgrounds, defaults.background, "background.jpg"],
  [icons, defaults.icon, "icon.jpg"],
  [frames, defaults.frame, "frame.png"],
]) {
  const selected = list.find((item) => item.id === id);
  await writeFile(
    path.join(root, "public/assets", filename),
    Buffer.from(await (await request(selected.image)).arrayBuffer()),
  );
  selected.image = `/assets/${filename}`;
}
// Conserva las colecciones complementarias al regenerar los recursos principales.
const previous = JSON.parse(await readFile(path.join(root, "public/data/catalog.json"), "utf8"));
const profileBanners = Object.entries(generic).filter(([key]) => key.startsWith("regalia-bannerskins-")).flatMap(([group, items]) => Object.entries(items).map(([id, image]) => ({ id: `${group}-${id}`, name: tierNames[id] || (id === "default" ? "Clásico" : `Evento ${id}`), image: convert(image) })));
const catalog = {
  honors: previous.honors, trophies: previous.trophies, banners: previous.banners, profileBanners,
  source: "CommunityDragon",
  locale: "es_MX",
  updatedAt: new Date().toISOString(),
  backgrounds,
  icons,
  frames,
  assets,
  defaults: { ...previous.defaults, ...defaults, profileBanner: "regalia-bannerskins-pastrank-master" },
};
await writeFile(
  path.join(root, "public/data/catalog.json"),
  JSON.stringify(catalog) + "\r\n",
);
console.log(
  JSON.stringify({
    backgrounds: backgrounds.length,
    icons: icons.length,
    frames: frames.length,
  }),
);
