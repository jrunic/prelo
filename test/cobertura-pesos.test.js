'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { resolveBrandCss } = require('../index.js');

// Peso que o CSS resolvido de fato aplica: o valor EFETIVO de cada --peso-*
// (última declaração vence — o default do base.css é sombreado pelo tokens.css
// da marca) mais o cravado nas utilitárias. Se config.fonts não cobre, o
// Chromium sintetiza a face.
function pesosDemandados(css) {
  const efetivo = {};
  for (const m of css.matchAll(/(--peso-[a-z-]+)\s*:\s*(\d{3})/g)) efetivo[m[1]] = Number(m[2]);
  const pesos = new Set(Object.values(efetivo));
  for (const m of css.matchAll(/font-weight:\s*(\d{3})/g)) pesos.add(Number(m[1]));
  return pesos;
}

function pesosFaltando(dir, embarcados) {
  return [...pesosDemandados(resolveBrandCss(dir))].filter((w) => !embarcados.has(w));
}

test('exemplo: todo peso demandado está em config.fonts', () => {
  const dir = path.resolve(__dirname, '..', 'brands', 'exemplo');
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
  const embarcados = new Set((cfg.fonts || []).map((f) => f.weight));
  const faltando = pesosFaltando(dir, embarcados);
  assert.deepStrictEqual(faltando, [], `pesos sem fonte embarcada: ${faltando.join(', ')}`);
});

test('marca que fixa peso fora do embarcado é detectada', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-peso-'));
  fs.writeFileSync(path.join(dir, 'tokens.css'), ':root{--peso-titulo:900}');
  const faltando = pesosFaltando(dir, new Set([400]));
  assert.ok(faltando.includes(900), 'o detector precisa pegar o 900 não embarcado');
});

test('default sombreado pela marca não conta como demandado', () => {
  // base.css traz --peso-titulo: 600. Marca que sobrescreve com 700 e embarca
  // só o 700 está correta — o 600 nunca é aplicado.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-sombra-'));
  fs.writeFileSync(path.join(dir, 'tokens.css'),
    ':root{--peso-corpo:700;--peso-titulo:700;--peso-titulo-forte:700;--peso-label:500}');
  assert.deepStrictEqual(pesosFaltando(dir, new Set([500, 700])), []);
});
