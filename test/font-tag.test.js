'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildLocalFontTag } = require('../index.js');

function tmpBrand(fonts, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-brand-'));
  fs.mkdirSync(path.join(dir, 'fonts'), { recursive: true });
  for (const f of files) fs.writeFileSync(path.join(dir, 'fonts', f), 'x');
  return dir;
}

test('sem config.fonts → null (CDN)', () => {
  const dir = tmpBrand([], []);
  assert.strictEqual(buildLocalFontTag(dir, { name: 'X' }), null);
});

test('config.fonts vazio → null', () => {
  const dir = tmpBrand([], []);
  assert.strictEqual(buildLocalFontTag(dir, { fonts: [] }), null);
});

test('todas as fontes presentes → @font-face de cada uma', () => {
  const fonts = [
    { family: 'Inter', weight: 400, file: 'inter-400.woff2' },
    { family: 'Inter', weight: 700, file: 'inter-700.woff2' },
  ];
  const dir = tmpBrand(fonts, ['inter-400.woff2', 'inter-700.woff2']);
  const tag = buildLocalFontTag(dir, { fonts });
  assert.match(tag, /font-family:'Inter';font-weight:400/);
  assert.match(tag, /font-family:'Inter';font-weight:700/);
  assert.match(tag, /inter-400\.woff2/);
});

test('face com arquivo ausente é omitida, resto sobrevive', () => {
  const fonts = [
    { family: 'Inter', weight: 400, file: 'inter-400.woff2' },
    { family: 'Inter', weight: 700, file: 'inter-700.woff2' },
  ];
  const dir = tmpBrand(fonts, ['inter-400.woff2']); // 700 ausente
  const tag = buildLocalFontTag(dir, { fonts });
  assert.match(tag, /font-weight:400/);
  assert.doesNotMatch(tag, /font-weight:700/);
});

test('nenhuma face resolve → null (CDN)', () => {
  const fonts = [{ family: 'Inter', weight: 400, file: 'inter-400.woff2' }];
  const dir = tmpBrand(fonts, []); // arquivo não existe
  assert.strictEqual(buildLocalFontTag(dir, { fonts }), null);
});
