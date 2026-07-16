#!/usr/bin/env node
'use strict';
// Baixa os .woff2 de uma googleFontsUrl para uma pasta e emite manifesto.json.
// Uso: node scripts/download-fonts.js --url "<googleFontsUrl>" --dest "<pasta/fonts>"
// Convenção de nome: <familia-kebab>-<peso>.woff2. Narrow-retry no 400 do Google.
const https = require('https');
const fs = require('fs');
const path = require('path');

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const arg = (flag) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : null; };

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetch(res.headers.location, headers));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks) }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseFontFaces(css) {
  const faces = [];
  const re = /@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const block = m[1];
    const family = (block.match(/font-family:\s*['"]?([^'";]+)['"]?/) || [])[1]?.trim();
    const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1]?.trim();
    const url    = (block.match(/url\(([^)]+\.woff2)\)/) || [])[1]?.trim();
    if (family && weight && url) faces.push({ family, weight, url });
  }
  return faces;
}

const toFilename = (family, weight) => `${family.toLowerCase().replace(/\s+/g, '-')}-${weight}.woff2`;

function familiesFromUrl(url) {
  return [...url.matchAll(/family=([^:&]+)(?::[^&]*)?/g)].map(m => decodeURIComponent(m[1].replace(/\+/g, ' ')));
}
const narrowUrl = (families) =>
  'https://fonts.googleapis.com/css2?' +
  families.map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400`).join('&') +
  '&display=swap';

async function fetchCss(url) {
  const r = await fetch(url, { 'User-Agent': USER_AGENT });
  return { status: r.status, css: r.buffer.toString('utf8') };
}

async function main() {
  const url = arg('--url');
  const dest = arg('--dest');
  if (!url || !dest) {
    process.stderr.write('Uso: node scripts/download-fonts.js --url "<googleFontsUrl>" --dest "<pasta>"\n');
    process.exit(2);
  }
  fs.mkdirSync(dest, { recursive: true });

  let { status, css } = await fetchCss(url);
  const perdas = [];
  if (status >= 400) {
    const fams = familiesFromUrl(url);
    process.stderr.write(`  ! Google retornou ${status}. Narrow para wght@400 de: ${fams.join(', ')}\n`);
    perdas.push(`pesos não-400 indisponíveis para: ${fams.join(', ')}`);
    ({ status, css } = await fetchCss(narrowUrl(fams)));
  }
  const faces = status < 400 ? parseFontFaces(css) : [];
  if (!faces.length) {
    process.stderr.write('Erro: nenhuma @font-face obtida (fonte proprietária? reportar lacuna).\n');
    process.exit(1);
  }

  const manifesto = [];
  const seen = new Set();
  for (const face of faces) {
    const file = toFilename(face.family, face.weight);
    if (seen.has(file)) continue;
    seen.add(file);
    const destPath = path.join(dest, file);
    if (!fs.existsSync(destPath)) {
      const { buffer } = await fetch(face.url);
      fs.writeFileSync(destPath, buffer);
      process.stdout.write(`  ✓ ${file} (${Math.round(buffer.length / 1024)}KB)\n`);
    } else {
      process.stdout.write(`  ✓ ${file} (já existe)\n`);
    }
    manifesto.push({ family: face.family, weight: Number(face.weight), file });
  }
  fs.writeFileSync(path.join(dest, 'manifesto.json'), JSON.stringify({ fonts: manifesto, perdas }, null, 2));
  process.stdout.write(`Fontes prontas em ${dest} — ${manifesto.length} arquivo(s)\n`);
}

if (require.main === module) {
  main().catch(err => { process.stderr.write(`Erro: ${err.message}\n`); process.exit(1); });
}

module.exports = { toFilename, parseFontFaces, familiesFromUrl, narrowUrl };
