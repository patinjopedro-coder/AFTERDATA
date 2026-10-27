/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { formatRif, sanitizeSerials, prepareExportRecords, mergeImportedRecords, safeSplit, buildAliadoRegistro } from './utils';
import { getTerminalModel } from './data';
import { POSItem, ModelConfig } from './types';
import { RecepcionAliados } from './components/RecepcionAliados';
import { Diagnostico } from './components/Diagnostico';
import { iniciarSesion } from './lib/auth';

describe('RecepcionAliados component', () => {
  test('should keep the receive tab as a form and the channel tab as a read-only log', () => {
    const formHtml = renderToString(
      React.createElement(RecepcionAliados, {
        registrosAliados: [],
        setRegistrosAliados: () => {},
        mode: 'form',
      })
    );

    const viewHtml = renderToString(
      React.createElement(RecepcionAliados, {
        registrosAliados: [],
        setRegistrosAliados: () => {},
        mode: 'view',
      })
    );

    assert.match(formHtml, /RECEPCION ALIADOS/);
    assert.match(formHtml, /Registrar/);
    assert.doesNotMatch(formHtml, /Total registrados:|No hay equipos registrados/);
    assert.doesNotMatch(viewHtml, /Registrar/);
    assert.match(viewHtml, /CANAL ALIADOS/);
    assert.doesNotMatch(viewHtml, /Carga de llaves/i);
  });
});

describe('Diagnostico component', () => {
  test('should expose a diagnosis form and its separate diagnostic channel log', () => {
    const formHtml = renderToString(
      React.createElement(Diagnostico, {
        registrosDiagnosticos: [],
        setRegistrosDiagnosticos: () => {},
        registrosLaboratorio: [],
        setRegistrosLaboratorio: () => {},
        mode: 'form',
      })
    );

    const viewHtml = renderToString(
      React.createElement(Diagnostico, {
        registrosDiagnosticos: [],
        setRegistrosDiagnosticos: () => {},
        registrosLaboratorio: [],
        setRegistrosLaboratorio: () => {},
        mode: 'view',
      })
    );

    const repairHtml = renderToString(
      React.createElement(Diagnostico, {
        registrosDiagnosticos: [{
          id: '1',
          serial: 'ABC123',
          modelo: 'N980',
          origen: 'NEXGO',
          responsable: 'PEDRO',
          status: 'REPARACION',
          laboratorio: 'LAB-1',
          resultadoReparacion: 'CARGA DE LLAVES',
          fecha: '2026-10-19',
          hora: '12:00:00',
          fechaHora: '2026-10-19T12:00:00.000Z',
        }],
        setRegistrosDiagnosticos: () => {},
        registrosLaboratorio: [],
        setRegistrosLaboratorio: () => {},
        mode: 'repair',
      })
    );

    const historyHtml = renderToString(
      React.createElement(Diagnostico, {
        registrosDiagnosticos: [{
          id: '1',
          serial: 'ABC123',
          modelo: 'N980',
          origen: 'ALIADO',
          aliado: 'NANCY',
          responsable: 'PEDRO',
          status: 'REPARACION',
          laboratorio: 'LAB-1',
          resultadoReparacion: 'CARGA DE LLAVES',
          fecha: '2026-10-19',
          hora: '12:00:00',
          fechaHora: '2026-10-19T12:00:00.000Z',
        }],
        serialesCargaLlaves: ['ABC123'],
        setRegistrosDiagnosticos: () => {},
        registrosLaboratorio: [{
          id: 'lab-1',
          serial: 'ABC123',
          responsable: 'RICHARD',
          diagnostico: 'CAMBIO DE COMPONENTE',
          fecha: '2026-10-19',
          hora: '13:00:00',
          createdAt: '2026-10-19T13:00:00.000Z',
        }],
        setRegistrosLaboratorio: () => {},
        mode: 'view',
      })
    );

    const keyLoadOnlyHistoryHtml = renderToString(
      React.createElement(Diagnostico, {
        registrosDiagnosticos: [],
        setRegistrosDiagnosticos: () => {},
        serialesCargaLlaves: ['SERIAL-SOLO-LLAVES'],
        registrosLaboratorio: [],
        setRegistrosLaboratorio: () => {},
        mode: 'view',
      })
    );

    const keyLoadHtml = renderToString(
      React.createElement(Diagnostico, {
        registrosDiagnosticos: [],
        setRegistrosDiagnosticos: () => {},
        setSerialesCargaLlaves: () => {},
        registrosLaboratorio: [],
        setRegistrosLaboratorio: () => {},
        mode: 'keys',
      })
    );

    const laboratoryHtml = renderToString(
      React.createElement(Diagnostico, {
        registrosDiagnosticos: [],
        setRegistrosDiagnosticos: () => {},
        registrosLaboratorio: [],
        setRegistrosLaboratorio: () => {},
        mode: 'laboratorio',
      })
    );

    assert.match(formHtml, /DIAGNOSTICO/);
    assert.match(formHtml, /Registrar Diagnostico/);
    assert.match(viewHtml, /CANAL DE DIAGNOSTICOS/);
    assert.doesNotMatch(viewHtml, /Registrar Diagnostico/);
    assert.match(repairHtml, /REPARACION/);
    assert.match(repairHtml, /Serial del equipo/);
    assert.match(repairHtml, /Modelo/);
    assert.match(repairHtml, /LAB-1/);
    assert.match(historyHtml, /ABC123/);
    assert.match(historyHtml, /CARGA DE LLAVES/);
    assert.match(historyHtml, /overflow-x-auto/);
    assert.match(historyHtml, /Carga de llaves marcada/);
    assert.match(keyLoadHtml, /Marcar carga de llaves/);
    assert.match(historyHtml, /Responsable laboratorio/);
    assert.match(historyHtml, /RICHARD/);
    assert.match(historyHtml, /CAMBIO DE COMPONENTE/);
    assert.match(keyLoadOnlyHistoryHtml, /SERIAL-SOLO-LLAVES/);
    assert.match(keyLoadOnlyHistoryHtml, /Carga de llaves marcada/);
    assert.match(laboratoryHtml, /Serial/);
    assert.match(laboratoryHtml, /Diagnóstico/);
    assert.match(laboratoryHtml, /Responsable/);
  });
});

