// src/features/Menu/lib/categoryUtils.ts

import type { Category, LocalizedText } from '@/api/Queries/categoryQueries';
import {
  getLocalizedText,
  getLocalizedName,
  getLocalizedDescription,
  extractLocalizedPair,
  matchesLocalizedSearch,
} from './localizationUtils';

export {
  getLocalizedText,
  getLocalizedName,
  getLocalizedDescription,
  extractLocalizedPair,
  matchesLocalizedSearch,
};

/**
 * Returns the localized name for a category.
 * Handles both Category objects, LocalizedText, and plain strings.
 */
export const getCategoryName = (
  category: Category | LocalizedText | string | null | undefined,
  language: 'en' | 'am' = 'en'
): string => {
  if (!category) return 'Uncategorized';

  if (typeof category === 'string') {
    return getLocalizedText(category, language, 'Uncategorized');
  }

  // If it's a Category object
  if ('name' in category && category.name) {
    return getLocalizedText(category.name, language, 'Uncategorized');
  }

  // If it's a LocalizedText directly
  if ('en' in category || 'am' in category) {
    return getLocalizedText(category as LocalizedText, language, 'Uncategorized');
  }

  return 'Uncategorized';
};

/**
 * Returns the localized description for a category.
 */
export const getCategoryDescription = (
  category: Category | null | undefined,
  language: 'en' | 'am' = 'en'
): string => {
  if (!category || !category.description) return '';
  return getLocalizedText(category.description, language, '');
};

/**
 * Returns the category icon or fallback emoji.
 */
export const getCategoryIcon = (
  category: Category | null | undefined,
  fallback = '🍽️'
): string => {
  if (!category) return fallback;
  return category.icon || fallback;
};

/**
 * Sorts category array by displayOrder ascending.
 */
export const sortCategories = (categories: Category[]): Category[] => {
  return [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
};

