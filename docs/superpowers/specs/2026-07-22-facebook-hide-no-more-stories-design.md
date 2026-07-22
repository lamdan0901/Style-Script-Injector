# Facebook: Hide "No More Stories Found" — Design

**Date:** 2026-07-22  
**Status:** Approved  
**Extension:** Style Script Injector (MV3)

## Problem

On `https://www.facebook.com/*`, a UI element sometimes appears as a **direct child of `document.body`** containing the text **`No More Stories Found`**. It does not always show immediately and can appear/disappear over the session. Goal: keep it from being visible whenever it is present.

## Goals

- Hide matching nodes with `display: none !important` (do not remove from DOM).
- Keep watching so re-injection or re-show is also hidden.
- Scope only to `https://www.facebook.com/*`.
- Match only **direct children of `body`** whose `textContent` includes the exact phrase `No More Stories Found` (case-sensitive).

## Non-goals

- Other Facebook hosts (`m.facebook.com`, bare `facebook.com`, etc.).
- Removing nodes from the DOM.
- General feed cleanup, ad blocking, or other UI tweaks.
- Stable CSS selector by class/id (FB class names are unstable; text match is the contract).

## Approach (chosen)

**Content script + `MutationObserver` on `body`.**

CSS alone cannot select by text content. Polling works but is wasteful. Observer on `body` with `childList` is the smallest reliable approach for appear/disappear cycles.

## Architecture

Follow existing multi-site layout:

| Piece | Role |
|-------|------|
| `sites/facebook/hide-no-more-stories.js` | Content script: scan + hide + observe |
| `manifest.json` | Register match + JS for www.facebook.com |

No CSS file. Hide via inline style with `!important` so FB styles cannot easily override.

### Runtime behavior

1. When the content script runs (document already has `body`, or wait until `body` exists):
   - Scan `document.body` **direct children**.
   - If `el.textContent` includes `"No More Stories Found"`, call  
     `el.style.setProperty("display", "none", "important")`.
2. Attach `MutationObserver` to `document.body` with `{ childList: true, subtree: false }`.
3. On each mutation batch, re-scan direct children and hide matches (idempotent if already hidden).
4. Observer stays for the page lifetime; no disconnect.

### Match rules

- **Host:** `https://www.facebook.com/*` only (manifest `matches`).
- **DOM:** `body` element’s `children` only (not descendants deeper than one level).
- **Text:** substring match on `textContent` for `"No More Stories Found"` (case-sensitive).
- **Action:** hide only; do not change other attributes or remove the node.

## Manifest change

Add a content_scripts entry:

```json
{
  "matches": ["https://www.facebook.com/*"],
  "js": ["sites/facebook/hide-no-more-stories.js"]
}
```

Keep existing Bitbucket CSS entry unchanged. Bump extension `version` patch (e.g. `1.1.0` → `1.1.1`) so reloads are obvious.

## Error handling

- If `document.body` is missing at script start, wait for `DOMContentLoaded` or observe `document.documentElement` until `body` appears, then start the body observer.
- No network; no permissions beyond content script injection on the match pattern.
- Failures are silent (console optional for debug; not required for v1).

## Testing

Manual / DevTools on www.facebook.com:

1. Inject a temporary direct child:  
   `document.body.appendChild(Object.assign(document.createElement("div"), { textContent: "No More Stories Found" }))`  
   → node must become `display: none`.
2. Remove it and append again → must hide again (observer path).
3. Append a sibling without that text → must stay visible.
4. Confirm Bitbucket injection still works (no regression).

No automated browser test suite required for this small change.

## Implementation notes (ponytail)

- One small JS file + one manifest entry. No abstractions, no config, no options UI.
- Prefer one scan function called from initial pass and from the observer.
- Do not use `subtree: true` unless direct-child scope proves wrong in practice.
