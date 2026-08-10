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

function resolveBrandCss(brandDir) {
  const tokensFile = path.join(brandDir, 'tokens.css');
  const styleFile  = path.join(brandDir, 'style.css');

  if (fs.existsSync(tokensFile)) {
    const camadas = [
      fs.readFileSync(path.resolve(__dirname, 'templates', 'base.css'), 'utf8'),
      fs.readFileSync(tokensFile, 'utf8'),
    ];
    const extraFile = path.join(brandDir, 'extra.css');
    if (fs.existsSync(extraFile)) camadas.push(fs.readFileSync(extraFile, 'utf8'));
    return camadas.map((c) => c.trimEnd()).join('\n');
  }

  if (fs.existsSync(styleFile)) return fs.readFileSync(styleFile, 'utf8');

  throw new Error(
    `Marca sem folha de estilo em ${brandDir}: esperado tokens.css (recomendado) ou style.css (legado)`
  );
}

// Qualquer coisa com esquema (http:, data:, mailto:, file:...), caminho absoluto,
// protocolo-relativo (//cdn/...) ou fragmento é responsabilidade de quem escreveu.
// Só o resto resolve contra uma base.
const TEM_ESQUEMA = /^[a-z][a-z0-9+.\-]*:/i;

function ehReferenciaRelativa(ref) {
  if (!ref) return false;
  if (TEM_ESQUEMA.test(ref)) return false;
  if (ref.startsWith('/')) return false;   // cobre absoluto e protocolo-relativo
  if (ref.startsWith('#')) return false;
  return true;
}

// new URL faz a codificação percentual (espaço → %20) que 'file://' + caminho não faz.
function paraFileUrl(baseDir, ref) {
  return new URL(path.resolve(baseDir, ref), 'file://').href;
}

// Opera sobre a saída do marked, ANTES da injeção no template — assim o <link>
// de fontes do cabeçalho não entra no alcance.
// Reescrita textual é segura porque o marked escapa as aspas de atributo dentro
// de <code>/<pre>, então exemplo de código não casa.
function reescreveReferenciasDoDocumento(html, baseDir, { baseUrl } = {}) {
  const imagensAusentes = [];

  let saida = html.replace(/(<img\b[^>]*?\bsrc=")([^"]*)(")/gi, (m, pre, ref, pos) => {
    if (!ehReferenciaRelativa(ref)) return m;
    const absoluto = path.resolve(baseDir, ref);
    if (!fs.existsSync(absoluto)) imagensAusentes.push({ original: ref, resolvido: absoluto });
    return pre + paraFileUrl(baseDir, ref) + pos;
  });

  // Casa a tag inteira e mexe SÓ no atributo href. Reconstruir a tag a partir
  // das partes ao redor do href deixa espaço duplo quando há outro atributo, e
  // normalizar espaços corromperia valores.
  saida = saida.replace(/<a\b[^>]*>/gi, (tag) => {
    const m = tag.match(/\bhref="([^"]*)"/i);
    if (!m || !ehReferenciaRelativa(m[1])) return tag;
    if (baseUrl) {
      return tag.replace(/\bhref="[^"]*"/i, `href="${new URL(m[1], baseUrl).href}"`);
    }
    // Sem base pública, o destino só funcionaria na máquina de quem gerou —
    // e ainda exporia o caminho dela no PDF. Some o href, fica o texto.
    return tag.replace(/\s*\bhref="[^"]*"/i, '');
  });

  return { html: saida, imagensAusentes };
}

// url() do CSS pertence à MARCA, não ao documento: numa folha de estilo real
// resolveria contra a própria folha. O prelo perde isso ao inlinar o CSS, então
// devolve a semântica absolutizando contra o diretório da marca.
// As três formas de aspas do CSS entram: url(x), url('x'), url("x").
function reescreveUrlsDoCss(css, brandDir) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, _aspas, ref) => {
    const alvo = ref.trim();
    if (!ehReferenciaRelativa(alvo)) return m;
    return `url("${paraFileUrl(brandDir, alvo)}")`;
  });
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith('---')) return markdown;
  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return markdown;
  return markdown.slice(end + 4).replace(/^\n/, '');
}

async function mdToPdf({
  markdown, brand, outputPath,
  stripFrontmatter: doStrip = false,
  baseDir = process.cwd(),
  baseUrl,
  onAviso,
}) {
  baseDir = path.resolve(baseDir);   // paraFileUrl exige base absoluta
  if (doStrip) markdown = stripFrontmatter(markdown);
  const brandDir = resolveBrandDir(brand);

  const config = JSON.parse(fs.readFileSync(path.join(brandDir, 'config.json'), 'utf8'));
  const css    = reescreveUrlsDoCss(resolveBrandCss(brandDir), brandDir);
  const template = fs.readFileSync(path.resolve(__dirname, 'templates', 'base.html'), 'utf8');

  const { html: conteudoResolvido, imagensAusentes } =
    reescreveReferenciasDoDocumento(marked.parse(markdown), baseDir, { baseUrl });
  if (onAviso) for (const a of imagensAusentes) onAviso(a);
  const content  = `<div class="content">${conteudoResolvido}</div>`;
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

module.exports = {
  mdToPdf, buildLocalFontTag, resolveBrandCss,
  ehReferenciaRelativa, paraFileUrl, reescreveReferenciasDoDocumento, reescreveUrlsDoCss,
};
