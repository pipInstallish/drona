# Drona AI Chatbot Prototype — Build Spec

Static HTML/CSS/JS prototype demonstrating how an AI chatbot fits into Drona's existing chat + questions flow. No real video, no real AI backend — all interactions are mocked client-side.

**Context:** Drona is Scaler's live-lecture conferencing tool (scaler.com/meetings/i/<slug>/live). Agora powers streaming; the frontend is owned in-house. Users are Indian learners; product uses the word "doubt" (Indian-English for question). The prototype should feel like an incremental evolution of the current UI, not a redesign.

---

## Files

```
/Users/ishgautam/AI marathon/drona-prototype/
├── index.html    # layout + content for both Student and Instructor roles
├── styles.css    # dark theme, matches Drona's existing look
└── script.js     # role toggle, chat/questions interactions, mock AI
```

---

## Overall layout (matches current Drona UI)

- **Top bar (full width):** Drona logo placeholder (square icon), title `Dummy test meeting | Lecture`, top-right decorative icons (thumbs-up, trophy, settings gear).
- **Main area (left, ~75%):** solid black rectangle with `Waiting for host to join` centered in muted text. One small faded label `GNJMOVO` in a corner (decorative — matches screenshots).
- **Bottom controls (below main):** decorative buttons — mic, camera, fullscreen, person, `Raise Hand` pill, hangup (red X). Non-functional.
- **Right rail (icon column, ~80px wide):** vertical list — People, Chat, Questions, Notice Board, Help, Fix Issues. Only Chat + Questions are interactive; others show a stub "Coming soon" panel. At the very bottom: an amber text label `Doubt Session Ongoing` (decorative).
- **Right panel (~340px, opens next to rail):** swaps between Chat and Questions based on selected rail icon.
- **Prototype-only:** a small role toggle pinned top-right of the viewport: `[ Student | Instructor ]`. Not part of the real product.

---

## Chat tab

### Header
- Title `Chat` with a close `×` on the right.
- Row: `Notify me about` label + dropdown (`All new messages` / `Nothing` — decorative).
- Pinned dark card `◆ Notice Board  +  >` (decorative).

### Message list (pre-seeded)
Each message row has: a colored dot + name + `To: Everyone` chip + timestamp, with the body on the next line. Prototype seed:

1. `You` · `To: Everyone` · 1:12 PM — "Hi"
2. `You` · `To: Everyone` · 1:12 PM — "What is the difference between entropy and enthalpy?"
3. **Answered-LIVE card** (special) · 2:38 PM
   ```
   Miriyam Ambalathunkal
   Hi, what is the difference between entropy and enthalpy?
   ✅ Answered LIVE in Class
   ```
   This is a grey/green-tinted card that appears in chat after an instructor uses `Answer Now` on a question. Clicking it is decorative in the prototype.

### Input area (bottom of chat panel)
- Row with Yes/No emoji react-with-host buttons (`Yes 👍` `No 👎`) — decorative, with a small tooltip elsewhere.
- `To:` recipient selector with options:
  - `Everyone` (default)
  - `✨ AI (private)`  ← **new, added for chatbot**
  - Individual names (`ish`, `Miriyam Ambalathunkal`) — placeholder DM recipients
- `Enable/Disable Chat` link on the right (decorative).
- Input: `Type message` with a smiley emoji button on the right.

### Interactions
- Typing a normal message with `To: Everyone` → appends a new public message row attributed to the current student (e.g., "Priya").
- Selecting `✨ AI (private)` in `To:` dropdown, or typing a message prefixed with `/ai ` → AI mode:
  - The sent message gets a `🔒 Only you can see this` badge.
  - Below it, a mocked AI reply card appears with:
    - `✨ AI` label + `Only visible to you` chip
    - Mocked answer text (use keyword-matched mock, see "Mock AI logic")
    - 1–2 source chips: `📄 Lecture 4 · 12:34`, `📄 Slide 7`
  - AI replies never appear for other participants.
