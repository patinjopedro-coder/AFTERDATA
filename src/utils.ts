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

/**
 * Exports data to a native Excel (.xlsx) file with auto-adjusting column widths.
 */
export function exportToExcel(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) return;

  // Import dynamically or directly since we installed xlsx
  const XLSX = require('xlsx');

  // 1. Create a worksheet from the json data array
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Auto-fit columns
  const cols: { wch: number }[] = [];
  const keys = Object.keys(data[0]);
  keys.forEach(key => {
    let maxLen = key.length;
    data.forEach(row => {
      const val = row[key];
      const valStr = val !== null && val !== undefined ? String(val) : '';
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    // Add padding to avoid clipping
    cols.push({ wch: maxLen + 3 });
  });
  worksheet['!cols'] = cols;

  // 3. Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  // 4. Ensure proper filename extension (.xlsx)
  let finalFilename = filename;
  if (!filename.toLowerCase().endsWith('.xlsx')) {
    finalFilename = filename.replace(/\.csv$/i, '.xlsx');
    if (!finalFilename.toLowerCase().endsWith('.xlsx')) {
      finalFilename += '.xlsx';
    }
  }

  // 5. Save/Download the file
  XLSX.writeFile(workbook, finalFilename);
}

/**
 * Tracks changes between an original POSItem and its updated fields, and records them in the history array.
 */
export function trackAndLogChanges(original: POSItem, updatedFields: Partial<POSItem>): POSItem {
  const fieldsToTrack: (keyof POSItem)[] = [
    'serial', 'status', 'remitente', 'rif', 'razonSocial', 'banco', 'ticket', 'destino', 
    'observaciones', 'bsf', 'usdt', 'date', 'modeloManual', 'modeloNegocio', 'simNumber', 'operadora', 'responsable', 'sinCosto'
  ];
  
  const changes: string[] = [];
  fieldsToTrack.forEach(field => {
    if (field in updatedFields) {
      const origVal = original[field];
      const newVal = updatedFields[field];
      
      const origStr = origVal === undefined || origVal === null ? '' : String(origVal).trim();
      const newStr = newVal === undefined || newVal === null ? '' : String(newVal).trim();
      
      if (origStr !== newStr) {
        const fieldNameMap: Record<string, string> = {
          serial: 'Serial',
          status: 'Estatus',
          remitente: 'Remitente',
          rif: 'RIF',
          razonSocial: 'Razón Social',
          banco: 'Banco',
          ticket: 'Ticket',
          destino: 'Destino',
          observaciones: 'Observaciones',
          bsf: 'Monto BsF',
          usdt: 'Monto USDT',
          date: 'Fecha Ingreso',
          modeloManual: 'Modelo Manual',
          modeloNegocio: 'Modelo Negocio',
          simNumber: 'Número SIM',
          operadora: 'Operadora',
          responsable: 'Responsable',
          sinCosto: 'Sin Costo'
        };
        const displayName = fieldNameMap[field as string] || (field as string);
        changes.push(`[${displayName}] cambió de "${origStr || 'vacío'}" a "${newStr || 'vacío'}"`);
      }
    }
  });

  if (changes.length === 0) {
    return { ...original, ...updatedFields };
  }

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  const newHistory = original.history ? [...original.history] : [];
  changes.forEach(c => {
    newHistory.push(`${dateStr} ${timeStr} | ${c}`);
  });

  return {
    ...original,
    ...updatedFields,
    history: newHistory
  };
}