describe('local auth fallback', () => {
  test('should allow the Pedro local login with the configured password when Supabase is unavailable', async () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => store.has(key) ? store.get(key) ?? null : null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
      },
      configurable: true,
    });

    const result = await iniciarSesion('pedro', '123456');

    assert.equal(result.error, null);
    assert.equal(result.perfil?.usuario, 'pedro');
    assert.equal(result.perfil?.rol, 'admin');
    assert.match(String(localStorage.getItem('afterdata_local_session')), /pedro/i);
  });
});

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

describe('safeSplit utility', () => {
  test('should handle valid string inputs', () => {
    assert.deepStrictEqual(safeSplit('2026-07-30', '-'), ['2026', '07', '30']);
  });

  test('should handle null, undefined, numbers and booleans safely without crashing', () => {
    assert.deepStrictEqual(safeSplit(null, '-'), ['']);
    assert.deepStrictEqual(safeSplit(undefined, '-'), ['']);
    assert.deepStrictEqual(safeSplit(12345, '3'), ['12', '45']);
    assert.deepStrictEqual(safeSplit(false, 'a'), ['f', 'lse']);
  });
});


describe('buildAliadoRegistro utility', () => {
  test('should create a separate record with model, serial, ally and timestamps', () => {
    const now = new Date('2026-10-19T12:34:56');
    const result = buildAliadoRegistro({
      modelo: 'N980',
      serial: 'ABC123',
      aliado: 'NEXGO',
      createdAt: now,
    });

    assert.strictEqual(result.modelo, 'N980');
    assert.strictEqual(result.serial, 'ABC123');
    assert.strictEqual(result.aliado, 'NEXGO');
    assert.strictEqual(result.fecha, '2026-10-19');
    assert.strictEqual(result.hora, '12:34:56');
    assert.strictEqual(result.fechaHora, now.toISOString());
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

  test('should filter out records with serial \'POR RECIBIR\' when preparing export records', () => {
    const mockSerials: POSItem[] = [
      {
        id: 1,
        serial: 'POR RECIBIR',
        date: '2026-06-22',
        displayDate: '22/06/2026',
        status: 'PENDIENTE',
        remitente: 'REMITENTE-A',
        source: 'GUI-A',
        isCasillero: true
      },
      {
        id: 2,
        serial: 'VALID-SERIAL-1',
        date: '2026-06-22',
        displayDate: '22/06/2026',
        status: 'DISPONIBLE',
        remitente: 'REMITENTE-B',
        source: 'GUI-B',
        isCasillero: false
      }
    ];

    const exportRecords = prepareExportRecords(mockSerials);
    assert.strictEqual(exportRecords.length, 1);
    assert.strictEqual(exportRecords[0].item.serial, 'VALID-SERIAL-1');
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
