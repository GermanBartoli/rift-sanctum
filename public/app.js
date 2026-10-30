import {
  profile,
  storageKey,
  filterCatalog,
  validateAppearance,
} from "./profile.js";

const $ = (selector) => document.querySelector(selector);
const dialog = $("#customizer");
let catalog,
  appearance,
  draft,
  activeTab = "backgrounds",
  page = 1;
const pageSize = 24;
let opener, toastTimer;
const typeKey = { profileBanners: "profileBanner", backgrounds: "background", icons: "icon", frames: "frame", honors: "honor", trophies: "trophy", banners: "banner" };
const labels = { profileBanners: "banners de perfil", backgrounds: "fondos", icons: "íconos", frames: "marcos", honors: "niveles de honor", trophies: "trofeos", banners: "estandartes" };

function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => {
    $("#toast").hidden = true;
  }, 4200);
}

function getItem(collection, id) {
  return (
    catalog[collection].find((item) => String(item.id) === String(id)) ||
    catalog[collection][0]
  );
}

// Calcula el encuadre visible sin los márgenes transparentes del recurso de Riot.
let bannerActual;
function ajustarBanner(url) {
  const identity = $(".identity");
  bannerActual = url;
  identity.style.backgroundImage = `url("${url}")`;
  identity.style.backgroundSize = "148% 104%";
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    if (bannerActual !== url) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 145;
      canvas.height = Math.round(image.height * 145 / image.width);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] < 20) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      if (right < left) return;
      const width = right - left + 1, height = bottom - top + 1;
      identity.style.backgroundSize = `${canvas.width / width * 100}% ${canvas.height / height * 100}%`;
      identity.style.backgroundPosition = `${canvas.width === width ? 0 : left / (canvas.width - width) * 100}% ${canvas.height === height ? 0 : top / (canvas.height - height) * 100}%`;
    } catch { /* Mantiene el encuadre alternativo si la fuente impide leer los píxeles. */ }
  };
  image.src = url;
}

function applyAppearance(value, previewOnly = false) {
  const banner = getItem("profileBanners", value.profileBanner);
  $("#preview-banner").src = banner.image;
  if (!previewOnly) ajustarBanner(banner.image);
  const background = getItem("backgrounds", value.background);
  const icon = getItem("icons", value.icon);
  const frame = getItem("frames", value.frame);
  for (const id of previewOnly
    ? ["#preview-frame"]
    : ["#profile-frame", "#preview-frame"]) {
    $(id).dataset.frameType = frame.type;
    $(id).parentElement.dataset.frameType = frame.type;
  }
  if (!previewOnly) {
    $("#backdrop").src = background.image;
    $("#backdrop").alt = background.name;
    $("#profile-icon").src = icon.image;
    $("#profile-frame").src = frame.image;
    $("#profile-frame").alt = frame.name;
  }
  if (!previewOnly) for (const [collection, key, selector] of [["honors","honor","#honor-art"],["trophies","trophy",".cup-art"],["banners","banner",".banner-art"]]) {
    const item = getItem(collection, value[key]);
    const art = $(selector); art.replaceChildren();
    const image = document.createElement("img"); image.src = item.image; image.alt = item.name;
    image.style.cssText = "position:static;width:100%;height:110px;object-fit:contain";
    art.append(image); art.parentElement.querySelector("strong").textContent = item.name;
  }
  $("#preview-background").style.backgroundImage = `url("${background.image}")`;
  $("#preview-icon").src = icon.image;
  $("#preview-frame").src = frame.image;
}

