# Facebook Hide "No More Stories Found" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `https://www.facebook.com/*`, hide any direct `body` child whose text contains `No More Stories Found`, including nodes that appear later.

**Architecture:** MV3 content script under `sites/facebook/`. One scan function hides matching direct children with `display: none !important`. A `MutationObserver` on `body` (`childList`, no subtree) re-runs the scan. Manifest registers the script for www.facebook.com only.

**Tech Stack:** Chrome Extension Manifest V3, plain JavaScript (no build step)

**Spec:** `docs/superpowers/specs/2026-07-22-facebook-hide-no-more-stories-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `sites/facebook/hide-no-more-stories.js` | Scan body children, hide matches, observe `body` for new children |
| `manifest.json` | Add Facebook `content_scripts` entry; bump version to `1.1.1`; optional description tweak |

No CSS file. Bitbucket entry stays unchanged.

---

### Task 1: Add Facebook content script

**Files:**
- Create: `sites/facebook/hide-no-more-stories.js`

- [ ] **Step 1: Create the content script**

Create `sites/facebook/hide-no-more-stories.js` with this full content:

```js
// Facebook: hide body-level "No More Stories Found" banner when it appears
(function () {
  const PHRASE = "No More Stories Found";

  function hideMatches(body) {
    for (const el of body.children) {
      if (el.textContent && el.textContent.includes(PHRASE)) {
        el.style.setProperty("display", "none", "important");
      }
    }
  }

  function start(body) {
    hideMatches(body);
    new MutationObserver(() => hideMatches(body)).observe(body, {
      childList: true,
      subtree: false,
    });
  }

  if (document.body) {
    start(document.body);
  } else {
    document.addEventListener("DOMContentLoaded", () => start(document.body), {
      once: true,
    });
  }
})();
```

- [ ] **Step 2: Verify file content**

Run (PowerShell, from repo root):

```powershell
$path = "sites/facebook/hide-no-more-stories.js"
if (-not (Test-Path $path)) { throw "Missing $path" }
$content = Get-Content -Raw $path
$checks = @(
  'No More Stories Found',
  'display',
  'none',
  'important',
  'MutationObserver',
  'childList: true',
  'subtree: false',
  'body.children',
  'includes(PHRASE)',
  'DOMContentLoaded'
)
foreach ($c in $checks) {
  if ($content -notlike "*$c*") { throw "Missing: $c" }
}
Write-Host "hide-no-more-stories.js OK"
```

Expected: `hide-no-more-stories.js OK` (exit 0)

- [ ] **Step 3: Commit**

```bash
git add sites/facebook/hide-no-more-stories.js
git commit -m "feat: hide Facebook No More Stories body banner"
```

---

### Task 2: Register script in manifest + bump version

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1: Update manifest.json to this full content**

Replace `manifest.json` entirely with:

```json
{
  "manifest_version": 3,
  "name": "Style Script Injector",
  "version": "1.1.1",
  "description": "Inject per-site CSS/JS. Bitbucket PR tabs; Facebook hide No More Stories.",
  "icons": {
    "16": "icon.png",
    "48": "icon.png",
    "128": "icon.png"
  },
  "content_scripts": [
    {
      "matches": ["https://bitbucket.org/*"],
      "css": ["sites/bitbucket/styles.css"]
    },
    {
      "matches": ["https://www.facebook.com/*"],
      "js": ["sites/facebook/hide-no-more-stories.js"]
    }
  ]
}
```

- [ ] **Step 2: Verify manifest**

Run (PowerShell, from repo root):

```powershell
$m = Get-Content -Raw manifest.json | ConvertFrom-Json
if ($m.version -ne "1.1.1") { throw "version expected 1.1.1, got $($m.version)" }
if ($m.content_scripts.Count -lt 2) { throw "expected 2 content_scripts entries" }
$fb = $m.content_scripts | Where-Object { $_.matches -contains "https://www.facebook.com/*" }
if (-not $fb) { throw "missing facebook matches" }
if ($fb.js -notcontains "sites/facebook/hide-no-more-stories.js") {
  throw "missing facebook js path"
}
$bb = $m.content_scripts | Where-Object { $_.matches -contains "https://bitbucket.org/*" }
if (-not $bb) { throw "bitbucket entry missing" }
if ($bb.css -notcontains "sites/bitbucket/styles.css") {
  throw "bitbucket css path wrong"
}
Write-Host "manifest.json OK"
```

Expected: `manifest.json OK` (exit 0)

- [ ] **Step 3: Commit**

```bash
git add manifest.json
git commit -m "feat: register Facebook content script in manifest"
```

---

### Task 3: Manual verification checklist

**Files:** none (runtime check only)

- [ ] **Step 1: Load extension in Chrome**

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select repo root (`Style-Script-Injector`)
4. Confirm version shows **1.1.1** and no errors

- [ ] **Step 2: Smoke-test hide on www.facebook.com**

1. Open `https://www.facebook.com/` (logged in is fine)
2. Open DevTools Console, run:

```js
const el = document.createElement("div");
el.id = "ssi-test-no-more-stories";
el.textContent = "No More Stories Found";
document.body.appendChild(el);
getComputedStyle(el).display === "none";
```

Expected: expression returns `true` (node hidden)

3. Re-inject path (observer):

```js
document.getElementById("ssi-test-no-more-stories")?.remove();
const el2 = document.createElement("div");
el2.id = "ssi-test-no-more-stories-2";
el2.textContent = "No More Stories Found";
document.body.appendChild(el2);
getComputedStyle(el2).display === "none";
```

Expected: `true`

4. Non-match stays visible:

```js
const ok = document.createElement("div");
ok.id = "ssi-test-ok";
ok.textContent = "unrelated body child";
document.body.appendChild(ok);
getComputedStyle(ok).display !== "none";
```

Expected: `true`

5. Cleanup:

```js
["ssi-test-no-more-stories", "ssi-test-no-more-stories-2", "ssi-test-ok"]
  .forEach((id) => document.getElementById(id)?.remove());
```

- [ ] **Step 3: Bitbucket regression smoke**

1. Open any Bitbucket PR page
2. Confirm PR tab strip CSS still applies (fixed strip behavior unchanged)
3. No console errors from missing Facebook script on Bitbucket

- [ ] **Step 4: Final status (no extra commit unless fixes needed)**

If any step failed, fix in the relevant file, re-run the PowerShell checks from Tasks 1–2, re-test, and commit with a `fix:` message. If all passed, plan is done.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Hide with `display: none !important` | Task 1 |
| Keep watching (MutationObserver) | Task 1 |
| `https://www.facebook.com/*` only | Task 2 |
| Direct `body` children only | Task 1 (`body.children`, `subtree: false`) |
| Text includes `"No More Stories Found"` | Task 1 |
| No remove-from-DOM | Task 1 (style only) |
| Body missing → wait DOMContentLoaded | Task 1 |
| Version bump | Task 2 |
| Bitbucket unchanged | Task 2 + Task 3 |
| Manual inject/re-inject/non-match tests | Task 3 |

No automated unit test harness (spec: none required). Verification = PowerShell content checks + DevTools manual steps.
