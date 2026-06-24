import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Search, Trash2, Download, Plus, Calendar, CardSim, Clipboard } from 'lucide-react';
import { copyToClipboard, downloadBlob } from '../utils';

interface SimBatch {
  id: string;
  date: string;
  title: string;
  serials: string[];
}

interface GestionSimCardsProps {
  simCardBatches: SimBatch[];
  setSimCardBatches: React.Dispatch<React.SetStateAction<SimBatch[]>>;
}

export const GestionSimCards: React.FC<GestionSimCardsProps> = ({
  simCardBatches,
  setSimCardBatches
}) => {
  const [rawSerials, setRawSerials] = useState('');
  const [batchTitle, setBatchTitle] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);

  // Handle Save Lote
  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSerials = rawSerials
      .split(/[\r\n,;]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    if (cleanSerials.length === 0) {
      alert('Por favor ingrese al menos un serial de SIM-Card.');
      return;
    }

    const d = new Date();
    const defaultTitle = `Lote - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const finalTitle = batchTitle.trim() || defaultTitle;
    const finalDate = d.toISOString().split('T')[0];

    const newBatch: SimBatch = {
      id: `batch_${Date.now()}`,
      date: finalDate,
      title: finalTitle,
      serials: cleanSerials
    };

    setSimCardBatches(prev => [newBatch, ...prev]);
    setSelectedBatchId(newBatch.id);
    setRawSerials('');
    setBatchTitle('');
    alert(`✅ Lote "${finalTitle}" guardado con éxito. Contiene ${cleanSerials.length} SIM-Cards.`);
  };

  // Delete Batch
  const handleDeleteBatch = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Está seguro de eliminar el lote "${title}"?`)) {
      setSimCardBatches(prev => prev.filter(b => b.id !== id));
      if (selectedBatchId === id) {
        setSelectedBatchId(null);
      }
    }
  };

  // Export Batch CSV
  const handleExportBatch = (batch: SimBatch, e: React.MouseEvent) => {
    e.stopPropagation();
    let csv = "sep=;\nNro;SERIAL_SIM_CARD\n";
    batch.serials.forEach((serial, idx) => {
      csv += [
        idx + 1,
        serial
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const filename = `anulacion_sims_${batch.title.replace(/[\/:\s]/g, '_')}.csv`;
    downloadBlob(blob, filename);
  };

  // Selected Batch data
  const selectedBatch = simCardBatches.find(b => b.id === selectedBatchId);

  // Search inside selected batch
  const filteredSerials = selectedBatch
    ? selectedBatch.serials.filter(serial =>
        serial.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 text-slate-800 font-arial pb-16">
      
      {/* Columna Izquierda: Cargar Nuevas y Listado de Lotes */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        
        {/* Panel Cargar */}
        <div className="dark-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CardSim className="text-slate-900 w-5 h-5" />
            <h3 className="font-bold text-sm tracking-wider text-slate-900 uppercase">ANULAR SIM-CARDS</h3>
          </div>

          <form onSubmit={handleSaveBatch} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nombre del Lote / Fecha (Opcional)</label>
              <input
                type="text"
                value={batchTitle}
                onChange={e => setBatchTitle(e.target.value)}
                placeholder=""
                className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-xl text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-semibold shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pegar Seriales de SIM-Card (&gt;500)</label>
              <textarea
                value={rawSerials}
                onChange={e => setRawSerials(e.target.value)}
                placeholder=""
                className="w-full min-h-[200px] text-xs p-3.5 bg-slate-100 border border-transparent rounded-xl text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-none shadow-md btn-blue text-white-force"
            >
              <Plus size={14} className="text-white" />
              <span>Guardar Lote</span>
            </button>
          </form>
        </div>

        {/* Panel Listado de Lotes */}
        <div className="dark-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="text-slate-900 w-5 h-5" />
            <h3 className="font-bold text-sm tracking-wider text-slate-900 uppercase">LOTES REGISTRADOS</h3>
          </div>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {simCardBatches.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6 uppercase font-semibold">No hay lotes guardados.</p>
            ) : (
              simCardBatches.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    selectedBatchId === b.id
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                      : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-black text-xs break-words max-w-[70%]">{b.title}</span>
                    <span className="text-[9px] font-bold bg-white/70 border border-slate-200 px-1.5 py-0.5 rounded text-slate-550 shrink-0 uppercase font-mono">
                      Cant: {b.serials.length}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-450 mt-1 border-t border-slate-200/50 pt-1.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {b.date}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleExportBatch(b, e)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-650 cursor-pointer transition-all border-none bg-transparent"
                        title="Exportar CSV"
                      >
                        <Download size={11} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBatch(b.id, b.title, e)}
                        className="p-1 hover:bg-red-100 hover:text-red-600 rounded text-slate-400 cursor-pointer transition-all border-none bg-transparent"
                        title="Eliminar Lote"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Columna Derecha: Detalle de Lote Seleccionado y Buscador */}
      <div className="xl:col-span-3">
        {selectedBatch ? (
          <div className="dark-panel p-6 flex flex-col gap-5 min-h-[500px]">
            
            {/* Header del Detalle */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-3">
              <div>
                <h4 className="font-black text-sm text-slate-800 uppercase tracking-wider">{selectedBatch.title}</h4>
                <p className="text-[10px] text-slate-450 uppercase mt-0.5 font-mono">Detalle del Lote e Historial de Anulaciones</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                  Total Lote: {selectedBatch.serials.length}
                </span>
                <button
                  onClick={() => setIsFlatModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-white-force border-none"
                  style={{ color: '#ffffff' }}
                >
                  <Clipboard size={13} className="text-white" />
                  <span>Vista Plana</span>
                </button>
                <button
                  onClick={(e) => handleExportBatch(selectedBatch, e)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm btn-blue text-white-force border-none"
                >
                  <Download size={13} className="text-white" />
                  <span>Extraer CSV</span>
                </button>
              </div>
            </div>

            {/* Buscador dentro del lote */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder=""
                className="w-full text-xs p-3 pl-9 bg-slate-100 border border-transparent rounded-xl text-slate-900 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
              />
              <Search size={14} className="absolute left-3.5 top-4 text-slate-450" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-[10px] font-bold text-slate-455 hover:text-red-600 cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tabla de Seriales */}
            <div className="flex-1 border border-slate-150 rounded-xl overflow-hidden bg-slate-50 shadow-sm">
              <div className="overflow-y-auto max-h-[380px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-150 text-[10px] text-slate-555 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-20">Nro</th>
                      <th className="py-2.5 px-4">Serial de SIM-Card</th>
                      <th className="py-2.5 px-4 w-40 text-center">Estado Anulación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-155 text-xs font-semibold text-slate-800">
                    {filteredSerials.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-12 text-slate-400 uppercase font-bold text-[10px] font-mono">
                          {searchQuery ? 'No se encontraron seriales que coincidan con la búsqueda.' : 'Lote vacío.'}
                        </td>
                      </tr>
                    ) : (
                      filteredSerials.map((serial, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/50 transition-colors">
                          <td className="py-2 px-4 text-slate-450 font-mono">{(idx + 1).toString().padStart(3, '0')}</td>
                          <td className="py-2 px-4 font-mono text-[13px] tracking-wider select-all">{serial}</td>
                          <td className="py-2 px-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 text-[9px] font-extrabold uppercase tracking-wide">
                              Anulada / Inactiva
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer del detalle */}
            <div className="text-right text-[10px] text-slate-400 font-semibold uppercase font-mono">
              {searchQuery && `Mostrando ${filteredSerials.length} de ${selectedBatch.serials.length} resultados filtrados`}
            </div>

          </div>
        ) : (
          <div className="dark-panel p-6 flex flex-col items-center justify-center min-h-[500px] text-center gap-4">
            <CardSim className="w-16 h-16 text-slate-300 animate-bounce" />
            <div>
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">No se ha seleccionado ningún lote</h4>
            </div>
          </div>
        )}
      {isFlatModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fade-in-overlay select-none font-arial">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg flex flex-col shadow-xl overflow-hidden animate-fade-in text-slate-800">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clipboard className="text-slate-850 w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Lista Plana de SIM-Cards</h3>
                  <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">
                    {filteredSerials.length} seriales {searchQuery ? 'filtrados' : 'totales'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsFlatModalOpen(false)}
                className="p-1 px-2.5 toggle-inactive uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all bg-transparent border-none"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-3.5 select-text">
              <p className="text-xs text-slate-550 font-sans text-left">
                Haga clic dentro del cuadro para seleccionar todos los seriales de SIM-Card y copiarlos juntos:
              </p>
              
              <textarea
                readOnly
                value={filteredSerials.join('\n')}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full h-64 font-mono text-xs p-3.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none select-text cursor-text"
                title="Haga clic para seleccionar todo"
              />

              <div className="flex gap-2 justify-end mt-1">
                <button
                  onClick={() => {
                    copyToClipboard(filteredSerials.join('\n'));
                    alert('⚡ Todos los seriales de SIM-Card han sido copiados al portapapeles.');
                  }}
                  className="btn-green font-arial font-bold uppercase text-[10px] tracking-wider px-4 py-2 cursor-pointer transition-all flex items-center gap-1.5 text-white-force"
                  style={{ color: '#ffffff' }}
                >
                  <Clipboard size={12} className="text-white" />
                  Copiar Todo
                </button>
                <button
                  onClick={() => setIsFlatModalOpen(false)}
                  className="px-4 py-2 toggle-inactive text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      </div>

    </div>
  );
};
