'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { resolveBrandCss } = require('../index.js');

const BASE = fs.readFileSync(
  path.resolve(__dirname, '..', 'templates', 'base.css'), 'utf8'
).trimEnd();

function marca(arquivos) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-marca-'));
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    fs.writeFileSync(path.join(dir, nome), conteudo);
  }
  return dir;
}

test('via tokens: base.css + tokens.css, nessa ordem', () => {
  const dir = marca({ 'tokens.css': ':root{--cor-texto:#123456}' });
  const css = resolveBrandCss(dir);
  assert.ok(css.startsWith(BASE), 'base.css deve vir primeiro');
  assert.ok(css.endsWith(':root{--cor-texto:#123456}'), 'tokens.css deve vir por último');
});

test('via legada: style.css sozinho, sem base.css', () => {
  const dir = marca({ 'style.css': 'body{color:red}' });
  assert.strictEqual(resolveBrandCss(dir), 'body{color:red}');
});

test('tokens vence style.css quando os dois existem', () => {
  const dir = marca({
    'tokens.css': ':root{--cor-texto:#111}',
    'style.css': 'body{color:red}',
  });
  const css = resolveBrandCss(dir);
  assert.ok(css.includes('--cor-texto:#111'));
  assert.ok(!css.includes('body{color:red}'));
});

test('extra.css entra depois dos tokens', () => {
  const dir = marca({
    'tokens.css': ':root{--cor-texto:#111}',
    'extra.css': '.selo{display:none}',
  });
  const css = resolveBrandCss(dir);
  assert.ok(css.indexOf('--cor-texto:#111') < css.indexOf('.selo{display:none}'));
  assert.ok(css.endsWith('.selo{display:none}'));
});

test('extra.css ausente não quebra a via de tokens', () => {
  const dir = marca({ 'tokens.css': ':root{--cor-texto:#111}' });
  assert.doesNotThrow(() => resolveBrandCss(dir));
});

test('extra.css é ignorado na via legada', () => {
  const dir = marca({
    'style.css': 'body{color:red}',
    'extra.css': '.selo{display:none}',
  });
  assert.strictEqual(resolveBrandCss(dir), 'body{color:red}');
});

test('marca sem folha alguma: erro nomeia as duas vias', () => {
  const dir = marca({});
  assert.throws(() => resolveBrandCss(dir), /tokens\.css.*style\.css/s);
});

test('camadas separadas por quebra de linha (não colam regras)', () => {
  const dir = marca({ 'tokens.css': ':root{--cor-texto:#111}' });
  const css = resolveBrandCss(dir);
  assert.ok(css.includes('\n:root{--cor-texto:#111}'));
});
