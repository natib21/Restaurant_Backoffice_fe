// src/features/Order/lib/orderUtils.ts

import { getLocalizedText } from '@/features/Menu/lib/localizationUtils';

/**
 * Safely extracts a displayable string name from an order item, ticket item, or menuItem.
 * Handles string names, { en, am } objects, JSON stringified strings, JS object strings like "{ en: 'Doro Wot', am: '' }", and nested menuItem references.
 */
export const formatOrderItemName = (
  itemOrName: any,
  lang: 'en' | 'am' = 'en'
): string => {
  if (!itemOrName) return '—';

  // If passed directly as a string or LocalizedText object
  if (typeof itemOrName === 'string') {
    return getLocalizedText(itemOrName, lang, itemOrName);
  }

  // If it's an object with direct en/am keys
  if (
    typeof itemOrName === 'object' &&
    itemOrName !== null &&
    ('en' in itemOrName || 'am' in itemOrName)
  ) {
    return getLocalizedText(itemOrName, lang, '—');
  }

  // If it's an order item or kitchen ticket item object
  if (typeof itemOrName === 'object' && itemOrName !== null) {
    // Check item.menuItemName (used in KDS tickets)
    if (itemOrName.menuItemName) {
      return getLocalizedText(itemOrName.menuItemName, lang, '—');
    }

    // Check item.customName
    if (itemOrName.customName) {
      return getLocalizedText(itemOrName.customName, lang, '—');
    }

    // Check item.name
    if (itemOrName.name) {
      return getLocalizedText(itemOrName.name, lang, '—');
    }

    // Check item.menuItem?.name or item.menuItem?.customName
    if (itemOrName.menuItem) {
      if (typeof itemOrName.menuItem === 'string') {
        return getLocalizedText(itemOrName.menuItem, lang, itemOrName.menuItem);
      }
      if (typeof itemOrName.menuItem === 'object') {
        if (itemOrName.menuItem.customName) {
          return getLocalizedText(itemOrName.menuItem.customName, lang, '—');
        }
        if (itemOrName.menuItem.name) {
          return getLocalizedText(itemOrName.menuItem.name, lang, '—');
        }
      }
    }

    // Check item.title or item.dishName
    if (itemOrName.title) {
      return getLocalizedText(itemOrName.title, lang, String(itemOrName.title));
    }
    if (itemOrName.dishName) {
      return getLocalizedText(itemOrName.dishName, lang, String(itemOrName.dishName));
    }
  }

  return '—';
};
