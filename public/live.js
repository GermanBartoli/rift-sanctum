import { openCustomizer, ajustarBanner } from './app.js';
import { validateAppearance } from './profile.js';
const $ = selector => document.querySelector(selector);
import {mostrarEjemplo} from './perfil-ejemplo.js';
import { cargar } from './riot-perfil.js';
let referencias;
function rutaJugador(nombre) {
  return '#jugador/' + encodeURIComponent(nombre);
}
const dragon = 'https://ddragon.leagueoflegends.com/cdn/';
let fuentes, original;
async function recursos() {
  fuentes ||= Promise.all(['/data/apariencia-riot.json','/data/referencias-riot.json'].map(async ruta=>{
    const r=await fetch(ruta);if(!r.ok)throw Error('No se pudo cargar el catálogo de Riot.');return r.json();
  })).then(([apariencia,nombres])=>{
    referencias=nombres;
    const locales=coleccion=>original[coleccion].filter(x=>x.image.startsWith('/')&&!x.image.startsWith('//'));
    return {...original,...apariencia,frames:locales('frames'),honors:locales('honors'),trophies:locales('trophies'),banners:locales('banners'),profileBanners:locales('profileBanners')};
  }).catch(e=>{fuentes=null;throw e;});
  return fuentes;
}
function iconoCampeon(id) {
  const c=referencias?.campeones[id];
  return c?dragon+catalog.version+'/img/champion/'+c.id+'.png':'/assets/mastery-sin-perdida.webp';
}
let catalog, current, consultaActual = 0, live = false, editPlayer;
let recent = [];
try { recent = JSON.parse(localStorage.getItem('rift:recent') || '[]'); if (!Array.isArray(recent)) recent = []; } catch {}
function suggestions() {
  recent = recent.map(item => typeof item === 'string' ? {nombre:item,region:'la2'} : item)
    .filter(item => typeof item?.nombre === 'string' && item.nombre.trim() && item.region === 'la2');
  $('#sin-recientes').hidden = recent.length > 0;
  $('#recent-players').replaceChildren(...recent.map(({nombre}) => {
    const fila = document.createElement('li');
    const enlace = document.createElement('a');
    enlace.href = rutaJugador(nombre);
    enlace.textContent = nombre;
    fila.append(enlace);
    return fila;
  }));
}
suggestions();
document.addEventListener('pointerdown', evento => {
  if (!$('#recientes').contains(evento.target)) $('#recientes').open = false;
});
$('#recientes').addEventListener('keydown', evento => {
  if (evento.key === 'Escape') {
    $('#recientes').open = false;
    $('#recientes summary').focus();
  }
});
$('#recent-players').addEventListener('click', () => { $('#recientes').open = false; });
document.addEventListener('sanctum-ready', event => { original = event.detail; if (location.hash.startsWith("#jugador/")) mostrarSeccion(location.hash); });
let ejemploIniciado = false;
function abrirEjemplo() {
  if (ejemploIniciado) return;
  ejemploIniciado = true;
  cargar($('#panel-ejemplo'), async () => {
    const respuesta = await fetch('/data/referencias-riot.json');
    if (!respuesta.ok) throw Error('No se pudo abrir el ejemplo.');
    return mostrarEjemplo(await respuesta.json());
  });
}
function selectLive(value) {
  $('#ejemplo-ampliado').hidden = !value;
  if (value) abrirEjemplo();
  $('#recientes').open = false;
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
  $(live ? '#live-tab' : '#my-tab').setAttribute('aria-current', 'location');
  $(live ? '#my-tab' : '#live-tab').removeAttribute('aria-current');
  document.querySelectorAll('.detail-panel').forEach(panel => { panel.hidden = true; });
  document.querySelectorAll('[aria-expanded]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  renderMatches(live ? current?.matches : null, live ? current?.warnings : []);
}
function mostrarSeccion(hash) {
  consultaActual++;
  $('#acceso-riot').hidden = true;
  const boton = $('#riot-search button');
  boton.disabled = false;
  boton.textContent = 'Buscar';
  let jugador = '';
  if (hash.startsWith('#jugador/')) {
    try {
      jugador = decodeURIComponent(hash.slice(9).split('/')[0]);
    } catch {}
  }
  if (hash === '#search-guide' || hash === '#buscar') {
    current = null;
    $('#riot-id').value = '';
  }
  if (jugador && current?.name !== jugador) {
    current = null;
    $('#riot-id').value = jugador;
    if (original) buscarJugador(jugador, false);
  }
  const consulta = Boolean(jugador) || hash === '#search-guide' || hash === '#buscar';
  selectLive(consulta);
  window.scrollTo(0, 0);
  if (consulta && !current) $('#riot-id').focus({ preventScroll: true });
}

for (const enlace of document.querySelectorAll('a[href="#perfil"], #live-tab')) {
  enlace.addEventListener('click', evento => {
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    const destino = enlace.hash;
    if (location.hash !== destino) history.pushState(null, '', destino);
    mostrarSeccion(destino);
    if (enlace.closest('footer')) $('#my-tab').focus({ preventScroll: true });
  });
}
window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#jugador/') || ['', '#perfil', '#search-guide', '#buscar'].includes(location.hash)) mostrarSeccion(location.hash);
});
if (location.hash === '#search-guide' || location.hash === '#buscar') mostrarSeccion(location.hash);

