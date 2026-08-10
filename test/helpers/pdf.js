'use strict';
// Inspeciona um PDF gerado. As URIs e as anotações podem estar em texto plano
// ou dentro de streams comprimidos — varre os dois, senão a asserção vira vazia.
const zlib = require('zlib');

function* pedacos(buf) {
  const s = buf.toString('latin1');
  yield s;
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(s))) {
    const ini = m.index + m[0].length;
    const fim = s.indexOf('endstream', ini);
    if (fim < 0) continue;
    try {
      yield zlib.inflateSync(Buffer.from(s.slice(ini, fim), 'latin1')).toString('latin1');
    } catch (_) { /* stream não-deflate: ignora */ }
  }
}

function urisDoPdf(buf) {
  const uris = new Set();
  for (const p of pedacos(buf)) {
    for (const m of p.matchAll(/\/URI\s*\(([^)]*)\)/g)) uris.add(m[1]);
  }
  return [...uris];
}

function contaAnotacoesLink(buf) {
  let n = 0;
  for (const p of pedacos(buf)) n += (p.match(/\/Subtype\s*\/Link/g) || []).length;
  return n;
}

function contaObjetosImagem(buf) {
  let n = 0;
  for (const p of pedacos(buf)) n += (p.match(/\/Subtype\s*\/Image/g) || []).length;
  return n;
}

// Contar objetos de imagem NÃO distingue imagem resolvida de ícone de quebrado —
// o ícone também é um objeto de imagem embutido (medido: /Width 14 no Chromium).
// A largura é o que separa os dois: um PNG de fixture 1x1 sai com /Width 1.
function largurasDeImagem(buf) {
  const larguras = new Set();
  for (const p of pedacos(buf)) {
    for (const m of p.matchAll(/\/Subtype\s*\/Image[\s\S]{0,300}?\/Width\s+(\d+)/g)) larguras.add(Number(m[1]));
    for (const m of p.matchAll(/\/Width\s+(\d+)[\s\S]{0,300}?\/Subtype\s*\/Image/g)) larguras.add(Number(m[1]));
  }
  return [...larguras];
}

module.exports = { urisDoPdf, contaAnotacoesLink, contaObjetosImagem, largurasDeImagem };
