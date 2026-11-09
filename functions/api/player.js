// La clave permanece exclusivamente en el servidor.
export async function onRequestGet({request, env}) {
 const headers={'Cache-Control':'no-store', Vary:'Origin'};
 if(request.headers.get('Origin')==='https://germanbartoli.github.io') headers['Access-Control-Allow-Origin']='https://germanbartoli.github.io';
 const reply=(data,status=200)=>Response.json(data,{status,headers});
 const id=new URL(request.url).searchParams.get('id') || '';
 const parts=id.trim().split('#');
 if(parts.length!==2 || !parts.every(s=>s.trim()) || id.length>50) return reply({error:'Ingresá el Riot ID completo: nombre#tag.'},400);
 if(!env.RIOT_API_KEY) return reply({error:'La consulta de Riot todavía no está habilitada. Falta configurar la conexión del servidor.'},503);
 async function riot(host,path,identity=false) {
  const r=await fetch(`https://${host}.api.riotgames.com${path}`,{headers:{'X-Riot-Token':env.RIOT_API_KEY},signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw Object.assign(new Error(),{status:r.status,identity});
  return r.json();
 }
 try {
  const account=await riot('americas',`/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(parts[0].trim())}/${encodeURIComponent(parts[1].trim())}`,true);
  const p=encodeURIComponent(account.puuid);
  const [summoner,ranks,masteries]=await Promise.all([
   riot('la2',`/lol/summoner/v4/summoners/by-puuid/${p}`,true),
   riot('la2',`/lol/league/v4/entries/by-puuid/${p}`),
   riot('la2',`/lol/champion-mastery/v4/champion-masteries/by-puuid/${p}`)
  ]);
  const warnings=[];
  let ids=[];
  try {ids=await riot('americas',`/lol/match/v5/matches/by-puuid/${p}/ids?start=0&count=5`);}
  catch {warnings.push('El perfil está disponible, pero no pudimos consultar el historial de partidas. Intentá nuevamente más tarde.');}
  const results=await Promise.allSettled(ids.map(async id=>{
   const m=await riot('americas',`/lol/match/v5/matches/${encodeURIComponent(id)}`);
   const player=m.info.participants.find(x=>x.puuid===account.puuid);
   return {id,date:m.info.gameCreation,duration:m.info.gameDuration,mode:m.info.gameMode,champion:player.championName,win:player.win,kills:player.kills,deaths:player.deaths,assists:player.assists};
  }));
  const matches=results.filter(result=>result.status==='fulfilled').map(result=>result.value);
  if(matches.length<ids.length)warnings.push('Historial incompleto: algunas partidas no están disponibles. Intentá nuevamente más tarde.');
  return reply({name:`${account.gameName}#${account.tagLine}`,level:summoner.summonerLevel,icon:summoner.profileIconId,ranks,masteries:masteries.slice(0,3),masteryScore:masteries.reduce((n,m)=>n+m.championLevel,0),matches,warnings,updatedAt:new Date().toISOString()});
 } catch(e) {const status=e.status===429?429:e.status===404&&e.identity?404:502;return reply({error:status===404?'No encontramos ese Riot ID en LAS. Revisá nombre y tag.':status===429?'Riot alcanzó su límite de consultas. Intentá nuevamente en unos minutos.':'No se pudo consultar Riot. Intentá nuevamente más tarde.'},status);}
}
