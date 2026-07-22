# Better Bitbucket PR Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Manifest V3 Chrome extension that injects one CSS rule on `bitbucket.org` so the PR tab strip is fixed in the viewport.

**Architecture:** CSS-only content script. Chrome injects `styles.css` on matching pages. No background service worker, no JS, no options page. Extension root is the repo root (files sit next to `manifest.json`).

**Tech Stack:** Chrome Extension Manifest V3, plain CSS

**Spec:** `docs/superpowers/specs/2026-07-22-better-bitbucket-pr-tabs-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `manifest.json` | MV3 metadata + `content_scripts` match for `https://bitbucket.org/*` + CSS |
| `styles.css` | Single rule for `nav[aria-label="Pull request"] > div` |
| `sample.html` | Reference only (already exists); not loaded by the extension |

No other source files for v1.

---

### Task 1: Add `styles.css`

**Files:**
- Create: `styles.css`

- [ ] **Step 1: Create the CSS file with the exact rule from the spec**

Create `styles.css` at repo root with this full content:

```css
/* Better Bitbucket: fix PR tab strip position on bitbucket.org */
nav[aria-label="Pull request"] > div {
  position: fixed;
  z-index: 999;
  top: 75px;
  right: 30%;
}
```

- [ ] **Step 2: Verify file content**

Run (PowerShell, from repo root):

```powershell
$content = Get-Content -Raw styles.css
$checks = @(
  'nav[aria-label="Pull request"] > div',
  'position: fixed',
  'z-index: 999',
  'top: 75px',
  'right: 30%'
)
foreach ($c in $checks) {
  if ($content -notlike "*$c*") { throw "Missing: $c" }
}
Write-Host "styles.css OK"
```

Expected: `styles.css OK` (exit 0)

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: add PR tab strip fixed-position CSS"
```

---

### Task 2: Add `manifest.json`

**Files:**
- Create: `manifest.json`

- [ ] **Step 1: Create the Manifest V3 file**

Create `manifest.json` at repo root with this full content:

```json
{
  "manifest_version": 3,
  "name": "Better Bitbucket",
  "version": "1.0.0",
  "description": "Fixes Bitbucket PR tab strip position for easier navigation.",
  "content_scripts": [
    {
      "matches": ["https://bitbucket.org/*"],
      "css": ["styles.css"]
    }
  ]
}
```

- [ ] **Step 2: Verify manifest parses and references CSS**

Run (PowerShell, from repo root):

```powershell
$m = Get-Content -Raw manifest.json | ConvertFrom-Json
if ($m.manifest_version -ne 3) { throw "manifest_version must be 3" }
if ($m.name -ne "Better Bitbucket") { throw "bad name" }
if ($m.content_scripts.Count -lt 1) { throw "missing content_scripts" }
$cs = $m.content_scripts[0]
if ($cs.matches -notcontains "https://bitbucket.org/*") { throw "bad matches" }
if ($cs.css -notcontains "styles.css") { throw "css must include styles.css" }
if (-not (Test-Path styles.css)) { throw "styles.css missing" }
Write-Host "manifest.json OK"
```

Expected: `manifest.json OK` (exit 0)

- [ ] **Step 3: Commit**

```bash
git add manifest.json
git commit -m "feat: add MV3 manifest for bitbucket.org CSS injection"
```

---

### Task 3: Manual load check (human or agent with Chrome)

**Files:** none (verification only)

- [ ] **Step 1: Load unpacked**

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select repo root (`better-bitbucket`, the folder that contains `manifest.json`)
4. Confirm extension **Better Bitbucket** appears with no errors (no red error badge on the card)

Expected: Extension enabled, no "Errors" button / failed to load message.

- [ ] **Step 2: Verify on a PR page**

1. Open any PR on `https://bitbucket.org/.../pull-requests/...`
2. In DevTools Elements, find `nav[aria-label="Pull request"] > div`
3. Computed style should show `position: fixed`, `z-index: 999`, `top: 75px`, `right: 30%`
4. Visually, Overview / Files changed / Commits tabs should stay fixed while scrolling

Expected: Tabs fixed as specified. Non-PR bitbucket.org pages look unchanged.

- [ ] **Step 3: Commit nothing unless a fix was needed**

If Step 1 or 2 failed, fix the broken file, re-run Task 1/2 verification, re-test, then commit the fix with a clear message (e.g. `fix: correct content_scripts match pattern`).

If all green, no commit required for this task.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| MV3 Chrome extension | Task 2 |
| CSS-only content_scripts | Task 2 |
| Match `https://bitbucket.org/*` | Task 2 |
| Rule on `nav[aria-label="Pull request"] > div` | Task 1 |
| `position/fixed`, `z-index:999`, `top:75px`, `right:30%` | Task 1 |
| No JS / options / popup | Not added in any task |
| Manual test via Load unpacked | Task 3 |

---

## Out of scope (do not implement)

- Icons, options page, background scripts
- MutationObserver / JS re-apply
- Non-`bitbucket.org` hosts
- Chrome Web Store packaging
