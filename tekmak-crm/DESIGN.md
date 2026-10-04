---
name: TekMak CRM
description: Sistema visual da central local de conversas
colors:
  background: "#10151b"
  panel: "#171e26"
  surface: "#1d2630"
  surface-raised: "#222e3a"
  border: "#2c3946"
  text: "#f5f3ef"
  muted: "#a0adba"
  gold: "#f5b93f"
  green: "#55c598"
  blue: "#7baded"
typography:
  display:
    fontFamily: "Tekmak, Arial Narrow, sans-serif"
    fontWeight: 800
    lineHeight: 0.95
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
rounded:
  control: "8px"
  surface: "13px"
spacing:
  tight: "8px"
  regular: "16px"
  roomy: "24px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 11px"
---

# Design System: TekMak CRM

## Overview

Ferramenta de operação da TekMak: a interface é densa o suficiente para acompanhar conversas, mas deixa o chat como área principal. A marca aparece no display itálico, no monograma e em poucos acentos dourados. O trabalho do atendente deve ser lido rapidamente.

## Colors

O fundo carvão (`background`) separa visualmente o chat dos painéis (`panel`). `surface` e `surface-raised` sustentam controles e seleção. `gold` marca ações e foco; `green` identifica o WhatsApp, e a variação rosa do Instagram está definida diretamente na folha de estilos. Texto primário e secundário seguem `text` e `muted`.

## Typography

O display usa a fonte local RBNo3.1 UltraItalic sob o nome `Tekmak`. Texto operacional usa Segoe UI com Arial como fallback. Labels têm 11 px e peso 700; nomes de contato e mensagens seguem o corpo de 14 px.

## Layout

Em desktop, a grade contém rail de 72 px, lista de 354 px, chat flexível e painel de contato opcional de 300 px. Abaixo de 1250 px, a lista encolhe; abaixo de 1060 px, o contato vira painel sobreposto. Abaixo de 700 px, o usuário alterna entre lista e chat; o status ganha uma barra própria no chat móvel.

## Elevation & Depth

A separação entre áreas usa sobretudo cores de superfície e bordas de 1 px. Sombras aparecem apenas em elementos sobrepostos e no estado vazio. Não usar halos decorativos.

## Shapes

Campos e botões usam raio de cerca de 8 px. Avatares e blocos principais usam cantos entre 12 e 18 px. Bolhas de mensagem têm um canto mais reto para indicar direção.

## Components

- **Rail:** navegação compacta para conversas e configurações.
- **Lista:** busca, filtros, prévia, canal, horário e status; a linha selecionada muda de superfície.
- **Chat:** cabeçalho com contato/canal/status, histórico cronológico e compositor fixo na base.
- **Contato:** nome, etiquetas e notas salvos explicitamente.
- **Configurações:** painel lateral com servidor local e conexões separadas por canal.

## Do's and Don'ts

- Preserve a indicação do canal em listas e no cabeçalho do chat.
- Mantenha estados de erro e conexão perto da ação correspondente.
- No celular, mantenha o status acessível sem depender do painel de contato.
- Evite métricas e cartões decorativos na área de operação.
