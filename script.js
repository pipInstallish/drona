'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let currentRole = 'student';
let activePanel = 'chat';
let liveCount = 1;
let answeredCount = 1;
let questionCounter = 10;

// ── Mock AI Logic ─────────────────────────────────────────────────────────────
function mockAiAnswer(query) {
  const q = query.toLowerCase();
  if (/enthalp|entropy/.test(q))
    return { text: 'Entropy (S) measures disorder in a system; enthalpy (H) measures total heat content at constant pressure. In a reaction, ΔH tells you heat exchanged; ΔS tells you how disorder changed.', sources: ['Lecture 4 · 12:34', 'Slide 7'] };
  if (/gibbs/.test(q))
    return { text: 'Gibbs free energy G = H − TS. A reaction is spontaneous when ΔG < 0. At equilibrium ΔG = 0.', sources: ['Lecture 5 · 03:10'] };
  if (/hess/.test(q))
    return { text: "Hess's Law: the total enthalpy change of a reaction is the same regardless of the path taken, as long as the initial and final states are the same.", sources: ['Lecture 4 · 28:45'] };
  if (/exotherm|endotherm/.test(q))
    return { text: 'Exothermic reactions release heat to the surroundings (ΔH < 0), while endothermic reactions absorb heat from surroundings (ΔH > 0).', sources: ['Lecture 3 · 41:02'] };
  if (/activation energy|catalyst/.test(q))
    return { text: 'Activation energy is the minimum energy required for a reaction to occur. A catalyst lowers the activation energy without being consumed.', sources: ['Lecture 6 · 08:22'] };
  return null; // triggers fallback inline message
}

// ── Role Toggle ───────────────────────────────────────────────────────────────
document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRole = btn.dataset.role;
    document.body.classList.toggle('instructor', currentRole === 'instructor');

    const instructorBanner = document.getElementById('instructorBanner');
    const confusionPulse = document.getElementById('confusionPulse');
    if (currentRole === 'instructor') {
      instructorBanner.classList.remove('hidden');
      confusionPulse.classList.remove('hidden');
      // Show instructor action buttons on all live q-cards
      document.querySelectorAll('.instructor-actions').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.withdraw-btn').forEach(el => el.classList.add('hidden'));
      // Hide student helpful rows
      document.querySelectorAll('.ai-helpful-row').forEach(el => el.style.display = 'none');
    } else {
      instructorBanner.classList.add('hidden');
      confusionPulse.classList.add('hidden');
      document.querySelectorAll('.instructor-actions').forEach(el => el.classList.add('hidden'));
      // Re-apply withdraw visibility based on data-mine
      document.querySelectorAll('.q-card[data-mine="true"] .withdraw-btn').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.ai-helpful-row').forEach(el => el.style.display = '');
    }
  });
});

// ── Rail Navigation ───────────────────────────────────────────────────────────
function openRailPanel(btn) {
  document.querySelectorAll('.rail-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const panel = btn.dataset.panel;
  const stubTitle = btn.dataset.stub;

  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('sidePanel').style.display = 'flex';

  if (panel === 'chat') {
    document.getElementById('chatPanel').classList.remove('hidden');
    activePanel = 'chat';
  } else if (panel === 'questions') {
    document.getElementById('questionsPanel').classList.remove('hidden');
    activePanel = 'questions';
    document.getElementById('qBadge').classList.add('hidden');
  } else if (panel === 'ask-ai') {
    document.getElementById('askAiPanel').classList.remove('hidden');
    activePanel = 'ask-ai';
    document.getElementById('aiInput').focus();
  } else {
    document.getElementById('stubPanel').classList.remove('hidden');
    document.getElementById('stubTitle').textContent = stubTitle || 'Coming soon';
    activePanel = 'stub';
  }
}

function closePanel() {
  document.querySelectorAll('.rail-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sidePanel').style.display = 'none';
}

// ── Chat ──────────────────────────────────────────────────────────────────────
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const toSelect = document.getElementById('toSelect');
const chatMessages = document.getElementById('chatMessages');

function getTime() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function appendChatMessage(name, toLabel, body, tagClass = '') {
  const row = document.createElement('div');
  row.className = 'msg-row new-msg-anim';
  row.innerHTML = `
    <div class="msg-meta">
      <span class="dot online"></span>
      <span class="msg-name">${escHtml(name)}</span>
      <span class="msg-tag ${tagClass}">${escHtml(toLabel)}</span>
      <span class="msg-time">${getTime()}</span>
    </div>
    <div class="msg-body">${escHtml(body)}</div>`;
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  const to = toSelect.value;
  if (to === 'everyone') {
    const name = currentRole === 'instructor' ? 'Instructor' : 'You';
    appendChatMessage(name, 'To: Everyone', text);
  } else {
    const recipientName = toSelect.options[toSelect.selectedIndex].text;
    appendChatMessage(currentRole === 'instructor' ? 'Instructor' : 'You', `DM to ${recipientName}`, text, 'dm-tag');
  }
  chatInput.value = '';
}

chatSendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } });

