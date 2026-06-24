import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { POSItem, EnvioExterno, ModelConfig, POSStatus, UserProfile, StandbyItem } from './types';
import { INITIAL_SERIALS, INITIAL_MODELS } from './data';
import { getDBItem, setDBItem } from './db';
import { sanitizeSerials, formatRif, prepareExportRecords, mergeImportedRecords, downloadBlob } from './utils';

import { GestionGeneral } from './components/GestionGeneral';
import { LogoIcon } from './components/LogoIcon';
import { Casillero } from './components/Casillero';
import { HacerEnvio } from './components/HacerEnvio';
import { CruceSeriales } from './components/CruceSeriales';
import { EquiposEnviados } from './components/EquiposEnviados';
import { Modelos } from './components/Modelos';
import { Estadisticas } from './components/Estadisticas';
import { Usuarios } from './components/Usuarios';
import { GestionSimCards } from './components/GestionSimCards';
import { Login } from './components/Login';
import { StandBy } from './components/StandBy';

// Lucide icons
import {
  Database, FileSpreadsheet, Download, RefreshCw,
  Trash2, Layers, Search, Calendar, FolderCheck, Clock,
  Settings, BarChart3, Users, Network, Terminal, ShieldAlert, Send,
  Home, Flag, ArrowUpRight, Smartphone, Bell, CardSim, LogOut
} from 'lucide-react';

