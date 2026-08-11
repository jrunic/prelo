'use strict';
// Round-trip: origem → prelo instalar → renderizar A PARTIR DO DESTINO INSTALADO.
// Renderizar da origem esconde o defeito que esta suíte existe para pegar — o
// arquivo está lá de qualquer jeito. Só o destino instalado revela o que o
// instalador de fato levou.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mdToPdf } = require('../index.js');
const { copiaPayloadMarca } = require('../cli.js');
const { largurasDeImagem } = require('./helpers/pdf.js');

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQAY3Y2wAAAAAElFTkSuQmCC',
  'base64');

const FONTE = path.resolve(__dirname, '..', 'brands', 'exemplo', 'fonts', 'inter-400.woff2');

const CONFIG = JSON.stringify({
  name: 'Fx',
  fonts: [{ family: 'Inter', weight: 400, file: 'inter-400.woff2' }],
  page: { format: 'A4', margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } },
});

// Monta uma origem de marca com logo própria e devolve os dois lados do round-trip.
function origemComLogo({ folha = 'tokens.css' } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prelo-rt-'));
  const origem = path.join(raiz, 'origem');
  fs.mkdirSync(path.join(origem, 'fonts'), { recursive: true });
  fs.mkdirSync(path.join(origem, 'images'), { recursive: true });
  fs.copyFileSync(FONTE, path.join(origem, 'fonts', 'inter-400.woff2'));
  fs.writeFileSync(path.join(origem, 'images', 'logo.png'), PNG_1X1);
  fs.writeFileSync(path.join(origem, 'config.json'), CONFIG);
  const regra = 'h1{background:url(images/logo.png) no-repeat;height:40px}';
  if (folha === 'tokens.css') {
    fs.writeFileSync(path.join(origem, 'tokens.css'), ':root{--cor-texto:#111}');
    fs.writeFileSync(path.join(origem, 'extra.css'), regra);
  } else {
    fs.writeFileSync(path.join(origem, 'style.css'), `body{color:#111}\n${regra}`);
  }
  return { raiz, origem, marcas: path.join(raiz, 'marcas') };
}

async function renderDoInstalado({ marcas }) {
  const anterior = process.env.PRELO_BRANDS_DIR;
  process.env.PRELO_BRANDS_DIR = marcas;
  try {
    return await mdToPdf({ markdown: '# Titulo\n\ntexto\n', brand: 'fx' });
  } finally {
    if (anterior === undefined) delete process.env.PRELO_BRANDS_DIR;
    else process.env.PRELO_BRANDS_DIR = anterior;
  }
}

test('marca com logo, depois de instalada, renderiza a logo', async () => {
  const c = origemComLogo();
  copiaPayloadMarca(c.origem, path.join(c.marcas, 'fx'));
  const larguras = largurasDeImagem(await renderDoInstalado(c));
  // A logo de fixture é 1x1. Contagem de objetos não serve: se a imagem não
  // chegou, o CSS de background simplesmente não carrega e não há objeto algum;
  // se chegasse quebrada, o ícone entraria com outra largura.
  assert.deepStrictEqual(larguras, [1], `larguras no PDF: ${larguras}`);
});

test('marca legada em style.css também leva e renderiza a logo', async () => {
  // A via legada tem seu url() resolvido igual — por isso a cópia de images/
  // é incondicional, ao contrário de extra.css.
  const c = origemComLogo({ folha: 'style.css' });
  copiaPayloadMarca(c.origem, path.join(c.marcas, 'fx'));
  const larguras = largurasDeImagem(await renderDoInstalado(c));
  assert.deepStrictEqual(larguras, [1], `larguras no PDF: ${larguras}`);
});

test('--base-url não interfere no url() da marca', async () => {
  // Propriedade verdadeira por construção (a reescrita do CSS da marca não
  // recebe baseUrl); o teste existe contra regressão futura, não contra
  // defeito presente — não há VERMELHO possível para ele nesta tarefa.
  const c = origemComLogo();
  copiaPayloadMarca(c.origem, path.join(c.marcas, 'fx'));
  const anterior = process.env.PRELO_BRANDS_DIR;
  process.env.PRELO_BRANDS_DIR = c.marcas;
  try {
    const pdf = await mdToPdf({
      markdown: '# Titulo\n\ntexto\n', brand: 'fx', baseUrl: 'https://site.com/docs/',
    });
    assert.deepStrictEqual(largurasDeImagem(pdf), [1]);
  } finally {
    if (anterior === undefined) delete process.env.PRELO_BRANDS_DIR;
    else process.env.PRELO_BRANDS_DIR = anterior;
  }
});
