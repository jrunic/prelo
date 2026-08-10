---
descricao: "Referência completa da CLI do prelo — comandos, flags, resolução de marca, códigos de saída e comportamento de saída"
id: 202607151243
projeto: prelo
tipo: referencia
status: ativo
escopo: repo:prelo
plataforma: "*"
dominios: [tecnologia]
tags: [referencia, cli, flags]
---

# Referência da CLI

## Comandos

| Comando | Efeito |
|---|---|
| `prelo --brand <marca> --input <arquivo.md> [--output <arquivo.pdf>]` | Converte Markdown em PDF sob a marca indicada. |
| `prelo instalar --brand <marca> --origem <pasta>` | Copia `style.css` e `config.json` de `<pasta>` para o diretório de marcas do usuário. |
| `prelo --help` / `prelo -h` | Exibe a ajuda. |

## Flags de conversão

| Flag | Obrigatória | Valor | Comportamento |
|---|---|---|---|
| `--brand` | sim | identificador da marca | Nome do diretório da marca a aplicar (ex: `exemplo`). |
| `--input` | sim | caminho | Arquivo Markdown de entrada. Resolvido contra o diretório atual. |
| `--output` | não | caminho | Arquivo PDF de saída. Se omitido, o PDF é escrito no stdout. |
| `--base-url` | não | — | URL pública de base para links relativos (ex: `https://site.com/docs/`). Sem ela, link relativo perde o destino e vira texto. Não afeta imagens. |
| `--strip-frontmatter` | não | — | Remove o bloco YAML front-matter do início do Markdown antes de converter. |
| `--help`, `-h` | não | — | Exibe a ajuda e encerra. |

## Flags de instalação

| Flag | Obrigatória | Valor | Comportamento |
|---|---|---|---|
| `--brand` | sim | identificador da marca | Nome de destino da marca no diretório do usuário. |
| `--origem` | sim | caminho de pasta | Pasta de origem contendo `style.css` e `config.json`. |

## Resolução de marca

O prelo procura o diretório da marca `<marca>` nesta ordem, parando no primeiro que existir:

1. `$PRELO_BRANDS_DIR/<marca>/` — override explícito, útil em desenvolvimento e CI.
2. `$XDG_DATA_HOME/prelo/brands/<marca>/` — instalação do usuário; quando `XDG_DATA_HOME` não está definido, usa `~/.local/share/prelo/brands/<marca>/`.
3. `<repo>/brands/<marca>/` — fallback para a marca de exemplo incluída no repositório.

Cada diretório de marca deve conter `style.css` e `config.json`.

## Fontes por marca

Cada marca pode declarar suas fontes em `config.json`:

```json
"fonts": [
  { "family": "Inter", "weight": 400, "file": "inter-400.woff2" }
]
```

Os arquivos `.woff2` correspondentes vivem em `<marca>/fonts/`. No render, o prelo monta `@font-face` a partir deles. Se um arquivo declarado faltar, aquela face é omitida; se nenhuma resolver (ou `fonts` ausente), usa o `googleFontsUrl` (CDN).

`prelo instalar` copia a subpasta `fonts/` da origem junto com `style.css` e `config.json`.

## Saída

- Com `--output`: o PDF é gravado no caminho indicado; uma linha de confirmação é escrita no stderr.
- Sem `--output`: o PDF é escrito no stdout como binário. Redirecione para um arquivo (`> saida.pdf`) ou para outro processo.

## Códigos de saída

| Código | Condição |
|---|---|
| `0` | Conversão ou instalação concluída; ou `--help`. |
| `1` | Argumentos obrigatórios ausentes; arquivo de entrada inexistente; pasta de origem inválida; marca não encontrada; erro de renderização. |

## Formatos suportados

- **Entrada:** Markdown com GitHub Flavored Markdown (GFM) — tabelas, listas de tarefas, blocos de código. Front-matter YAML opcional, removível com `--strip-frontmatter`.
- **Saída:** PDF.

## Referências relativas

Cada referência relativa resolve contra sua própria origem.

| Referência | Resolve contra |
|---|---|
| `![](fotos/x.png)` | pasta do arquivo passado em `--input` |
| `url()` no CSS da marca | pasta da marca instalada |
| `[x](anexo.pdf)` | com `--base-url`, a URL declarada; sem ela, o destino é removido e fica o texto |

Ficam intocados: qualquer esquema (`http(s):`, `data:`, `file:`, `mailto:`, `tel:`), caminho absoluto, protocolo-relativo (`//cdn/...`) e fragmento (`#secao`).

Link relativo não vira caminho local porque um link é resolvido em tempo de clique, na máquina de quem lê o PDF: apontá-lo para o disco de quem gerou produz link morto e expõe a árvore daquele sistema de arquivos. Imagem é o oposto — resolvida durante o render e embutida no PDF, o caminho não sobrevive no arquivo final.

Com `--base-url`, a resolução segue a regra padrão de URL do navegador: base terminada em `/` trata o último segmento como diretório; sem a barra, o substitui.

## Imagem local ausente

Imagem cujo arquivo não existe em disco gera uma linha no stderr:

```
Aviso: imagem não encontrada: fotos/x.png (resolvido para /caminho/completo/fotos/x.png)
```

O código de saída continua `0` — um PDF com uma foto faltando ainda serve. O aviso existe porque a falha é invisível de outra forma: o ícone de imagem quebrada é ele próprio um objeto de imagem embutido, então o **tamanho do PDF não denuncia** e pode até ser maior que o do PDF correto.
