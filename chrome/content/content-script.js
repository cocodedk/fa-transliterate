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

  const isEligibleField = (element) => {
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
    return false;
  };

  const updateFieldStateSnapshot = (element) => {
    fieldStates.set(element, {
      value: element.value,
      selectionStart: element.selectionStart,
      selectionEnd: element.selectionEnd
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

  const applyTransliterationDiff = (element, diff) => {
    if (!diff) {
      return;
    }
    const snapshot = fieldStates.get(element);
    const previousValue = snapshot ? snapshot.value : '';
    const currentValue = element.value;

    const start = diff.start;
    const insertedSegment = currentValue.slice(start, diff.currentEnd + 1);
    const transliterated = state.transliterator.transliterateText(insertedSegment);
    if (transliterated === insertedSegment) {
      return;
    }

    const before = currentValue.slice(0, start);
    const after = currentValue.slice(diff.currentEnd + 1);
    const updatedValue = before + transliterated + after;

    const previousCaret = element.selectionStart;
    const delta = transliterated.length - insertedSegment.length;

    internalMutation = true;
    element.value = updatedValue;

    if (typeof previousCaret === 'number') {
      const adjustedCaret = previousCaret + delta;
      element.setSelectionRange(adjustedCaret, adjustedCaret);
    }

    // Update snapshot after mutation.
    updateFieldStateSnapshot(element);
    internalMutation = false;
  };

  const handleInput = (event) => {
    const target = event.target;
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

    if (target.readOnly || target.disabled) {
      updateFieldStateSnapshot(target);
      return;
    }

    const snapshot = fieldStates.get(target) || { value: '' };
    const diff = computeDiff(snapshot.value, target.value);
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

  const attachToField = (element) => {
    if (observedFields.has(element) || !isEligibleField(element)) {
      return;
    }
    element.addEventListener('input', handleInput, true);
    element.addEventListener('focus', () => updateFieldStateSnapshot(element), true);
    element.addEventListener('blur', () => updateFieldStateSnapshot(element), true);
    observedFields.add(element);
    updateFieldStateSnapshot(element);
  };

  const scanForFields = () => {
    const maybeFields = document.querySelectorAll('input, textarea');
    maybeFields.forEach((element) => attachToField(element));
  };

  const applySettings = ({ enabled, settings }) => {
    state.enabled = Boolean(enabled);
    const custom = settings && Array.isArray(settings.customMappings) ? settings.customMappings : [];
    state.customMappings = custom;
    state.transliterator = api.createTransliterator(custom);
  };

  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      attachToField(target);
    }
  }, true);

  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keyup', handleKeyUp, true);

  const init = async () => {
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
    if (!message || message.type !== 'SETTINGS_SYNC') {
      return;
    }
    applySettings({ enabled: message.enabled, settings: message.settings });
  });

  init();
})();
