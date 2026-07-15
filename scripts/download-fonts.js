#!/usr/bin/env node
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2' +
  '?family=Sanchez:wght@400' +
  '&family=Asap:wght@400;500;700' +
  '&family=Plus+Jakarta+Sans:wght@400;600;800' +
  '&display=swap';

// Chrome UA para receber woff2
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FONTS_DIR = path.resolve(__dirname, '..', 'fonts');

function fetchBuffer(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchBuffer(res.headers.location, headers));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

function parseFontFaces(css) {
  const faces = [];
  const re = /@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const block = m[1];
    const family = (block.match(/font-family:\s*['"]?([^'";]+)['"]?/) || [])[1]?.trim();
    const weight = (block.match(/font-weight:\s*(\d+)/)               || [])[1]?.trim();
    const url    = (block.match(/url\(([^)]+\.woff2)\)/)              || [])[1]?.trim();
    if (family && weight && url) faces.push({ family, weight, url });
  }
  return faces;
}

function toFilename(family, weight) {
  return `${family.toLowerCase().replace(/\s+/g, '-')}-${weight}.woff2`;
}

async function main() {
  fs.mkdirSync(FONTS_DIR, { recursive: true });

  process.stdout.write('Baixando CSS do Google Fonts...\n');
  const css = (await fetchBuffer(GOOGLE_FONTS_URL, { 'User-Agent': USER_AGENT })).toString('utf8');
  const faces = parseFontFaces(css);

  if (!faces.length) {
    process.stderr.write('Erro: nenhuma @font-face encontrada. Verifique a URL e o User-Agent.\n');
    process.exit(1);
  }

  const seen = new Set();
  for (const face of faces) {
    const filename = toFilename(face.family, face.weight);
    if (seen.has(filename)) continue; // múltiplos unicode-range para mesmo peso → um arquivo só
    seen.add(filename);

    const destPath = path.join(FONTS_DIR, filename);
    if (fs.existsSync(destPath)) {
      process.stdout.write(`  ✓ ${filename} (já existe)\n`);
      continue;
    }

    process.stdout.write(`  ↓ ${filename}...\n`);
    const data = await fetchBuffer(face.url);
    fs.writeFileSync(destPath, data);
    process.stdout.write(`  ✓ ${filename} (${Math.round(data.length / 1024)}KB)\n`);
  }

  process.stdout.write('Fontes prontas em fonts/\n');
}

main().catch(err => { process.stderr.write(`Erro: ${err.message}\n`); process.exit(1); });
