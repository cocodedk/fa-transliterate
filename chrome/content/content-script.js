(() => {
  const api = window.FaTransliterator;
  if (!api || typeof api.createTransliterator !== 'function') {
    console.warn('Persian Transliterator: mapping API unavailable.');
    return;
  }

  const state = {
    enabled: false,
    customMappings: [],
    transliterator: api.createTransliterator([]),
    bypassModifierActive: false,
    origin: window.location.origin
  };

  const fieldStates = new WeakMap();
  const observedFields = new WeakSet();
  let internalMutation = false;

  const eligibleInputTypes = new Set(['', 'text', 'search', 'url', 'email', 'tel']);

  const isContentEditableField = (element) => (
    element instanceof HTMLElement && element.isContentEditable === true
  );

  const isEligibleField = (element) => {
    if (!element) {
      return false;
    }
    if (element instanceof HTMLTextAreaElement) {
      return true;
    }
    if (element instanceof HTMLInputElement) {
      const type = (element.type || '').toLowerCase();
      if (type === 'password' || type === 'number' || type === 'range') {
        return false;
      }
      return eligibleInputTypes.has(type);
    }
    if (isContentEditableField(element)) {
      return true;
    }
    return false;
  };

  const resolveEditableRoot = (node) => {
    if (!node) {
      return null;
    }
    if (node instanceof HTMLElement && isEligibleField(node)) {
      return node;
    }
    if (node instanceof Node) {
      const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      if (!element) {
        return null;
      }
      const candidate = element.closest('textarea, input, [contenteditable="true"]');
      if (candidate instanceof HTMLElement && isEligibleField(candidate)) {
        return candidate;
      }
    }
    return null;
  };

  const getFieldValue = (element) => {
    if (isContentEditableField(element)) {
      return element.textContent || '';
    }
    return typeof element.value === 'string' ? element.value : '';
  };

  const getContentEditableSelectionOffsets = (element) => {
    const doc = element.ownerDocument;
    const selection = doc.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) {
      return null;
    }

    const startRange = range.cloneRange();
    startRange.selectNodeContents(element);
    startRange.setEnd(range.startContainer, range.startOffset);
    const start = startRange.toString().length;

    const endRange = range.cloneRange();
    endRange.selectNodeContents(element);
    endRange.setEnd(range.endContainer, range.endOffset);
    const end = endRange.toString().length;

    return { start, end };
  };

  const resolveOffsetPosition = (element, offset) => {
    const doc = element.ownerDocument;
    const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();
    if (!node) {
      return { container: element, offset: 0 };
    }

    let remaining = offset;
    let lastNode = node;
    while (node) {
      const length = node.nodeValue ? node.nodeValue.length : 0;
      if (remaining <= length) {
        return { container: node, offset: remaining };
      }
      remaining -= length;
      lastNode = node;
      node = walker.nextNode();
    }

    if (lastNode) {
      const tailLength = lastNode.nodeValue ? lastNode.nodeValue.length : 0;
      return { container: lastNode, offset: tailLength };
    }

    return { container: element, offset: element.childNodes.length };
  };

  const setContentEditableSelection = (element, start, end) => {
    const doc = element.ownerDocument;
    const selection = doc.getSelection();
    if (!selection) {
      return;
    }

    const startPos = resolveOffsetPosition(element, start);
    const endPos = resolveOffsetPosition(element, end);
    const range = doc.createRange();
    try {
      range.setStart(startPos.container, startPos.offset);
      range.setEnd(endPos.container, endPos.offset);
    } catch (error) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const replaceTextInContentEditable = (element, start, end, replacement) => {
    const doc = element.ownerDocument;
    const startPos = resolveOffsetPosition(element, start);
    const endPos = resolveOffsetPosition(element, end);
    const range = doc.createRange();
    range.setStart(startPos.container, startPos.offset);
    range.setEnd(endPos.container, endPos.offset);
    range.deleteContents();
    if (replacement) {
      const textNode = doc.createTextNode(replacement);
      range.insertNode(textNode);
      range.setStart(textNode, replacement.length);
      range.collapse(true);
    }
    element.normalize();
  };

  const getSelectionOffsets = (element) => {
    if (isContentEditableField(element)) {
      return getContentEditableSelectionOffsets(element);
    }
    const value = getFieldValue(element);
    const length = value.length;
    const start = typeof element.selectionStart === 'number' ? element.selectionStart : length;
    const end = typeof element.selectionEnd === 'number' ? element.selectionEnd : length;
    return { start, end };
  };

  const setSelectionOffsets = (element, start, end) => {
    if (isContentEditableField(element)) {
      if (typeof element.focus === 'function' && element.ownerDocument.activeElement !== element) {
        element.focus({ preventScroll: true });
      }
      setContentEditableSelection(element, start, end);
      return;
    }
    const length = getFieldValue(element).length;
    const clampedStart = Math.max(0, Math.min(start, length));
    const clampedEnd = Math.max(0, Math.min(end, length));
    try {
      element.setSelectionRange(clampedStart, clampedEnd);
    } catch (error) {
      // Some input types do not support setSelectionRange; ignore.
    }
  };

  const updateFieldStateSnapshot = (element) => {
    const value = getFieldValue(element);
    const selection = getSelectionOffsets(element);
    fieldStates.set(element, {
      value,
      selectionStart: selection ? selection.start : null,
      selectionEnd: selection ? selection.end : null
    });
  };

  const computeDiff = (previousValue = '', currentValue = '') => {
    if (previousValue === currentValue) {
      return null;
    }
    const minLength = Math.min(previousValue.length, currentValue.length);
    let start = 0;
    while (start < minLength && previousValue[start] === currentValue[start]) {
      start += 1;
    }

    let prevEnd = previousValue.length - 1;
    let currEnd = currentValue.length - 1;
    while (prevEnd >= start && currEnd >= start && previousValue[prevEnd] === currentValue[currEnd]) {
      prevEnd -= 1;
      currEnd -= 1;
    }

    return {
      start,
      prevRemovedStart: start,
      prevRemovedEnd: prevEnd,
      currentEnd: currEnd
    };
  };

  const transliterateRange = (element, start, end) => {
    if (!element || !state.transliterator) {
      return false;
    }
    const value = getFieldValue(element);
    const length = value.length;
    const normalizedStart = Math.max(0, Math.min(typeof start === 'number' ? start : 0, length));
    const normalizedEnd = Math.max(0, Math.min(typeof end === 'number' ? end : length, length));
    let rangeStart = Math.min(normalizedStart, normalizedEnd);
    let rangeEnd = Math.max(normalizedStart, normalizedEnd);
    if (rangeStart === rangeEnd) {
      rangeStart = 0;
      rangeEnd = length;
    }
    const segment = value.slice(rangeStart, rangeEnd);
    if (!segment) {
      return false;
    }
    const transliterated = state.transliterator.transliterateText(segment);
    if (transliterated === segment) {
      return false;
    }
    internalMutation = true;
    try {
      if (isContentEditableField(element)) {
        replaceTextInContentEditable(element, rangeStart, rangeEnd, transliterated);
      } else {
        element.value = value.slice(0, rangeStart) + transliterated + value.slice(rangeEnd);
      }
      const caret = rangeStart + transliterated.length;
      setSelectionOffsets(element, caret, caret);
    } finally {
      internalMutation = false;
    }
    updateFieldStateSnapshot(element);
    return true;
  };

  const handleContextMenuTransliteration = () => {
    const doc = document;
    const selection = typeof doc.getSelection === 'function' ? doc.getSelection() : null;
    const activeElement = doc.activeElement instanceof HTMLElement ? resolveEditableRoot(doc.activeElement) : null;
    let target = activeElement || null;
    if (!target && selection && selection.rangeCount > 0) {
      target = resolveEditableRoot(selection.focusNode) || resolveEditableRoot(selection.anchorNode);
    }
    if (!target || !isEligibleField(target)) {
      return;
    }
    if (typeof target.focus === 'function' && doc.activeElement !== target) {
      try {
        target.focus({ preventScroll: true });
      } catch (error) {
        target.focus();
      }
    }
    const offsets = getSelectionOffsets(target);
    const start = offsets ? offsets.start : 0;
    const end = offsets ? offsets.end : getFieldValue(target).length;
    transliterateRange(target, start, end);
  };

  const applyTransliterationDiff = (element, diff) => {
    if (!diff) {
      return;
    }

    const snapshot = fieldStates.get(element) || { value: getFieldValue(element) };
    const currentValue = getFieldValue(element);
    const start = diff.start;
    const end = diff.currentEnd + 1;
    const insertedSegment = currentValue.slice(start, end);
    const transliterated = state.transliterator.transliterateText(insertedSegment);

    if (transliterated === insertedSegment) {
      return;
    }

    const previousCaret = typeof snapshot.selectionEnd === 'number' ? snapshot.selectionEnd : end;
    const delta = transliterated.length - insertedSegment.length;
    const nextCaret = Math.max(0, previousCaret + delta);

    internalMutation = true;
    try {
      if (isContentEditableField(element)) {
        replaceTextInContentEditable(element, start, end, transliterated);
        setSelectionOffsets(element, nextCaret, nextCaret);
      } else {
        const before = currentValue.slice(0, start);
        const after = currentValue.slice(end);
        element.value = before + transliterated + after;
        setSelectionOffsets(element, nextCaret, nextCaret);
      }
    } finally {
      internalMutation = false;
    }
  };

  const handleInput = (event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement || target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
      return;
    }

    if (!isEligibleField(target)) {
      return;
    }

    if (internalMutation) {
      internalMutation = false;
      updateFieldStateSnapshot(target);
      return;
    }

    if (!state.enabled || state.bypassModifierActive || event.isComposing) {
      updateFieldStateSnapshot(target);
      return;
    }

    if (!isContentEditableField(target) && (target.readOnly || target.disabled)) {
      updateFieldStateSnapshot(target);
      return;
    }

    const snapshot = fieldStates.get(target) || { value: '' };
    const currentValue = getFieldValue(target);
    const diff = computeDiff(snapshot.value, currentValue);
    if (!diff) {
      updateFieldStateSnapshot(target);
      return;
    }

    const inputType = event.inputType || '';
    if (inputType.startsWith('delete') || inputType === 'historyUndo' || inputType === 'historyRedo') {
      updateFieldStateSnapshot(target);
      return;
    }

    applyTransliterationDiff(target, diff);
    updateFieldStateSnapshot(target);
  };

  const handleKeyDown = (event) => {
    state.bypassModifierActive = event.ctrlKey || event.metaKey || event.altKey;
  };

  const handleKeyUp = (event) => {
    state.bypassModifierActive = event.ctrlKey || event.metaKey || event.altKey;
  };

  const attachToField = (candidate) => {
    const element = resolveEditableRoot(candidate);
    if (!element || observedFields.has(element)) {
      return;
    }
    element.addEventListener('input', handleInput, true);
    element.addEventListener('focus', () => updateFieldStateSnapshot(element), true);
    element.addEventListener('blur', () => updateFieldStateSnapshot(element), true);
    observedFields.add(element);
    updateFieldStateSnapshot(element);
  };

  const scanForFields = () => {
    const maybeFields = document.querySelectorAll('input, textarea, [contenteditable="true"]');
    maybeFields.forEach((element) => attachToField(element));
  };

  const applySettings = ({ enabled, settings }) => {
    state.enabled = Boolean(enabled);
    const custom = settings && Array.isArray(settings.customMappings) ? settings.customMappings : [];
    state.customMappings = custom;
    state.transliterator = api.createTransliterator(custom);
  };

  document.addEventListener('focusin', (event) => {
    const root = resolveEditableRoot(event.target);
    if (root) {
      attachToField(root);
    }
  }, true);

  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keyup', handleKeyUp, true);

  const init = () => {
    scanForFields();
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS', origin: state.origin }, (response) => {
      if (chrome.runtime.lastError) {
        return;
      }
      if (response && response.ok && response.result) {
        applySettings(response.result);
      }
    });
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || !message.type) {
      return;
    }
    if (message.type === 'SETTINGS_SYNC') {
      applySettings({ enabled: message.enabled, settings: message.settings });
      return;
    }
    if (message.type === 'CONTEXT_TRANSLITERATE_SELECTION') {
      handleContextMenuTransliteration();
    }
  });

  init();
})();
