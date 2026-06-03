import React, { useState } from 'react';
import { ModelConfig, OperatingSystem } from '../types';
import { Settings, Plus, Edit, Trash, Layers, Search } from 'lucide-react';

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

  const getOSBadge = (so: OperatingSystem) => {
    if (so === 'ANDROID') {
      return (
        <span className="inline-flex items-center gap-1 text-slate-500">
          ANDROID
          <svg className="w-2.5 h-2.5 text-slate-400 fill-current inline-block align-middle" viewBox="0 0 24 24">
            <path d="M17.523 15.3c-.149 0-.272-.122-.272-.27 0-.149.123-.27.272-.27.148 0 .27.121.27.27 0 .148-.122.27-.27.27m-11.046 0c-.149 0-.27-.122-.27-.27 0-.149.121-.27.27-.27.149 0 .272.121.272.27 0 .148-.123.27-.272.27m11.253-3.819l1.833-3.175a.271.271 0 0 0-.099-.371.273.273 0 0 0-.372.099l-1.859 3.22a10.98 10.98 0 0 0-10.468 0L4.966 8.254a.273.273 0 0 0-.372-.099.271.271 0 0 0-.099.371l1.833 3.175A11.026 11.026 0 0 0 1 17.271c0 .149.121.27.271.27h19.458c.15 0 .271-.121.271-.27a11.026 11.026 0 0 0-5.277-5.79"/>
          </svg>
        </span>
      );
    }
    if (so === 'LINUX') {
      return (
        <span className="inline-flex items-center gap-0.5 text-slate-500">
          LINUX
        </span>
      );
    }
    return <span className="text-slate-500">{so}</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-slate-700 pb-16 font-arial modelos-tab-container">
      
      {/* FORMULARIO DE EDICIÓN O AGREGADO */}
      <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings className="text-slate-800 w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider text-slate-800 uppercase">
            {editingKey ? 'EDITAR PREFIJO CORRESPONDIENTE' : 'MODELOS REGISTRADOS'}
          </h3>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Prefijo de Serial (Ej: T650P)</label>
            <input
              type="text"
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-xl text-slate-900 uppercase font-arial font-bold focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nombre Completo del Terminal</label>
            <input
              type="text"
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-xl text-slate-900 uppercase font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sistema Operativo</label>
            <select
              value={os}
              onChange={e => setOs(e.target.value as OperatingSystem)}
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            >
              <option value="ANDROID">ANDROID</option>
              <option value="LINUX">LINUX</option>
              <option value="DESCONOCIDO">DESCONOCIDO</option>
            </select>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus size={12} className="text-slate-500" />
              <span>{editingKey ? 'ACTUALIZAR' : 'AGREGAR PREFIJO'}</span>
            </button>
            {editingKey && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-slate-200"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

      </div>

      {/* DETALLES DE MODELOS CONFIGURADOS */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center text-slate-850">
          <div className="flex items-center gap-2">
            <Layers className="text-slate-600 w-5 h-5" />
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-800">Prefijos Registrados ({filteredKeys.length})</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar prefijo o modelo..."
              className="w-full text-xs p-2 bg-slate-100 border border-transparent rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold pl-8"
            />
            <Search size={14} className="absolute left-2.5 top-3 text-slate-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
          {filteredKeys.length === 0 ? (
            <div className="col-span-2 text-center text-xs text-slate-500 py-10 font-arial">
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
                  className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex justify-between items-center"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800 font-arial uppercase bg-[#f1f5f9] px-2.5 py-1 rounded-xl border border-slate-200/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] w-max">
                      {k}
                    </span>
                    <span className="text-xs text-slate-700 mt-1 font-semibold">{displayInfo}</span>
                    <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5 font-arial">
                      SO: {getOSBadge(displayOS || 'ANDROID')}
                    </span>
                  </div>

                  <div className="flex gap-1.5 align-right">
                    <button
                      onClick={() => handleEdit(k)}
                      className="action-btn-edit p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(k)}
                      className="action-btn-delete p-2 rounded-lg transition-colors cursor-pointer"
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
