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

module.exports = { urisDoPdf, contaAnotacoesLink, contaObjetosImagem };
