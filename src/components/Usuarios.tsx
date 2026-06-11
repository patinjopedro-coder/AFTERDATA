import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { POSItem, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { formatRif } from '../utils';
import { Users, ChevronDown, ChevronUp, Calendar, Copy, Box, Check, Briefcase, Building } from 'lucide-react';

const MaleAvatar: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="male-purple-grad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#8c6f9f" />
        <stop offset="100%" stopColor="#654a7c" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#male-purple-grad)" />
    <mask id="male-avatar-mask-v3">
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
    </mask>
    <g mask="url(#male-avatar-mask-v3)">
      {/* Neck base with shadow on the left */}
      <path d="M 40 48 C 40 48, 39 53, 39 58 L 50 58 L 50 48 Z" fill="#e8a38c" />
      {/* Neck highlight on the right */}
      <path d="M 50 48 L 50 58 L 61 58 C 61 53, 60 48, 60 48 Z" fill="#fcd5c0" />
      
      {/* Left Ear */}
      <circle cx="34" cy="41" r="3.5" fill="#e8a38c" />
      {/* Right Ear */}
      <circle cx="66" cy="41" r="3.5" fill="#fcd5c0" />
      
      {/* Head Shadow (Left) */}
      <path d="M 50 25.5 A 14.5 14.5 0 0 0 50 54.5 Z" fill="#e8a38c" />
      {/* Head Highlight (Right) */}
      <path d="M 50 25.5 A 14.5 14.5 0 0 1 50 54.5 Z" fill="#fcd5c0" />
      
      {/* Hair Shadow (Left) */}
      <path d="M 31 38 C 29 25, 38 18, 50 18 L 50 26 C 42 26, 36 27, 36 32 C 36 34, 33 36, 31 38 Z" fill="#0f172a" />
      {/* Hair Highlight (Right) */}
      <path d="M 50 18 C 62 18, 71 25, 69 38 C 67 36, 64 34, 64 32 C 64 27, 58 26, 50 26 Z" fill="#1e293b" />
      {/* Left sideburn */}
      <path d="M 31 38 L 31 44 L 34 42 L 33 38 Z" fill="#0f172a" />
      {/* Right sideburn */}
      <path d="M 69 38 L 69 44 L 66 42 L 67 38 Z" fill="#1e293b" />
      
      {/* White Shirt Shadow (Left) - Broad Shoulders */}
      <path d="M 8 100 C 12 75, 25 58, 50 58 L 50 100 Z" fill="#f1f5f9" />
      {/* White Shirt Highlight (Right) - Broad Shoulders */}
      <path d="M 50 58 C 75 58, 88 75, 92 100 L 50 100 Z" fill="#ffffff" />
      
      {/* Collar Shadow (Left) */}
      <path d="M 50 58 L 37 58 L 44 66 Z" fill="#e2e8f0" />
      {/* Collar Highlight (Right) */}
      <path d="M 50 58 L 63 58 L 56 66 Z" fill="#ffffff" />
      
      {/* Black Tie Knot */}
      <path d="M 47.5 62 L 52.5 62 L 51.5 67 L 48.5 67 Z" fill="#111827" />
      {/* Black Tie Body */}
      <path d="M 48.5 67 L 51.5 67 L 53 98 L 50 100 L 47 98 Z" fill="#111827" />
    </g>
  </svg>
);

