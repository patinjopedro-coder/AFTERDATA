/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatRif, sanitizeSerials, prepareExportRecords, mergeImportedRecords } from './utils';
import { getTerminalModel } from './data';
import { POSItem, ModelConfig } from './types';

describe('formatRif utility', () => {
  test('should handle empty or whitespace-only RIFs', () => {
    assert.strictEqual(formatRif(''), '');
    assert.strictEqual(formatRif('   '), '');
  });

  test('should format and clean valid RIFs with existing prefixes', () => {
    assert.strictEqual(formatRif('V-12345678'), 'V-12345678');
    assert.strictEqual(formatRif('v-12.345.678'), 'V-12345678');
    assert.strictEqual(formatRif(' j-12345678-9  '), 'J-123456789');
    assert.strictEqual(formatRif('E123456789'), 'E-123456789');
  });

  test('should guess V- prefix for purely numeric inputs <= 8 digits', () => {
    assert.strictEqual(formatRif('123456'), 'V-123456');
    assert.strictEqual(formatRif('12345678'), 'V-12345678');
  });

  test('should guess J- prefix for purely numeric inputs > 8 digits', () => {
    assert.strictEqual(formatRif('123456789'), 'J-123456789');
    assert.strictEqual(formatRif('9876543210'), 'J-9876543210');
  });
});

describe('sanitizeSerials utility', () => {
  test('should return an empty array if empty input is provided', () => {
    const result = sanitizeSerials([]);
    assert.strictEqual(result.length, 0);
  });

  test('should preserve valid distinct IDs', () => {
    const input: POSItem[] = [
      { id: 10, serial: 'S1', date: '', displayDate: '', status: 'PENDIENTE', remitente: '', source: '', isCasillero: false },
      { id: 20, serial: 'S2', date: '', displayDate: '', status: 'ACTIVO', remitente: '', source: '', isCasillero: false },
    ];
    const result = sanitizeSerials(input);
    assert.strictEqual(result[0].id, 10);
    assert.strictEqual(result[1].id, 20);
  });

  test('should resolve duplicates by assigning unique sequential IDs starting from maxExistingId + 1', () => {
    const input: POSItem[] = [
      { id: 5, serial: 'S1', date: '', displayDate: '', status: 'PENDIENTE', remitente: '', source: '', isCasillero: false },
      { id: 5, serial: 'S2', date: '', displayDate: '', status: 'ACTIVO', remitente: '', source: '', isCasillero: false }, // duplicate ID
      { id: 2, serial: 'S3', date: '', displayDate: '', status: 'CANCELADO', remitente: '', source: '', isCasillero: false },
    ];
    const result = sanitizeSerials(input);
    
    // Max existing valid ID was 5. Unique assigned should be 6
    assert.strictEqual(result[0].id, 5);
    assert.strictEqual(result[1].id, 6);
    assert.strictEqual(result[2].id, 2);
  });

  test('should sanitize NaN, null, or undefined IDs', () => {
    const input: POSItem[] = [
      { id: null as any, serial: 'S1', date: '', displayDate: '', status: 'PENDIENTE', remitente: '', source: '', isCasillero: false },
      { id: undefined as any, serial: 'S2', date: '', displayDate: '', status: 'ACTIVO', remitente: '', source: '', isCasillero: false },
      { id: NaN, serial: 'S3', date: '', displayDate: '', status: 'CANCELADO', remitente: '', source: '', isCasillero: false },
      { id: 15, serial: 'S4', date: '', displayDate: '', status: 'PENDIENTE', remitente: '', source: '', isCasillero: false },
    ];
    const result = sanitizeSerials(input);

    // Max valid ID was 15. The resolved IDs should be 16, 17, 18 sequentially
    assert.strictEqual(result[3].id, 15);
    assert.strictEqual(result[0].id, 16);
    assert.strictEqual(result[1].id, 17);
    assert.strictEqual(result[2].id, 18);
  });

  test('should handle corrupted or null items in array gracefully', () => {
    const input: any[] = [
      null,
      { id: 1, serial: 'S1', date: '', displayDate: '', status: 'PENDIENTE', remitente: '', source: '', isCasillero: false }
    ];
    const result = sanitizeSerials(input);
    assert.strictEqual(result[1].id, 1);
    assert.strictEqual(result[0].id, 2);
    assert.strictEqual(result[0].serial, '');
  });
});

describe('getTerminalModel data function', () => {
  const mockModels: Record<string, ModelConfig> = {
    'K3RAW': { modelo: 'K3-RAW-MODEL', so: 'ANDROID' },
    'N300': { modelo: 'N300-SERIES', so: 'LINUX' },
  };

  test('should match by exact prefix', () => {
    const res = getTerminalModel('K3RAW12345', mockModels);
    assert.strictEqual(res.modelo, 'K3-RAW-MODEL');
    assert.strictEqual(res.so, 'ANDROID');
  });

  test('should match by inclusion', () => {
    const res = getTerminalModel('TSTN300XYZ', mockModels);
    assert.strictEqual(res.modelo, 'N300-SERIES');
    assert.strictEqual(res.so, 'LINUX');
  });

  test('should return DESCONOCIDO for no matches', () => {
    const res = getTerminalModel('UNKNOWN_SERIAL_123', mockModels);
    assert.strictEqual(res.modelo, 'DESCONOCIDO (-)');
    assert.strictEqual(res.so, 'DESCONOCIDO');
  });

  test('should return DESCONOCIDO for empty serials', () => {
    const res = getTerminalModel('', mockModels);
    assert.strictEqual(res.modelo, '-');
    assert.strictEqual(res.so, 'DESCONOCIDO');
  });
});

