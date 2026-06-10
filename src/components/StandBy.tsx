import React, { useState, useMemo } from 'react';
import { StandbyItem } from '../types';
import { Clock, Plus, Trash2, Search, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface StandByProps {
  standbyList: StandbyItem[];
  setStandbyList: React.Dispatch<React.SetStateAction<StandbyItem[]>>;
  serials: import('../types').POSItem[];
}

export const StandBy: React.FC<StandByProps> = ({
  standbyList,
  setStandbyList,
  serials
}) => {
  const [serialsInput, setSerialsInput] = useState('');
  const [guiasInput, setGuiasInput] = useState('');
  const [comentario, setComentario] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDIENTE' | 'PROCESADO'>('TODOS');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    const serials = serialsInput
      .split(/[\r\n,;]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const guias = guiasInput
      .split(/[\r\n,;]+/)
      .map(g => g.trim().toUpperCase())
      .filter(Boolean);

    if (serials.length === 0 && guias.length === 0) {
      alert('POR FAVOR INGRESE AL MENOS UN SERIAL O UNA GUÍA EN CAMINO.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newItems: StandbyItem[] = [];

    // Combinar o registrar de forma individual
    const maxLen = Math.max(serials.length, guias.length);

    for (let i = 0; i < maxLen; i++) {
      newItems.push({
        id: `STBY-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        serial: serials[i] || undefined,
        guia: guias[i] || undefined,
        date: today,
        comentario: comentario.trim().toUpperCase() || undefined,
        status: 'PENDIENTE'
      });
    }

    setStandbyList(prev => [...newItems, ...prev]);

    // Limpiar inputs
    setSerialsInput('');
    setGuiasInput('');
    setComentario('');

    alert(`Se registraron ${newItems.length} registros en STAND-BY correctamente.`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro de Stand-by?')) {
      setStandbyList(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleCleanProcessed = () => {
    const processedCount = standbyList.filter(item => item.status === 'PROCESADO').length;
    if (processedCount === 0) {
      alert('No hay registros procesados para limpiar.');
      return;
    }
    if (window.confirm(`¿Desea eliminar los ${processedCount} registros marcados como PROCESADOS?`)) {
      setStandbyList(prev => prev.filter(item => item.status !== 'PROCESADO'));
    }
  };

  // Derive locker items requiring attention
  const derivedCasilleroItems = useMemo(() => {
    if (!serials) return [];
    return serials
      .filter(s => s.isCasillero && s.status !== 'RECUPERADO' && (!s.fechaConfirmada || (s.esSustitucion && (!s.serialSustituto || !s.fechaSalida))))
      .map(s => {
        let reason = 'PENDIENTE CONFIRMACIÓN SALIDA';
        if (s.esSustitucion && (!s.serialSustituto || !s.fechaSalida)) {
          reason = 'SUSTITUCIÓN INCOMPLETA';
        }
        return {
          id: `CAS-${s.id}`,
          serial: s.serial,
          guia: s.source || undefined,
          date: s.date,
          comentario: `CASILLERO · ${s.razonSocial || 'SIN CLIENTE'} · ${reason}`.toUpperCase(),
          status: 'PENDIENTE' as const,
          isDerived: true
        };
      });
  }, [serials]);

  // Combine stateful and derived items
  const allItems = useMemo(() => {
    return [...standbyList, ...derivedCasilleroItems];
  }, [standbyList, derivedCasilleroItems]);

  // Filtrado
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allItems.filter(item => {
      const matchSearch = !query ||
        (item.serial && item.serial.toLowerCase().includes(query)) ||
        (item.guia && item.guia.toLowerCase().includes(query)) ||
        (item.comentario && item.comentario.toLowerCase().includes(query)) ||
        item.date.includes(query);

      const matchStatus = statusFilter === 'TODOS' || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [allItems, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    let csv = "sep=;\nFECHA_STANDBY;SERIAL;GUIA_CAMINO;COMENTARIO;ESTADO;FECHA_LLEGADA\n";
    filteredItems.forEach(item => {
      csv += [
        item.date,
        item.serial || '',
        item.guia || '',
        item.comentario || '',
        item.status,
        item.processedDate || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `standby_reporte_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 text-slate-800">
      
      {/* PANEL IZQUIERDO: AGREGAR REGISTROS */}
      <div className="xl:col-span-1 dark-panel p-5 flex flex-col gap-4 h-fit">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="text-slate-900 w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider text-slate-900 uppercase">REGISTRAR EN CAMINO</h3>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Seriales del Equipo (POS)
            </label>
            <textarea
              value={serialsInput}
              onChange={e => setSerialsInput(e.target.value)}
              placeholder="Un serial por línea..."
              rows={4}
              className="w-full text-xs font-semibold p-3 bg-slate-100 border border-transparent rounded-lg text-black uppercase focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Guías en camino
            </label>
            <textarea
              value={guiasInput}
              onChange={e => setGuiasInput(e.target.value)}
              placeholder="Una guía por línea..."
              rows={4}
              className="w-full text-xs font-semibold p-3 bg-slate-100 border border-transparent rounded-lg text-black uppercase focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Comentarios / Observaciones
            </label>
            <input
              type="text"
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Ej: Cliente disglobal, zoom, etc."
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white-force rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-sm active:scale-98"
          >
            <Plus size={14} className="text-white-force" />
            <span className="text-white-force">Agregar a Stand-by</span>
          </button>
        </form>
      </div>

      {/* PANEL DERECHO: LISTADO Y FILTROS */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        
        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div className="dark-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-slate-650 w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-sm tracking-wider uppercase">EQUIPOS EN ESPERA (STAND-BY)</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar serial, guía..."
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <Search size={14} className="absolute left-2.5 top-3 text-slate-500" />
            </div>

            {/* Selector de Estado */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs font-bold px-3 py-2 bg-slate-100 border border-transparent rounded-lg text-slate-700 outline-none cursor-pointer"
            >
              <option value="TODOS">TODOS LOS ESTADOS</option>
              <option value="PENDIENTE">PENDIENTE (EN CAMINO)</option>
              <option value="PROCESADO">PROCESADO (RECIBIDO)</option>
            </select>

            {/* Limpiar Procesados */}
            <button
              onClick={handleCleanProcessed}
              className="text-[10px] font-black text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1 bg-white"
              title="Eliminar procesados de la lista"
            >
              <Trash2 size={12} />
              <span>LIMPIAR PROCESADOS</span>
            </button>

            {/* Exportar a Excel */}
            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-slate-200"
              title="Exportar Reporte Excel (CSV)"
            >
              <FileSpreadsheet size={15} />
            </button>
          </div>
        </div>

        {/* TABLA DE ELEMENTOS */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden text-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">N°</th>
                  <th className="py-3.5 px-4">Fecha Registro</th>
                  <th className="py-3.5 px-4">Serial POS</th>
                  <th className="py-3.5 px-4">Guía en Camino</th>
                  <th className="py-3.5 px-4">Observaciones</th>
                  <th className="py-3.5 px-4 text-center">Estatus</th>
                  <th className="py-3.5 px-4">Fecha Llegada</th>
                  <th className="py-3.5 px-4 w-12 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs font-mono uppercase">
                      No hay equipos registrados en stand-by que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isProcessed = item.status === 'PROCESADO';
                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors border-b border-slate-100 text-xs font-mono ${
                          isProcessed 
                            ? 'bg-emerald-50/40 text-slate-700 hover:bg-emerald-50/60' 
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-650">
                          {item.date.split('-').reverse().join('/')}
                        </td>
                        <td className={`py-3.5 px-4 text-sm font-semibold select-all font-sans ${isProcessed ? 'text-emerald-800 font-black' : 'text-slate-850'}`}>
                          {item.serial || <span className="text-slate-350 italic font-normal">S/S</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {item.guia || <span className="text-slate-350 italic font-normal">S/G</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 uppercase font-sans">
                          {item.comentario || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border font-sans inline-flex items-center gap-1 shadow-xs ${
                            isProcessed
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-orange-500 text-white border-orange-400'
                          }`}>
                            {isProcessed ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                            <span>{item.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-800 font-bold">
                          {item.processedDate ? item.processedDate.split('-').reverse().join('/') : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {(item as any).isDerived ? (
                            <span className="bg-slate-900 text-white text-[8px] px-2 py-0.5 font-bold rounded-none uppercase font-mono inline-block">
                              CASILLERO
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-slate-450 hover:text-red-600 transition-colors p-1.5 cursor-pointer rounded hover:bg-slate-100"
                              title="Eliminar de stand-by"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
