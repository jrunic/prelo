'use strict';
const puppeteer = require('puppeteer');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');
const os = require('os');

marked.use({ gfm: true, breaks: false });

function buildLocalFontTag() {
  const fontsDir = path.resolve(__dirname, 'fonts');
  if (!fs.existsSync(fontsDir)) return null;

  const slots = [
    { family: 'Sanchez',           weight: 400, file: 'sanchez-400.woff2'           },
    { family: 'Asap',              weight: 400, file: 'asap-400.woff2'              },
    { family: 'Asap',              weight: 500, file: 'asap-500.woff2'              },
    { family: 'Asap',              weight: 700, file: 'asap-700.woff2'              },
    { family: 'Plus Jakarta Sans', weight: 400, file: 'plus-jakarta-sans-400.woff2' },
    { family: 'Plus Jakarta Sans', weight: 600, file: 'plus-jakarta-sans-600.woff2' },
    { family: 'Plus Jakarta Sans', weight: 800, file: 'plus-jakarta-sans-800.woff2' },
  ];

  const faces = [];
  for (const s of slots) {
    const filePath = path.join(fontsDir, s.file);
    if (!fs.existsSync(filePath)) return null; // missing font → CDN fallback
    faces.push(
      `@font-face{font-family:'${s.family}';font-weight:${s.weight};font-style:normal;` +
      `src:url('file://${filePath}')format('woff2');}`
    );
  }

  return `<style>${faces.join('')}</style>`;
}

function brandSearchPaths(brand) {
  const paths = [];
  if (process.env.PRELO_BRANDS_DIR) {
    paths.push(path.join(process.env.PRELO_BRANDS_DIR, brand));
  }
  const xdgBase = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  paths.push(path.join(xdgBase, 'prelo', 'brands', brand));
  paths.push(path.resolve(__dirname, 'brands', brand));
  return paths;
}

function resolveBrandDir(brand) {
  const candidates = brandSearchPaths(brand);
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error(
    `Marca não encontrada: ${brand}. Procurado em:\n  ${candidates.join('\n  ')}`
  );
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith('---')) return markdown;
  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return markdown;
  return markdown.slice(end + 4).replace(/^\n/, '');
}

async function mdToPdf({ markdown, brand, outputPath, stripFrontmatter: doStrip = false }) {
  if (doStrip) markdown = stripFrontmatter(markdown);
  const brandDir = resolveBrandDir(brand);

  const config = JSON.parse(fs.readFileSync(path.join(brandDir, 'config.json'), 'utf8'));
  const css    = fs.readFileSync(path.join(brandDir, 'style.css'), 'utf8');
  const template = fs.readFileSync(path.resolve(__dirname, 'templates', 'base.html'), 'utf8');

  const content  = `<div class="content">${marked.parse(markdown)}</div>`;
  const localFontTag = buildLocalFontTag();
  const fontTag = localFontTag
    ? localFontTag
    : `<link rel="preconnect" href="https://fonts.googleapis.com">` +
      `<link href="${config.googleFontsUrl}" rel="stylesheet">`;

  const html = template
    .replace('{{FONT_TAG}}', fontTag)
    .replace('{{STYLE}}', css)
    .replace('{{CONTENT}}', content);

  // Arquivo temporário com base file:// para que fontes locais resolvam
  const tmpFile = path.join(os.tmpdir(), `prelo-${Date.now()}.html`);
  fs.writeFileSync(tmpFile, html, 'utf8');

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${tmpFile}`, { waitUntil: 'networkidle0' });

    const footerTemplate = (config.footer?.template || '').replace('{{TITLE}}', config.name);

    const pdf = await page.pdf({
      format: config.page.format,
      margin: config.page.margin,
      printBackground: true,
      displayHeaderFooter: !!(config.header || config.footer),
      headerTemplate: config.header?.template || '<span></span>',
      footerTemplate: footerTemplate || '<span></span>',
    });

    if (outputPath) {
      fs.writeFileSync(outputPath, pdf);
      return outputPath;
    }
    return pdf;
  } finally {
    await browser.close();
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

module.exports = { mdToPdf };
