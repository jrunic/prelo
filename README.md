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

Uma marca é um `tokens.css` — um bloco de ~25 valores: cores, famílias, pesos — mais um `config.json` (página, fontes, rodapé). A estrutura visual pertence ao prelo (`templates/base.css`) e chega às marcas pelo upgrade da ferramenta. O repositório inclui `brands/exemplo/` como demonstração.

Marca no formato antigo (`style.css` com a folha inteira) continua funcionando — ver [o guia](docs/guias/adicionar-brand.md).

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

- [Visão geral](docs/explicacoes/visao-geral.md) — o quê, para quem, por que Node + Puppeteer
- [Como instalar](docs/guias/instalar.md)
- [Como adicionar uma marca](docs/guias/adicionar-brand.md)
- [Vocabulário de tokens](docs/referencias/tokens.md)
- [Referência da CLI](docs/referencias/cli.md)

## Referências relativas

`![](fotos/x.png)` resolve contra a pasta do arquivo passado em `--input` — o `.md` continua portável entre máquinas. `url()` no CSS de uma marca resolve contra a pasta da marca.

Link relativo (`[x](anexo.pdf)`) é o caso diferente: um link é resolvido quando alguém clica, na máquina de quem lê o PDF, então apontá-lo para o disco de quem gerou produziria um link morto e exporia a árvore daquele sistema de arquivos. Sem `--base-url`, o destino é removido e fica o texto; com ela, vira URL pública.

Imagem local que não existe em disco gera aviso no stderr, e o código de saída continua 0.

## Licença

MIT.
