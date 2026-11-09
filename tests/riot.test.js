import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/player.js';
const request=id=>new Request('https://example.com/api/player?id='+encodeURIComponent(id));

function mockRiot(fail) {
 return async url=>{
  const failure=fail(url);if(failure)return new Response('',{status:failure});
  if(url.includes('by-riot-id'))return Response.json({puuid:'p',gameName:'Nombre',tagLine:'LAS'});
  if(url.includes('/summoner/'))return Response.json({summonerLevel:30,profileIconId:1});
  if(url.includes('/league/')||url.includes('champion-masteries'))return Response.json([]);
  if(url.includes('/ids?'))return Response.json(['LA2_1','LA2_2']);
  return Response.json({info:{gameCreation:1,gameDuration:1200,gameMode:'CLASSIC',participants:[{puuid:'p',championName:'Ahri',win:true,kills:3,deaths:1,assists:4}]}});
 };
}

test('Una partida ausente conserva el perfil y las demás partidas con un aviso',async t=>{
 t.mock.method(globalThis,'fetch',mockRiot(url=>url.endsWith('/LA2_1')?404:0));
 const response=await onRequestGet({request:request('Nombre#LAS'),env:{RIOT_API_KEY:'prueba'}});
 const data=await response.json();
 assert.equal(response.status,200);assert.equal(data.name,'Nombre#LAS');
 assert.deepEqual(data.matches.map(m=>m.id),['LA2_2']);assert.match(data.warnings[0],/incompleto/);
});

test('El fallo del listado de partidas no se presenta como una cuenta inexistente',async t=>{
 t.mock.method(globalThis,'fetch',mockRiot(url=>url.includes('/ids?')?503:0));
 const response=await onRequestGet({request:request('Nombre#LAS'),env:{RIOT_API_KEY:'prueba'}});
 const data=await response.json();
 assert.equal(response.status,200);assert.equal(data.level,30);assert.deepEqual(data.matches,[]);
 assert.match(data.warnings[0],/no pudimos consultar el historial/);
});

test('Distingue una cuenta inexistente de fallos de rango, autorización y cuota',async t=>{
 for(const [path,status,expected] of [['by-riot-id',404,404],['/summoner/',404,404],['/league/',404,502],['by-riot-id',403,502],['by-riot-id',429,429]]){
  const mock=t.mock.method(globalThis,'fetch',mockRiot(url=>url.includes(path)?status:0));
  const response=await onRequestGet({request:request('Nombre#LAS'),env:{RIOT_API_KEY:'prueba'}});
  assert.equal(response.status,expected);mock.mock.restore();
 }
});
test('Rechaza identificadores incompletos antes de consultar Riot',async()=>{const r=await onRequestGet({request:request('nombre'),env:{}});assert.equal(r.status,400);});
test('Informa la conexión pendiente sin exponer secretos',async()=>{const r=await onRequestGet({request:request('nombre#LAS'),env:{}});assert.equal(r.status,503);assert.match((await r.json()).error,/conexión/);});
test('Consulta y transforma partidas, rango y maestría',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async url=>{let value;if(url.includes('by-riot-id'))value={puuid:'p',gameName:'Nombre',tagLine:'LAS'};else if(url.includes('/summoner/'))value={summonerLevel:30,profileIconId:1};else if(url.includes('/league/'))value=[];else if(url.includes('champion-masteries'))value=[{championId:21,championLevel:5}];else if(url.includes('/ids?'))value=['LA2_1'];else value={info:{gameCreation:1,gameDuration:1200,gameMode:'CLASSIC',participants:[{puuid:'p',championName:'Ahri',win:true,kills:3,deaths:1,assists:4}]}};return Response.json(value);};
 try {const r=await onRequestGet({request:request('Nombre#LAS'),env:{RIOT_API_KEY:'prueba'}});const data=await r.json();assert.equal(r.status,200);assert.equal(data.name,'Nombre#LAS');assert.equal(data.masteryScore,5);assert.equal(data.matches[0].kills,3);assert.equal(data.puuid,undefined);}finally{globalThis.fetch=original;}
});