// ── Questions Panel ───────────────────────────────────────────────────────────
function switchQTab(tab) {
  const liveTab = document.getElementById('liveTab');
  const answeredTab = document.getElementById('answeredTab');
  const liveList = document.getElementById('liveList');
  const answeredList = document.getElementById('answeredList');
  const liveEmpty = document.getElementById('liveEmpty');

  if (tab === 'live') {
    liveTab.classList.add('active');
    answeredTab.classList.remove('active');
    const hasItems = liveList.querySelectorAll('.q-card').length > 0;
    liveList.classList.toggle('hidden', !hasItems);
    liveEmpty.classList.toggle('hidden', hasItems);
    answeredList.classList.add('hidden');
  } else {
    answeredTab.classList.add('active');
    liveTab.classList.remove('active');
    liveList.classList.add('hidden');
    liveEmpty.classList.add('hidden');
    answeredList.classList.remove('hidden');
  }
}

function updateLiveCount(delta) {
  liveCount = Math.max(0, liveCount + delta);
  document.getElementById('liveCount').textContent = liveCount;
  // Show badge on Questions rail btn if not on questions panel
  if (activePanel !== 'questions' && liveCount > 0) {
    const badge = document.getElementById('qBadge');
    badge.classList.remove('hidden');
    badge.textContent = liveCount;
  }
}

function updateAnsweredCount(delta) {
  answeredCount = Math.max(0, answeredCount + delta);
  document.getElementById('answeredCount').textContent = answeredCount;
}

// AI attempt accordion
function toggleAiAttempt(id) {
  const body = document.getElementById(`ai-body-${id}`);
  const arrow = document.querySelector(`#ai-attempt-${id} .ai-attempt-arrow`);
  const isOpen = !body.classList.contains('hidden');
  body.classList.toggle('hidden', isOpen);
  arrow.classList.toggle('open', !isOpen);
}

// Withdraw question
function withdrawQuestion(id) {
  const card = document.querySelector(`.q-card[data-id="${id}"]`);
  if (!card) return;
  card.style.transition = 'opacity 0.2s';
  card.style.opacity = '0';
  setTimeout(() => {
    card.remove();
    updateLiveCount(-1);
    checkLiveEmpty();
  }, 200);
}

function checkLiveEmpty() {
  const liveList = document.getElementById('liveList');
  const liveEmpty = document.getElementById('liveEmpty');
  const hasItems = liveList.querySelectorAll('.q-card').length > 0;
  liveList.classList.toggle('hidden', !hasItems);
  liveEmpty.classList.toggle('hidden', hasItems);
}

// Student resolves own question via AI
function resolveOwnQuestion(id, resolved) {
  if (resolved) {
    withdrawQuestion(id);
  } else {
    // Mark as "posted to instructor" — just expand the card slightly
    const card = document.querySelector(`.q-card[data-id="${id}"]`);
    if (!card) return;
    const helpRow = card.querySelector('.ai-helpful-row');
    if (helpRow) {
      helpRow.innerHTML = '<span style="font-size:12px;color:var(--amber);">⏳ Sent to instructor queue</span>';
    }
  }
}

// Instructor: Already Answered
function alreadyAnswered(id) {
  const card = document.querySelector(`.q-card[data-id="${id}"]`);
  if (!card) return;
  const text = card.dataset.text;
  const author = card.dataset.author;

  card.style.transition = 'opacity 0.2s';
  card.style.opacity = '0';
  setTimeout(() => {
    card.remove();
    updateLiveCount(-1);
    checkLiveEmpty();
    addToAnsweredTab(author, text, false);
    updateAnsweredCount(1);
  }, 200);
}

// Instructor: Answer Now
function answerNow(id) {
  const card = document.querySelector(`.q-card[data-id="${id}"]`);
  if (!card) return;
  const text = card.dataset.text;
  const author = card.dataset.author;

  card.style.transition = 'opacity 0.2s';
  card.style.opacity = '0';
  setTimeout(() => {
    card.remove();
    updateLiveCount(-1);
    checkLiveEmpty();
    addToAnsweredTab(author, text, true);
    updateAnsweredCount(1);
    appendAnsweredLiveToChat(author, text);
  }, 200);
}

