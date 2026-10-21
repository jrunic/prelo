'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { toFilename, parseFontFaces, pickLatinFaces, familiesFromUrl } = require('../scripts/download-fonts.js');

test('toFilename normaliza família e peso', () => {
  assert.strictEqual(toFilename('Plus Jakarta Sans', 600), 'plus-jakarta-sans-600.woff2');
  assert.strictEqual(toFilename('Inter', 400), 'inter-400.woff2');
});

test('parseFontFaces extrai family/weight/url', () => {
  const css = "@font-face{font-family:'Inter';font-weight:400;src:url(https://x/a.woff2) format('woff2');}";
  const faces = parseFontFaces(css);
  assert.strictEqual(faces.length, 1);
  assert.strictEqual(faces[0].family, 'Inter');
  assert.strictEqual(faces[0].weight, '400');
  assert.match(faces[0].url, /a\.woff2/);
});

test('familiesFromUrl extrai famílias da googleFontsUrl', () => {
  const url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Asap:wght@400&display=swap';
  assert.deepStrictEqual(familiesFromUrl(url), ['Inter', 'Asap']);
});

const CSS_GOOGLE = `
/* cyrillic-ext */
@font-face{font-family:'Plus Jakarta Sans';font-weight:400;src:url(https://x/cyr.woff2) format('woff2');unicode-range:U+0460-052F,U+1C80-1C8A;}
/* latin-ext */
@font-face{font-family:'Plus Jakarta Sans';font-weight:400;src:url(https://x/lext.woff2) format('woff2');unicode-range:U+0100-02BA;}
/* latin */
@font-face{font-family:'Plus Jakarta Sans';font-weight:400;src:url(https://x/lat.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131;}
/* cyrillic-ext */
@font-face{font-family:'Plus Jakarta Sans';font-weight:600;src:url(https://x/cyr6.woff2) format('woff2');unicode-range:U+0460-052F;}
/* latin */
@font-face{font-family:'Plus Jakarta Sans';font-weight:600;src:url(https://x/lat6.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131;}
`;

test('pickLatinFaces escolhe o subset latino, não o primeiro (cirílico)', () => {
  const faces = pickLatinFaces(parseFontFaces(CSS_GOOGLE));
  assert.deepStrictEqual(faces.map(f => [f.weight, f.url]), [
    ['400', 'https://x/lat.woff2'],
    ['600', 'https://x/lat6.woff2'],
  ]);
});

test('pickLatinFaces reconhece o latino por unicode-range quando falta o comentário', () => {
  const css = CSS_GOOGLE.replace(/\/\* [\w-]+ \*\//g, '');
  const faces = pickLatinFaces(parseFontFaces(css));
  assert.deepStrictEqual(faces.map(f => f.url), ['https://x/lat.woff2', 'https://x/lat6.woff2']);
});

test('pickLatinFaces mantém a única face quando o CSS não tem subsets', () => {
  const css = "@font-face{font-family:'Inter';font-weight:400;src:url(https://x/a.woff2) format('woff2');}";
  assert.deepStrictEqual(pickLatinFaces(parseFontFaces(css)).map(f => f.url), ['https://x/a.woff2']);
});
