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

const { reescreveReferenciasDoDocumento } = require('../index.js');

const r = (html, opts = {}) => reescreveReferenciasDoDocumento(html, '/tmp/base', opts);

test('imagem relativa vira file:// absoluto', () => {
  const { html } = r('<img src="fotos/x.png" alt="a">');
  assert.match(html, /src="file:\/\/\/tmp\/base\/fotos\/x\.png"/);
});

test('imagem remota, data:, file:// e absoluta ficam intocadas', () => {
  const entrada = '<img src="https://a/b.png"><img src="data:image/png;base64,AA">' +
                  '<img src="file:///x.png"><img src="/etc/x.png">';
  assert.strictEqual(r(entrada).html, entrada);
});

test('img escrita como HTML cru também é resolvida', () => {
  const { html } = r('<p>texto</p>\n<img src="logo.png">');
  assert.match(html, /src="file:\/\/\/tmp\/base\/logo\.png"/);
});

test('link http, mailto, tel e fragmento ficam intocados', () => {
  const entrada = '<a href="https://a/b">w</a><a href="mailto:a@b.com">m</a>' +
                  '<a href="tel:+55">t</a><a href="#secao">f</a>';
  assert.strictEqual(r(entrada).html, entrada);
});

test('link absoluto e file:// ficam intocados', () => {
  const entrada = '<a href="/etc/hosts">a</a><a href="file:///etc/hosts">f</a>';
  assert.strictEqual(r(entrada).html, entrada);
});

test('link relativo sem baseUrl perde o href e mantém o texto', () => {
  const { html } = r('<a href="anexo.pdf">o anexo</a>');
  assert.strictEqual(html, '<a>o anexo</a>');
});

test('remoção do href preserva os outros atributos, sem espaço residual', () => {
  assert.strictEqual(r('<a href="x.pdf" title="t">y</a>').html, '<a title="t">y</a>');
  assert.strictEqual(r('<a class="c" href="x.pdf">y</a>').html, '<a class="c">y</a>');
  assert.strictEqual(
    r('<a class="c" href="x.pdf" title="t &gt; u">y</a>').html,
    '<a class="c" title="t &gt; u">y</a>');
});

test('link relativo com baseUrl vira URL pública', () => {
  const { html } = r('<a href="anexo.pdf">x</a>', { baseUrl: 'https://site.com/docs/' });
  assert.match(html, /href="https:\/\/site\.com\/docs\/anexo\.pdf"/);
});

test('substituição por baseUrl preserva os outros atributos', () => {
  const { html } = r('<a class="c" href="x.pdf" title="t">y</a>', { baseUrl: 'https://s.com/d/' });
  assert.strictEqual(html, '<a class="c" href="https://s.com/d/x.pdf" title="t">y</a>');
});

test('baseUrl sem barra final substitui o último segmento (regra WHATWG)', () => {
  const { html } = r('<a href="anexo.pdf">x</a>', { baseUrl: 'https://site.com/docs' });
  assert.match(html, /href="https:\/\/site\.com\/anexo\.pdf"/);
});

test('baseUrl não afeta imagem — imagem resolve sempre local', () => {
  const { html } = r('<img src="fotos/x.png">', { baseUrl: 'https://site.com/docs/' });
  assert.match(html, /src="file:\/\/\/tmp\/base\/fotos\/x\.png"/);
});

test('bloco de código com tag de imagem sai literal', () => {
  const entrada = '<pre><code>&lt;img src=&quot;nao.png&quot;&gt;</code></pre>';
  assert.strictEqual(r(entrada).html, entrada);
});

test('imagem ausente em disco é reportada, e ainda assim reescrita', () => {
  const { html, imagensAusentes } = r('<img src="fotos/sumiu.png">');
  assert.match(html, /src="file:\/\/\/tmp\/base\/fotos\/sumiu\.png"/);
  assert.deepStrictEqual(imagensAusentes, [
    { original: 'fotos/sumiu.png', resolvido: '/tmp/base/fotos/sumiu.png' },
  ]);
});

test('imagem presente em disco não entra em imagensAusentes', () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-img-'));
  fs.mkdirSync(path.join(dir, 'fotos'));
  fs.writeFileSync(path.join(dir, 'fotos', 'existe.png'), 'x');
  const res = reescreveReferenciasDoDocumento('<img src="fotos/existe.png">', dir);
  assert.deepStrictEqual(res.imagensAusentes, []);
});

const { reescreveUrlsDoCss } = require('../index.js');

test('url() sem aspas resolve contra a pasta da marca', () => {
  const css = reescreveUrlsDoCss('h1{background:url(logo.png)}', '/tmp/marca');
  assert.match(css, /url\("file:\/\/\/tmp\/marca\/logo\.png"\)/);
});

test('url() com aspas simples resolve', () => {
  const css = reescreveUrlsDoCss("h1{background:url('logo.png')}", '/tmp/marca');
  assert.match(css, /url\("file:\/\/\/tmp\/marca\/logo\.png"\)/);
});

test('url() com aspas duplas resolve', () => {
  const css = reescreveUrlsDoCss('h1{background:url("logo.png")}', '/tmp/marca');
  assert.match(css, /url\("file:\/\/\/tmp\/marca\/logo\.png"\)/);
});

test('url() com espaço interno resolve', () => {
  const css = reescreveUrlsDoCss('h1{background:url( logo.png )}', '/tmp/marca');
  assert.match(css, /url\("file:\/\/\/tmp\/marca\/logo\.png"\)/);
});

test('url() remota, data: e absoluta ficam intocadas', () => {
  const entrada = 'a{background:url(https://a/b.png)}b{background:url(data:image/png;base64,AA)}' +
                  'c{background:url(/etc/x.png)}';
  assert.strictEqual(reescreveUrlsDoCss(entrada, '/tmp/marca'), entrada);
});

test('CSS sem url() sai idêntico', () => {
  const entrada = ':root{--cor-texto:#111}\nbody{color:var(--cor-texto)}';
  assert.strictEqual(reescreveUrlsDoCss(entrada, '/tmp/marca'), entrada);
});
