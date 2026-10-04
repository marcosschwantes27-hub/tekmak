const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');

const testData = fs.mkdtempSync(path.join(os.tmpdir(), 'tekmak-crm-test-'));
process.env.CRM_DATA_DIR = testData;

function listen(handler) {
  const server = http.createServer(handler);
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}
function close(server) { return new Promise(resolve => server.close(resolve)); }
async function request(base, route, method = 'GET', data, headers = {}) {
  const response = await fetch(base + route, {
    method, headers: { ...headers, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  const raw = await response.text();
  return { status: response.status, data: raw ? JSON.parse(raw) : null };
}

test('formulário cria lead; envio manual usa Baileys; sincroniza resposta sem duplicar e preserva Instagram', async () => {
  const sent = [];
  let feed = [];
  const bridgeServer = await listen(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    let result;
    if (url.pathname === '/api/status') result = { status: 'connected', qr: null, user: { phone: '5598999990000', name: 'TekMak' } };
    else if (url.pathname === '/api/crm-feed') result = { messages: feed };
    else if (url.pathname === '/api/new-chat') result = { chat: { id: body.phone + '@s.whatsapp.net' } };
    else if (url.pathname === '/api/send') {
      sent.push(body);
      result = { success: true, message: { id: 'baileys-out-1' } };
    } else if (url.pathname === '/api/send-media') {
      sent.push(body);
      result = { success: true, message: { id: 'baileys-media-' + sent.length } };
    } else if (url.pathname === '/api/refresh-qr' || url.pathname === '/api/disconnect') result = { success: true };
    else { res.writeHead(404); return res.end('{}'); }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  });
  process.env.BAILEYS_BRIDGE_URL = 'http://127.0.0.1:' + bridgeServer.address().port;
  const { app, webhook, pollWhatsApp } = require('../server');
  const appServer = await listen(app);
  const hookServer = await listen(webhook);
  const appBase = 'http://127.0.0.1:' + appServer.address().port;
  const hookBase = 'http://127.0.0.1:' + hookServer.address().port;
  try {
    const bad = await request(appBase, '/api/leads', 'POST', { name: 'A', whatsapp: '123', task: '', investmentBand: '' });
    assert.equal(bad.status, 400);
    const created = await request(appBase, '/api/leads', 'POST', {
      name: 'Ana Silva', whatsapp: '(98) 99999-1234', task: 'Produzir camisetas',
      investmentBand: 'R$ 10 mil a R$ 25 mil', machineInterest: 'Prensa térmica'
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.whatsapp, '5598999991234');
    let state = (await request(appBase, '/api/state')).data;
    assert.equal(state.leads.length, 1);
    assert.equal(state.conversations.length, 0);

    const waStatus = await request(appBase, '/api/whatsapp/status');
    assert.equal(waStatus.data.status, 'connected');
    const send = await request(appBase, '/api/leads/' + created.data.id + '/send', 'POST', { text: 'Oi Ana, qual volume você pretende produzir?' });
    assert.equal(send.status, 200);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].text, 'Oi Ana, qual volume você pretende produzir?');
    assert.equal(sent[0].jid, '5598999991234@s.whatsapp.net');
    state = (await request(appBase, '/api/state')).data;
    assert.equal(state.leads[0].conversationId, 'whatsapp:5598999991234');
    assert.equal(state.messages[state.leads[0].conversationId].length, 1);

    feed = [
      { phone: '5598999991234', name: 'Ana Silva', externalId: 'baileys-out-1', timestamp: Date.now(), direction: 'out', type: 'text', text: sent[0].text },
      { phone: '5598999991234', name: 'Ana Silva', externalId: 'baileys-in-1', timestamp: Date.now() + 1000, direction: 'in', type: 'text', text: 'Quinhentas peças por mês' }
    ];
    await pollWhatsApp();
    await pollWhatsApp();
    state = (await request(appBase, '/api/state')).data;
    assert.equal(state.messages['whatsapp:5598999991234'].length, 2);

    const image = await request(appBase, '/api/send', 'POST', {
      conversationId: 'whatsapp:5598999991234', type: 'image', text: 'Exemplo',
      mimeType: 'image/png', fileName: 'exemplo.png', data: Buffer.from('imagem de teste').toString('base64')
    });
    assert.equal(image.status, 200);
    assert.equal(image.data.type, 'image');
    assert.equal(sent.at(-1).type, 'image');

    const audio = await request(appBase, '/api/send', 'POST', {
      conversationId: 'whatsapp:5598999991234', type: 'audio', text: '',
      mimeType: 'audio/ogg', fileName: 'exemplo.ogg', data: Buffer.from('audio de teste').toString('base64')
    });
    assert.equal(audio.status, 200);
    assert.equal(audio.data.type, 'audio');
    assert.equal(sent.at(-1).type, 'audio');

    const inboundLead = await request(appBase, '/api/leads', 'POST', {
      name: 'Bruno', whatsapp: '(98) 99999-4321', task: 'Montar uniformes',
      investmentBand: 'ainda não defini'
    });
    assert.equal(inboundLead.status, 201);
    feed = [{ phone: inboundLead.data.whatsapp, name: 'Bruno', externalId: 'baileys-in-2',
      timestamp: Date.now() + 2000, direction: 'in', type: 'text', text: 'Olá TekMak' }];
    await pollWhatsApp();
    state = (await request(appBase, '/api/state')).data;
    assert.equal(state.leads.find(item => item.id === inboundLead.data.id).conversationId, 'whatsapp:5598999994321');

    const configured = await request(appBase, '/api/settings', 'PUT', { instagram: {
      accessToken: 'token-ig', userId: 'empresa', appSecret: 'segredo-ig', verifyToken: 'verifique-ig'
    } });
    assert.equal(configured.status, 200);
    const payload = JSON.stringify({ object: 'instagram', entry: [{ messaging: [{
      sender: { id: 'cliente-ig' }, message: { mid: 'ig.1', text: 'Olá' }, timestamp: Date.now() + 1000
    }] }] });
    const signature = 'sha256=' + crypto.createHmac('sha256', 'segredo-ig').update(payload).digest('hex');
    const response = await fetch(hookBase + '/webhooks/instagram', {
      method: 'POST', headers: { 'X-Hub-Signature-256': signature }, body: payload
    });
    assert.equal(response.status, 200);
    await new Promise(resolve => setTimeout(resolve, 30));
    state = (await request(appBase, '/api/state')).data;
    assert.equal(state.conversations.some(item => item.channel === 'instagram'), true);
    assert.equal((await request(hookBase, '/webhooks/whatsapp')).status, 404);
  } finally {
    await Promise.all([close(appServer), close(hookServer), close(bridgeServer)]);
    if (path.dirname(testData) === os.tmpdir() && path.basename(testData).startsWith('tekmak-crm-test-')) {
      fs.rmSync(testData, { recursive: true, force: true });
    }
  }
});
