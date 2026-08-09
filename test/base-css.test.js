'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const BASE_PATH = path.resolve(__dirname, '..', 'templates', 'base.css');
const CSS = fs.readFileSync(BASE_PATH, 'utf8');
const ROOT = CSS.match(/:root\s*\{([\s\S]*?)\n\}/)[1];
const ESTRUTURA = CSS.replace(/:root\s*\{[\s\S]*?\n\}/, '');

test('todo var(--*) usado tem default no :root', () => {
  const declarados = new Set([...ROOT.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const usados = new Set([...CSS.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  const faltando = [...usados].filter((t) => !declarados.has(t));
  assert.deepStrictEqual(faltando, [], `tokens sem default: ${faltando.join(', ')}`);
});

test('comentários balanceados — nenhum /* sem seu */', () => {
  const abre = (CSS.match(/\/\*/g) || []).length;
  const fecha = (CSS.match(/\*\//g) || []).length;
  assert.strictEqual(abre, fecha, `comentários desbalanceados: ${abre} abrem, ${fecha} fecham`);
});

test('nenhuma seta de mapeamento do gerador sobrou', () => {
  assert.ok(!CSS.includes('←'), 'base.css não documenta a origem no DESIGN.md — isso é do gerador');
});

test('nenhuma cor literal fora do :root', () => {
  const literais = [...ESTRUTURA.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
  assert.deepStrictEqual(literais, [], `cores cravadas na estrutura: ${literais.join(', ')}`);
});

test('nenhuma família de fonte literal fora do :root', () => {
  // Extrai o valor e só então testa se é var() — lookahead após \s* sofre backtrack.
  const literais = [...ESTRUTURA.matchAll(/font-family:\s*([^;]+)/g)]
    .map((m) => m[1].trim())
    .filter((v) => !v.startsWith('var('));
  assert.deepStrictEqual(literais, [], `famílias cravadas: ${literais.join(', ')}`);
});

test('cores de estado degradam para a cor de texto', () => {
  assert.match(ROOT, /--cor-alerta:\s*var\(--cor-texto\)/);
  assert.match(ROOT, /--cor-ok:\s*var\(--cor-texto\)/);
});