const FemaleAvatar: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="female-purple-grad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#8c6f9f" />
        <stop offset="100%" stopColor="#654a7c" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#female-purple-grad)" />
    <mask id="female-avatar-mask-v3">
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
    </mask>
    <g mask="url(#female-avatar-mask-v3)">
      {/* Background Hair (Long, loose hair behind shoulders) */}
      {/* Left Back Hair (Shadow) */}
      <path d="M 32 35 C 26 45, 22 60, 24 75 C 25 82, 35 88, 50 88 L 50 35 Z" fill="#0f172a" />
      {/* Right Back Hair (Highlight) */}
      <path d="M 50 35 L 50 88 C 65 88, 75 82, 76 75 C 78 60, 74 45, 68 35 Z" fill="#1e293b" />

      {/* Neck base with shadow on the left */}
      <path d="M 40 48 C 40 48, 39 53, 39 58 L 50 58 L 50 48 Z" fill="#e8a38c" />
      {/* Neck highlight on the right */}
      <path d="M 50 48 L 50 58 L 61 58 C 61 53, 60 48, 60 48 Z" fill="#fcd5c0" />
      
      {/* Left Ear */}
      <circle cx="34" cy="41" r="3.5" fill="#e8a38c" />
      {/* Right Ear */}
      <circle cx="66" cy="41" r="3.5" fill="#fcd5c0" />
      
      {/* Head Shadow (Left) */}
      <path d="M 50 25.5 A 14.5 14.5 0 0 0 50 54.5 Z" fill="#e8a38c" />
      {/* Head Highlight (Right) */}
      <path d="M 50 25.5 A 14.5 14.5 0 0 1 50 54.5 Z" fill="#fcd5c0" />
      
      {/* White Shirt Shadow (Left) - Broad Shoulders */}
      <path d="M 8 100 C 12 75, 25 58, 50 58 L 50 100 Z" fill="#f1f5f9" />
      {/* White Shirt Highlight (Right) - Broad Shoulders */}
      <path d="M 50 58 C 75 58, 88 75, 92 100 L 50 100 Z" fill="#ffffff" />
      
      {/* Exposed V-Neck skin area */}
      {/* Left skin shadow */}
      <path d="M 39 58 L 50 68 L 50 58 Z" fill="#e8a38c" />
      {/* Right skin highlight */}
      <path d="M 50 58 L 50 68 L 61 58 Z" fill="#fcd5c0" />

      {/* V-Neck Collar Bands */}
      {/* Left band (Shadow) */}
      <path d="M 37 58 L 50 71 L 50 68 L 39 58 Z" fill="#e2e8f0" />
      {/* Right band (Highlight) */}
      <path d="M 50 71 L 63 58 L 61 58 L 50 68 Z" fill="#ffffff" />

      {/* Foreground Hair (Long, loose strands flowing in front of shoulders) */}
      {/* Left Front Hair (Shadow) */}
      <path d="M 50 20 C 36 20, 30 30, 30 46 C 30 58, 32 68, 36 76 C 37 78, 40 78, 41 74 C 41 68, 36 58, 36 44 C 36 32, 42 29, 50 29 Z" fill="#0f172a" />
      {/* Right Front Hair (Highlight) */}
      <path d="M 50 20 C 64 20, 70 30, 70 46 C 70 58, 68 68, 64 76 C 63 78, 60 78, 59 74 C 59 68, 64 58, 64 44 C 64 32, 58 29, 50 29 Z" fill="#1e293b" />
    </g>
  </svg>
);

