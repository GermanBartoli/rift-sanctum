// La clave permanece exclusivamente en el servidor.
export async function onRequestGet({request, env}) {
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 const id=new URL(request.url).searchParams.get('id') || '';
 const parts=id.trim().split('#');
 if(parts.length!==2 || !parts.every(s=>s.trim()) || id.length>50) return reply({error:'Ingresá el Riot ID completo: nombre#tag.'},400);
 if(!env.RIOT_API_KEY) return reply({error:'La consulta de Riot todavía no está habilitada. Falta configurar la conexión del servidor.'},503);
 async function riot(host,path) {
  const r=await fetch(`https://${host}.api.riotgames.com${path}`,{headers:{'X-Riot-Token':env.RIOT_API_KEY},signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw Object.assign(new Error(),{status:r.status});
  return r.json();
 }
 try {
  const account=await riot('americas',`/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(parts[0].trim())}/${encodeURIComponent(parts[1].trim())}`);
  const p=encodeURIComponent(account.puuid);
  const [summoner,ranks,masteries,ids]=await Promise.all([
   riot('la2',`/lol/summoner/v4/summoners/by-puuid/${p}`),
   riot('la2',`/lol/league/v4/entries/by-puuid/${p}`),
   riot('la2',`/lol/champion-mastery/v4/champion-masteries/by-puuid/${p}`),
   riot('americas',`/lol/match/v5/matches/by-puuid/${p}/ids?start=0&count=5`)
  ]);
  const matches=await Promise.all(ids.map(async id=>{
   const m=await riot('americas',`/lol/match/v5/matches/${encodeURIComponent(id)}`);
   const player=m.info.participants.find(x=>x.puuid===account.puuid);
   return {id,date:m.info.gameCreation,duration:m.info.gameDuration,mode:m.info.gameMode,champion:player.championName,win:player.win,kills:player.kills,deaths:player.deaths,assists:player.assists};
  }));
  return reply({name:`${account.gameName}#${account.tagLine}`,level:summoner.summonerLevel,icon:summoner.profileIconId,ranks,masteries:masteries.slice(0,3),masteryScore:masteries.reduce((n,m)=>n+m.championLevel,0),matches,updatedAt:new Date().toISOString()});
 } catch(e) {const status=[404,429].includes(e.status)?e.status:502;return reply({error:status===404?'No encontramos ese Riot ID en LAS. Revisá nombre y tag.':status===429?'Riot alcanzó su límite de consultas. Intentá nuevamente en unos minutos.':'No se pudo consultar Riot. Intentá nuevamente más tarde.'},status);}
}
