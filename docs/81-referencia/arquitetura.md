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
- **Decisões** — `decisoes/` — ADRs locais do produto (quando houver).

## Código

- `index.js` — função `mdToPdf()`: Markdown → HTML → PDF.
- `cli.js` — wrapper de linha de comando; comandos `conversão` e `instalar`.
- `scripts/download-fonts.js` — baixa as fontes locais.
- `templates/base.html` — template HTML com slots de fonte, estilo e conteúdo.
- `brands/exemplo/` — marca de demonstração.
