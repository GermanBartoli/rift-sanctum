import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/player.js';

test('GitHub Pages recibe los errores de validación sin consultar Riot', async () => {
  for (const origin of ['https://germanbartoli.github.io', 'https://otro.example']) {
    const response = await onRequestGet({ request: new Request('https://rift.example/api/player?id=incompleto', { headers: { Origin: origin } }), env: {} });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin === 'https://germanbartoli.github.io' ? origin : null);
    assert.match((await response.json()).error, /Riot ID/);
  }
});
