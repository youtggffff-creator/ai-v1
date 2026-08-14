// ============================================
// i18n — static UI text, EN default, KM optional
// ============================================
const I18N = {
  en: {
    signIn: 'Sign In', signUp: 'Sign Up',
    authTag: 'Your personal AI, powered up.',
    founderCredit: 'Founder: KHINSOVANNOREAKYOUT',
    toolsLabel: 'Tools', toolDoc: 'Write Document', toolSearch: 'Web Search',
    toolUpload: 'Upload File', toolCalc: 'Calculator', toolRemember: 'Remember This',
    memoryLabel: 'What Uchiro Remembers', memoryEmpty: 'Nothing yet — Uchiro will remember what you tell it',
    filesLabel: 'Generated Files', filesEmpty: 'No files yet',
    clearBtn: '🗑 Clear Conversation',
    connecting: 'Connecting...', ready: 'Uchiro is ready', offline: 'Server not running',
    welcomeMsg: `Hey, I'm <strong>Uchiro</strong> — your personal AI assistant. I can search the web, read images and files, write documents, do math, and remember things about you.`,
    inputPlaceholder: 'Ask Uchiro anything...', sendBtn: 'Send',
    thinking: 'Uchiro is thinking...', searched: '🔍 Searched the web',
    download: '⬇ Download File', remembered: '🧠 Remembered:',
    clearConfirm: 'Clear the entire conversation?', clearedMsg: 'Conversation cleared. Fresh start!',
    connError: '❌ Could not connect to the server.',
  },
  km: {
    signIn: 'ចូលគណនី', signUp: 'បង្កើតគណនី',
    authTag: 'AI ផ្ទាល់ខ្លួនរបស់អ្នក — ថាមពលពេញលេញ។',
    founderCredit: 'អ្នកបង្កើត៖ KHINSOVANNOREAKYOUT',
    toolsLabel: 'ឧបករណ៍', toolDoc: 'សរសេរ Document', toolSearch: 'ស្វែងរក Internet',
    toolUpload: 'ភ្ជាប់ File', toolCalc: 'គណនា', toolRemember: 'ចាំរឿងនេះ',
    memoryLabel: 'អ្វីដែល Uchiro ចាំ', memoryEmpty: 'មិនទាន់មានអ្វីទេ — Uchiro នឹងចាំពេលអ្នកប្រាប់',
    filesLabel: 'File ដែលបានបង្កើត', filesEmpty: 'មិនទាន់មាន file ទេ',
    clearBtn: '🗑 សម្អាតការសន្ទនា',
    connecting: 'កំពុងភ្ជាប់...', ready: 'Uchiro ត្រៀមរួចរាល់', offline: 'Server មិនដំណើរការ',
    welcomeMsg: `សួស្តី! ខ្ញុំឈ្មោះ <strong>Uchiro</strong> — ជំនួយការ AI ផ្ទាល់ខ្លួនរបស់អ្នក។ ខ្ញុំអាចស្វែងរក internet, មើលរូបភាព/file, សរសេរ document, គណនាលេខ, និងចាំរឿងអំពីអ្នក។`,
    inputPlaceholder: 'សួរ Uchiro អ្វីមួយ...', sendBtn: 'ផ្ញើ',
    thinking: 'Uchiro កំពុងគិត...', searched: '🔍 បានស្វែងរកលើ Internet',
    download: '⬇ ទាញយក File', remembered: '🧠 ចាំរួច៖',
    clearConfirm: 'សម្អាតការសន្ទនាទាំងអស់?', clearedMsg: 'ការសន្ទនាត្រូវបានសម្អាតរួចរាល់។ ចាប់ផ្តើមថ្មី!',
    connError: '❌ មិនអាចភ្ជាប់ទៅ server បានទេ។',
  },
};

let lang = localStorage.getItem('uchiro_lang') || 'en';
function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.en[key]; }

function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  // Auth submit button label follows active tab, not generic i18n key
  authSubmit.textContent = t(isSignupMode ? 'signUp' : 'signIn');
}

// ============================================
// ELEMENT REFS
// ============================================
const authScreen = document.getElementById('authScreen');
const appShell = document.getElementById('appShell');
const authForm = document.getElementById('authForm');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmit = document.getElementById('authSubmit');
const authError = document.getElementById('authError');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const langToggle = document.getElementById('langToggle');

