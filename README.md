# Persian Transliterator

Persian Transliterator helps you type Persian (Farsi) text on Latin keyboards. While you type in web inputs, the extension converts Latin character sequences into their Persian equivalents using an ordered mapping that favors intuitive phonetics. You can enable or disable transliteration globally or per site, and tailor the character mapping to match your personal typing style.

## Website
- [English](https://cocodedk.github.io/fa-transliterate/)
- [فارسی (Persian)](https://cocodedk.github.io/fa-transliterate/fa/)

## Features
- Real-time Latin → Persian transliteration in standard text fields
- On-demand right-click context menu to transliterate the current selection
- Global and per-site toggles with a badge that reflects the current state
- Modifier-key bypass (Ctrl/Alt/⌘) to momentarily pass Latin characters through
- Custom mapping editor with validation and automatic ordering
- Offline operation — no data ever leaves the browser

## Download
[**Download fa-transliterate**](https://github.com/cocodedk/fa-transliterate/releases/latest/download/fa-transliterate.zip)

## Build from Source
**Prerequisites:** Google Chrome 116 or later.

```bash
git clone https://github.com/cocodedk/fa-transliterate.git
cd fa-transliterate
./scripts/install-hooks.sh
```

Load the extension:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `chrome/` directory

No build step required — the extension runs directly from source.

## Architecture

```
fa-transliterate/
├── chrome/                  ← Extension source (load this in Chrome)
│   ├── manifest.json        ← MV3 manifest
│   ├── background.js        ← Service worker
│   ├── content/             ← Content scripts
│   ├── scripts/             ← Transliteration engine
│   └── ui/                  ← Popup and options UI
├── website/                 ← GitHub Pages site
├── .github/workflows/       ← CI, release, and Pages automation
└── 0-docs/                  ← Design documents
```

| Component | Technology |
|-----------|-----------|
| Extension runtime | Chrome MV3 |
| Language | JavaScript (ES2020+) |
| Storage | `chrome.storage.sync` |
| Build | None required |

## Author

**Babak Bandpey** — [cocode.dk](https://cocode.dk) | [LinkedIn](https://linkedin.com/in/babakbandpey) | [GitHub](https://github.com/cocodedk)

## License

Apache-2.0 | © 2026 [Cocode](https://cocode.dk) | Created by [Babak Bandpey](https://linkedin.com/in/babakbandpey)
