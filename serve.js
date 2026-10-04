const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const url = require('url');
const crypto = require('crypto');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  ALL_WA_PATCH_NAMES,
  extractMessageContent,
  downloadMediaMessage
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const WebSocket = require('ws');

const PORT = 3000;
const AUTH_DIR = path.join(__dirname, 'auth_baileys');
const DATA_DIR = path.join(__dirname, 'data_crm');
const AVATAR_DIR = path.join(DATA_DIR, 'avatars');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const BRIDGE_MEDIA_DIR = path.join(DATA_DIR, 'bridge-media');
fs.mkdirSync(BRIDGE_MEDIA_DIR, { recursive: true });

function saveBridgeMedia(buffer, mimeType, externalId) {
  if (buffer.length > 20 * 1024 * 1024) throw new Error('Mídia excede 20 MB');
  const suffix = mimeType.startsWith('image/') ? '.img' : '.audio';
  const id = crypto.createHash('sha256').update(externalId).digest('hex') + suffix;
  fs.writeFileSync(path.join(BRIDGE_MEDIA_DIR, id), buffer);
  return id;
}

if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}
if (!fs.existsSync(AVATAR_DIR)) {
  try { fs.mkdirSync(AVATAR_DIR, { recursive: true }); } catch (e) {}
}

const contactsMap = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// State Store
let sock = null;
let connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'qr' | 'connected'
let currentQR = null;
let qrExpiresAt = null;
let currentUser = null;
const chatsMap = new Map(); // jid -> chatObj
const messagesMap = new Map(); // jid -> array of msgObj
const wsClients = new Set();
let isInitializing = false;

// Helper to broadcast WS messages
function broadcast(data) {
  const json = JSON.stringify(data);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(json);
      } catch (err) {
        console.error('WS broadcast error:', err.message);
      }
    }
  }
}

const lidToPhoneCache = new Map();

function phoneFromJid(jid) {
  if (!jid) return '';
  return jid.split('@')[0].split(':')[0];
}

function isSelfJid(jid) {
  if (!jid || jid === 'status@broadcast') return true;
  const clean = jid.split('@')[0].split(':')[0];
  if (currentUser) {
    if (currentUser.phone && clean === currentUser.phone) return true;
    if (currentUser.lid && clean === currentUser.lid.split('@')[0].split(':')[0]) return true;
  }
  if (sock?.user) {
    const userPhone = phoneFromJid(sock.user.id);
    if (userPhone && clean === userPhone) return true;
    if (sock.user.lid && clean === sock.user.lid.split('@')[0].split(':')[0]) return true;
  }
  return false;
}

function resolvePhoneForJid(jid, altJid) {
  if (altJid && !altJid.endsWith('@lid')) {
    const p = phoneFromJid(altJid);
    if (jid && jid.endsWith('@lid')) {
      lidToPhoneCache.set(phoneFromJid(jid), p);
    }
    return p;
  }
  const clean = phoneFromJid(jid);
  if (!jid || !jid.endsWith('@lid')) return clean;

  if (lidToPhoneCache.has(clean)) return lidToPhoneCache.get(clean);

  try {
    const f = path.join(AUTH_DIR, `lid-mapping-${clean}_reverse.json`);
    if (fs.existsSync(f)) {
      const val = JSON.parse(fs.readFileSync(f, 'utf8') || '""');
      if (val) {
        const phone = String(val).replace(/\D/g, '');
        lidToPhoneCache.set(clean, phone);
        return phone;
      }
    }
  } catch (e) {}

  return clean;
}

function formatDisplayPhone(phone) {
  if (!phone) return '';
  const p = String(phone).replace(/\D/g, '');
  if (p.startsWith('55')) {
    const ddd = p.substring(2, 4);
    const rest = p.substring(4);
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    }
    if (rest.length === 8) {
      return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
    if (rest.length > 4) {
      return `+55 (${ddd}) ${rest}`;
    }
  }
  if (p.length > 8) return `+${p}`;
  return p;
}

function formatDisplayName(phone, pushName, jid) {
  if (pushName && pushName.trim() && !pushName.startsWith('+') && pushName !== phone) {
    return pushName.trim();
  }
  if (jid && jid.endsWith('@g.us')) {
    return pushName || `Grupo (${(phone || '').slice(0, 8)}...)`;
  }
  return formatDisplayPhone(phone);
}

