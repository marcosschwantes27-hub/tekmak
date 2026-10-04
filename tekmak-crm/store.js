const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = process.env.CRM_DATA_DIR || path.join(__dirname, 'data');
const mediaDir = path.join(root, 'media');
fs.mkdirSync(mediaDir, { recursive: true });

function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
function write(name, value) {
  const target = path.join(root, name);
  const temp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temp, target);
}

const db = read('db.json', { contacts: {}, conversations: {}, messages: {}, seen: {} });
db.leads ||= {};
const secrets = read('secrets.json', { whatsapp: {}, instagram: {}, publicUrl: '' });
let revision = 0;
const saveDb = () => { revision++; write('db.json', db); };
const saveSecrets = () => write('secrets.json', secrets);
const keyFor = (channel, remoteId) => `${channel}:${remoteId}`;

function upsertInbound({ channel, remoteId, name, externalId, timestamp, type, text, mediaId, mimeType }) {
  if (!remoteId || !externalId || db.seen[`${channel}:${externalId}`]) return null;
  const key = keyFor(channel, remoteId);
  const now = new Date().toISOString();
  if (!db.contacts[key]) db.contacts[key] = { id: key, channel, remoteId, name: name || remoteId, tags: [], notes: '' };
  else if (name && db.contacts[key].name === remoteId) db.contacts[key].name = name;
  const conversation = db.conversations[key] || { id: key, channel, contactId: key, status: 'pendente', updatedAt: now };
  if (conversation.status === 'encerrada') conversation.status = 'pendente';
  conversation.updatedAt = now;
  conversation.lastMessage = text || (type === 'audio' ? 'Áudio' : type === 'image' ? 'Imagem' : type === 'sticker' ? 'Figurinha' : 'Mídia');
  db.conversations[key] = conversation;
  const message = {
    id: crypto.randomUUID(), externalId, conversationId: key, channel, direction: 'in',
    type: type || 'text', text: text || '', mediaId: mediaId || null, mimeType: mimeType || null,
    createdAt: timestamp || now, state: 'received'
  };
  (db.messages[key] ||= []).push(message);
  db.seen[`${channel}:${externalId}`] = true;
  saveDb();
  return message;
}

function updateInstagramProfile(remoteId, profile, avatarUrl) {
  const contact = db.contacts[keyFor('instagram', remoteId)];
  if (!contact) return null;
  if (avatarUrl) contact.avatarUrl = avatarUrl;
  if (profile?.username) contact.username = profile.username;
  if (profile?.name && contact.name === remoteId) contact.name = profile.name;
  saveDb();
  return contact;
}

function addOutgoing({ conversationId, externalId, type, text, mediaId, mimeType }) {
  const conversation = db.conversations[conversationId];
  if (!conversation) throw new Error('Conversa não encontrada');
  if (externalId) {
    const existing = (db.messages[conversationId] || []).find(item => item.externalId === externalId);
    if (existing) return existing;
  }
  const now = new Date().toISOString();
  const message = {
    id: crypto.randomUUID(), externalId, conversationId, channel: conversation.channel,
    direction: 'out', type, text: text || '', mediaId: mediaId || null, mimeType: mimeType || null,
    createdAt: now, state: 'sent'
  };
  (db.messages[conversationId] ||= []).push(message);
  if (externalId) db.seen[conversation.channel + ':' + externalId] = true;
  conversation.updatedAt = now;
  conversation.lastMessage = text || (type === 'audio' ? 'Áudio enviado' : 'Imagem enviada');
  saveDb();
  return message;
}


function addLead({ name, whatsapp, task, investmentBand, machineInterest }) {
  const lead = {
    id: crypto.randomUUID(), name, whatsapp, task, investmentBand,
    machineInterest: machineInterest || '', createdAt: new Date().toISOString(), conversationId: null
  };
  db.leads[lead.id] = lead;
  saveDb();
  return lead;
}

