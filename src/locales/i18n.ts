import { useState, useEffect } from 'react';

import subscriptionEn from './en/subscription.json';
import subscriptionAm from './am/subscription.json';
import commonEn from './en/common.json';
import commonAm from './am/common.json';
import authEn from './en/auth.json';
import authAm from './am/auth.json';
import merchantSettingsEn from './en/merchantSettings.json';
import merchantSettingsAm from './am/merchantSettings.json';
import teamEn from './en/team.json';
import teamAm from './am/team.json';
import menuEn from './en/menu.json';
import menuAm from './am/menu.json';
import ordersEn from './en/orders.json';
import ordersAm from './am/orders.json';
import inventoryEn from './en/inventory.json';
import inventoryAm from './am/inventory.json';
import branchEn from './en/branch.json';
import branchAm from './am/branch.json';
import kycEn from './en/kyc.json';
import kycAm from './am/kyc.json';
import tableEn from './en/table.json';
import tableAm from './am/table.json';
import customerEn from './en/customer.json';
import customerAm from './am/customer.json';
import marketingEn from './en/marketing.json';
import marketingAm from './am/marketing.json';
import overviewEn from './en/overview.json';
import overviewAm from './am/overview.json';

export type Language = 'en' | 'am';

const translations: Record<Language, Record<string, Record<string, string>>> = {
  en: {
    subscription: subscriptionEn,
    common: commonEn,
    auth: authEn,
    merchantSettings: merchantSettingsEn,
    team: teamEn,
    menu: menuEn,
    orders: ordersEn,
    inventory: inventoryEn,
    branch: branchEn,
    kyc: kycEn,
    table: tableEn,
    customer: customerEn,
    marketing: marketingEn,
    overview: overviewEn,
  },
  am: {
    subscription: subscriptionAm,
    common: commonAm,
    auth: authAm,
    merchantSettings: merchantSettingsAm,
    team: teamAm,
    menu: menuAm,
    orders: ordersAm,
    inventory: inventoryAm,
    branch: branchAm,
    kyc: kycAm,
    table: tableAm,
    customer: customerAm,
    marketing: marketingAm,
    overview: overviewAm,
  },
};

let currentLanguage: Language = (localStorage.getItem('app_lang') as Language) || 'en';

export const setAppLanguage = (lang: Language) => {
  currentLanguage = lang;
  localStorage.setItem('app_lang', lang);
  window.dispatchEvent(new Event('languageChange'));
};

export const getAppLanguage = (): Language => currentLanguage;

export const getTranslation = (
  namespace: string,
  key: string,
  params?: Record<string, string | number>,
  lang: Language = currentLanguage
): string => {
  const nsDict = translations[lang]?.[namespace] || translations.en[namespace] || {};
  const fallbackDict = translations.en[namespace] || {};
  let text: string = (nsDict[key] || fallbackDict[key] || key) as string;

  if (params && typeof text === 'string') {
    Object.entries(params).forEach(([pKey, pVal]) => {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    });
  }

  return String(text);
};

export function useTranslation(namespace: string = 'common') {
  const [lang, setLang] = useState<Language>(currentLanguage);

  useEffect(() => {
    const handleLangChange = () => {
      setLang(getAppLanguage());
    };

    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(namespace, key, params, lang);
  };

  return {
    t,
    i18n: {
      language: lang,
      changeLanguage: (newLang: Language) => setAppLanguage(newLang),
    },
  };
}
