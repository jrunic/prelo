---
descricao: "Como criar uma marca nova para o prelo e instalá-la no diretório de marcas do usuário"
id: 202607151245
projeto: prelo
tipo: guia
status: ativo
escopo: repo:prelo
plataforma: "*"
dominios: [tecnologia]
tags: [guia, marca, brand, xdg]
---

# Como adicionar uma marca

Uma marca é um par de arquivos: `style.css` (a aparência) e `config.json` (página, fontes, cabeçalho e rodapé). Este guia cria uma marca e a instala no diretório de marcas do usuário.

## Pré-requisitos

- prelo instalado (ver [Como instalar o prelo](instalar.md)).
- A marca de exemplo em `brands/exemplo/` como ponto de partida.

## Passos

1. Crie uma pasta para sua marca em qualquer lugar e copie os arquivos de exemplo como base:

   ```bash
   mkdir -p ~/minhas-marcas/acme
   cp brands/exemplo/style.css brands/exemplo/config.json ~/minhas-marcas/acme/
   ```

2. Edite `~/minhas-marcas/acme/style.css` com as cores, a tipografia e o espaçamento da marca. É CSS comum, aplicado ao HTML gerado a partir do Markdown.

3. Edite `~/minhas-marcas/acme/config.json`:

   ```json
   {
     "name": "Acme",
     "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
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

   O campo `name` substitui `{{TITLE}}` no template de rodapé. `googleFontsUrl` é o fallback de fontes quando não há fontes locais.

4. (Opcional) Para fontes locais, gere-as na pasta da marca e declare-as em `config.json`:

   ```bash
   node scripts/download-fonts.js --url "<googleFontsUrl da marca>" --dest ~/minhas-marcas/acme/fonts
   ```

   Adicione o array `fonts` ao `config.json` com uma entrada `{family, weight, file}` por peso. Sem isso, a marca renderiza via CDN (`googleFontsUrl`).

5. Instale a marca no diretório do usuário:

   ```bash
   prelo instalar --brand acme --origem ~/minhas-marcas/acme
   ```

   Os arquivos — incluindo a subpasta `fonts/`, se presente — são copiados para `~/.local/share/prelo/brands/acme/`.

## Verificação

```bash
echo "# Documento Acme" > /tmp/teste.md
prelo --brand acme --input /tmp/teste.md --output /tmp/teste.pdf
```

O PDF deve sair com o estilo definido no seu `style.css`.

## Referência

Para o schema completo de `config.json` e a resolução de diretório de marca, veja a [Referência da CLI](../referencias/cli.md).
