# CLAUDE.md — Persian Transliterator (fa-transliterate)

## Project Overview

Persian Transliterator is a Chrome Manifest V3 extension that converts Latin keyboard input to Persian (Farsi) characters in real time across standard web inputs. It operates entirely offline — no data ever leaves the browser.

- **Language / Runtime**: JavaScript (ES2020+), Chrome Extension APIs (MV3)
- **Framework**: Vanilla JS, no build step required
- **Architecture**: Chrome Extension (background service worker + content scripts + popup UI)
- **Extension ID**: Set at load time by Chrome

---

## Required Skills — ALWAYS Invoke These

These skills **must** be invoked when the relevant situation arises. Never skip them.

| Situation | Skill |
|-----------|-------|
| Before any new feature or screen | `superpowers:brainstorming` |
| Planning multi-step changes | `superpowers:writing-plans` |
| Writing or fixing core logic | `superpowers:test-driven-development` |
| First sign of a bug or failure | `superpowers:systematic-debugging` |
| Before completing a feature branch | `superpowers:requesting-code-review` |
| Before claiming any task done | `superpowers:verification-before-completion` |
| Working on UI / frontend | `frontend-design:frontend-design` |
| After implementing — reviewing quality | `simplify` |

---

## Architecture

```
fa-transliterate/
├── chrome/                  ← Extension source (load this directory in Chrome)
│   ├── manifest.json        ← MV3 manifest — extension metadata and permissions
│   ├── background.js        ← Service worker — context menus, badge management
│   ├── content/
│   │   └── content-script.js ← Injected into pages — intercepts keypresses
│   ├── scripts/
│   │   └── transliterator.js ← Core transliteration engine (shared)
│   ├── ui/
│   │   ├── popup.html/js    ← Toolbar popup
│   │   └── options.html/js  ← Extension options page
│   └── assets/              ← Icons (16/32/48/128px PNG)
├── 0-docs/                  ← Design documents and mapping reference
├── .githooks/               ← Pre-commit and commit-msg hooks
├── scripts/                 ← Repo management scripts
└── website/                 ← GitHub Pages site (English + Persian)
```

### Layer Rules
- `transliterator.js` must remain pure — no Chrome API calls, no side effects
- `content-script.js` handles DOM interaction only; delegates transliteration to `transliterator.js`
- `background.js` handles extension lifecycle (install, context menus, badge updates)

---

## Coding Conventions

- [ ] All functions are **pure** where possible — no hidden side effects
- [ ] No external dependencies — offline operation only
- [ ] Chrome APIs used sparingly; prefer `chrome.storage.sync` for settings
- [ ] No hardcoded strings — use constants for mapping keys
- [ ] 200-line maximum per file — extract helpers when approaching the limit

---

## Engineering Principles

### File Size
- **200-line maximum per file** — extract a function or module when approaching the limit

### DRY · SOLID · KISS · YAGNI
- Extract shared logic into named utilities; never copy-paste
- Single Responsibility: one file does one thing
- Don't add features not yet needed
- Delete dead code immediately

### TDD
- Write the failing test first, make it pass, then refactor
- Test names describe behaviour: `"should convert 'sh' to 'ش'"`
- One assertion per test — keep tests focused and readable

### Commit hygiene
- Follow Conventional Commits: `feat: ...` / `fix: ...` / `chore: ...`
- The `commit-msg` hook enforces this automatically

---

## Build Commands

```bash
python3 -m json.tool chrome/manifest.json   # Validate manifest JSON
# Load unpacked extension: chrome://extensions/ → Developer mode → Load unpacked → select chrome/
# No build step required — extension runs directly from source
```

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — project conventions and session startup |
| `version.txt` | Semantic version (MAJOR.MINOR.PATCH) |
| `chrome/manifest.json` | Extension manifest — permissions, version, entry points |
| `chrome/scripts/transliterator.js` | Core transliteration engine |
| `.github/workflows/` | CI, release, and Pages automation |
| `.githooks/` | Pre-commit and commit-msg hooks |
| `scripts/install-hooks.sh` | One-time hook installer |

---

## Starting a New Session

1. Read this file
2. Run `python3 -m json.tool chrome/manifest.json` to confirm manifest is valid
3. Invoke `superpowers:brainstorming` before touching any feature
4. Follow the Required Skills table — every skill is mandatory, not optional