const chat = document.getElementById('chat');
const form = document.getElementById('form');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');
const statusDot = document.getElementById('statusDot');
const clearBtn = document.getElementById('clearBtn');
const fileInput = document.getElementById('imageInput');
const filePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const previewLabel = document.getElementById('previewLabel');
const removeFileBtn = document.getElementById('removeImage');
const sunMark = document.getElementById('sunMark');
const memoryList = document.getElementById('memoryList');
const memCount = document.getElementById('memCount');
const filesList = document.getElementById('filesList');
const fileCount = document.getElementById('fileCount');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const attachChip = document.getElementById('attachChip');

let isSignupMode = false;
let pendingAttachment = null;
let authToken = localStorage.getItem('uchiro_token');

// ============================================
// LANGUAGE TOGGLE
// ============================================
langToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.lang-btn');
  if (!btn) return;
  lang = btn.dataset.lang;
  localStorage.setItem('uchiro_lang', lang);
  applyLanguage();
});

// ============================================
// AUTH FLOW
// ============================================
tabLogin.addEventListener('click', () => switchAuthMode(false));
tabSignup.addEventListener('click', () => switchAuthMode(true));

function switchAuthMode(signup) {
  isSignupMode = signup;
  tabLogin.classList.toggle('active', !signup);
  tabSignup.classList.toggle('active', signup);
  authName.style.display = signup ? 'block' : 'none';
  authError.textContent = '';
  applyLanguage();
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  const endpoint = isSignupMode ? '/api/auth/signup' : '/api/auth/login';
  const body = { email: authEmail.value.trim(), password: authPassword.value };
  if (isSignupMode) body.name = authName.value.trim();

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      authError.textContent = data.error || 'Something went wrong';
      return;
    }
    authToken = data.token;
    localStorage.setItem('uchiro_token', authToken);
    localStorage.setItem('uchiro_user_email', data.user.email);
    enterApp(data.user.email);
  } catch (err) {
    authError.textContent = t('connError');
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('uchiro_token');
  localStorage.removeItem('uchiro_user_email');
  authToken = null;
  appShell.style.display = 'none';
  authScreen.style.display = 'flex';
  chat.innerHTML = '';
});

function enterApp(email) {
  authScreen.style.display = 'none';
  appShell.style.display = 'flex';
  userEmail.textContent = email;
  status.textContent = t('ready');
  loadHistory();
  loadMemory();
  loadFiles();
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
}

// ============================================
// INIT — auto sign-in if token already saved
// ============================================
applyLanguage();
if (authToken) {
  fetch('/api/auth/me', { headers: authHeaders() })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => enterApp(data.user.email))
    .catch(() => {
      localStorage.removeItem('uchiro_token');
      authScreen.style.display = 'flex';
    });
} else {
  authScreen.style.display = 'flex';
}

// ============================================
// HISTORY / MEMORY / FILES
// ============================================
async function loadHistory() {
  try {
    const res = await fetch('/api/history/me', { headers: authHeaders() });
    const data = await res.json();
    if (data.history && data.history.length) {
      chat.innerHTML = '';
      data.history.forEach((m) => addMessage(m.role, m.content, m.downloadUrl));
    }
  } catch (e) {
    console.error('Could not load history', e);
  }
}

async function loadMemory() {
  try {
    const res = await fetch('/api/memory/me', { headers: authHeaders() });
    const data = await res.json();
    renderMemory(data.facts || []);
  } catch (e) {
    console.error(e);
  }
}

function renderMemory(facts) {
  memCount.textContent = facts.length;
  if (!facts.length) {
    memoryList.innerHTML = `<div class="empty-hint">${t('memoryEmpty')}</div>`;
    return;
  }
  memoryList.innerHTML = '';
  facts.forEach((f) => {
    const item = document.createElement('div');
    item.className = 'memory-item';
    item.innerHTML = `<span title="${escapeHtml(f.fact)}">${escapeHtml(f.fact)}</span><button class="fact-delete" data-id="${f.id}">✕</button>`;
    memoryList.appendChild(item);
  });
  memoryList.querySelectorAll('.fact-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/memory/${btn.dataset.id}`, { method: 'DELETE', headers: authHeaders() });
      loadMemory();
    });
  });
}

async function loadFiles() {
  try {
    const res = await fetch('/api/files');
    const data = await res.json();
    renderFiles(data.files || []);
  } catch (e) {
    console.error(e);
  }
}

