'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { toFilename, parseFontFaces, familiesFromUrl } = require('../scripts/download-fonts.js');

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
