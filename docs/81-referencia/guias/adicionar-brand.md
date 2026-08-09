---
descricao: "Como criar uma marca nova para o prelo e instalá-la no diretório de marcas do usuário"
id: 202607151245
projeto: prelo
tipo: guia
status: ativo
escopo: repo:prelo
plataforma: "*"
dominios: [tecnologia]
tags: [guia, marca, brand, xdg, tokens]
---

# Como adicionar uma marca

Uma marca é um `tokens.css` — um bloco de valores — mais um `config.json` com página, fontes e rodapé. A estrutura visual (quais seletores existem, como a tabela zebra, como o `code` se comporta) pertence ao prelo e você não precisa escrevê-la.

## Pré-requisitos

- prelo instalado (ver [Como instalar o prelo](instalar.md)).
- A marca de exemplo em `brands/exemplo/` como ponto de partida.
- O [vocabulário de tokens](../referencias/tokens.md) aberto ao lado.

## Passos

1. Crie a pasta da marca:

   ```bash
   mkdir -p ~/minhas-marcas/acme
   ```

2. Escreva `~/minhas-marcas/acme/tokens.css`. Comece pelo mínimo — quatro valores já dão identidade:

   ```css
   :root {
     --fonte-corpo: 'Lora', serif;
     --fonte-titulo: 'Lora', serif;
     --cor-titulo-forte: #2d4a3e;
     --cor-link: #2d4a3e;
   }
   ```

   Todo token omitido herda o default do prelo. Acrescente só o que a marca de fato muda; a [referência de tokens](../referencias/tokens.md) lista os 24 disponíveis, o que cada um pinta e seu default. `brands/exemplo/tokens.css` é um exemplo completo.

3. Escreva `~/minhas-marcas/acme/config.json`:

   ```json
   {
     "name": "Acme",
     "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap",
     "page": {
       "format": "A4",
       "margin": { "top": "20mm", "right": "18mm", "bottom": "24mm", "left": "18mm" }
     },
     "footer": {
       "template": "<div style='font-size:10px;width:100%;text-align:center'>{{TITLE}} — página <span class=\"pageNumber\"></span></div>",
       "height": "12mm"
     }
   }
   ```

   O campo `name` substitui `{{TITLE}}` no rodapé. A margem e o rodapé vivem aqui, não nos tokens.

4. (Opcional) Fontes locais, para render offline e reprodutível:

   ```bash
   node scripts/download-fonts.js --url "<googleFontsUrl da marca>" --dest ~/minhas-marcas/acme/fonts
   ```

   Declare em `config.json` o array `fonts`, com uma entrada `{family, weight, file}` por peso baixado. Sem isso, a marca renderiza via CDN.

   **Cubra todos os pesos que os tokens pedem.** Se `--peso-titulo` é `800` e a marca não embarca o 800, o Chromium sintetiza um negrito falso.

5. (Opcional) `~/minhas-marcas/acme/extra.css` para a regra que só essa marca tem — um seletor próprio, uma quebra de página específica. Aplicado depois dos tokens, tem a última palavra.

6. Instale:

   ```bash
   prelo instalar --brand acme --origem ~/minhas-marcas/acme
   ```

   `tokens.css`, `config.json`, `extra.css` e a subpasta `fonts/` são copiados para `~/.local/share/prelo/brands/acme/`.

## Verificação

```bash
printf '# Documento Acme\n\nParágrafo com `código` e **negrito**.\n' > /tmp/teste.md
prelo --brand acme --input /tmp/teste.md --output /tmp/teste.pdf
```

O PDF deve sair com as fontes e cores da marca, e o `código` numa fonte monoespaçada.

## Compatibilidade: marca em `style.css`

Marca que traz `style.css` em vez de `tokens.css` continua funcionando: a folha é usada inteira, sem a estrutura do prelo. É o formato anterior a 2026-08-09 e permanece suportado indefinidamente — não há plano de deprecá-lo.

Escolha esse caminho só quando a marca precisar de uma estrutura genuinamente diferente. Para uma regra a mais ou a menos, `extra.css` resolve com muito menos código para manter. Se uma marca tem os dois arquivos, `tokens.css` vence.

Ver a [ADR](../decisoes/tokens-como-camada-de-marca.md) para o raciocínio.

## Referência

Schema completo de `config.json` e resolução de diretório de marca: [Referência da CLI](../referencias/cli.md). Vocabulário completo: [Tokens](../referencias/tokens.md).
