const crypto = require('node:crypto');
const store = require('./store');

const version = () => store.secrets.graphVersion || 'v23.0';
const graph = (path, instagram = false) => `https://${instagram ? 'graph.instagram.com' : 'graph.facebook.com'}/${version()}/${path}`;

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { message: body }; }
  if (!response.ok) throw new Error(data.error?.error_user_msg || data.error?.message || data.message || `Meta HTTP ${response.status}`);
  return data;
}

function bearer(token) { return { Authorization: `Bearer ${token}` }; }

const bridgeBase = process.env.BAILEYS_BRIDGE_URL || 'http://127.0.0.1:3000';
async function bridge(path, options = {}) {
  let response;
  try {
    response = await fetch(bridgeBase + path, { ...options, signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error('Servidor WhatsApp local indisponível. Inicie o site TekMak na porta 3000.');
  }
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { error: raw }; }
  if (!response.ok) throw new Error(data.error || 'Falha na conexão com o WhatsApp local');
  return data;
}
const jsonOptions = data => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

async function whatsappStatus() { return bridge('/api/status'); }
async function whatsappRefresh() { return bridge('/api/refresh-qr', jsonOptions({})); }
async function whatsappDisconnect() { return bridge('/api/disconnect', jsonOptions({})); }
async function whatsappFeed(since) { return bridge('/api/crm-feed?since=' + encodeURIComponent(since)); }
function whatsappAvatarUrl(phone) { const digits = String(phone || "").replace(/[^0-9]/g, ""); return digits.length >= 10 ? bridgeBase + "/api/avatar?id=" + digits : null; }

async function sendWhatsApp(contact, payload) {
  const status = await whatsappStatus();
  if (status.status !== 'connected') throw new Error('Conecte o WhatsApp em Configurações antes de enviar');
  const chat = await bridge('/api/new-chat', jsonOptions({ phone: contact.remoteId, name: contact.name }));
  const jid = chat.chat?.id || (contact.remoteId + '@s.whatsapp.net');
  const route = payload.type === 'text' ? '/api/send' : '/api/send-media';
  const sent = await bridge(route, jsonOptions({
    jid, type: payload.type, text: payload.text || '', mimeType: payload.mimeType,
    data: payload.data
  }));
  if (!sent.message?.id) throw new Error('WhatsApp não confirmou o envio');
  return sent.message.id;
}

async function downloadWhatsAppMedia(mediaId, mimeType) {
  if (!/^[a-f0-9]{64}\.(img|audio)$/.test(mediaId)) return null;
  const response = await fetch(bridgeBase + '/api/crm-media/' + mediaId, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Mídia WhatsApp indisponível');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 20 * 1024 * 1024) throw new Error('Mídia excede 20 MB');
  return store.saveMedia(buffer, mimeType || response.headers.get('content-type') || 'application/octet-stream');
}

async function sendInstagram(contact, payload, publicMediaUrl) {
  const config = store.secrets.instagram;
  if (!config.accessToken || !config.userId) throw new Error('Conecte o Instagram nas configurações');
  const message = payload.type === 'text'
    ? { text: payload.text }
    : { attachment: { type: payload.type, payload: { url: publicMediaUrl } } };
  const result = await request(graph(`${config.userId}/messages`, true), {
    method: 'POST', headers: { ...bearer(config.accessToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: contact.remoteId }, message })
  });
  return result.message_id || crypto.randomUUID();
}

async function downloadInstagramMedia(url, mimeType) {
  if (!url || !/^https:\/\//i.test(url)) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Mídia Instagram HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 20 * 1024 * 1024) throw new Error('Mídia excede 20 MB');
  return store.saveMedia(buffer, mimeType || response.headers.get('content-type') || 'application/octet-stream');
}

async function instagramProfile(remoteId) {
  const config = store.secrets.instagram;
  if (!config.accessToken || !remoteId) throw new Error('Perfil do Instagram indisponível');
  return request(graph(encodeURIComponent(remoteId) + "?fields=id,username,name,profile_pic", true), { headers: bearer(config.accessToken) });
}

async function verifyInstagram() {
  const config = store.secrets.instagram;
  if (!config.accessToken || !config.userId) throw new Error('Informe token e ID da conta');
  const data = await request(graph(`${config.userId}?fields=id,username`, true), { headers: bearer(config.accessToken) });
  return data.username || data.id;
}

module.exports = { sendWhatsApp, sendInstagram, downloadWhatsAppMedia, downloadInstagramMedia, whatsappStatus, whatsappRefresh, whatsappDisconnect, whatsappFeed, whatsappAvatarUrl, verifyInstagram, instagramProfile, request, graph };
