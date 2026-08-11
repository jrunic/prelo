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

function origemComImagens(extras = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-img-'));
  fs.mkdirSync(path.join(dir, 'images'));
  fs.writeFileSync(path.join(dir, 'images', 'logo.png'), 'png');
  fs.writeFileSync(path.join(dir, 'tokens.css'), ':root{}');
  fs.writeFileSync(path.join(dir, 'config.json'), '{"name":"X"}');
  for (const [nome, conteudo] of Object.entries(extras)) {
    const alvo = path.join(dir, nome);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, conteudo);
  }
  return dir;
}

test('images/ é copiada e cada arquivo entra na lista de copiados', () => {
  const origem = origemComImagens({ 'images/marca-dagua.png': 'png2' });
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const copiados = copiaPayloadMarca(origem, destino);
  assert.ok(fs.existsSync(path.join(destino, 'images', 'logo.png')));
  assert.ok(fs.existsSync(path.join(destino, 'images', 'marca-dagua.png')));
  assert.ok(copiados.includes(path.join('images', 'logo.png')));
  assert.ok(copiados.includes(path.join('images', 'marca-dagua.png')));
});

test('sem images/ na origem → destino sem images/ (sem erro)', () => {
  const origem = origemTokens();
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  assert.doesNotThrow(() => copiaPayloadMarca(origem, destino));
  assert.strictEqual(fs.existsSync(path.join(destino, 'images')), false);
});

test('a subpasta é a fronteira: imagem solta na raiz não é copiada', () => {
  // O código atual já não varre a raiz, mas este é o caso que um contribuidor
  // futuro poderia "consertar" adicionando a varredura — e levaria junto
  // .DS_Store, rascunho e README da marca.
  const origem = origemComImagens();
  fs.writeFileSync(path.join(origem, 'solta.png'), 'png');
  fs.writeFileSync(path.join(origem, '.DS_Store'), 'lixo');
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const copiados = copiaPayloadMarca(origem, destino);
  assert.ok(fs.existsSync(path.join(destino, 'images', 'logo.png')));
  assert.strictEqual(fs.existsSync(path.join(destino, 'solta.png')), false);
  assert.strictEqual(fs.existsSync(path.join(destino, '.DS_Store')), false);
  assert.ok(!copiados.some((c) => c === 'solta.png' || c === '.DS_Store'));
});

test('marca legada com extra.css: o arquivo é ignorado e o chamador é avisado', () => {
  const origem = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-leg-'));
  fs.writeFileSync(path.join(origem, 'style.css'), 'body{}');
  fs.writeFileSync(path.join(origem, 'extra.css'), 'h1{color:red}');
  fs.writeFileSync(path.join(origem, 'config.json'), '{"name":"X"}');
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const avisos = [];
  const copiados = copiaPayloadMarca(origem, destino, { onAviso: (a) => avisos.push(a) });
  assert.strictEqual(fs.existsSync(path.join(destino, 'extra.css')), false);
  assert.ok(!copiados.includes('extra.css'));
  assert.strictEqual(avisos.length, 1);
  assert.strictEqual(avisos[0].arquivo, 'extra.css');
  assert.match(avisos[0].motivo, /style\.css/);
});

test('marca em tokens.css com extra.css não gera aviso', () => {
  const origem = origemTokens({ 'extra.css': '.selo{display:none}' });
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const avisos = [];
  copiaPayloadMarca(origem, destino, { onAviso: (a) => avisos.push(a) });
  assert.deepStrictEqual(avisos, []);
});

test('marca legada sem extra.css não gera aviso', () => {
  const origem = origemComFonts(false);
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-destino-'));
  const avisos = [];
  copiaPayloadMarca(origem, destino, { onAviso: (a) => avisos.push(a) });
  assert.deepStrictEqual(avisos, []);
});
