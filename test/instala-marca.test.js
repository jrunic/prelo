'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { copiaPayloadMarca } = require('../cli.js');

function origemComFonts(comFonts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-origem-'));
  fs.writeFileSync(path.join(dir, 'style.css'), 'body{}');
  fs.writeFileSync(path.join(dir, 'config.json'), '{"name":"X"}');
  if (comFonts) {
    fs.mkdirSync(path.join(dir, 'fonts'));
    fs.writeFileSync(path.join(dir, 'fonts', 'inter-400.woff2'), 'x');
  }
  return dir;
}

test('copia style.css e config.json sempre', () => {
  const origem = origemComFonts(false);
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const copiados = copiaPayloadMarca(origem, destino);
  assert.ok(fs.existsSync(path.join(destino, 'style.css')));
  assert.ok(fs.existsSync(path.join(destino, 'config.json')));
  assert.ok(copiados.includes('style.css'));
});

test('copia fonts/ quando presente', () => {
  const origem = origemComFonts(true);
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  copiaPayloadMarca(origem, destino);
  assert.ok(fs.existsSync(path.join(destino, 'fonts', 'inter-400.woff2')));
});

test('sem fonts/ na origem → destino sem fonts/ (sem erro)', () => {
  const origem = origemComFonts(false);
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  copiaPayloadMarca(origem, destino);
  assert.strictEqual(fs.existsSync(path.join(destino, 'fonts')), false);
});

test('origem sem folha nem config → erro nomeia as duas vias', () => {
  const vazia = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-vazia-'));
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  assert.throws(() => copiaPayloadMarca(vazia, destino), /config\.json/);
});

function origemTokens(extras = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-origem-tok-'));
  fs.writeFileSync(path.join(dir, 'tokens.css'), ':root{--cor-texto:#111}');
  fs.writeFileSync(path.join(dir, 'config.json'), '{"name":"X"}');
  for (const [nome, conteudo] of Object.entries(extras)) {
    fs.writeFileSync(path.join(dir, nome), conteudo);
  }
  return dir;
}

test('origem só com tokens.css é aceita', () => {
  const origem = origemTokens();
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const copiados = copiaPayloadMarca(origem, destino);
  assert.ok(fs.existsSync(path.join(destino, 'tokens.css')));
  assert.ok(fs.existsSync(path.join(destino, 'config.json')));
  assert.ok(copiados.includes('tokens.css'));
  assert.strictEqual(fs.existsSync(path.join(destino, 'style.css')), false);
});

test('extra.css é copiado quando presente', () => {
  const origem = origemTokens({ 'extra.css': '.selo{display:none}' });
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const copiados = copiaPayloadMarca(origem, destino);
  assert.ok(fs.existsSync(path.join(destino, 'extra.css')));
  assert.ok(copiados.includes('extra.css'));
});

test('extra.css ausente não é copiado nem listado', () => {
  const origem = origemTokens();
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const copiados = copiaPayloadMarca(origem, destino);
  assert.strictEqual(fs.existsSync(path.join(destino, 'extra.css')), false);
  assert.ok(!copiados.includes('extra.css'));
});

test('origem com folha mas sem config.json → erro', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-sem-config-'));
  fs.writeFileSync(path.join(dir, 'tokens.css'), ':root{}');
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  assert.throws(() => copiaPayloadMarca(dir, destino), /config\.json/);
});

test('origem com config mas sem folha → erro nomeia tokens.css e style.css', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-sem-folha-'));
  fs.writeFileSync(path.join(dir, 'config.json'), '{"name":"X"}');
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  assert.throws(() => copiaPayloadMarca(dir, destino), /tokens\.css.*style\.css/s);
});