function formatJidName(jid, pushName) {
  if (pushName && pushName.trim()) return pushName.trim();
  const phone = resolvePhoneForJid(jid);
  return formatDisplayName(phone, pushName, jid);
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(typeof ts === 'number' ? (ts > 1e11 ? ts : ts * 1000) : ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (isToday) return `${hours}:${minutes}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function normalizeMessage(msg) {
  if (!msg) return null;
  let m = msg.message || msg;
  let depth = 0;
  while (m && depth < 5) {
    if (m.ephemeralMessage?.message) { m = m.ephemeralMessage.message; depth++; continue; }
    if (m.viewOnceMessage?.message) { m = m.viewOnceMessage.message; depth++; continue; }
    if (m.viewOnceMessageV2?.message) { m = m.viewOnceMessageV2.message; depth++; continue; }
    if (m.viewOnceMessageV2Extension?.message) { m = m.viewOnceMessageV2Extension.message; depth++; continue; }
    if (m.documentWithCaptionMessage?.message) { m = m.documentWithCaptionMessage.message; depth++; continue; }
    if (m.deviceSentMessage?.message) { m = m.deviceSentMessage.message; depth++; continue; }
    if (m.editedMessage?.message?.protocolMessage?.editedMessage) { m = m.editedMessage.message.protocolMessage.editedMessage; depth++; continue; }
    break;
  }
  return m;
}

function extractMessageText(rawMsg) {
  const m = normalizeMessage(rawMsg);
  if (!m) return '';
  if (typeof m === 'string') return m;

  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return `📷 ${m.imageMessage.caption}`;
  if (m.imageMessage) return '📷 Foto';
  if (m.videoMessage?.caption) return `🎥 ${m.videoMessage.caption}`;
  if (m.videoMessage) return '🎥 Vídeo';
  if (m.audioMessage) return '🎙️ Áudio';
  if (m.documentMessage?.fileName) return `📄 ${m.documentMessage.fileName}`;
  if (m.documentMessage) return '📄 Documento';
  if (m.stickerMessage) return '👾 Figurinha';
  if (m.contactMessage?.displayName) return `👤 ${m.contactMessage.displayName}`;
  if (m.contactMessage) return '👤 Contato';
  if (m.locationMessage) return '📍 Localização';
  if (m.reactionMessage?.text) return `Reagiu ${m.reactionMessage.text}`;
  if (m.pollCreationMessage?.name) return `📊 ${m.pollCreationMessage.name}`;

  return '';
}

function getCanonicalJid(jid) {
  if (!jid) return '';
  if (chatsMap.has(jid)) return jid;
  for (const c of chatsMap.values()) {
    if (c.altId === jid) return c.id;
    if (c.phone && (c.phone === phoneFromJid(jid) || `${c.phone}@s.whatsapp.net` === jid)) return c.id;
  }
  return jid;
}

function seedRecentChatsFromAuth() {
  try {
    if (!fs.existsSync(AUTH_DIR)) return;
    const files = fs.readdirSync(AUTH_DIR);
    const tctokens = files.filter(f => f.startsWith('tctoken-') && f !== 'tctoken-__index.json');
    let added = 0;
    for (const f of tctokens) {
      const lid = f.replace('tctoken-', '').replace('.json', '');
      if (isSelfJid(lid)) continue;
      const cleanLid = lid.split('@')[0];
      const revFile = path.join(AUTH_DIR, `lid-mapping-${cleanLid}_reverse.json`);
      const phone = fs.existsSync(revFile) ? JSON.parse(fs.readFileSync(revFile, 'utf8') || '""') : '';
      if (!phone) continue;

      let tokenData = {};
      try {
        tokenData = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, f), 'utf8') || '{}');
      } catch (e) {}
      const senderTs = tokenData.senderTimestamp ? Number(tokenData.senderTimestamp) * 1000 : 0;

      let chat = null;
      for (const c of chatsMap.values()) {
        if (c.id === lid || c.phone === phone || c.altId === `${phone}@s.whatsapp.net`) {
          chat = c;
          break;
        }
      }
      if (!chat) {
        chat = {
          id: lid,
          altId: `${phone}@s.whatsapp.net`,
          name: formatDisplayPhone(phone),
          phone: phone,
          unreadCount: 0,
          time: senderTs ? formatTimestamp(senderTs) : '',
          timestamp: senderTs,
          lastMessage: '',
          isGroup: false,
          avatar: null
        };
        chatsMap.set(lid, chat);
        added++;
      } else {
        if (senderTs > (chat.timestamp || 0)) {
          chat.timestamp = senderTs;
          if (!chat.time || chat.time === '') {
            chat.time = formatTimestamp(senderTs);
          }
        }
      }
    }
    if (added > 0) {
      console.log(`[CRM Data] Sincronizados ${added} contatos recentes salvos no aparelho.`);
    }
    saveData();
  } catch (err) {
    console.error('[CRM Data] Erro ao carregar contatos de auth:', err.message);
  }
}

function loadContacts() {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      const obj = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8') || '{}');
      for (const [k, v] of Object.entries(obj)) {
        contactsMap.set(k, v);
      }
      console.log(`[CRM Contacts] Carregados ${contactsMap.size} índices de contatos salvos.`);
    }
  } catch (err) {
    console.error('[CRM Contacts] Erro ao carregar contacts.json:', err.message);
  }
}

function saveContacts() {
  try {
    const obj = {};
    for (const [k, v] of contactsMap.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('[CRM Contacts] Erro ao salvar contacts.json:', err.message);
  }
}

function getContactForChat(chat) {
  if (!chat) return null;
  const p = chat.phone ? String(chat.phone).replace(/\D/g, '') : '';
  if (p && contactsMap.has(p)) return contactsMap.get(p);
  if (chat.id && contactsMap.has(chat.id)) return contactsMap.get(chat.id);
  if (chat.altId && contactsMap.has(chat.altId)) return contactsMap.get(chat.altId);
  return null;
}

function applyContactInfo(chat) {
  if (!chat) return;
  const c = getContactForChat(chat);
  if (c && c.name && c.name.trim()) {
    chat.name = c.name.trim();
  }
  const cleanId = (chat.phone || phoneFromJid(chat.id)).replace(/\D/g, '');
  const avatarFile = path.join(AVATAR_DIR, `${cleanId}.jpg`);
  if (fs.existsSync(avatarFile)) {
    chat.avatar = `/api/avatar?id=${cleanId}`;
  }
}

async function downloadAvatarFile(cleanId, url) {
  return new Promise((resolve) => {
    const dest = path.join(AVATAR_DIR, `${cleanId}.jpg`);
    try {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        if (res.statusCode !== 200) return resolve(false);
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          try {
            fs.writeFileSync(dest, Buffer.concat(chunks));
            resolve(true);
          } catch (e) {
            resolve(false);
          }
        });
      }).on('error', () => resolve(false));
    } catch (e) {
      resolve(false);
    }
  });
}

let isSyncingAvatars = false;
async function syncAvatarsForChats() {
  if (isSyncingAvatars || !sock || connectionStatus !== 'connected') return;
  isSyncingAvatars = true;
  console.log('[WhatsApp Avatars] Sincronizando fotos de perfil...');

  for (const chat of Array.from(chatsMap.values())) {
    if (isSelfJid(chat.id)) continue;
    const cleanId = (chat.phone || phoneFromJid(chat.id)).replace(/\D/g, '');
    const avatarFile = path.join(AVATAR_DIR, `${cleanId}.jpg`);
    if (fs.existsSync(avatarFile)) {
      if (!chat.avatar) {
        chat.avatar = `/api/avatar?id=${cleanId}`;
      }
      continue;
    }

    const targets = [];
    if (chat.phone) targets.push(`${chat.phone}@s.whatsapp.net`);
    if (chat.altId) targets.push(chat.altId);
    if (chat.id) targets.push(chat.id);

    let foundUrl = null;
    for (const t of targets) {
      try {
        foundUrl = await sock.profilePictureUrl(t, 'preview');
        if (foundUrl) break;
      } catch (e) {}
    }

    if (foundUrl) {
      const ok = await downloadAvatarFile(cleanId, foundUrl);
      if (ok) {
        chat.avatar = `/api/avatar?id=${cleanId}`;
        broadcast({ type: 'chat_update', chat });
        console.log(`[WhatsApp Avatars] Foto baixada: ${chat.name || cleanId}`);
      }
    }

    await new Promise(r => setTimeout(r, 180));
  }

  saveData();
  isSyncingAvatars = false;
  console.log('[WhatsApp Avatars] Sincronização de fotos concluída.');
  broadcast({ type: 'chats_loaded', chats: getSortedChats() });
}

let isSyncingGroups = false;
async function syncGroups() {
  if (isSyncingGroups || !sock || connectionStatus !== 'connected') return;
  isSyncingGroups = true;
  try {
    console.log('[WhatsApp Groups] Sincronizando grupos participantes...');
    const groups = await sock.groupFetchAllParticipating();
    const groupList = Object.values(groups || {});
    console.log(`[WhatsApp Groups] Encontrados ${groupList.length} grupos participantes.`);

    let changed = false;
    for (const group of groupList) {
      if (!group.id) continue;
      const jid = group.id;
      const cleanId = jid.replace('@g.us', '');
      let chat = chatsMap.get(jid);

      const subject = (group.subject || '').trim() || 'Grupo';
      const count = group.participants ? group.participants.length : 0;
      const desc = group.desc || '';
      const creationTs = group.creation ? Number(group.creation) * 1000 : 0;

      if (!chat) {
        chat = {
          id: jid,
          altId: `${cleanId}@s.whatsapp.net`,
          name: subject,
          phone: cleanId,
          unreadCount: 0,
          time: creationTs ? formatTimestamp(creationTs) : '',
          timestamp: creationTs,
          lastMessage: '',
          isGroup: true,
          participantCount: count,
          description: desc,
          avatar: `/api/avatar?id=${cleanId}`
        };
        chatsMap.set(jid, chat);
        changed = true;
      } else {
        chat.isGroup = true;
        if (subject && chat.name !== subject) {
          chat.name = subject;
          changed = true;
        }
        if (count && chat.participantCount !== count) {
          chat.participantCount = count;
          changed = true;
        }
        if (desc) chat.description = desc;
        if (!chat.avatar) chat.avatar = `/api/avatar?id=${cleanId}`;
      }
    }

    if (changed) {
      saveData();
      broadcast({ type: 'chats_loaded', chats: getSortedChats() });
    }
  } catch (err) {
    console.error('[WhatsApp Groups] Erro ao sincronizar grupos:', err.message);
  } finally {
    isSyncingGroups = false;
  }
}

function loadData() {
  try {
    loadContacts();

    const chatsFile = path.join(DATA_DIR, 'chats.json');
    if (fs.existsSync(chatsFile)) {
      const arr = JSON.parse(fs.readFileSync(chatsFile, 'utf8') || '[]');
      for (const c of arr) {
        if (!isSelfJid(c.id)) {
          if (c.id.endsWith('@lid') && (!c.phone || c.phone.length > 13 || c.phone === phoneFromJid(c.id))) {
            const resolved = resolvePhoneForJid(c.id, c.altId);
            if (resolved && resolved !== phoneFromJid(c.id)) {
              c.phone = resolved;
              c.altId = `${resolved}@s.whatsapp.net`;
            }
          }
          applyContactInfo(c);
          chatsMap.set(c.id, c);
        }
      }
    }
    const msgsFile = path.join(DATA_DIR, 'messages.json');
    if (fs.existsSync(msgsFile)) {
      const obj = JSON.parse(fs.readFileSync(msgsFile, 'utf8') || '{}');
      for (const [jid, list] of Object.entries(obj)) {
        if (!isSelfJid(jid)) {
          messagesMap.set(jid, list);
          if (list && list.length > 0) {
            const lastM = list[list.length - 1];
            let chat = chatsMap.get(jid);
            if (!chat) {
              for (const c of chatsMap.values()) {
                if (c.altId === jid || c.phone === phoneFromJid(jid)) {
                  chat = c;
                  break;
                }
              }
            }
            if (chat) {
              if ((lastM.timestamp || 0) >= (chat.timestamp || 0)) {
                chat.timestamp = lastM.timestamp;
                chat.time = lastM.time || formatTimestamp(lastM.timestamp);
                chat.lastMessage = lastM.text || chat.lastMessage;
              }
            }
          }
        }
      }
    }
    console.log(`[CRM Data] Carregados ${chatsMap.size} conversas salvas do disco.`);
    seedRecentChatsFromAuth();

    for (const c of chatsMap.values()) {
      applyContactInfo(c);
    }
  } catch (err) {
    console.error('[CRM Data] Erro ao carregar dados:', err.message);
  }
}

function saveData() {
  try {
    const chatsFile = path.join(DATA_DIR, 'chats.json');
    const validChats = getSortedChats();
    fs.writeFileSync(chatsFile, JSON.stringify(validChats, null, 2), 'utf8');

    const msgsFile = path.join(DATA_DIR, 'messages.json');
    const msgsObj = {};
    for (const [jid, list] of messagesMap.entries()) {
      if (!isSelfJid(jid)) msgsObj[jid] = list;
    }
    fs.writeFileSync(msgsFile, JSON.stringify(msgsObj, null, 2), 'utf8');
  } catch (err) {
    console.error('[CRM Data] Erro ao salvar dados:', err.message);
  }
}

function applyWhatsAppReceipt(key, rawStatus) {
  if (!key?.fromMe || !key.id) return;
  const statusNumber = Number(rawStatus);
  const state = statusNumber >= 4 ? 'read' : statusNumber === 3 ? 'delivered' : statusNumber === 2 ? 'sent' : null;
  if (!state) return;
  let changed = false;
  for (const messages of messagesMap.values()) {
    const message = messages.find(item => item.id === key.id && item.sender === 'out');
    if (!message) continue;
    const rank = { sent: 1, delivered: 2, read: 3 };
    if ((rank[message.status] || 0) < rank[state]) {
      message.status = state;
      message.statusUpdatedAt = Date.now();
      changed = true;
    }
    break;
  }
  if (changed) {
    saveData();
    broadcast({ type: 'message_status', id: key.id, status: state });
  }
}
function processMessage(msg) {
  if (!msg.key || !msg.key.remoteJid) return null;
  const rawJid = msg.key.remoteJid;
  if (isSelfJid(rawJid)) return null;

  const isGroup = rawJid.endsWith('@g.us');
  const altJid = msg.key.remoteJidAlt;
  const resolvedPhone = isGroup ? '' : resolvePhoneForJid(rawJid, altJid);
  const fromMe = !!msg.key.fromMe;
  const content = extractMessageContent(msg.message) || msg.message || {};
  const mediaType = content.stickerMessage ? 'sticker' : content.imageMessage ? 'image' : content.audioMessage ? 'audio' : 'text';
  const mimeType = content.stickerMessage?.mimetype || (content.stickerMessage ? 'image/webp' : null) || content.imageMessage?.mimetype || content.audioMessage?.mimetype || null;
  const rawText = extractMessageText(msg.message);
  if (!rawText) return null; // Ignore protocol/sync/service frames

  const ts = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now();
  const timeStr = formatTimestamp(ts);

  // Group participant sender resolution
  const participantJid = isGroup ? (msg.key.participant || msg.participant) : null;
  let participantPhone = participantJid ? (resolvePhoneForJid(participantJid) || phoneFromJid(participantJid)) : '';
  let participantContact = participantPhone ? contactsMap.get(participantPhone) : (participantJid ? contactsMap.get(participantJid) : null);
  const participantSavedName = participantContact ? (participantContact.name || participantContact.notify) : null;
  const senderDisplayName = fromMe ? 'Você' : (participantSavedName || msg.pushName || (participantPhone ? formatDisplayPhone(participantPhone) : 'Participante'));

  const messageObj = {
    id: msg.key.id,
    key: msg.key,
    sender: fromMe ? 'out' : 'in',
    text: rawText,
    type: mediaType,
    mimeType,
    mediaReady: mediaType === 'text',
    time: timeStr,
    timestamp: ts,
    status: fromMe ? 'sent' : 'received',
    participant: participantJid,
    senderName: senderDisplayName
  };

  const canonicalJid = getCanonicalJid(rawJid);
  const jid = canonicalJid || rawJid;

  if (!messagesMap.has(jid)) {
    messagesMap.set(jid, []);
  }
  const chatMsgs = messagesMap.get(jid);
  if (!chatMsgs.some(m => m.id === messageObj.id)) {
    chatMsgs.push(messageObj);
    chatMsgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    if (chatMsgs.length > 300) chatMsgs.shift();
  }

  let chat = chatsMap.get(jid);
  const pushName = msg.pushName && msg.pushName.trim();

  const contact = resolvedPhone ? contactsMap.get(resolvedPhone) : (contactsMap.get(jid) || contactsMap.get(phoneFromJid(jid)));
  const contactName = contact ? (contact.name || contact.notify) : null;
  const cleanPhone = (resolvedPhone || phoneFromJid(jid) || '').replace(/\D/g, '');
  const autoAvatar = cleanPhone.length >= 8 ? `/api/avatar?id=${cleanPhone}` : null;

  const previewText = isGroup ? `${senderDisplayName}: ${rawText}` : rawText;

  if (!chat) {
    chat = {
      id: jid,
      altId: altJid || (resolvedPhone ? `${resolvedPhone}@s.whatsapp.net` : null),
      name: isGroup ? 'Grupo' : (contactName || pushName || formatDisplayName(resolvedPhone, null, jid)),
      phone: resolvedPhone || phoneFromJid(jid),
      unreadCount: fromMe ? 0 : 1,
      time: timeStr,
      timestamp: ts,
      lastMessage: previewText,
      isGroup: isGroup,
      avatar: autoAvatar
    };
    chatsMap.set(jid, chat);

    if (isGroup && sock) {
      sock.groupMetadata(jid).then(meta => {
        if (meta && meta.subject) {
          chat.name = meta.subject;
          chat.participantCount = meta.participants ? meta.participants.length : 0;
          if (meta.desc) chat.description = meta.desc;
          saveData();
          broadcast({ type: 'chat_update', chat });
        }
      }).catch(() => {});
    }
  } else {
    chat.lastMessage = previewText;
    chat.time = timeStr;
    chat.timestamp = Math.max(chat.timestamp || 0, ts);
    if (!isGroup) {
      if (resolvedPhone && (!chat.phone || chat.phone.startsWith('1') || chat.phone.length > 13 || chat.phone === phoneFromJid(chat.id))) {
        chat.phone = resolvedPhone;
      }
      if (altJid && !chat.altId) {
        chat.altId = altJid;
      }
      if (!chat.avatar && autoAvatar) {
        chat.avatar = autoAvatar;
      }
      if (contactName) {
        chat.name = contactName;
      } else if (pushName && (!chat.name || chat.name.startsWith('+') || chat.name === chat.phone)) {
        chat.name = pushName;
      }
    } else {
      chat.isGroup = true;
      if (!chat.avatar && autoAvatar) {
        chat.avatar = autoAvatar;
      }
      // If group has placeholder name or previous wrong pushName, refresh true subject
      if (!chat.name || chat.name === 'Grupo' || chat.name.startsWith('120363') || (pushName && chat.name === pushName)) {
        if (sock) {
          sock.groupMetadata(jid).then(meta => {
            if (meta && meta.subject) {
              chat.name = meta.subject;
              chat.participantCount = meta.participants ? meta.participants.length : 0;
              if (meta.desc) chat.description = meta.desc;
              saveData();
              broadcast({ type: 'chat_update', chat });
            }
          }).catch(() => {});
        }
      }
    }
    if (!fromMe) {
      chat.unreadCount = (chat.unreadCount || 0) + 1;
    }
  }

  return { messageObj, chat, rawJid };
}

function getSortedChats() {
  return Array.from(chatsMap.values())
    .filter(c => !isSelfJid(c.id))
    .sort((a, b) => {
      const tsA = a.timestamp || 0;
      const tsB = b.timestamp || 0;
      if (tsB !== tsA) return tsB - tsA;
      return (a.name || '').localeCompare(b.name || '');
    });
}

// Initialize Baileys WhatsApp Socket
async function initWhatsApp() {
  if (isInitializing) {
    console.log('[WhatsApp] Inicialização já em andamento, ignorando chamada duplicada.');
    return;
  }
  isInitializing = true;

  try {
    if (sock) {
      try {
        sock.ev.removeAllListeners();
        sock.end();
      } catch (e) {}
      sock = null;
    }

    connectionStatus = 'connecting';
    broadcast({ type: 'status', status: connectionStatus });

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1043857760], isLatest: true }));

    console.log(`[WhatsApp] Inicializando Baileys v${version.join('.')} (isLatest: ${isLatest})...`);

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.appropriate('Chrome'),
      syncFullHistory: true,
      generateHighQualityLinkPreview: true,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    isInitializing = false;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          currentQR = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 8,
            color: { dark: '#000000', light: '#ffffff' }
          });
          qrExpiresAt = Date.now() + 45000;
          connectionStatus = 'qr';
          broadcast({ type: 'qr', qr: currentQR, expiresAt: qrExpiresAt, status: connectionStatus });
          console.log('[WhatsApp] Novo QR Code gerado para conexão.');
        } catch (err) {
          console.error('[WhatsApp] Erro gerando QR dataURL:', err);
        }
      }

      if (connection === 'open') {
        connectionStatus = 'connected';
        currentQR = null;
        qrExpiresAt = null;
        const id = sock.user?.id || '';
        const phone = phoneFromJid(id);
        currentUser = {
          id,
          phone,
          name: sock.user?.name || `+${phone}`,
          lid: sock.user?.lid || ''
        };
        console.log(`[WhatsApp] Conectado com sucesso! Usuário: +${phone} (LID: ${currentUser.lid})`);
        broadcast({
          type: 'status',
          status: 'connected',
          user: currentUser
        });
        // Clean out any self JIDs that might have been added before
        for (const [jid] of chatsMap.entries()) {
          if (isSelfJid(jid)) chatsMap.delete(jid);
        }
        saveData();
        broadcast({ type: 'chats_loaded', chats: getSortedChats() });

        // Trigger contact sync and avatar download in background
        try {
          sock.resyncAppState(['critical_unblock_low', 'regular_high'], false).catch(() => {});
        } catch (e) {}
        setTimeout(syncAvatarsForChats, 1000);
        setTimeout(syncGroups, 1400);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'disconnected';
        currentQR = null;
        qrExpiresAt = null;
        console.log(`[WhatsApp] Conexão encerrada. Código: ${statusCode}. Reconectar: ${shouldReconnect}`);

        broadcast({
          type: 'status',
          status: 'disconnected',
          statusCode,
          shouldReconnect
        });

        if (shouldReconnect) {
          setTimeout(initWhatsApp, 2500);
        } else {
          console.log('[WhatsApp] Desconectado permanentemente (logout). Limpando sessão...');
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
          currentUser = null;
          chatsMap.clear();
          messagesMap.clear();
          saveData();
          setTimeout(initWhatsApp, 1500);
        }
      }
    });

    // Handle Historical Sync from Phone
    sock.ev.on('messaging-history.set', ({ chats: hChats, contacts: hContacts, messages: hMessages }) => {
      console.log(`[WhatsApp] Histórico do celular: ${hChats?.length || 0} conversas, ${hContacts?.length || 0} contatos, ${hMessages?.length || 0} mensagens.`);

      if (hContacts) {
        for (const contact of hContacts) {
          if (!contact.id || isSelfJid(contact.id)) continue;
          const name = contact.name || contact.notify || contact.verifiedName;
          const existing = chatsMap.get(contact.id);
          if (existing) {
            if (name) existing.name = name;
          } else {
            chatsMap.set(contact.id, {
              id: contact.id,
              name: name || formatJidName(contact.id),
              phone: phoneFromJid(contact.id),
              unreadCount: 0,
              time: '',
              timestamp: 0,
              lastMessage: '',
              isGroup: contact.id.endsWith('@g.us'),
              avatar: null
            });
          }
        }
      }

      if (hChats) {
        for (const c of hChats) {
          if (!c.id || isSelfJid(c.id)) continue;
          let chat = chatsMap.get(c.id);
          const ts = c.conversationTimestamp ? Number(c.conversationTimestamp) * 1000 : 0;
          if (!chat) {
            chat = {
              id: c.id,
              name: c.name || formatJidName(c.id),
              phone: phoneFromJid(c.id),
              unreadCount: c.unreadCount || 0,
              time: formatTimestamp(ts),
              timestamp: ts,
              lastMessage: '',
              isGroup: c.id.endsWith('@g.us'),
              avatar: null
            };
            chatsMap.set(c.id, chat);
          } else {
            if (c.name) chat.name = c.name;
            if (c.unreadCount) chat.unreadCount = c.unreadCount;
            if (ts > (chat.timestamp || 0)) {
              chat.timestamp = ts;
              chat.time = formatTimestamp(ts);
            }
          }
        }
      }

      if (hMessages) {
        for (const m of hMessages) {
          processMessage(m);
        }
      }

      saveData();
      broadcast({ type: 'chats_loaded', chats: getSortedChats() });
    });

    // Handle Contacts and Chats Sync
    sock.ev.on('contacts.upsert', (contacts) => {
      let changed = false;
      for (const contact of contacts) {
        if (!contact.id || isSelfJid(contact.id)) continue;
        const name = contact.name || contact.notify || contact.verifiedName;
        if (name) {
          const phone = (contact.phoneNumber || contact.id || '').replace(/\D/g, '');
          const entry = { id: contact.id, name, phone, lid: contact.lid };
          contactsMap.set(contact.id, entry);
          if (phone) contactsMap.set(phone, entry);
          if (contact.lid) contactsMap.set(contact.lid, entry);

          for (const chat of chatsMap.values()) {
            if (chat.id === contact.id || chat.altId === contact.id || (chat.phone && phone && chat.phone === phone) || (contact.lid && chat.id === contact.lid)) {
              chat.name = name;
              changed = true;
            }
          }
        }
      }
      saveContacts();
      if (changed) {
        saveData();
        broadcast({ type: 'chats_loaded', chats: getSortedChats() });
      }
    });

    sock.ev.on('contacts.update', (updates) => {
      let changed = false;
      for (const u of updates) {
        if (!u.id || isSelfJid(u.id)) continue;
        const name = u.name || u.notify;
        if (name) {
          const phone = u.id.replace(/\D/g, '');
          const entry = { id: u.id, name, phone };
          contactsMap.set(u.id, entry);
          if (phone) contactsMap.set(phone, entry);

          for (const chat of chatsMap.values()) {
            if (chat.id === u.id || chat.altId === u.id || (chat.phone && phone && chat.phone === phone)) {
              chat.name = name;
              changed = true;
            }
          }
        }
      }
      saveContacts();
      if (changed) {
        saveData();
        broadcast({ type: 'chats_loaded', chats: getSortedChats() });
      }
    });

    sock.ev.on('chats.upsert', (newChats) => {
      for (const c of newChats) {
        if (!c.id || isSelfJid(c.id)) continue;
        const existing = chatsMap.get(c.id);
        const ts = c.conversationTimestamp ? Number(c.conversationTimestamp) * 1000 : 0;
        if (!existing) {
          chatsMap.set(c.id, {
            id: c.id,
            name: c.name || formatJidName(c.id),
            phone: phoneFromJid(c.id),
            unreadCount: c.unreadCount || 0,
            time: formatTimestamp(ts),
            timestamp: ts,
            lastMessage: '',
            isGroup: c.id.endsWith('@g.us'),
            avatar: null
          });
        } else {
          if (c.name) existing.name = c.name;
          if (c.unreadCount) existing.unreadCount = c.unreadCount;
          if (ts > (existing.timestamp || 0)) {
            existing.timestamp = ts;
            existing.time = formatTimestamp(ts);
          }
        }
      }
      saveData();
      broadcast({ type: 'chats_loaded', chats: getSortedChats() });
    });

    sock.ev.on('chats.update', (updates) => {
      for (const u of updates) {
        if (!u.id || isSelfJid(u.id)) continue;
        const existing = chatsMap.get(u.id);
        if (existing) {
          if (u.name) existing.name = u.name;
          if (u.unreadCount !== undefined) existing.unreadCount = u.unreadCount;
        }
      }
      saveData();
      broadcast({ type: 'chats_loaded', chats: getSortedChats() });
    });

    sock.ev.on('groups.update', async (groupUpdates) => {
      let changed = false;
      for (const update of groupUpdates) {
        if (!update.id) continue;
        let chat = chatsMap.get(update.id);
        if (chat) {
          if (update.subject) chat.name = update.subject;
          if (update.desc) chat.description = update.desc;
          changed = true;
          broadcast({ type: 'chat_update', chat });
        }
      }
      if (changed) saveData();
    });

    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
      let chat = chatsMap.get(id);
      if (chat && sock) {
        try {
          const meta = await sock.groupMetadata(id);
          if (meta) {
            chat.participantCount = meta.participants ? meta.participants.length : 0;
            if (meta.subject) chat.name = meta.subject;
            saveData();
            broadcast({ type: 'chat_update', chat });
          }
        } catch (e) {}
      }
    });

    // Handle Incoming and Outgoing Messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      let changed = false;
      for (const msg of messages) {
        const res = processMessage(msg);
        if (res) {
          if (res.messageObj.type !== 'text') {
            try {
              const media = await downloadMediaMessage(msg, 'buffer', {});
              res.messageObj.mediaId = saveBridgeMedia(media, res.messageObj.mimeType || 'application/octet-stream', res.messageObj.id);
            } catch (error) { console.error('[WhatsApp] Falha ao baixar mídia:', error.message); }
            res.messageObj.mediaReady = true;
          }
          changed = true;
          broadcast({
            type: 'new_message',
            jid: res.chat.id,
            rawJid: res.rawJid,
            message: res.messageObj,
            chat: res.chat
          });
        }
      }
      if (changed) {
        saveData();
      }
    });

    sock.ev.on('messages.update', updates => {
      for (const { key, update } of updates || []) applyWhatsAppReceipt(key, update?.status);
    });
    sock.ev.on('message-receipt.update', updates => {
      for (const { key, receipt } of updates || []) {
        const status = receipt?.playedTimestamp ? 5 : receipt?.readTimestamp ? 4 : receipt?.receiptTimestamp ? 3 : null;
        if (status) applyWhatsAppReceipt(key, status);
      }
    });
  } catch (err) {
    isInitializing = false;
    console.error('[WhatsApp] Erro ao inicializar Baileys:', err);
    connectionStatus = 'disconnected';
    broadcast({ type: 'status', status: 'disconnected', error: err.message });
  }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  let reqUrl = decodeURIComponent(parsed.pathname);
  if (!['127.0.0.1:3000', 'localhost:3000'].includes(req.headers.host)) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Acesso local inválido' }));
    return;
  }

  // Local browser actions must originate from this site; the CRM bridge sends no Origin header.
  const allowedOrigins = new Set(['http://127.0.0.1:3000', 'http://localhost:3000']);
  if (req.method !== 'GET' && req.headers.origin && !allowedOrigins.has(req.headers.origin)) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Origem não permitida' }));
    return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API Endpoints ---
  if (reqUrl === '/api/leads' && req.method === 'POST') {
    const origin = req.headers.origin;
    if (origin && origin !== 'http://127.0.0.1:3000' && origin !== 'http://localhost:3000') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origem não permitida' }));
      return;
    }
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16 * 1024) throw new Error('Formulário grande demais');
        chunks.push(chunk);
      }
      const response = await fetch('http://127.0.0.1:3100/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: Buffer.concat(chunks), signal: AbortSignal.timeout(8000)
      });
      res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(await response.text());
    } catch (error) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'CRM indisponível. Tente novamente em instantes.' }));
    }
    return;
  }

  if (reqUrl === '/api/crm-feed' && req.method === 'GET') {
    if (req.headers.origin) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origem não permitida' }));
      return;
    }
    const since = Number(parsed.query.since || 0);
    const items = [];
    for (const [jid, messages] of messagesMap.entries()) {
      if (jid.endsWith('@g.us')) continue;
      const chat = chatsMap.get(jid);
      const phone = String(chat?.phone || resolvePhoneForJid(jid, chat?.altId) || '').replace(/\D/g, '');
      if (phone.length < 10 || phone.length > 15) continue;
      for (const message of messages) {
        if (!message.id || message.mediaReady === false || Number(message.timestamp || 0) < since) continue;
        items.push({
          phone, name: chat?.name || phone, avatarUrl: `http://127.0.0.1:${PORT}/api/avatar?id=${phone}`, externalId: message.id,
          timestamp: Number(message.timestamp || 0), direction: message.sender === 'out' ? 'out' : 'in',
          type: message.type || 'text', text: message.text || '',
          mimeType: message.mimeType || null, mediaId: message.mediaId || null,
          state: message.sender === 'out' ? (message.status || 'sent') : null
        });
      }
    }
    items.sort((a, b) => a.timestamp - b.timestamp);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ messages: items }));
    return;
  }

  if (reqUrl.startsWith('/api/crm-media/') && req.method === 'GET') {
    if (req.headers.origin) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origem não permitida' }));
      return;
    }
    const id = reqUrl.slice('/api/crm-media/'.length);
    if (!/^[a-f0-9]{64}\.(img|audio)$/.test(id)) {
      res.writeHead(404); res.end(); return;
    }
    const file = path.join(BRIDGE_MEDIA_DIR, id);
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const message = [...messagesMap.values()].flat().find(item => item.mediaId === id);
    res.writeHead(200, { 'Content-Type': message?.mimeType || (id.endsWith('.img') ? 'image/jpeg' : 'audio/ogg'), 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
    return;
  }
  if (reqUrl === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: connectionStatus,
      qr: currentQR,
      expiresAt: qrExpiresAt,
      user: currentUser
    }));
    return;
  }

  if (reqUrl === '/api/refresh-qr' && req.method === 'POST') {
    try {
      console.log('[WhatsApp] Forçando renovação de QR Code...');
      if (sock) {
        try { sock.end(); } catch (e) {}
      }
      currentQR = null;
      qrExpiresAt = null;
      connectionStatus = 'connecting';
      broadcast({ type: 'status', status: connectionStatus });
      setTimeout(initWhatsApp, 600);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (reqUrl === '/api/pairing-code' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { phone } = JSON.parse(body || '{}');
        const cleanPhone = (phone || '').replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 10) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Número de telefone inválido. Digite com DDD (ex: 11987654321 ou 5511987654321)' }));
          return;
        }

        let fullPhone = cleanPhone;
        if (!fullPhone.startsWith('55') && (fullPhone.length === 10 || fullPhone.length === 11)) {
          fullPhone = '55' + fullPhone;
        }

        if (!sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Cliente WhatsApp ainda inicializando. Aguarde 3 segundos e tente novamente.' }));
          return;
        }

        if (connectionStatus === 'connected') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'WhatsApp já está conectado com um aparelho!' }));
          return;
        }

        console.log(`[WhatsApp] Solicitando código de pareamento para: +${fullPhone}`);
        const code = await sock.requestPairingCode(fullPhone);
        console.log(`[WhatsApp] Código de pareamento recebido: ${code}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, code, phone: fullPhone }));
      } catch (err) {
        console.error('[WhatsApp] Erro ao gerar código de pareamento:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Erro ao gerar código de pareamento no WhatsApp.' }));
      }
    });
    return;
  }

  if (reqUrl === '/api/chats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      chats: getSortedChats()
    }));
    return;
  }

  if (reqUrl === '/api/messages') {
    const rawJid = parsed.query.jid;
    const canJid = getCanonicalJid(rawJid);
    const msgs = canJid && messagesMap.has(canJid) ? messagesMap.get(canJid) : [];
    // Mark as read locally
    if (canJid && chatsMap.has(canJid)) {
      const c = chatsMap.get(canJid);
      c.unreadCount = 0;
      broadcast({ type: 'chat_update', chat: c });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ messages: msgs }));
    return;
  }

  if (reqUrl === '/api/new-chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { phone, name } = JSON.parse(body || '{}');
        const clean = (phone || '').replace(/\D/g, '');
        if (!clean || clean.length < 10) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Número inválido. Digite com DDD (ex: 51999998888)' }));
          return;
        }
        let full = clean;
        if (!full.startsWith('55') && (full.length === 10 || full.length === 11)) {
          full = '55' + full;
        }
        const jid = `${full}@s.whatsapp.net`;
        let chat = chatsMap.get(jid);
        if (!chat) {
          for (const c of chatsMap.values()) {
            if (c.phone === full || c.altId === jid) {
              chat = c;
              break;
            }
          }
        }
        if (!chat) {
          chat = {
            id: jid,
            altId: null,
            name: (name && name.trim()) || formatDisplayName(full, null, jid),
            phone: full,
            unreadCount: 0,
            time: formatTimestamp(Date.now()),
            timestamp: Date.now(),
            lastMessage: '',
            isGroup: false,
            avatar: null
          };
          chatsMap.set(jid, chat);
          saveData();
          broadcast({ type: 'chats_loaded', chats: getSortedChats() });
        } else if (name && name.trim()) {
          chat.name = name.trim();
          saveData();
          broadcast({ type: 'chats_loaded', chats: getSortedChats() });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, chat }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (reqUrl === '/api/send-media' && req.method === 'POST') {
    if (req.headers.origin) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origem não permitida' }));
      return;
    }
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 23 * 1024 * 1024) throw new Error('Arquivo grande demais');
        chunks.push(chunk);
      }
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const jid = String(data.jid || '');
      const type = String(data.type || '');
      const mimeType = String(data.mimeType || '');
      if (!/^\d{10,15}@(s\.whatsapp\.net|lid)$/.test(jid) || !['image', 'audio'].includes(type) || !mimeType.startsWith(type + '/') || typeof data.data !== 'string') throw new Error('Dados de mídia inválidos');
      if (!sock || connectionStatus !== 'connected') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'WhatsApp não está conectado' }));
        return;
      }
      const buffer = Buffer.from(data.data, 'base64');
      if (!buffer.length || buffer.length > 16 * 1024 * 1024) throw new Error('Arquivo excede 16 MB');
      const content = type === 'image'
        ? { image: buffer, mimetype: mimeType, caption: String(data.text || '').slice(0, 1000) }
        : { audio: buffer, mimetype: mimeType, ptt: false };
      const sent = await sock.sendMessage(jid, content);
      const now = Date.now();
      const mediaId = saveBridgeMedia(buffer, mimeType, sent.key.id);
      const message = {
        id: sent.key.id, key: sent.key, sender: 'out', type, mimeType, mediaId, mediaReady: true,
        text: String(data.text || '').slice(0, 1000), time: formatTimestamp(now), timestamp: now, status: 'sent'
      };
      const canonical = getCanonicalJid(jid);
      const list = messagesMap.get(canonical) || [];
      if (!list.some(item => item.id === message.id)) list.push(message);
      messagesMap.set(canonical, list);
      const chat = chatsMap.get(canonical);
      if (chat) {
        chat.lastMessage = message.text || (type === 'image' ? 'Imagem enviada' : 'Áudio enviado');
        chat.time = message.time;
        chat.timestamp = now;
      }
      saveData();
      broadcast({ type: 'new_message', jid: canonical, rawJid: jid, message, chat });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (reqUrl === '/api/send' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const { jid, text } = data;

        if (!jid || !text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'jid e text são obrigatórios' }));
          return;
        }

        if (!sock || connectionStatus !== 'connected') {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'WhatsApp não está conectado' }));
          return;
        }

        console.log(`[WhatsApp] Enviando mensagem para ${jid}: "${text.trim().slice(0, 45)}"`);
        const sent = await sock.sendMessage(jid, { text: text.trim() });
        console.log(`[WhatsApp] Mensagem enviada com sucesso! ID: ${sent.key.id}`);

        const now = Date.now();
        const msgObj = {
          id: sent.key.id,
          key: sent.key,
          sender: 'out',
          text: text.trim(),
          time: formatTimestamp(now),
          timestamp: now,
          status: 'sent'
        };

        const canJid = getCanonicalJid(jid);

        if (!messagesMap.has(canJid)) messagesMap.set(canJid, []);
        const chatMsgs = messagesMap.get(canJid);
        if (!chatMsgs.some(m => m.id === msgObj.id)) {
          chatMsgs.push(msgObj);
        }

        let chat = chatsMap.get(canJid);
        if (chat) {
          chat.lastMessage = text.trim();
          chat.time = formatTimestamp(now);
          chat.timestamp = now;
        }

        saveData();

        broadcast({
          type: 'new_message',
          jid: canJid,
          rawJid: jid,
          message: msgObj,
          chat
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: msgObj }));
      } catch (err) {
        console.error('[WhatsApp] Erro enviando mensagem:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (reqUrl === '/api/disconnect' && req.method === 'POST') {
    try {
      if (sock) {
        await sock.logout().catch(() => {});
      }
      try {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      } catch (e) {}
      currentUser = null;
      chatsMap.clear();
      messagesMap.clear();
      connectionStatus = 'disconnected';
      currentQR = null;
      setTimeout(initWhatsApp, 1000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (reqUrl.startsWith('/api/avatar')) {
    const cleanId = (parsed.query.id || '').replace(/\D/g, '');
    if (!cleanId) {
      res.writeHead(400);
      res.end('Missing id');
      return;
    }

    const avatarFile = path.join(AVATAR_DIR, `${cleanId}.jpg`);
    if (fs.existsSync(avatarFile)) {
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(avatarFile).pipe(res);
      return;
    }

    // On-the-fly fetch if connected
    if (sock && connectionStatus === 'connected') {
      const targets = [`${cleanId}@s.whatsapp.net`];
      const chat = Array.from(chatsMap.values()).find(c => c.phone === cleanId);
      if (chat && chat.id) targets.push(chat.id);
      if (chat && chat.altId) targets.push(chat.altId);

      (async () => {
        let foundUrl = null;
        for (const t of targets) {
          try {
            foundUrl = await sock.profilePictureUrl(t, 'preview');
            if (foundUrl) break;
          } catch (e) {}
        }
        if (foundUrl) {
          const ok = await downloadAvatarFile(cleanId, foundUrl);
          if (ok && fs.existsSync(avatarFile)) {
            res.writeHead(200, {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*'
            });
            fs.createReadStream(avatarFile).pipe(res);
            return;
          }
        }
        res.writeHead(404);
        res.end('Avatar not found');
      })();
      return;
    }

    res.writeHead(404);
    res.end('Avatar not found');
    return;
  }

  if (reqUrl.startsWith('/api/group-info')) {
    const groupJid = parsed.query.jid;
    if (!groupJid || !groupJid.endsWith('@g.us')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'JID de grupo inválido' }));
      return;
    }

    try {
      let meta = null;
      if (sock && connectionStatus === 'connected') {
        meta = await sock.groupMetadata(groupJid).catch(() => null);
      }
      const chat = chatsMap.get(groupJid);

      if (meta) {
        const participants = (meta.participants || []).map(p => {
          const phone = resolvePhoneForJid(p.id) || phoneFromJid(p.id);
          const contact = phone ? contactsMap.get(phone) : (contactsMap.get(p.id) || null);
          const name = (contact && (contact.name || contact.notify)) || (phone ? formatDisplayPhone(phone) : p.id);
          return {
            id: p.id,
            phone,
            name,
            admin: p.admin || null
          };
        });

        if (chat) {
          if (meta.subject) chat.name = meta.subject;
          chat.participantCount = participants.length;
          if (meta.desc) chat.description = meta.desc;
          saveData();
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: groupJid,
          subject: meta.subject,
          description: meta.desc || '',
          owner: meta.owner,
          creation: meta.creation,
          participantCount: participants.length,
          participants
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: groupJid,
        subject: chat?.name || 'Grupo',
        description: chat?.description || '',
        participantCount: chat?.participantCount || 0,
        participants: []
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (reqUrl === '/api/sync-contacts' && req.method === 'POST') {
    if (!sock || connectionStatus !== 'connected') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'WhatsApp não está conectado' }));
      return;
    }
    try {
      console.log('[WhatsApp] Sincronização manual de contatos, grupos e fotos solicitada...');
      await sock.resyncAppState(['critical_unblock_low', 'regular_high'], false);
      syncAvatarsForChats();
      await syncGroups();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: contactsMap.size, groups: Array.from(chatsMap.values()).filter(c => c.isGroup).length }));
    } catch (err) {
      console.error('[WhatsApp] Erro na sincronização:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // --- Static Files Serving ---
  if (reqUrl === '/' || reqUrl === '') reqUrl = '/index.html';
  if (reqUrl === '/crm' || reqUrl === '/crm/') reqUrl = '/crm.html';
  if (reqUrl === '/costura' || reqUrl === '/costura/') reqUrl = '/costura.html';
  const allowedStatic = reqUrl === '/index.html' || reqUrl === '/crm.html' || reqUrl === '/costura.html' ||
    (reqUrl.startsWith('/assets/') && !reqUrl.split('/').some(part => part === '..' || part.startsWith('.')));
  if (!allowedStatic) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const filePath = path.join(__dirname, reqUrl);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    // HTTP 206 Partial Content para streaming e scrubbing de vídeo
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });
      const videoStream = fs.createReadStream(filePath, { start, end });
      videoStream.on('error', () => res.destroy());
      res.on('error', () => videoStream.destroy());
      videoStream.pipe(res);
      return;
    }

    const compressible = ['.html', '.css', '.js', '.svg', '.json', '.glb'].includes(ext);
    const acceptedEncodings = (req.headers['accept-encoding'] || '').split(',');
    const encodingQuality = name => {
      const token = acceptedEncodings.find(part => part.trim().split(';', 1)[0].toLowerCase() === name);
      if (!token) return 0;
      const quality = token.split(';').slice(1).find(part => /^\s*q\s*=/.test(part));
      return quality ? Math.max(0, Math.min(1, Number(quality.split('=')[1]))) : 1;
    };
    const brQuality = encodingQuality('br');
    const gzipQuality = encodingQuality('gzip');
    const useBrotli = compressible && brQuality > 0 && brQuality >= gzipQuality;
    const useGzip = compressible && !useBrotli && gzipQuality > 0;
    const encodingTag = useBrotli ? '-br' : useGzip ? '-gz' : '';
    const etag = `"${stats.size.toString(16)}-${Math.trunc(stats.mtimeMs).toString(16)}${encodingTag}"`;
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' || ext === '.js' ? 'no-cache' : 'public, max-age=86400',
      'ETag': etag,
      'Access-Control-Allow-Origin': '*'
    };
    if (compressible) headers['Vary'] = 'Accept-Encoding';
    if (useBrotli) headers['Content-Encoding'] = 'br';
    else if (useGzip) headers['Content-Encoding'] = 'gzip';
    else headers['Content-Length'] = stats.size;

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      res.end();
      return;
    }

    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.destroy());
    res.on('error', () => stream.destroy());
    if (useBrotli) {
      stream.pipe(zlib.createBrotliCompress({
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 }
      })).pipe(res);
    } else if (useGzip) stream.pipe(zlib.createGzip({ level: 6 })).pipe(res);
    else stream.pipe(res);
  });
});

// WebSocket Server attached to HTTP Server
const wss = new WebSocket.Server({
  server, path: '/ws',
  verifyClient: ({ origin, req }) => ['127.0.0.1:3000', 'localhost:3000'].includes(req.headers.host) &&
    (!origin || origin === 'http://127.0.0.1:3000' || origin === 'http://localhost:3000')
});

wss.on('connection', (ws) => {
  wsClients.add(ws);

  // Send current status immediately
  ws.send(JSON.stringify({
    type: 'status',
    status: connectionStatus,
    qr: currentQR,
    expiresAt: qrExpiresAt,
    user: currentUser
  }));

  // Send current chats list
  ws.send(JSON.stringify({
    type: 'chats_loaded',
    chats: getSortedChats()
  }));

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.action === 'get_messages' && data.jid) {
        const canJid = getCanonicalJid(data.jid);
        const msgs = messagesMap.get(canJid) || [];
        if (chatsMap.has(canJid)) {
          chatsMap.get(canJid).unreadCount = 0;
        }
        ws.send(JSON.stringify({
          type: 'messages_loaded',
          jid: data.jid,
          messages: msgs
        }));
      } else if (data.action === 'send_message' && data.jid && data.text) {
        if (!sock || connectionStatus !== 'connected') {
          ws.send(JSON.stringify({ type: 'error', message: 'WhatsApp desconectado' }));
          return;
        }
        await sock.sendMessage(data.jid, { text: data.text.trim() });
      } else if (data.action === 'disconnect') {
        if (sock) await sock.logout().catch(() => {});
        try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (e) {}
        currentUser = null;
        chatsMap.clear();
        messagesMap.clear();
        setTimeout(initWhatsApp, 1000);
      }
    } catch (err) {
      console.error('Erro processando mensagem WS:', err.message);
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason?.message || reason);
});

// Start Server & Baileys
server.listen(PORT, '127.0.0.1', () => {
  console.log('==================================================');
  console.log(' TekMak Omnichannel Hub com Baileys WhatsApp');
  console.log('==================================================');
  console.log(` Servidor rodando em: http://127.0.0.1:${PORT}`);
  console.log(` Interface CRM:      http://127.0.0.1:${PORT}/crm`);
  console.log(` WebSocket:          ws://127.0.0.1:${PORT}/ws`);
  console.log('==================================================');

  loadData();
  initWhatsApp();
});

