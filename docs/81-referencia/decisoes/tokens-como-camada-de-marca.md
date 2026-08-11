---
descricao: "ADR — a estrutura CSS pertence à ferramenta (templates/base.css) e a marca é um bloco de tokens; resolução em três camadas com a via style.css preservada como compromisso permanente"
id: 202608091830
projeto: prelo
tipo: decisao
status: aprovado
data: 2026-08-09
escopo: repo:prelo
plataforma: "*"
dominios: [tecnologia]
tags: [adr, tokens, css, marca, brand, contrato-publico]
---

# ADR — tokens.css como camada de marca

## Status

Aprovado — 2026-08-09. Tarefa 411.

## Contexto

Uma marca do prelo era uma folha de estilo inteira: `prelo instalar` exigia `style.css` + `config.json`, e o render lia o `style.css` da marca instalada.

A estrutura visual — quais seletores existem, o comportamento da zebra da tabela, do blockquote e do `code`, as margens de página — ficava duplicada dentro de cada marca. Cada marca era um fork silencioso do CSS da ferramenta.

Medido nas seis marcas em uso em 2026-08-09: as seis eram **o mesmo esqueleto de 154 linhas** com o bloco `:root` trocado. Cinco delas divergiam entre si em exatamente duas linhas. Ou seja, ~148 linhas idênticas replicadas seis vezes, com ~25 linhas de conteúdo real por cópia. Melhoria de estrutura feita no repo não alcançava nenhuma marca instalada, e não havia como saber quais tinham divergido.

O custo dessa duplicação apareceu concretamente: um comentário CSS malformado no esqueleto (`headline-*/display`, que fecha o comentário cedo) fazia o parser descartar a declaração seguinte, `--fonte-mono`. As seis marcas herdaram o defeito e renderizaram `code`/`pre` na fonte do corpo por três semanas, sem que houvesse um lugar único para corrigir.

Efeito colateral sobre quem gera marca automaticamente: o gerador precisava emitir uma folha estruturalmente correta, não só os valores da marca — empurrando ~150 linhas de CSS estrutural para dentro do chamador.

## Decisão

1. **A estrutura pertence à ferramenta.** `templates/base.css` é versionado com o prelo e distribuído no upgrade. Nenhum valor de marca é cravado nele: cores, famílias e pesos consomem `var(--*)`, e o bloco `:root` do topo são os defaults.

2. **A marca é um bloco de tokens.** O payload passa a ser `tokens.css` + `config.json` + `fonts/`, com `extra.css` opcional para o seletor que só aquela marca tem, e `images/` opcional para imagem própria (logo, marca d'água).

   As subpastas são a **fronteira do payload**: o instalador leva o que está nelas e nada solto na raiz da marca, para que rascunho, README e metadado de sistema de arquivos não viajem junto. `images/` foi acrescentada em 2026-08-11.

   O nome em inglês é deliberado, não descuido: o layout do payload é lido por quem consome um repositório público, e `fonts/`, `tokens.css`, `config.json` e `extra.css` já seguem essa convenção. É a exceção de audiência prevista na ADR jedi-labs `20260808-naming-por-audiencia-do-artefato` à convenção PT-BR de nomes de pasta.

3. **Resolução em três camadas**, concatenadas nesta ordem: `base.css` → `tokens.css` → `extra.css`. Cada uma sobrescreve a anterior pela cascata nativa.

4. **Tokens vencem `style.css`** quando os dois existem no mesmo diretório de marca.

5. **A via `style.css` é compromisso permanente, não deprecação.** Marca que traz `style.css` é usada como está, sem `base.css`. É simultaneamente retrocompatibilidade e escape hatch para marca que precise de estrutura própria.

6. **O prelo é dono do vocabulário, não do mapeamento.** Quais tokens existem, o que cada um pinta e o default de ausência são do prelo (`docs/81-referencia/referencias/tokens.md`). O mapeamento de um sistema de design para esses tokens é de quem gera a marca — o prelo não conhece `DESIGN.md`.

7. **Ausência de token é degradação, não erro.** Todo token tem default. Cores de estado degradam para a cor de texto, em vez de um vermelho e um verde inventados: marca sem `error`/`success` renderiza `.alert`/`.ok` como texto normal.

## Consequências

### Positivas

- Melhoria de estrutura no repo alcança toda marca em tokens no próximo upgrade, sem reinstalar marca.
- Marca nova custa ~25 linhas em vez de ~150. Quem gera marca automaticamente não versiona CSS estrutural.
- Defeito estrutural tem um lugar único para ser corrigido — o `--fonte-mono` foi corrigido nas seis marcas por uma edição.
- Divergência entre marcas deixa de ser invisível: o que uma marca muda está no seu `tokens.css`, não espalhado em 150 linhas.

### Negativas

- **Marca perde a capacidade de remover seletor da estrutura.** Mitigado por `extra.css` (pode neutralizar regra) e pelo default neutro das cores de estado, que torna a remoção desnecessária no caso que a motivava.
- **Duas vias de resolução são duas superfícies a manter.** Aceito: o custo de manter a via legada é uma condicional no resolvedor, contra quebrar toda marca instalada.
- **A ferramenta passa a ter opinião sobre estrutura.** Marca que discorde precisa do escape hatch, o que é um degrau mais alto que editar o próprio CSS.

## Escopo

`repo:prelo`. Teste de escopo: apagar o repo revoga a decisão — é contrato da ferramenta, não do brain. A convenção de payload co-localizado e distribuição XDG permanece governada pela ADR jedi-labs `20260716-payload-de-marca-autocontido-para-impressao`, cujo item 2 foi emendado por esta decisão.

## Alternativas Consideradas

- **Manter a folha completa por marca** (status quo): rejeitado — é exatamente o problema.
- **Deprecar `style.css`**: rejeitado — quebraria as seis marcas instaladas e eliminaria o escape hatch para marca com necessidade estrutural própria.
- **Tokens em `config.json` em vez de CSS**: rejeitado — obrigaria o prelo a serializar CSS a partir de JSON, e abandonaria o padrão de indústria (custom properties como API de tematização) que Quarto, shadcn, Tailwind e o DTCG/W3C convergem.
- **Pré-processador (Sass/PostCSS)**: rejeitado — dependência nova para um problema que a cascata nativa resolve.
- **Camada de estrutura por marca, versionada mas copiada na instalação**: rejeitado — resolve a autoria mas não a distribuição; melhoria no repo continuaria sem alcançar marca instalada.

## Referências

- Vocabulário: `docs/81-referencia/referencias/tokens.md`
- Guia: `docs/81-referencia/guias/adicionar-brand.md`
- Spec e plano de execução: documentos internos do autor, fora deste repositório.
