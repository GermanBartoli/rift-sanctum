const $=s=>document.querySelector(s);
let catalog, current, busy=false;
let recent=[]; try { recent=JSON.parse(localStorage.getItem('rift:recent') || '[]'); if(!Array.isArray(recent))recent=[]; } catch {}
function suggestions(){ $('#recent-players').replaceChildren(...recent.filter(n=>typeof n==='string').map(n=>{const o=document.createElement('option');o.value=n;return o;})); }
suggestions();
document.addEventListener('sanctum-ready',e=>{catalog=e.detail;});
function selectLive(live){
 $('#perfil').hidden=live; $('#live-profile').hidden=!live; $('#customize').hidden=live;
 $('#my-tab').classList.toggle('active',!live);$('#live-tab').classList.toggle('active',live);
 renderMatches(live?current?.matches:null);
}
$('#my-tab').onclick=e=>{e.preventDefault();selectLive(false);};
$('#live-tab').onclick=e=>{e.preventDefault();if(current)selectLive(true);else $('#riot-id').focus();};
function renderMatches(matches){
 $('#matches').replaceChildren(); $('#history-status').textContent=matches ? (matches.length?'Últimas partidas · LAS · Actualizadas al consultar':'No hay partidas recientes.') : 'Buscá un Riot ID para consultar sus últimas partidas.';
 for(const m of matches || []) {const row=document.createElement('article');row.className='match-row';for(const text of [m.win?'Victoria':'Derrota',m.champion,`${m.kills} / ${m.deaths} / ${m.assists}`,m.mode,`${Math.floor(m.duration/60)} min`,new Date(m.date).toLocaleDateString('es-AR')]){const span=document.createElement('span');span.textContent=text;row.append(span);}$('#matches').append(row);}
}
function renderPlayer(data){
 const clone=$('#perfil').cloneNode(true);clone.hidden=false;clone.id='remote-sanctum';
 clone.querySelectorAll('[id]').forEach(e=>{e.dataset.originalId=e.id;e.removeAttribute('id');});
 const q=s=>clone.querySelector(s);const by=id=>q(`[data-original-id="${id}"]`);
 clone.setAttribute('aria-label',`Santuario de ${data.name}`);
 q('h1').textContent=data.name;q('.level').textContent=data.level;
 q('.portrait-edit').remove();q('.portrait').disabled=true;
 const game='https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/';
 by('profile-icon').src=game+`v1/profile-icons/${data.icon}.jpg`;by('profile-icon').alt=data.name;
 const rank=data.ranks.find(r=>r.queueType==='RANKED_SOLO_5x5');const tier=rank?.tier.toLowerCase();
 const frame=catalog.frames.find(f=>f.id===tier);
 if(frame){by('profile-frame').src=frame.image;by('profile-frame').alt=frame.name;by('profile-frame').dataset.frameType=frame.type;q('.portrait').dataset.frameType=frame.type;}else by('profile-frame').hidden=true;
 const tierLabel=frame?.name || 'Sin clasificar';q('.identity-rank strong').textContent=tierLabel;
 q('.identity-rank > span:last-child').textContent='Solo/Dúo';by('rank-trigger').querySelector('strong').textContent=tierLabel;
 by('rank-emblem').src=rank?`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-${tier}.png`:catalog.assets.unranked;by('rank-emblem').alt=tierLabel;
 by('mastery-trigger').querySelector('strong').textContent=data.masteryScore;
 if(data.masteries[0]) {by('mastery-icon').src=game+`v1/champion-icons/${data.masteries[0].championId}.png`;by('mastery-icon').alt='Campeón con mayor maestría';q('.mastery-medal span').textContent=data.masteries[0].championLevel;}
 else q('.mastery-medal').hidden=true;
 for(const selector of ['#honor-art','.cup-art','.banner-art']){const art=selector.startsWith('#')?by(selector.slice(1)):q(selector);art.replaceChildren();art.parentElement.querySelector('strong').textContent='No disponible';art.parentElement.querySelector('.achievement-note').textContent='Riot no publica este dato';}
 clone.querySelectorAll('.text-button,.detail-panel').forEach(e=>e.remove());
 for(const id of ['rank-trigger','mastery-trigger']){const button=by(id);button.removeAttribute('aria-controls');button.removeAttribute('aria-expanded');button.onclick=()=>{const details=document.createElement('p');details.className='panel-source';details.textContent=id==='rank-trigger'?data.ranks.map(r=>`${r.queueType==='RANKED_SOLO_5x5'?'Solo/Dúo':'Flexible'}: ${r.tier} ${r.rank} · ${r.leaguePoints} PL · ${r.wins} victorias`).join(' / ') || 'Sin clasificar':data.masteries.map(m=>`Campeón ${m.championId}: nivel ${m.championLevel} · ${m.championPoints} puntos`).join(' / ') || 'Sin maestrías';q('.showcase-foot').replaceChildren(details);};}
 q('.showcase-foot').textContent=`Actualizado: ${new Date(data.updatedAt).toLocaleString('es-AR')}`;
 $('#live-profile').replaceChildren(clone);selectLive(true);
}
$('#riot-search').onsubmit=async e=>{
 e.preventDefault();if(busy || !catalog)return;busy=true;const button=e.currentTarget.querySelector('button');button.disabled=true;
 $('#history-status').textContent='Consultando Riot…';
 try {const response=await fetch('/api/player?id='+encodeURIComponent($('#riot-id').value.trim()));const type=response.headers.get('content-type') || '';if(!type.includes('json'))throw Error('La consulta requiere el servidor de Cloudflare Pages.');const data=await response.json();if(!response.ok)throw Error(data.error);current=data;renderPlayer(data);recent=[data.name,...recent.filter(n=>n!==data.name)].slice(0,15);suggestions();try{localStorage.setItem('rift:recent',JSON.stringify(recent));}catch{}}
 catch(error){$('#history-status').textContent=error.message;$('#history').scrollIntoView({behavior:'smooth',block:'nearest'});}
 finally{busy=false;button.disabled=false;}
};