$('.skip').addEventListener('click', evento => {
  if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
  evento.preventDefault();
  const contenido = $('#contenido');
  contenido.focus({ preventScroll: true });
  contenido.scrollIntoView({ block: 'start', behavior: 'instant' });
});
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
  by('change-identity').setAttribute('aria-labelledby', [by('editar-identidad').id, by('nivel-identidad').id].join(' '));
  const image = (src, alt = '', className = '') => { const img = document.createElement('img'); Object.assign(img, { src, alt, className }); return img; };
  const text = (tag, value, className = '') => { const element = document.createElement(tag); element.textContent = value; element.className = className; return element; };
  clone.setAttribute('aria-label', `Santuario de ${data.name}`);
  const [name, tag] = data.name.split('#');
  q('h1').textContent = name; q('h1').after(text('p', `#${tag}`, 'identity-tag')); q('.level').textContent = data.level;
  by('profile-icon').src = dragon + catalog.version + '/img/profileicon/' + data.icon + '.png'; by('profile-icon').alt = catalog.icons.find(icono => String(icono.id) === String(data.icon))?.name || 'Ícono de ' + data.name;
  const niveles = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
  const divisiones = ['IV','III','II','I'];
  const puntaje = entrada => niveles.indexOf(entrada.tier) * 4 + divisiones.indexOf(entrada.rank);
  const rank = data.ranks.filter(entrada => ['RANKED_SOLO_5x5','RANKED_FLEX_SR'].includes(entrada.queueType))
    .sort((a,b) => puntaje(b) - puntaje(a) || b.leaguePoints - a.leaguePoints)[0];
  const cola = rank?.queueType === 'RANKED_FLEX_SR' ? 'Flexible · 5v5' : 'Solo/Dúo';
  const frame = catalog.frames.find(item => item.id === rank?.tier.toLowerCase());
  if (frame) {
    by('profile-frame').src = frame.image; by('profile-frame').alt = frame.name; by('profile-frame').dataset.frameType = frame.type; q('.portrait').dataset.frameType = frame.type;
  } else by('profile-frame').hidden = true;
  const tierLabel = frame ? [frame.name, rank.rank].join(' ') : 'Sin clasificar';
  q('.identity-rank strong').textContent = tierLabel;
  q('.identity-rank > span:last-child').textContent = rank ? cola : '';
  by('rank-trigger').querySelector('.achievement-note').textContent = rank ? cola : '';
  by('rank-trigger').querySelector('strong').textContent = tierLabel;
  const emblem = tier => catalog.assets[tier.toLowerCase()] || catalog.frames.find(x=>x.id===tier.toLowerCase())?.image || catalog.assets.unranked;
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
    by('mastery-icon').src = iconoCampeon(data.masteries[0].championId);
    q('.mastery-medal span').textContent = data.masteries[0].championLevel;
  } else q('.mastery-medal').hidden = true;
  by('mastery-panel').classList.add('remote-mastery');
  by('mastery-panel').querySelector('.mastery-columns > div:last-child').remove();
  by('champion-grid').replaceChildren();
  for (const mastery of data.masteries) {
    const champion = catalog.backgrounds.find(item => Math.floor(Number(item.id) / 1000) === mastery.championId);
    const card = text('div', '', 'champion-card'); const medal = text('div', '', 'champion-medal');
    medal.append(image(iconoCampeon(mastery.championId), champion?.champion || 'Campeón'), image(catalog.assets.mastery, '', 'champion-decoration'));
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
    const cerrar = panel.querySelector('.panel-close');
    trigger.onclick = evento => {
      open();
      if (evento.detail === 0) cerrar.focus();
    };
    trigger.onpointerenter = event => { if (event.pointerType === 'mouse') open(); };
    trigger.onpointerleave = schedule; trigger.onblur = schedule;
    panel.onpointerenter = () => clearTimeout(timer); panel.onpointerleave = schedule;
    cerrar.onclick = () => {
      closePanels();
      trigger.focus({ preventScroll: true });
    };
    panel.onfocusout = evento => {
      if (!panel.contains(evento.relatedTarget) && evento.relatedTarget !== trigger) closePanels();
    };
  }
  clone.onkeydown = evento => {
    if (evento.key !== 'Escape') return;
    const panel = clone.querySelector('.detail-panel:not([hidden])');
    if (!panel) return;
    const devolverFoco = panel.contains(document.activeElement);
    closePanels();
    if (devolverFoco) clone.querySelector('[aria-controls="' + panel.id + '"]').focus({ preventScroll: true });
  };
  clone.onpointerdown = event => { if (!event.target.closest('.detail-panel, [data-original-id="rank-trigger"], [data-original-id="mastery-trigger"]')) closePanels(); };
  const key = (data.region==='la2'?'rift:appearance:':'rift:appearance:'+data.region+':')+data.name.toLowerCase();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch {}
  const campeon = data.masteries[0];
  const fondo = catalog.backgrounds.find(item => Number(item.id) === campeon?.championId * 1000);
  const estandarte = catalog.profileBanners.find(item => item.id === 'regalia-bannerskins-pastrank-' + frame?.id) || catalog.profileBanners[0];
  by('backdrop').hidden = !fondo;
  const automatico = { background: fondo?.id, icon: String(data.icon), frame: frame?.id, profileBanner: estandarte.id };
  const defaults = validateAppearance(automatico, catalog);
  const collections = { background: 'backgrounds', icon: 'icons', frame: 'frames', profileBanner: 'profileBanners', honor: 'honors', trophy: 'trophies', banner: 'banners' };
  const apply = values => {
    for (const [field, collection] of Object.entries(collections)) {
      const item = catalog[collection].find(entry => String(entry.id) === String(values[field]));
      if (!item) continue;
      if (field === 'background') { by('backdrop').hidden = false; by('backdrop').src = item.image; by('backdrop').alt = item.name; }
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
  apply({ ...automatico, ...saved });
  editPlayer = (tab, trigger) => {
    closePanels();
    const initial = validateAppearance({ ...defaults, ...saved }, catalog);
    openCustomizer(tab, trigger, { catalogo:catalog, appearance: initial, defaults, name, level: data.level, save(values, fields, reset) {
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
$('#riot-search').onsubmit = event => {
  event.preventDefault();
  if (original) buscarJugador($('#riot-id').value.trim(), true);
};
async function buscarJugador(jugador, actualizarRuta) {
  const consulta = ++consultaActual;
  const button = $('#riot-search button'); button.disabled = true;
  selectLive(true); $('#history-status').textContent = 'Consultando Riot…'; button.textContent = 'Buscando…';
  try {
    const region = 'la2';
    const response = await fetch('/api/player?accion=clasico&id=' + encodeURIComponent(jugador));
    if (!(response.headers.get('content-type') || '').includes('json')) throw Error('La consulta requiere el servidor de Cloudflare Pages.');
    const data = await response.json(); if (consulta !== consultaActual) return; if (!response.ok) throw Error(data.error);
    $('#acceso-riot').hidden = true;
    const coleccion = await recursos();
    if (consulta !== consultaActual) return;
    catalog = coleccion;
    const focoEnBusqueda = $('#riot-search').contains(document.activeElement) || document.activeElement === document.body;
    data.region = region;
    const destino = rutaJugador(data.name);
    if (actualizarRuta && location.hash !== destino) history.pushState(null, '', destino);
    current = data; renderPlayer(data); window.scrollTo(0, 0);
    if (focoEnBusqueda) {
      const titulo = $('#remote-sanctum h1');
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
    recent = [{nombre:data.name,region}, ...recent.filter(x => x.nombre !== data.name || x.region !== region)].slice(0, 15); suggestions();
    try { localStorage.setItem('rift:recent', JSON.stringify(recent)); } catch {}
  } catch (error) { if (consulta !== consultaActual) return; const aviso = $('#acceso-riot'); $('#history-status').textContent = ''; aviso.hidden = false; aviso.textContent = jugador + ' · ' + error.message; aviso.scrollIntoView({block:'center'}); }
  finally { if (consulta === consultaActual) { button.disabled = false; button.textContent = 'Buscar'; } }
};
