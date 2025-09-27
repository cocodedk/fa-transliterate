# Context: Persian Transliteration Chrome Extension

## Purpose & Scope
- Chrome-first browser extension converting Latin-script input to Persian (Farsi) characters in real time
- Target web text inputs (`<input>` and `<textarea>` elements)
- Architecture extensible to content-editable fields and other Chromium-based browsers
- Reliable, configurable Latin-to-Persian transliteration for conversational and formal writing

## Goals
- Accurate transliteration for common Persian phonemes using approachable Latin sequences
- Smooth typing experience: minimal latency, predictable behavior, undo support
- Easy enable/disable toggle per page + global on/off control
- Offline operation with no external network dependency
- Foundational codebase for future Firefox/Safari support

## Non-Goals (Initial Release)
- Full IME replacement across the OS
- Spell checking, grammar correction, or diacritic suggestion
- Transliteration for numerals or punctuation beyond standard Persian symbols
- Right-to-left layout fixes outside of editable fields

## Stakeholders & Personas
- **Primary User:** Persian speakers comfortable with Latin keyboards wanting quick Persian typing on web platforms
- **Secondary User:** Bilingual professionals handling Persian communications without Persian keyboard layouts
- **Product Owner:** Defines mapping conventions and usability expectations
- **Engineering Team:** 1-2 developers responsible for extension implementation, QA, and publication

## User Stories
- As a user, I can toggle the extension on a page and immediately see my Latin typing appear in Persian
- As a user, I can temporarily bypass transliteration (e.g., with a modifier key) to enter Latin characters when needed
- As a user, I can customize certain transliteration pairs to match my typing habits
- As a user, I can rely on undo/redo and cursor navigation behaving normally after transliteration occurs
- As a user, I can trust that sensitive data never leaves the browser
