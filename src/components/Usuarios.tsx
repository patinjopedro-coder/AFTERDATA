import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { POSItem, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { formatRif } from '../utils';
import { Users, ChevronDown, ChevronUp, Calendar, Copy, Box, Check, Trophy, TrendingUp, User, MoreVertical, Award, Activity, Briefcase, Building } from 'lucide-react';

const MaleAvatar: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="48" fill="#785c90" />
    <mask id="male-avatar-mask-v2">
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
    </mask>
    <g mask="url(#male-avatar-mask-v2)">
      {/* Neck base with shadow on the left */}
      <path d="M40 65 L40 50 C40 50, 50 48, 60 50 L60 65 Z" fill="#d09a96" />
      {/* Neck highlight on the right */}
      <path d="M48 65 L48 51 C48 51, 54 49, 60 50 L60 65 Z" fill="#fbcbb0" />
      
      {/* Left Ear */}
      <circle cx="34" cy="39" r="3.5" fill="#d09a96" />
      {/* Right Ear */}
      <circle cx="66" cy="39" r="3.5" fill="#fbcbb0" />
      {/* Face/Head */}
      <circle cx="50" cy="38" r="14.5" fill="#fbcbb0" />
      
      {/* Hair (short cropped neat styling) */}
      <path d="M33 35 C32 24, 40 18, 50 18 C60 18, 68 24, 67 35 C66 40, 64 42, 64 36 C64 30, 58 29, 50 29 C42 29, 36 30, 36 36 C36 42, 34 40, 33 35 Z" fill="#252f3f" />
      {/* Left sideburn */}
      <path d="M33 35 L33 42 L36 40 L35 35 Z" fill="#252f3f" />
      {/* Right sideburn */}
      <path d="M67 35 L67 42 L64 40 L65 35 Z" fill="#252f3f" />
      
      {/* White Shirt Body */}
      <path d="M15 82 C15 70, 25 66, 50 66 C75 66, 85 70, 85 82 L85 100 H15 Z" fill="#ffffff" />
      {/* Shirt shadow on the left */}
      <path d="M15 82 C15 70, 25 66, 50 66 L50 100 H15 Z" fill="#e5e7eb" />
      
      {/* Collar Triangles */}
      <path d="M50 72 L36 66 L50 66 Z" fill="#e5e7eb" />
      <path d="M50 72 L64 66 L50 66 Z" fill="#ffffff" />
      
      {/* Black Tie */}
      <path d="M47.5 70 L52.5 70 L51.5 75 L48.5 75 Z" fill="#111827" />
      <path d="M48.5 75 L51.5 75 L53 98 L50 100 L47 98 Z" fill="#111827" />
    </g>
  </svg>
);

const FemaleAvatar: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="48" fill="#785c90" />
    <mask id="female-avatar-mask-v2">
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
    </mask>
    <g mask="url(#female-avatar-mask-v2)">
      {/* Neck base with shadow on the left */}
      <path d="M40 65 L40 50 C40 50, 50 48, 60 50 L60 65 Z" fill="#d09a96" />
      {/* Neck highlight on the right */}
      <path d="M48 65 L48 51 C48 51, 54 49, 60 50 L60 65 Z" fill="#fbcbb0" />
      
      {/* Left Ear */}
      <circle cx="34" cy="39" r="3.5" fill="#d09a96" />
      {/* Right Ear */}
      <circle cx="66" cy="39" r="3.5" fill="#fbcbb0" />
      {/* Face/Head */}
      <circle cx="50" cy="38" r="14.5" fill="#fbcbb0" />
      
      {/* Hair Bun (Chongo) on top */}
      <ellipse cx="50" cy="19" rx="13" ry="11" fill="#252f3f" />
      {/* Main Hair (covers head and sweeps down) */}
      <path d="M32 40 C30 26, 38 20, 50 20 C62 20, 70 26, 68 40 C68 45, 65 48, 65 43 C65 35, 59 31, 50 32 C41 31, 35 35, 35 43 C35 48, 32 45, 32 40 Z" fill="#252f3f" />
      
      {/* White Shirt Body */}
      <path d="M15 82 C15 70, 25 66, 50 66 C75 66, 85 70, 85 82 L85 100 H15 Z" fill="#ffffff" />
      {/* Shirt shadow on the left */}
      <path d="M15 82 C15 70, 25 66, 50 66 L50 100 H15 Z" fill="#e5e7eb" />
      
      {/* Collar Triangles */}
      <path d="M50 72 L36 66 L50 66 Z" fill="#e5e7eb" />
      <path d="M50 72 L64 66 L50 66 Z" fill="#ffffff" />
      
      {/* Black Tie */}
      <path d="M47.5 70 L52.5 70 L51.5 75 L48.5 75 Z" fill="#111827" />
      <path d="M48.5 75 L51.5 75 L53 98 L50 100 L47 98 Z" fill="#111827" />
    </g>
  </svg>
);

