# Collapsible Post Cards Design

## Intent

Make the blog log list easy to scan by hiding long descriptions and code until a visitor chooses a post.

## Goals

- Every post starts collapsed and shows only category, date, XP, title, and an expand indicator.
- Clicking a post header reveals that post's description and code.
- Clicking the same header again collapses it.
- Posts expand independently, so several posts may remain open at once.
- Keyboard activation and `aria-expanded` state remain accessible.
- All existing posts, filters, stats, XP, heatmap, and ordering remain unchanged.

## Non-goals

- No changes to `posts.json` or existing post content.
- No separate post pages, search feature, or backend.

## Approaches considered

- Single-open accordion: keeps only one post open, but closes content the visitor may want to compare.
- Independent expansion (selected): every post starts collapsed, and visitors control which posts stay open.
- Separate post pages: clean listing but unnecessary navigation and complexity for this static site.

## Implementation direction

Render each card with an accessible button header and a hidden content region. A small click handler toggles only the selected card. CSS provides compact collapsed cards, a rotating indicator, and visible expanded content on desktop and mobile.
