# Collapsible Post Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every blog post as a compact, independently expandable card whose description and code start hidden.

**Architecture:** Keep the existing static-site data flow. Extract card markup and toggle wiring into small functions in `app.js`, use native `hidden` plus `aria-expanded` for state, and style collapsed/expanded states in `style.css`.

**Tech Stack:** Vanilla JavaScript, HTML strings, CSS, Node.js built-in `node:test` and `vm`.

**Spec:** `docs/superpowers/specs/2026-11-08-collapsible-post-cards-design.md`

## Global Constraints

- Do not modify `posts.json` or any existing post content.
- Preserve filters, stats, XP, heatmap, ordering, category colors, and code escaping.
- Every card starts collapsed; cards expand independently.
- Mouse and keyboard activation must use a real button with accurate `aria-expanded` and `hidden` state.
- Maintain responsive behavior down to the existing mobile breakpoint.

## Review Focus

- A post without code still expands and collapses normally.
- HTML in title, text, or code remains escaped.
- Opening one card does not collapse an already-open sibling.
- Re-rendering after a filter change wires the new card buttons.
- Empty filtered lists retain the existing empty behavior without errors.

---

### Task 1: Independently Collapsible Post Cards

**Files:**
- Create: `tests/post-cards.test.js`
- Modify: `app.js`
- Modify: `style.css`

**Interfaces:**
- Consumes: existing post objects `{date,title,category,xp,text,code?,codeLang?}` and the `#posts` container.
- Produces: `renderPostCard(post, index) -> string`, `togglePost(button) -> void`, and `bindPostToggles(container) -> void`.

- [ ] **Step 1: Write failing behavior tests**

Add Node tests that assert literal observable behavior: rendered cards start with `aria-expanded="false"` and a hidden body; title/text/code stay escaped; code-less posts omit the code block; `bindPostToggles` wires a click; toggling changes only the selected card and leaves an open sibling unchanged.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/post-cards.test.js`

Expected: FAIL because `renderPostCard`, `togglePost`, and `bindPostToggles` do not exist.

- [ ] **Step 3: Implement minimal JavaScript behavior**

Add the three planned functions to `app.js`, render a button header plus hidden `.card-body`, and call `bindPostToggles` after every `renderPosts()` render.

- [ ] **Step 4: Add collapsed and expanded styling**

Update `style.css` so the compact header remains visually consistent with the current card, the body is separated and padded only when expanded, the chevron rotates, keyboard focus is visible, and the layout wraps safely on mobile.

- [ ] **Step 5: Run automated tests to verify GREEN**

Run: `node --test tests/post-cards.test.js`

Expected: all tests PASS with zero failures.

- [ ] **Step 6: Verify the full page locally**

Serve the repository locally and verify in a browser that all three cards start collapsed, one and then two cards can remain open, re-click collapses only the chosen card, filters still work, and desktop/mobile layouts do not overflow.

- [ ] **Step 7: Commit**

Run: `git add app.js style.css tests/post-cards.test.js docs/superpowers/specs/2026-11-08-collapsible-post-cards-design.md docs/superpowers/plans/2026-11-08-collapsible-post-cards.md && git commit -m "Add collapsible blog post cards"`
