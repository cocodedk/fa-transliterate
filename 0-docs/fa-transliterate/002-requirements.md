# Requirements: Persian Transliteration Chrome Extension

## Functional Requirements

### Activation & Scope
- Provide browser action (toolbar button) to toggle transliteration globally
- Offer per-tab/per-site toggles stored in sync storage for persistence
- Inject content scripts into active tabs when enabled

### Input Handling
- Capture keyboard events in targeted fields without breaking native shortcuts
- Apply transliteration after each keystroke while keeping caret position stable
- Support backspace/delete semantics aligned with transliterated output

### Transliteration Logic
- Support multi-character lookahead (e.g., `sh` → `ش`, `kh` → `خ`)
- Prioritize longest matching Latin sequences to avoid premature conversions
- Provide deterministic mapping for ambiguous sounds

### User Customization
- Settings UI for enabling/disabling specific mappings and defining custom pairs
- Option to choose between strict and phonetic transliteration modes

### Feedback & State
- Visual indicator (icon badge) showing current mode (on/off/paused)
- Display onboarding tooltip to explain default key bindings

### Persistence & Sync
- Default configuration stored locally; user overrides synced via `chrome.storage.sync` with fallback to local

### Accessibility
- Respect screen reader interactions; avoid altering non-text inputs
- Provide accessible status messages describing mode changes

## Non-Functional Requirements

### Performance
- Keypress handling must complete <4 ms on average to feel instantaneous

### Reliability
- Ensure transliteration does not corrupt existing text; maintain undo stack integrity

### Compatibility
- Support Chrome 116+ on Windows/macOS/Linux; test on Chromium Edge

### Privacy & Security
- No network calls; operate on-page only; do not persist actual input text

### Localization
- UI available in English initially; plan for Persian localization once copy stabilizes

## User Experience Guidelines
- Toolbar popup with clear enable/disable switch and quick tips
- Inline hint (fade-out) in active input when the extension toggles on
- Offer keyboard shortcut (e.g., `Ctrl+Shift+.`) to toggle transliteration in the focused field
- When paused, temporarily pass Latin characters through without conversion and show icon change
