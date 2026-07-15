---
descricao: "O que é o prelo, para quem serve e por que usa Node + Puppeteer para gerar PDF a partir de Markdown"
id: 202607151242
projeto: prelo
tipo: explicacao
status: ativo
escopo: repo:prelo
plataforma: "*"
dominios: [tecnologia]
tags: [explicacao, visao-geral, pdf, markdown, puppeteer]
---

# Visão geral

## O que é

`prelo` converte um arquivo Markdown em um PDF que carrega a identidade visual de uma marca. O nome vem de _prelo_, a prensa tipográfica — a máquina que transformava texto em página impressa.

O conteúdo entra como Markdown puro, portável, sem estilo. A marca — cores, tipografia, margens, cabeçalho e rodapé — vive separada, em arquivos de configuração. O prelo junta os dois no momento da geração e devolve um PDF pronto para entrega.

## Para quem

Para quem produz documentos repetidamente a partir de texto estruturado e precisa que saiam sempre com a mesma aparência: relatórios, propostas, peças de comunicação. O autor escreve em Markdown e não se preocupa com formatação; o design fica encapsulado numa marca reutilizável.

Uma mesma instalação atende várias marcas. Adicionar uma marca nova é criar dois arquivos — não tocar no código.

## Por que separar conteúdo de marca

Markdown descreve estrutura (títulos, listas, tabelas), não aparência. Essa separação é a premissa do prelo: o mesmo texto pode ser impresso sob marcas diferentes, e a mesma marca pode imprimir textos diferentes, sem duplicação. O autor do conteúdo e o dono do design trabalham em camadas independentes.

## Por que Node e Puppeteer

A conversão tem duas etapas: Markdown para HTML, e HTML para PDF.

A primeira é resolvida por bibliotecas maduras de Markdown em JavaScript, sem dependência externa de sistema — nada de instalar um binário de conversão à parte.

A segunda é onde Puppeteer entra. Puppeteer controla um Chrome headless: o mesmo motor de renderização de um navegador real. Isso significa que qualquer coisa que o Chrome sabe desenhar — CSS moderno, fontes web, tabelas complexas, quebras de página controladas, cabeçalho e rodapé por página — está disponível de graça. Alternativas que reimplementam um subconjunto de CSS num motor próprio esbarram em limitações de layout; usar o navegador de verdade elimina essa classe de problema.

O custo é o peso: Puppeteer baixa uma cópia do Chrome. É a troca deliberada — fidelidade de renderização acima de footprint mínimo.

## Fontes locais versus CDN

Marcas costumam depender de fontes específicas. O prelo prefere fontes baixadas localmente (`.woff2`) e embutidas na renderização, com fallback automático para o CDN de fontes quando os arquivos locais estão ausentes.

A razão é reprodutibilidade: um PDF gerado offline, ou num host sem acesso à rede, sai idêntico ao gerado com internet. Depender do CDN em tempo de renderização torna o resultado sensível à disponibilidade externa — indesejável para um artefato que precisa ser sempre o mesmo.
