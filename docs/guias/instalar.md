---
descricao: "Como instalar o prelo, baixar as fontes locais e disponibilizar o comando no PATH"
id: 202607151244
projeto: prelo
tipo: guia
status: ativo
escopo: repo:prelo
plataforma: "*"
dominios: [tecnologia]
tags: [guia, instalacao, setup]
---

# Como instalar o prelo

## Pré-requisitos

- Node.js 22 ou superior.
- Git.

## Passos

1. Clone o repositório e entre nele:

   ```bash
   git clone https://github.com/jrunic/prelo
   cd prelo
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

   Isso baixa o Puppeteer, que inclui uma cópia do Chrome — a primeira instalação leva alguns minutos.

3. Baixe as fontes locais:

   ```bash
   npm run fonts
   ```

   As fontes ficam em `fonts/`. Sem elas, o prelo cai no CDN de fontes em tempo de renderização.

4. Disponibilize o comando `prelo` no PATH. Via link simbólico:

   ```bash
   ln -s "$PWD/cli.js" ~/.local/bin/prelo
   ```

   Garanta que `~/.local/bin` está no seu `PATH`.

## Verificação

Gere um PDF com a marca de exemplo incluída no repositório:

```bash
echo "# Teste" > /tmp/teste.md
prelo --brand exemplo --input /tmp/teste.md --output /tmp/teste.pdf
```

O arquivo `/tmp/teste.pdf` deve existir e abrir em qualquer leitor de PDF. Se o PDF sai com poucos KB e sem estilo, verifique se `npm run fonts` foi executado.

## Próximo passo

Para gerar PDFs com sua própria identidade visual, veja [Como adicionar uma marca](adicionar-brand.md).
