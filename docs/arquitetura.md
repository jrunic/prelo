---
descricao: "Mapa de navegação da documentação do prelo — aponta para os quadrantes Diátaxis e os módulos do código"
id: 202607151246
projeto: prelo
tipo: referencia
status: ativo
escopo: repo:prelo
plataforma: "*"
dominios: [tecnologia]
tags: [arquitetura, navegacao, mapa]
---

# Arquitetura da documentação

Mapa de navegação. Aponta para onde cada coisa vive; o conteúdo está nos destinos.

## Documentação (Diátaxis)

- **Explicações** — `explicacoes/`
  - [visao-geral.md](explicacoes/visao-geral.md) — o quê, para quem, por que Node + Puppeteer.
- **Guias** — `guias/`
  - [instalar.md](guias/instalar.md) — instalação, fontes, comando no PATH.
  - [adicionar-brand.md](guias/adicionar-brand.md) — criar e instalar uma marca.
- **Referências** — `referencias/`
  - [cli.md](referencias/cli.md) — comandos, flags, resolução de marca, códigos de saída.
  - [tokens.md](referencias/tokens.md) — vocabulário de tokens da marca, o que cada um pinta, defaults.
- **Decisões** — `decisoes/`
  - [tokens-como-camada-de-marca.md](decisoes/tokens-como-camada-de-marca.md) — estrutura pertence à ferramenta; marca é bloco de tokens.

## Código

- `index.js` — função `mdToPdf()`: Markdown → HTML → PDF.
- `cli.js` — wrapper de linha de comando; comandos `conversão` e `instalar`.
- `scripts/download-fonts.js` — baixa as fontes locais.
- `templates/base.html` — template HTML com slots de fonte, estilo e conteúdo.
- `templates/base.css` — estrutura visual da ferramenta; consome `var(--*)`, sem valor de marca cravado.
- `brands/exemplo/` — marca de demonstração (`tokens.css` + `config.json` + `fonts/`).
