import React, { useState, useMemo } from 'react';
import { POSItem, EnvioExterno, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { Truck, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { copyToClipboard, safeSplit } from '../utils';

interface EquiposEnviadosProps {
  serials: POSItem[];
  enviosExternos: EnvioExterno[];
  modelosDB: Record<string, ModelConfig>;
  globalSearch: string;
  dateFrom: string;
  dateTo: string;
  activeCruceBatchId: string;
}

interface UnifiedSentItem {
  tipo: 'casillero' | 'externo';
  fecha: string;
  guia: string;
  serial: string;
  rif: string;
  razonSocial: string;
  destino: string;
  ticket: string;
  sim: string;
  origen: 'CASILLERO' | 'EXTERNO';
  cruceBatchId?: string;
}

export const EquiposEnviados: React.FC<EquiposEnviadosProps> = ({
  serials,
  enviosExternos,
  modelosDB,
  globalSearch,
  dateFrom,
  dateTo,
  activeCruceBatchId
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };
  const [currentPage, setCurrentPage] = useState(1);

  // Extract and compute shipping history in a unified memo block
  const sorted = useMemo(() => {
    // Extract from internal serials that have been released
    const internosEnviados: UnifiedSentItem[] = serials
      .filter(s => {
        const tieneSalidaCliente = !!(s.fechaSalidaCliente && s.fechaSalidaCliente.trim());
        const esSustitucionBaja = !!(s.esSustitucion && s.fechaSalida && s.fechaSalida.trim());
        return tieneSalidaCliente || esSustitucionBaja;
      })
      .map(s => {
        const fecha = s.fechaSalidaCliente || s.fechaSalida || '';
        const guia = s.guiaSalidaCliente || '';
        const serial = s.esSustitucion && s.serialSustituto ? s.serialSustituto : s.serial;
        return {
          tipo: 'casillero',
          fecha,
          guia,
          serial,
          rif: s.rif || '',
          razonSocial: s.razonSocial || '',
          destino: s.destinoSalida || s.destino || '',
          ticket: s.ticket || '',
          sim: s.sim ? `CON SIM (${s.simNumber})` : 'SIN SIM',
          origen: 'CASILLERO',
          cruceBatchId: s.cruceBatchId
        };
      });

    // Extract from external shipments
    const externosEnviados: UnifiedSentItem[] = enviosExternos.map(e => ({
      tipo: 'externo',
      fecha: e.fecha,
      guia: e.guia,
      serial: e.serial,
      rif: e.rif || '',
      razonSocial: e.razonSocial || '',
      destino: e.destino || '',
      ticket: e.ticket || '',
      sim: 'N/A (EXT)',
      origen: 'EXTERNO'
    }));

    const combined = [...internosEnviados, ...externosEnviados];

    // Filtering
    const sLow = globalSearch.toLowerCase();
    const filtered = combined.filter(item => {
      const modelInfo = getTerminalModel(item.serial, modelosDB);

      const matchSearch = !globalSearch ||
        item.serial.toLowerCase().includes(sLow) ||
        item.rif.toLowerCase().includes(sLow) ||
        item.razonSocial.toLowerCase().includes(sLow) ||
        item.guia.toLowerCase().includes(sLow) ||
        item.ticket.toLowerCase().includes(sLow) ||
        item.destino.toLowerCase().includes(sLow) ||
        item.origen.toLowerCase().includes(sLow) ||
        modelInfo.modelo.toLowerCase().includes(sLow);

      const matchDateFrom = !dateFrom || item.fecha >= dateFrom;
      const matchDateTo = !dateTo || item.fecha <= dateTo;

      return matchSearch && matchDateFrom && matchDateTo;
    });

    // Sort by shipping date descending
    return [...filtered].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [serials, enviosExternos, globalSearch, dateFrom, dateTo, modelosDB]);

  // Group and sort batches of sent items
  const finalBatchesList = useMemo(() => {
    const batches = new Set<string>();
    sorted.forEach(item => {
      if (item.cruceBatchId) {
        batches.add(item.cruceBatchId);
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

    const hasHistorial = sorted.some(item => !item.cruceBatchId);
    if (hasHistorial) {
      sortedBatches.push('HISTORIAL');
    }

    if (sortedBatches.length === 0) {
      return ['HISTORIAL'];
    }
    return sortedBatches;
  }, [sorted]);

  const totalPages = finalBatchesList.length;
  const activeBatch = finalBatchesList[currentPage - 1] || 'HISTORIAL';

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginated = useMemo(() => {
    return sorted.filter(item => {
      if (activeBatch === 'HISTORIAL') {
        return !item.cruceBatchId;
      }
      return item.cruceBatchId === activeBatch;
    });
  }, [sorted, activeBatch]);

  return (
    <div className="flex flex-col gap-4 text-slate-700 pb-16 font-arial">
      
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center flex-wrap gap-4 text-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <Truck className="w-5 h-5 text-slate-700" />
            HISTORIAL DE ENVÍOS - {activeBatch === 'HISTORIAL' ? 'HISTORIAL GENERAL' : activeBatch}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-700 font-semibold uppercase font-mono bg-slate-100 px-3 py-1.5 rounded-xl">
            {activeBatch === 'HISTORIAL' ? 'Historial' : 'Este Lote'}: {paginated.length} / Total: {sorted.length}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-white border border-slate-100 hover:bg-slate-50 disabled:opacity-30 rounded-lg cursor-pointer text-slate-700 transition-colors shadow-sm pagination-btn"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-700">
                Pág. {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-white border border-slate-100 hover:bg-slate-50 disabled:opacity-30 rounded-lg cursor-pointer text-slate-700 transition-colors shadow-sm pagination-btn"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/85 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Razón Social / Cliente</th>
                <th className="py-3 px-4">Fecha Salida</th>
                <th className="py-3 px-4">Serial Enviado</th>
                <th className="py-3 px-4">Modelo</th>
                <th className="py-3 px-4">Cédula / RIF</th>
                <th className="py-3 px-4">Guía Salida</th>
                <th className="py-3 px-4">Destino</th>
                <th className="py-3 px-4 text-center">Ticket</th>
                <th className="py-3 px-4">SIM Info</th>
                <th className="py-3 px-4 text-center">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-800 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 text-xs font-mono">
                    No hay registros de salidas o envíos del periodo que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                paginated.map((e, idx) => {
                  const modelInfo = getTerminalModel(e.serial, modelosDB);
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        e.tipo === 'externo' ? 'bg-blue-50/20 hover:bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 uppercase font-arial font-semibold text-slate-900">
                        {e.razonSocial || 'MANUAL / SIN ENTRADA'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-800 font-mono font-semibold text-[11px]">
                        {safeSplit(e.fecha || '', '-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-4 font-arial font-semibold text-[11px] text-slate-900">
                        <span className="inline-flex items-center gap-1">
                          <span 
                            onClick={() => handleCopyText(e.serial, `serial-${idx}`)}
                            className="hover:underline cursor-pointer select-all font-bold"
                          >
                            {e.serial}
                          </span>
                          {copiedKey === `serial-${idx}` && (
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 rounded animate-fade-in">
                              <Check size={10} className="text-white" style={{ color: '#fff' }} />
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase text-slate-800 font-sans">
                        {modelInfo.modelo}
                      </td>
                      <td className="py-3 px-4 text-slate-800 uppercase font-mono font-semibold text-[11px]">{e.rif || '-'}</td>
                      <td className="py-3 px-4 font-arial font-semibold text-[11px]">
                        {e.guia ? (
                          <span className="inline-flex items-center gap-1">
                            <span 
                              onClick={() => handleCopyText(e.guia, `guia-${idx}`)}
                              className="bg-slate-100 px-2 py-0.5 rounded-lg text-sm border border-transparent hover:border-slate-200 hover:underline cursor-pointer font-bold inline-block text-slate-800"
                            >
                              {e.guia}
                            </span>
                            {copiedKey === `guia-${idx}` && (
                              <span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 rounded animate-fade-in">
                                <Check size={10} className="text-white" style={{ color: '#fff' }} />
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans font-semibold">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 uppercase text-slate-800 font-sans">{e.destino || '-'}</td>
                      <td className="py-3 px-4 text-center text-slate-900 font-bold font-sans">{e.ticket || '-'}</td>
                      <td className="py-3 px-4 text-[10px] text-slate-700 tracking-tight font-sans">
                        {e.sim}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider ${
                          e.origen === 'CASILLERO' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}>
                          {e.origen}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 rounded-b-2xl">
        <span>Viendo {paginated.length} envíos de este lote (Total: {sorted.length} despachados).</span>
        {totalPages > 1 && (
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 disabled:opacity-30 rounded-lg text-[9px] uppercase font-bold text-slate-700 transition-colors cursor-pointer shadow-sm pagination-btn">Primera</button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 disabled:opacity-30 rounded-lg text-[9px] uppercase font-bold text-slate-700 transition-colors cursor-pointer shadow-sm pagination-btn">Atrás</button>
            <span className="px-2 font-semibold text-slate-600">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 disabled:opacity-30 rounded-lg text-[9px] uppercase font-bold text-slate-700 transition-colors cursor-pointer shadow-sm pagination-btn">Siguiente</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 disabled:opacity-30 rounded-lg text-[9px] uppercase font-bold text-slate-700 transition-colors cursor-pointer shadow-sm pagination-btn">Fin</button>
          </div>
        )}
      </div>

    </div>
  );
};