const NeutralAvatar: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="48" fill="#785c90" />
    <mask id="neutral-avatar-mask-v2">
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
    </mask>
    <g mask="url(#neutral-avatar-mask-v2)">
      {/* Neck base with shadow on the left */}
      <path d="M40 65 L40 50 C40 50, 50 48, 60 50 L60 65 Z" fill="#94a3b8" />
      {/* Neck highlight on the right */}
      <path d="M48 65 L48 51 C48 51, 54 49, 60 50 L60 65 Z" fill="#cbd5e1" />
      
      {/* Left Ear */}
      <circle cx="34" cy="39" r="3.5" fill="#94a3b8" />
      {/* Right Ear */}
      <circle cx="66" cy="39" r="3.5" fill="#cbd5e1" />
      {/* Face/Head */}
      <circle cx="50" cy="38" r="14.5" fill="#cbd5e1" />
      
      {/* Hair (generic neat cropped styling) */}
      <path d="M33 35 C32 24, 40 18, 50 18 C60 18, 68 24, 67 35 C66 40, 64 42, 64 36 C64 30, 58 29, 50 29 C42 29, 36 30, 36 36 C36 42, 34 40, 33 35 Z" fill="#475569" />
      {/* Left sideburn */}
      <path d="M33 35 L33 42 L36 40 L35 35 Z" fill="#475569" />
      {/* Right sideburn */}
      <path d="M67 35 L67 42 L64 40 L65 35 Z" fill="#475569" />
      
      {/* White Shirt Body */}
      <path d="M15 82 C15 70, 25 66, 50 66 C75 66, 85 70, 85 82 L85 100 H15 Z" fill="#ffffff" />
      {/* Shirt shadow on the left */}
      <path d="M15 82 C15 70, 25 66, 50 66 L50 100 H15 Z" fill="#e5e7eb" />
      
      {/* Collar Triangles */}
      <path d="M50 72 L36 66 L50 66 Z" fill="#e5e7eb" />
      <path d="M50 72 L64 66 L50 66 Z" fill="#ffffff" />
      
      {/* Black Tie */}
      <path d="M47.5 70 L52.5 70 L51.5 75 L48.5 75 Z" fill="#111827" />
      <path d="M48.5 75 L51.5 75 L53 98 L50 100 L47 98 Z" fill="#111827" />
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
  const [activeTab, setActiveTab] = useState<'clientes' | 'usuarios' | 'ranking'>('clientes');
  const [rankingFilter, setRankingFilter] = useState<'all' | 'colaboradores' | 'clientes'>('all');

  const remitenteSerialsMap = useMemo(() => {
    const map = new Map<string, POSItem[]>();
    serials.forEach(s => {
      const r = s.remitente ? s.remitente.toUpperCase().trim() : 'S/R (SIN REMITENTE)';
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(s);
    });
    return map;
  }, [serials]);

  const getProfileWithFallback = (remName: string) => {
    const p = usersProfiles[remName];
    
    // Find fallback from serials
    const associatedSerials = remitenteSerialsMap.get(remName.toUpperCase().trim()) || [];
    const fallbackRif = associatedSerials.find(s => s.rif)?.rif || '';
    const fallbackRazonSocial = associatedSerials.find(s => s.razonSocial)?.razonSocial || '';
    const fallbackUbicacion = associatedSerials.find(s => s.destino)?.destino || '';
    const isClienteBySerials = !!(fallbackRif || fallbackRazonSocial || associatedSerials.some(s => s.isCasillero));

    const isCliente = p?.isCliente !== undefined ? p.isCliente : isClienteBySerials;

    return {
      remitenteId: remName,
      nombreCompleto: p?.nombreCompleto || fallbackRazonSocial || remName.toUpperCase(),
      isUsuario: p?.isUsuario !== undefined ? p.isUsuario : !isClienteBySerials,
      isCliente,
      area: p?.area || '',
      cargo: p?.cargo || '',
      rif: p?.rif || fallbackRif,
      razonSocial: p?.razonSocial || fallbackRazonSocial || remName.toUpperCase(),
      ubicacion: p?.ubicacion || fallbackUbicacion,
      telefono: p?.telefono || '',
      genero: p?.genero || guessGenero(remName, isCliente)
    };
  };

  const rankingList = useMemo(() => {
    const list: {
      remName: string;
      profile: ReturnType<typeof getProfileWithFallback>;
      total: number;
      activeCount: number;
      availableCount: number;
      lastArrivalDate: string;
      operadoras: Record<string, number>;
    }[] = [];

    remitenteSerialsMap.forEach((userSerials, remName) => {
      if (remName === 'S/R (SIN REMITENTE)') return; // Skip no sender
      
      const profile = getProfileWithFallback(remName);
      
      let activeCount = 0;
      let availableCount = 0;
      let lastArrivalDate = '';
      const operadoras: Record<string, number> = {};

      userSerials.forEach(s => {
        const st = (s.status || '').toUpperCase().trim();
        if (['ENTREGADO', 'ACTIVO', 'SUSPENDIDO', 'PENDIENTE'].includes(st)) {
          activeCount++;
        } else if (['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A', 'SIN ESTATUS'].includes(st)) {
          availableCount++;
        }
        
        if (s.date && (!lastArrivalDate || s.date > lastArrivalDate)) {
          lastArrivalDate = s.date;
        }

        if (s.operadora) {
          const op = s.operadora.toUpperCase().trim();
          if (op) {
            operadoras[op] = (operadoras[op] || 0) + 1;
          }
        }
      });

      list.push({
        remName,
        profile,
        total: userSerials.length,
        activeCount,
        availableCount,
        lastArrivalDate,
        operadoras
      });
    });

    // Sort by total equipment processed (descending)
    return list.sort((a, b) => b.total - a.total);
  }, [remitenteSerialsMap, usersProfiles]);

  const filteredRankingList = useMemo(() => {
    return rankingList.filter(item => {
      // 1. Filter by category
      if (rankingFilter === 'colaboradores' && !item.profile.isUsuario) return false;
      if (rankingFilter === 'clientes' && !item.profile.isCliente) return false;

      // 2. Filter by search query
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        return (
          item.remName.toLowerCase().includes(query) ||
          item.profile.nombreCompleto.toLowerCase().includes(query) ||
          (item.profile.cargo && item.profile.cargo.toLowerCase().includes(query)) ||
          (item.profile.area && item.profile.area.toLowerCase().includes(query)) ||
          (item.profile.rif && item.profile.rif.toLowerCase().includes(query)) ||
          (item.profile.razonSocial && item.profile.razonSocial.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [rankingList, rankingFilter, globalSearch]);

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
        <button
          onClick={() => { setActiveTab('ranking'); setCurrentPage(1); }}
          className={`usuarios-tab-btn flex-1 py-2.5 text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer border-none ${
            activeTab === 'ranking'
              ? 'bg-[#ea580c] text-white-force shadow-sm font-black'
              : 'bg-transparent text-slate-500 hover:text-slate-750 hover:bg-slate-200/50'
          }`}
        >
          Top Destacados
        </button>
      </div>

      {activeTab === 'ranking' ? (
        <div className="flex flex-col gap-6 font-sans">
          {/* Sub-tabs for Ranking Type */}
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filtrar Ranking:</span>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-1.5">
              <button
                onClick={() => setRankingFilter('all')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md cursor-pointer border-none transition-all ${
                  rankingFilter === 'all'
                    ? 'bg-slate-800 text-white-force shadow-sm font-black'
                    : 'bg-transparent text-slate-500 hover:text-slate-750'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setRankingFilter('colaboradores')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md cursor-pointer border-none transition-all ${
                  rankingFilter === 'colaboradores'
                    ? 'bg-slate-800 text-white-force shadow-sm font-black'
                    : 'bg-transparent text-slate-500 hover:text-slate-750'
                }`}
              >
                Colaboradores
              </button>
              <button
                onClick={() => setRankingFilter('clientes')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md cursor-pointer border-none transition-all ${
                  rankingFilter === 'clientes'
                    ? 'bg-slate-800 text-white-force shadow-sm font-black'
                    : 'bg-transparent text-slate-500 hover:text-slate-750'
                }`}
              >
                Clientes
              </button>
            </div>
          </div>

          {filteredRankingList.length === 0 ? (
            <div className="text-center py-10 bg-white border border-slate-100 rounded-2xl text-slate-400 text-xs font-arial shadow-sm uppercase font-bold">
              No se encontraron remitentes en el ranking.
            </div>
          ) : (
            <>
              {/* PODIUM SECTION (TOP 3) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
                {/* 2ND PLACE */}
                {filteredRankingList[1] && (
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center relative hover:scale-[1.02] transition-transform order-2 md:order-1 min-h-[200px] justify-between">
                    <div className="absolute top-3 left-3 bg-slate-200 text-slate-855 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">2</div>
                    <div className="flex flex-col items-center">
                      <div className="relative mb-3">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-slate-50 p-0.5">
                          {renderAvatarHelper(filteredRankingList[1].profile.genero, "w-full h-full")}
                        </div>
                      </div>
                      <h4 className="font-bold text-xs text-slate-850 uppercase tracking-wide leading-tight line-clamp-1">{filteredRankingList[1].profile.nombreCompleto}</h4>
                      <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">
                        {filteredRankingList[1].profile.isUsuario
                          ? `${filteredRankingList[1].profile.cargo || 'Colaborador'}`
                          : `${filteredRankingList[1].profile.razonSocial || 'Cliente'}`
                        }
                      </p>
                    </div>
                    <div className="mt-3 flex flex-col items-center">
                      <span className="text-[20px] font-black text-slate-800 leading-none">{filteredRankingList[1].total}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Equipos</span>
                    </div>
                    <button
                      onClick={(e) => openProfileEditor(filteredRankingList[1].remName, e)}
                      className="mt-3 w-full py-1 bg-slate-100 hover:bg-slate-200 text-[9px] font-bold uppercase rounded-lg border-none cursor-pointer text-slate-655 transition-colors"
                    >
                      Editar Perfil
                    </button>
                  </div>
                )}

                {/* 1ST PLACE */}
                {filteredRankingList[0] && (
                  <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-md flex flex-col items-center text-center relative hover:scale-[1.02] transition-transform order-1 md:order-2 md:-translate-y-2 min-h-[220px] justify-between" style={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)' }}>
                    <div className="absolute top-3 left-3 bg-slate-800 text-white-force w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border border-slate-700">1</div>
                    <div className="flex flex-col items-center">
                      <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-300 bg-slate-50 p-0.5 shadow-sm">
                          {renderAvatarHelper(filteredRankingList[0].profile.genero, "w-full h-full")}
                        </div>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider leading-tight line-clamp-1">{filteredRankingList[0].profile.nombreCompleto}</h4>
                      <p className="text-[9px] font-bold text-slate-500 mt-1 line-clamp-1">
                        {filteredRankingList[0].profile.isUsuario
                          ? `${filteredRankingList[0].profile.cargo || 'Colaborador'}`
                          : `${filteredRankingList[0].profile.razonSocial || 'Cliente'}`
                        }
                      </p>
                    </div>
                    <div className="mt-3 flex flex-col items-center">
                      <span className="text-[24px] font-black text-slate-800 leading-none">{filteredRankingList[0].total}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Equipos</span>
                    </div>
                    <button
                      onClick={(e) => openProfileEditor(filteredRankingList[0].remName, e)}
                      className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-extrabold uppercase rounded-lg border border-slate-200 cursor-pointer text-slate-700 transition-colors"
                    >
                      Editar Perfil
                    </button>
                  </div>
                )}

                {/* 3RD PLACE */}
                {filteredRankingList[2] && (
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center relative hover:scale-[1.02] transition-transform order-3 min-h-[200px] justify-between">
                    <div className="absolute top-3 left-3 bg-slate-200 text-slate-855 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">3</div>
                    <div className="flex flex-col items-center">
                      <div className="relative mb-3">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 p-0.5">
                          {renderAvatarHelper(filteredRankingList[2].profile.genero, "w-full h-full")}
                        </div>
                      </div>
                      <h4 className="font-bold text-xs text-slate-850 uppercase tracking-wide leading-tight line-clamp-1">{filteredRankingList[2].profile.nombreCompleto}</h4>
                      <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">
                        {filteredRankingList[2].profile.isUsuario
                          ? `${filteredRankingList[2].profile.cargo || 'Colaborador'}`
                          : `${filteredRankingList[2].profile.razonSocial || 'Cliente'}`
                        }
                      </p>
                    </div>
                    <div className="mt-3 flex flex-col items-center">
                      <span className="text-[20px] font-black text-slate-800 leading-none">{filteredRankingList[2].total}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Equipos</span>
                    </div>
                    <button
                      onClick={(e) => openProfileEditor(filteredRankingList[2].remName, e)}
                      className="mt-3 w-full py-1 bg-slate-100 hover:bg-slate-200 text-[9px] font-bold uppercase rounded-lg border-none cursor-pointer text-slate-655 transition-colors"
                    >
                      Editar Perfil
                    </button>
                  </div>
                )}
              </div>

              {/* LEADERBOARD LIST VIEW */}
              <div className="flex flex-col gap-2.5 mt-6 font-sans">
                <div className="bg-[#f8fafc] text-[9px] font-black text-slate-400 px-4 py-2 uppercase tracking-widest hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-200">
                  <div className="col-span-1 text-center">Rango</div>
                  <div className="col-span-1 text-center">Avatar</div>
                  <div className="col-span-6">Nombre Completo y Rol / Empresa</div>
                  <div className="col-span-2 text-center">Total Equipos</div>
                  <div className="col-span-2 text-right pr-2">Acciones</div>
                </div>

                {filteredRankingList.map((item, index) => {
                  const rank = index + 1;
                  const isExpanded = expandedUsers.has(item.remName);
                  
                  return (
                    <div 
                      key={item.remName}
                      className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-350 transition-all flex flex-col overflow-hidden animate-fade-in"
                    >
                      {/* HEADER ROW */}
                      <div 
                        onClick={() => toggleExpandUser(item.remName)}
                        className="p-4 grid grid-cols-1 sm:grid-cols-12 items-center gap-3 cursor-pointer select-none"
                      >
                        {/* 1. RANK */}
                        <div className="col-span-1 flex items-center justify-center">
                          {rank === 1 && <span className="text-xl">🥇</span>}
                          {rank === 2 && <span className="text-xl">🥈</span>}
                          {rank === 3 && <span className="text-xl">🥉</span>}
                          {rank > 3 && <span className="font-bold text-sm text-slate-500 font-mono">#{rank}</span>}
                        </div>

                        {/* 2. AVATAR */}
                        <div className="col-span-1 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-55 p-0.5">
                            {renderAvatarHelper(item.profile.genero, "w-full h-full")}
                          </div>
                        </div>

                        {/* 3. NAME & DETAILS */}
                        <div className="col-span-6">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-extrabold text-xs text-slate-850 uppercase tracking-wide">{item.profile.nombreCompleto}</span>
                            {item.profile.isUsuario ? (
                              <span className="bg-blue-55 text-blue-700 border border-blue-100 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider">COLABORADOR</span>
                            ) : (
                              <span className="bg-emerald-55 text-emerald-700 border border-emerald-100 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider">CLIENTE</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            {item.profile.isUsuario ? (
                              <>
                                <Briefcase size={10} className="text-slate-400" />
                                <span>{item.profile.cargo || 'Sin Cargo'}</span>
                                {item.profile.area && (
                                  <>
                                    <span className="text-slate-350">|</span>
                                    <Building size={10} className="text-slate-400" />
                                    <span>Depto: {item.profile.area}</span>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <span>Razón Social: {item.profile.razonSocial}</span>
                                {item.profile.rif && (
                                  <>
                                    <span className="text-slate-355">|</span>
                                    <span>RIF: {item.profile.rif}</span>
                                  </>
                                )}
                              </>
                            )}
                          </p>
                        </div>

                        {/* 4. TOTAL SCORE */}
                        <div className="col-span-2 flex items-center justify-center">
                          <span className="bg-slate-50 text-slate-700 font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-100">
                            <Activity size={12} className="text-slate-500" />
                            <span>{item.total} Equipos</span>
                          </span>
                        </div>

                        {/* 5. ACTIONS & EXPAND */}
                        <div className="col-span-2 flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => openProfileEditor(item.remName, e)}
                            className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-200 hover:bg-slate-55 shadow-sm cursor-pointer hover:scale-105 transition-transform user-btn"
                            title="Editar Perfil"
                          >
                            <Users size={14} className="text-slate-650" />
                          </button>
                          <button
                            onClick={() => toggleExpandUser(item.remName)}
                            className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-200 hover:bg-slate-55 shadow-sm cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </button>
                        </div>
                      </div>

                      {/* DETAILED ACCORDION INFO PANEL */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 font-sans text-xs text-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                          {/* Col 1: Status Breakdown */}
                          <div className="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                            <h5 className="font-extrabold text-[8px] text-slate-400 uppercase tracking-widest mb-1">Estatus de Equipos</h5>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="flex flex-col bg-orange-50 border border-orange-100 p-2 rounded-lg text-center">
                                <span className="font-mono text-xs font-black text-orange-700">{item.activeCount}</span>
                                <span className="font-bold text-orange-600 uppercase text-[8px] mt-0.5">En Proceso</span>
                              </div>
                              <div className="flex flex-col bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center">
                                <span className="font-mono text-xs font-black text-emerald-700">{item.availableCount}</span>
                                <span className="font-bold text-emerald-600 uppercase text-[8px] mt-0.5">Disponibles</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Operadoras Distribution */}
                          <div className="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                            <h5 className="font-extrabold text-[8px] text-slate-400 uppercase tracking-widest mb-1">Distribución de Operadoras</h5>
                            {Object.keys(item.operadoras).length === 0 ? (
                              <p className="text-[10px] text-slate-400 font-semibold uppercase italic py-2">Sin SIMs registradas</p>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                {Object.entries(item.operadoras).map(([op, count]) => {
                                  const pct = Math.round(((count as number) / item.total) * 100);
                                  return (
                                    <div key={op} className="flex flex-col gap-1 text-[10px]">
                                      <div className="flex justify-between items-center font-bold text-slate-755">
                                        <span>{op}</span>
                                        <span>{count} ({pct}%)</span>
                                      </div>
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${
                                            op === 'MOVISTAR' ? 'bg-blue-500' :
                                            op === 'DIGITEL' ? 'bg-orange-500' :
                                            'bg-red-500'
                                          }`} 
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Col 3: Timing and Quick Info */}
                          <div className="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm justify-between">
                            <div>
                              <h5 className="font-extrabold text-[8px] text-slate-400 uppercase tracking-widest mb-1">Última Actividad</h5>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-850 mt-2">
                                <Calendar size={13} className="text-slate-400" />
                                <span>{item.lastArrivalDate ? item.lastArrivalDate.split('-').reverse().join('/') : 'Sin fecha'}</span>
                              </div>
                            </div>
                            
                            <div className="border-t border-slate-100 pt-2.5 mt-2 flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-400">Total ingresos:</span>
                              <span className="font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{item.total}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
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
      )}

      {activeTab !== 'ranking' && totalPages > 1 && (
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