const NeutralAvatar: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="neutral-purple-grad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#8c6f9f" />
        <stop offset="100%" stopColor="#654a7c" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#neutral-purple-grad)" />
    <mask id="neutral-avatar-mask-v3">
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
    </mask>
    <g mask="url(#neutral-avatar-mask-v3)">
      {/* Neck base with shadow on the left */}
      <path d="M 40 48 C 40 48, 39 53, 39 58 L 50 58 L 50 48 Z" fill="#94a3b8" />
      {/* Neck highlight on the right */}
      <path d="M 50 48 L 50 58 L 61 58 C 61 53, 60 48, 60 48 Z" fill="#cbd5e1" />
      
      {/* Left Ear */}
      <circle cx="34" cy="41" r="3.5" fill="#94a3b8" />
      {/* Right Ear */}
      <circle cx="66" cy="41" r="3.5" fill="#cbd5e1" />
      
      {/* Head Shadow (Left) */}
      <path d="M 50 25.5 A 14.5 14.5 0 0 0 50 54.5 Z" fill="#94a3b8" />
      {/* Head Highlight (Right) */}
      <path d="M 50 25.5 A 14.5 14.5 0 0 1 50 54.5 Z" fill="#cbd5e1" />
      
      {/* Hair Shadow (Left) */}
      <path d="M 31 38 C 29 25, 38 18, 50 18 L 50 26 C 42 26, 36 27, 36 32 C 36 34, 33 36, 31 38 Z" fill="#475569" />
      {/* Hair Highlight (Right) */}
      <path d="M 50 18 C 62 18, 71 25, 69 38 C 67 36, 64 34, 64 32 C 64 27, 58 26, 50 26 Z" fill="#64748b" />
      {/* Left sideburn */}
      <path d="M 31 38 L 31 44 L 34 42 L 33 38 Z" fill="#475569" />
      {/* Right sideburn */}
      <path d="M 69 38 L 69 44 L 66 42 L 67 38 Z" fill="#64748b" />
      
      {/* White Shirt Shadow (Left) - Broad Shoulders */}
      <path d="M 8 100 C 12 75, 25 58, 50 58 L 50 100 Z" fill="#f1f5f9" />
      {/* White Shirt Highlight (Right) - Broad Shoulders */}
      <path d="M 50 58 C 75 58, 88 75, 92 100 L 50 100 Z" fill="#ffffff" />
      
      {/* Collar Shadow (Left) */}
      <path d="M 50 58 L 37 58 L 44 66 Z" fill="#e2e8f0" />
      {/* Collar Highlight (Right) */}
      <path d="M 50 58 L 63 58 L 56 66 Z" fill="#ffffff" />
      
      {/* Slate Tie Knot */}
      <path d="M 47.5 62 L 52.5 62 L 51.5 67 L 48.5 67 Z" fill="#1e293b" />
      {/* Slate Tie Body */}
      <path d="M 48.5 67 L 51.5 67 L 53 98 L 50 100 L 47 98 Z" fill="#1e293b" />
    </g>
  </svg>
);

const guessGenero = (name: string, isCliente?: boolean): 'MASCULINO' | 'FEMENINO' | '' => {
  const n = name.toUpperCase().trim();
  if (!n || n.includes('SIN REMITENTE')) return '';
  if (
    n.includes('HELENA') || 
    n.includes('ANDREA') || 
    n.includes('MARIA') || 
    n.includes('ANA') || 
    n.includes('GABRIELA') || 
    n.includes('CARLA') || 
    n.includes('LAURA') ||
    n.includes('DIANA') ||
    n.includes('PATRICIA') ||
    n.includes('CARMEN') ||
    n.includes('VALENTINA') ||
    n.includes('ISABELA') ||
    n.includes('SOFIA') ||
    n.includes('YUDITH') ||
    n.includes('YOLANDA') ||
    n.includes('GLADYS') ||
    n.includes('ROSA') ||
    n.includes('BEATRIZ') ||
    n.includes('LILIANA') ||
    n.includes('PATTY')
  ) {
    return 'FEMENINO';
  }
  if (!isCliente) {
    return 'MASCULINO';
  }
  return '';
};

