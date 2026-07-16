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

## Imagens locais

Imagens referenciadas por caminho relativo não resolvem, porque o HTML intermediário é renderizado a partir de um diretório temporário. Referencie imagens locais por caminho absoluto no Markdown enviado ao prelo.
