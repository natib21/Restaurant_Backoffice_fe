// src/features/Menu/lib/formDataUtils.ts

/**
 * Robust utility for building FormData objects from key-value pairs.
 * 
 * Rules:
 * 1. Plain primitive values (string, number, boolean) are appended as plain strings / values.
 * 2. File / Blob objects are preserved as binary uploads.
 * 3. Complex objects and arrays (variants, ingredients, allergens, tags, timeSlots, etc.)
 *    are automatically serialized via JSON.stringify() to avoid "[object Object]".
 * 4. null / undefined values are skipped unless explicitly configured.
 */

export interface BuildFormDataOptions {
  /** Keys that should always be stringified as JSON even if string or array */
  jsonKeys?: string[];
  /** Keys to completely omit */
  skipKeys?: string[];
}

export function buildFormData(
  data: Record<string, any>,
  options: BuildFormDataOptions = {}
): FormData {
  const formData = new FormData();
  const { jsonKeys = [], skipKeys = [] } = options;

  Object.entries(data).forEach(([key, value]) => {
    if (skipKeys.includes(key)) return;
    if (value === undefined || value === null) return;

    // Preserve real File or Blob objects
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    // Explicitly requested JSON stringification or auto-detected complex object / array
    if (jsonKeys.includes(key) || Array.isArray(value) || (typeof value === 'object' && !(value instanceof Date))) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    // Dates
    if (value instanceof Date) {
      formData.append(key, value.toISOString());
      return;
    }

    // Plain primitive values (string, number, boolean)
    formData.append(key, String(value));
  });

  return formData;
}
