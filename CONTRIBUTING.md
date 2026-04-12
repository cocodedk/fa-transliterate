# Contributing to Persian Transliterator

## Local Setup
1. Install Google Chrome 116 or later.
2. Clone the repository.
3. Load the extension from the `chrome/` directory via `chrome://extensions/` → **Load unpacked**.

## Install Git Hooks
```sh
./scripts/install-hooks.sh
```

## Build and Test Commands
```sh
# Validate manifest
python3 -m json.tool chrome/manifest.json

# Load unpacked in Chrome for manual testing
# Open chrome://extensions/ → Developer mode → Load unpacked → select chrome/
```

## Local Git Setup
Run these once after cloning:
```bash
git config pull.rebase true
git config core.autocrlf input
git config push.autoSetupRemote true
git config init.defaultBranch main
```

## Coding Style
- Keep JavaScript files small and focused (200-line maximum per file).
- Use ES modules and standard Chrome extension APIs.
- No external dependencies — offline operation only.

## Branch Naming
| Prefix | Type | Example |
|--------|------|---------|
| `feature/` | `feat:` | `feature/add-mapping-export` |
| `fix/` | `fix:` | `fix/caret-position-bug` |
| `chore/` | `chore:` | `chore/update-dependencies` |
| `docs/` | `docs:` | `docs/update-contributing` |
| `refactor/` | `refactor:` | `refactor/extract-transliterator` |
| `ci/` | `ci:` | `ci/add-dependabot` |

## PR Checklist
- [ ] `chrome/manifest.json` is valid JSON.
- [ ] Manual test completed in Chrome with the extension loaded unpacked.
- [ ] Updated docs if behavior changed.
- [ ] Commit message follows Conventional Commits (`feat: ...`, `fix: ...`, etc.).
