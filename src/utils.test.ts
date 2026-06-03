/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatRif, sanitizeSerials } from './utils';
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