function addToAnsweredTab(author, text, live) {
  const list = document.getElementById('answeredList');
  const card = document.createElement('div');
  card.className = 'q-card answered-card new-msg-anim';
  card.innerHTML = `
    <div class="q-card-header"><span class="q-author">${escHtml(author)}</span></div>
    <div class="q-text">${escHtml(text)}</div>
    ${live ? '<div class="answered-badge small">✅ Answered LIVE in Class</div>' : '<div class="answered-badge small" style="color:var(--text-sec);">✓ Marked as answered</div>'}
    <div class="q-meta"><span class="q-time">${getTime()}</span><span class="q-upvote">👍 0</span></div>`;
  list.insertBefore(card, list.firstChild);
}

function appendAnsweredLiveToChat(author, text) {
  const card = document.createElement('div');
  card.className = 'answered-live-card new-msg-anim';
  card.innerHTML = `
    <div class="answered-live-header"><span class="answered-name">${escHtml(author)}</span></div>
    <div class="answered-question">${escHtml(text)}</div>
    <div class="answered-badge">✅ Answered LIVE in Class</div>
    <div class="answered-meta">${getTime()} &nbsp;·&nbsp; 👍 0</div>`;
  chatMessages.appendChild(card);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ── Question Submission — inline AI response ──────────────────────────────────
function submitQuestion() {
  const input = document.getElementById('qInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  postQuestionToLive(text);
}

function postQuestionToLive(text) {
  questionCounter++;
  const id = `q${questionCounter}`;
  const liveList = document.getElementById('liveList');
  liveList.classList.remove('hidden');
  document.getElementById('liveEmpty').classList.add('hidden');

  const isInstructor = currentRole === 'instructor';
  const authorName = isInstructor ? 'Instructor' : 'You';

  const card = document.createElement('div');
  card.className = 'q-card new-msg-anim';
  card.dataset.id = id;
  card.dataset.author = authorName;
  card.dataset.text = text;
  card.dataset.mine = 'true';

  // Inline AI section — skeleton shown immediately, replaced after delay
  const inlineAiHtml = `
    <div class="inline-ai-section" id="inline-ai-${id}">
      <div class="inline-ai-label">✨ AI is looking this up…</div>
      <div class="inline-ai-body" id="inline-ai-body-${id}">
        <div class="skeleton-lines">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    </div>`;

  const instructorActionsHtml = `
    <div class="instructor-actions instructor-only ${!isInstructor ? 'hidden' : ''}">
      <button class="btn-secondary" onclick="alreadyAnswered('${id}')">Already Answered</button>
      <button class="btn-primary" onclick="answerNow('${id}')">Answer Now</button>
    </div>`;

  card.innerHTML = `
    <div class="q-card-header">
      <span class="q-author">${escHtml(authorName)}</span>
      <div class="q-card-actions">
        <button class="q-icon-btn withdraw-btn ${isInstructor ? 'hidden' : ''}" title="Withdraw" onclick="withdrawQuestion('${id}')">🗑</button>
        <button class="q-icon-btn">⋮</button>
      </div>
    </div>
    <div class="q-text">${escHtml(text)}</div>
    ${!isInstructor ? inlineAiHtml : ''}
    ${instructorActionsHtml}
    <div class="q-meta">
      <span class="q-time">Just now</span>
      <span class="q-upvote">👍 <span id="upvote-${id}">0</span></span>
    </div>`;

  liveList.insertBefore(card, liveList.firstChild);
  updateLiveCount(1);
  switchQTab('live');

  // After delay, replace skeleton with AI answer + action buttons (student only)
  if (!isInstructor) {
    const delay = 700 + Math.random() * 300;
    setTimeout(() => {
      const body = document.getElementById(`inline-ai-body-${id}`);
      const label = document.querySelector(`#inline-ai-${id} .inline-ai-label`);
      if (!body) return;

      const answer = mockAiAnswer(text);
      if (answer) {
        label.textContent = '✨ AI answered';
        body.innerHTML = `
          <div class="ai-text">${escHtml(answer.text)}</div>
          <div class="inline-ai-actions">
            <button class="helpful-btn yes" onclick="resolveOwnQuestion('${id}', true)">I'm satisfied</button>
            <button class="helpful-btn no" onclick="resolveOwnQuestion('${id}', false)">Raise to instructor</button>
          </div>`;
      } else {
        label.textContent = '✨ AI couldn\'t find this in the lecture';
        body.innerHTML = `
          <div class="ai-text" style="color:var(--text-muted)">This topic wasn't covered yet. Raising to instructor is recommended.</div>
          <div class="inline-ai-actions">
            <button class="helpful-btn no" onclick="resolveOwnQuestion('${id}', false)">Raise to instructor</button>
          </div>`;
      }
    }, delay);
  }
}

// ── Ask AI Panel ──────────────────────────────────────────────────────────────
const cannedAnswers = {
  'Catch me up with topics covered till now': {
    text: "Here's what we've covered so far:\n1. Introduction to Thermodynamics — basic definitions and scope\n2. Enthalpy (H) and Entropy (S) — definitions and key differences\n3. Gibbs Free Energy (G = H − TS) — spontaneity conditions (ΔG < 0)\n4. Hess's Law — enthalpy change is path-independent\n\nWe're currently on Slide 12 of 24.",
    sources: ['Lecture transcript', 'Slides 1–12']
  },
  'Explain that more simply': {
    text: "Sure! The last concept was Gibbs free energy.\n\nThink of it this way: ΔG tells you if a reaction will happen on its own.\n• ΔG < 0 → reaction happens spontaneously (the 'downhill' direction)\n• ΔG > 0 → reaction needs energy input to proceed\n• ΔG = 0 → the system is at equilibrium\n\nSimple rule: negative ΔG = good to go!",
    sources: ['Lecture 5 · 08:14']
  },
  'Give me an example': {
    text: "Example for entropy:\n\nA drop of ink dropped into water spreads out on its own — entropy increases because there is more disorder. It never spontaneously gathers back into a drop!\n\nFor enthalpy:\nWhen you burn wood (exothermic), ΔH is negative — heat is released to the surroundings.",
    sources: ['Lecture 3 · 22:40', 'Slide 8']
  },
  'Quiz me on the last 10 minutes': {
    text: "Quick quiz — try answering before checking:\n\nQ1. What does ΔH < 0 tell you about a reaction?\nQ2. Write the formula for Gibbs free energy.\nQ3. When entropy increases and enthalpy decreases, is the reaction always spontaneous?\nQ4. State Hess's Law in one sentence.\n\nHints available — just ask!",
    sources: ['Lecture 4–5 content']
  }
};

function fireCannedPrompt(prompt) {
  document.getElementById('aiEmptyState').classList.add('hidden');
  appendAiUserBubble(prompt);
  const answer = cannedAnswers[prompt] || mockAiAnswer(prompt) || { text: 'Based on the lecture so far, here is what I found.', sources: ['Lecture transcript'] };
  appendAiSkeletonThenAnswer(answer);
}

function sendAiMessage() {
  const input = document.getElementById('aiInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  document.getElementById('aiEmptyState').classList.add('hidden');
  appendAiUserBubble(text);
  const answer = mockAiAnswer(text) || { text: "I couldn't find a direct match in the lecture for that. Try rephrasing, or raise it to the instructor in the Questions tab.", sources: ['Lecture transcript'] };
  appendAiSkeletonThenAnswer(answer);
}

document.getElementById('aiInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); sendAiMessage(); }
});

function appendAiUserBubble(text) {
  const conv = document.getElementById('aiConversation');
  const bubble = document.createElement('div');
  bubble.className = 'ai-bubble-user new-msg-anim';
  bubble.textContent = text;
  conv.appendChild(bubble);
  conv.scrollTop = conv.scrollHeight;
}

function appendAiSkeletonThenAnswer(answer) {
  const conv = document.getElementById('aiConversation');
  const skel = document.createElement('div');
  skel.className = 'ai-bubble-skeleton new-msg-anim';
  skel.innerHTML = `<div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line"></div>`;
  conv.appendChild(skel);
  conv.scrollTop = conv.scrollHeight;

  const delay = 650 + Math.random() * 300;
  setTimeout(() => {
    skel.remove();
    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble-ai new-msg-anim';
    bubble.innerHTML = `
      <div class="ai-bubble-label">✨ AI · Only visible to you</div>
      <div class="ai-bubble-text">${escHtml(answer.text)}</div>
      <div class="source-chips" style="margin-top:8px">${answer.sources.map(s => `<span class="source-chip">📄 ${escHtml(s)}</span>`).join('')}</div>`;
    conv.appendChild(bubble);
    conv.scrollTop = conv.scrollHeight;
  }, delay);
}

// ── Toast notification ────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
    background:#1e2535;border:1px solid #2d3a5c;border-radius:8px;
    padding:10px 18px;color:#e6e8eb;font-size:13px;z-index:900;
    animation:fadeIn 0.2s ease;box-shadow:0 4px 20px rgba(0,0,0,0.4);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ── HTML escape helper ────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────────
// Set q-input placeholder to something shorter on small panels
document.getElementById('qInput').placeholder = 'Ask a doubt…';

// Enter key on q-input
document.getElementById('qInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitQuestion(); }
});

// Initial live count badge (hidden, chat is open)
checkLiveEmpty();
