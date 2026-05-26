import React, { useState } from 'react';
import { POSItem, EnvioExterno, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { Truck, Search, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface EquiposEnviadosProps {
  serials: POSItem[];
  enviosExternos: EnvioExterno[];
  modelosDB: Record<string, ModelConfig>;
  globalSearch: string;
  dateFrom: string;
  dateTo: string;
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
}

export const EquiposEnviados: React.FC<EquiposEnviadosProps> = ({
  serials,
  enviosExternos,
  modelosDB,
  globalSearch,
  dateFrom,
  dateTo
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

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
        origen: 'CASILLERO'
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
  const filtered = combined.filter(item => {
    const sLow = globalSearch.toLowerCase();
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
  const sorted = [...filtered].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-slate-100 pb-16">
      
      <div className="bg-[#1e2336] p-4 rounded-xl border border-[#2a2f42] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-500" />
            HISTORIAL DE ENVIO DE EQUIPOS
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-semibold uppercase font-mono bg-[#151925] px-3 py-1.5 rounded-lg border border-[#2a2f42]">
            Total Despachados: {sorted.length}
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#151925]/50 border-b border-[#2a2f42] text-[10px] text-white font-bold uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#2a2f42]/60 font-mono text-[11px] text-white">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500 text-xs font-mono">
                    No hay registros de salidas o envíos del periodo que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                paginated.map((e, idx) => {
                  const modelInfo = getTerminalModel(e.serial, modelosDB);
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-white/5 transition-colors ${
                        e.tipo === 'externo' ? 'bg-[#151925]/40 hover:bg-white/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 uppercase font-sans font-semibold text-white">
                        {e.razonSocial || 'MANUAL / SIN ENTRADA'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-white">
                        {e.fecha.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-4 font-bold text-white tracking-wider">
                        <span 
                          onClick={() => {
                            navigator.clipboard.writeText(e.serial);
                            alert(`Serial ${e.serial} copiado.`);
                          }}
                          className="hover:underline cursor-pointer select-all"
                        >
                          {e.serial}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase text-white font-sans">
                        {modelInfo.modelo}
                      </td>
                      <td className="py-3 px-4 text-white uppercase">{e.rif || '-'}</td>
                      <td className="py-3 px-4">
                        {e.guia ? (
                          <span 
                            onClick={() => {
                              navigator.clipboard.writeText(e.guia);
                              alert(`Guia ${e.guia} copiada.`);
                            }}
                            className="bg-[#151925] px-2 py-0.5 rounded text-xs tracking-wider border border-[#2a2f42] hover:text-blue-400 cursor-pointer font-bold inline-block"
                          >
                            {e.guia}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 uppercase text-white font-sans">{e.destino || '-'}</td>
                      <td className="py-3 px-4 text-center text-white font-bold font-sans">{e.ticket || '-'}</td>
                      <td className="py-3 px-4 text-[10px] text-white tracking-tight font-sans">
                        {e.sim}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                          e.origen === 'CASILLERO' ? 'bg-blue-600 text-white shadow-sm border border-blue-500/20' : 'bg-emerald-500/20 text-emerald-300'
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

        <div className="p-4 border-t border-[#2a2f42] bg-[#151925]/40 flex justify-between items-center text-xs text-slate-500">
          <span>Viendo {paginated.length} registros despachados en página actual.</span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-1.5 py-0.5 bg-[#151925] border border-[#2a2f42] disabled:opacity-30 rounded text-[9px] uppercase font-bold text-slate-400">Primera</button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-1.5 py-0.5 bg-[#151925] border border-[#2a2f42] disabled:opacity-30 rounded text-[9px] uppercase font-bold text-slate-400">Atrás</button>
              <span className="px-2">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-1.5 py-0.5 bg-[#151925] border border-[#2a2f42] disabled:opacity-30 rounded text-[9px] uppercase font-bold text-slate-400">Siguiente</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-1.5 py-0.5 bg-[#151925] border border-[#2a2f42] disabled:opacity-30 rounded text-[9px] uppercase font-bold text-slate-400">Fin</button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
