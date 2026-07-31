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
    'observaciones', 'notaReparacion', 'bsf', 'usdt', 'date', 'modeloManual', 'modeloNegocio', 'simNumber', 'operadora', 'responsable', 'sinCosto', 'salienteSinRecibir', 'simSustituto', 'simSustitutoNumber', 'entregadoDisglobal', 'entregadoA'
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
          notaReparacion: 'Nota Reparación / Estado Físico',
          bsf: 'Monto BsF',
          usdt: 'Monto USDT',
          date: 'Fecha Ingreso',
          modeloManual: 'Modelo Manual',
          modeloNegocio: 'Modelo Negocio',
          simNumber: 'Número SIM',
          operadora: 'Operadora',
          responsable: 'Responsable',
          sinCosto: 'Sin Costo',
          salienteSinRecibir: 'Saliente sin Recibir',
          simSustituto: 'SIM Sustituto',
          simSustitutoNumber: 'Número SIM Sustituto',
          entregadoDisglobal: 'Entregado a Disglobal',
          entregadoA: 'Entregado A'
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

/**
 * Copies text to the clipboard using the modern Clipboard API if available,
 * with a fallback to document.execCommand('copy') for non-secure/sandboxed contexts.
 */
export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch((err) => {
        console.warn('Modern clipboard copy failed, falling back...', err);
        return fallbackCopyToClipboard(text);
      });
  }
  return Promise.resolve(fallbackCopyToClipboard(text));
}

function fallbackCopyToClipboard(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  
  // Save active element
  const activeElement = document.activeElement;
  
  textArea.focus();
  textArea.select();
  
  let successful = false;
  try {
    successful = document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  
  document.body.removeChild(textArea);
  
  // Restore focus
  if (activeElement && (activeElement as HTMLElement).focus) {
    (activeElement as HTMLElement).focus();
  }
  
  return successful;
}

export interface ExportRecord {
  idNum: number;
  idStr: string;
  isSust: boolean;
  item: POSItem;
}

/**
 * Splits POSItems with active substitutions into two export rows (original and substitute)
 * and sorts the result by base ID ascending.
 */
export function prepareExportRecords(serials: POSItem[]): ExportRecord[] {
  const rows: ExportRecord[] = [];

  serials.forEach(s => {
    if (s.serial === 'POR RECIBIR') return;

    rows.push({
      idNum: s.id,
      idStr: String(s.id),
      isSust: false,
      item: s
    });

    if (s.esSustitucion && s.serialSustituto) {
      const sustItem: POSItem = {
        ...s,
        id: s.id,
        serial: s.serialSustituto,
        observaciones: `SUSTITUTO DE ${s.serial}`,
        forro: false,
        bateria: false,
        cargador: false,
        caja: false,
        sim: !!s.simSustituto,
        simNumber: s.simSustitutoNumber || '',
        operadora: '',
        modeloManual: s.modeloSustituto || '',
        esSustitucion: true,
        serialSustituto: s.serial,
      };
      rows.push({
        idNum: s.id,
        idStr: `${s.id}-SUST`,
        isSust: true,
        item: sustItem
      });
    }
  });

  rows.sort((a, b) => {
    if (a.idNum !== b.idNum) {
      return a.idNum - b.idNum;
    }
    return a.isSust ? 1 : -1;
  });

  return rows;
}

/**
 * Re-groups split CSV import records by their base ID and merges substitution rows
 * back into single POSItem objects.
 */
export function mergeImportedRecords(records: { id: number; idStr: string; isSustRow: boolean; item: POSItem }[]): POSItem[] {
  const groups: Record<number, { id: number; idStr: string; isSustRow: boolean; item: POSItem }[]> = {};
  const ungrouped: { id: number; idStr: string; isSustRow: boolean; item: POSItem }[] = [];

  records.forEach(rec => {
    if (rec.id > 0) {
      if (!groups[rec.id]) {
        groups[rec.id] = [];
      }
      groups[rec.id].push(rec);
    } else {
      ungrouped.push(rec);
    }
  });

  const mergedItems: POSItem[] = [];

  Object.keys(groups).forEach(idStrKey => {
    const idNum = parseInt(idStrKey);
    const group = groups[idNum];
    if (group.length === 1) {
      mergedItems.push(group[0].item);
    } else if (group.length >= 2) {
      const originalRec = group.find(r => !r.isSustRow) || group[0];
      const sustRec = group.find(r => r.isSustRow) || group[1];

      const mergedItem: POSItem = {
        ...originalRec.item,
        esSustitucion: true,
        serialSustituto: sustRec.item.serial,
        simSustituto: sustRec.item.sim,
        simSustitutoNumber: sustRec.item.simNumber,
        modeloSustituto: sustRec.item.modeloManual,
        fechaSalida: sustRec.item.fechaSalida || originalRec.item.fechaSalida,
        fechaSalidaCliente: sustRec.item.fechaSalidaCliente || originalRec.item.fechaSalidaCliente,
        guiaSalidaCliente: sustRec.item.guiaSalidaCliente || originalRec.item.guiaSalidaCliente,
        destinoSalida: sustRec.item.destinoSalida || originalRec.item.destinoSalida,
      };
      mergedItems.push(mergedItem);
    }
  });

  ungrouped.forEach(rec => {
    mergedItems.push(rec.item);
  });

  return mergedItems;
}

/**
 * Helper to download a Blob safely in browser environments,
 * preventing Chrome/Edge's synchronous URL revocation filename bug.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Defer revocation to avoid Chrome/Edge download filename fallback to UUID
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 250);
}

/**
 * Safely splits a value into an array of strings, converting null/undefined/non-strings to String first.
 */
export function safeSplit(val: any, separator: string | RegExp): string[] {
  return String(val ?? '').split(separator);
}


