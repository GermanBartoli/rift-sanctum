import { openCustomizer, ajustarBanner } from './app.js';
import { validateAppearance } from './profile.js';
const $ = selector => document.querySelector(selector);
const game = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/';
let catalog, current, busy = false, live = false, editPlayer;
let recent = [];
try { recent = JSON.parse(localStorage.getItem('rift:recent') || '[]'); if (!Array.isArray(recent)) recent = []; } catch {}
function suggestions() {
  $('#recent-players').replaceChildren(...recent.filter(n => typeof n === 'string').map(n => { const option = document.createElement('option'); option.value = n; return option; }));
}
suggestions();
document.addEventListener('sanctum-ready', event => { catalog = event.detail; });
function selectLive(value) {
  live = value;
  $('#perfil').hidden = live;
  $('#live-profile').hidden = !live || !current;
  $('#search-guide').hidden = !live;
  $('#search-guide').classList.toggle('has-profile', Boolean(current));
  // El buscador pasa debajo del perfil cargado sin desplazar el santuario.
  if (current) $('#live-profile').after($('#search-guide'));
  $('#customize').classList.toggle('inactive', live && !current);
  $('#customize').disabled = live && !current;
  $('#history').hidden = !live;
  $('footer').hidden = !live;
  $('#my-tab').classList.toggle('active', !live);
  $('#live-tab').classList.toggle('active', live);
  document.querySelectorAll('.detail-panel').forEach(panel => { panel.hidden = true; });
  document.querySelectorAll('[aria-expanded]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  renderMatches(live ? current?.matches : null, live ? current?.warnings : []);
}
$('#my-tab').onclick = event => { event.preventDefault(); selectLive(false); window.scrollTo(0, 0); };
$('#live-tab').onclick = event => { event.preventDefault(); selectLive(true); window.scrollTo(0, 0); if (!current) $('#riot-id').focus({ preventScroll: true }); };
$('#customize').addEventListener('click', event => {
  if (!live) return;
  event.stopImmediatePropagation();
  editPlayer?.('backgrounds', event.currentTarget);
}, true);
function renderMatches(matches, warnings = []) {
  $('#matches').replaceChildren();
  $('#history-status').textContent = warnings.length ? warnings.join(' ') : matches ? (matches.length ? 'Últimas partidas · LAS · Actualizadas al consultar' : 'No hay partidas recientes.') : 'Buscá tu perfil para consultar también tus últimas partidas.';
  for (const match of matches || []) {
    const row = document.createElement('article'); row.className = 'match-row';
    for (const text of [match.win ? 'Victoria' : 'Derrota', match.champion, `${match.kills} / ${match.deaths} / ${match.assists}`, match.mode, `${Math.floor(match.duration / 60)} min`, new Date(match.date).toLocaleDateString('es-AR')]) {
      const span = document.createElement('span'); span.textContent = text; row.append(span);
    }
    $('#matches').append(row);
  }
}
function renderPlayer(data) {
  const clone = $('#perfil').cloneNode(true); clone.hidden = false; clone.id = 'remote-sanctum';
  clone.querySelectorAll('[id]').forEach(element => { element.dataset.originalId = element.id; element.id = `remote-${element.id}`; });
  const q = selector => clone.querySelector(selector);
  const by = id => q(`[data-original-id="${id}"]`);
  const image = (src, alt = '', className = '') => { const img = document.createElement('img'); Object.assign(img, { src, alt, className }); return img; };
  const text = (tag, value, className = '') => { const element = document.createElement(tag); element.textContent = value; element.className = className; return element; };
  clone.setAttribute('aria-label', `Santuario de ${data.name}`);
  const [name, tag] = data.name.split('#');
  q('h1').textContent = name; q('h1').after(text('p', `#${tag}`, 'identity-tag')); q('.level').textContent = data.level;
  by('profile-icon').src = game + `v1/profile-icons/${data.icon}.jpg`; by('profile-icon').alt = data.name;
  const rank = data.ranks.find(item => item.queueType === 'RANKED_SOLO_5x5');
  const frame = catalog.frames.find(item => item.id === rank?.tier.toLowerCase());
  if (frame) {
    by('profile-frame').src = frame.image; by('profile-frame').alt = frame.name; by('profile-frame').dataset.frameType = frame.type; q('.portrait').dataset.frameType = frame.type;
  } else by('profile-frame').hidden = true;
  const tierLabel = frame?.name || 'Sin clasificar';
  q('.identity-rank strong').textContent = tierLabel;
  q('.identity-rank > span:last-child').textContent = 'Solo/Dúo';
  by('rank-trigger').querySelector('strong').textContent = tierLabel;
  const emblem = tier => `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-${tier.toLowerCase()}.png`;
  by('rank-emblem').src = rank ? emblem(rank.tier) : catalog.assets.unranked; by('rank-emblem').alt = tierLabel;
  by('rank-panel').querySelector('h2').textContent = 'Tus rangos en la Grieta';
  by('rank-grid').replaceChildren();
  for (const [queue, label] of [['RANKED_SOLO_5x5', 'Solo/Dúo'], ['RANKED_FLEX_SR', 'Flexible · 5v5']]) {
    const entry = data.ranks.find(item => item.queueType === queue);
    const card = text('div', '', 'rank-item'); const art = text('div', '', `rank-art${entry ? '' : ' unranked'}`);
    art.append(image(entry ? emblem(entry.tier) : catalog.assets.unranked));
    const labelTier = catalog.frames.find(item => item.id === entry?.tier.toLowerCase())?.name || entry?.tier || 'Sin clasificar';
    card.append(art, text('span', label, 'tiny'), text('strong', entry ? `${labelTier} ${entry.rank}` : labelTier), text('p', entry ? `${entry.leaguePoints} PL · ${entry.wins} victorias · ${entry.losses} derrotas` : 'Sin partidas clasificatorias'));
    by('rank-grid').append(card);
  }
  by('mastery-trigger').querySelector('strong').textContent = data.masteryScore;
  if (data.masteries[0]) {
    by('mastery-icon').src = game + `v1/champion-icons/${data.masteries[0].championId}.png`;
    q('.mastery-medal span').textContent = data.masteries[0].championLevel;
  } else q('.mastery-medal').hidden = true;
  by('mastery-panel').classList.add('remote-mastery');
  by('mastery-panel').querySelector('.mastery-columns > div:last-child').remove();
  by('champion-grid').replaceChildren();
  for (const mastery of data.masteries) {
    const champion = catalog.backgrounds.find(item => Math.floor(Number(item.id) / 1000) === mastery.championId);
    const card = text('div', '', 'champion-card'); const medal = text('div', '', 'champion-medal');
    medal.append(image(game + `v1/champion-icons/${mastery.championId}.png`, champion?.champion || 'Campeón'), image(catalog.assets.mastery, '', 'champion-decoration'));
    card.append(medal, text('strong', champion?.champion || `Campeón ${mastery.championId}`), text('p', `✧ Maestría ${mastery.championLevel}`), text('small', `${mastery.championPoints.toLocaleString('es-AR')} puntos`));
    by('champion-grid').append(card);
  }
  if (!data.masteries.length) by('champion-grid').append(text('p', 'Todavía no hay maestrías registradas.'));
  for (const panel of clone.querySelectorAll('.detail-panel')) { panel.hidden = true; panel.querySelector('.panel-source').textContent = 'Datos de Riot · Actualizados al consultar el perfil'; }
  let timer;
  const closePanels = () => { clearTimeout(timer); for (const id of ['rank', 'mastery']) { by(`${id}-panel`).hidden = true; by(`${id}-trigger`).setAttribute('aria-expanded', 'false'); } };
  for (const id of ['rank', 'mastery']) {
    const trigger = by(`${id}-trigger`), panel = by(`${id}-panel`);
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', 'false');
    const open = () => { closePanels(); panel.hidden = false; trigger.setAttribute('aria-expanded', 'true'); };
    const schedule = () => { timer = setTimeout(() => { if (!panel.matches(':hover') && !trigger.matches(':hover') && !panel.contains(document.activeElement) && document.activeElement !== trigger) closePanels(); }, 220); };
    trigger.onclick = open; trigger.onfocus = open;
    trigger.onpointerenter = event => { if (event.pointerType === 'mouse') open(); };
    trigger.onpointerleave = schedule; trigger.onblur = schedule;
    panel.onpointerenter = () => clearTimeout(timer); panel.onpointerleave = schedule;
    panel.querySelector('.panel-close').onclick = closePanels;
  }
  clone.onkeydown = event => { if (event.key === 'Escape') closePanels(); };
  clone.onpointerdown = event => { if (!event.target.closest('.detail-panel, [data-original-id="rank-trigger"], [data-original-id="mastery-trigger"]')) closePanels(); };
  const key = `rift:appearance:${data.name.toLowerCase()}`;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch {}
  const defaults = validateAppearance({ icon: String(data.icon), frame: frame?.id }, catalog);
  const collections = { background: 'backgrounds', icon: 'icons', frame: 'frames', profileBanner: 'profileBanners', honor: 'honors', trophy: 'trophies', banner: 'banners' };
  const apply = values => {
    for (const [field, collection] of Object.entries(collections)) {
      const item = catalog[collection].find(entry => String(entry.id) === String(values[field]));
      if (!item) continue;
      if (field === 'background') { by('backdrop').src = item.image; by('backdrop').alt = item.name; }
      else if (field === 'icon') by('profile-icon').src = item.image;
      else if (field === 'frame') { by('profile-frame').hidden = false; by('profile-frame').src = item.image; by('profile-frame').alt = item.name; by('profile-frame').dataset.frameType = item.type; q('.portrait').dataset.frameType = item.type; }
      else if (field === 'profileBanner') { ajustarBanner(item.image, q('.identity')); }
      else {
        const art = field === 'honor' ? by('honor-art') : q(field === 'trophy' ? '.cup-art' : '.banner-art');
        const img = image(item.image, item.name); img.style.cssText = 'position:static;width:100%;height:110px;object-fit:contain';
        art.replaceChildren(img); art.parentElement.querySelector('strong').textContent = item.name;
        art.parentElement.querySelector('.achievement-note').textContent = 'Selección manual · Editar';
      }
    }
  };
  for (const [art, tab] of [[by('honor-art'), 'honors'], [q('.cup-art'), 'trophies'], [q('.banner-art'), 'banners']]) {
    art.replaceChildren(text('span', '✧'));
    art.parentElement.querySelector('strong').textContent = 'Elegir';
    art.parentElement.querySelector('.achievement-note').textContent = 'Dato no publicado · Personalizar';
    art.parentElement.onclick = event => editPlayer(tab, event.currentTarget);
  }
  apply(saved);
  editPlayer = (tab, trigger) => {
    closePanels();
    const initial = validateAppearance({ ...defaults, ...saved }, catalog);
    openCustomizer(tab, trigger, { appearance: initial, defaults, name, level: data.level, save(values, fields, reset) {
      // Solo conserva elecciones manuales; nivel, rangos y maestrías siguen siendo de Riot.
      if (reset) saved = {};
      for (const field of fields) saved[field] = values[field];
      apply(saved);
      try { localStorage.setItem(key, JSON.stringify(saved)); if (reset) renderPlayer(data); return true; } catch { return false; }
    } });
  };
  q('.portrait').onclick = event => editPlayer('icons', event.currentTarget);
  q('.showcase-foot').replaceChildren(text('span', `Actualizado: ${new Date(data.updatedAt).toLocaleString('es-AR')}`));
  $('#live-profile').replaceChildren(clone); selectLive(true);
}
$('#riot-search').onsubmit = async event => {
  event.preventDefault(); if (busy || !catalog) return;
  busy = true; const button = event.currentTarget.querySelector('button'); button.disabled = true;
  selectLive(true); $('#history-status').textContent = 'Consultando Riot…'; button.textContent = 'Buscando…';
  try {
    const response = await fetch('/api/player?id=' + encodeURIComponent($('#riot-id').value.trim()));
    if (!(response.headers.get('content-type') || '').includes('json')) throw Error('La consulta requiere el servidor de Cloudflare Pages.');
    const data = await response.json(); if (!response.ok) throw Error(data.error);
    current = data; renderPlayer(data); window.scrollTo(0, 0);
    recent = [data.name, ...recent.filter(name => name !== data.name)].slice(0, 15); suggestions();
    try { localStorage.setItem('rift:recent', JSON.stringify(recent)); } catch {}
  } catch (error) { $('#history-status').textContent = error.message; $('#history').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  finally { busy = false; button.disabled = false; button.textContent = 'Buscar'; }
};
