#!/usr/bin/env node
'use strict';
const { mdToPdf } = require('./index.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

function xdgBrandsDir() {
  const base = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  return path.join(base, 'prelo', 'brands');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if      (argv[i] === '--brand')   args.brand   = argv[++i];
    else if (argv[i] === '--input')   args.input   = argv[++i];
    else if (argv[i] === '--output')  args.output  = argv[++i];
    else if (argv[i] === '--origem')  args.origem  = argv[++i];
    else if (argv[i] === '--strip-frontmatter') args.stripFrontmatter = true;
    else if (argv[i] === '--help' || argv[i] === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  process.stdout.write(`
prelo — Converte Markdown em PDF com identidade visual de marca

Comandos:
  prelo --brand <marca> --input <arquivo.md> [--output <arquivo.pdf>]
  prelo instalar --brand <marca> --origem <pasta>

Flags (conversão):
  --brand              Identificador da marca (ex: exemplo)
  --input              Caminho para o arquivo Markdown de entrada
  --output             Caminho para o PDF de saída (omitir → stdout)
  --strip-frontmatter  Remove o bloco YAML front-matter antes de converter
  --help               Exibe esta ajuda

Flags (instalar):
  --brand              Identificador da marca a instalar
  --origem             Pasta contendo style.css e config.json da marca

Exemplos:
  prelo --brand exemplo --input relatorio.md --output relatorio.pdf
  prelo --brand exemplo --input relatorio.md > relatorio.pdf
  prelo instalar --brand acme --origem ~/minhas-marcas/acme
`.trimStart());
}

function copiaPayloadMarca(origem, destino) {
  const styleFile  = path.join(origem, 'style.css');
  const configFile = path.join(origem, 'config.json');
  if (!fs.existsSync(styleFile) || !fs.existsSync(configFile)) {
    throw new Error('pasta de origem deve conter style.css e config.json');
  }
  fs.mkdirSync(destino, { recursive: true });
  fs.copyFileSync(styleFile,  path.join(destino, 'style.css'));
  fs.copyFileSync(configFile, path.join(destino, 'config.json'));
  const copiados = ['style.css', 'config.json'];

  const fontsOrigem = path.join(origem, 'fonts');
  if (fs.existsSync(fontsOrigem) && fs.statSync(fontsOrigem).isDirectory()) {
    fs.cpSync(fontsOrigem, path.join(destino, 'fonts'), { recursive: true });
    for (const f of fs.readdirSync(fontsOrigem)) copiados.push(path.join('fonts', f));
  }
  return copiados;
}

function instalarBrand(args) {
  if (!args.brand || !args.origem) {
    process.stderr.write('Uso: prelo instalar --brand <nome> --origem <pasta>\n');
    process.exit(1);
  }

  const origem = path.resolve(args.origem);
  if (!fs.existsSync(origem)) {
    process.stderr.write(`Erro: pasta de origem não encontrada: ${origem}\n`);
    process.exit(1);
  }

  const destino = path.join(xdgBrandsDir(), args.brand);
  try {
    copiaPayloadMarca(origem, destino);
  } catch (err) {
    process.stderr.write(`Erro: ${err.message}\n`);
    process.exit(1);
  }

  process.stderr.write(`Brand '${args.brand}' instalada em ${destino}\n`);
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv[0] === 'instalar') {
    const args = parseArgs(argv.slice(1));
    instalarBrand(args);
    return;
  }

  const args = parseArgs(argv);

  if (args.help) { printHelp(); process.exit(0); }
  if (!args.brand || !args.input) { printHelp(); process.exit(1); }

  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    process.stderr.write(`Erro: arquivo não encontrado: ${inputPath}\n`);
    process.exit(1);
  }

  const markdown   = fs.readFileSync(inputPath, 'utf8');
  const outputPath = args.output ? path.resolve(args.output) : null;

  try {
    const result = await mdToPdf({ markdown, brand: args.brand, outputPath, stripFrontmatter: !!args.stripFrontmatter });
    if (outputPath) {
      process.stderr.write(`PDF gerado: ${result}\n`);
    } else {
      process.stdout.write(result);
    }
  } catch (err) {
    process.stderr.write(`Erro: ${err.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { copiaPayloadMarca };
