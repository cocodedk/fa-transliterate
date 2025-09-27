# Technical Architecture

## Architecture Overview
- **Manifest V3** extension using a service worker background script for lifecycle efficiency
- **Content Script** injected into editable pages, managing key events and DOM manipulation
- **Transliteration Engine** as a shared module used by both content script and tests
- **Options Page** for configuration management (built with vanilla JS/TS or lightweight framework)
- **Storage Layer** using `chrome.storage.sync` with schema validation
- **Communication** via `chrome.runtime.sendMessage` or `chrome.storage` listeners for state updates

## Future Expansion
- Abstract browser APIs to prep for Firefox (`browser.*`) compatibility

## Data Structures & Algorithm Notes

### Mapping Storage
- Maintain ordered mapping list (longest patterns first) compiled into a trie for efficient lookup
- Support for custom mapping overrides and user preferences

### Caret Management
- Track caret positions using `selectionStart`/`selectionEnd` with adjustment after replacements
- Implement tokenizer that processes buffered Latin input and emits Persian characters incrementally
- Provide fallback plain-text paths when the field does not support `selectionStart` (e.g., contentEditable)

### Performance Optimization
- Use efficient data structures for pattern matching
- Minimize DOM manipulation overhead
- Implement debouncing for rapid keystroke sequences

## Component Responsibilities

### Background Script (Service Worker)
- Manage extension lifecycle
- Handle global state changes
- Coordinate between different tabs

### Content Script
- Inject into web pages
- Capture keyboard events
- Apply transliteration logic
- Manage DOM updates

### Transliteration Engine
- Core mapping logic
- Pattern matching algorithms
- Character conversion rules
- Custom mapping support

### Options Page
- User configuration interface
- Mapping customization
- Settings persistence
- Import/export functionality
