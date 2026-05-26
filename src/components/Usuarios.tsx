import React, { useState } from 'react';
import { POSItem, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { Users, ChevronDown, ChevronUp, Calendar, Copy, Box } from 'lucide-react';

interface UsuariosProps {
  serials: POSItem[];
  modelosDB: Record<string, ModelConfig>;
  globalSearch: string;
  usersProfiles: Record<string, import('../types').UserProfile>;
  setUsersProfiles: React.Dispatch<React.SetStateAction<Record<string, import('../types').UserProfile>>>;
}

export const Usuarios: React.FC<UsuariosProps> = ({
  serials,
  modelosDB,
  globalSearch,
  usersProfiles,
  setUsersProfiles
}) => {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  
  // Profile Editing Modal State
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempArea, setTempArea] = useState('');
  const [tempCargo, setTempCargo] = useState('');

  const openProfileEditor = (remName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProfile(remName);
    const p = usersProfiles[remName];
    setTempName(p?.nombreCompleto || '');
    setTempArea(p?.area || '');
    setTempCargo(p?.cargo || '');
  };

  const saveProfile = () => {
    if (!editingProfile) return;
    setUsersProfiles(prev => ({
      ...prev,
      [editingProfile]: {
        remitenteId: editingProfile,
        nombreCompleto: tempName.toUpperCase(),
        area: tempArea.toUpperCase(),
        cargo: tempCargo.toUpperCase()
      }
    }));
    setEditingProfile(null);
  };

  // Filter serials by global search query
  const filteredSerials = serials.filter(s => {
    if (!globalSearch) return true;
    const searchLow = globalSearch.toLowerCase();
    const modelInfo = getTerminalModel(s.serial, modelosDB);
    return (
      s.serial.toLowerCase().includes(searchLow) ||
      s.remitente.toLowerCase().includes(searchLow) ||
      (s.rif && s.rif.toLowerCase().includes(searchLow)) ||
      (s.razonSocial && s.razonSocial.toLowerCase().includes(searchLow)) ||
      (s.source && s.source.toLowerCase().includes(searchLow)) ||
      (s.destino && s.destino.toLowerCase().includes(searchLow)) ||
      (s.ticket && s.ticket.toLowerCase().includes(searchLow)) ||
      (s.operadora && s.operadora.toLowerCase().includes(searchLow)) ||
      modelInfo.modelo.toLowerCase().includes(searchLow)
    );
  });

  // Grouping by Remitente using filtered serials
  const remitentesMap = new Map<string, Map<string, POSItem[]>>();

  filteredSerials.forEach(s => {
    const rem = s.remitente ? s.remitente.toUpperCase().trim() : 'S/R (SIN REMITENTE)';
    const dateVal = s.date || 'S/F (SIN FECHA)';

    if (!remitentesMap.has(rem)) {
      remitentesMap.set(rem, new Map<string, POSItem[]>());
    }

    const dateMap = remitentesMap.get(rem)!;
    if (!dateMap.has(dateVal)) {
      dateMap.set(dateVal, []);
    }

    dateMap.get(dateVal)!.push(s);
  });

  const sortedRemitentes = Array.from(remitentesMap.keys()).sort();

  const toggleExpandUser = (user: string) => {
    const copy = new Set(expandedUsers);
    if (copy.has(user)) copy.delete(user);
    else copy.add(user);
    setExpandedUsers(copy);
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
      case 'ACTIVO':
      case 'SUSPENDIDO':
        return 'bg-orange-500 text-white font-bold border border-orange-400/30';
      case 'CANCELADO':
      case 'N#A':
        return 'bg-emerald-600 text-white font-bold border border-emerald-500/30';
      default: return 'bg-slate-800 text-slate-400 border border-slate-700/80';
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-slate-100 pb-16">
      
      <div className="bg-[#1e2336] p-4 rounded-xl border border-[#2a2f42] flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            DIRECTORIO DE REMITENTES
          </h2>
        </div>
        <span className="text-xs font-mono font-bold bg-[#151925] px-3 py-1.5 rounded-lg border border-[#2a2f42] text-slate-300">
          Canales de Remitentes: {sortedRemitentes.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 font-sans">
        {sortedRemitentes.length === 0 ? (
          <div className="text-center py-10 bg-[#1e2336]/50 border border-[#2a2f42] rounded-xl text-slate-500 text-xs font-mono">
            No se han registrado remitentes en la base de datos local.
          </div>
        ) : (
          sortedRemitentes.map(remName => {
            const datesMap = remitentesMap.get(remName)!;
            const datesSorted = Array.from(datesMap.keys()).sort().reverse();
            const totalPOSCount = Array.from(datesMap.values()).reduce((sum, list) => sum + list.length, 0);
            const isExpanded = expandedUsers.has(remName) || !!globalSearch;

            return (
              <div 
                key={remName} 
                className="bg-[#1e2336] rounded-xl border border-[#2a2f42] overflow-hidden"
              >
                {/* ACCORDION HEADER */}
                <div 
                  onClick={() => toggleExpandUser(remName)}
                  className="bg-[#1e2336] hover:bg-white/5 p-4 flex justify-between items-center cursor-pointer select-none transition-colors border-b border-transparent hover:border-[#2a2f42]"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={(e) => openProfileEditor(remName, e)}
                      className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/30 hover:scale-105 transition-all"
                      title="Editar Perfil"
                    >
                      <Users size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-wide text-slate-200 uppercase flex items-center gap-2">
                        {remName}
                        {usersProfiles[remName] && (
                          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] px-1.5 py-0.5 rounded uppercase">Perfil Asignado</span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Consolidado del remitente</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-[#151925] px-2.5 py-1 rounded border border-[#2a2f42]">
                      {totalPOSCount} Equipos | {datesSorted.length} Ingresos
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {/* ACCORDION EXPANSION ITEMS */}
                {isExpanded && (
                  <div className="divide-y divide-slate-800/50 bg-slate-950/20 font-mono text-[11px]">
                    {datesSorted.map(dateStr => {
                      const items = datesMap.get(dateStr)!;
                      const displayDate = dateStr.split('-').reverse().join('/');

                      return (
                        <div key={dateStr} className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                          
                          <div className="sm:w-44 flex-shrink-0 flex items-center gap-1.5 text-blue-400 font-bold tracking-wide py-0.5 text-xs">
                            <Calendar size={13} className="text-slate-500" />
                            <span>{displayDate}</span>
                            <span className="text-[10px] font-semibold text-slate-500">({items.length})</span>
                          </div>

                          <div className="flex-1 flex flex-wrap gap-2">
                            {items.map(s => {
                              const m = getTerminalModel(s.serial, modelosDB);
                              return (
                                <div 
                                  key={s.id}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await navigator.clipboard.writeText(s.serial);
                                    alert(`Serial ${s.serial} copiado al portapapeles.`);
                                  }}
                                  title={`${s.serial} - ${m.modelo}`}
                                  className="group bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700/80 px-2.5 py-1.5 rounded-lg flex items-center gap-2 select-all cursor-pointer transition-colors max-w-sm truncate shadow-sm"
                                >
                                  <Box size={10} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                                  <div className="flex flex-col">
                                    <span className="text-blue-300 font-bold tracking-wider">{s.serial}</span>
                                    <span className="text-[9px] text-slate-600 font-sans leading-none">{m.modelo}</span>
                                  </div>
                                  <span className={`px-1 rounded text-[8px] font-black text-center ${getBadgeClass(s.status)}`}>
                                    {s.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* MODAL EDITAR PERFIL */}
      {editingProfile && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEditingProfile(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Editar Perfil</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Remitente: <span className="text-slate-300 font-bold">{editingProfile}</span></p>
            </div>
            
            <div className="flex flex-col gap-3 font-sans text-xs mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={e => setTempName(e.target.value)}
                  placeholder="Ej. Pedro Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Área / Departamento</label>
                <input 
                  type="text" 
                  value={tempArea} 
                  onChange={e => setTempArea(e.target.value)}
                  placeholder="Ej. POSTVENTA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cargo</label>
                <input 
                  type="text" 
                  value={tempCargo} 
                  onChange={e => setTempCargo(e.target.value)}
                  placeholder="Ej. Supervisor Logístico"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={() => setEditingProfile(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveProfile}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-lg transition-colors"
              >
                Guardar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
