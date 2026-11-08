const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadApp() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const context = {
    console,
    Date,
    Promise,
    setTimeout,
    fetch: () => new Promise(() => {}),
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

function makeCard(open = false) {
  const classes = new Set(open ? ['card', 'open'] : ['card']);
  const body = { hidden: !open };
  const attributes = { 'aria-expanded': String(open) };
  let clickHandler;

  const article = {
    classList: {
      contains: value => classes.has(value),
      toggle: (value, force) => force ? classes.add(value) : classes.delete(value),
    },
    querySelector: selector => selector === '.card-body' ? body : null,
  };

  const button = {
    getAttribute: name => attributes[name],
    setAttribute: (name, value) => { attributes[name] = value; },
    closest: selector => selector === '.card' ? article : null,
    addEventListener: (name, handler) => { if (name === 'click') clickHandler = handler; },
  };

  return {
    article,
    body,
    button,
    attributes,
    classes,
    click: () => clickHandler(),
    isWired: () => typeof clickHandler === 'function',
  };
}

test('renders every post collapsed with escaped content and accessible controls', () => {
  const app = loadApp();
  assert.equal(typeof app.renderPostCard, 'function');

  const html = app.renderPostCard({
    date: '2026-11-08',
    title: '<b>LCS</b>',
    category: 'cp',
    xp: 25,
    text: '<script>alert(1)</script>',
    code: 'cout << "<ok>";',
    codeLang: '<cpp>',
  }, 0);

  assert.match(html, /class="card-toggle"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="post-body-0"/);
  assert.match(html, /id="post-body-0"[^>]*hidden/);
  assert.match(html, /&lt;b&gt;LCS&lt;\/b&gt;/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /cout &lt;&lt; &quot;&lt;ok&gt;&quot;;/);
  assert.match(html, /&lt;cpp&gt;/);
});

test('omits the code block when a post has no code', () => {
  const app = loadApp();
  const html = app.renderPostCard({
    date: '2026-11-08',
    title: 'No code today',
    category: 'dev',
    xp: 10,
    text: 'Notes only',
  }, 1);

  assert.doesNotMatch(html, /codewrap/);
  assert.match(html, /id="post-body-1"[^>]*hidden/);
});

test('binds click handlers and toggles only the selected card', () => {
  const app = loadApp();
  assert.equal(typeof app.bindPostToggles, 'function');
  assert.equal(typeof app.togglePost, 'function');

  const first = makeCard(true);
  const second = makeCard(false);
  const container = { querySelectorAll: () => [first.button, second.button] };

  app.bindPostToggles(container);
  assert.equal(first.isWired(), true);
  assert.equal(second.isWired(), true);

  second.click();
  assert.equal(first.attributes['aria-expanded'], 'true');
  assert.equal(first.body.hidden, false);
  assert.equal(second.attributes['aria-expanded'], 'true');
  assert.equal(second.body.hidden, false);
  assert.equal(second.classes.has('open'), true);

  second.click();
  assert.equal(first.attributes['aria-expanded'], 'true');
  assert.equal(first.body.hidden, false);
  assert.equal(second.attributes['aria-expanded'], 'false');
  assert.equal(second.body.hidden, true);
  assert.equal(second.classes.has('open'), false);
});
