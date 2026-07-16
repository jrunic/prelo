---
id: 202605071900
projeto: prelo
tipo: index
status: ativo
escopo: repo:prelo
plataforma: "*"
descricao: "Utilitário CLI que converte Markdown em PDF com identidade visual de marca via Puppeteer"
tags: [node, pdf, markdown, puppeteer, cli]
---

# CONTEXTO.md — prelo

## Propósito

Utilitário de linha de comando que converte Markdown em PDF com identidade visual de marca via Puppeteer (Chrome headless).

## Interface CLI

```bash
prelo --brand exemplo --input relatorio.md --output relatorio.pdf
prelo --brand exemplo --input relatorio.md > relatorio.pdf
```

## Imagens locais exigem caminho absoluto

O `index.js` escreve o HTML intermediário em `os.tmpdir()` e o Puppeteer carrega via `file://<tmpdir>/...`. Caminhos de imagem **relativos** (ex: `![](fotos/x.jpg)`) resolvem contra o tmpdir — onde a imagem não existe — e renderizam quebradas (PDF sai pequeno, só com placeholders).

- **Regra:** referenciar imagens locais por **caminho absoluto** no Markdown enviado ao `prelo`.
- **Padrão recomendado:** manter o `.md` canônico com paths relativos (portável) e gerar uma cópia de render com paths absolutos só para o PDF:
  ```bash
  sed "s#](fotos/#](${PWD}/fotos/#g" peca.md > /tmp/peca-render.md
  prelo --brand exemplo --input /tmp/peca-render.md --output peca.pdf --strip-frontmatter
  ```
- **Sintoma de path errado:** PDF de dezenas de KB (sem imagens) em vez de MBs.

## Interface Node.js

```js
const { mdToPdf } = require('./index.js')
const pdf = await mdToPdf({ markdown, brand: 'exemplo', outputPath: '/tmp/out.pdf' })
// outputPath omitido → retorna Buffer
```

## Estrutura

```
prelo/
├── index.js                       # função principal mdToPdf()
├── cli.js                         # wrapper CLI (shebang #!/usr/bin/env node)
├── package.json
├── scripts/
│   └── download-fonts.js          # baixa fontes locais de Google Fonts
├── fonts/                         # .woff2 locais (gerado por npm run fonts)
├── brands/
│   └── exemplo/                   # brand de demonstração
│       ├── style.css
│       └── config.json
└── templates/
    └── base.html                  # template HTML com {{FONT_TAG}}, {{STYLE}}, {{CONTENT}}
```

## Path de brands (XDG)

Ordem de busca:

1. `$PRELO_BRANDS_DIR/<brand>/` — override explícito (dev/CI)
2. `$XDG_DATA_HOME/prelo/brands/<brand>/` — instalação do usuário (`~/.local/share/prelo/brands/`)
3. `<repo>/brands/<brand>/` — fallback para brand de exemplo

## Stack

- **Runtime:** Node.js 22 LTS
- **Markdown → HTML:** `marked` v12 (GFM)
- **HTML → PDF:** `puppeteer` v22 (Chrome headless)
- **Fontes:** payload por-marca — cada marca declara `config.fonts` e traz seus `.woff2` em `<marca>/fonts/`; fallback automático para Google Fonts CDN (`googleFontsUrl`) quando ausentes

## Fontes por marca

Fonte é dado da marca, não do código. Cada marca declara suas fontes em `config.json`:

```json
"fonts": [ { "family": "Inter", "weight": 400, "file": "inter-400.woff2" } ]
```

Os `.woff2` vivem em `<marca>/fonts/`. No render, `buildLocalFontTag(brandDir, config)` monta `@font-face` a partir deles — degrada por face se um arquivo faltar; cai no CDN se nenhuma resolver. `prelo instalar` copia a subpasta `fonts/` junto com `style.css`+`config.json`.

Gerar as fontes de uma marca (ferramenta geral):

```bash
node scripts/download-fonts.js --url "<googleFontsUrl>" --dest <marca>/fonts
```

`npm run fonts` roda essa ferramenta para a marca `exemplo`.

## Adicionar nova marca

1. Criar `~/.local/share/prelo/brands/<nome-kebab>/style.css`
2. Criar `~/.local/share/prelo/brands/<nome-kebab>/config.json` (mesmo schema de `brands/exemplo/config.json`)
3. Invocar: `prelo --brand <nome-kebab> --input ...`
