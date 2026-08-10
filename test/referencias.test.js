'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { ehReferenciaRelativa, paraFileUrl } = require('../index.js');

test('caminho simples e com ../ são relativos', () => {
  assert.strictEqual(ehReferenciaRelativa('fotos/x.png'), true);
  assert.strictEqual(ehReferenciaRelativa('../x.png'), true);
  assert.strictEqual(ehReferenciaRelativa('x.png'), true);
});

test('qualquer esquema não é relativo', () => {
  for (const r of ['http://a/b', 'https://a/b', 'data:image/png;base64,AA',
                   'file:///x', 'mailto:a@b.com', 'tel:+55', 'ftp://a/b']) {
    assert.strictEqual(ehReferenciaRelativa(r), false, r);
  }
});

test('absoluto, protocolo-relativo e fragmento não são relativos', () => {
  assert.strictEqual(ehReferenciaRelativa('/etc/hosts'), false);
  assert.strictEqual(ehReferenciaRelativa('//cdn.exemplo/x.png'), false);
  assert.strictEqual(ehReferenciaRelativa('#secao'), false);
});

test('vazio e ausente não são relativos', () => {
  assert.strictEqual(ehReferenciaRelativa(''), false);
  assert.strictEqual(ehReferenciaRelativa(undefined), false);
});

test('paraFileUrl produz file:// absoluto contra a base', () => {
  const url = paraFileUrl('/tmp/base', 'fotos/x.png');
  assert.ok(url.startsWith('file:///'), url);
  assert.ok(url.endsWith('/tmp/base/fotos/x.png'), url);
});

test('paraFileUrl normaliza ../', () => {
  assert.ok(paraFileUrl('/tmp/base/sub', '../x.png').endsWith('/tmp/base/x.png'));
});

test('paraFileUrl codifica espaço no nome', () => {
  assert.ok(paraFileUrl('/tmp/base', 'foto com espaco.png').includes('%20'));
});