function renderFiles(files) {
  fileCount.textContent = files.length;
  if (!files.length) {
    filesList.innerHTML = `<div class="empty-hint">${t('filesEmpty')}</div>`;
    return;
  }
  filesList.innerHTML = '';
  files.forEach((f) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `<a href="${f.url}" download>${escapeHtml(f.name)}</a>`;
    filesList.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// CHAT UI HELPERS
// ============================================
function addMessage(role, text, downloadUrl = null, usedWebSearch = false, newFacts = []) {
  const msg = document.createElement('div');
  msg.className = `msg ${role === 'user' ? 'user' : 'bot'}`;

  if (role !== 'user') {
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = '☀';
    msg.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (usedWebSearch) {
    const badge = document.createElement('div');
    badge.className = 'search-badge';
    badge.textContent = t('searched');
    bubble.appendChild(badge);
  }

  const textNode = document.createElement('div');
  textNode.textContent = text;
  bubble.appendChild(textNode);

  if (downloadUrl) {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.className = 'download-link';
    link.textContent = t('download');
    bubble.appendChild(link);
  }

  if (newFacts && newFacts.length) {
    newFacts.forEach((f) => {
      const badge = document.createElement('div');
      badge.className = 'fact-badge';
      badge.textContent = `${t('remembered')} ${f}`;
      bubble.appendChild(badge);
    });
  }

  msg.appendChild(bubble);
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function addTyping() {
  const msg = document.createElement('div');
  msg.className = 'msg bot';
  msg.id = 'typing-indicator';
  msg.innerHTML = `<div class="avatar">☀</div><div class="bubble typing">${t('thinking')}</div>`;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
  sunMark.classList.add('thinking');
}

function removeTyping() {
  document.getElementById('typing-indicator')?.remove();
  sunMark.classList.remove('thinking');
}

// ============================================
// CATALOG QUICK ACTIONS
// ============================================
document.querySelectorAll('.tool-chip[data-prompt-en]').forEach((chip) => {
  chip.addEventListener('click', () => {
    input.value = lang === 'km' ? chip.dataset.promptKm : chip.dataset.promptEn;
    input.focus();
    input.dispatchEvent(new Event('input'));
    if (window.innerWidth <= 820) sidebar.classList.remove('open');
  });
});

attachChip.addEventListener('click', () => {
  fileInput.click();
  if (window.innerWidth <= 820) sidebar.classList.remove('open');
});

menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

// ============================================
// FILE UPLOAD — images, PDFs, and text files
// ============================================
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = () => {
      pendingAttachment = { kind: 'image', base64: reader.result.split(',')[1], mediaType: file.type, name: file.name };
      previewImg.style.display = 'block';
      previewImg.src = reader.result;
      previewLabel.textContent = file.name;
      filePreview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  } else if (file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = () => {
      pendingAttachment = { kind: 'pdf', base64: reader.result.split(',')[1], name: file.name };
      previewImg.style.display = 'none';
      previewLabel.textContent = `📄 ${file.name}`;
      filePreview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  } else {
    const reader = new FileReader();
    reader.onload = () => {
      pendingAttachment = { kind: 'text', textContent: reader.result, name: file.name };
      previewImg.style.display = 'none';
      previewLabel.textContent = `📝 ${file.name}`;
      filePreview.style.display = 'flex';
    };
    reader.readAsText(file);
  }
});

removeFileBtn.addEventListener('click', () => {
  pendingAttachment = null;
  fileInput.value = '';
  filePreview.style.display = 'none';
});

// ============================================
// SEND MESSAGE
// ============================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text && !pendingAttachment) return;

  addMessage('user', text || `[${pendingAttachment?.name || 'attachment'}]`);
  const attachmentToSend = pendingAttachment;
  input.value = '';
  input.style.height = 'auto';
  pendingAttachment = null;
  fileInput.value = '';
  filePreview.style.display = 'none';
  sendBtn.disabled = true;
  addTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message: text, attachment: attachmentToSend }),
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      addMessage('bot', `❌ ${data.error}`);
    } else {
      addMessage('bot', data.reply, data.downloadUrl, data.usedWebSearch, data.newFacts);
      if (data.newFacts && data.newFacts.length) loadMemory();
      if (data.downloadUrl) loadFiles();
    }
  } catch (err) {
    removeTyping();
    addMessage('bot', t('connError'));
  } finally {
    sendBtn.disabled = false;
  }
});

// ============================================
// CLEAR HISTORY
// ============================================
clearBtn.addEventListener('click', async () => {
  if (!confirm(t('clearConfirm'))) return;
  await fetch('/api/history/me', { method: 'DELETE', headers: authHeaders() });
  chat.innerHTML = '';
  addMessage('bot', t('clearedMsg'));
});

// ============================================
// TEXTAREA UX
// ============================================
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// ============================================
// PWA — register service worker so Uchiro can be installed on mobile
// ============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.log('SW registration failed', e));
  });
}
