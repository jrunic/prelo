'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mdToPdf, resolveBrandCss } = require('../index.js');

const BASE = fs.readFileSync(
  path.resolve(__dirname, '..', 'templates', 'base.css'), 'utf8'
).trimEnd();

const TOKENS = ':root{--cor-texto:#123456;--cor-titulo-forte:#654321;--peso-titulo:700}';

// Fonte local (não CDN) de propósito: sem ela, buildLocalFontTag devolve null,
// o template cai no <link> do Google Fonts e o networkidle0 do Puppeteer espera
// a rede — a suíte trava offline. O teste é sobre camadas de CSS, não sobre
// entrega de fonte.
const FONTE_LOCAL = path.resolve(__dirname, '..', 'brands', 'exemplo', 'fonts', 'inter-400.woff2');

const CONFIG = JSON.stringify({
  name: 'Fixture',
  fonts: [{ family: 'Inter', weight: 400, file: 'inter-400.woff2' }],
  page: { format: 'A4', margin: { top: '20mm', right: '18mm', bottom: '24mm', left: '18mm' } },
});

const MD = '# Título\n\nParágrafo de teste.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n';

// A mesma marca expressa das duas formas: tokens sobre a base da ferramenta,
// e uma folha completa que é literalmente base + os mesmos tokens.
function montaFixtures() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-equiv-'));
  const viaTokens = path.join(raiz, 'via-tokens');
  const viaLegada = path.join(raiz, 'via-legada');
  for (const dir of [viaTokens, viaLegada]) {
    fs.mkdirSync(path.join(dir, 'fonts'), { recursive: true });
    fs.copyFileSync(FONTE_LOCAL, path.join(dir, 'fonts', 'inter-400.woff2'));
    fs.writeFileSync(path.join(dir, 'config.json'), CONFIG);
  }
  fs.writeFileSync(path.join(viaTokens, 'tokens.css'), TOKENS);
  fs.writeFileSync(path.join(viaLegada, 'style.css'), `${BASE}\n${TOKENS}`);
  return raiz;
}

test('as duas expressões produzem CSS resolvido idêntico', () => {
  const raiz = montaFixtures();
  assert.strictEqual(
    resolveBrandCss(path.join(raiz, 'via-tokens')),
    resolveBrandCss(path.join(raiz, 'via-legada'))
  );
});

test('as duas expressões produzem PDFs equivalentes', async () => {
  const raiz = montaFixtures();
  const anterior = process.env.PRELO_BRANDS_DIR;
  process.env.PRELO_BRANDS_DIR = raiz;
  try {
    const a = await mdToPdf({ markdown: MD, brand: 'via-tokens' });
    const b = await mdToPdf({ markdown: MD, brand: 'via-legada' });
    const paginas = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    // Puppeteer pode usar object streams comprimidos — /Type /Page nem sempre está
    // em texto plano. Sem esta guarda, a igualdade abaixo compararia 0 === 0.
    assert.ok(paginas(a) > 0, 'contagem de páginas não legível em texto plano');
    assert.strictEqual(paginas(a), paginas(b));
    assert.ok(Math.abs(a.length - b.length) < 4096, `tamanhos divergem: ${a.length} vs ${b.length}`);
  } finally {
    if (anterior === undefined) delete process.env.PRELO_BRANDS_DIR;
    else process.env.PRELO_BRANDS_DIR = anterior;
  }
});
