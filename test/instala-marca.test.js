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

test('origem sem style/config → lança erro', () => {
  const vazia = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-vazia-'));
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  assert.throws(() => copiaPayloadMarca(vazia, destino), /style\.css e config\.json/);
});
