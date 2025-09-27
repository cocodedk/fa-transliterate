# Transliteration Mapping Specification

## Core Mapping Rules
- Cover primary Persian consonants and vowels, favoring intuitive Latin forms
- Engine must evaluate multi-letter sequences before single letters
- Support context-aware rules for vowel placement to avoid leading `ا` inside words when not desired

## Base Mapping Table

| Latin Input | Persian Output | Notes |
|-------------|----------------|-------|
| `a` | ا | Short vowel /a/ (default) |
| `aa` | آ | Long vowel /ɒː/ |
| `b` | ب | |
| `p` | پ | |
| `t` | ت | |
| `s` | س | Default "s" |
| `ss` | ص | Explicit emphatic s |
| `th` | ث | Classical /s/ sound |
| `j` | ج | |
| `ch` | چ | |
| `h` | ه | Plain h |
| `kh` | خ | Voiceless velar fricative |
| `d` | د | |
| `z` | ز | Default z |
| `zh` | ژ | |
| `zz` | ظ | Alternate emphatic z |
| `r` | ر | |
| `sh` | ش | |
| `gh` | غ | |
| `q` | ق | |
| `f` | ف | |
| `k` | ک | |
| `g` | گ | |
| `l` | ل | |
| `m` | م | |
| `n` | ن | |
| `v` | و | Default consonant v |
| `o` | و | Short vowel /o/ |
| `u` | و | Long vowel /u/ |
| `ou` | او | Explicit long /uː/ |
| `w` | و | Alias for v/o |
| `y` | ی | |
| `i` | ی | Short vowel /i/ |
| `ee` | ای | Long vowel /iː/ |
| `e` | ِ | Kasra short vowel (diacritic, optional) |
| `ei` | ای | Diphthong |
| `ai` | ای | Alternate diphthong mapping |
| `` ` `` | ء | Backtick indicates hamza |
| `'` | ع | Apostrophe indicates ayn |
| `-` | ‌ | Zero-width non-joiner for compound words |

## Configuration Options

### Ambiguous Characters
- Provide configuration for ambiguous characters (ث/س/ص, ذ/ز/ض/ظ) to allow preference
- Support context-aware rules for vowel placement

### Persian Digits
- Include Persian digits substitution (optional toggle) if Latin digits should remain unchanged by default

### Advanced Customization
- Allow advanced users to import/export custom mapping sets in JSON
- Support for multiple mapping profiles
