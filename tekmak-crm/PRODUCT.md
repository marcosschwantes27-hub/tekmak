# TekMak CRM

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Node.js e HTML, CSS e JavaScript nativos. Interface local na porta 3100; servidor do site e conexão Baileys na porta 3000.

## Users

Um atendente da TekMak responde clientes em WhatsApp e Instagram e acompanha interessados que preencheram o formulário do site.

## Product Purpose

Reunir conversas dos dois canais em uma caixa de entrada e registrar os formulários de interesse como leads. Cada conversa permanece separada por canal e a resposta segue pelo canal de origem.

## Operating Context

Uma empresa, um número de WhatsApp vinculado ao Baileys e uma conta profissional de Instagram. A interface roda localmente. A porta 3101 pode receber somente webhooks e OAuth do Instagram por túnel HTTPS.

## Capabilities and Constraints

- Receber mensagens apenas após a conexão; sem importar histórico anterior.
- Enviar, receber e exibir texto, imagens e áudio.
- Contatos separados por canal, com etiquetas e notas.
- Conversas com status pendente, em atendimento e encerrada; nova mensagem reabre a conversa.
- Leads do formulário com nome, WhatsApp, tarefa, faixa de investimento e máquina de interesse opcional.
- Mensagem de primeiro contato escrita e enviada manualmente pelo atendente; ligação abre o discador do dispositivo.
- Sem Kanban de leads nesta versão.
- O WhatsApp usa a sessão Baileys existente no servidor local. O Instagram usa uma conta profissional e API oficial.
- Projeto novo, sem migração dos dados do CRM anterior.

## Brand Commitments

Produto interno TekMak. Reutilizar a identidade existente da marca quando fizer sentido para uma ferramenta de operação.

## Product Principles

- Mostrar claramente o canal de cada conversa e resposta.
- Manter estados de conexão e falhas visíveis.
- Proteger credenciais e dados locais; expor publicamente apenas os endpoints necessários do Instagram.
