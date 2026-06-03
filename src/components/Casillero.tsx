import React, { useState, useMemo } from 'react';
import { POSItem, POSStatus, ModelConfig, UserProfile } from '../types';
import { getTerminalModel } from '../data';
import { formatRif } from '../utils';
import { 
  FolderLock, Check, Trash2,
  ChevronLeft, ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

interface CasilleroProps {
  serials: POSItem[];
  setSerials: React.Dispatch<React.SetStateAction<POSItem[]>>;
  modelosDB: Record<string, ModelConfig>;
  globalSearch: string;
  dateFrom: string;
  dateTo: string;
  statusFilter: POSStatus | 'TODOS';
  onUserClick: (remitente: string) => void;
  usersProfiles: Record<string, UserProfile>;
  setUsersProfiles?: React.Dispatch<React.SetStateAction<Record<string, UserProfile>>>;
  activeCruceBatchId: string;
}

export const Casillero: React.FC<CasilleroProps> = ({
  serials,
  setSerials,
  modelosDB,
  globalSearch,
  dateFrom,
  dateTo,
  statusFilter,
  onUserClick,
  usersProfiles,
  setUsersProfiles,
  activeCruceBatchId
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleImportMatriz = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (fileEvent) => {
        try {
          const content = fileEvent.target?.result as string;
          const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) {
            alert("El archivo no contiene suficientes líneas.");
            return;
          }

          let delimiter = ',';
          const firstLine = lines[0];
          if (firstLine.includes('\t')) delimiter = '\t';
          else if (firstLine.includes(';')) delimiter = ';';

          const headers = firstLine.split(delimiter).map(h => {
            return h.trim()
                    .toUpperCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^A-Z0-9]/g, "");
          });

          const idxSerial = headers.findIndex(h => h === 'SERIALENTRANTE' || h === 'SERIAL');
          if (idxSerial === -1) {
            alert("No se encontró la columna 'SERIAL ENTRANTE' en el archivo.");
            return;
          }

          const idxFechaLlegada = headers.findIndex(h => h === 'FECHALLEGADA');
          const idxAgencia = headers.findIndex(h => h === 'AGENCIA');
          const idxGuiaEntrante = headers.findIndex(h => h === 'GUIAENTRANTE');
          const idxModelo = headers.findIndex(h => h === 'MODELO');
          const idxRif = headers.findIndex(h => h === 'RIF');
          const idxRazonSocial = headers.findIndex(h => h === 'RAZONSOCIAL');
          const idxBanco = headers.findIndex(h => h === 'BANCO');
          const idxSimcard = headers.findIndex(h => h === 'SERIALSIMCARD');
          const idxOperadora = headers.findIndex(h => h === 'OPERADORA');
          const idxResponsable = headers.findIndex(h => h === 'RESPONSABLE');
          const idxObservacion = headers.findIndex(h => h === 'OBSERVACION' || h === 'OBSERVACIONES');
          const idxSerialSaliente = headers.findIndex(h => h === 'SERIALSALIENTE');
          const idxFechaSalida = headers.findIndex(h => h === 'FECHASALIDA');
          const idxGuiaSalida = headers.findIndex(h => h === 'GUIASALIDA');
          const idxForro = headers.findIndex(h => h === 'FORRO');
          const idxCargador = headers.findIndex(h => h === 'CARGADOR');
          const idxCaja = headers.findIndex(h => h === 'CAJA');
          const idxSimTogg = headers.findIndex(h => h === 'SIMCARD');
          const idxBateria = headers.findIndex(h => h === 'BATERIA');
          const idxTicket = headers.findIndex(h => h === 'TICKET');
          const idxBs = headers.findIndex(h => h === 'BS' || h === 'BSF');

          const newItems: POSItem[] = [];
          const d = new Date();
          const todayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          let maxId = serials.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            let cols: string[] = [];
            
            if (delimiter === '\t') {
              cols = line.split('\t');
            } else if (delimiter === ';') {
              cols = line.split(';');
            } else {
              let current = '';
              let inQuotes = false;
              for (let charIdx = 0; charIdx < line.length; charIdx++) {
                const char = line[charIdx];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  cols.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              cols.push(current.trim());
            }

            cols = cols.map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length === 0) continue;

            const getColVal = (idx: number): string => {
              if (idx === -1 || idx >= cols.length) return '';
              const val = cols[idx];
              return val !== undefined && val !== null ? val.trim() : '';
            };

            const serialVal = getColVal(idxSerial).toUpperCase();
            if (!serialVal) continue;

            let rawFechaLlegada = getColVal(idxFechaLlegada);
            let dateISO = todayISO;
            
            if (rawFechaLlegada) {
              if (rawFechaLlegada.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                const [day, month, year] = rawFechaLlegada.split('/');
                dateISO = `${year}-${month}-${day}`;
              } else if (rawFechaLlegada.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateISO = rawFechaLlegada;
              }
            }
            const displayDateVal = dateISO.split('-').reverse().join('/');

            const parseBool = (val: string) => {
              if (!val) return false;
              const u = val.toUpperCase();
              return u === 'SI' || u === 'S' || u === 'TRUE' || u === '1';
            };

            maxId++;
            newItems.push({
              id: maxId,
              serial: serialVal,
              date: dateISO,
              displayDate: displayDateVal,
              status: 'SIN ESTATUS',
              remitente: getColVal(idxRazonSocial).toUpperCase() || 'MATRIZ IMPORT',
              source: getColVal(idxGuiaEntrante).toUpperCase(),
              isCasillero: true,
              selected: false,
              rif: formatRif(getColVal(idxRif)),
              razonSocial: getColVal(idxRazonSocial).toUpperCase(),
              destino: getColVal(idxAgencia).toUpperCase(),
              banco: getColVal(idxBanco).toUpperCase(),
              simNumber: getColVal(idxSimcard).toUpperCase(),
              operadora: getColVal(idxOperadora).toUpperCase() as any,
              responsable: getColVal(idxResponsable).toUpperCase(),
              observaciones: getColVal(idxObservacion),
              serialSustituto: getColVal(idxSerialSaliente).toUpperCase(),
              esSustitucion: !!getColVal(idxSerialSaliente),
              fechaSalida: getColVal(idxFechaSalida),
              fechaSalidaCliente: getColVal(idxFechaSalida),
              guiaSalidaCliente: getColVal(idxGuiaSalida).toUpperCase(),
              fechaConfirmada: !!getColVal(idxFechaSalida),
              forro: parseBool(getColVal(idxForro)),
              cargador: parseBool(getColVal(idxCargador)),
              caja: parseBool(getColVal(idxCaja)),
              sim: parseBool(getColVal(idxSimTogg)),
              bateria: parseBool(getColVal(idxBateria)),
              ticket: getColVal(idxTicket).toUpperCase(),
              bsf: getColVal(idxBs).toUpperCase()
            });
          }

          if (newItems.length > 0) {
            setSerials(prev => [...newItems, ...prev]);
            if (setUsersProfiles) {
              setUsersProfiles(prev => {
                const updated = { ...prev };
                newItems.forEach(item => {
                  const rem = item.remitente ? item.remitente.toUpperCase().trim() : '';
                  if (!rem || rem === 'MATRIZ IMPORT') return;
                  
                  const existing = updated[rem];
                  updated[rem] = {
                    remitenteId: rem,
                    nombreCompleto: existing?.nombreCompleto || item.razonSocial || rem,
                    isUsuario: existing?.isUsuario !== undefined ? existing.isUsuario : false,
                    isCliente: true,
                    area: existing?.area || '',
                    cargo: existing?.cargo || '',
                    rif: existing?.rif || item.rif || '',
                    razonSocial: existing?.razonSocial || item.razonSocial || '',
                    ubicacion: existing?.ubicacion || item.destino || '',
                    telefono: existing?.telefono || ''
                  };
                });
                return updated;
              });
            }
            alert(`¡Se importaron ${newItems.length} equipos de la matriz en casillero exitosamente!`);
          } else {
            alert("No se encontraron registros válidos para importar.");
          }
        } catch (err: any) {
          alert(`Error al procesar el archivo: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const deleteSelectedCasillero = () => {
    const selectedIds = new Set(serials.filter(s => s.isCasillero && s.selected).map(s => s.id));
    if (selectedIds.size === 0) {
      alert('NO HAY EQUIPOS SELECCIONADOS');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.size} equipos seleccionados del casillero? Esta acción no se puede deshacer.`)) {
      setSerials(prev => prev.filter(s => !selectedIds.has(s.id)));
    }
  };

  // Filter computations
  const casilleroSerials = useMemo(() => {
    const searchLow = globalSearch.toLowerCase();
    return serials.filter(s => {
      // Casillero criteria: only items registered with isCasillero === true
      if (!s.isCasillero) return false;

      const modelInfo = getTerminalModel(s.serial, modelosDB);
      const inSearch = !globalSearch ||
        s.serial.toLowerCase().includes(searchLow) ||
        s.remitente.toLowerCase().includes(searchLow) ||
        (s.rif && s.rif.toLowerCase().includes(searchLow)) ||
        (s.razonSocial && s.razonSocial.toLowerCase().includes(searchLow)) ||
        (s.source && s.source.toLowerCase().includes(searchLow)) ||
        (s.guiaSalidaCliente && s.guiaSalidaCliente.toLowerCase().includes(searchLow)) ||
        (s.destino && s.destino.toLowerCase().includes(searchLow)) ||
        (s.ticket && s.ticket.toLowerCase().includes(searchLow)) ||
        (s.destinoSalida && s.destinoSalida.toLowerCase().includes(searchLow)) ||
        modelInfo.modelo.toLowerCase().includes(searchLow);

      const matchStatus = statusFilter === 'TODOS' || s.status === statusFilter;
      const matchDateFrom = !dateFrom || s.date >= dateFrom;
      const matchDateTo = !dateTo || s.date <= dateTo;

      return inSearch && matchStatus && matchDateFrom && matchDateTo;
    });
  }, [serials, globalSearch, statusFilter, dateFrom, dateTo, modelosDB]);

  // Group and sort batches
  const finalBatchesList = useMemo(() => {
    const batches = new Set<string>();
    casilleroSerials.forEach(s => {
      if (s.cruceBatchId) {
        batches.add(s.cruceBatchId);
      }
    });

    const sortedBatches = Array.from(batches).sort((a, b) => {
      const matchA = a.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
      const matchB = b.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (matchA && matchB) {
        const dateA = new Date(
          parseInt(matchA[3]),
          parseInt(matchA[2]) - 1,
          parseInt(matchA[1]),
          parseInt(matchA[4]),
          parseInt(matchA[5]),
          parseInt(matchA[6])
        );
        const dateB = new Date(
          parseInt(matchB[3]),
          parseInt(matchB[2]) - 1,
          parseInt(matchB[1]),
          parseInt(matchB[4]),
          parseInt(matchB[5]),
          parseInt(matchB[6])
        );
        return dateB.getTime() - dateA.getTime();
      }
      return b.localeCompare(a);
    });

    const hasHistorial = casilleroSerials.some(s => !s.cruceBatchId);
    if (hasHistorial) {
      sortedBatches.push('HISTORIAL');
    }

    if (sortedBatches.length === 0) {
      return ['HISTORIAL'];
    }
    return sortedBatches;
  }, [casilleroSerials]);

  const totalPages = finalBatchesList.length;
  const activeBatch = finalBatchesList[currentPage - 1] || 'HISTORIAL';

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Sort newest first
  const sortedSerials = useMemo(() => {
    return [...casilleroSerials].sort((a, b) => b.id - a.id);
  }, [casilleroSerials]);

  // Pagination by batch instead of items count
  const paginatedSerials = useMemo(() => {
    return sortedSerials.filter(s => {
      if (activeBatch === 'HISTORIAL') {
        return !s.cruceBatchId;
      }
      return s.cruceBatchId === activeBatch;
    });
  }, [sortedSerials, activeBatch]);

  const toggleBooleanRef = (id: number, key: keyof POSItem) => {
    setSerials(prev => prev.map(s => {
      if (s.id === id) {
        const val = s[key];
        return { ...s, [key]: !val };
      }
      return s;
    }));
  };

  const handleUpdateTextVal = (id: number, key: keyof POSItem, text: string) => {
    setSerials(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [key]: text };
      }
      return s;
    }));
  };

  const handleToggleSelectAll = (checked: boolean) => {
    const visibleIds = new Set(paginatedSerials.map(s => s.id));
    setSerials(prev => prev.map(s => visibleIds.has(s.id) ? { ...s, selected: checked } : s));
  };

  const currentTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-slate-800 pb-10 font-arial">
      
      <div className="flex justify-between items-center dark-panel p-4 flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-slate-900" />
            EQUIPOS RECIBIDOS - {activeBatch === 'HISTORIAL' ? 'HISTORIAL GENERAL' : activeBatch}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleImportMatriz}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-lg border border-transparent transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98 pagination-btn"
            title="Importar Matriz de Envíos"
          >
            <FileSpreadsheet size={14} className="text-white" />
            <span>Importar Matriz</span>
          </button>
          
          <button
            onClick={deleteSelectedCasillero}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase rounded-lg border border-transparent transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98 pagination-btn"
            title="Eliminar seleccionados"
          >
            <Trash2 size={14} className="text-white" />
            <span>ELIMINAR</span>
          </button>
          <span className="text-xs text-slate-700 font-semibold uppercase font-arial bg-slate-100 px-3 py-1.5 rounded-lg border border-transparent shadow-xs">
            {activeBatch === 'HISTORIAL' ? 'Historial' : 'Este Lote'}: {paginatedSerials.length} / Total: {sortedSerials.length}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-transparent shadow-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-white hover:bg-slate-50 disabled:opacity-30 rounded cursor-pointer border border-slate-100 text-slate-700 shadow-xs pagination-btn"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-700">
                Pág. {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-white hover:bg-slate-50 disabled:opacity-30 rounded cursor-pointer border border-slate-100 text-slate-700 shadow-xs pagination-btn"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-slate-800">
        <div className="overflow-x-auto p-1">
          <table className="w-full text-left min-w-[1240px] casillero-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedSerials.length > 0 && paginatedSerials.every(s => s.selected)}
                    onChange={e => handleToggleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 bg-slate-100 border-slate-200 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-4 w-28 text-center">Fecha Entrada</th>
                <th className="py-3 px-4 w-96">Equipo / Ticket / Cliente</th>
                <th className="py-3 px-4 w-44">Accesorios</th>
                <th className="py-3 px-4 w-72">Observaciones</th>
                <th className="py-3 px-4 w-52">Sustitución</th>
                <th className="py-3 px-4 w-72">Liberación / Despacho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSerials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-arial">
                    No hay terminales en casillero que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedSerials.map(s => {
                  const modelInfo = getTerminalModel(s.serial, modelosDB);
                  const isNew = s.date && (Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000) <= 7);
                  const isRepetido = serials.filter(o => o.serial === s.serial).length > 1;

                  const serialColorClass = 'text-slate-800';

                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-slate-50 transition-colors align-top border-b border-slate-100 ${s.selected ? 'bg-blue-50/50' : ''} ${s.addedFromCruce ? 'border-l-2 border-l-slate-400' : ''}`}
                    >
                      {/* SELECTOR */}
                      <td className="py-4 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!s.selected}
                          onChange={() => toggleBooleanRef(s.id, 'selected')}
                          className="rounded text-blue-600 bg-slate-100 border-slate-200 focus:ring-0 mt-1"
                        />
                      </td>

                      {/* ENTRADA (FECHA O GUÍA) */}
                      <td className="py-4 px-3 text-center whitespace-nowrap text-xs font-arial text-slate-800">
                        <div>{s.displayDate}</div>
                        {s.source ? (
                          <div className="mt-1 text-[14px] text-slate-700 font-bold font-arial">
                            GUÍA: <span className="inline-flex items-center gap-1"><span className="text-slate-900 hover:underline cursor-pointer select-all font-bold" onClick={() => handleCopyText(s.source, `guia-${s.id}`)}>{s.source}</span>{copiedKey === `guia-${s.id}` && (<span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 rounded animate-fade-in"><Check size={10} className="text-white" style={{ color: '#fff' }} /></span>)}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-1">MANUAL</div>
                        )}
                        {s.addedFromCruce && (
                          <div className="mt-1.5">
                            <span className="text-[9px] bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold px-2 py-0.5 rounded-full select-none cursor-pointer border border-transparent">
                              CRUCE
                            </span>
                          </div>
                        )}
                      </td>

                      {/* CLASIFICACIÓN Y DATOS COMERCIALES */}
                      <td className="py-4 px-4 text-xs">
                        <div className="flex flex-col gap-1 pr-2">
                          <span className="inline-flex items-center gap-1">
                            <span 
                              className={`text-base cursor-help hover:text-slate-900 select-all font-arial transition-colors font-bold ${serialColorClass}`}
                              onClick={() => handleCopyText(s.serial, `serial-${s.id}`)}
                            >
                              {s.serial}
                            </span>
                            {copiedKey === `serial-${s.id}` && (
                              <span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 rounded animate-fade-in">
                                <Check size={10} className="text-white" style={{ color: '#fff' }} />
                              </span>
                            )}
                          </span>
                          
                          <div className="flex flex-wrap gap-1.5 items-center mt-0.5 -ml-1">
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-arial px-1.5 py-0.5 rounded uppercase font-semibold border border-transparent">
                              {modelInfo.so === 'ANDROID' ? 'android' : modelInfo.so === 'LINUX' ? 'linux' : 'unk'}
                            </span>
                            <span className="text-[10px] text-slate-600 font-medium font-arial">{modelInfo.modelo}</span>
                          </div>

                          {(s.rif || s.razonSocial || s.banco || s.bsf || s.usdt) && (
                            <div className="mt-1.5 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-slate-800">
                              <span className="text-[9px] text-blue-700 block uppercase font-bold tracking-wider">Cliente / Solicitante</span>
                              <div className="text-slate-900 font-bold select-all text-[11px] truncate mt-0.5 font-arial">
                                {s.razonSocial || 'RAZON SOCIAL INC.'}
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-slate-600 font-arial mt-1">
                                <span className="font-bold select-all">{s.rif || 'S/R RIF'}</span>
                                <div className="flex gap-1.5">
                                  {s.bsf && !s.usdt && <span className="bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-extrabold text-[9px]">{s.bsf} BsF</span>}
                                  {!s.bsf && s.usdt && <span className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-extrabold text-[9px]">{s.usdt} USDT</span>}
                                  {s.bsf && s.usdt && (
                                    <>
                                      <span className="bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-extrabold text-[9px]">{s.bsf} BsF</span>
                                      <span className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-extrabold text-[9px]">{s.usdt} USDT</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {s.banco && (
                                <div className="text-[9px] text-slate-500 truncate mt-1.5 border-t border-blue-100/70 pt-1 select-all font-semibold uppercase">
                                  BANCO: {s.banco}
                                </div>
                              )}
                            </div>
                          )}

                          {/* INGRESO MANUAL DEL TICKET Y COSTOS */}
                          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">Ticket</label>
                              <input
                                type="text"
                                value={s.ticket || ''}
                                onChange={e => handleUpdateTextVal(s.id, 'ticket', e.target.value.toUpperCase())}
                                className="w-full text-[11px] font-arial p-1.5 mt-0.5 bg-slate-100 border border-transparent rounded uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 casillero-input"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">Costo BsF</label>
                              <input
                                type="text"
                                value={s.bsf || ''}
                                onChange={e => handleUpdateTextVal(s.id, 'bsf', e.target.value.toUpperCase())}
                                className="w-full text-[11px] font-arial p-1.5 mt-0.5 bg-slate-100 border border-transparent rounded uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 casillero-input"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">Costo USDT</label>
                              <input
                                type="text"
                                value={s.usdt || ''}
                                onChange={e => handleUpdateTextVal(s.id, 'usdt', e.target.value.toUpperCase())}
                                className="w-full text-[11px] font-arial p-1.5 mt-0.5 bg-slate-100 border border-transparent rounded uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 casillero-input"
                              />
                            </div>
                          </div>

                          <div className="mt-1.5">
                            <label className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Banco</label>
                            <input
                              type="text"
                              value={s.banco || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'banco', e.target.value.toUpperCase())}
                              className="w-full text-xs font-arial p-1.5 mt-0.5 bg-slate-100 border border-transparent rounded uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 casillero-input"
                            />
                          </div>
                        </div>
                      </td>

                      {/* LISTADO DE ACCESORIOS */}
                      <td className="py-4 px-3 text-xs w-44">
                        <div className="flex flex-col gap-1.5 pr-2">
                          <button
                            onClick={() => toggleBooleanRef(s.id, 'forro')}
                            className={`flex items-center justify-between text-[11px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer accessory-btn ${
                              s.forro ? 'active' : ''
                            }`}
                          >
                            <span>FORRO</span>
                            {s.forro && <Check size={12} />}
                          </button>
                          
                          <button
                            onClick={() => toggleBooleanRef(s.id, 'bateria')}
                            className={`flex items-center justify-between text-[11px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer accessory-btn ${
                              s.bateria ? 'active' : ''
                            }`}
                          >
                            <span>BATERÍA</span>
                            {s.bateria && <Check size={12} />}
                          </button>

                          <button
                            onClick={() => toggleBooleanRef(s.id, 'cargador')}
                            className={`flex items-center justify-between text-[11px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer accessory-btn ${
                              s.cargador ? 'active' : ''
                            }`}
                          >
                            <span>CARGADOR</span>
                            {s.cargador && <Check size={12} />}
                          </button>

                          <button
                            onClick={() => toggleBooleanRef(s.id, 'caja')}
                            className={`flex items-center justify-between text-[11px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer accessory-btn ${
                              s.caja ? 'active' : ''
                            }`}
                          >
                            <span>CAJA</span>
                            {s.caja && <Check size={12} />}
                          </button>

                          {/* SIM CARD CHIP TOGGLE */}
                          <div className="flex flex-col gap-1 mt-1 border-t border-slate-100 pt-1.5">
                            <label className="flex items-center gap-2 text-[10px] select-none cursor-pointer text-slate-500 font-bold uppercase">
                              <input
                                type="checkbox"
                                checked={!!s.sim}
                                onChange={e => {
                                  setSerials(prev => prev.map(o => {
                                    if (o.id === s.id) {
                                      return { ...o, sim: e.target.checked, simNumber: e.target.checked ? o.simNumber : '' };
                                    }
                                    return o;
                                  }));
                                }}
                                className="rounded text-blue-600 bg-slate-100 border-slate-200 focus:ring-0"
                              />
                              <span>SIM Incorporado</span>
                            </label>
                            {s.sim && (
                              <input
                                type="text"
                                value={s.simNumber || ''}
                                onChange={e => handleUpdateTextVal(s.id, 'simNumber', e.target.value.toUpperCase())}
                                placeholder=""
                                className="w-full text-[10px] font-arial p-1 bg-slate-100 border border-transparent rounded text-amber-600 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-slate-200 casillero-input"
                              />
                            )}
                          </div>

                          {/* OUT TO TECHNICIAN */}
                          <div className="mt-1 border-t border-slate-100 pt-2">
                            <button
                              type="button"
                              onClick={() => toggleBooleanRef(s.id, 'entregadoTecnico')}
                              className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 mt-1 cursor-pointer border ${
                                s.entregadoTecnico 
                                  ? 'bg-slate-400 hover:bg-slate-500 border-slate-400 text-white shadow-sm custom-entregado-btn' 
                                  : 'bg-slate-800 hover:bg-slate-700 border-slate-800 text-white shadow-sm'
                              }`}
                            >
                              {s.entregadoTecnico && <Check size={12} className="text-white" />}
                              <span>{s.entregadoTecnico ? 'ENTREGADO' : 'ENTREGAR'}</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* BITÁCORA / OBSERVACIONES */}
                      <td className="py-4 px-3 text-xs w-72">
                        <div className="flex flex-col gap-1 pr-2">
                          <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Nota de reparación o estado físico</label>
                          <textarea
                            disabled={!!s.entregadoTecnico}
                            value={s.observaciones || ''}
                            onChange={e => handleUpdateTextVal(s.id, 'observaciones', e.target.value)}
                            placeholder=""
                            className={`w-full min-h-[90px] text-xs p-2 bg-slate-100 border border-transparent rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all casillero-input ${
                              s.entregadoTecnico ? 'bg-slate-50 border-transparent text-slate-400 cursor-not-allowed select-none' : ''
                            }`}
                          />
                          {s.entregadoTecnico && (
                            <span className="text-[9px] text-black font-extrabold mt-1">
                              ASIGNACION CONFIRMADA
                            </span>
                          )}
                          <div className="mt-2 flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Responsable</label>
                            <input
                              type="text"
                              disabled={!!s.entregadoTecnico}
                              value={s.responsable || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'responsable', e.target.value.toUpperCase())}
                              placeholder=""
                              className={`w-full text-xs p-2 bg-slate-100 border border-transparent rounded-lg text-slate-900 font-arial uppercase focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all casillero-input ${
                                s.entregadoTecnico ? 'bg-slate-50 border-transparent text-slate-400 cursor-not-allowed select-none' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* ADAPTACIÓN DE SUSTITUCIONES */}
                      <td className="py-4 px-3 text-xs w-52">
                        <div className="flex flex-col gap-1.5 pr-2">
                          <label className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!s.esSustitucion}
                              onChange={e => {
                                setSerials(prev => prev.map(o => {
                                  if (o.id === s.id) {
                                    return { 
                                      ...o, 
                                      esSustitucion: e.target.checked, 
                                      serialSustituto: e.target.checked ? o.serialSustituto : '',
                                      fechaSalida: e.target.checked ? o.fechaSalida : ''
                                    };
                                  }
                                  return o;
                                }));
                              }}
                              className="rounded text-amber-600 bg-slate-100 border-slate-200 focus:ring-0"
                            />
                            <span>Sustitución</span>
                          </label>

                          {s.esSustitucion && (
                            <div className="space-y-1.5 bg-slate-50 p-2 rounded border border-slate-100">
                              <div>
                                <label className="text-[9px] text-slate-500 block uppercase">Serial Sustituto</label>
                                <input
                                  type="text"
                                  value={s.serialSustituto || ''}
                                  onChange={e => handleUpdateTextVal(s.id, 'serialSustituto', e.target.value.toUpperCase())}
                                  placeholder=""
                                  className="w-full text-xs font-arial font-semibold p-1.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 casillero-input"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 block uppercase font-bold text-left">Fecha Salida</label>
                                <input
                                  type="date"
                                  value={s.fechaSalida || ''}
                                  onChange={e => handleUpdateTextVal(s.id, 'fechaSalida', e.target.value)}
                                  className="w-full text-xs font-arial font-semibold p-1.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 casillero-input"
                                />
                              </div>
                            </div>
                          )}

                          {/* SUSTITUCIÓN LOG TAG REVELATION */}
                          {!s.esSustitucion && (
                            <span className="text-[10px] text-slate-500 block">
                              Sin sustitución de equipo asociada.
                            </span>
                          )}
                          {s.esSustitucion && s.serialSustituto && (
                            <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                              <span className="font-bold">SUST: {s.serialSustituto}</span>
                              {s.fechaSalida && (
                                <span className="text-[9px] text-slate-500">Salida: {s.fechaSalida.split('-').reverse().join('/')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* LIBERACIÓN Y DESPACHO DE ENVIOS CLIE */}
                      <td className="py-4 px-3 text-xs w-72">
                        <div className="flex flex-col gap-1.5 pr-1">
                          
                          <div>
                            <label className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider">Fecha Salida Cliente</label>
                            <input
                              type="date"
                              disabled={!!s.fechaConfirmada}
                              value={s.fechaSalidaCliente || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'fechaSalidaCliente', e.target.value)}
                              className={`w-full text-xs font-arial font-semibold p-1.5 mt-0.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all casillero-input ${
                                s.fechaConfirmada ? 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed font-medium' : ''
                              }`}
                            />
                          </div>

                          <div className="mt-1.5">
                            <label className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider">Guía Salida (Cliente)</label>
                            <input
                              type="text"
                              value={s.guiaSalidaCliente || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'guiaSalidaCliente', e.target.value.toUpperCase())}
                              placeholder=""
                              className="w-full text-xs font-arial font-semibold p-1.5 mt-0.5 bg-slate-100 border border-transparent rounded-lg uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all casillero-input"
                            />
                          </div>

                          <div className="mt-1.5">
                            <label className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider">DESTINO</label>
                            <input
                              type="text"
                              value={s.destinoSalida || s.destino || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'destinoSalida', e.target.value.toUpperCase())}
                              placeholder=""
                              className="w-full text-xs font-arial font-semibold p-1.5 mt-0.5 bg-slate-100 border border-transparent rounded-lg uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all casillero-input"
                            />
                          </div>

                          <div className="mt-1 border-t border-slate-100 pt-1.5 flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-[10px] select-none cursor-pointer font-bold text-slate-500">
                              <input
                                type="checkbox"
                                checked={!!s.fechaConfirmada}
                                onChange={e => {
                                  setSerials(prev => prev.map(o => {
                                    if (o.id === s.id) {
                                      const defaultOut = o.fechaSalidaCliente || currentTodayStr();
                                      return { 
                                        ...o, 
                                        fechaConfirmada: e.target.checked, 
                                        fechaSalidaCliente: e.target.checked ? defaultOut : o.fechaSalidaCliente 
                                      };
                                    }
                                    return o;
                                  }));
                                }}
                                className="rounded text-blue-600 bg-slate-100 border-slate-200 focus:ring-0"
                              />
                              <span>CONFIRMAR SALIDA</span>
                            </label>
                            {s.fechaConfirmada && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            )}
                          </div>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-800">
          <span className="text-slate-500">
            Viendo {paginatedSerials.length} equipos de este lote (Total: {sortedSerials.length} filtrados).
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded border border-transparent text-slate-700 cursor-pointer transition-colors shadow-xs pagination-btn"
              >
                Primera
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded border border-transparent text-slate-700 cursor-pointer transition-colors shadow-xs pagination-btn"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-xs bg-slate-100 rounded border border-transparent text-slate-700 shadow-xs">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded border border-transparent text-slate-700 cursor-pointer transition-colors shadow-xs pagination-btn"
              >
                Siguiente
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded border border-transparent text-slate-700 cursor-pointer transition-colors shadow-xs pagination-btn"
              >
                Ultima
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
