(() => {
  const DEFAULT_MAPPINGS = [
    { latin: 'ghr', persian: 'ق' },
    { latin: 'sh', persian: 'ش' },
    { latin: 'kh', persian: 'خ' },
    { latin: 'ch', persian: 'چ' },
    { latin: 'zh', persian: 'ژ' },
    { latin: 'gh', persian: 'غ' },
    { latin: 'ss', persian: 'ص' },
    { latin: 'zz', persian: 'ظ' },
    { latin: 'th', persian: 'ث' },
    { latin: 'ou', persian: 'او' },
    { latin: 'ee', persian: 'ای' },
    { latin: 'ai', persian: 'ای' },
    { latin: 'ei', persian: 'ای' },
    { latin: 'aa', persian: 'آ' },
    { latin: 'a', persian: 'ا' },
    { latin: 'b', persian: 'ب' },
    { latin: 'p', persian: 'پ' },
    { latin: 't', persian: 'ت' },
    { latin: 's', persian: 'س' },
    { latin: 'j', persian: 'ج' },
    { latin: 'h', persian: 'ه' },
    { latin: 'd', persian: 'د' },
    { latin: 'z', persian: 'ز' },
    { latin: 'r', persian: 'ر' },
    { latin: 'q', persian: 'ق' },
    { latin: 'f', persian: 'ف' },
    { latin: 'k', persian: 'ک' },
    { latin: 'g', persian: 'گ' },
    { latin: 'l', persian: 'ل' },
    { latin: 'm', persian: 'م' },
    { latin: 'n', persian: 'ن' },
    { latin: 'v', persian: 'و' },
    { latin: 'o', persian: 'و' },
    { latin: 'u', persian: 'و' },
    { latin: 'w', persian: 'و' },
    { latin: 'y', persian: 'ی' },
    { latin: 'i', persian: 'ی' },
    { latin: 'e', persian: '\u0650' },
    { latin: '`', persian: 'ء' },
    { latin: "'", persian: 'ع' },
    { latin: '-', persian: '\u200c' }
  ];

  const LATIN_TOKEN_REGEX = /[A-Za-z\-'`]+/g;

  const normalizeMapping = (entry) => {
    if (!entry) return null;
    const latin = typeof entry.latin === 'string' ? entry.latin.trim().toLowerCase() : '';
    const persian = typeof entry.persian === 'string' ? entry.persian : '';
    if (!latin || !persian) {
      return null;
    }
    return { latin, persian };
  };

  const buildSortedMappings = (customMappings = []) => {
    const normalizedCustom = customMappings
      .map(normalizeMapping)
      .filter(Boolean);
    const combined = [...normalizedCustom, ...DEFAULT_MAPPINGS];
    combined.sort((a, b) => b.latin.length - a.latin.length);
    return combined;
  };

  const transliterateTokenWithMap = (token, mapping) => {
    if (!token) return token;
    let result = '';
    let index = 0;
    const lowered = token.toLowerCase();
    while (index < lowered.length) {
      let matched = false;
      for (let i = 0; i < mapping.length; i += 1) {
        const { latin, persian } = mapping[i];
        if (lowered.startsWith(latin, index)) {
          result += persian;
          index += latin.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result += token[index];
        index += 1;
      }
    }
    return result;
  };

  const transliterateTextWithMap = (text, mapping) => {
    if (!text) return text;
    let result = '';
    let buffer = '';

    const flushBuffer = () => {
      if (!buffer) return;
      result += transliterateTokenWithMap(buffer, mapping);
      buffer = '';
    };

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (/[A-Za-z\-'`]/.test(char)) {
        buffer += char;
      } else {
        flushBuffer();
        result += char;
      }
    }

    flushBuffer();
    return result;
  };

  const createTransliterator = (customMappings = []) => {
    const sortedMappings = buildSortedMappings(customMappings);
    return {
      transliterateToken: (token) => transliterateTokenWithMap(token, sortedMappings),
      transliterateText: (text) => transliterateTextWithMap(text, sortedMappings),
      getMappings: () => [...sortedMappings]
    };
  };

  const api = {
    DEFAULT_MAPPINGS: [...DEFAULT_MAPPINGS],
    LATIN_TOKEN_REGEX,
    createTransliterator,
    transliterateToken: (token, customMappings = []) =>
      createTransliterator(customMappings).transliterateToken(token),
    transliterateText: (text, customMappings = []) =>
      createTransliterator(customMappings).transliterateText(text)
  };

  if (typeof window !== 'undefined') {
    window.FaTransliterator = api;
  }

  if (typeof self !== 'undefined') {
    self.FaTransliterator = api;
  }
})();
