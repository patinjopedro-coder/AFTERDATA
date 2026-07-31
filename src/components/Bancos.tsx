import React, { useState, useMemo } from 'react';
import { POSItem, BancoItem } from '../types';
import { Landmark, Plus, Edit2, Trash2, ChevronRight, X, Building2, Layers } from 'lucide-react';

interface BancosProps {
  serials: POSItem[];
  bancosList: BancoItem[];
  setBancosList: React.Dispatch<React.SetStateAction<BancoItem[]>>;
  setSerials: React.Dispatch<React.SetStateAction<POSItem[]>>;
  isReadOnly?: boolean;
}

export const Bancos: React.FC<BancosProps> = ({
  serials,
  bancosList,
  setBancosList,
  setSerials,
  isReadOnly = false
}) => {
  const [selectedBanco, setSelectedBanco] = useState<string | null>(null);
  const [newBancoNombre, setNewBancoNombre] = useState('');
  const [editingBanco, setEditingBanco] = useState<BancoItem | null>(null);
  const [editNombreVal, setEditNombreVal] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Combine default system bancos derived from serials with custom bancosList
  const allBancos = useMemo(() => {
    const set = new Set<string>();
    bancosList.forEach(b => {
      if (b.nombre) set.add(b.nombre.toUpperCase().trim());
    });
    serials.forEach(s => {
      if (s.banco) set.add(s.banco.toUpperCase().trim());
    });
    // Add default common Venezuelan banks if empty
    ['BANESCO', 'MERCANTIL', 'PROVINCIAL', 'VENEZUELA', 'BOD', 'BNC', 'BANCRECER', 'BANCAMIGA'].forEach(b => set.add(b));

    return Array.from(set).sort();
  }, [bancosList, serials]);

  const filteredBancos = useMemo(() => {
    if (!searchFilter.trim()) return allBancos;
    return allBancos.filter(b => b.toLowerCase().includes(searchFilter.toLowerCase()));
  }, [allBancos, searchFilter]);

  const serialsBySelectedBanco = useMemo(() => {
    if (!selectedBanco) return [];
    return serials.filter(s => s.banco && s.banco.toUpperCase().trim() === selectedBanco.toUpperCase().trim());
  }, [serials, selectedBanco]);

  const handleAddBanco = () => {
    if (isReadOnly) return;
    const clean = newBancoNombre.toUpperCase().trim();
    if (!clean) {
      alert('POR FAVOR INGRESE EL NOMBRE DEL BANCO');
      return;
    }
    if (allBancos.includes(clean)) {
      alert('EL BANCO YA SE ENCUENTRA REGISTRADO');
      return;
    }

    const newId = `BANCO-${Date.now()}`;
    setBancosList(prev => [...prev, { id: newId, nombre: clean }]);
    setNewBancoNombre('');
    alert(`Banco ${clean} agregado exitosamente.`);
  };

  const handleSaveEditBanco = () => {
    if (isReadOnly || !editingBanco) return;
    const cleanNew = editNombreVal.toUpperCase().trim();
    if (!cleanNew) {
      alert('POR FAVOR INGRESE UN NOMBRE VÁLIDO');
      return;
    }

    const oldName = editingBanco.nombre.toUpperCase().trim();
    setBancosList(prev => prev.map(b => b.id === editingBanco.id ? { ...b, nombre: cleanNew } : b));

    // Update serials with old bank name to new bank name
    setSerials(prev => prev.map(s => {
      if (s.banco && s.banco.toUpperCase().trim() === oldName) {
        return { ...s, banco: cleanNew };
      }
      return s;
    }));

    if (selectedBanco === oldName) {
      setSelectedBanco(cleanNew);
    }
    setEditingBanco(null);
    setEditNombreVal('');
    alert(`Banco actualizado a ${cleanNew}.`);
  };

  const handleDeleteBanco = (bancoName: string) => {
    if (isReadOnly) return;
    if (!confirm(`¿Está seguro de eliminar el banco "${bancoName}"? Los seriales mantendrán su registro.`)) return;

    setBancosList(prev => prev.filter(b => b.nombre.toUpperCase().trim() !== bancoName.toUpperCase().trim()));
    if (selectedBanco === bancoName) setSelectedBanco(null);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-6xl mx-auto">
      
      {/* ENCABEZADO */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-slate-800" />
            DIRECTORIO Y CONTROL DE BANCOS
          </h2>
          <p className="text-xs font-semibold text-slate-500 uppercase mt-1">
            Gestión de entidades bancarias asociadas a los seriales registrados.
          </p>
        </div>

        {/* AGREGAR BANCO (ADMIN ONLY) */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={newBancoNombre}
              onChange={e => setNewBancoNombre(e.target.value)}
              placeholder="NOMBRE DEL NUEVO BANCO..."
              className="text-xs font-semibold p-2.5 bg-slate-100 border border-slate-300 uppercase rounded-none focus:outline-none focus:bg-white focus:border-slate-800 transition-all font-mono"
            />
            <button
              onClick={handleAddBanco}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shrink-0 transition-all"
            >
              <Plus size={14} />
              <span>AÑADIR</span>
            </button>
          </div>
        )}
      </div>

      {/* BUSCADOR Y LISTA DE BANCOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* LISTA LATERAL DE BANCOS */}
        <div className="bg-white border border-slate-200 shadow-md p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">ENTIDADES BANCARIAS</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 font-mono">{filteredBancos.length}</span>
          </div>

          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="BUSCAR BANCO..."
            className="w-full text-xs p-2 bg-slate-100 border border-slate-200 uppercase font-mono font-semibold"
          />

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
            {filteredBancos.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold p-4 text-center uppercase font-mono">No se encontraron bancos</p>
            ) : (
              filteredBancos.map(bancoName => {
                const count = serials.filter(s => s.banco && s.banco.toUpperCase().trim() === bancoName.toUpperCase().trim()).length;
                const isSelected = selectedBanco === bancoName;

                return (
                  <div
                    key={bancoName}
                    onClick={() => setSelectedBanco(bancoName)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-all ${
                      isSelected ? 'bg-slate-800 text-white font-black' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={14} className={isSelected ? 'text-white' : 'text-slate-500'} />
                      <span className="text-xs font-bold uppercase truncate">{bancoName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 font-mono ${
                        isSelected ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {count}
                      </span>

                      {!isReadOnly && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const item = bancosList.find(b => b.nombre.toUpperCase().trim() === bancoName) || { id: bancoName, nombre: bancoName };
                              setEditingBanco(item);
                              setEditNombreVal(bancoName);
                            }}
                            className={`p-1 hover:bg-slate-200 ${isSelected ? 'text-white' : 'text-slate-600'}`}
                            title="Modificar Banco"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBanco(bancoName);
                            }}
                            className={`p-1 hover:bg-red-100 text-red-600`}
                            title="Quitar Banco"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* DETALLE Y PESTAÑA EMERGENTE AL HACER CLIC EN UN BANCO */}
        <div className="md:col-span-2 bg-white border border-slate-200 shadow-md p-6 flex flex-col justify-between min-h-[400px]">
          {selectedBanco ? (
            <div className="flex flex-col h-full gap-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase font-mono tracking-tight">{selectedBanco}</h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">
                      Seriales pertenecientes a este banco: {serialsBySelectedBanco.length}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBanco(null)}
                  className="p-1 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} className="text-slate-600" />
                </button>
              </div>

              {/* TABLA DE SERIALES DEL BANCO */}
              <div className="flex-1 overflow-y-auto border border-slate-200 max-h-[420px]">
                <table className="w-full text-left border-collapse text-xs font-arial">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-250 text-[10px] text-slate-600 font-black uppercase tracking-wider sticky top-0">
                      <th className="py-2.5 px-3">Serial</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Remitente</th>
                      <th className="py-2.5 px-3">Guía</th>
                      <th className="py-2.5 px-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {serialsBySelectedBanco.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400 font-semibold uppercase font-mono">
                          No hay seriales registrados bajo esta entidad bancaria.
                        </td>
                      </tr>
                    ) : (
                      serialsBySelectedBanco.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 font-mono">
                          <td className="py-2.5 px-3 font-bold text-slate-900 select-all">{s.serial}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-250">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold uppercase text-slate-800">{s.remitente || 'N/A'}</td>
                          <td className="py-2.5 px-3 font-semibold uppercase text-slate-700">{s.source || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{s.displayDate || s.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-10 font-mono text-center">
              <Building2 size={48} className="text-slate-300" />
              <p className="text-xs uppercase font-bold text-slate-500">
                Seleccione un banco del directorio lateral para desplegar sus seriales asociados en una ventana dedicada.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL EDITAR BANCO */}
      {editingBanco && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-900">Modificar Banco</h4>
              <button onClick={() => setEditingBanco(null)} className="p-1 hover:bg-slate-100 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Banco</label>
              <input
                type="text"
                value={editNombreVal}
                onChange={e => setEditNombreVal(e.target.value)}
                className="w-full p-2.5 bg-slate-100 border border-slate-300 font-mono text-xs uppercase font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingBanco(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditBanco}
                className="px-4 py-2 bg-slate-900 text-white font-extrabold text-xs uppercase cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