function ensureWhatsAppConversation(phone, name) {
  const key = keyFor('whatsapp', phone);
  const now = new Date().toISOString();
  if (!db.contacts[key]) db.contacts[key] = { id: key, channel: 'whatsapp', remoteId: phone, name: name || phone, tags: [], notes: '' };
  if (!db.conversations[key]) db.conversations[key] = { id: key, channel: 'whatsapp', contactId: key, status: 'pendente', updatedAt: now, lastMessage: '' };
  for (const lead of Object.values(db.leads)) if (lead.whatsapp === phone && !lead.conversationId) lead.conversationId = key;
  saveDb();
  return db.conversations[key];
}

function upsertBridgeMessage({ phone, name, avatarUrl, externalId, timestamp, direction, type, text, mediaId, mimeType }) {
  if (!phone || !externalId || db.seen['whatsapp:' + externalId]) return null;
  const conversation = ensureWhatsAppConversation(phone, name);
  const contact = db.contacts[conversation.contactId];
  if (avatarUrl && !contact.avatarUrl) contact.avatarUrl = avatarUrl;
  const now = new Date().toISOString();
  const message = {
    id: crypto.randomUUID(), externalId, conversationId: conversation.id, channel: 'whatsapp',
    direction: direction === 'out' ? 'out' : 'in', type: type || 'text', text: text || '',
    mediaId: mediaId || null, mimeType: mimeType || null,
    createdAt: timestamp || now, state: direction === 'out' ? 'sent' : 'received'
  };
  (db.messages[conversation.id] ||= []).push(message);
  db.messages[conversation.id].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (message.createdAt >= conversation.updatedAt) {
    conversation.updatedAt = message.createdAt;
    conversation.lastMessage = text || (type === 'audio' ? 'Áudio' : type === 'image' ? 'Imagem' : type === 'sticker' ? 'Figurinha' : 'Mensagem');
  }
  if (direction !== 'out' && conversation.status === 'encerrada') conversation.status = 'pendente';
  db.seen['whatsapp:' + externalId] = true;
  saveDb();
  return message;
}

function updateMessageState(channel, externalId, state) {
  const rank = { sent: 1, delivered: 2, read: 3 };
  if (!externalId || !rank[state]) return false;
  let changed = false;
  for (const messages of Object.values(db.messages)) {
    const message = messages.find(item => item.channel === channel && item.externalId === externalId);
    if (message && (rank[message.state] || 0) < rank[state]) {
      message.state = state;
      changed = true;
      break;
    }
  }
  if (changed) saveDb();
  return changed;
}

function markInstagramRead(remoteId, watermark) {
  const conversationId = keyFor('instagram', remoteId);
  const cutoff = Number(watermark);
  if (!Number.isFinite(cutoff)) return false;
  let changed = false;
  for (const message of db.messages[conversationId] || []) {
    if (message.direction === 'out' && Date.parse(message.createdAt) <= cutoff && message.state !== 'read') {
      message.state = 'read';
      changed = true;
    }
  }
  if (changed) saveDb();
  return changed;
}
function saveMedia(buffer, mimeType) {
  const extension = mimeType.startsWith('image/') ? '.img' : '.audio';
  const id = crypto.randomUUID() + extension;
  fs.writeFileSync(path.join(mediaDir, id), buffer, { mode: 0o600 });
  return id;
}
function mediaPath(id) {
  if (!/^[0-9a-f-]{36}\.(img|audio)$/.test(id)) return null;
  const target = path.join(mediaDir, id);
  return fs.existsSync(target) ? target : null;
}

module.exports = { db, secrets, get revision() { return revision; }, saveDb, saveSecrets, keyFor, upsertInbound, updateInstagramProfile, updateMessageState, markInstagramRead, addOutgoing, addLead, ensureWhatsAppConversation, upsertBridgeMessage, saveMedia, mediaPath };