- Selecting an individual (e.g., `ish`) in `To:` → message shows `DM` badge and is visible only when the Instructor role also impersonates that participant (in this prototype just tag the message, don't filter).
- **Instructor role view:** same message list; AI-private messages are hidden. DMs not addressed to instructor are hidden.

---

## Questions tab

### Header
- Title `Questions` with close `×`.
- Sub-tabs: `Live (N)` `Answered (N)` — where N is the live count.
- Row: `My questions` toggle + sort dropdown `Most upvoted ▾` (decorative).
- **Instructor role only:** a light-purple banner at top:
  `Note: Please click on "Answer Now" button before you start explaining the doubt to perfectly map it with the classroom video.`
- **Instructor role only:** above the list, a **Confusion Pulse** strip:
  ```
  📊 Students asked AI about in the last 10 min:
     • Entropy vs enthalpy (7)
     • Gibbs free energy (3)
     • Hess's law (2)
  ```

### Question card (student role)
Each Live question in the list renders:
```
┌────────────────────────────────────────┐
│ Priya Sharma              🗑  ⋮         │
│ What's the difference between entropy  │
│ and enthalpy?                          │
│                                        │
│ ▸ ✨ AI tried to answer (tap to expand)│  ← collapsed by default, owner sees expanded
│                                        │
│ Asked 2 min ago                  👍 4  │
└────────────────────────────────────────┘
```
- If the question is the student's own: shows a `Withdraw` action via the `⋮` menu.
- Expanded AI attempt shows the mocked answer + source chips + the Yes/No help buttons (only if it's the asker's own question).

### Question card (instructor role)
```
┌────────────────────────────────────────┐
│ Miriyam Ambalathunkal      🗑  ⋮        │
│ Hi, what is the difference between     │
│ entropy and enthalpy?                  │
│                                        │
│ ▸ ✨ AI attempted: "Entropy measures…" │  ← instructor can expand
│                                        │
│ [ Already Answered ]  [ Answer Now ]   │  ← existing buttons, exact labels
│                                        │
│ Asked a few seconds ago          👍 0  │
└────────────────────────────────────────┘
```
- `Answer Now` (primary green/teal button) — clicking it:
  1. Removes card from `Live` tab
  2. Adds card to `Answered` tab
  3. Appends a new `Answered LIVE in Class` card into the Chat panel's message list
- `Already Answered` (secondary outline button) — clicking it moves the question to `Answered` tab silently (no chat post).

### Pre-seeded data
- **Live queue:** 1 question — Miriyam Ambalathunkal, "Hi, what is the difference between entropy and enthalpy?"
- **Answered:** 1 question — Priya Sharma, "What's an exothermic reaction?" (resolved via `Answer Now`, so already a chat card exists)
- **Student's own self-resolved:** 1 question in `My questions` filter — Rahul (current user), "What's Gibbs free energy?" — resolved via AI pre-check (never posted public).

---

## AI Pre-check Modal (replaces "Are you sure?")

Triggered when a student types a doubt in the Questions tab input and clicks `Ask`.

```
┌────────────────────────────────────────┐
│  ✨ Here's what the lecture covered    │
│                                        │
│  [Mocked AI answer — 3–5 lines]        │
│                                        │
│  📄 Lecture 4 · 12:34   📄 Slide 7     │
│                                        │
│  ┌──────────────────────┐              │
│  │ Yes, this helps —    │              │
│  │ don't post           │              │
│  └──────────────────────┘              │
│  ┌──────────────────────┐              │
│  │ Not quite, post to   │              │
│  │ class                │              │
│  └──────────────────────┘              │
└────────────────────────────────────────┘
```

- Shown while a 0.8s skeleton loader runs, then the mock answer fades in.
- `Yes, this helps — don't post`: closes modal, adds doubt to `My questions` with `✨ AI-resolved` tag, never enters public Live queue.
- `Not quite, post to class`: closes modal, doubt enters Live queue as normal. AI's attempt is attached to the card (collapsed) so the instructor can see what AI already said.
- There is **no separate "Are you sure?" modal** — the AI pre-check replaces it. If AI has nothing useful (fallback), the modal still shows "We couldn't find this in the lecture — posting directly." with a single Continue button.

---

## Role toggle

Fixed top-right of viewport, styled as two segmented buttons:
```
┌──────────┬──────────────┐
│ Student  │  Instructor  │
└──────────┴──────────────┘
```
- Toggling switches: user name label in chat avatar attribution, question-card action buttons (Withdraw vs Already Answered/Answer Now), visibility of Confusion Pulse + instructor banner, visibility of private AI replies in chat.
- Default: Student.

---

## Mock AI logic (script.js)

```js
function mockAiAnswer(query) {
  const q = query.toLowerCase();
  if (/enthalp|entropy/.test(q))      return { text: "Entropy (S) measures disorder in a system; enthalpy (H) measures total heat content at constant pressure. In a reaction, ΔH tells you heat exchanged; ΔS tells you how disorder changed.", sources: ["Lecture 4 · 12:34", "Slide 7"] };
  if (/gibbs/.test(q))                 return { text: "Gibbs free energy G = H − TS. A reaction is spontaneous when ΔG < 0.", sources: ["Lecture 5 · 03:10"] };
  if (/hess/.test(q))                  return { text: "Hess's Law: total enthalpy change is the same regardless of path taken.", sources: ["Lecture 4 · 28:45"] };
  if (/exotherm|endotherm/.test(q))    return { text: "Exothermic reactions release heat (ΔH < 0); endothermic absorb heat (ΔH > 0).", sources: ["Lecture 3 · 41:02"] };
  return { text: "Based on the lecture so far, here's a rough answer — you may want to post this to the class for a complete explanation.", sources: ["Lecture transcript"] };
}
```

Add a 600–900ms artificial delay when showing any AI response (skeleton loader).

---

## Styling notes

- **Palette:**
  - Background: `#0f1115` (app), `#1a1d23` (right panel), `#22262e` (cards)
  - Text: `#e6e8eb` primary, `#8b93a3` secondary, `#5b6270` muted
  - Accent: `#4f7cff` (primary), `#22c55e` (success/answered), `#f59e0b` (doubt-session-ongoing amber)
  - AI accent: subtle gradient border `linear-gradient(135deg, #8b5cf6, #3b82f6)` for AI cards
- **Font:** system UI stack (`-apple-system, Segoe UI, ...`)
- **Message-row alignment:** name/time left-aligned; body right-aligned (matches current Drona screenshots)
- **AI cards:** always include `✨` prefix and an `Only visible to you` chip
- **Source chips:** small rounded pills, icon + text, 11px
- **Answered-LIVE card in chat:** grey-white background with green check icon and `Answered LIVE in Class` label in success green
- **Doubt Session Ongoing:** amber text, bottom of right rail, not a button

---

## Out of scope

- Real video/audio/streaming
- Real AI model calls
- Mobile layout (desktop only)
- Authentication, persistence (localStorage is fine but optional)
- Tabs other than Chat and Questions (People/Notice Board/Help/Fix — stub panels saying "Coming soon")
- Animations beyond fade-in and skeleton loader

---

## Build order recommendation

1. Layout shell (top bar, main black area, right rail, bottom controls) — pure HTML/CSS.
2. Role toggle with role state.
3. Chat panel — message list + input + `To:` selector + AI private replies.
4. Questions panel — Live/Answered sub-tabs + pre-seeded cards.
5. AI pre-check modal.
6. Answer Now → chat card cross-flow.
7. Confusion Pulse + instructor banner.
8. Polish: skeleton loaders, hover states, empty states.