export default function App() {
  // -------------------------------------------------------------
  // STATE DEFINITIONS — start with empty defaults, load from IndexedDB
  // -------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('disglobal_authenticated') === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [serials, setSerials] = useState<POSItem[]>([]);
  const [enviosExternos, setEnviosExternos] = useState<EnvioExterno[]>([]);
  const [modelosDB, setModelosDB] = useState<Record<string, ModelConfig>>(INITIAL_MODELS);
  const [usersProfiles, setUsersProfiles] = useState<Record<string, UserProfile>>({});
  const [currentTab, setCurrentTab] = useState<string>('general');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [simCardBatches, setSimCardBatches] = useState<any[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // STAND-BY and Batch states
  const [standbyList, setStandbyList] = useState<StandbyItem[]>([]);
  const [activeCruceBatchId, setActiveCruceBatchId] = useState<string>('');
  const [standbyAlerts, setStandbyAlerts] = useState<{
    id: string;
    serial?: string;
    guia?: string;
    mensaje: string;
  }[]>([]);

  const handleLogout = () => {
    localStorage.removeItem('disglobal_authenticated');
    localStorage.removeItem('disglobal_username');
    setIsAuthenticated(false);
    setShowUserMenu(false);
  };

  // Global Filter States (shared reactively between tables)
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeCasillero, setIncludeCasillero] = useState(true);

  // Floating History Tooltip State
  const [historyTooltip, setHistoryTooltip] = useState<{
    serial: string;
    clientX: number;
    clientY: number;
  } | null>(null);

  // Global User Profile Modal State
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);

  // Notifications Menu State
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // -------------------------------------------------------------
  // LOAD ALL DATA FROM INDEXEDDB ON MOUNT
  // db.ts handles automatic migration from localStorage automatically
  // -------------------------------------------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        const [
          loadedSerials,
          loadedEnvios,
          loadedModelos,
          loadedProfiles,
          loadedTab,
          loadedSimBatches,
          loadedStandby,
          loadedActiveBatch
        ] = await Promise.all([
          getDBItem<POSItem[]>('serialesDB', INITIAL_SERIALS),
          getDBItem<EnvioExterno[]>('enviosExternosDB', []),
          getDBItem<Record<string, ModelConfig>>('modelosDB', INITIAL_MODELS),
          getDBItem<Record<string, UserProfile>>('usersProfilesDB', {}),
          getDBItem<string>('currentTab', 'general'),
          getDBItem<any[]>('simCardBatchesDB', []),
          getDBItem<StandbyItem[]>('standbyListDB', []),
          getDBItem<string>('activeCruceBatchIdDB', '')
        ]);

        const rawSerials = Array.isArray(loadedSerials) ? loadedSerials : INITIAL_SERIALS;
        const cleanedSerials = rawSerials.map(item => {
          if (item && item.observaciones) {
            const obsUpper = item.observaciones.trim().toUpperCase();
            if (obsUpper === 'LISTO PARA REVISIÓN FÍSICA' || obsUpper === 'LISTO PARA REVISION FISICA') {
              return { ...item, observaciones: '' };
            }
          }
          return item;
        });
        setSerials(sanitizeSerials(cleanedSerials));
        setEnviosExternos(Array.isArray(loadedEnvios) ? loadedEnvios : []);
        setModelosDB(loadedModelos && typeof loadedModelos === 'object' ? loadedModelos : INITIAL_MODELS);
        setUsersProfiles(loadedProfiles && typeof loadedProfiles === 'object' ? loadedProfiles : {});
        setCurrentTab(typeof loadedTab === 'string' ? loadedTab : 'general');
        setSimCardBatches(Array.isArray(loadedSimBatches) ? loadedSimBatches : []);
        setStandbyList(Array.isArray(loadedStandby) ? loadedStandby : []);
        setActiveCruceBatchId(typeof loadedActiveBatch === 'string' ? loadedActiveBatch : '');
      } catch (e) {
        console.error('Error loading from DB:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  // Handle ESC key press globally to close user profile, history tooltip, and user menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingProfile(null);
        setHistoryTooltip(null);
        setShowUserMenu(false);
        setShowNotificationsMenu(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showUserMenu && !target.closest('.relative')) {
        setShowUserMenu(false);
      }
      if (showNotificationsMenu && !target.closest('.notification-container')) {
        setShowNotificationsMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotificationsMenu]);

  // -------------------------------------------------------------
  // PERSIST STATES TO INDEXEDDB ON EVERY CHANGE
  // Guard with !isLoading to avoid overwriting real data with empty defaults
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isLoading) setDBItem('serialesDB', serials);
  }, [serials, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('enviosExternosDB', enviosExternos);
  }, [enviosExternos, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('modelosDB', modelosDB);
  }, [modelosDB, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('usersProfilesDB', usersProfiles);
  }, [usersProfiles, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('currentTab', currentTab);
  }, [currentTab, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('simCardBatchesDB', simCardBatches);
  }, [simCardBatches, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('standbyListDB', standbyList);
  }, [standbyList, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('activeCruceBatchIdDB', activeCruceBatchId);
  }, [activeCruceBatchId, isLoading]);

  // Reactively monitor serials to match standbyList pending items and fire notifications
  useEffect(() => {
    if (isLoading || standbyList.length === 0) return;

    let hasChanges = false;
    const updated = standbyList.map(item => {
      if (item.status === 'PROCESADO') return item;

      // Check if serial or guia has entered system
      const match = serials.find(s => {
        const serialMatch = item.serial && s.serial && s.serial.trim().toUpperCase() === item.serial.trim().toUpperCase();
        const substituteMatch = item.serial && s.serialSustituto && s.serialSustituto.trim().toUpperCase() === item.serial.trim().toUpperCase();
        const guiaMatch = item.guia && (
          (s.source && s.source.trim().toUpperCase() === item.guia.trim().toUpperCase()) ||
          (s.guiaSalidaCliente && s.guiaSalidaCliente.trim().toUpperCase() === item.guia.trim().toUpperCase())
        );
        return serialMatch || substituteMatch || guiaMatch;
      });

      if (match) {
        hasChanges = true;
        const alertId = `STBY-ALERT-${item.id}-${Date.now()}`;
        const detail = item.serial && item.guia
          ? `Serial [${item.serial}] y Guía [${item.guia}]`
          : item.serial
            ? `Serial [${item.serial}]`
            : `Guía [${item.guia}]`;

        setStandbyAlerts(prev => [...prev, {
          id: alertId,
          serial: item.serial,
          guia: item.guia,
          mensaje: `El equipo en camino con ${detail} ha sido recibido e ingresado al sistema.`
        }]);

        // Auto remove alert after 8 seconds
        setTimeout(() => {
          setStandbyAlerts(prev => prev.filter(a => a.id !== alertId));
        }, 8000);

        return {
          ...item,
          status: 'PROCESADO',
          processedDate: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });

    if (hasChanges) {
      setStandbyList(updated);
    }
  }, [serials, isLoading, standbyList]);

  // -------------------------------------------------------------
  // MASTER HEADER CONTROL ACTIONS
  // -------------------------------------------------------------
  const handleImportCSVData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (fileEvent) => {
        try {
          const csvText = fileEvent.target?.result as string;
          const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) {
            alert("Archivo inválido o vacío.");
            return;
          }

          let headerLineIndex = 0;
          let separator = ',';

          if (lines[0].toLowerCase().startsWith('sep=')) {
            separator = lines[0].split('=')[1] || ',';
            headerLineIndex = 1;
          } else {
            // Auto-detect separator by counting occurrences
            const firstLine = lines[0];
            const commaCount = (firstLine.match(/,/g) || []).length;
            const semiCount = (firstLine.match(/;/g) || []).length;
            if (semiCount > commaCount) {
              separator = ';';
            }
          }

          const parsedHeaders = lines[headerLineIndex].split(separator).map(h => h.toUpperCase().replace(/_/g, '').replace(/\s/g, '').trim());
          const hasSerialHeader = parsedHeaders.some(h => h.includes('SERIAL') || h.includes('SERIALCRUCE') || h.includes('SERIALCASILLERO'));
          if (!hasSerialHeader) {
            alert("Formato no reconocido o falto de columna SERIAL.");
            return;
          }

          if (confirm("¿Está seguro de importar los registros? Esto reescribirá la base logistica local.")) {
            // Find positions
            const idxID = parsedHeaders.findIndex(h => h === 'ID');
            const idxSerialCruce = parsedHeaders.findIndex(h => h.includes('SERIALCRUCE'));
            const idxSerialCasillero = parsedHeaders.findIndex(h => h.includes('SERIALCASILLERO'));
            const idxSerial = parsedHeaders.findIndex(h => h === 'SERIAL' || (h.includes('SERIAL') && h !== 'SERIALSUSTITUTO' && h !== 'SERIALCRUCE' && h !== 'SERIALCASILLERO'));

            const idxStatus = parsedHeaders.findIndex(h => h.includes('STATUS') || h.includes('ESTADO'));
            const idxRemitente = parsedHeaders.findIndex(h => h.includes('REMITENTE'));
            const idxRif = parsedHeaders.findIndex(h => h.includes('RIF'));
            const idxRazon = parsedHeaders.findIndex(h => h.includes('RAZON'));
            const idxSource = parsedHeaders.findIndex(h => h.includes('GUIENTRADA') || h.includes('GUIAENTRADA') || h.includes('ORIGEN'));
            const idxIsCasillero = parsedHeaders.findIndex(h => h.includes('ISCASILLERO'));
            const idxFecha = parsedHeaders.findIndex(h => h === 'FECHA' || h === 'FECHAINGRESO' || h === 'DATE' || h === 'LLEGADA' || h === 'FECHALLEGADA');
            const idxForro = parsedHeaders.findIndex(h => h.includes('FORRO'));
            const idxBateria = parsedHeaders.findIndex(h => h.includes('BATERIA'));
            const idxCargador = parsedHeaders.findIndex(h => h.includes('CARGADOR'));
            const idxCaja = parsedHeaders.findIndex(h => h.includes('CAJA'));
            const idxSim = parsedHeaders.findIndex(h => h.includes('SIM') && h !== 'SIMNUMBER');
            const idxSimNum = parsedHeaders.findIndex(h => h.includes('SIMNUMBER') || h.includes('NUMEROSIM'));
            const idxOper = parsedHeaders.findIndex(h => h.includes('OPERADORA'));
            const idxModManual = parsedHeaders.findIndex(h => h.includes('MODELOMANUAL'));
            const idxNegocio = parsedHeaders.findIndex(h => h.includes('MODELONEGOCIO'));
            const idxEntregadoTec = parsedHeaders.findIndex(h => h.includes('ENTREGADOTECNICO'));
            const idxSust = parsedHeaders.findIndex(h => h.includes('ESSUSTITUCION'));
            const idxSerialSust = parsedHeaders.findIndex(h => h.includes('SERIALSUSTITUTO') || h.includes('SUSTITUTO'));
            const idxSimSust = parsedHeaders.findIndex(h => h.includes('SIMSUSTITUTO'));
            const idxSimSustNum = parsedHeaders.findIndex(h => h.includes('SIMSUSTITUTONUMBER') || h.includes('NUMEROSIMSUSTITUTO'));
            const idxFechaSalida = parsedHeaders.findIndex(h => h === 'FECHASALIDA' || (h.includes('FECHASALIDA') && !h.includes('CLIENTE')));
            const idxFechaLiberacion = parsedHeaders.findIndex(h => h.includes('FECHASALIDACLIENTE') || h.includes('FECHALIBERACION'));
            const idxGuiaLib = parsedHeaders.findIndex(h => h.includes('GUIASALIDACLIENTE') || h.includes('GUIALIBERACION'));
            const idxDestinoSalida = parsedHeaders.findIndex(h => h.includes('DESTINOSALIDA'));
            const idxFechaConfirmada = parsedHeaders.findIndex(h => h.includes('FECHACONFIRMADA'));
            const idxObs = parsedHeaders.findIndex(h => h.includes('OBSERVACIONES'));
            const idxResp = parsedHeaders.findIndex(h => h.includes('RESPONSABLE'));
            const idxTicket = parsedHeaders.findIndex(h => h.includes('TICKET'));
            const idxDestino = parsedHeaders.findIndex(h => h === 'DESTINO' || (h.includes('DESTINO') && h !== 'DESTINOSALIDA'));
            const idxBanco = parsedHeaders.findIndex(h => h.includes('BANCO'));
            const idxBsf = parsedHeaders.findIndex(h => h.includes('BSF') || h === 'BS');
            const idxUsdt = parsedHeaders.findIndex(h => h === 'USDT');
            const idxCruceBatchId = parsedHeaders.findIndex(h => h.includes('CRUCEBATCHID'));
            const idxAddedFromCruce = parsedHeaders.findIndex(h => h.includes('ADDEDFROMCRUCE'));

            interface ParsedRecord {
              id: number;
              idStr: string;
              isSustRow: boolean;
              item: POSItem;
            }
            const parsedRecords: ParsedRecord[] = [];

            for (let i = headerLineIndex + 1; i < lines.length; i++) {
              const cols = lines[i].split(separator).map(c => c.replace(/^"|"$/g, '').trim());
              if (cols.length < 2) continue;

              let cleanSerial = '';
              let isCasilleroVal = false;

              if (idxSerialCasillero !== -1 && cols[idxSerialCasillero]) {
                cleanSerial = cols[idxSerialCasillero].toUpperCase().trim();
                isCasilleroVal = true;
              } else if (idxSerialCruce !== -1 && cols[idxSerialCruce]) {
                cleanSerial = cols[idxSerialCruce].toUpperCase().trim();
                isCasilleroVal = false;
              } else if (idxSerial !== -1 && cols[idxSerial]) {
                cleanSerial = cols[idxSerial].toUpperCase().trim();
                isCasilleroVal = idxIsCasillero !== -1
                  ? (cols[idxIsCasillero]?.toLowerCase() === 'true')
                  : (idxSource !== -1 && !!cols[idxSource]);
              }

              if (!cleanSerial) continue;

              const d = new Date();
              const defaultLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const rawDate = cols[idxFecha] || defaultLocal;
              const formatDisplayDate = rawDate.split('-').reverse().join('/');

              const idStr = idxID !== -1 ? cols[idxID].trim() : '';
              const rawIdVal = idStr && !isNaN(parseInt(idStr)) ? parseInt(idStr) : 0;
              const isSustRow = idStr.toUpperCase().endsWith('-SUST');
              const statusVal = (idxStatus !== -1 ? cols[idxStatus].toUpperCase() : 'PENDIENTE') as POSStatus;

              const recordItem: POSItem = {
                id: rawIdVal,
                serial: cleanSerial,
                date: rawDate,
                displayDate: formatDisplayDate,
                status: statusVal,
                remitente: idxRemitente !== -1 ? cols[idxRemitente].toUpperCase() : '',
                source: idxSource !== -1 ? cols[idxSource].toUpperCase() : '',
                isCasillero: isCasilleroVal,
                selected: false,
                rif: idxRif !== -1 ? formatRif(cols[idxRif]) : '',
                razonSocial: idxRazon !== -1 ? cols[idxRazon].toUpperCase() : '',
                observaciones: (() => {
                  const val = idxObs !== -1 ? cols[idxObs] : '';
                  return (val === 'RECUPERACION' || val === 'SUSTITUCION') ? '' : val;
                })(),
                notaReparacion: (() => {
                  const val = idxObs !== -1 ? cols[idxObs] : '';
                  return (val === 'RECUPERACION' || val === 'SUSTITUCION') ? val : '';
                })(),
                responsable: (idxResp !== -1 ? cols[idxResp] : '') || 'PEDRO PATIÑO',
                forro: idxForro !== -1 ? (cols[idxForro]?.toLowerCase() === 'true') : false,
                bateria: idxBateria !== -1 ? (cols[idxBateria]?.toLowerCase() === 'true') : false,
                cargador: idxCargador !== -1 ? (cols[idxCargador]?.toLowerCase() === 'true') : false,
                caja: idxCaja !== -1 ? (cols[idxCaja]?.toLowerCase() === 'true') : false,
                sim: idxSim !== -1 ? (cols[idxSim]?.toLowerCase() === 'true') : false,
                simNumber: idxSimNum !== -1 ? cols[idxSimNum] : '',
                operadora: idxOper !== -1 ? (cols[idxOper]?.toUpperCase() as any) : '',
                modeloManual: idxModManual !== -1 ? cols[idxModManual] : '',
                modeloNegocio: idxNegocio !== -1 ? (cols[idxNegocio]?.toUpperCase() as any) : '',
                entregadoTecnico: idxEntregadoTec !== -1 ? (cols[idxEntregadoTec]?.toLowerCase() === 'true') : false,
                esSustitucion: idxSust !== -1 ? (cols[idxSust]?.toLowerCase() === 'true') : false,
                serialSustituto: idxSerialSust !== -1 ? cols[idxSerialSust] : '',
                simSustituto: idxSimSust !== -1 ? (cols[idxSimSust]?.toLowerCase() === 'true') : false,
                simSustitutoNumber: idxSimSustNum !== -1 ? cols[idxSimSustNum] : '',
                fechaSalida: idxFechaSalida !== -1 ? cols[idxFechaSalida] : '',
                fechaSalidaCliente: idxFechaLiberacion !== -1 ? cols[idxFechaLiberacion] : '',
                guiaSalidaCliente: idxGuiaLib !== -1 ? cols[idxGuiaLib] : '',
                destinoSalida: idxDestinoSalida !== -1 ? cols[idxDestinoSalida] : '',
                fechaConfirmada: idxFechaConfirmada !== -1 ? (cols[idxFechaConfirmada]?.toLowerCase() === 'true') : false,
                ticket: idxTicket !== -1 ? cols[idxTicket].toUpperCase() : '',
                destino: idxDestino !== -1 ? cols[idxDestino].toUpperCase() : '',
                banco: idxBanco !== -1 ? cols[idxBanco]?.toUpperCase() : '',
                bsf: idxBsf !== -1 ? cols[idxBsf]?.toUpperCase() : '',
                usdt: idxUsdt !== -1 ? cols[idxUsdt]?.toUpperCase() : '',
                cruceBatchId: idxCruceBatchId !== -1 ? cols[idxCruceBatchId] : '',
                addedFromCruce: idxAddedFromCruce !== -1 ? (cols[idxAddedFromCruce]?.toLowerCase() === 'true') : false
              };

              parsedRecords.push({
                id: rawIdVal,
                idStr,
                isSustRow,
                item: recordItem
              });
            }

            const importedItems = mergeImportedRecords(parsedRecords);

            if (importedItems.length > 0) {
              // Ensure absolute uniqueness across the imported array
              const seenImportedIds = new Set<number>();
              const maxExistingId = serials.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);
              let fallbackId = maxExistingId + 1;

              const sanitizedImported = importedItems.map((item) => {
                if (!item.id || seenImportedIds.has(item.id)) {
                  const assigned = fallbackId++;
                  seenImportedIds.add(assigned);
                  return { ...item, id: assigned };
                }
                seenImportedIds.add(item.id);
                return item;
              });

              setSerials(sanitizedImported);
              alert(`¡Se importaron ${sanitizedImported.length} terminales exitosamente!`);
            } else {
              alert("No se cargaron registros válidos del archivo.");
            }
          }
        } catch (e: any) {
          alert(`Error procesando e importando el archivo: ${e.message}`);
        }
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  };

  const handleExportCSV = () => {
    const searchLow = globalSearch.toLowerCase();

    // 1. Tab General
    if (currentTab === 'general') {
      const filtered = serials.filter(s => {
        if (!includeCasillero && s.isCasillero) return false;
        if (dateFrom && s.date < dateFrom) return false;
        if (dateTo && s.date > dateTo) return false;
        if (globalSearch) {
          const matches =
            s.serial.toLowerCase().includes(searchLow) ||
            s.remitente.toLowerCase().includes(searchLow) ||
            (s.rif && s.rif.toLowerCase().includes(searchLow)) ||
            (s.razonSocial && s.razonSocial.toLowerCase().includes(searchLow)) ||
            (s.source && s.source.toLowerCase().includes(searchLow)) ||
            (s.destino && s.destino.toLowerCase().includes(searchLow)) ||
            (s.ticket && s.ticket.toLowerCase().includes(searchLow));
          if (!matches) return false;
        }
        return true;
      });

      let csv = "sep=;\nSERIAL;ESTADO;REMITENTE;RIF;RAZON_SOCIAL;TICKET;GUIA_ENTRADA;DESTINO;FECHA_INGRESO\n";
      filtered.forEach(s => {
        csv += [
          s.serial,
          s.status,
          s.remitente,
          s.rif || '',
          s.razonSocial || '',
          s.ticket || '',
          s.source || '',
          s.destino || '',
          s.date
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
      });

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const d = new Date();
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const filename = includeCasillero ? `disglobal_tracking_report_${localDate}.csv` : `disglobal_tracking_report_sin_casillero_${localDate}.csv`;
      downloadBlob(blob, filename);
      return;
    }

    // 2. Tab Casillero
    if (currentTab === 'casillero') {
      const filtered = serials.filter(s => {
        if (!s.isCasillero) return false;
        if (dateFrom && s.date < dateFrom) return false;
        if (dateTo && s.date > dateTo) return false;
        if (globalSearch) {
          const matches =
            s.serial.toLowerCase().includes(searchLow) ||
            s.remitente.toLowerCase().includes(searchLow) ||
            (s.rif && s.rif.toLowerCase().includes(searchLow)) ||
            (s.razonSocial && s.razonSocial.toLowerCase().includes(searchLow)) ||
            (s.source && s.source.toLowerCase().includes(searchLow)) ||
            (s.destino && s.destino.toLowerCase().includes(searchLow)) ||
            (s.ticket && s.ticket.toLowerCase().includes(searchLow));
          if (!matches) return false;
        }
        return true;
      });

      let csv = "sep=;\nFECHA_ENTRADA;SERIAL;ESTATUS;REMITENTE;GUIA_ENTRADA;RIF;RAZON_SOCIAL;DESTINO;OBSERVACIONES;RESPONSABLE;FORRO;BATERIA;CARGADOR;CAJA;SIM;SIM_NUMBER;MODELO_NEGOCIO;TICKET\n";
      filtered.forEach(s => {
        csv += [
          s.displayDate || s.date || '',
          s.serial,
          s.status,
          s.remitente,
          s.source || '',
          s.rif || '',
          s.razonSocial || '',
          s.destino || '',
          s.notaReparacion || s.observaciones || '',
          s.responsable || '',
          s.forro ? 'SI' : 'NO',
          s.bateria ? 'SI' : 'NO',
          s.cargador ? 'SI' : 'NO',
          s.caja ? 'SI' : 'NO',
          s.sim ? 'SI' : 'NO',
          s.simNumber || '',
          s.modeloNegocio || '',
          s.ticket || ''
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
      });

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const d = new Date();
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const filename = `casillero_report_${localDate}.csv`;
      downloadBlob(blob, filename);
      return;
    }

    // 3. Tab Stand-by (includes stateful + derived items)
    if (currentTab === 'standby') {
      const derived = serials
        .filter(s => s.isCasillero && s.status !== 'RECUPERADO' && !s.fechaConfirmada && (!s.esSustitucion || (!s.serialSustituto || !s.fechaSalida)))
        .map(s => {
          let reason = 'PENDIENTE CONFIRMACIÓN SALIDA';
          if (s.esSustitucion && (!s.serialSustituto || !s.fechaSalida)) {
            reason = 'SUSTITUCIÓN INCOMPLETA';
          }
          return {
            date: s.date,
            serial: s.serial,
            guia: s.source || '',
            comentario: `CASILLERO · ${s.razonSocial || 'SIN CLIENTE'} · ${reason}`.toUpperCase(),
            status: 'PENDIENTE',
            processedDate: ''
          };
        });

      const listCombined = [...standbyList, ...derived];

      const searchLowObj = globalSearch.toLowerCase();
      const filtered = listCombined.filter(item => {
        if (!globalSearch) return true;
        return (
          item.serial.toLowerCase().includes(searchLowObj) ||
          item.guia.toLowerCase().includes(searchLowObj) ||
          item.comentario.toLowerCase().includes(searchLowObj)
        );
      });

      let csv = "sep=;\nFECHA;SERIAL;GUIA;COMENTARIO;ESTADO;FECHA_PROCESADO\n";
      filtered.forEach(item => {
        csv += [
          item.date,
          item.serial || '',
          item.guia || '',
          item.comentario || '',
          item.status,
          item.processedDate
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
      });

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const d = new Date();
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const filename = `standby_report_${localDate}.csv`;
      downloadBlob(blob, filename);
      return;
    }

    // 4. Tab Envios
    if (currentTab === 'envios') {
      const filtered = enviosExternos.filter(e => {
        if (dateFrom && e.fecha < dateFrom) return false;
        if (dateTo && e.fecha > dateTo) return false;
        if (globalSearch) {
          const matches =
            e.serial.toLowerCase().includes(searchLow) ||
            e.guia.toLowerCase().includes(searchLow) ||
            (e.rif && e.rif.toLowerCase().includes(searchLow)) ||
            (e.razonSocial && e.razonSocial.toLowerCase().includes(searchLow)) ||
            (e.destino && e.destino.toLowerCase().includes(searchLow)) ||
            (e.ticket && e.ticket.toLowerCase().includes(searchLow)) ||
            (e.solicitante && e.solicitante.toLowerCase().includes(searchLow));
          if (!matches) return false;
        }
        return true;
      });

      let csv = "sep=;\nFECHA_ENVIO;GUIA;SERIAL;RIF;RAZON_SOCIAL;DESTINO;TICKET;SOLICITANTE;FECHA_INGRESO\n";
      filtered.forEach(e => {
        const matchPOS = serials.find(s => s.serial === e.serial);
        const fechaIngreso = matchPOS ? (matchPOS.displayDate || matchPOS.date || '') : '';
        csv += [
          e.fecha,
          e.guia,
          e.serial,
          e.rif || '',
          e.razonSocial || '',
          e.destino || '',
          e.ticket || '',
          e.solicitante || '',
          fechaIngreso
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
      });

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const d = new Date();
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const filename = `envios_externos_report_${localDate}.csv`;
      downloadBlob(blob, filename);
      return;
    }

    // 5. Tab Simcards
    if (currentTab === 'simcards') {
      const annulledSims = (simCardBatches || []).flatMap(b =>
        (b.serials || []).map((s: string) => ({
          serial: s,
          source: `Lote: ${b.title}`,
          status: 'ANULADA',
          date: b.date
        }))
      );

      const filtered = annulledSims.filter(s => {
        if (!globalSearch) return true;
        return s.serial.toLowerCase().includes(searchLow) || s.source.toLowerCase().includes(searchLow);
      });

      let csv = "sep=;\nSERIAL_SIM;LOTE_REGISTRO;ESTADO;FECHA\n";
      filtered.forEach(s => {
        csv += [
          s.serial,
          s.source,
          s.status,
          s.date
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
      });

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const d = new Date();
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const filename = `simcards_anuladas_report_${localDate}.csv`;
      downloadBlob(blob, filename);
      return;
    }

    // 6. Tab Usuarios
    if (currentTab === 'usuarios') {
      const allUserKeys = Array.from(new Set([
        ...Object.keys(usersProfiles),
        ...serials.map(s => s.remitente).filter(Boolean)
      ]));

      const matrix = allUserKeys.map(key => {
        const p = usersProfiles[key];
        const isCliente = p ? !!p.isCliente : serials.some(s => s.remitente === key && (s.rif || s.razonSocial));
        const type = isCliente ? 'CLIENTE' : 'USUARIO';
        const department = p?.area || '';
        const rif = p?.rif || '';
        const razonSocial = p?.razonSocial || key;
        const ubicacion = p?.ubicacion || '';
        const telefono = p?.telefono || '';
        const count = serials.filter(s => s.remitente === key).length;

        return { key, type, department, rif, razonSocial, ubicacion, telefono, count };
      }).filter(u => {
        if (!globalSearch) return true;
        return (
          u.key.toLowerCase().includes(searchLow) ||
          u.type.toLowerCase().includes(searchLow) ||
          u.department.toLowerCase().includes(searchLow) ||
          u.rif.toLowerCase().includes(searchLow) ||
          u.razonSocial.toLowerCase().includes(searchLow)
        );
      });

      let csv = "sep=;\nREMITENTE;TIPO;DEPARTAMENTO;RIF;RAZON_SOCIAL;UBICACION;TELEFONO;TOTAL_EQUIPOS\n";
      matrix.forEach(u => {
        csv += [
          u.key,
          u.type,
          u.department,
          u.rif,
          u.razonSocial,
          u.ubicacion,
          u.telefono,
          u.count
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
      });

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const d = new Date();
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const filename = `usuarios_directorio_report_${localDate}.csv`;
      downloadBlob(blob, filename);
      return;
    }

    // Default fallback
    const filtered = serials.filter(s => {
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      if (globalSearch) {
        const matches =
          s.serial.toLowerCase().includes(searchLow) ||
          s.remitente.toLowerCase().includes(searchLow);
        if (!matches) return false;
      }
      return true;
    });

    let csv = "sep=;\nSERIAL;ESTADO;REMITENTE;FECHA_INGRESO\n";
    filtered.forEach(s => {
      csv += [s.serial, s.status, s.remitente, s.date].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const filename = `report_${localDate}.csv`;
    downloadBlob(blob, filename);
  };

  const handleExportJSON = () => {
    const dataObj = {
      backup: 'DISGLOBAL TRACKING',
      date: new Date().toISOString(),
      serials,
      enviosExternos,
      modelosDB,
      usersProfiles
    };
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const filename = `pedro_disglobal_backup_${localDate}.json`;
    downloadBlob(blob, filename);
  };

  const handleExportFullCSVBackup = () => {
    const exportRecords = prepareExportRecords(serials);
    let csv = "sep=;\nID;SERIAL_CRUCE;SERIAL_CASILLERO;STATUS;REMITENTE;GUI_ENTRADA;IS_CASILLERO;RIF;RAZON_SOCIAL;DESTINO;OBSERVACIONES;RESPONSABLE;FORRO;BATERIA;CARGADOR;CAJA;SIM;SIM_NUMBER;OPERADORA;MODELO_MANUAL;MODELO_NEGOCIO;ENTREGADO_TECNICO;ES_SUSTITUCION;SERIAL_SUSTITUTO;SIM_SUSTITUTO;SIM_SUSTITUTO_NUMBER;FECHA_SALIDA;FECHA_SALIDA_CLIENTE;GUIA_SALIDA_CLIENTE;DESTINO_SALIDA;FECHA_CONFIRMADA;TICKET;ADDED_FROM_CRUCE;BANCO;BSF;USDT;CRUCE_BATCH_ID;FECHA_INGRESO\n";
    exportRecords.forEach(r => {
      const s = r.item;
      const serialCruce = !s.isCasillero ? s.serial : '';
      const serialCasillero = s.isCasillero ? s.serial : '';
      csv += `"${r.idStr}";"${serialCruce}";"${serialCasillero}";"${s.status}";"${s.remitente}";"${s.source || ''}";"${!!s.isCasillero}";"${s.rif || ''}";"${s.razonSocial || ''}";"${s.destino || ''}";"${s.notaReparacion || s.observaciones || ''}";"${s.responsable || ''}";"${!!s.forro}";"${!!s.bateria}";"${!!s.cargador}";"${!!s.caja}";"${!!s.sim}";"${s.simNumber || ''}";"${s.operadora || ''}";"${s.modeloManual || ''}";"${s.modeloNegocio || ''}";"${!!s.entregadoTecnico}";"${!!s.esSustitucion}";"${s.serialSustituto || ''}";"${!!s.simSustituto}";"${s.simSustitutoNumber || ''}";"${s.fechaSalida || ''}";"${s.fechaSalidaCliente || ''}";"${s.guiaSalidaCliente || ''}";"${s.destinoSalida || ''}";"${!!s.fechaConfirmada}";"${s.ticket || ''}";"${!!s.addedFromCruce}";"${s.banco || ''}";"${s.bsf || ''}";"${s.usdt || ''}";"${s.cruceBatchId || ''}";"${s.date}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const filename = `backup_completo_disglobal_${localDate}.csv`;
    downloadBlob(blob, filename);
  };

  // -------------------------------------------------------------
  // HISTORY TOOLTIP LOGIC (POP OVERLAY ON HOVER)
  const showHistory = (serial: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    setHistoryTooltip({
      serial,
      clientX: rect.left,
      clientY: rect.bottom + window.scrollY
    });
  };

  const hideHistory = () => {
    setHistoryTooltip(null);
  };

  // Filter history logs for current serial
  const getSerialHistoryLogs = (serial: string) => {
    return serials
      .filter(s => s.serial === serial)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getProfileWithFallback = (remName: string) => {
    const p = usersProfiles[remName];
    if (p && (p.isUsuario || p.isCliente)) return p;

    // Find fallback from serials
    const associatedSerials = serials.filter(s => s.remitente && s.remitente.toUpperCase().trim() === remName.toUpperCase().trim());
    const fallbackRif = associatedSerials.find(s => s.rif)?.rif || '';
    const fallbackRazonSocial = associatedSerials.find(s => s.razonSocial)?.razonSocial || '';
    const fallbackUbicacion = associatedSerials.find(s => s.destino)?.destino || '';
    const isCliente = !!(fallbackRif || fallbackRazonSocial);

    return {
      remitenteId: remName,
      nombreCompleto: p?.nombreCompleto || fallbackRazonSocial || remName,
      isUsuario: p?.isUsuario !== undefined ? p.isUsuario : !isCliente,
      isCliente: p?.isCliente !== undefined ? p.isCliente : isCliente,
      area: p?.area || '',
      cargo: p?.cargo || '',
      rif: p?.rif || fallbackRif,
      razonSocial: p?.razonSocial || fallbackRazonSocial || remName,
      ubicacion: p?.ubicacion || fallbackUbicacion,
      telefono: p?.telefono || ''
    };
  };

  // Dynamic Notification Calculation: serials added with different dates
  const duplicateSerialsList = useMemo(() => {
    const serialMap: Record<string, string[]> = {};
    serials.forEach(s => {
      if (!s.serial) return;
      const cleanSerial = s.serial.trim().toUpperCase();
      if (!serialMap[cleanSerial]) {
        serialMap[cleanSerial] = [];
      }
      const d = s.date || '';
      if (!serialMap[cleanSerial].includes(d)) {
        serialMap[cleanSerial].push(d);
      }
    });

    const list: { serial: string; dates: string[] }[] = [];
    Object.entries(serialMap).forEach(([serial, dates]) => {
      if (dates.length > 1) {
        list.push({ serial, dates });
      }
    });
    return list;
  }, [serials]);

  // Dynamic Notification Calculation: SIM cards duplicated or repeated in cancellation logs
  const duplicateSimsList = useMemo(() => {
    const simMap: Record<string, { batchTitle: string; date: string }[]> = {};
    (simCardBatches || []).forEach(b => {
      (b.serials || []).forEach((s: string) => {
        if (!s) return;
        const cleanSim = s.trim().toUpperCase();
        if (!simMap[cleanSim]) {
          simMap[cleanSim] = [];
        }
        simMap[cleanSim].push({ batchTitle: b.title, date: b.date });
      });
    });

    const list: { sim: string; occurrences: { batchTitle: string; date: string }[] }[] = [];
    Object.entries(simMap).forEach(([sim, occurrences]) => {
      if (occurrences.length > 1) {
        list.push({ sim, occurrences });
      }
    });
    return list;
  }, [simCardBatches]);

  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const prevNotificationsLength = useRef(0);

  const totalNotificationsLen = duplicateSerialsList.length + duplicateSimsList.length;

  useEffect(() => {
    if (totalNotificationsLen > prevNotificationsLength.current) {
      setShowNotificationBadge(true);
    }
    prevNotificationsLength.current = totalNotificationsLen;
  }, [totalNotificationsLen]);

  const notificationCount = totalNotificationsLen;

  // Batch processing logic
  const uniqueBatches = useMemo(() => {
    const batches = new Set<string>();
    serials.forEach(s => {
      if (s.cruceBatchId) batches.add(s.cruceBatchId);
    });
    return Array.from(batches).sort().reverse(); // Newest first
  }, [serials]);

  const allBatchesOptions = useMemo(() => {
    const list = [...uniqueBatches];
    if (activeCruceBatchId && !list.includes(activeCruceBatchId)) {
      list.unshift(activeCruceBatchId);
    }
    return list;
  }, [uniqueBatches, activeCruceBatchId]);

  // Autodetect newest batch if activeCruceBatchId is empty and batches exist
  useEffect(() => {
    if (!isLoading && !activeCruceBatchId && uniqueBatches.length > 0) {
      setActiveCruceBatchId(uniqueBatches[0]);
    }
  }, [uniqueBatches, activeCruceBatchId, isLoading]);

  // -------------------------------------------------------------
  // LOADING SCREEN
  // -------------------------------------------------------------
  // Show Login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-6 font-sans">
        <LogoIcon className="w-24 h-24 animate-pulse shrink-0" color="#2c3e50" />
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-800 font-mono text-xs uppercase tracking-[0.2em]">
            Cargando base de datos...
          </p>
          <p className="text-slate-500 font-mono text-[10px] tracking-wider">
            TRACKING · IndexedDB
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-300 flex font-sans antialiased overflow-hidden h-screen">

      {/* 1. SIDEBAR IZQUIERDA VERTICAL */}
      <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#f8fafc] border-r border-slate-200 flex flex-col justify-between shrink-0 h-full select-none z-10`}>

        <div className="flex flex-col gap-6">
          {/* Logo — botón de toggle estilizado igual que los otros del menú */}
          <div className="flex flex-col pb-3 px-3 pt-3 border-b border-slate-200">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title="Colapsar / Expandir menú"
              className={`sidebar-btn flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3.5 px-4 py-2'} w-full cursor-pointer transition-all border border-black bg-white`}
              style={{ borderRadius: '0px' }}
            >
              <LogoIcon className="w-10 h-10 shrink-0" color="#000000" />
              {!isSidebarCollapsed && (
                <h1 className="text-xs font-black uppercase tracking-wider leading-none text-black">
                  TRACKING
                </h1>
              )}
            </button>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className={`flex flex-col gap-1.5 px-3`}>
            {[
              { id: 'general', label: 'Gestión General', icon: Home },
              { id: 'casillero', label: 'Casillero', icon: Flag },
              { id: 'hacerEnvio', label: 'Hacer Envío', icon: ArrowUpRight },
              { id: 'cruce', label: 'Cruce de Seriales', icon: Network },
              { id: 'standby', label: 'Stand-by', icon: Clock },
              { id: 'envios', label: 'Equipos Enviados', icon: FileSpreadsheet },
              { id: 'simcards', label: 'Gestión de SIM-Cards', icon: CardSim },
              { id: 'modelos', label: 'Modelos Registrados', icon: Smartphone },
              { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
              { id: 'usuarios', label: 'Usuarios / Clientes', icon: Users }
            ].map(t => {
              const Icon = t.icon;
              const isActive = currentTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setCurrentTab(t.id)}
                  title={t.label}
                  className={`sidebar-btn flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'} text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer text-left w-full ${isActive
                      ? 'bg-slate-800 text-white border-black shadow-sm font-black active-tab'
                      : 'bg-white text-black hover:bg-slate-100 border-black'
                    }`}
                  style={{ borderRadius: '0px' }}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-black'} />
                  {!isSidebarCollapsed && <span className="truncate">{t.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Estatus en el pie del Sidebar */}
        <div className={`border-t border-slate-200 pt-4 p-4 text-[9px] text-slate-400 font-mono flex flex-col gap-1.5 ${isSidebarCollapsed ? 'items-center' : ''}`}>
          {!isSidebarCollapsed ? (
            <>
              <span>© {new Date().getFullYear()} TRACKING</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                Storage: IndexedDB
              </span>
            </>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse" title="Storage Connected"></span>
          )}
        </div>
      </aside>

      {/* 2. CONTENEDOR DE CONTENIDO PRINCIPAL (DERECHA) */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#f5f6f8] overflow-hidden">

        {/* HEADER BAR CON TÍTULOS Y ACCIONES DE IMPORTACIÓN/EXPORTACIÓN */}
        <header className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1">
              <span className="text-[10px] font-bold bg-[#2c3e50] text-white px-2 py-0.5 rounded-full font-mono uppercase tracking-widest" style={{ color: '#ffffff' }}>TRACKING</span>
            </div>

            <div className="h-4 w-px bg-slate-300"></div>

            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {currentTab === 'general' && 'Gestión General de Seriales'}
              {currentTab === 'casillero' && 'Control de Casillero'}
              {currentTab === 'hacerEnvio' && 'Envío Logístico'}
              {currentTab === 'cruce' && 'Cruce Inteligente de Seriales'}
              {currentTab === 'standby' && 'Equipos en Camino (Stand-by)'}
              {currentTab === 'envios' && 'Equipos Despachados / Enviados'}
              {currentTab === 'simcards' && 'Gestión de SIM-Cards / Historial de Anulaciones'}
              {currentTab === 'modelos' && 'Configuración de Modelos'}
              {currentTab === 'estadisticas' && 'Métricas y Estadísticas'}
              {currentTab === 'usuarios' && 'Directorio de Remitentes'}
            </h2>
          </div>

          <div className="flex items-center gap-5">
            {/* ACCIONES DE IMPORTACIÓN/EXPORTACIÓN COMPACTAS */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleImportCSVData}
                className="p-2 bg-white text-black hover:bg-slate-100 border border-black flex items-center justify-center transition-all cursor-pointer header-action-btn"
                style={{ borderRadius: '0px' }}
                title="Importar CSV"
              >
                <FileSpreadsheet size={15} className="text-black" />
              </button>

              <button
                onClick={handleExportCSV}
                className="p-2 bg-white text-black hover:bg-slate-100 border border-black flex items-center justify-center transition-all cursor-pointer header-action-btn"
                style={{ borderRadius: '0px' }}
                title="Exportar CSV"
              >
                <Download size={15} className="text-black" />
              </button>

              <button
                onClick={handleExportFullCSVBackup}
                className="p-2 bg-white text-black hover:bg-slate-100 border border-black flex items-center justify-center transition-all cursor-pointer header-action-btn"
                style={{ borderRadius: '0px' }}
                title="Respaldar Base de Datos (Full CSV)"
              >
                <Database size={15} className="text-black" />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* NOTIFICATION BELL */}
            <div className="relative notification-container">
              <div
                onClick={() => {
                  setShowNotificationsMenu(!showNotificationsMenu);
                  setShowNotificationBadge(false);
                }}
                className="cursor-pointer hover:bg-slate-50 p-2 rounded-full border border-slate-200 flex items-center justify-center text-slate-600"
              >
                <Bell size={16} />
                {notificationCount > 0 && showNotificationBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-black font-sans leading-none border border-white">
                    {notificationCount}
                  </span>
                )}
              </div>

              {/* Dropdown Menu for Notifications */}
              {showNotificationsMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl w-72 z-50 animate-fade-in overflow-hidden font-arial text-left">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Alertas de Duplicados</div>
                    <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{notificationCount}</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {duplicateSerialsList.length === 0 && duplicateSimsList.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 font-semibold uppercase">Ninguna Alerta</div>
                    ) : (
                      <>
                        {duplicateSerialsList.map(item => (
                          <div
                            key={`serial-${item.serial}`}
                            className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setGlobalSearch(item.serial);
                              setCurrentTab('general');
                              setShowNotificationsMenu(false);
                            }}
                          >
                            <div className="text-xs font-bold text-slate-800 tracking-wider font-mono flex items-center justify-between">
                              <span>{item.serial} (POS)</span>
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase font-sans">Ver</span>
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase">
                              Fechas: {item.dates.map(d => d.split('-').reverse().join('/')).join(' / ')}
                            </div>
                          </div>
                        ))}
                        {duplicateSimsList.map(item => (
                          <div
                            key={`sim-${item.sim}`}
                            className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setGlobalSearch(item.sim);
                              setCurrentTab('simcards');
                              setShowNotificationsMenu(false);
                            }}
                          >
                            <div className="text-xs font-bold text-slate-800 tracking-wider font-mono flex items-center justify-between">
                              <span className="text-red-750 font-extrabold">{item.sim} (SIM)</span>
                              <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase font-sans">Ver</span>
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase">
                              Lotes: {item.occurrences.map(o => `${o.batchTitle} (${o.date.split('-').reverse().join('/')})`).join(' / ')}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* USER PROFILE INFO + LOGOUT */}
            <div className="relative">
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="text-right hidden sm:block">
                  <div className="text-[14px] font-bold text-slate-800 uppercase font-arial leading-none">PEDRO</div>
                  <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider font-arial leading-none">ESPECIALISTA EN NEXGO</div>
                </div>

                {/* Profile Image Circle representation */}
                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300 shadow-sm select-none">
                  P
                </div>
              </div>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl w-48 z-50 animate-fade-in overflow-hidden">
                  <div className="p-3 border-b border-slate-100">
                    <div className="text-[14px] font-bold text-slate-800 uppercase font-arial">PEDRO</div>
                    <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase font-arial">ESPECIALISTA EN NEXGO</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left uppercase tracking-wider"
                  >
                    <LogOut size={14} />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SUBHEADER: FILTROS REACTIVOS UNIFICADOS */}
        <section className="bg-[#f8fafc] border-b border-slate-200 p-4 px-8 shrink-0">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* BUSCADOR */}
            <div className="relative">
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="BUSCAR SERIAL, RIF, GUIA O REMITENTE"
                className="w-full text-[11px] p-2.5 pl-8 bg-white border border-black rounded-lg text-black uppercase placeholder-slate-400 font-semibold focus:outline-none focus:border-black transition-all font-mono search-input"
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-black font-bold" />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3 top-2.5 text-[9px] font-bold text-black hover:text-red-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* RANGO DE FECHAS */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full text-[11px] p-2 bg-white border border-slate-250 rounded-lg text-slate-700 font-mono uppercase"
                />
                <span className="absolute -top-1.5 left-2 px-1 text-[7px] bg-[#f8fafc] text-slate-400 font-black tracking-widest uppercase">Desde</span>
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full text-[11px] p-2 bg-white border border-slate-250 rounded-lg text-slate-700 font-mono uppercase"
                />
                <span className="absolute -top-1.5 left-2 px-1 text-[7px] bg-[#f8fafc] text-slate-400 font-black tracking-widest uppercase">Hasta</span>
              </div>
            </div>

            {/* CHECKBOX DE CASILLERO */}
            <div className="flex items-center justify-end md:justify-center lg:justify-end gap-3 px-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 select-none cursor-pointer tracking-wider">
                <input
                  type="checkbox"
                  checked={includeCasillero}
                  onChange={e => setIncludeCasillero(e.target.checked)}
                  className="rounded text-slate-800 bg-white border-slate-350 focus:ring-0 focus:ring-offset-0"
                />
                <span>INCLUIR CASILLEROS</span>
              </label>
            </div>

          </div>
        </section>

        {/* AREA DE TRABAJO SCROLLABLE */}
        <main className="flex-1 overflow-y-auto p-8 dashboard-bg">

          <div className={currentTab === 'general' ? '' : 'hidden'}>
            <GestionGeneral
              serials={serials}
              setSerials={setSerials}
              modelosDB={modelosDB}
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              includeCasillero={includeCasillero}
              setIncludeCasillero={setIncludeCasillero}
              onShowHistory={showHistory}
              onHideHistory={hideHistory}
              onUserClick={(remitente: string) => setViewingProfile(remitente)}
              usersProfiles={usersProfiles}
              setUsersProfiles={setUsersProfiles}
              activeCruceBatchId={activeCruceBatchId}
            />
          </div>

          <div className={currentTab === 'casillero' ? '' : 'hidden'}>
            <Casillero
              serials={serials}
              setSerials={setSerials}
              modelosDB={modelosDB}
              globalSearch={globalSearch}
              dateFrom={dateFrom}
              dateTo={dateTo}
              statusFilter="TODOS"
              onUserClick={(remitente: string) => setViewingProfile(remitente)}
              usersProfiles={usersProfiles}
              setUsersProfiles={setUsersProfiles}
              activeCruceBatchId={activeCruceBatchId}
            />
          </div>

          <div className={currentTab === 'hacerEnvio' ? '' : 'hidden'}>
            <HacerEnvio
              enviosExternos={enviosExternos}
              setEnviosExternos={setEnviosExternos}
              serials={serials}
              setSerials={setSerials}
              activeCruceBatchId={activeCruceBatchId}
            />
          </div>

          <div className={currentTab === 'cruce' ? '' : 'hidden'}>
            <CruceSeriales
              serials={serials}
              setSerials={setSerials}
              modelosDB={modelosDB}
              onUserClick={(remitente: string) => setViewingProfile(remitente)}
              usersProfiles={usersProfiles}
              activeCruceBatchId={activeCruceBatchId}
              setActiveCruceBatchId={setActiveCruceBatchId}
              setCurrentTab={setCurrentTab}
            />
          </div>

          <div className={currentTab === 'standby' ? '' : 'hidden'}>
            <StandBy
              standbyList={standbyList}
              setStandbyList={setStandbyList}
              serials={serials}
              setSerials={setSerials}
            />
          </div>

          <div className={currentTab === 'envios' ? '' : 'hidden'}>
            <EquiposEnviados
              serials={serials}
              enviosExternos={enviosExternos}
              modelosDB={modelosDB}
              globalSearch={globalSearch}
              dateFrom={dateFrom}
              dateTo={dateTo}
              activeCruceBatchId={activeCruceBatchId}
            />
          </div>

          <div className={currentTab === 'simcards' ? '' : 'hidden'}>
            <GestionSimCards
              simCardBatches={simCardBatches}
              setSimCardBatches={setSimCardBatches}
            />
          </div>

          <div className={currentTab === 'modelos' ? '' : 'hidden'}>
            <Modelos
              modelosDB={modelosDB}
              setModelosDB={setModelosDB}
            />
          </div>

          <div className={currentTab === 'estadisticas' ? '' : 'hidden'}>
            <Estadisticas
              serials={serials}
              modelosDB={modelosDB}
              onUserClick={(remitente: string) => setViewingProfile(remitente)}
              usersProfiles={usersProfiles}
              simCardBatches={simCardBatches}
            />
          </div>

          <div className={currentTab === 'usuarios' ? '' : 'hidden'}>
            <Usuarios
              serials={serials}
              modelosDB={modelosDB}
              globalSearch={globalSearch}
              usersProfiles={usersProfiles}
              setUsersProfiles={setUsersProfiles}
            />
          </div>

        </main>
      </div>

      {/* FLOATING RETRACED HISTORY OVERLAY POPUP */}
      {historyTooltip && (
        <div
          className="absolute z-50 bg-[#0f0f11] border border-[#3f3f46] rounded-lg p-3.5 shadow-2xl min-w-[270px] max-w-[340px] pointer-events-none mt-2 font-mono text-[11px] animate-fade-in uppercase font-bold"
          style={{
            left: historyTooltip.clientX,
            top: historyTooltip.clientY,
            color: '#ffffff'
          }}
        >
          <div className="font-bold text-[11px] border-b border-[#3f3f46] pb-1.5 mb-1.5 uppercase font-sans tracking-wider" style={{ color: '#ffffff' }}>
            RECIBO DE HISTORIAL
          </div>
          <div className="font-sans tracking-wide uppercase" style={{ color: '#ffffff' }}>
            SERIAL: <span className="font-mono text-xs font-black uppercase" style={{ color: '#ffffff' }}>{historyTooltip.serial}</span>
          </div>

          <div className="mt-2 text-[10px] space-y-1.5 uppercase" style={{ color: '#ffffff' }}>
            {getSerialHistoryLogs(historyTooltip.serial).length === 0 ? (
              <div className="uppercase" style={{ color: '#ffffff' }}>NO HAY LOGS PREVIOS EN LA BASE GENERAL.</div>
            ) : (
              getSerialHistoryLogs(historyTooltip.serial).map((log, i) => (
                <div key={i} className="flex justify-between items-center border-b border-[#27272a] pb-1 uppercase" style={{ color: '#ffffff' }}>
                  <div className="uppercase" style={{ color: '#ffffff' }}>
                    <div className="font-bold uppercase" style={{ color: '#ffffff' }}>{log.displayDate}</div>
                    <div className="text-[9px] uppercase" style={{ color: '#a1a1aa' }}>{log.remitente}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white ${['CANCELADO', 'N#A', 'RECUPERADO'].includes(log.status)
                      ? 'bg-green-600 text-white'
                      : ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(log.status)
                        ? 'bg-orange-500 text-white'
                        : log.status === 'SIN ESTATUS'
                          ? 'bg-black text-white border border-zinc-700'
                          : 'bg-zinc-800 text-white'
                    }`} style={{ color: '#ffffff' }}>
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* GLOBAL USER PROFILE MODAL */}
      {viewingProfile && (() => {
        const profile = getProfileWithFallback(viewingProfile);
        return createPortal(
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in-overlay"
            onClick={() => setViewingProfile(null)}
          >
            <div
              className="bg-white border border-slate-100 rounded-2xl w-full max-w-sm max-h-[85vh] p-6 shadow-xl flex flex-col gap-4 overflow-y-auto animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Users size={16} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{viewingProfile}</h3>
                  <p className="text-[9px] text-slate-450 font-mono">Ficha de Remitente Logístico</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 font-sans text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-transparent">
                  <span className="block text-[8px] text-slate-550 uppercase font-bold mb-1">Nombre Completo</span>
                  <span className="text-slate-800 font-semibold uppercase">{profile.nombreCompleto || 'No especificado'}</span>
                </div>

                {/* Categorías */}
                <div className="bg-slate-50 p-3 rounded-xl border border-transparent">
                  <span className="block text-[8px] text-slate-550 uppercase font-bold mb-1">Categorías</span>
                  <div className="flex gap-2 mt-1">
                    {(profile.isUsuario || (!profile.isUsuario && !profile.isCliente)) && (
                      <span className="bg-slate-200 text-slate-800 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider">USUARIO</span>
                    )}
                    {profile.isCliente && (
                      <span className="bg-blue-100 text-blue-850 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider">CLIENTE</span>
                    )}
                  </div>
                </div>

                {/* Datos de Usuario (Trabajador) */}
                {(profile.isUsuario || (!profile.isUsuario && !profile.isCliente)) && (
                  <>
                    <div className="bg-slate-50 p-3 rounded-xl border border-transparent">
                      <span className="block text-[8px] text-slate-555 uppercase font-bold mb-1">Departamento</span>
                      <span className="text-slate-800 font-semibold uppercase">{profile.area || 'No especificada'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-transparent">
                      <span className="block text-[8px] text-slate-550 uppercase font-bold mb-1">Cargo</span>
                      <span className="text-slate-800 font-semibold uppercase">{profile.cargo || 'No especificado'}</span>
                    </div>
                  </>
                )}

                {/* Datos de Cliente */}
                {profile.isCliente && (
                  <>
                    <div className="bg-slate-50 p-3 rounded-xl border border-transparent">
                      <span className="block text-[8px] text-slate-550 uppercase font-bold mb-1">RIF</span>
                      <span className="text-slate-800 font-semibold uppercase">{profile.rif || 'No especificado'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-transparent">
                      <span className="block text-[8px] text-slate-550 uppercase font-bold mb-1">Razón Social</span>
                      <span className="text-slate-800 font-semibold uppercase">{profile.razonSocial || 'No especificada'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-transparent">
                      <span className="block text-[8px] text-slate-550 uppercase font-bold mb-1">Ubicación</span>
                      <span className="text-slate-800 font-semibold uppercase">{profile.ubicacion || 'No especificada'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-transparent">
                      <span className="block text-[8px] text-slate-550 uppercase font-bold mb-1">Número Telefónico</span>
                      <span className="text-slate-800 font-semibold uppercase">{profile.telefono || 'No especificado'}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setViewingProfile(null)}
                className="mt-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* STANDBY TOAST ALERTS */}
      <div className="fixed bottom-6 right-6 z-[150] flex flex-col gap-3 max-w-sm w-full pointer-events-none font-sans">
        {standbyAlerts.map(alert => (
          <div
            key={alert.id}
            className="pointer-events-auto bg-emerald-600 border border-emerald-500 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 animate-slide-in-right relative"
            style={{
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.4)'
            }}
          >
            <div className="bg-white/20 p-2 rounded-xl shrink-0">
              <Bell className="w-4 h-4 text-white animate-bounce" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-100 font-mono">
                ¡EQUIPO EN STAND-BY RECIBIDO!
              </h4>
              <p className="text-xs font-bold mt-1 text-white leading-normal uppercase">
                {alert.mensaje}
              </p>
            </div>
            <button
              onClick={() => setStandbyAlerts(prev => prev.filter(a => a.id !== alert.id))}
              className="text-white/60 hover:text-white cursor-pointer absolute top-3 right-3 text-xs bg-transparent border-none font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
