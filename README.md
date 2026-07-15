# prelo

Converte Markdown em PDF com a identidade visual de uma marca.

O conteúdo entra como Markdown puro; a marca — cores, tipografia, margens, cabeçalho e rodapé — vive separada, em arquivos de configuração. O prelo junta os dois e devolve um PDF pronto. O nome vem de _prelo_, a prensa tipográfica.

## Instalação

```bash
git clone https://github.com/jrunic/prelo
cd prelo
npm install       # inclui o Chrome do Puppeteer — leva alguns minutos
npm run fonts     # baixa as fontes locais (fallback: CDN em tempo de render)
ln -s "$PWD/cli.js" ~/.local/bin/prelo   # disponibiliza o comando no PATH
```

Requer Node.js 22+.

## Uso

```bash
# gera PDF com a marca de exemplo
prelo --brand exemplo --input relatorio.md --output relatorio.pdf

# sem --output, o PDF vai para o stdout
prelo --brand exemplo --input relatorio.md > relatorio.pdf

# remove o front-matter YAML antes de converter
prelo --brand exemplo --input relatorio.md --output relatorio.pdf --strip-frontmatter
```

## Marcas

Uma marca é um par de arquivos — `style.css` (aparência) e `config.json` (página, fontes, rodapé). O repositório inclui `brands/exemplo/` como demonstração.

Para usar a sua própria marca, instale-a no diretório do usuário:

```bash
prelo instalar --brand acme --origem ~/minhas-marcas/acme
```

Isso copia os arquivos para `~/.local/share/prelo/brands/acme/`. Depois, `prelo --brand acme ...`.

O prelo procura a marca nesta ordem, parando na primeira que existir:

1. `$PRELO_BRANDS_DIR/<marca>/` — override explícito (dev/CI)
2. `$XDG_DATA_HOME/prelo/brands/<marca>/` — instalação do usuário (`~/.local/share/prelo/brands/`)
3. `<repo>/brands/<marca>/` — fallback para a marca de exemplo

## Documentação

- [Visão geral](docs/81-referencia/explicacoes/visao-geral.md) — o quê, para quem, por que Node + Puppeteer
- [Como instalar](docs/81-referencia/guias/instalar.md)
- [Como adicionar uma marca](docs/81-referencia/guias/adicionar-brand.md)
- [Referência da CLI](docs/81-referencia/referencias/cli.md)

## Imagens locais

Referencie imagens locais por caminho absoluto no Markdown. Caminhos relativos não resolvem, porque o HTML intermediário é renderizado a partir de um diretório temporário.

## Licença

MIT.
