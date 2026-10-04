const $ = id => document.getElementById(id);
const app = document.querySelector('.app-shell');
let snapshot = { contacts: [], conversations: [], messages: {}, leads: [], settings: {} };
let selectedId = null;
let selectedLeadId = null;
let activeView = 'inbox';
let waStatus = { status: 'disconnected' };
let filter = 'all';
let selectedFile = null;
let busy = false;
let lastSignature = '';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const DEFAULT_AVATAR = '/default-avatar.png';
const avatarMarkup = (name, url) => `${esc(initials(name))}<img class="${url ? 'profile-avatar' : 'default-avatar'}" src="${esc(url || DEFAULT_AVATAR)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
function watchAvatarErrors(root) {
  root.querySelectorAll('.avatar img').forEach(image => image.addEventListener('error', () => {
    if (image.classList.contains('default-avatar')) image.remove();
    else { image.src = DEFAULT_AVATAR; image.className = 'default-avatar'; }
  }));
}
const nameOf = conversation => snapshot.contacts.find(c => c.id === conversation.contactId)?.name || conversation.id;
const contactOf = conversation => snapshot.contacts.find(c => c.id === conversation.contactId);
const channelName = value => value === 'whatsapp' ? 'WhatsApp' : 'Instagram';
const statusName = value => ({ pendente: 'Pendente', em_atendimento: 'Em atendimento', encerrada: 'Encerrada' }[value] || value);
const relativeTime = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
const fullTime = value => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

async function api(route, method = 'GET', data) {
  const response = await fetch(route, { method, headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a ação');
  return result;
}
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('toast').classList.add('hidden'), 3500);
}
async function refresh(force = false) {
  try {
    const next = await api('/api/state');
    const signature = JSON.stringify([next.revision, next.conversations.length, next.leads?.length || 0, next.settings.instagram?.connectedAt, next.settings.whatsapp?.status]);
    snapshot = next;
    if (force || signature !== lastSignature) {
      lastSignature = signature;
      renderList();
      renderChat();
      renderConnections();
      renderLeads();
    }
  } catch (error) { if (force) toast(error.message); }
}
function filteredConversations() {
  const term = $('search').value.trim().toLowerCase();
  return snapshot.conversations.filter(conversation => {
    const matchesFilter = filter === 'all' || conversation.status === filter || conversation.channel === filter;
    const haystack = `${nameOf(conversation)} ${conversation.lastMessage || ''} ${contactOf(conversation)?.remoteId || ''}`.toLowerCase();
    return matchesFilter && (!term || haystack.includes(term));
  });
}
function renderList() {
  const items = filteredConversations();
  $('conversationCount').textContent = String(snapshot.conversations.length);
  $('conversationList').innerHTML = items.length ? items.map(conversation => {
    const name = nameOf(conversation);
    const ig = conversation.channel === 'instagram';
    return `<button class="conversation-row ${conversation.id === selectedId ? 'selected' : ''}" data-id="${esc(conversation.id)}" aria-label="Abrir conversa com ${esc(name)}">
      <span class="avatar ${ig ? 'instagram' : ''}">${avatarMarkup(name, contactOf(conversation)?.avatarUrl)}</span>
      <span class="conversation-main"><span class="conversation-top"><strong>${esc(name)}</strong><time>${esc(relativeTime(conversation.updatedAt))}</time></span>
      <span class="conversation-preview">${esc(conversation.lastMessage || 'Nova conversa')}</span>
      <span class="conversation-meta"><span class="channel-mini ${ig ? 'instagram' : ''}">${channelName(conversation.channel)}</span><span class="status-mini ${esc(conversation.status)}">${esc(statusName(conversation.status))}</span></span></span></button>`;
  }).join('') : `<div class="list-empty"><strong>${snapshot.conversations.length ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</strong>${snapshot.conversations.length ? 'Tente outro filtro ou busca.' : 'As mensagens novas aparecerão aqui depois que os canais forem conectados.'}</div>`;
  watchAvatarErrors($('conversationList'));
  document.querySelectorAll('.conversation-row').forEach(button => button.addEventListener('click', () => selectConversation(button.dataset.id)));
}
function renderConnections() {
  const wa = snapshot.settings.whatsapp || {};
  const ig = snapshot.settings.instagram || {};
  $('channelFooter').innerHTML = `<span><i class="${wa.status === 'connected' ? 'on' : ''}"></i> WhatsApp</span><span><i class="${ig.connectedAt ? 'on' : ''}"></i> Instagram</span>`;
}
function selectConversation(id) {
  selectedId = id;
  app.classList.add('mobile-chat');
  renderList();
  renderChat(true);
}
function messageHtml(message) {
  let content = '';
  if (message.mediaId && (message.type === 'image' || message.type === 'sticker')) content = `<img class="${message.type === 'sticker' ? 'sticker-media' : ''}" src="/api/media/${encodeURIComponent(message.mediaId)}" alt="${message.type === 'sticker' ? 'Figurinha da conversa' : 'Imagem da conversa'}" loading="lazy">`;
  else if (message.mediaId && message.type === 'audio') content = `<audio controls preload="none" src="/api/media/${encodeURIComponent(message.mediaId)}">Áudio da conversa</audio>`;
  else if (message.type !== 'text') content = `<span class="media-fallback">${message.type === 'sticker' ? 'Figurinha indisponível' : message.type === 'image' ? 'Imagem indisponível' : 'Áudio indisponível'}</span>`;
  if (message.text && !(message.type === 'sticker' && message.mediaId)) content += `<p>${esc(message.text)}</p>`;
  const state = message.state || 'sent';
  const receipt = message.direction === 'out' ? `<span class="message-receipt ${state === 'read' ? 'read' : state === 'delivered' ? 'delivered' : 'sent'}" title="${state === 'read' ? 'Visualizada' : state === 'delivered' ? 'Entregue' : 'Enviada'}" aria-label="${state === 'read' ? 'Visualizada' : state === 'delivered' ? 'Entregue' : 'Enviada'}">${state === 'read' || state === 'delivered' ? '✓✓' : '✓'}</span>` : '';
  return `<article class="message ${message.direction === 'out' ? 'out' : 'in'} ${message.type === 'sticker' ? 'sticker-message' : ''}">${content}<div class="message-meta">${esc(fullTime(message.createdAt))} ${receipt}</div></article>`;
}
function renderChat(scroll = false) {
  const conversation = snapshot.conversations.find(c => c.id === selectedId);
  if (!conversation) {
    selectedId = null;
    $('emptyChat').classList.remove('hidden');
    $('chatContent').classList.add('hidden');
    $('detailColumn').classList.add('hidden');
    app.classList.remove('detail-open');
    return;
  }
  const contact = contactOf(conversation);
  const name = contact?.name || conversation.id;
  const ig = conversation.channel === 'instagram';
  $('emptyChat').classList.add('hidden');
  $('chatContent').classList.remove('hidden');
    $('chatAvatar').innerHTML = avatarMarkup(name, contact?.avatarUrl);
  watchAvatarErrors($('chatAvatar'));
  $('chatAvatar').classList.toggle('instagram', ig);
  $('chatName').textContent = name;
  $('chatSubline').textContent = contact?.remoteId || '';
  $('chatChannel').textContent = channelName(conversation.channel);
  $('chatChannel').classList.toggle('instagram', ig);
  $('statusSelect').value = conversation.status;
  $('mobileStatusSelect').value = conversation.status;
  const list = $('messageList');
  const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 100;
  const messages = snapshot.messages[conversation.id] || [];
  let previousDate = '';
  list.innerHTML = messages.map(message => {
    const date = new Date(message.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const divider = date !== previousDate ? `<div class="date-divider">${esc(date)}</div>` : '';
    previousDate = date;
    return divider + messageHtml(message);
  }).join('');
  if (scroll || nearBottom) list.scrollTop = list.scrollHeight;
  if (!$('detailColumn').classList.contains('hidden')) renderDetail();
  const lastInbound = messages.filter(m => m.direction === 'in').at(-1);
  const hours = lastInbound ? (Date.now() - new Date(lastInbound.createdAt).getTime()) / 3600000 : 0;
  $('composerHint').textContent = 'Enter envia · Shift + Enter quebra a linha';
}
function renderDetail() {
  const conversation = snapshot.conversations.find(c => c.id === selectedId);
  const contact = conversation && contactOf(conversation);
  if (!contact) return;
    $('detailAvatar').innerHTML = avatarMarkup(contact.name, contact.avatarUrl);
  watchAvatarErrors($('detailAvatar'));
  $('detailAvatar').classList.toggle('instagram', contact.channel === 'instagram');
  $('detailName').textContent = contact.name;
  $('detailHandle').textContent = `${channelName(contact.channel)} · ${contact.remoteId}`;
  if (document.activeElement !== $('contactName')) $('contactName').value = contact.name;
  if (document.activeElement !== $('contactTags')) $('contactTags').value = (contact.tags || []).join(', ');
  if (document.activeElement !== $('contactNotes')) $('contactNotes').value = contact.notes || '';
}
function openDetail() { $('detailColumn').classList.remove('hidden'); app.classList.add('detail-open'); renderDetail(); }
function closeDetail() { $('detailColumn').classList.add('hidden'); app.classList.remove('detail-open'); }
function fillSettings() {
  const settings = snapshot.settings || {};
  $('publicUrl').value = settings.publicUrl || '';
  $('graphVersion').value = settings.graphVersion || 'v23.0';
  $('igApp').value = settings.instagram?.appId || '';
  $('igVerify').value = settings.instagram?.verifyToken || '';
  $('igUser').value = settings.instagram?.userId || '';
  for (const id of ['igSecret', 'igToken']) $(id).value = '';
  const base = settings.publicUrl || 'https://seu-tunel.exemplo';
  $('igEndpoint').textContent = `${base}/webhooks/instagram`;
  $('igState').textContent = settings.instagram?.connectedAt ? `Configurado · ${settings.instagram.label || 'aguardando mensagens'}` : 'Não configurado';
  $('igState').classList.toggle('on', !!settings.instagram?.connectedAt);
  $('publicDot').classList.toggle('on', !!settings.publicUrl);
  renderWaStatus();
}
function renderWaStatus() {
  const connected = waStatus.status === 'connected';
  $('waState').textContent = connected ? `Conectado${waStatus.user?.name ? ` · ${waStatus.user.name}` : ''}` : waStatus.status === 'connecting' ? 'Conectando…' : 'Aguardando conexão';
  $('waState').classList.toggle('on', connected);
  $('waDescription').textContent = connected ? 'Este WhatsApp está conectado pelo Baileys e pronto para enviar mensagens pelo CRM.' : 'Conecte o WhatsApp pelo QR Code. As mensagens enviadas pelo CRM usam a sessão vinculada neste computador.';
  const qr = waStatus.qr || '';
  $('waQrWrap').classList.toggle('hidden', connected || !qr);
  if (qr) $('waQr').src = qr;
  $('disconnectWa').classList.toggle('hidden', !connected);
}
async function refreshWaStatus(showError = false) {
  try { waStatus = await api('/api/whatsapp/status'); renderWaStatus(); }
  catch (error) { if (showError) settingsFeedback(error.message, true); }
}function settingsFeedback(message, error = false) {
  $('settingsFeedback').textContent = message;
  $('settingsFeedback').classList.toggle('error', error);
}
function openSettings() { fillSettings(); settingsFeedback(''); $('settingsOverlay').classList.remove('hidden'); }
function closeSettings() { $('settingsOverlay').classList.add('hidden'); }
async function settingsAction(operation, success) {
  try { await operation(); await refresh(true); fillSettings(); settingsFeedback(success); }
  catch (error) { settingsFeedback(error.message, true); }
}
async function filePayload(file) {
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { fileName: file.name, mimeType: file.type, data };
}
function selectFile(file) {
  if (!file) return;
  if (!/^(image|audio)\//.test(file.type) || file.size > 16 * 1024 * 1024) {
    $('composerError').textContent = 'Escolha uma imagem ou um áudio de até 16 MB.';
    $('composerError').classList.remove('hidden');
    return;
  }
  selectedFile = file;
  $('composerError').classList.add('hidden');
  $('attachmentPreview').innerHTML = `<span>${file.type.startsWith('image/') ? 'Imagem' : 'Áudio'}: ${esc(file.name)}</span><button type="button" aria-label="Remover anexo">×</button>`;
  $('attachmentPreview').classList.remove('hidden');
  $('attachmentPreview').querySelector('button').onclick = clearFile;
}
function clearFile() { selectedFile = null; $('fileInput').value = ''; $('attachmentPreview').classList.add('hidden'); }
async function submitMessage(event) {
  event.preventDefault();
  if (busy || !selectedId) return;
  const text = $('messageInput').value.trim();
  if (!text && !selectedFile) return;
  busy = true;
  $('sendButton').disabled = true;
  $('composerError').classList.add('hidden');
  try {
    const type = selectedFile ? selectedFile.type.split('/')[0] : 'text';
    const payload = { conversationId: selectedId, type, text, ...(selectedFile ? await filePayload(selectedFile) : {}) };
    await api('/api/send', 'POST', payload);
    $('messageInput').value = '';
    clearFile();
    await refresh(true);
    $('messageInput').focus();
  } catch (error) {
    $('composerError').textContent = error.message;
    $('composerError').classList.remove('hidden');
  } finally { busy = false; $('sendButton').disabled = false; }
}

function leadMatches(lead, term) { return `${lead.name || ''} ${lead.whatsapp || ''} ${lead.task || ''} ${lead.machineInterest || ''}`.toLowerCase().includes(term); }
function renderLeads() {
  const leads = snapshot.leads || [];
  const term = $('leadSearch').value.trim().toLowerCase();
  const visible = term ? leads.filter(lead => leadMatches(lead, term)) : leads;
  $('leadCount').textContent = String(leads.length);
  $('leadList').innerHTML = visible.length ? visible.map(lead => `<button class="lead-row ${lead.id === selectedLeadId ? 'selected' : ''}" data-lead-id="${esc(lead.id)}"><span class="avatar">${avatarMarkup(lead.name, lead.avatarUrl)}</span><span class="conversation-main"><span class="conversation-top"><strong>${esc(lead.name || 'Sem nome')}</strong><time>${esc(relativeTime(lead.createdAt))}</time></span><span class="conversation-preview">${esc(lead.task || 'Novo interesse')}</span><span class="lead-phone">${esc(lead.whatsapp || '')}</span></span></button>`).join('') : `<div class="list-empty"><strong>${leads.length ? 'Nenhum lead encontrado' : 'Nenhum lead ainda'}</strong>${leads.length ? 'Tente outra busca.' : 'Os formulários recebidos aparecerão aqui.'}</div>`;
  watchAvatarErrors($( 'leadList' ));
  document.querySelectorAll('.lead-row').forEach(button => button.addEventListener('click', () => selectLead(button.dataset.leadId)));
  renderLeadDetail();
}
function selectLead(id) { selectedLeadId = id; $('leadMessage').value = ''; $('leadFeedback').textContent = ''; $('leadsView').classList.add('lead-selected'); renderLeads(); }
function renderLeadDetail() {
  const lead = (snapshot.leads || []).find(item => item.id === selectedLeadId);
  $('leadEmpty').classList.toggle('hidden', !!lead); $('leadDetail').classList.toggle('hidden', !lead);
  if (!lead) return;
  $('leadName').textContent = lead.name || 'Sem nome'; $('leadWhatsapp').textContent = lead.whatsapp || 'Telefone não informado';
  $('leadCall').href = 'tel:+' + String(lead.whatsapp || '').replace(/\D/g, '');
  $('leadTask').textContent = lead.task || 'Não informado'; $('leadInvestment').textContent = lead.investmentBand || 'Não informado';
  $('leadMachine').textContent = lead.machineInterest || 'Não especificada';
  $('leadCreated').textContent = new Date(lead.createdAt).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
}
function showLeads() { activeView = 'leads'; closeSettings(); closeDetail(); app.classList.add('leads-active'); $('leadsView').classList.remove('hidden'); $('inboxNav').classList.remove('active'); $('leadsNav').classList.add('active'); renderLeads(); }
function showInbox() { activeView = 'inbox'; app.classList.remove('leads-active'); $('leadsView').classList.add('hidden'); $('inboxNav').classList.add('active'); $('leadsNav').classList.remove('active'); }
async function sendLeadMessage(event) {
  event.preventDefault(); const lead = (snapshot.leads || []).find(item => item.id === selectedLeadId); const text = $('leadMessage').value.trim(); if (!lead || !text) return;
  $('leadSend').disabled = true; $('leadFeedback').textContent = 'Enviando…';
  try { const result = await api(`/api/leads/${encodeURIComponent(lead.id)}/send`, 'POST', { text }); $('leadMessage').value = ''; $('leadFeedback').textContent = 'Mensagem enviada pelo WhatsApp.'; await refresh(true); const conversationId = result.conversationId || lead.conversationId; if (conversationId) { showInbox(); selectConversation(conversationId); } }
  catch (error) { $('leadFeedback').textContent = error.message; }
  finally { $('leadSend').disabled = false; }
}
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button));
  renderList();
}));
$('search').addEventListener('input', renderList);
$('leadSearch').addEventListener('input', renderLeads);
$('leadComposer').addEventListener('submit', sendLeadMessage);
$('leadsNav').addEventListener('click', showLeads);
$('leadBack').addEventListener('click', () => $('leadsView').classList.remove('lead-selected'));
$('detailToggle').addEventListener('click', () => $('detailColumn').classList.contains('hidden') ? openDetail() : closeDetail());
$('detailClose').addEventListener('click', closeDetail);
$('backButton').addEventListener('click', () => app.classList.remove('mobile-chat'));
$('settingsNav').addEventListener('click', () => { showInbox(); openSettings(); refreshWaStatus(); });
$('emptySetup').addEventListener('click', () => { openSettings(); refreshWaStatus(); });
$('settingsClose').addEventListener('click', closeSettings);
$('settingsBackdrop').addEventListener('click', closeSettings);
$('inboxNav').addEventListener('click', () => { closeSettings(); showInbox(); app.classList.remove('mobile-chat'); });
async function changeStatus(event) {
  try { await api(`/api/conversations/${encodeURIComponent(selectedId)}/status`, 'PUT', { status: event.target.value }); await refresh(true); }
  catch (error) { toast(error.message); await refresh(true); }
}
$('statusSelect').addEventListener('change', changeStatus);
$('mobileStatusSelect').addEventListener('change', changeStatus);
$('saveContact').addEventListener('click', async () => {
  const conversation = snapshot.conversations.find(c => c.id === selectedId);
  if (!conversation) return;
  try {
    await api(`/api/contacts/${encodeURIComponent(conversation.contactId)}`, 'PUT', {
      name: $('contactName').value, notes: $('contactNotes').value,
      tags: $('contactTags').value.split(',').map(x => x.trim()).filter(Boolean)
    });
    await refresh(true);
    $('saveFeedback').textContent = 'Contato salvo.';
  } catch (error) { $('saveFeedback').textContent = error.message; }
});
$('composer').addEventListener('submit', submitMessage);
$('messageInput').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('composer').requestSubmit(); }
});
$('fileInput').addEventListener('change', event => selectFile(event.target.files[0]));
$('saveGeneral').addEventListener('click', () => settingsAction(() => api('/api/settings', 'PUT', {
  publicUrl: $('publicUrl').value, graphVersion: $('graphVersion').value
}), 'Servidor salvo.'));
$('refreshWa').addEventListener('click', () => settingsAction(() => api('/api/whatsapp/refresh', 'POST', {}), 'QR Code atualizado.').then(() => refreshWaStatus(true)));
$('disconnectWa').addEventListener('click', () => settingsAction(() => api('/api/whatsapp/disconnect', 'POST', {}), 'WhatsApp desconectado.').then(() => refreshWaStatus(true)));

$('saveIg').addEventListener('click', () => settingsAction(() => api('/api/settings', 'PUT', { instagram: {
  appId: $('igApp').value, appSecret: $('igSecret').value, verifyToken: $('igVerify').value,
  userId: $('igUser').value, accessToken: $('igToken').value
} }), 'Instagram salvo. Autorize a conta e configure o webhook na Meta.'));
$('testIg').addEventListener('click', () => settingsAction(() => api('/api/test-connection', 'POST', { channel: 'instagram' }), 'Instagram conectado à API da Meta.'));
$('authorizeIg').addEventListener('click', async () => {
  try { const result = await api('/api/instagram/oauth-start', 'POST', {}); window.location.href = result.url; }
  catch (error) { settingsFeedback(error.message, true); }
});
window.addEventListener('keydown', event => { if (event.key === 'Escape') { closeSettings(); closeDetail(); } });

const params = new URLSearchParams(location.search);
if (params.has('connected')) toast('Instagram autorizado. Configure o webhook para receber mensagens.');
if (params.has('oauth_error')) toast(`Falha na autorização: ${params.get('oauth_error')}`);
const showSettingsOnLoad = params.has('settings');
const initialConversation = params.get('conversation');
const initialView = params.get('view');
if (params.size) history.replaceState(null, '', '/');
refresh(true).then(() => { if (initialView === 'leads') showLeads(); if (initialConversation) selectConversation(initialConversation); if (showSettingsOnLoad) { openSettings(); refreshWaStatus(); } });
setInterval(() => { refresh(); if (!$('settingsOverlay').classList.contains('hidden')) refreshWaStatus(); }, 3500);
