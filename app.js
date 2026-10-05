/* QUEST_LOG — 404dreamer-hozaib
   All logic runs in the browser. Data comes from posts.json (same folder). */

const CATS = {
  cp:  { label: 'CP',  color: '#3b82f6' },
  dev: { label: 'DEV', color: '#22c55e' },
  sec: { label: 'SEC', color: '#a855f7' },
};
const LEVEL_TITLES = ['Newbie', 'Script Kiddie', 'Byte Brawler', 'Bug Hunter', 'Stack Smasher', 'Root Seeker', 'Kernel Crusher', '0x Legend'];
const WEEKS = 52;
const XP_PER_LEVEL = 100;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let POSTS = [];
let activeFilter = 'all';

const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function iso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function loadPosts() {
  try {
    const res = await fetch('posts.json?ts=' + Date.now());
    const data = await res.json();
    return Array.isArray(data) ? data : (data.posts || []);
  } catch (e) {
    return null;
  }
}

/* ---------- stats ---------- */

function renderStats() {
  const xp = POSTS.reduce((s, p) => s + (Number(p.xp) || 0), 0);
  const level = Math.floor(xp / XP_PER_LEVEL);
  document.getElementById('lvl').textContent = level + 1;
  document.getElementById('lvlTitle').textContent = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];
  document.getElementById('xpfill').style.width = (xp % XP_PER_LEVEL) + '%';
  document.getElementById('xpText').textContent = (xp % XP_PER_LEVEL) + ' / ' + XP_PER_LEVEL + ' XP → next level';
  document.getElementById('totalXp').textContent = xp;
  document.getElementById('totalPosts').textContent = POSTS.length;

  const dates = new Set(POSTS.map(p => p.date));
  let streak = 0;
  const cur = new Date();
  if (!dates.has(iso(cur))) cur.setDate(cur.getDate() - 1);
  while (dates.has(iso(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  document.getElementById('streak').textContent = streak;
}

/* ---------- heatmap ---------- */

function el(cls, text) {
  const d = document.createElement('div');
  d.className = cls;
  if (text !== undefined) d.textContent = text;
  return d;
}

function renderHeatmap() {
  const byDate = {};
  POSTS.forEach(p => { (byDate[p.date] = byDate[p.date] || []).push(p.category); });

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - ((WEEKS - 1) * 7 + now.getDay())); // align to Sunday

  const corner = el('heat-corner');
  const months = el('heat-months');
  for (let w = 0; w < WEEKS; w++) {
    const ws = new Date(start);
    ws.setDate(ws.getDate() + w * 7);
    let label = '';
    for (let i = 0; i < 7; i++) {
      const dd = new Date(ws);
      dd.setDate(dd.getDate() + i);
      if (dd.getDate() === 1) { label = MONTHS[dd.getMonth()]; break; }
    }
    months.appendChild(el('', label));
  }

  const labels = el('heat-labels');
  ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(t => labels.appendChild(el('', t)));

  const grid = el('heat-grid');
  const d = new Date(start);
  while (d <= now) {
    const key = iso(d);
    const cell = el('cell');
    const cats = [...new Set(byDate[key] || [])];
    if (cats.length === 1) {
      cell.style.background = CATS[cats[0]].color;
      cell.style.opacity = byDate[key].length > 1 ? 1 : 0.55;
    } else if (cats.length > 1) {
      cell.style.background = 'linear-gradient(135deg, ' + cats
        .map((c, i) => CATS[c].color + ' ' + Math.round(i * 100 / cats.length) + '% ' + Math.round((i + 1) * 100 / cats.length) + '%')
        .join(', ') + ')';
    }
    cell.title = key + ': ' + (byDate[key]
      ? byDate[key].length + ' log (' + cats.map(c => (CATS[c] || {}).label || c).join(', ') + ')'
      : 'no log');
    grid.appendChild(cell);
    d.setDate(d.getDate() + 1);
  }

  const wrap = document.getElementById('heatmap');
  wrap.innerHTML = '';
  wrap.appendChild(corner);
  wrap.appendChild(months);
  wrap.appendChild(labels);
  wrap.appendChild(grid);

  // per-category summary for the visible window
  const from = iso(start);
  const inWindow = POSTS.filter(p => String(p.date) >= from);
  const counts = { cp: 0, dev: 0, sec: 0 };
  inWindow.forEach(p => { if (counts[p.category] !== undefined) counts[p.category]++; });
  const hs = document.getElementById('heatStats');
  if (inWindow.length) {
    hs.innerHTML = ['cp', 'dev', 'sec']
      .map(k => '<span class="hs"><i style="background:' + CATS[k].color + '"></i>' + CATS[k].label + ' ' + counts[k] + '</span>')
      .join('') + '<span class="hs total">' + inWindow.length + ' log / ' + WEEKS + ' weeks</span>';
  } else {
    hs.innerHTML = '';
  }
}

/* ---------- filters + post list ---------- */

function renderFilters() {
  const counts = { all: POSTS.length, cp: 0, dev: 0, sec: 0 };
  POSTS.forEach(p => { if (counts[p.category] !== undefined) counts[p.category]++; });
  const elBox = document.getElementById('filters');
  elBox.innerHTML = '';
  ['all', 'cp', 'dev', 'sec'].forEach(k => {
    const b = document.createElement('button');
    b.className = 'fbtn' + (activeFilter === k ? ' active' : '');
    b.textContent = (k === 'all' ? 'ALL' : CATS[k].label) + ' (' + counts[k] + ')';
    b.onclick = () => { activeFilter = k; renderFilters(); renderPosts(); };
    elBox.appendChild(b);
  });
  document.getElementById('logRange').textContent = 'total ' + POSTS.length + ' · daily progress';
}

function renderPosts() {
  const elBox = document.getElementById('posts');
  const list = activeFilter === 'all' ? POSTS : POSTS.filter(p => p.category === activeFilter);
  if (!list.length) {
    elBox.innerHTML = '';
    return;
  }
  elBox.innerHTML = list.map(p => {
    const c = CATS[p.category] || CATS.dev;
    const codeBlock = p.code
      ? '<div class="codewrap"><div class="codehead"><span class="clang">' + esc(p.codeLang || 'code') + '</span></div>' +
        '<pre class="codeblock">' + esc(p.code) + '</pre></div>'
      : '';
    return '<article class="card" style="--cat:' + c.color + '">' +
      '<div class="card-head">' +
        '<span class="chip" style="background:' + c.color + '22;color:' + c.color + ';border:1px solid ' + c.color + '55">' + c.label + '</span>' +
        '<span class="pdate">' + esc(fmtDate(p.date)) + '</span>' +
        '<span class="pxp">+' + (Number(p.xp) || 0) + ' XP</span>' +
      '</div>' +
      '<h3>' + esc(p.title) + '</h3>' +
      '<p>' + esc(p.text || '') + '</p>' +
      codeBlock +
    '</article>';
  }).join('');
}

function fmtDate(s) {
  const d = new Date(String(s) + 'T00:00:00');
  if (isNaN(d)) return String(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ---------- terminal intro ---------- */

const TERM_LINES = [
  ['> whoami', 'cmd'],
  ['404dreamer-hozaib — CS student · CP · DEV · SEC', 'out'],
  ['> cat mission.txt', 'cmd'],
  ['solve something. build something. break something. log it daily.', 'out'],
  ['> ./status.sh', 'cmd'],
  ['[OK] quest log online — consistency loading…', 'ok'],
];

async function typeTerminal() {
  const box = document.getElementById('terminal');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const [text, cls] of TERM_LINES) {
    const line = document.createElement('div');
    line.className = 'tline ' + cls;
    box.appendChild(line);
    if (reduced) { line.textContent = text; continue; }
    for (const ch of text) {
      line.textContent += ch;
      await new Promise(r => setTimeout(r, 16));
    }
  }
  const cursor = document.createElement('div');
  cursor.className = 'tline cmd';
  cursor.innerHTML = '&gt; <span class="blink">▮</span>';
  box.appendChild(cursor);
}

/* ---------- init ---------- */

(async function init() {
  POSTS = await loadPosts();
  if (POSTS === null) {
    document.getElementById('posts').innerHTML =
      '<p class="empty">Failed to load posts.json — make sure the file is uploaded next to index.html.</p>';
    return;
  }
  POSTS.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  renderStats();
  renderHeatmap();
  renderFilters();
  renderPosts();
  typeTerminal();
})();