const renderAvatarHelper = (genero?: 'MASCULINO' | 'FEMENINO' | '', className?: string) => {
  if (genero === 'MASCULINO') return <MaleAvatar className={className} />;
  if (genero === 'FEMENINO') return <FemaleAvatar className={className} />;
  return <NeutralAvatar className={className} />;
};

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [activeTab, setActiveTab] = useState<'clientes' | 'usuarios'>('clientes');

  const remitenteSerialsMap = useMemo(() => {
    const map = new Map<string, POSItem[]>();
    serials.forEach(s => {
      const r = s.remitente ? s.remitente.toUpperCase().trim() : 'S/R (SIN REMITENTE)';
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(s);
    });
    return map;
  }, [serials]);

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch]);
  
  // Profile Editing Modal State
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempIsUsuario, setTempIsUsuario] = useState(false);
  const [tempIsCliente, setTempIsCliente] = useState(false);
  const [tempArea, setTempArea] = useState('');
  const [tempCargo, setTempCargo] = useState('');
  const [tempRif, setTempRif] = useState('');
  const [tempRazonSocial, setTempRazonSocial] = useState('');
  const [tempUbicacion, setTempUbicacion] = useState('');
  const [tempTelefono, setTempTelefono] = useState('');
  const [tempGenero, setTempGenero] = useState<'MASCULINO' | 'FEMENINO' | ''>('');

  // Handle ESC key press locally to close editing modal in Usuarios
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingProfile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openProfileEditor = (remName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProfile(remName);
    const p = usersProfiles[remName];
    
    // Fallback from serials registered in Casillero
    const associatedSerials = remitenteSerialsMap.get(remName.toUpperCase().trim()) || [];
    const fallbackRif = associatedSerials.find(s => s.rif)?.rif || '';
    const fallbackRazonSocial = associatedSerials.find(s => s.razonSocial)?.razonSocial || '';
    const fallbackUbicacion = associatedSerials.find(s => s.destino)?.destino || '';
    const isClienteBySerials = !!(fallbackRif || fallbackRazonSocial || associatedSerials.some(s => s.isCasillero));

    setTempName(p?.nombreCompleto || fallbackRazonSocial || remName.toUpperCase().trim());
    
    // Fallback: Si no está guardado explícitamente como usuario o cliente, lo tratamos como cliente if there's any serial info, otherwise usuario
    const hasCategory = p && (p.isUsuario || p.isCliente);
    setTempIsUsuario(hasCategory ? !!p.isUsuario : !isClienteBySerials);
    setTempIsCliente(hasCategory ? !!p.isCliente : isClienteBySerials);
    
    setTempArea(p?.area || '');
    setTempCargo(p?.cargo || '');
    setTempRif(p?.rif || fallbackRif || '');
    setTempRazonSocial(p?.razonSocial || fallbackRazonSocial || '');
    setTempUbicacion(p?.ubicacion || fallbackUbicacion || '');
    setTempTelefono(p?.telefono || '');
    setTempGenero(p?.genero || '');
  };

  const saveProfile = () => {
    if (!editingProfile) return;
    setUsersProfiles(prev => ({
      ...prev,
      [editingProfile]: {
        remitenteId: editingProfile,
        nombreCompleto: tempName.toUpperCase(),
        isUsuario: tempIsUsuario,
        isCliente: tempIsCliente,
        area: tempIsUsuario ? tempArea.toUpperCase().trim() : '',
        cargo: tempIsUsuario ? tempCargo.toUpperCase().trim() : '',
        rif: tempIsCliente ? formatRif(tempRif) : '',
        razonSocial: tempIsCliente ? tempRazonSocial.toUpperCase().trim() : '',
        ubicacion: tempIsCliente ? tempUbicacion.toUpperCase().trim() : '',
        telefono: tempIsCliente ? tempTelefono.toUpperCase().trim() : '',
        genero: tempGenero
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

  const categorizedRemitentes = useMemo(() => {
    const clients: string[] = [];
    const users: string[] = [];

    sortedRemitentes.forEach(remName => {
      const p = usersProfiles[remName];
      const hasProfile = !!p;
      const isCliente = p ? !!p.isCliente : false;
      
      const associatedSerials = remitenteSerialsMap.get(remName.toUpperCase().trim()) || [];
      const fallbackRif = associatedSerials.find(s => s.rif)?.rif || '';
      const fallbackRazonSocial = associatedSerials.find(s => s.razonSocial)?.razonSocial || '';
      const isClienteBySerials = !!(fallbackRif || fallbackRazonSocial || associatedSerials.some(s => s.isCasillero));

      const showCliente = hasProfile ? isCliente : isClienteBySerials;

      if (showCliente) {
        clients.push(remName);
      } else {
        users.push(remName);
      }
    });

    return { clients, users };
  }, [sortedRemitentes, usersProfiles, remitenteSerialsMap]);

  const activeRemitentes = activeTab === 'clientes' ? categorizedRemitentes.clients : activeTab === 'usuarios' ? categorizedRemitentes.users : [];
  const totalPages = Math.ceil(activeRemitentes.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRemitentes = activeRemitentes.slice(startIndex, startIndex + itemsPerPage);

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
      case 'ENTREGADO':
        return 'bg-amber-100 text-amber-800 border border-transparent rounded-lg px-2 py-0.5 font-bold uppercase';
      case 'CANCELADO':
      case 'RECUPERADO':
      case 'DISPONIBLE':
      case 'N#A':
        return 'bg-emerald-100 text-emerald-800 border border-transparent rounded-lg px-2 py-0.5 font-bold uppercase';
      case 'SIN ESTATUS':
      default: return 'bg-slate-100 text-slate-700 border border-transparent rounded-lg px-2 py-0.5 font-bold uppercase';
    }
  };

  return (
    <div className="flex flex-col gap-4 text-slate-700 pb-16 font-arial">
      
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center text-slate-800 gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            DIRECTORIO DE REMITENTES
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-arial font-bold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
            Total Clientes: {categorizedRemitentes.clients.length}
          </span>
          <span className="text-xs font-arial font-bold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
            Total Usuarios: {categorizedRemitentes.users.length}
          </span>
        </div>
      </div>
      {/* PESTAÑAS (TABS) DE SELECCIÓN */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 gap-1.5">
        <button
          onClick={() => { setActiveTab('clientes'); setCurrentPage(1); }}
          className={`usuarios-tab-btn flex-1 py-2.5 text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer border-none ${
            activeTab === 'clientes'
              ? 'bg-[#22c55e] text-white-force shadow-sm font-black'
              : 'bg-transparent text-slate-500 hover:text-slate-750 hover:bg-slate-200/50'
          }`}
        >
          Clientes
        </button>
        <button
          onClick={() => { setActiveTab('usuarios'); setCurrentPage(1); }}
          className={`usuarios-tab-btn flex-1 py-2.5 text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer border-none ${
            activeTab === 'usuarios'
              ? 'bg-[#2563eb] text-white-force shadow-sm font-black'
              : 'bg-transparent text-slate-500 hover:text-slate-750 hover:bg-slate-200/50'
          }`}
        >
          Usuarios Disglobal
        </button>
      </div>

      <div className="flex flex-col gap-3 font-sans">
          {paginatedRemitentes.length === 0 ? (
            <div className="text-center py-10 bg-white border border-slate-100 rounded-2xl text-slate-400 text-xs font-arial shadow-sm uppercase font-bold">
              No se encontraron {activeTab === 'clientes' ? 'clientes' : 'usuarios'} registrados.
            </div>
          ) : (
            paginatedRemitentes.map(remName => {
              const datesMap = remitentesMap.get(remName)!;
              const datesSorted = Array.from(datesMap.keys()).sort().reverse();
              const totalPOSCount = Array.from(datesMap.values()).reduce((sum, list) => sum + list.length, 0);
              const isExpanded = expandedUsers.has(remName) || !!globalSearch;

              const p = usersProfiles[remName];
              const isCliente = activeTab === 'clientes';
              
              const associatedSerials = remitenteSerialsMap.get(remName.toUpperCase().trim()) || [];
              const fallbackRif = associatedSerials.find(s => s.rif)?.rif || '';
              const fallbackRazonSocial = associatedSerials.find(s => s.razonSocial)?.razonSocial || '';
              
              const rif = p?.rif || fallbackRif || '';
              const cargo = p?.cargo || '';
              const area = p?.area || '';

              return (
                <div 
                  key={remName} 
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-slate-800 hover:border-slate-350 transition-all animate-fade-in"
                >
                  {/* ACCORDION HEADER */}
                  <div 
                    onClick={() => toggleExpandUser(remName)}
                    className="bg-white hover:bg-slate-50/50 p-4 flex justify-between items-center cursor-pointer select-none transition-colors border-b border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={(e) => openProfileEditor(remName, e)}
                        className="w-8 h-8 rounded-xl bg-white user-btn flex items-center justify-center hover:scale-105 transition-all shadow-sm border border-slate-200"
                        title="Editar Perfil"
                      >
                        <Users size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm tracking-wide text-slate-800 uppercase flex items-center flex-wrap gap-1.5 leading-tight">
                          <span>{remName}</span>
                          {isCliente ? (
                            rif && (
                              <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider">
                                RIF: {rif}
                              </span>
                            )
                          ) : (
                            (cargo || area) && (
                              <span className="bg-slate-100 text-slate-750 border border-slate-250 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider normal-case font-arial">
                                {cargo ? `${cargo}` : 'Sin Cargo'} {area ? ` | Departamento: ${area}` : ''}
                              </span>
                            )
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-arial mt-0.5">
                          {isCliente 
                            ? `Razón Social: ${p?.razonSocial || fallbackRazonSocial || 'No Registrada'}`
                            : `Colaborador Disglobal`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-arial font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl">
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
                    <div className="divide-y divide-slate-100 bg-slate-50/50 font-arial text-[11px] text-slate-700">
                      {datesSorted.map(dateStr => {
                        const items = datesMap.get(dateStr)!;
                        const displayDate = dateStr.split('-').reverse().join('/');

                        return (
                          <div key={dateStr} className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                            
                            <div className="sm:w-44 flex-shrink-0 flex items-center gap-1.5 text-slate-850 font-bold tracking-wide py-0.5 text-xs">
                              <Calendar size={13} className="text-slate-500" />
                              <span>{displayDate}</span>
                              <span className="text-[10px] font-semibold text-slate-550">({items.length})</span>
                            </div>

                            <div className="flex-1 flex flex-wrap gap-2">
                              {items.map(s => {
                                const m = getTerminalModel(s.serial, modelosDB);
                                return (
                                  <div 
                                    key={s.id}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      handleCopyText(s.serial, `serial-${s.id}`);
                                    }}
                                    title={`${s.serial} - ${m.modelo}`}
                                    className="group bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-300 px-2.5 py-1.5 rounded-xl flex items-center gap-2 select-all cursor-pointer transition-all max-w-sm truncate shadow-sm text-slate-800"
                                  >
                                    <Box size={10} className="text-slate-555 group-hover:text-slate-850 transition-colors" />
                                    <div className="flex flex-col">
                                      <span className="text-slate-900 font-bold tracking-wider flex items-center gap-1">
                                        <span>{s.serial}</span>
                                        {copiedKey === `serial-${s.id}` && (
                                          <span className="inline-flex items-center justify-center bg-emerald-600 border border-emerald-500 rounded p-0.5 ml-1 transition-all animate-fade-in shrink-0">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-[9px] text-slate-500 font-sans leading-none">{m.modelo}</span>
                                    </div>
                                    <span className={getBadgeClass(s.status)}>
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

      {totalPages > 1 && (
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center text-xs text-slate-500">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 disabled:opacity-30 rounded-lg text-[9px] uppercase font-bold text-slate-700 transition-colors cursor-pointer shadow-sm pagination-btn">Primera</button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 disabled:opacity-30 rounded-lg text-[9px] uppercase font-bold text-slate-700 transition-colors cursor-pointer shadow-sm pagination-btn">Atrás</button>
            <span className="px-2 font-semibold text-slate-600 flex items-center">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 disabled:opacity-30 rounded-lg text-[9px] uppercase font-bold text-slate-700 transition-colors cursor-pointer shadow-sm pagination-btn">Siguiente</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 disabled:opacity-30 rounded-lg text-[9px] uppercase font-bold text-slate-700 transition-colors cursor-pointer shadow-sm pagination-btn">Fin</button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL */}
      {editingProfile && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in-overlay"
          onClick={() => setEditingProfile(null)}
        >
          <div 
            className="bg-white border border-slate-100 rounded-2xl w-full max-w-md max-h-[85vh] p-6 shadow-xl flex flex-col gap-4 overflow-y-auto animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Editar Perfil</h3>
              <p className="text-[10px] text-slate-550 font-arial mt-1">Remitente: <span className="text-slate-800 font-extrabold">{editingProfile}</span></p>
            </div>
            
            <div className="flex flex-col gap-3 font-arial text-xs mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={e => setTempName(e.target.value)}
                  placeholder="Ej. Pedro Pérez"
                  className="w-full bg-slate-100 border border-transparent rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold uppercase"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Género (Para Avatar)</label>
                <select
                  value={tempGenero}
                  onChange={e => setTempGenero(e.target.value as any)}
                  className="w-full bg-slate-100 border border-transparent rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold"
                >
                  <option value="">SELECCIONAR GÉNERO</option>
                  <option value="MASCULINO">MASCULINO</option>
                  <option value="FEMENINO">FEMENINO</option>
                </select>
              </div>

              {/* Categorías (Casillas) */}
              <div className="flex gap-4 items-center justify-start my-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2 font-bold text-[10px] text-slate-700 uppercase cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={tempIsUsuario} 
                    onChange={e => setTempIsUsuario(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                  />
                  <span>USUARIO</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-[10px] text-slate-700 uppercase cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={tempIsCliente} 
                    onChange={e => setTempIsCliente(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                  />
                  <span>CLIENTE</span>
                </label>
              </div>

              {/* USUARIO FIELDS */}
              <div className={`flex flex-col gap-3 p-3 rounded-xl border transition-all ${tempIsUsuario ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-50/20 border-slate-100 opacity-50'}`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                  <span className="text-[10px] font-bold text-slate-650 uppercase">Datos de Usuario (Trabajador)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Departamento</label>
                  <input 
                    type="text" 
                    value={tempArea} 
                    onChange={e => setTempArea(e.target.value)}
                    placeholder="Ej. POSTVENTA"
                    disabled={!tempIsUsuario}
                    className="w-full bg-slate-100 disabled:opacity-50 border border-transparent rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo</label>
                  <input 
                    type="text" 
                    value={tempCargo} 
                    onChange={e => setTempCargo(e.target.value)}
                    placeholder="Ej. Supervisor Logístico"
                    disabled={!tempIsUsuario}
                    className="w-full bg-slate-100 disabled:opacity-50 border border-transparent rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold uppercase"
                  />
                </div>
              </div>

              {/* CLIENTE FIELDS */}
              <div className={`flex flex-col gap-3 p-3 rounded-xl border transition-all ${tempIsCliente ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-50/20 border-slate-100 opacity-50'}`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                  <span className="text-[10px] font-bold text-slate-650 uppercase">Datos de Cliente (Entrega Equipos)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">RIF</label>
                  <input 
                    type="text" 
                    value={tempRif} 
                    onChange={e => setTempRif(e.target.value)}
                    placeholder="Ej. J-12345678-9"
                    disabled={!tempIsCliente}
                    className="w-full bg-slate-100 disabled:opacity-50 border border-transparent rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Razón Social</label>
                  <input 
                    type="text" 
                    value={tempRazonSocial} 
                    onChange={e => setTempRazonSocial(e.target.value)}
                    placeholder="Ej. Inversiones 123 C.A."
                    disabled={!tempIsCliente}
                    className="w-full bg-slate-100 disabled:opacity-50 border border-transparent rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Ubicación</label>
                  <input 
                    type="text" 
                    value={tempUbicacion} 
                    onChange={e => setTempUbicacion(e.target.value)}
                    placeholder="Ej. Caracas, Chacao"
                    disabled={!tempIsCliente}
                    className="w-full bg-slate-100 disabled:opacity-50 border border-transparent rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Número Telefónico</label>
                  <input 
                    type="text" 
                    value={tempTelefono} 
                    onChange={e => setTempTelefono(e.target.value)}
                    placeholder="Ej. 0412-1234567"
                    disabled={!tempIsCliente}
                    className="w-full bg-slate-100 disabled:opacity-50 border border-transparent rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={() => setEditingProfile(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl border border-transparent transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={saveProfile}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-xl border border-transparent transition-colors cursor-pointer"
              >
                Guardar Perfil
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
