// src/features/Menu/lib/localizationUtils.ts

export interface LocalizedText {
  en: string;
  am?: string;
  [key: string]: any;
}

export type LocalizedField = LocalizedText | string | null | undefined;

/**
 * Safely tries to parse a string that may contain JSON or JS object format.
 * Returns parsed object/string if successful, or original string if not.
 */
export const tryParseJson = (value: any): any => {
  if (typeof value !== 'string') return value;

  let current = value.trim();

  // Try parsing if it looks like a JSON object or string
  if (
    (current.startsWith('{') && current.endsWith('}')) ||
    (current.startsWith('[') && current.endsWith(']')) ||
    (current.startsWith('"') && current.endsWith('"'))
  ) {
    try {
      const parsed = JSON.parse(current);
      // Recursively parse if double stringified
      if (typeof parsed === 'string') {
        return tryParseJson(parsed);
      }
      return parsed;
    } catch {
      // If it looks like a JS object string like "{ en: 'Doro Wot', am: '' }"
      if (current.startsWith('{') && current.endsWith('}')) {
        try {
          // Convert JS object notation (unquoted keys, single quotes) to valid JSON
          const jsonLike = current
            .replace(/(['"])?([a-zA-Z0-9_$]+)(['"])?\s*:/g, '"$2":')
            .replace(/'((?:\\'|[^'])*)'/g, (_, str) => JSON.stringify(str.replace(/\\'/g, "'")));
          const parsedObj = JSON.parse(jsonLike);
          if (typeof parsedObj === 'object' && parsedObj !== null) {
            return parsedObj;
          }
        } catch {
          // Fallback to regex key extraction for en / am / name / title
          const enMatch = current.match(/(?:['"]?en['"]?)\s*:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|`((?:\\`|[^`])*)`|([^,\s}]+))/i);
          const amMatch = current.match(/(?:['"]?am['"]?)\s*:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|`((?:\\`|[^`])*)`|([^,\s}]+))/i);
          const nameMatch = current.match(/(?:['"]?name['"]?)\s*:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|`((?:\\`|[^`])*)`|([^,\s}]+))/i);

          if (enMatch || amMatch || nameMatch) {
            const enVal = (enMatch ? (enMatch[1] ?? enMatch[2] ?? enMatch[3] ?? enMatch[4] ?? '') : '').replace(/\\'/g, "'").replace(/\\"/g, '"');
            const amVal = (amMatch ? (amMatch[1] ?? amMatch[2] ?? amMatch[3] ?? amMatch[4] ?? '') : '').replace(/\\'/g, "'").replace(/\\"/g, '"');
            const nameVal = (nameMatch ? (nameMatch[1] ?? nameMatch[2] ?? nameMatch[3] ?? nameMatch[4] ?? '') : '').replace(/\\'/g, "'").replace(/\\"/g, '"');
            return {
              en: enVal || nameVal,
              am: amVal,
              name: nameVal || enVal,
            };
          }
        }
      }
      return current;
    }
  }

  return current;
};

/**
 * Returns the localized string from a LocalizedText object, JSON string, or plain string.
 * Defaults to 'en', with smart fallbacks if the requested language is empty.
 */
export const getLocalizedText = (
  field: LocalizedField,
  lang: 'en' | 'am' = 'en',
  fallback = ''
): string => {
  if (field === null || field === undefined) return fallback;

  // Unpack possible JSON / JS object string
  const unpacked = tryParseJson(field);

  if (typeof unpacked === 'string') {
    const trimmed = unpacked.trim();
    // Safety check: if string still contains "{ en: '...' }" pattern
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const enMatch = trimmed.match(/(?:['"]?en['"]?)\s*:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|`((?:\\`|[^`])*)`|([^,\s}]+))/i);
      const amMatch = trimmed.match(/(?:['"]?am['"]?)\s*:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|`((?:\\`|[^`])*)`|([^,\s}]+))/i);
      if (enMatch || amMatch) {
        const enVal = (enMatch ? (enMatch[1] ?? enMatch[2] ?? enMatch[3] ?? enMatch[4] ?? '') : '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
        const amVal = (amMatch ? (amMatch[1] ?? amMatch[2] ?? amMatch[3] ?? amMatch[4] ?? '') : '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
        if (lang === 'am' && amVal) return amVal;
        if (enVal) return enVal;
        if (amVal) return amVal;
      }
    }
    return trimmed || fallback;
  }

  if (typeof unpacked === 'object' && unpacked !== null) {
    const target = lang === 'am' ? unpacked.am : unpacked.en;
    if (target && typeof target === 'string' && target.trim()) {
      return target.trim();
    }
    // Fallbacks
    if (unpacked.en && typeof unpacked.en === 'string' && unpacked.en.trim()) {
      return unpacked.en.trim();
    }
    if (unpacked.am && typeof unpacked.am === 'string' && unpacked.am.trim()) {
      return unpacked.am.trim();
    }
    // If it has a nested name property
    if (unpacked.name) {
      return getLocalizedText(unpacked.name, lang, fallback);
    }
    if (unpacked.title) {
      return getLocalizedText(unpacked.title, lang, fallback);
    }
    if (unpacked.dishName) {
      return getLocalizedText(unpacked.dishName, lang, fallback);
    }
    if (unpacked.menuItemName) {
      return getLocalizedText(unpacked.menuItemName, lang, fallback);
    }
  }

  return fallback;
};

/**
 * Safely extracts the localized name from any entity (MenuItem, Combo, MenuGroup, Category, etc.).
 * Handles item.name, item.customName, string, or { en, am } formats.
 */
export const getLocalizedName = (
  item: any,
  lang: 'en' | 'am' = 'en',
  fallback = 'Unnamed Item'
): string => {
  if (!item) return fallback;

  // If item itself is a string (possibly JSON)
  if (typeof item === 'string') {
    return getLocalizedText(item, lang, fallback);
  }

  // Custom name override on populated items
  if (item.customName) {
    return getLocalizedText(item.customName, lang, fallback);
  }

  // Name property
  if (item.name) {
    return getLocalizedText(item.name, lang, fallback);
  }

  // Populated nested menuItem
  if (item.menuItem && typeof item.menuItem === 'object') {
    return getLocalizedName(item.menuItem, lang, fallback);
  }

  // Populated nested menu
  if (item.menu && typeof item.menu === 'object') {
    return getLocalizedName(item.menu, lang, fallback);
  }

  return fallback;
};

/**
 * Safely extracts the localized description from any entity.
 */
export const getLocalizedDescription = (
  item: any,
  lang: 'en' | 'am' = 'en',
  fallback = ''
): string => {
  if (!item) return fallback;

  if (typeof item === 'string') {
    return getLocalizedText(item, lang, fallback);
  }

  if (item.customDescription) {
    return getLocalizedText(item.customDescription, lang, fallback);
  }

  if (item.description) {
    return getLocalizedText(item.description, lang, fallback);
  }

  return fallback;
};

/**
 * Extracts both English and Amharic strings as a normalized pair.
 * Properly parses JSON strings like '{"en":"Burger","am":"በርገር"}'.
 */
export const extractLocalizedPair = (
  field: LocalizedField
): { en: string; am: string } => {
  if (!field) return { en: '', am: '' };

  const unpacked = tryParseJson(field);

  if (typeof unpacked === 'string') {
    return { en: unpacked.trim(), am: '' };
  }

  if (typeof unpacked === 'object' && unpacked !== null) {
    return {
      en: typeof unpacked.en === 'string' ? unpacked.en.trim() : '',
      am: typeof unpacked.am === 'string' ? unpacked.am.trim() : '',
    };
  }

  return { en: '', am: '' };
};

/**
 * Helper to check if a localized field matches a search query across both English and Amharic.
 */
export const matchesLocalizedSearch = (
  field: LocalizedField,
  searchTerm: string
): boolean => {
  if (!searchTerm) return true;
  const lowerSearch = searchTerm.toLowerCase().trim();
  if (!lowerSearch) return true;

  if (!field) return false;

  const { en, am } = extractLocalizedPair(field);
  const enMatch = en.toLowerCase().includes(lowerSearch);
  const amMatch = am.toLowerCase().includes(lowerSearch);

  return enMatch || amMatch;
};

