import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/player.js';
const request=id=>new Request('https://example.com/api/player?id='+encodeURIComponent(id));
test('Rechaza identificadores incompletos antes de consultar Riot',async()=>{const r=await onRequestGet({request:request('nombre'),env:{}});assert.equal(r.status,400);});
test('Informa la conexión pendiente sin exponer secretos',async()=>{const r=await onRequestGet({request:request('nombre#LAS'),env:{}});assert.equal(r.status,503);assert.match((await r.json()).error,/conexión/);});
test('Consulta y transforma partidas, rango y maestría',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async url=>{let value;if(url.includes('by-riot-id'))value={puuid:'p',gameName:'Nombre',tagLine:'LAS'};else if(url.includes('/summoner/'))value={summonerLevel:30,profileIconId:1};else if(url.includes('/league/'))value=[];else if(url.includes('champion-masteries'))value=[{championId:21,championLevel:5}];else if(url.includes('/ids?'))value=['LA2_1'];else value={info:{gameCreation:1,gameDuration:1200,gameMode:'CLASSIC',participants:[{puuid:'p',championName:'Ahri',win:true,kills:3,deaths:1,assists:4}]}};return Response.json(value);};
 try {const r=await onRequestGet({request:request('Nombre#LAS'),env:{RIOT_API_KEY:'prueba'}});const data=await r.json();assert.equal(r.status,200);assert.equal(data.name,'Nombre#LAS');assert.equal(data.masteryScore,5);assert.equal(data.matches[0].kills,3);assert.equal(data.puuid,undefined);}finally{globalThis.fetch=original;}
});
