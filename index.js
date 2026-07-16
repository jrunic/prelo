'use strict';
const puppeteer = require('puppeteer');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');
const os = require('os');

marked.use({ gfm: true, breaks: false });

function buildLocalFontTag(brandDir, config) {
  const fonts = config && config.fonts;
  if (!Array.isArray(fonts) || fonts.length === 0) return null;

  const fontsDir = path.join(brandDir, 'fonts');
  const faces = [];
  for (const f of fonts) {
    const filePath = path.resolve(fontsDir, f.file); // absoluto p/ file:// válido mesmo com brandDir relativo
    if (!fs.existsSync(filePath)) continue; // degrada só esta face
    faces.push(
      `@font-face{font-family:'${f.family}';font-weight:${f.weight};font-style:normal;` +
      `src:url('file://${filePath}')format('woff2');}`
    );
  }
  if (faces.length === 0) return null; // nada resolveu → CDN
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
  const localFontTag = buildLocalFontTag(brandDir, config);
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

module.exports = { mdToPdf, buildLocalFontTag };
