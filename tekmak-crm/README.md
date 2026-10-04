# TekMak CRM

CRM local para um atendente. Reúne conversas do WhatsApp conectado pelo Baileys e do Instagram profissional em uma caixa de entrada. A página principal da TekMak recebe formulários de interesse, que aparecem na aba **Leads**.

## Iniciar localmente

Requer Node.js 20 ou superior. O servidor do site já usa as dependências instaladas na raiz do projeto; o CRM não tem dependências npm próprias.

Em um terminal, na raiz do projeto:

```powershell
node serve.js
```

Em outro terminal:

```powershell
cd tekmak-crm
npm start
```

Abra o site em `http://127.0.0.1:3000` e o CRM em `http://127.0.0.1:3100`. **Os dois processos precisam estar ligados** para receber formulários e usar o WhatsApp no CRM. O CRM antigo em `http://127.0.0.1:3000/crm` não é a interface desta versão.

## WhatsApp

O servidor do site (porta 3000) é o único dono da sessão Baileys, guardada em `auth_baileys/`. No CRM, abra **Configurações > WhatsApp** para ver o estado da conexão e ler o QR Code. Uma sessão já vinculada pode se conectar sem novo QR. O atendente escreve e envia mensagens manualmente; nenhuma mensagem é disparada pelo envio do formulário.

O CRM recebe somente mensagens posteriores à conexão. A integração usa uma ponte local com o servidor na porta 3000 para consultar estado, receber mensagens e enviar texto, imagem e áudio. O Instagram continua separado e usa a API oficial.

## Formulários e leads

O formulário fica na seção Contato da página principal. Nome, WhatsApp, tarefa e faixa de investimento são obrigatórios; máquina de interesse é opcional. Após o envio, o site confirma o recebimento. Os dados ficam em `tekmak-crm/data/db.json` e aparecem em **Leads**, onde o atendente pode consultar, escrever uma mensagem livre manualmente ou abrir o discador com **Ligar**. O botão Ligar usa o aplicativo de telefone do dispositivo; chamadas não acontecem dentro da página.

## Instagram

Para receber mensagens do Instagram, configure uma conta profissional e um aplicativo Meta com Instagram Login. Encaminhe **somente a porta local 3101** por um túnel HTTPS público. Nas configurações do CRM, salve a URL pública, a versão da Graph API e os dados do Instagram. Configure o webhook `https://SUA-URL/webhooks/instagram` para os campos `messages` e `messaging_seen`. Cadastre `https://SUA-URL/oauth/instagram/callback` como URI de redirecionamento válida. O webhook POST exige `X-Hub-Signature-256` válido.

## Dados e verificação

A interface do CRM e o servidor do site escutam em `127.0.0.1` e não têm login. Proteja a conta do Windows e os arquivos locais. O CRM guarda seus dados em `tekmak-crm/data/`; o servidor Baileys guarda sessão e mensagens em `auth_baileys/` e `data_crm/`. Não exponha essas pastas nem as portas 3000 e 3100 à internet.

```powershell
cd tekmak-crm
npm test
```

Os testes usam uma ponte Baileys simulada e verificam formulário, envio manual, sincronização e Instagram. Pareamento e entrega por uma conta real dependem de um aparelho conectado.