function renderDetails() {
  $("#rank-emblem").src = catalog.assets.master;
  const rankArt = document.createElement("div");
  rankArt.className = "rank-art";
  $("#rank-emblem").before(rankArt);
  rankArt.append($("#rank-emblem"));
  $("#mastery-icon").src = catalog.assets.missFortune;
  for (const [selector, keys] of [
    [".cup-art", ["trophy", "pedestal"]],
    [".banner-art", ["voidBanner", "voidFrame"]],
  ]) {
    const art = $(selector);
    art.replaceChildren();
    for (const key of keys) {
      const img = document.createElement("img");
      img.src = catalog.assets[key];
      img.alt = "";
      img.className = key;
      art.append(img);
    }
  }
  const masteryArt = document.createElement("img");
  masteryArt.src = catalog.assets.mastery;
  masteryArt.alt = "";
  masteryArt.className = "mastery-decoration";
  $(".mastery-medal").append(masteryArt);
  document.querySelectorAll(".eternal").forEach((element, index) => {
    const img = document.createElement("img");
    img.src =
      index === 0 ? catalog.assets.eternalSupport : catalog.assets.eternalGoal;
    img.alt = "";
    element.replaceChildren(img);
  });
  if (catalog.assets.honor) {
    const img = document.createElement("img");
    img.src = catalog.assets.honor;
    img.alt = "";
    $("#honor-art").replaceChildren(img);
  }
  for (const rank of profile.ranks) {
    const card = document.createElement("div");
    card.className = "rank-item";
    if (catalog.assets[rank.emblem]) {
      const img = document.createElement("img");
      img.src = catalog.assets[rank.emblem];
      img.alt = "";
      const art = document.createElement("div");
      art.className = `rank-art ${rank.emblem === "unranked" ? "unranked" : ""}`;
      art.append(img);
      card.append(art);
    } else {
      const art = document.createElement("div");
      art.className = "unranked-art";
      art.textContent = "◇";
      card.append(art);
    }
    const queue = document.createElement("span");
    queue.className = "tiny";
    queue.textContent = rank.queue;
    const tier = document.createElement("strong");
    tier.textContent = rank.tier;
    const detail = document.createElement("p");
    detail.textContent =
      rank.wins != null ? `${rank.wins} victorias | ${rank.lp} PL` : "";
    card.append(queue, tier, detail);
    $("#rank-grid").append(card);
  }
  for (const champion of profile.champions) {
    const card = document.createElement("div");
    card.className = "champion-card";
    const img = document.createElement("img");
    img.src = catalog.assets[champion.asset];
    img.alt = champion.name;
    const title = document.createElement("strong");
    title.textContent = champion.name.toUpperCase();
    const mastery = document.createElement("p");
    mastery.textContent = `✧ Maestría ${champion.mastery}`;
    const grade = document.createElement("small");
    grade.textContent = `Mejor calificación: ${champion.grade}`;
    const medal = document.createElement("div");
    medal.className = "champion-medal";
    const decoration = document.createElement("img");
    decoration.src = catalog.assets.mastery;
    decoration.alt = "";
    decoration.className = "champion-decoration";
    medal.append(img, decoration);
    card.append(medal, title, mastery, grade);
    $("#champion-grid").append(card);
  }
}

function renderCollection() {
  const items = filterCatalog(
    catalog[activeTab],
    $("#catalog-search").value,
    activeTab === "backgrounds" ? $("#champion-filter").value : "",
  );
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  page = Math.min(page, pages);
  const grid = $("#catalog-grid");
  grid.replaceChildren();
  grid.className = `catalog-grid ${activeTab}`;
  $("#result-count").textContent =
    `${items.length.toLocaleString("es-AR")} ${labels[activeTab]} disponibles`;
  $("#selected-label").textContent =
    `Selección: ${getItem(activeTab, draft[typeKey[activeTab]]).name}`;
  $("#page-info").textContent = `${page} / ${pages}`;
  $("#prev-page").disabled = page === 1;
  $("#next-page").disabled = page === pages;
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      "No encontramos resultados. Probá otro nombre o quitá el filtro.";
    grid.append(empty);
  }
  for (const item of items.slice((page - 1) * pageSize, page * pageSize)) {
    const button = document.createElement("button");
    button.className = "catalog-item";
    button.type = "button";
    button.setAttribute("aria-label", item.name);
    button.title = item.name;
    button.setAttribute(
      "aria-pressed",
      String(String(item.id) === String(draft[typeKey[activeTab]])),
    );
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = "";
    img.loading = "lazy";
    if (activeTab === "frames") button.dataset.frameType = item.type;
    img.addEventListener(
      "error",
      () => {
        img.classList.add("asset-missing");
        img.src = "/favicon.svg";
      },
      { once: true },
    );
    const label = document.createElement("span");
    label.textContent = item.name;
    button.append(img, label);
    button.addEventListener("click", () => {
      draft[typeKey[activeTab]] = String(item.id);
      applyAppearance(draft, true);
      grid
        .querySelectorAll("[aria-pressed]")
        .forEach((el) => el.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      $("#selected-label").textContent = `Selección: ${item.name}`;
    });
    grid.append(button);
  }
  grid.scrollTop = 0;
}

function setTab(tab) {
  activeTab = tab;
  page = 1;
  $("#catalog-search").value = "";
  $("#champion-filter").value = "";
  $("#champion-filter").hidden = tab !== "backgrounds";
  $("#catalog-search").placeholder =
    tab === "backgrounds"
      ? "Buscar campeón o aspecto…"
      : tab === "icons"
        ? "Buscar ícono por nombre o número…"
        : tab === "profileBanners" || tab === "banners"
          ? "Buscar banner o estandarte…"
          : "Buscar rango o nivel…";
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  renderCollection();
}

