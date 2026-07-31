import React, { useState, useMemo } from 'react';
import { POSItem } from '../types';
import { PackageCheck, FileText, Layers, Calendar, ArrowUpRight, X } from 'lucide-react';

interface InicioProps {
  serials: POSItem[];
  activeCruceBatchId: string;
  setCurrentTab: (tab: string) => void;
}

export const Inicio: React.FC<InicioProps> = ({ serials, activeCruceBatchId, setCurrentTab }) => {
  const [selectedGuiaModal, setSelectedGuiaModal] = useState<string | null>(null);

  const currentDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const currentDisplayDate = useMemo(() => {
    return currentDateStr.split('-').reverse().join('/');
  }, [currentDateStr]);

  // 1. Ultimo lote añadido
  const ultimoLoteData = useMemo(() => {
    const batches = new Set<string>();
    serials.forEach(s => {
      if (s.cruceBatchId) batches.add(s.cruceBatchId);
    });
    const batchList = Array.from(batches);
    const targetBatch = activeCruceBatchId || (batchList.length > 0 ? batchList[batchList.length - 1] : 'SIN LOTE REGISTRADO');

    const items = serials.filter(s => s.cruceBatchId === targetBatch);
    const count = items.length;
    const remitentes = Array.from(new Set(items.map(s => s.remitente).filter(Boolean))).join(', ');

    return {
      nombreLote: targetBatch,
      count,
      remitentes: remitentes || 'N/A'
    };
  }, [serials, activeCruceBatchId]);

  // 2. Guías añadidas en el día
  const guiasDelDiaData = useMemo(() => {
    const todayItems = serials.filter(s => s.date === currentDateStr);
    const guiasMap = new Map<string, number>();

    todayItems.forEach(s => {
      const g = s.source ? s.source.trim().toUpperCase() : 'SIN GUÍA';
      guiasMap.set(g, (guiasMap.get(g) || 0) + 1);
    });

    const list: { guia: string; count: number }[] = [];
    guiasMap.forEach((count, guia) => {
      list.push({ guia, count });
    });

    return {
      totalHoy: todayItems.length,
      totalGuias: guiasMap.size,
      list
    };
  }, [serials, currentDateStr]);

  // Seriales pertenecientes a la guía seleccionada en modal
  const serialesDeGuia = useMemo(() => {
    if (!selectedGuiaModal) return [];
    const searchG = selectedGuiaModal.trim().toUpperCase();
    return serials.filter(s => {
      const src = s.source ? s.source.trim().toUpperCase() : 'SIN GUÍA';
      return src === searchG && s.date === currentDateStr;
    });
  }, [serials, selectedGuiaModal, currentDateStr]);

  return (
    <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-6xl mx-auto">
      
      {/* TARJETA BIENVENIDA / ENCABEZADO */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-slate-800" />
            PANEL DE INICIO Y MONITOR EN TIEMPO REAL
          </h2>
          <p className="text-xs font-semibold text-slate-500 uppercase mt-1">
            Resumen diario de lotes ingresados, guías recibidas y métricas del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 border border-slate-250 font-mono text-xs font-bold text-slate-700">
          <Calendar size={14} className="text-slate-500" />
          <span>FECHA ACTUAL: {currentDisplayDate}</span>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: POSICIONES E INTERCAMBIO DE COLORES REQUERIDO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* COLUMNA IZQUIERDA: GUÍAS AÑADIDAS EN EL DÍA (AHORA IZQUIERDA CON ESTILO/APARIENCIA DE ÚLTIMO LOTE) */}
        <div className="bg-white border border-slate-200 shadow-md p-6 flex flex-col justify-between min-h-[280px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-800 text-white rounded-none">
                  <FileText size={20} />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  GUÍAS AÑADIDAS EN EL DÍA
                </h3>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 uppercase tracking-wider">
                HOY ({currentDisplayDate})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Guías Recibidas</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{guiasDelDiaData.totalGuias}</span>
              </div>

              <div className="bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Seriales Ingresados Hoy</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{guiasDelDiaData.totalHoy}</span>
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-3 max-h-40 overflow-y-auto space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Desglose de Guías de Hoy (Clic para detalle):</span>
              {guiasDelDiaData.list.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 uppercase font-mono">No se han registrado guías el día de hoy.</p>
              ) : (
                guiasDelDiaData.list.map((g, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedGuiaModal(g.guia)}
                    className="flex justify-between items-center bg-white p-2 border border-slate-150 text-xs font-bold font-mono cursor-pointer hover:border-slate-800 transition-all shadow-2xs"
                  >
                    <span className="text-slate-800 hover:underline">{g.guia}</span>
                    <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">{g.count} seriales</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('general')}
            className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <span>Ir a Gestión General</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* COLUMNA DERECHA: ÚLTIMO LOTE AÑADIDO (AHORA DERECHA CON ESTILO/AZUL DE GUÍAS DEL DÍA) */}
        <div className="bg-white border border-slate-200 shadow-md p-6 flex flex-col justify-between min-h-[280px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-700 text-white rounded-none">
                  <PackageCheck size={20} />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  ÚLTIMO LOTE AÑADIDO
                </h3>
              </div>
              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-1 uppercase tracking-wider">
                ACTIVO
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-black text-blue-700 font-mono uppercase tracking-tight">
                {ultimoLoteData.nombreLote}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Equipos en Lote</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{ultimoLoteData.count}</span>
                </div>

                <div className="bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Remitente(s)</span>
                  <span className="text-xs font-bold text-slate-800 uppercase truncate block mt-1" title={ultimoLoteData.remitentes}>
                    {ultimoLoteData.remitentes}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('cruce')}
            className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <span>Ver Cruce de Seriales</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

      </div>

      {/* VENTANA EMERGENTE (MODAL DETALLE DE GUÍA / CASILLERO) */}
      {selectedGuiaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col font-arial">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase font-mono tracking-tight">DETALLE DE GUÍA: {selectedGuiaModal}</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">
                    Registros en Casillero para esta guía ({serialesDeGuia.length} seriales)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedGuiaModal(null)}
                className="p-1 hover:bg-slate-200 cursor-pointer"
              >
                <X size={18} className="text-slate-700" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {serialesDeGuia.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-mono text-xs font-bold uppercase">
                  No se encontraron seriales de casillero para la guía {selectedGuiaModal} en el día de hoy.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600">
                        <th className="py-2.5 px-3">Serial</th>
                        <th className="py-2.5 px-3">Estatus</th>
                        <th className="py-2.5 px-3">Remitente</th>
                        <th className="py-2.5 px-3">Razón Social</th>
                        <th className="py-2.5 px-3">RIF</th>
                        <th className="py-2.5 px-3">Destino</th>
                        <th className="py-2.5 px-3">Responsable</th>
                        <th className="py-2.5 px-3">Fecha Ingreso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {serialesDeGuia.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900 select-all">{s.serial}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-250">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 uppercase text-slate-800">{s.remitente || 'N/A'}</td>
                          <td className="py-2.5 px-3 uppercase text-slate-800">{s.razonSocial || '-'}</td>
                          <td className="py-2.5 px-3 uppercase text-slate-700">{s.rif || '-'}</td>
                          <td className="py-2.5 px-3 uppercase text-slate-700">{s.destino || '-'}</td>
                          <td className="py-2.5 px-3 uppercase text-slate-700">{s.responsable || 'PEDRO PATIÑO'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{s.displayDate || s.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedGuiaModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-black text-xs uppercase cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
