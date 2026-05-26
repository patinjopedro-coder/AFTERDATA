import React, { useState } from 'react';
import { ModelConfig, OperatingSystem } from '../types';
import { Settings, Plus, Play, Edit, Trash, HelpCircle, Layers, Search } from 'lucide-react';

interface ModelosProps {
  modelosDB: Record<string, ModelConfig>;
  setModelosDB: React.Dispatch<React.SetStateAction<Record<string, ModelConfig>>>;
}

export const Modelos: React.FC<ModelosProps> = ({
  modelosDB,
  setModelosDB
}) => {
  const [prefix, setPrefix] = useState('');
  const [modelName, setModelName] = useState('');
  const [os, setOs] = useState<OperatingSystem>('ANDROID');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrefix = prefix.trim().toUpperCase();
    const cleanName = modelName.trim();

    if (!cleanPrefix || !cleanName) {
      alert('Se requiere el Prefijo y el Nombre del Modelo.');
      return;
    }

    setModelosDB(prev => {
      const copy = { ...prev };
      
      // If we modified prefix name and originally were editing under different key:
      if (editingKey && editingKey !== cleanPrefix) {
        delete copy[editingKey];
      }
      
      copy[cleanPrefix] = {
        modelo: cleanName,
        so: os
      };

      // save to local storage
      localStorage.setItem('modelosDB', JSON.stringify(copy));
      return copy;
    });

    // Reset Form
    setPrefix('');
    setModelName('');
    setOs('ANDROID');
    setEditingKey(null);

    alert('Prefijo de modelo guardado correctamente.');
  };

  const handleEdit = (key: string) => {
    const config = modelosDB[key];
    setPrefix(key);
    setModelName(config.modelo || (config as any));
    setOs(config.so || 'ANDROID');
    setEditingKey(key);
  };

  const handleDelete = (key: string) => {
    if (confirm(`¿Está seguro de eliminar el prefijo de modelo "${key}"?`)) {
      setModelosDB(prev => {
        const copy = { ...prev };
        delete copy[key];
        localStorage.setItem('modelosDB', JSON.stringify(copy));
        return copy;
      });
      alert('Modelo eliminado.');
    }
  };

  const handleCancelEdit = () => {
    setPrefix('');
    setModelName('');
    setOs('ANDROID');
    setEditingKey(null);
  };

  const filteredKeys = Object.keys(modelosDB).filter(k => {
    const searchLow = search.toLowerCase();
    const model = modelosDB[k];
    const name = (model.modelo || (model as any)).toLowerCase();
    return !search || k.toLowerCase().includes(searchLow) || name.includes(searchLow);
  }).sort();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-slate-100 pb-16">
      
      {/* FORMULARIO DE EDICIÓN O AGREGADO */}
      <div className="lg:col-span-1 bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings className="text-blue-500 w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider text-blue-400">
            {editingKey ? 'EDITAR PREFIJO CORRESPONDIENTE' : 'AGREGAR PREFIJO / MODELO'}
          </h3>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Prefijo de Serial (Ej: T650P)</label>
            <input
              type="text"
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              placeholder="EJ: K300"
              className="w-full text-xs p-2.5 bg-[#151925] border border-[#2a2f42] rounded-lg text-slate-100 uppercase font-mono font-bold"
              required
            />
            <span className="text-[9px] text-slate-500 mt-0.5">La base buscará si el serial inicia o contiene este texto exacto.</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nombre Completo del Terminal</label>
            <input
              type="text"
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              placeholder="EJ: VERIFONE V240M"
              className="w-full text-xs p-2.5 bg-[#151925] border border-[#2a2f42] rounded-lg text-slate-100 uppercase"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sistema Operativo</label>
            <select
              value={os}
              onChange={e => setOs(e.target.value as OperatingSystem)}
              className="w-full text-xs p-2.5 bg-[#151925] border border-[#2a2f42] rounded-lg text-slate-100 focus:outline-none"
            >
              <option value="ANDROID">ANDROID</option>
              <option value="LINUX">LINUX</option>
              <option value="DESCONOCIDO">DESCONOCIDO</option>
            </select>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Plus size={12} />
              <span>{editingKey ? 'Actualizar' : 'Agregar Prefijo'}</span>
            </button>
            {editingKey && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-2.5 bg-[#151925] hover:bg-[#1e2336] border border-[#2a2f42] rounded-lg text-xs font-bold text-slate-400 uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

      </div>

      {/* DETALLES DE MODELOS CONFIGURADOS */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        <div className="bg-[#1e2336] p-4 rounded-xl border border-[#2a2f42] flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="text-slate-400 w-5 h-5" />
            <h3 className="font-bold text-sm tracking-wider uppercase">Prefijos Registrados ({filteredKeys.length})</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar prefijo o modelo..."
              className="w-full text-xs p-2.5 pl-8 bg-[#151925] border border-[#2a2f42] rounded-lg text-slate-300 focus:outline-none"
            />
            <Search size={14} className="absolute left-2.5 top-3 text-slate-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
          {filteredKeys.length === 0 ? (
            <div className="col-span-2 text-center text-xs text-slate-500 py-10 font-mono">
              Ningún prefijo o modelo coincide con tu criterio de búsqueda.
            </div>
          ) : (
            filteredKeys.map(k => {
              const model = modelosDB[k];
              const displayInfo = typeof model === 'string' ? model : model.modelo;
              const displayOS = typeof model === 'string' ? 'ANDROID' : model.so;

              return (
                <div 
                  key={k} 
                  className="bg-[#1e2336] border border-[#2a2f42] p-3.5 rounded-xl hover:border-[#3b82f6]/40 hover:bg-white/5 transition-all flex justify-between items-center"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-black tracking-wider text-slate-100 font-mono uppercase bg-[#151925] px-2 py-0.5 rounded border border-[#2a2f42] w-max">
                      {k}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 font-semibold">{displayInfo}</span>
                    <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-0.5 font-mono">
                      SO: {displayOS || 'ANDROID'}
                    </span>
                  </div>

                  <div className="flex gap-1.5 align-right">
                    <button
                      onClick={() => handleEdit(k)}
                      className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded border border-blue-500/10 transition-colors cursor-pointer"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(k)}
                      className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded border border-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
