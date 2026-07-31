import React, { useMemo } from 'react';
import { POSItem } from '../types';
import { PackageCheck, FileText, Layers, Calendar, Clock, ArrowUpRight } from 'lucide-react';

interface InicioProps {
  serials: POSItem[];
  activeCruceBatchId: string;
  setCurrentTab: (tab: string) => void;
}

export const Inicio: React.FC<InicioProps> = ({ serials, activeCruceBatchId, setCurrentTab }) => {
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

      {/* SECCIÓN PRINCIPAL: 2 CAMPOS GRANDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CAMPO 1: ÚLTIMO LOTE AÑADIDO */}
        <div className="bg-white border border-slate-200 shadow-md p-6 flex flex-col justify-between min-h-[280px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-800 text-white rounded-none">
                  <PackageCheck size={20} />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  ÚLTIMO LOTE AÑADIDO
                </h3>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 uppercase tracking-wider">
                ACTIVO
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-black text-slate-800 font-mono uppercase tracking-tight">
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

        {/* CAMPO 2: GUIAS AÑADIDAS EN EL DIA */}
        <div className="bg-white border border-slate-200 shadow-md p-6 flex flex-col justify-between min-h-[280px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-700 text-white rounded-none">
                  <FileText size={20} />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  GUÍAS AÑADIDAS EN EL DÍA
                </h3>
              </div>
              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-1 uppercase tracking-wider">
                HOY ({currentDisplayDate})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Guías Recibidas</span>
                <span className="text-2xl font-black text-blue-700 font-mono">{guiasDelDiaData.totalGuias}</span>
              </div>

              <div className="bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Seriales Ingresados Hoy</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{guiasDelDiaData.totalHoy}</span>
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-3 max-h-36 overflow-y-auto space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Desglose de Guías de Hoy:</span>
              {guiasDelDiaData.list.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 uppercase font-mono">No se han registrado guías el día de hoy.</p>
              ) : (
                guiasDelDiaData.list.map((g, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 border border-slate-150 text-xs font-bold font-mono">
                    <span className="text-slate-800">{g.guia}</span>
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200">{g.count} seriales</span>
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

      </div>

    </div>
  );
};
