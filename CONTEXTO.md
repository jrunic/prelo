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

## Resolução de referência relativa

Cada referência relativa resolve contra **sua própria origem**:

| Referência | Resolve contra | Observação |
|---|---|---|
| `![](fotos/x.png)` no Markdown | pasta do arquivo de entrada (`baseDir`) | vira `file://` absoluto e é embutida no PDF |
| `url()` no CSS da marca | pasta da marca instalada | devolve a semântica de folha de estilo que o inline do CSS perde |
| `[x](anexo.pdf)` no Markdown | nada | sem `--base-url` perde o destino e vira texto |

`baseDir` vem do `path.dirname` do arquivo de entrada no CLI; na biblioteca é parâmetro, com `process.cwd()` de default, normalizado para absoluto na entrada.

**Link relativo não vira caminho local de propósito.** Link é gravado no PDF como URI e resolvido em tempo de clique, na máquina de quem lê — apontá-lo para o disco de quem gerou produz link morto e expõe a árvore daquele sistema de arquivos. Imagem é o oposto: resolvida em render e embutida, o caminho não sobrevive no arquivo final. Quem publica o `.md` num site declara `--base-url` e os links viram URLs públicas (resolução WHATWG padrão).

Preservados sem toque em qualquer caso: qualquer esquema (`http(s):`, `data:`, `file:`, `mailto:`, `tel:`), caminho absoluto, protocolo-relativo e fragmento.

**Imagem ausente em disco emite aviso no stderr e o código de saída continua 0.** A biblioteca não imprime — devolve o achado por `onAviso` e o chamador decide.

**Tamanho de PDF não denuncia imagem quebrada.** O ícone de quebrado é ele próprio um objeto de imagem embutido, às vezes maior que a foto real (medido: quebrado 23,4 KB vs correto 18,4 KB). O que distingue é a largura do objeto de imagem — ver `test/helpers/pdf.js`.

## Interface Node.js

```js
const { mdToPdf } = require('./index.js')
const pdf = await mdToPdf({
  markdown,
  brand: 'exemplo',
  outputPath: '/tmp/out.pdf',   // omitido → retorna Buffer
  baseDir: '/caminho/do/documento',        // default: process.cwd()
  baseUrl: 'https://site.com/docs/',       // opcional; só afeta links
  onAviso: ({ original, resolvido }) => {}, // imagem local ausente
})
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
│       ├── tokens.css             # a marca: só o bloco :root
│       ├── config.json
│       └── fonts/
└── templates/
    ├── base.html                  # template HTML com {{FONT_TAG}}, {{STYLE}}, {{CONTENT}}
    └── base.css                   # estrutura visual; consome var(--*), sem valor cravado
```

## Path de brands (XDG)

Ordem de busca:

1. `$PRELO_BRANDS_DIR/<brand>/` — override explícito (dev/CI)
2. `$XDG_DATA_HOME/prelo/brands/<brand>/` — instalação do usuário (`~/.local/share/prelo/brands/`)
3. `<repo>/brands/<brand>/` — fallback para brand de exemplo

## Camadas de CSS

A estrutura visual é da **ferramenta**, não da marca. `resolveBrandCss(brandDir)` (em `index.js`) resolve o CSS em duas vias:

**Via de tokens** (recomendada) — concatena, nesta ordem:

1. `templates/base.css` — estrutura; abre com um `:root` de defaults e consome `var(--*)` em todo o resto.
2. `<marca>/tokens.css` — a marca inteira, ~25 declarações. Sobrescreve os defaults.
3. `<marca>/extra.css` — opcional; o seletor que só aquela marca tem. Última palavra.

**Payload da marca:** folha (`tokens.css` ou `style.css`) + `config.json`, mais as subpastas opcionais `fonts/` e `images/`. As subpastas são a fronteira — nada solto na raiz é instalado. Nomes em inglês por coerência com o layout público do payload; ver a ADR local `tokens-como-camada-de-marca.md`.

**Via legada** — marca com `style.css` usa a folha inteira, sem `base.css`. Compromisso permanente: retrocompatibilidade e escape hatch para marca que precise de estrutura própria. Se a marca tem `tokens.css` e `style.css`, **tokens vence**.

Regras que o `test/base-css.test.js` enforça no `base.css`: todo `var(--*)` usado tem default no `:root`; nenhuma cor, família ou peso literal fora do `:root`; comentários balanceados.

Vocabulário dos tokens: `docs/81-referencia/referencias/tokens.md`. Raciocínio: `docs/81-referencia/decisoes/tokens-como-camada-de-marca.md`.

**Peso demandado ⊆ peso embarcado.** O peso fixado nos `--peso-*` tem de existir em `config.fonts`, senão o Chromium sintetiza a face. `test/cobertura-pesos.test.js` guarda isso usando o valor *efetivo* de cada token (o default do `base.css` é sombreado pelo `tokens.css` da marca).

## Testes

`npm test` roda `node --test --test-concurrency=1`. A serialização é **necessária, não preferência**: três arquivos de teste sobem Puppeteer, e em paralelo a contenção de recursos degrada renders de forma intermitente — PDFs truncados, objeto de imagem ausente. Observado antes da serialização; 6 execuções seguidas verdes depois. Custo: ~9s → ~16s.

Ao inspecionar PDF em teste, **contagem não é discriminador**: o ícone de imagem quebrada é ele próprio um objeto de imagem embutido, então "existe objeto de imagem" não prova que a foto resolveu. `test/helpers/pdf.js` expõe `largurasDeImagem` justamente para separar os dois (fixture 1x1 → `/Width 1`; ícone de quebrado → `/Width 14`).

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

Os `.woff2` vivem em `<marca>/fonts/`. No render, `buildLocalFontTag(brandDir, config)` monta `@font-face` a partir deles — degrada por face se um arquivo faltar; cai no CDN se nenhuma resolver. `prelo instalar` copia a subpasta `fonts/` junto com a folha (`tokens.css` ou `style.css`) e o `config.json`.

Gerar as fontes de uma marca (ferramenta geral):

```bash
node scripts/download-fonts.js --url "<googleFontsUrl>" --dest <marca>/fonts
```

`npm run fonts` roda essa ferramenta para a marca `exemplo`.

## Adicionar nova marca

Escrever `tokens.css` + `config.json` numa pasta qualquer e instalar:

```bash
prelo instalar --brand <nome-kebab> --origem <pasta>
```

`tokens.css`, `config.json`, `extra.css` e `fonts/` são copiados para o XDG. Passo a passo: `docs/81-referencia/guias/adicionar-brand.md`.
