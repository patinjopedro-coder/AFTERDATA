/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { POSItem } from './types';

/**
 * Normalizes RIF strings into standard formats like V-12345678 or J-123456789.
 * It strips out hyphens and dots, Capitalizes the letters, and prepends V- or J-
 * dynamically based on string length if no prefix character is present.
 */
export function formatRif(rawRif: string): string {
  const clean = rawRif.trim().toUpperCase().replace(/[-.]/g, '');
  if (!clean) return '';
  
  const firstChar = clean[0];
  const isLetter = /^[A-Z]$/i.test(firstChar);
  
  if (isLetter) {
    return `${firstChar}-${clean.slice(1)}`;
  } else {
    // If no prefix letter is provided, guess V- (for Venezuelan ID numbers <= 8 digits)
    // or J- (for business tax register numbers > 8 digits)
    if (clean.length <= 8) {
      return `V-${clean}`;
    } else {
      return `J-${clean}`;
    }
  }
}

/**
 * Ensures all loaded POS items have unique numerical IDs.
 * Sanitizes NaN, null, undefined, or duplicated IDs to prevent front-end key collisions or data overwrites.
 */
export function sanitizeSerials(loaded: POSItem[]): POSItem[] {
  const seenIds = new Set<number>();
  const currentMax = loaded.reduce((max, item) =>
    (item && item.id && typeof item.id === 'number' && !isNaN(item.id)) ? Math.max(max, item.id) : max,
    0
  );
  let nextUniqueId = currentMax + 1;

  return loaded.map((item) => {
    if (!item) {
      return {
        id: nextUniqueId++,
        serial: '',
        date: '',
        displayDate: '',
        status: 'SIN ESTATUS',
        remitente: '',
        source: '',
        isCasillero: false,
      } as POSItem;
    }
    
    if (!item.id || typeof item.id !== 'number' || isNaN(item.id) || seenIds.has(item.id)) {
      const assignedId = nextUniqueId++;
      seenIds.add(assignedId);
      return { ...item, id: assignedId };
    }
    
    seenIds.add(item.id);
    return item;
  });
}
