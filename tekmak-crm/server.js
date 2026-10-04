const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const store = require('./store');
const channels = require('./channels');

const APP_PORT = Number(process.env.PORT || 3100);
const WEBHOOK_PORT = Number(process.env.WEBHOOK_PORT || 3101);
const publicFiles = path.join(__dirname, 'public');
const pendingMedia = new Map();
const oauthStates = new Map();
let whatsappSnapshot = { status: 'offline', qr: null, user: null };
let whatsappPolling = false;
const instagramProfileSync = new Set();

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(value));
}
function fail(res, error, status = 400) { json(res, status, { error: error.message || String(error) }); }
async function body(req, limit = 23 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('Requisição grande demais');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function parseJson(raw) {
  try { return JSON.parse(raw.toString('utf8') || '{}'); }
  catch { throw new Error('JSON inválido'); }
}
function safeCompare(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function verifySignature(raw, signature, secret) {
  if (!secret || !signature?.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
  return safeCompare(signature, expected);
}
function publicSettings() {
  const { instagram, publicUrl, graphVersion } = store.secrets;
  return {
    publicUrl: publicUrl || '', graphVersion: graphVersion || 'v23.0',
    whatsapp: {
      status: whatsappSnapshot.status, connectedAt: store.secrets.whatsapp.connectedAt || null,
      label: whatsappSnapshot.user?.name || whatsappSnapshot.user?.phone || ''
    },
    instagram: { userId: instagram.userId || '', appId: instagram.appId || '',
      hasToken: !!instagram.accessToken, hasAppSecret: !!instagram.appSecret,
      verifyToken: instagram.verifyToken || '', connectedAt: instagram.connectedAt || null,
      label: instagram.label || '' }
  };
}
function state() {
  return {
    revision: store.revision, settings: publicSettings(),
    contacts: Object.values(store.db.contacts).map(contact => contact.avatarUrl || contact.channel !== 'whatsapp' ? contact : { ...contact, avatarUrl: channels.whatsappAvatarUrl(contact.remoteId) }),
    leads: Object.values(store.db.leads).map(lead => ({ ...lead, avatarUrl: channels.whatsappAvatarUrl(lead.whatsapp) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    conversations: Object.values(store.db.conversations).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    messages: store.db.messages
  };
}
function updateSettings(input) {
  if (typeof input.publicUrl === 'string') {
    const url = input.publicUrl.trim().replace(/\/$/, '');
    if (url && !/^https:\/\/[^/]+$/i.test(url)) throw new Error('Use uma URL pública HTTPS sem caminho');
    store.secrets.publicUrl = url;
  }
  if (typeof input.graphVersion === 'string' && /^v\d+\.\d+$/.test(input.graphVersion)) store.secrets.graphVersion = input.graphVersion;
  for (const channel of ['instagram']) {
    if (!input[channel]) continue;
    const target = store.secrets[channel];
    const allowed = ['accessToken', 'userId', 'appId', 'appSecret', 'verifyToken'];
    for (const field of allowed) {
      if (typeof input[channel][field] === 'string' && input[channel][field].trim()) target[field] = input[channel][field].trim();
    }
    if (target.accessToken && target.userId && !target.connectedAt) target.connectedAt = new Date().toISOString();
  }
  store.saveSecrets();
}
function validateMessage(data) {
  if (!['text', 'image', 'audio'].includes(data.type)) throw new Error('Tipo de mensagem inválido');
  if (data.type === 'text' && (!data.text || !String(data.text).trim())) throw new Error('Escreva uma mensagem');
  if (data.type !== 'text') {
    if (typeof data.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(data.data)) throw new Error('Arquivo inválido');
    if (Buffer.byteLength(data.data, 'base64') > 16 * 1024 * 1024) throw new Error('Arquivo excede 16 MB');
    if (!String(data.mimeType || '').startsWith(`${data.type}/`)) throw new Error('Formato de arquivo inválido');
  }
}
async function send(data) {
  validateMessage(data);
  const conversation = store.db.conversations[data.conversationId];
  if (!conversation) throw new Error('Conversa não encontrada');
  const contact = store.db.contacts[conversation.contactId];
  let mediaId = null;
  let publicMediaUrl = null;
  if (data.type !== 'text') {
    mediaId = store.saveMedia(Buffer.from(data.data, 'base64'), data.mimeType);
    if (conversation.channel === 'instagram') {
      if (!store.secrets.publicUrl) throw new Error('Configure a URL pública HTTPS para enviar mídia pelo Instagram');
      const ticket = crypto.randomBytes(24).toString('hex');
      pendingMedia.set(ticket, { mediaId, mimeType: data.mimeType, expiresAt: Date.now() + 10 * 60 * 1000 });
      publicMediaUrl = `${store.secrets.publicUrl}/outgoing/${ticket}`;
    }
  }
  const externalId = conversation.channel === 'whatsapp'
    ? await channels.sendWhatsApp(contact, data)
    : await channels.sendInstagram(contact, data, publicMediaUrl);
  return store.addOutgoing({ conversationId: conversation.id, externalId, type: data.type, text: data.text, mediaId, mimeType: data.mimeType });
}
const investmentBands = new Set([
  'até R$ 10 mil', 'R$ 10 mil a R$ 25 mil', 'R$ 25 mil a R$ 50 mil',
  'acima de R$ 50 mil', 'ainda não defini'
]);
function validateLead(data) {
  const name = String(data.name || '').trim().replace(/\s+/g, ' ').slice(0, 100);
  const task = String(data.task || '').trim().slice(0, 1500);
  const investmentBand = String(data.investmentBand || '').trim();
  const machineInterest = String(data.machineInterest || '').trim().slice(0, 200);
  let whatsapp = String(data.whatsapp || '').replace(/\D/g, '');
  if (whatsapp.length === 10 || whatsapp.length === 11) whatsapp = '55' + whatsapp;
  if (name.length < 2) throw new Error('Informe seu nome');
  if (!/^55[1-9]\d{9,10}$/.test(whatsapp)) throw new Error('Informe um WhatsApp com DDD válido');
  if (task.length < 3) throw new Error('Descreva a tarefa para a máquina');
  if (!investmentBands.has(investmentBand)) throw new Error('Escolha uma faixa de investimento');
  return { name, whatsapp, task, investmentBand, machineInterest };
}

async function whatsappStatus() {
  try {
    whatsappSnapshot = await channels.whatsappStatus();
    if (whatsappSnapshot.status === 'connected' &&
        (store.secrets.whatsapp.provider !== 'baileys' || !store.secrets.whatsapp.connectedAt)) {
      store.secrets.whatsapp = { provider: 'baileys', connectedAt: new Date().toISOString() };
      store.saveSecrets();
    }
  } catch {
    whatsappSnapshot = { status: 'offline', qr: null, user: null };
  }
  return whatsappSnapshot;
}

async function pollWhatsApp() {
  if (whatsappPolling) return;
  whatsappPolling = true;
  try {
    const status = await whatsappStatus();
    if (status.status !== 'connected') return;
    const since = Date.parse(store.secrets.whatsapp.connectedAt || new Date().toISOString());
    const feed = await channels.whatsappFeed(since);
    for (const message of feed.messages || []) {
      if (store.db.seen['whatsapp:' + message.externalId]) {
        if (message.direction === 'out' && message.state) store.updateMessageState('whatsapp', message.externalId, message.state);
        continue;
      }
      let mediaId = null;
      if (message.mediaId) {
        try { mediaId = await channels.downloadWhatsAppMedia(message.mediaId, message.mimeType); }
        catch (error) { console.error('[WhatsApp] mídia:', error.message); }
      }
      store.upsertBridgeMessage({
        phone: message.phone, name: message.name, avatarUrl: message.avatarUrl, externalId: message.externalId,
        timestamp: new Date(message.timestamp).toISOString(), direction: message.direction,
        type: message.type, text: message.text, mediaId, mimeType: message.mimeType
      });
    }
  } catch (error) { console.error('[WhatsApp] sincronização:', error.message); }
  finally { whatsappPolling = false; }
}

async function sendLead(id, data) {
  const lead = store.db.leads[id];
  if (!lead) throw new Error('Lead não encontrado');
  const text = String(data.text || '').trim();
  if (!text || text.length > 4000) throw new Error('Escreva uma mensagem de até 4.000 caracteres');
  const externalId = await channels.sendWhatsApp({ remoteId: lead.whatsapp, name: lead.name }, { type: 'text', text });
  const conversation = store.ensureWhatsAppConversation(lead.whatsapp, lead.name);
  lead.conversationId = conversation.id;
  store.addOutgoing({ conversationId: conversation.id, externalId, type: 'text', text });
  return { id: lead.id, conversationId: conversation.id, externalId };
}

async function app(req, res) {
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host || '')) {
    return json(res, 403, { error: 'Acesso local inválido' });
  }
  const url = new URL(req.url, `http://127.0.0.1:${APP_PORT}`);
  const route = url.pathname;
  try {
    if (route === '/api/state' && req.method === 'GET') return json(res, 200, state());
    if (route === '/api/leads' && req.method === 'POST') {
      const lead = store.addLead(validateLead(parseJson(await body(req, 16000))));
      return json(res, 201, lead);
    }
    const leadSend = route.match(/^\/api\/leads\/([0-9a-f-]+)\/send$/);
    if (leadSend && req.method === 'POST') {
      return json(res, 200, await sendLead(leadSend[1], parseJson(await body(req, 10000))));
    }
    if (route === '/api/whatsapp/status' && req.method === 'GET') return json(res, 200, await whatsappStatus());
    if (route === '/api/whatsapp/refresh' && req.method === 'POST') {
      return json(res, 200, await channels.whatsappRefresh());
    }
    if (route === '/api/whatsapp/disconnect' && req.method === 'POST') {
      const result = await channels.whatsappDisconnect();
      store.secrets.whatsapp.connectedAt = null;
      store.saveSecrets();
      whatsappSnapshot = { status: 'disconnected', qr: null, user: null };
      return json(res, 200, result);
    }

    if (route === '/api/settings' && req.method === 'PUT') {
      updateSettings(parseJson(await body(req, 100000)));
      return json(res, 200, publicSettings());
    }
    if (route === '/api/disconnect' && req.method === 'POST') {
      const { channel } = parseJson(await body(req, 1000));
      if (channel !== 'instagram') throw new Error('Canal inválido');
      store.secrets[channel] = {};
      store.saveSecrets();
      return json(res, 200, publicSettings());
    }
    if (route === '/api/test-connection' && req.method === 'POST') {
      const { channel } = parseJson(await body(req, 1000));
      const label = channel === 'instagram' ? await channels.verifyInstagram() : null;
      if (!label) throw new Error('Canal inválido');
      store.secrets[channel].label = label;
      store.secrets[channel].connectedAt ||= new Date().toISOString();
      setTimeout(syncInstagramProfiles, 500);
      store.saveSecrets();
      return json(res, 200, { label });
    }
    if (route === '/api/instagram/oauth-start' && req.method === 'POST') {
      const config = store.secrets.instagram;
      if (!config.appId || !config.appSecret || !store.secrets.publicUrl) throw new Error('Informe App ID, App Secret e URL pública antes de autorizar');
      const stateToken = crypto.randomBytes(24).toString('hex');
      oauthStates.set(stateToken, Date.now() + 10 * 60 * 1000);
      const redirect = `${store.secrets.publicUrl}/oauth/instagram/callback`;
      const params = new URLSearchParams({ client_id: config.appId, redirect_uri: redirect,
        scope: 'instagram_business_basic,instagram_business_manage_messages', response_type: 'code', state: stateToken });
      return json(res, 200, { url: `https://www.instagram.com/oauth/authorize?${params}` });
    }
    if (route === '/api/send' && req.method === 'POST') return json(res, 200, await send(parseJson(await body(req))));
    if (route.startsWith('/api/conversations/') && route.endsWith('/status') && req.method === 'PUT') {
      const id = decodeURIComponent(route.slice('/api/conversations/'.length, -'/status'.length));
      const { status } = parseJson(await body(req, 1000));
      if (!['pendente', 'em_atendimento', 'encerrada'].includes(status)) throw new Error('Status inválido');
      const conversation = store.db.conversations[id];
      if (!conversation) throw new Error('Conversa não encontrada');
      conversation.status = status;
      store.saveDb();
      return json(res, 200, conversation);
    }
    if (route.startsWith('/api/contacts/') && req.method === 'PUT') {
      const id = decodeURIComponent(route.slice('/api/contacts/'.length));
      const contact = store.db.contacts[id];
      if (!contact) throw new Error('Contato não encontrado');
      const data = parseJson(await body(req, 10000));
      if (typeof data.name === 'string') contact.name = data.name.trim().slice(0, 100) || contact.remoteId;
      if (typeof data.notes === 'string') contact.notes = data.notes.slice(0, 5000);
      if (Array.isArray(data.tags)) contact.tags = [...new Set(data.tags.map(x => String(x).trim()).filter(Boolean))].slice(0, 20).map(x => x.slice(0, 40));
      store.saveDb();
      return json(res, 200, contact);
    }
    if (route.startsWith('/api/media/') && req.method === 'GET') {
      const id = route.slice('/api/media/'.length);
      const file = store.mediaPath(id);
      if (!file) return json(res, 404, { error: 'Mídia não encontrada' });
      const message = Object.values(store.db.messages).flat().find(x => x.mediaId === id);
      res.writeHead(200, { 'Content-Type': message?.mimeType || (id.endsWith('.img') ? 'image/jpeg' : 'audio/mpeg'), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=3600' });
      return fs.createReadStream(file).pipe(res);
    }
    if (route.startsWith('/api/')) return json(res, 404, { error: 'Rota não encontrada' });
    if (route === '/fonts/RBNo3.1-UltraItalic.woff2') {
      res.writeHead(200, { 'Content-Type': 'font/woff2', 'Cache-Control': 'public, max-age=86400' });
      return fs.createReadStream(path.join(publicFiles, 'fonts', 'RBNo3.1-UltraItalic.woff2')).pipe(res);
    }
    const name = route === '/' ? 'index.html' : route.slice(1);
    if (!['index.html', 'app.js', 'style.css', 'logo.svg', 'default-avatar.png'].includes(name)) return json(res, 404, { error: 'Arquivo não encontrado' });
    const mime = { 'index.html': 'text/html; charset=utf-8', 'app.js': 'text/javascript; charset=utf-8',
      'style.css': 'text/css; charset=utf-8', 'logo.svg': 'image/svg+xml', 'default-avatar.png': 'image/png' }[name];
    res.writeHead(200, { 'Content-Type': mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    return fs.createReadStream(path.join(publicFiles, name)).pipe(res);
  } catch (error) { fail(res, error); }
}

function parseInstagram(payload) {
  const result = [];
  if (payload.object !== 'instagram') return result;
  for (const entry of payload.entry || []) for (const event of entry.messaging || []) {
    if (!event.message || event.message.is_echo || !event.sender?.id || event.sender.id === store.secrets.instagram.userId) continue;
    const attachment = event.message.attachments?.[0];
    const type = attachment?.type === 'audio' ? 'audio' : attachment?.type === 'image' ? 'image' : 'text';
    result.push({ channel: 'instagram', remoteId: event.sender.id, externalId: event.message.mid,
      timestamp: event.timestamp ? new Date(Number(event.timestamp)).toISOString() : null,
      type, text: event.message.text || (type === 'text' ? `[${attachment?.type || 'mensagem'}]` : ''),
      mediaUrl: attachment?.payload?.url, mimeType: attachment?.payload?.mime_type });
  }
  return result;
}
const processingEvents = new Set();
async function syncInstagramProfile(remoteId) {
  const contact = store.db.contacts[store.keyFor('instagram', remoteId)];
  if (!contact || contact.avatarUrl || instagramProfileSync.has(remoteId)) return;
  instagramProfileSync.add(remoteId);
  try {
    const profile = await channels.instagramProfile(remoteId);
    let avatarUrl = null;
    if (profile.profile_pic) avatarUrl = '/api/media/' + await channels.downloadInstagramMedia(profile.profile_pic, 'image/jpeg');
    store.updateInstagramProfile(remoteId, profile, avatarUrl);
  } finally { instagramProfileSync.delete(remoteId); }
}
async function syncInstagramProfiles() {
  const contacts = Object.values(store.db.contacts).filter(contact => contact.channel === 'instagram' && !contact.avatarUrl);
  for (const contact of contacts) {
    try { await syncInstagramProfile(contact.remoteId); }
    catch (error) { console.error('[Instagram] foto de perfil:', error.message); }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
async function processWebhook(channel, payload) {
  if (channel !== 'instagram') return;
  const connectedAt = store.secrets[channel].connectedAt;
  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) {
      if (event.read?.watermark && event.sender?.id && String(event.sender.id) !== String(store.secrets.instagram.userId || '') && connectedAt) {
        store.markInstagramRead(String(event.sender.id), event.read.watermark);
      }
    }
  }
  const events = parseInstagram(payload);
  for (const event of events) {
    const connectedAt = store.secrets[channel].connectedAt;
    const eventKey = `${channel}:${event.externalId}`;
    if (!connectedAt || (event.timestamp && event.timestamp < connectedAt) || store.db.seen[eventKey] || processingEvents.has(eventKey)) continue;
    processingEvents.add(eventKey);
    try {
      let mediaId = null;
      try {
        if (event.mediaUrl) mediaId = await channels.downloadInstagramMedia(event.mediaUrl, event.mimeType);
      } catch (error) { console.error(`[${channel}] mídia:`, error.message); }
      store.upsertInbound({ ...event, mediaId });
      syncInstagramProfile(event.remoteId).catch(error => console.error('[Instagram] foto de perfil:', error.message));
    } catch (error) { console.error(`[${channel}] webhook:`, error.message); }
    finally { processingEvents.delete(eventKey); }
  }
}
async function instagramOAuth(url, res) {
  const stateToken = url.searchParams.get('state');
  const expiry = oauthStates.get(stateToken);
  oauthStates.delete(stateToken);
  if (!expiry || expiry < Date.now()) throw new Error('Autorização expirada. Tente novamente.');
  if (url.searchParams.get('error')) throw new Error(url.searchParams.get('error_description') || 'Autorização recusada');
  const code = url.searchParams.get('code');
  if (!code) throw new Error('Código de autorização ausente');
  const config = store.secrets.instagram;
  const redirect = `${store.secrets.publicUrl}/oauth/instagram/callback`;
  const params = new URLSearchParams({ client_id: config.appId, client_secret: config.appSecret,
    grant_type: 'authorization_code', redirect_uri: redirect, code });
  const token = await channels.request('https://api.instagram.com/oauth/access_token', { method: 'POST', body: params });
  config.accessToken = token.access_token;
  config.userId = String(token.user_id || token.id || '');
  try {
    const long = await channels.request(`https://graph.instagram.com/access_token?${new URLSearchParams({
      grant_type: 'ig_exchange_token', client_secret: config.appSecret, access_token: config.accessToken
    })}`);
    if (long.access_token) config.accessToken = long.access_token;
  } catch (error) { console.warn('Token longo Instagram indisponível:', error.message); }
  if (!config.userId) throw new Error('A Meta não retornou o ID da conta Instagram');
  config.connectedAt = new Date().toISOString();
  setTimeout(syncInstagramProfiles, 500);
  store.saveSecrets();
  res.writeHead(302, { Location: `http://127.0.0.1:${APP_PORT}/?connected=instagram` });
  res.end();
}
async function webhook(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${WEBHOOK_PORT}`);
  const route = url.pathname;
  try {
    if (route === '/oauth/instagram/callback' && req.method === 'GET') return await instagramOAuth(url, res);
    if (route.startsWith('/outgoing/') && req.method === 'GET') {
      const ticket = route.slice('/outgoing/'.length);
      const item = pendingMedia.get(ticket);
      if (!item || item.expiresAt < Date.now()) return json(res, 404, { error: 'Mídia expirada' });
      const file = store.mediaPath(item.mediaId);
      if (!file) return json(res, 404, { error: 'Mídia não encontrada' });
      res.writeHead(200, { 'Content-Type': item.mimeType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      return fs.createReadStream(file).pipe(res);
    }
    const channel = route === '/webhooks/instagram' ? 'instagram' : null;
    if (!channel) return json(res, 404, { error: 'Rota não encontrada' });
    const config = store.secrets[channel];
    if (req.method === 'GET') {
      if (url.searchParams.get('hub.mode') === 'subscribe' && safeCompare(url.searchParams.get('hub.verify_token') || '', config.verifyToken || 'missing') && config.verifyToken) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(url.searchParams.get('hub.challenge') || '');
      }
      return json(res, 403, { error: 'Token de verificação incorreto' });
    }
    if (req.method === 'POST') {
      const raw = await body(req, 2 * 1024 * 1024);
      if (!verifySignature(raw, req.headers['x-hub-signature-256'], config.appSecret)) return json(res, 403, { error: 'Assinatura inválida' });
      const payload = parseJson(raw);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('EVENT_RECEIVED');
      processWebhook(channel, payload).catch(error => console.error(`[${channel}] webhook:`, error));
      return;
    }
    return json(res, 405, { error: 'Método inválido' });
  } catch (error) {
    if (route === '/oauth/instagram/callback') {
      res.writeHead(302, { Location: `http://127.0.0.1:${APP_PORT}/?oauth_error=${encodeURIComponent(error.message)}` });
      return res.end();
    }
    fail(res, error);
  }
}

if (require.main === module) {
  http.createServer(app).listen(APP_PORT, '127.0.0.1', () => console.log(`CRM: http://127.0.0.1:${APP_PORT}`));
  http.createServer(webhook).listen(WEBHOOK_PORT, '127.0.0.1', () => console.log(`Webhooks: http://127.0.0.1:${WEBHOOK_PORT}`));
  pollWhatsApp();
  if (store.secrets.instagram.accessToken && store.secrets.instagram.connectedAt) setTimeout(syncInstagramProfiles, 2500);
  setInterval(pollWhatsApp, 3500);
}
module.exports = { app, webhook, parseInstagram, verifySignature, processWebhook, pollWhatsApp, syncInstagramProfiles, validateLead };