describe('prepareExportRecords & mergeImportedRecords utilities', () => {
  test('should prepare export records correctly by splitting substitutions and sorting them', () => {
    const mockSerials: POSItem[] = [
      {
        id: 2,
        serial: 'ORIGINAL-2',
        date: '2026-06-22',
        displayDate: '22/06/2026',
        status: 'PENDIENTE',
        remitente: 'REMITENTE-A',
        source: 'GUI-A',
        isCasillero: false,
        esSustitucion: true,
        serialSustituto: 'SUST-2',
        simSustituto: true,
        simSustitutoNumber: '123456',
        modeloSustituto: 'MODEL-X',
        fechaSalida: '2026-06-23'
      },
      {
        id: 1,
        serial: 'NORMAL-1',
        date: '2026-06-22',
        displayDate: '22/06/2026',
        status: 'DISPONIBLE',
        remitente: 'REMITENTE-B',
        source: 'GUI-B',
        isCasillero: false
      }
    ];

    const exportRecords = prepareExportRecords(mockSerials);

    assert.strictEqual(exportRecords.length, 3);

    // Sorted by ID ascending: ID 1 comes first
    assert.strictEqual(exportRecords[0].idNum, 1);
    assert.strictEqual(exportRecords[0].idStr, '1');
    assert.strictEqual(exportRecords[0].isSust, false);
    assert.strictEqual(exportRecords[0].item.serial, 'NORMAL-1');

    // Next is ID 2 original
    assert.strictEqual(exportRecords[1].idNum, 2);
    assert.strictEqual(exportRecords[1].idStr, '2');
    assert.strictEqual(exportRecords[1].isSust, false);
    assert.strictEqual(exportRecords[1].item.serial, 'ORIGINAL-2');

    // Next is ID 2 substitute
    assert.strictEqual(exportRecords[2].idNum, 2);
    assert.strictEqual(exportRecords[2].idStr, '2-SUST');
    assert.strictEqual(exportRecords[2].isSust, true);
    assert.strictEqual(exportRecords[2].item.serial, 'SUST-2');
    assert.strictEqual(exportRecords[2].item.modeloManual, 'MODEL-X');
    assert.strictEqual(exportRecords[2].item.sim, true);
    assert.strictEqual(exportRecords[2].item.simNumber, '123456');
  });

  test('should merge split import records back into POSItems correctly', () => {
    const rawImported: { id: number; idStr: string; isSustRow: boolean; item: POSItem }[] = [
      {
        id: 1,
        idStr: '1',
        isSustRow: false,
        item: {
          id: 1,
          serial: 'NORMAL-1',
          date: '2026-06-22',
          displayDate: '22/06/2026',
          status: 'DISPONIBLE',
          remitente: 'REMITENTE-B',
          source: 'GUI-B',
          isCasillero: false
        }
      },
      {
        id: 2,
        idStr: '2',
        isSustRow: false,
        item: {
          id: 2,
          serial: 'ORIGINAL-2',
          date: '2026-06-22',
          displayDate: '22/06/2026',
          status: 'PENDIENTE',
          remitente: 'REMITENTE-A',
          source: 'GUI-A',
          isCasillero: false
        }
      },
      {
        id: 2,
        idStr: '2-SUST',
        isSustRow: true,
        item: {
          id: 2,
          serial: 'SUST-2',
          date: '2026-06-22',
          displayDate: '22/06/2026',
          status: 'PENDIENTE',
          remitente: 'REMITENTE-A',
          source: 'GUI-A',
          isCasillero: false,
          sim: true,
          simNumber: '123456',
          modeloManual: 'MODEL-X',
          fechaSalida: '2026-06-23',
          fechaSalidaCliente: '2026-06-24',
          guiaSalidaCliente: 'GUIA-OUT-1',
          destinoSalida: 'DEST-OUT-1'
        }
      }
    ];

    const merged = mergeImportedRecords(rawImported);

    assert.strictEqual(merged.length, 2);

    const item1 = merged.find(i => i.id === 1);
    assert.ok(item1);
    assert.strictEqual(item1.serial, 'NORMAL-1');

    const item2 = merged.find(i => i.id === 2);
    assert.ok(item2);
    assert.strictEqual(item2.serial, 'ORIGINAL-2');
    assert.strictEqual(item2.esSustitucion, true);
    assert.strictEqual(item2.serialSustituto, 'SUST-2');
    assert.strictEqual(item2.simSustituto, true);
    assert.strictEqual(item2.simSustitutoNumber, '123456');
    assert.strictEqual(item2.modeloSustituto, 'MODEL-X');
    assert.strictEqual(item2.fechaSalida, '2026-06-23');
    assert.strictEqual(item2.fechaSalidaCliente, '2026-06-24');
    assert.strictEqual(item2.guiaSalidaCliente, 'GUIA-OUT-1');
    assert.strictEqual(item2.destinoSalida, 'DEST-OUT-1');
  });
});
