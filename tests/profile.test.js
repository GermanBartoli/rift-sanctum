import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCatalog,
  validateAppearance,
  profile,
} from "../public/profile.js";

test("Búsqueda por nombre, acentos, ID y campeón", () => {
  const items = [
    { id: "103085", name: "Ahri leyenda renacida", champion: "Ahri" },
    { id: "1", name: "Ícono de la Grieta" },
  ];
  assert.equal(filterCatalog(items, "AHRI renacida").length, 1);
  assert.equal(filterCatalog(items, "icono")[0].id, "1");
  assert.equal(filterCatalog(items, "103085")[0].champion, "Ahri");
  assert.equal(filterCatalog(items, "", "Ahri").length, 1);
  assert.equal(filterCatalog(items, "inexistente").length, 0);
});
test("Preferencias desconocidas o dañadas vuelven a valores originales", () => {
  const catalog = {
    defaults: { background: "a", icon: "b", frame: "c" },
    backgrounds: [{ id: "a" }],
    icons: [{ id: "b" }, { id: "d" }],
    frames: [{ id: "c" }],
  };
  assert.deepEqual(validateAppearance(null, catalog), catalog.defaults);
  assert.deepEqual(
    validateAppearance({ background: "url-inyectada", icon: "d" }, catalog),
    { background: "a", icon: "d", frame: "c" },
  );
});
test("Rangos y maestrías preservan los valores de las capturas", () => {
  assert.equal(profile.ranks[0].lp, 420);
  assert.equal(profile.ranks[1].wins, 339);
  assert.equal(profile.champions[1].mastery, 78);
  assert.equal(profile.masteryScore, 654);
});


test("Banners de eventos disponibles y preferencias anteriores compatibles", async () => {
  const { readFile } = await import("node:fs/promises");
  const catalog = JSON.parse(await readFile(new URL("../public/data/catalog.json", import.meta.url), "utf8"));
  assert.ok(filterCatalog(catalog.profileBanners, "Jinx").length);
  assert.ok(filterCatalog(catalog.profileBanners, "Hall of Legends 2026").length);
  assert.equal(new Set(catalog.profileBanners.map(item => item.id)).size, catalog.profileBanners.length);
  assert.equal(validateAppearance({ profileBanner: "regalia-bannerskins-pastrank-master" }, catalog).profileBanner, "regalia-bannerskins-pastrank-master");
  const banner = filterCatalog(catalog.profileBanners, "Jinx")[0];
  assert.equal(validateAppearance({ profileBanner: banner.id }, catalog).profileBanner, banner.id);
});
