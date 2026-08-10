'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mdToPdf } = require('../index.js');
const { urisDoPdf, contaAnotacoesLink, contaObjetosImagem, largurasDeImagem } = require('./helpers/pdf.js');

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQAY3Y2wAAAAAElFTkSuQmCC',
  'base64');

// Fonte local de propósito: sem config.fonts o template cai no CDN e o
// networkidle0 espera a rede, travando a suíte offline.
const FONTE = path.resolve(__dirname, '..', 'brands', 'exemplo', 'fonts', 'inter-400.woff2');

const CONFIG = JSON.stringify({
  name: 'Fx',
  fonts: [{ family: 'Inter', weight: 400, file: 'inter-400.woff2' }],
  page: { format: 'A4', margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } },
});

function cenario({ md, tokens = ':root{--cor-texto:#111}', extraCss, arquivosDaMarca = {} }) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-pdf-'));
  const doc = path.join(raiz, 'doc');
  const marcas = path.join(raiz, 'marcas');
  const marca = path.join(marcas, 'fx');
  fs.mkdirSync(path.join(doc, 'fotos'), { recursive: true });
  fs.mkdirSync(path.join(marca, 'fonts'), { recursive: true });
  fs.writeFileSync(path.join(doc, 'fotos', 'x.png'), PNG_1X1);
  fs.writeFileSync(path.join(doc, 'doc.md'), md);
  fs.writeFileSync(path.join(marca, 'tokens.css'), tokens);
  fs.writeFileSync(path.join(marca, 'config.json'), CONFIG);
  fs.copyFileSync(FONTE, path.join(marca, 'fonts', 'inter-400.woff2'));
  if (extraCss) fs.writeFileSync(path.join(marca, 'extra.css'), extraCss);
  for (const [nome, conteudo] of Object.entries(arquivosDaMarca)) {
    fs.writeFileSync(path.join(marca, nome), conteudo);
  }
  return { raiz, doc, marcas };
}

async function render({ doc, marcas }, opts = {}) {
  const anterior = process.env.PRELO_BRANDS_DIR;
  process.env.PRELO_BRANDS_DIR = marcas;
  try {
    return await mdToPdf({
      markdown: fs.readFileSync(path.join(doc, 'doc.md'), 'utf8'),
      brand: 'fx',
      baseDir: doc,
      ...opts,
    });
  } finally {
    if (anterior === undefined) delete process.env.PRELO_BRANDS_DIR;
    else process.env.PRELO_BRANDS_DIR = anterior;
  }
}

test('imagem relativa é a foto real, não o ícone de quebrado', async () => {
  const c = cenario({ md: '# T\n\n<img src="fotos/x.png" width="40">\n' });
  const larguras = largurasDeImagem(await render(c));
  // Contar objetos de imagem seria vazio: o ícone de quebrado TAMBÉM é objeto de
  // imagem (/Width 14). O PNG de fixture é 1x1 — só a largura 1 prova que a foto
  // resolveu. Verificado: contra o código anterior esta asserção falha.
  assert.deepStrictEqual(larguras, [1], `larguras encontradas: ${larguras}`);
});

test('imagem ausente rende o ícone de quebrado, não a foto', async () => {
  const c = cenario({ md: '# T\n\n<img src="fotos/nao-existe.png" width="40">\n' });
  const larguras = largurasDeImagem(await render(c));
  assert.ok(larguras.length > 0, 'nenhum objeto de imagem — asserção seria vazia');
  assert.ok(!larguras.includes(1), `não devia haver a foto 1x1: ${larguras}`);
});

test('nenhuma URI do PDF contém o diretório temporário', async () => {
  const c = cenario({ md: '[rel](anexo.pdf)\n\n[web](https://example.com/p)\n' });
  const uris = urisDoPdf(await render(c));
  // Guarda contra asserção vazia: sem ao menos uma URI, o teste passaria
  // contra qualquer código, inclusive o que tem o bug.
  assert.ok(uris.length > 0, 'nenhuma URI extraída — asserção seria vazia');
  const tmp = os.tmpdir();
  assert.deepStrictEqual(uris.filter((u) => u.includes(tmp)), []);
});

test('http, mailto e tel sobrevivem como anotação', async () => {
  const c = cenario({
    md: '[w](https://example.com/p)\n\n[m](mailto:a@b.com)\n\n[t](tel:+5565999999999)\n',
  });
  const uris = urisDoPdf(await render(c));
  assert.ok(uris.includes('https://example.com/p'));
  assert.ok(uris.includes('mailto:a@b.com'));
  assert.ok(uris.includes('tel:+5565999999999'));
});

test('link relativo sem baseUrl some da contagem de anotações', async () => {
  const c = cenario({ md: '[rel](anexo.pdf)\n\n[w](https://example.com/p)\n' });
  const pdf = await render(c);
  // Um único link preservado no documento → exatamente uma anotação.
  // Afirmar "não gerou anotação" seria indistinguível do comportamento atual.
  assert.strictEqual(contaAnotacoesLink(pdf), 1);
  assert.deepStrictEqual(urisDoPdf(pdf), ['https://example.com/p']);
});

test('link relativo com baseUrl vira URL pública no PDF', async () => {
  const c = cenario({ md: '[rel](anexo.pdf)\n' });
  const uris = urisDoPdf(await render(c, { baseUrl: 'https://site.com/docs/' }));
  assert.deepStrictEqual(uris, ['https://site.com/docs/anexo.pdf']);
});

test('url() do extra.css da marca carrega a imagem', async () => {
  const c = cenario({
    md: '# T\n\ntexto\n',
    extraCss: 'h1{background:url(logo.png) no-repeat;height:40px}',
    arquivosDaMarca: { 'logo.png': PNG_1X1 },
  });
  assert.ok(contaObjetosImagem(await render(c)) > 0, 'logo da marca não foi embutida');
});
