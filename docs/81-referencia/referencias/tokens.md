---
descricao: "Vocabulário de tokens CSS do prelo — cada var(--*), o que pinta e o default quando a marca não declara"
id: 202608091800
projeto: prelo
tipo: referencia
status: ativo
escopo: repo:prelo
plataforma: "*"
dominios: [tecnologia]
tags: [referencia, tokens, css, marca, brand]
---

# Vocabulário de tokens

Uma marca do prelo é um bloco `:root` com estes tokens. A estrutura visual — quais seletores existem, como a tabela zebra, como o blockquote se comporta — pertence à ferramenta e não entra na marca.

## As três camadas

O CSS aplicado a um documento é a concatenação, nesta ordem:

| Camada | Arquivo | Dono | Obrigatória |
|---|---|---|---|
| Estrutura | `templates/base.css` | ferramenta | sim, sempre |
| Tokens | `<marca>/tokens.css` | marca | sim |
| Extras | `<marca>/extra.css` | marca | não |

Cada camada sobrescreve a anterior. Uma marca que traz `style.css` em vez de `tokens.css` segue o caminho legado: a folha é usada inteira e as três camadas não se aplicam. Ver [adicionar-brand](../guias/adicionar-brand.md).

## Ausência é degradação, não erro

Nenhum token é obrigatório. Token omitido cai no default do `base.css`. Uma marca mínima que só troque famílias e cor primária é válida e renderiza.

## Tipografia — famílias

| Token | O que pinta | Default |
|---|---|---|
| `--fonte-corpo` | `body`, `p`, `td`, `th` | `'Inter', sans-serif` |
| `--fonte-titulo` | `h1`–`h4` | `'Inter', sans-serif` |
| `--fonte-mono` | `code`, `pre` | `'Courier New', Courier, monospace` |

## Tipografia — tamanhos

Tamanhos são de **impressão**. A escala de um design de tela não se copia direto: o que é confortável num monitor fica grande demais em A4.

| Token | O que pinta | Default |
|---|---|---|
| `--tam-corpo` | `body` | `14px` |
| `--tam-h1` | `h1` | `24px` |
| `--tam-h2` | `h2` | `18px` |
| `--tam-h3` | `h3` | `15px` |
| `--tam-h4` | `h4` | `13px` |
| `--tam-mono` | `code`, `pre` | `12px` |

## Tipografia — pesos

| Token | O que pinta | Default |
|---|---|---|
| `--peso-corpo` | `body`, `p`, `td` | `400` |
| `--peso-titulo` | `h2`, `h3`, `h4` | `600` |
| `--peso-titulo-forte` | `h1`, `strong` | `700` |
| `--peso-label` | `th`, `.alert`, `.ok` | `500` |

**Peso e fonte andam juntos.** O peso fixado aqui tem de existir em `config.fonts`, senão o Chromium sintetiza a face — o texto sai com um negrito falso, visivelmente pior que a face real. Ao declarar `--peso-titulo: 800`, garanta que a marca embarca o peso 800 daquela família.

Peso carrega identidade: uma marca editorial ultraleve (Inter 200/300) deve sobrescrever os defaults, não se ajustar a eles.

## Cores — texto

| Token | O que pinta | Default |
|---|---|---|
| `--cor-texto` | `body`, `p`, `td`, `th` | `#1a1a1a` |
| `--cor-texto-suave` | `h4`, `blockquote` | `#555555` |
| `--cor-muted` | `.muted` | `#777777` |

## Cores — títulos e âncoras

| Token | O que pinta | Default |
|---|---|---|
| `--cor-titulo-forte` | `h1`, `h2`, borda inferior do `h1`, barra do `blockquote` | `#111111` |
| `--cor-titulo-medio` | `h3` | `#333333` |
| `--cor-link` | `a` | `#0066cc` |

## Cores — superfícies e bordas

| Token | O que pinta | Default |
|---|---|---|
| `--cor-borda` | bordas de `table`, `hr` | `#dddddd` |
| `--cor-fundo-suave` | `th`, `code`, `pre`, `blockquote` | `#f5f5f5` |
| `--cor-fundo-zebra` | linhas pares da tabela | `#fafafa` |

## Cores — estado

| Token | O que pinta | Default |
|---|---|---|
| `--cor-alerta` | `.alert` | `var(--cor-texto)` |
| `--cor-ok` | `.ok` | `var(--cor-texto)` |

Os defaults apontam para a cor de texto, não para um vermelho e um verde inventados. Marca que não declara cor de estado renderiza `.alert` e `.ok` como texto normal — mesmo efeito de a regra não existir, sem que a ferramenta invente uma cor que não é da marca.

Para suprimir as regras por completo, usar `extra.css`:

```css
.alert, .ok { color: inherit; font-weight: inherit; }
```

## O que não é token

Fora do vocabulário CSS, definido em `config.json`:

- **Margem de página, formato e orientação** — `page.format` e `page.margin`. É o Puppeteer que aplica; a regra `@page` do CSS é inerte no modo de render atual. Não existe token de margem.
- **Rodapé e cabeçalho** — `footer.template` e `header.template`, HTML inline com estilo próprio. Não herdam os tokens: cor e fonte vão escritas no template.
- **Fontes** — `config.fonts` e os `.woff2` em `<marca>/fonts/`.

## Marca mínima

```css
:root {
  --fonte-corpo: 'Lora', serif;
  --fonte-titulo: 'Lora', serif;
  --cor-titulo-forte: #2d4a3e;
  --cor-link: #2d4a3e;
}
```

Quatro linhas. Todo o resto herda o default.
