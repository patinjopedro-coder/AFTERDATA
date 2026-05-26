import React, { useState } from 'react';
import { POSItem, POSStatus, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { 
  FolderLock, Check, HelpCircle, 
  RefreshCcw, ChevronLeft, ChevronRight, Save, Clipboard, Sparkles
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
  usersProfiles: Record<string, import('../types').UserProfile>;
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
  usersProfiles
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter computations
  const casilleroSerials = serials.filter(s => {
    // Casillero criteria: only items registered with isCasillero === true
    if (!s.isCasillero) return false;

    const searchLow = globalSearch.toLowerCase();
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

  // Sort newest first
  const sortedSerials = [...casilleroSerials].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination
  const totalPages = Math.ceil(sortedSerials.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSerials = sortedSerials.slice(startIndex, startIndex + itemsPerPage);

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
    <div className="flex flex-col gap-4 animate-fade-in text-slate-100 pb-10">
      
      <div className="flex justify-between items-center bg-[#1e2336] p-4 rounded-xl border border-[#2a2f42] flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-blue-400 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-orange-500" />
            CONTROLES DE CASILLEROS / DEPÓSITOS
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-semibold uppercase font-mono bg-[#151925] px-3 py-1.5 rounded-lg border border-[#2a2f42]">
            Total en Casillero: {sortedSerials.length}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-[#151925] p-1 rounded-lg border border-[#2a2f42]">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-[#1e2336] border border-[#2a2f42] hover:border-[#3b82f6]/50 disabled:opacity-30 rounded cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold px-2">
                Pág. {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-[#1e2336] border border-[#2a2f42] hover:border-[#3b82f6]/50 disabled:opacity-30 rounded cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1e2336] rounded-xl border border-[#2a2f42] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1240px]">
            <thead>
              <tr className="bg-[#151925]/50 border-b border-[#2a2f42] text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedSerials.length > 0 && paginatedSerials.every(s => s.selected)}
                    onChange={e => handleToggleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 bg-slate-900 border-slate-800"
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
            <tbody className="divide-y divide-[#2a2f42]/60">
              {paginatedSerials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs font-mono">
                    No hay terminales en casillero que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedSerials.map(s => {
                  const modelInfo = getTerminalModel(s.serial, modelosDB);
                  const isNew = s.date && (Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000) <= 7);
                  const isRepetido = serials.filter(o => o.serial === s.serial).length > 1;

                  const serialColorClass = isRepetido
                    ? 'text-red-400 font-bold decoration-dotted underline'
                    : isNew
                      ? 'text-emerald-400 font-semibold'
                      : 'text-white';

                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-white/5 transition-colors align-top ${s.selected ? 'bg-blue-600/5' : ''} ${s.addedFromCruce ? 'border-l-2 border-l-blue-500' : ''}`}
                    >
                      {/* SELECTOR */}
                      <td className="py-4 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!s.selected}
                          onChange={() => toggleBooleanRef(s.id, 'selected')}
                          className="rounded text-blue-600 bg-slate-900 border-slate-800 mt-1"
                        />
                      </td>

                      {/* ENTRADA (FECHA O GUÍA) */}
                      <td className="py-4 px-3 text-center whitespace-nowrap text-xs font-mono text-white">
                        <div>{s.displayDate}</div>
                        {s.source ? (
                          <div className="mt-1 text-[10px] text-white font-semibold">
                            GUÍA: <span className="text-white hover:text-blue-400 cursor-pointer" onClick={() => navigator.clipboard.writeText(s.source)}>{s.source}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-1">MANUAL</div>
                        )}
                        {s.addedFromCruce && (
                          <div className="mt-1.5">
                            <span className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full select-none cursor-pointer">
                              CRUCE
                            </span>
                          </div>
                        )}
                      </td>

                      {/* CLASIFICACIÓN Y DATOS COMERCIALES */}
                      <td className="py-4 px-4 text-xs">
                        <div className="flex flex-col gap-1 pr-2">
                          <span 
                            className={`text-base tracking-wider cursor-help hover:text-white select-all font-mono transition-colors font-bold ${serialColorClass}`}
                            onClick={async () => {
                              await navigator.clipboard.writeText(s.serial);
                              alert(`Serial ${s.serial} copiado.`);
                            }}
                          >
                            {s.serial}
                          </span>
                          
                          <div className="flex flex-wrap gap-1.5 items-center mt-0.5">
                            <span className="text-[9px] bg-slate-800 text-white font-mono px-1.5 py-0.5 rounded uppercase font-semibold">
                              {modelInfo.so === 'ANDROID' ? 'android' : modelInfo.so === 'LINUX' ? 'linux' : 'unk'}
                            </span>
                            <span className="text-[10px] text-white font-medium font-mono">{modelInfo.modelo}</span>
                          </div>

                          {/* DATOS DEL CLIENTE / REGISTRO FISCAL */}
                          {(s.rif || s.razonSocial) && (
                            <div className="mt-1 bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                              <span className="text-[9px] text-white block uppercase font-bold tracking-wider">Cliente / Solicitante</span>
                              <div className="text-white font-semibold select-all text-[11px] truncate">
                                {s.razonSocial || 'RAZON SOCIAL INC.'}
                              </div>
                              <span className="text-[10px] text-blue-400 font-mono select-all font-bold">
                                {s.rif || 'S/R RIF'}
                              </span>
                            </div>
                          )}

                          {/* INGRESO MANUAL DEL TICKET */}
                          <div className="mt-1.5">
                            <label className="text-[9px] text-white block uppercase font-bold tracking-wider">Ticket / N° Orden</label>
                            <input
                              type="text"
                              value={s.ticket || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'ticket', e.target.value.toUpperCase())}
                              placeholder="Falta ticket..."
                              className="w-full text-xs font-mono p-1.5 mt-0.5 bg-slate-950 border border-slate-800 rounded uppercase text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </td>

                      {/* LISTADO DE ACCESORIOS */}
                      <td className="py-4 px-3 text-xs w-44">
                        <div className="flex flex-col gap-1.5 pr-2">
                          <button
                            onClick={() => toggleBooleanRef(s.id, 'forro')}
                            className={`flex items-center justify-between text-[11px] font-bold px-3 py-1 rounded-md transition-colors ${
                              s.forro ? 'bg-blue-600/30 text-white border border-blue-500/50' : 'bg-slate-950 border border-slate-850 hover:bg-slate-900'
                            }`}
                          >
                            <span>FORRO</span>
                            {s.forro && <Check size={12} />}
                          </button>
                          
                          <button
                            onClick={() => toggleBooleanRef(s.id, 'bateria')}
                            className={`flex items-center justify-between text-[11px] font-bold px-3 py-1 rounded-md transition-colors ${
                              s.bateria ? 'bg-blue-600/30 text-white border border-blue-500/50' : 'bg-slate-950 border border-slate-850 hover:bg-slate-900'
                            }`}
                          >
                            <span>BATERÍA</span>
                            {s.bateria && <Check size={12} />}
                          </button>

                          <button
                            onClick={() => toggleBooleanRef(s.id, 'cargador')}
                            className={`flex items-center justify-between text-[11px] font-bold px-3 py-1 rounded-md transition-colors ${
                              s.cargador ? 'bg-blue-600/30 text-white border border-blue-500/50' : 'bg-slate-950 border border-slate-850 hover:bg-slate-900'
                            }`}
                          >
                            <span>CARGADOR</span>
                            {s.cargador && <Check size={12} />}
                          </button>

                          <button
                            onClick={() => toggleBooleanRef(s.id, 'caja')}
                            className={`flex items-center justify-between text-[11px] font-bold px-3 py-1 rounded-md transition-colors ${
                              s.caja ? 'bg-blue-600/30 text-white border border-blue-500/50' : 'bg-slate-950 border border-slate-850 hover:bg-slate-900'
                            }`}
                          >
                            <span>CAJA</span>
                            {s.caja && <Check size={12} />}
                          </button>

                          {/* SIM CARD CHIP TOGGLE */}
                          <div className="flex flex-col gap-1 mt-1 border-t border-slate-800 pt-1.5">
                            <label className="flex items-center gap-2 text-[10px] select-none cursor-pointer">
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
                                className="rounded text-blue-500"
                              />
                              <span className="font-bold uppercase">SIM Incorporado</span>
                            </label>
                            {s.sim && (
                              <input
                                type="text"
                                value={s.simNumber || ''}
                                onChange={e => handleUpdateTextVal(s.id, 'simNumber', e.target.value.toUpperCase())}
                                placeholder="Serial SIM..."
                                className="w-full text-[10px] font-mono p-1 bg-slate-950 border border-slate-800 rounded text-orange-400 uppercase font-semibold"
                              />
                            )}
                          </div>

                          {/* OUT TO TECHNICIAN */}
                          <div className="mt-1 border-t border-slate-800 pt-2">
                            <label className="flex items-center gap-2 text-[10px] select-none cursor-pointer text-orange-400 font-bold tracking-wide">
                              <input
                                type="checkbox"
                                checked={!!s.entregadoTecnico}
                                onChange={e => toggleBooleanRef(s.id, 'entregadoTecnico')}
                                className="rounded text-orange-500 bg-slate-950"
                              />
                              <span>ENTREG. TEC</span>
                            </label>
                          </div>
                        </div>
                      </td>

                      {/* BITÁCORA / OBSERVACIONES */}
                      <td className="py-4 px-3 text-xs w-72">
                        <div className="flex flex-col gap-1 pr-2">
                          <label className="text-[9px] text-white uppercase font-bold tracking-wider mb-0.5">Nota de reparación o estado físico</label>
                          <textarea
                            disabled={!!s.entregadoTecnico}
                            value={s.observaciones || ''}
                            onChange={e => handleUpdateTextVal(s.id, 'observaciones', e.target.value)}
                            placeholder={s.entregadoTecnico ? "Bloqueado por Técnico" : "Escribe observaciones..."}
                            className={`w-full min-h-[90px] text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all ${
                              s.entregadoTecnico ? 'bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed select-none' : ''
                            }`}
                          />
                          {s.entregadoTecnico && (
                            <span className="text-[9px] text-orange-500 font-semibold mt-1">
                              ✓ En las manos del especialista certificado. No modificable.
                            </span>
                          )}
                          <div className="mt-2 flex flex-col gap-1">
                            <label className="text-[9px] text-blue-300 uppercase font-bold tracking-wider mb-0.5">Responsable</label>
                            <input
                              type="text"
                              disabled={!!s.entregadoTecnico}
                              value={s.responsable || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'responsable', e.target.value.toUpperCase())}
                              placeholder="Ej: PEDRO PEREZ"
                              className={`w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-sans uppercase focus:outline-none focus:border-blue-500 transition-all ${
                                s.entregadoTecnico ? 'bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed select-none' : ''
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
                              className="rounded text-orange-400"
                            />
                            <span>Sustitución</span>
                          </label>

                          {s.esSustitucion && (
                            <div className="space-y-1.5 bg-slate-950 p-2 rounded border border-slate-850">
                              <div>
                                <label className="text-[9px] text-white block uppercase">Serial Sustituto</label>
                                <input
                                  type="text"
                                  value={s.serialSustituto || ''}
                                  onChange={e => handleUpdateTextVal(s.id, 'serialSustituto', e.target.value.toUpperCase())}
                                  placeholder="N° SERIAL NUEVO"
                                  className="w-full text-xs font-sans font-semibold p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-white block uppercase font-bold text-left">Fecha Salida</label>
                                <input
                                  type="date"
                                  value={s.fechaSalida || ''}
                                  onChange={e => handleUpdateTextVal(s.id, 'fechaSalida', e.target.value)}
                                  className="w-full text-xs font-sans font-semibold p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                                />
                              </div>
                            </div>
                          )}

                          {/* SUSTITUCIÓN LOG TAG REVELATION */}
                          {!s.esSustitucion && (
                            <span className="text-[10px] text-slate-400 block">
                              Sin sustitución de equipo asociada.
                            </span>
                          )}
                          {s.esSustitucion && s.serialSustituto && (
                            <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-orange-400 bg-orange-950/20 p-1.5 rounded border border-orange-500/20">
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
                            <label className="text-[9px] text-white block uppercase font-extrabold tracking-wider">Fecha Salida Cliente</label>
                            <input
                              type="date"
                              disabled={!!s.fechaConfirmada}
                              value={s.fechaSalidaCliente || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'fechaSalidaCliente', e.target.value)}
                              className={`w-full text-xs font-sans font-semibold p-1.5 mt-0.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${
                                s.fechaConfirmada ? 'bg-slate-900 text-slate-400 border-slate-850 cursor-not-allowed font-medium' : ''
                              }`}
                            />
                          </div>

                          <div className="mt-1.5">
                            <label className="text-[9px] text-white block uppercase font-extrabold tracking-wider">Guía Salida (Cliente)</label>
                            <input
                              type="text"
                              value={s.guiaSalidaCliente || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'guiaSalidaCliente', e.target.value.toUpperCase())}
                              placeholder="Guía despacho..."
                              className="w-full text-xs font-sans font-semibold p-1.5 mt-0.5 bg-slate-950 border border-slate-800 rounded-lg uppercase text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          </div>

                          <div className="mt-1.5">
                            <label className="text-[9px] text-white block uppercase font-extrabold tracking-wider">Destino Despacho</label>
                            <input
                              type="text"
                              value={s.destinoSalida || s.destino || ''}
                              onChange={e => handleUpdateTextVal(s.id, 'destinoSalida', e.target.value.toUpperCase())}
                              placeholder="Ciudad o Agencia de salida..."
                              className="w-full text-xs font-sans font-semibold p-1.5 mt-0.5 bg-slate-950 border border-slate-800 rounded-lg uppercase text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          </div>

                          <div className="mt-1 border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-[10px] select-none cursor-pointer font-bold text-blue-400">
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
                                className="rounded text-blue-600 bg-slate-950 border-slate-800"
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

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Viendo {paginatedSerials.length} de {sortedSerials.length} casilleros filtrados.
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-900 disabled:opacity-30 rounded border border-slate-800 cursor-pointer"
              >
                Primera
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-900 disabled:opacity-30 rounded border border-slate-800 cursor-pointer"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-xs bg-slate-900 rounded border border-slate-800 text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-900 disabled:opacity-30 rounded border border-slate-800 cursor-pointer"
              >
                Siguiente
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-900 disabled:opacity-30 rounded border border-slate-800 cursor-pointer"
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
