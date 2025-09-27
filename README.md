# Persian Transliterator Chrome Extension

Persian Transliterator helps you type Persian (Farsi) text on Latin keyboards. While you type in web inputs, the extension converts Latin character sequences into their Persian equivalents using an ordered mapping that favors intuitive phonetics. You can enable or disable transliteration globally or per site, and tailor the character mapping to match your personal typing style.

## Features
- Real-time Latin → Persian transliteration in standard text fields.
- Global and per-site toggles with a badge that reflects the current state.
- Modifier-key bypass (Ctrl/Alt/⌘) to momentarily pass Latin characters through.
- Custom mapping editor with validation and automatic ordering.
- Offline operation with no data ever leaving the browser.

## Requirements
- Google Chrome 116 or later (Chromium-based browsers such as Microsoft Edge should also work).

## Installation
1. Clone or download this repository to your machine.
   ```bash
   git clone <repo-url>
   cd fa-transliterate
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** in the top-right corner if it is not already enabled.
4. Click **Load unpacked** and select the `chrome/` directory from this project.
5. The extension should appear in your toolbar with the Persian Transliterator icon.

## Usage
1. **Enable transliteration**
   - Click the toolbar icon to reveal the popup.
   - Use the **Enable globally** switch to turn the transliterator on or off everywhere.
   - When global mode is on, optionally toggle **Enable on this site** to override the behavior for the active origin.
2. **Type in supported fields**
   - Focus any standard `<input>` or `<textarea>` element (search, URL, email, tel, or plain text inputs are supported).
   - Type using Latin letters; the text will convert to Persian as you type.
   - Hold **Ctrl**, **Alt**, or **⌘** while typing to temporarily bypass conversion for individual characters.
3. **Observe status cues**
   - The action badge displays `ON` when transliteration is active for the current tab.
   - The popup shows context-specific status messages (active, disabled globally, or disabled for the current site).

## Customizing Mappings
1. Open the extension options (from the popup select **Customize mappings**, or visit `chrome://extensions/` → **Details** → **Extension options**).
2. Review the default Latin → Persian mapping reference table.
3. Add or update custom pairs using the form at the top. Latin entries accept lowercase `a–z`, hyphen (`-`), apostrophe (`'`), and backtick (`` ` ``); Persian values accept any text you type.
4. Click **Add / Update** to persist your changes. Custom entries override defaults and sync automatically.

## Development Notes
- The Transliteration engine lives in `chrome/scripts/transliterator.js` and exposes helper functions for testing or reuse.
- Content scripts (`chrome/content/content-script.js`) perform diff-based replacements to preserve caret position and undo/redo behavior.
- Settings are stored with `chrome.storage.sync` so they roam across Chrome profiles where syncing is enabled.
- Icons are located in `chrome/assets/` and referenced from `chrome/manifest.json`.

## Testing Checklist
- Verify typing and backspace behaviour in standard inputs (e.g., Gmail compose, Google Docs, Telegram Web).
- Confirm modifier-key bypass, undo/redo, and clipboard paste interactions.
- Check per-site overrides by disabling on a specific domain while keeping global mode on.
- Validate that custom mappings appear in active tabs without requiring a page reload.

## Feedback and Contributions
Issues, feature requests, and contributions are welcome. Please document new mappings and update relevant docs (e.g., `0-docs/drp.md`) when extending functionality.