function openCustomizer(tab, trigger) {
  if (!catalog) {
    toast(
      "La colección todavía está cargando. Intentá de nuevo en unos segundos.",
    );
    return;
  }
  closePanels();
  opener = trigger;
  draft = { ...appearance };
  applyAppearance(draft, true);
  setTab(tab);
  dialog.showModal();
  // Abrir sobre la pestaña activa evita seleccionar el buscador sin intención.
  $(`[data-tab="${tab}"]`).focus({ preventScroll: true });
}

const panelPairs = [
  ["#rank-trigger", "#rank-panel"],
  ["#mastery-trigger", "#mastery-panel"],
];
let hideTimer;
function closePanels() {
  clearTimeout(hideTimer);
  for (const [trigger, panel] of panelPairs) {
    $(panel).hidden = true;
    $(trigger).setAttribute("aria-expanded", "false");
  }
}
function openPanel(trigger, panel) {
  closePanels();
  $(panel).hidden = false;
  $(trigger).setAttribute("aria-expanded", "true");
}
for (const [trigger, panel] of panelPairs) {
  const scheduleClose = () => {
    hideTimer = setTimeout(() => {
      if (
        !$(panel).matches(":hover") &&
        !$(trigger).matches(":hover") &&
        !$(panel).contains(document.activeElement) &&
        document.activeElement !== $(trigger)
      )
        closePanels();
    }, 220);
  };
  $(trigger).addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") openPanel(trigger, panel);
  });
  $(trigger).addEventListener("pointerleave", scheduleClose);
  $(trigger).addEventListener("focus", () => openPanel(trigger, panel));
  $(trigger).addEventListener("blur", scheduleClose);
  $(trigger).addEventListener("click", () => openPanel(trigger, panel));
  $(panel).addEventListener("pointerenter", () => clearTimeout(hideTimer));
  $(panel).addEventListener("pointerleave", scheduleClose);
  $(panel).querySelector(".panel-close").addEventListener("click", closePanels);
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanels();
});
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".detail-panel, #rank-trigger, #mastery-trigger"))
    closePanels();
});

$("#customize").addEventListener("click", (event) =>
  openCustomizer("backgrounds", event.currentTarget),
);
$("#change-identity").addEventListener("click", (event) =>
  openCustomizer("icons", event.currentTarget),
);
$("#close-customizer").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => opener?.focus());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  }
});
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.tab));
  button.addEventListener("keydown", (event) => {
    const tabs = [...document.querySelectorAll("[data-tab]")];
    let index = tabs.indexOf(button);
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[index].dataset.tab);
    tabs[index].focus();
  });
});
$("#catalog-search").addEventListener("input", () => {
  page = 1;
  renderCollection();
});
$("#champion-filter").addEventListener("change", () => {
  page = 1;
  renderCollection();
});
$("#prev-page").addEventListener("click", () => {
  page--;
  renderCollection();
});
$("#next-page").addEventListener("click", () => {
  page++;
  renderCollection();
});
$("#reset-profile").addEventListener("click", () => {
  draft = validateAppearance({}, catalog);
  applyAppearance(draft, true);
  renderCollection();
  toast("Original restaurado en la vista previa. Guardá para aplicar.");
});
$("#save-profile").addEventListener("click", () => {
  appearance = validateAppearance(draft, catalog);
  applyAppearance(appearance);
  try {
    localStorage.setItem(storageKey, JSON.stringify(appearance));
    toast("Tu santuario fue actualizado.");
  } catch {
    toast(
      "Cambios aplicados. El navegador no permitió guardarlos para la próxima visita.",
    );
  }
  dialog.close();
});

async function initialize() {
  try {
    const response = await fetch("/data/catalog.json");
    if (!response.ok) throw new Error("Catálogo no disponible");
    catalog = await response.json();
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    } catch {
      saved = null;
    }
    appearance = validateAppearance(saved, catalog);
    applyAppearance(appearance);
    renderDetails();
    applyAppearance(appearance);
    document.dispatchEvent(new CustomEvent("sanctum-ready", { detail: catalog }));
    const champions = [
      ...new Set(
        catalog.backgrounds.map((item) => item.champion).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "es"));
    for (const name of champions) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      $("#champion-filter").append(option);
    }
  } catch (error) {
    console.error("No se pudo cargar la colección:", error.message);
    toast("No se pudo cargar la colección. Recargá la página para reintentar.");
  }
}
initialize();

for (const [selector, tab] of [["#honor-art","honors"],[".cup-art","trophies"],[".banner-art","banners"]]) {
 const card = $(selector).parentElement;
 card.addEventListener("click", () => openCustomizer(tab, card));
}

$("#change-banner").addEventListener("click", (event) => openCustomizer("profileBanners", event.currentTarget));
