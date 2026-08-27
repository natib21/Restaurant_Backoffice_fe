import en from './en.json';
import am from './am.json';

export type Language = 'en' | 'am';

const translations: Record<Language, Record<string, string>> = {
  en,
  am,
};

export const getTranslation = (
  key: string,
  params?: Record<string, string | number>,
  lang: Language = 'en'
): string => {
  const dict = translations[lang] || translations.en;
  let text = dict[key] || translations.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([pKey, pVal]) => {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    });
  }

  return text;
};
