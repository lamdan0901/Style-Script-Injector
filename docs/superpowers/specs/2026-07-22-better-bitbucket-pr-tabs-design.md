# Better Bitbucket — PR tabs fixed position (Chrome extension)

**Date:** 2026-07-22  
**Status:** Approved design  
**Scope:** v1 — one CSS tweak only

## Problem

On Bitbucket Cloud PR pages, the pull-request tab strip (`Overview` / `Files changed` / `Commits`) sits in a layout that is hard to use. The desired UX is a fixed, high-z-index tab bar in a stable screen position.

## Goal

Ship a minimal Chrome extension that applies a single CSS rule on `bitbucket.org` so the tablist under the Pull request nav is fixed in the viewport.

## Non-goals (v1)

- No options page, toggles, or settings UI
- No JavaScript content scripts
- No MutationObserver / SPA re-apply logic
- No support for self-hosted Bitbucket or non-`bitbucket.org` hosts
- No additional UI polish beyond this one rule
- No store packaging / publishing pipeline

## Approach

**Manifest V3** extension using `content_scripts` CSS injection only.

Chrome loads the CSS file on matching documents. No background worker required for v1.

## Files

| File | Role |
|------|------|
| `manifest.json` | MV3 manifest: name, version, `content_scripts` match + CSS |
| `styles.css` | The single style rule |

Optional later (not v1): icons, description polish only if needed for load-unpacked UX.

## Host match

```text
https://bitbucket.org/*
```

## Selector and styles

Target: direct child `div` of `nav[aria-label="Pull request"]` (the `role="tablist"` container observed in `sample.html`).

```css
nav[aria-label="Pull request"] > div {
  position: fixed;
  z-index: 999;
  top: 75px;
  right: 30%;
}
```

Selector uses stable accessibility attributes / structure, not Atlassian’s hashed class names (those change often).

## Data flow

1. User opens `https://bitbucket.org/.../pull-requests/...`
2. Chrome injects `styles.css` into the page
3. Matching element gets fixed positioning

No messaging, storage, or permissions beyond what content-script CSS requires (none extra).

## Error / edge cases

| Case | Behavior |
|------|----------|
| Non-PR pages | Selector matches nothing; no visual change |
| Bitbucket renames `aria-label` or DOM depth | Style stops applying; fix is update selector |
| SPA navigations within bitbucket.org | CSS remains injected for the document; rule still applies if DOM matches |
| Inline styles on the element | Author CSS vs inline: if Bitbucket sets stronger inline styles, extension may lose; revisit only if observed |

## Testing

Manual only for v1:

1. `chrome://extensions` → Developer mode → Load unpacked → repo root (or extension folder root)
2. Open a PR on bitbucket.org
3. Confirm tab strip is fixed at roughly `top: 75px`, `right: 30%`, above other content (`z-index: 999`)

## Install / use

1. Load unpacked from the extension directory
2. Visit bitbucket.org PR pages
3. No popup interaction required

## Future (out of scope until requested)

- More CSS tweaks in the same file
- Options toggles
- JS + observer if DOM fights the CSS

## Decision summary

| Decision | Choice |
|----------|--------|
| Product shape | Chrome extension (MV3) |
| v1 feature set | One CSS rule |
| Host | `bitbucket.org` only |
| Injection | `content_scripts` + CSS file |
| Selector base | `nav[aria-label="Pull request"] > div` |
| JS | None |
