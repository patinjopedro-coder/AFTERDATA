import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { POSItem, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { copyToClipboard, downloadBlob, safeSplit } from '../utils';
import { 
  BarChart3, Calendar, FileDown, Search, 
  Layers, Cpu, Smartphone, CardSim, Users, Compass, Check,
  Lock, Unlock, Send
} from 'lucide-react';

const DEPARTMENT_COLORS = [
  '#0d9488', // Teal
  '#0ea5e9', // Cerulean
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#14b8a6', // Turquoise
  '#64748b'  // Slate
];

const MaleAvatar: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    {/* Dark navy circular background */}
    <circle cx="50" cy="50" r="48" fill="#1e293b" />
    <g>
      {/* Outer Golden Outline (Executive Side-Part Hair Outline) */}
      <path 
        d="M 50 12 C 37 12 30 18 30 30 C 30 34 29 38 29 42 C 29 46 32 48 33 50 C 37 55 42 58 50 58 C 58 58 63 55 67 50 C 68 48 71 46 71 42 C 71 38 70 34 70 30 C 70 18 63 12 50 12 Z M 16 75 C 16 65 30 55 50 55 C 70 55 84 65 84 75"
        fill="none" 
        stroke="#fbbf24" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Suit Jacket Body */}
      <path d="M 16 85 C 16 64 30 54 50 54 C 70 54 84 64 84 85 Z" fill="#2b384e" stroke="#fbbf24" strokeWidth="2" />
      {/* Dark Suit Collar & Shirt V */}
      <path d="M 40 54 L 50 72 L 60 54 Z" fill="#1e293b" />
      <path d="M 44 54 L 50 66 L 56 54 Z" fill="#2b384e" />
      {/* Dark Tie */}
      <path d="M 48 60 L 52 60 L 53 84 L 50 86 L 47 84 Z" fill="#131b2a" />
      {/* Neck */}
      <path d="M 41 46 C 41 52 44 56 50 56 C 56 56 59 52 59 46 Z" fill="#e0957b" />
      <path d="M 41 50 C 44 54 50 56 50 56 C 50 56 56 54 59 50 Z" fill="#c77b63" />
      {/* Face Base */}
      <path d="M 35 34 C 35 46 41 52 50 52 C 59 52 65 46 65 34 C 65 24 59 20 50 20 C 41 20 35 24 35 34 Z" fill="#f8a991" />
      {/* Ears */}
      <circle cx="34" cy="36" r="3" fill="#f8a991" />
      <circle cx="66" cy="36" r="3" fill="#f8a991" />

      {/* FORMAL EXECUTIVE SIDE-PART HAIR CUT (CABELLO FORMAL CON PARTIDO LATERAL) */}
      {/* Base Black Hair Mass */}
      <path d="M 30 32 C 30 18 38 12 50 12 C 62 12 70 18 70 32 C 70 40 68 44 68 44 C 65 36 60 26 50 26 C 40 26 35 36 32 44 C 32 44 30 40 30 32 Z" fill="#0f172a" />
      {/* Main Swept Top Hair Volume (Peinado Formal Hacia un Lado) */}
      <path d="M 32 26 C 36 15 48 14 66 18 C 69 22 69 28 68 31 C 61 24 50 23 38 27 Z" fill="#1e293b" />
      {/* Side Parting Line / Línea de Partido Lateral Pulcra */}
      <path d="M 36 21 C 42 16 54 15 67 19 L 66 21 C 53 17 42 18 36 23 Z" fill="#fbbf24" opacity="0.9" />
      {/* Front Wave Bang (Onda Ejecutiva) */}
      <path d="M 38 27 C 46 22 56 22 66 26 C 61 29 52 28 42 31 Z" fill="#334155" />
      {/* Neat Sideburns */}
      <path d="M 30 32 L 30 40 L 33 38 L 33 32 Z" fill="#0f172a" />
      <path d="M 70 32 L 70 40 L 67 38 L 67 32 Z" fill="#0f172a" />
    </g>
  </svg>
);

const FemaleAvatar: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    {/* Dark navy circular background */}
    <circle cx="50" cy="50" r="48" fill="#1e293b" />
    <g>
      {/* Outer Golden Outline for Female Avatar */}
      <path 
        d="M 50 12 C 37 12 31 24 31 44 C 31 66 33 78 33 78 M 50 12 C 63 12 69 24 69 44 C 69 66 67 78 67 78 M 20 80 C 20 66 30 55 50 55 C 70 55 80 66 80 80"
        fill="none" 
        stroke="#fbbf24" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Long Sleek Blonde Hair Backing */}
      <path d="M 31 36 C 31 20 38 12 50 12 C 62 12 69 20 69 36 C 69 62 67 78 67 78 L 33 78 C 33 78 31 62 31 36 Z" fill="#eab308" />
      {/* Dark Navy Shirt / Blazer Body */}
      <path d="M 20 85 C 20 64 30 54 50 54 C 70 54 80 64 80 85 Z" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
      {/* Dark Navy Collar / Shirt V */}
      <path d="M 40 54 L 50 72 L 60 54 Z" fill="#1e293b" />
      {/* White Tie */}
      <path d="M 48 58 L 52 58 L 53 82 L 50 85 L 47 82 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
      {/* Neck Base */}
      <path d="M 43 44 C 43 52 44 56 50 56 C 56 56 57 52 57 44 Z" fill="#e0957b" />
      {/* Face Base */}
      <path d="M 39 34 C 38 46 43 52 50 52 C 57 52 62 46 61 34 C 61 24 57 20 50 20 C 43 20 39 24 39 34 Z" fill="#f8a991" />
      {/* Ears */}
      <circle cx="38" cy="36" r="2" fill="#f8a991" />
      <circle cx="62" cy="36" r="2" fill="#f8a991" />
      {/* Sleek Blonde Hair Front Strands */}
      <path d="M 50 13 C 44 13 39 20 39 34 C 39 52 34 76 34 76 C 36 72 40 60 41 42 C 42 28 47 21 50 21 C 53 21 58 28 59 42 C 60 60 64 72 66 76 C 66 76 61 52 61 34 C 61 20 56 13 50 13 Z" fill="#facc15" />
    </g>
  </svg>
);

const NeutralAvatar: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="neutral-purple-grad-stat" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#8c6f9f" />
        <stop offset="100%" stopColor="#654a7c" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#neutral-purple-grad-stat)" />
    <mask id="neutral-avatar-mask-v3-stat">
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
    </mask>
    <g mask="url(#neutral-avatar-mask-v3-stat)">
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

const renderAvatarHelper = (genero?: 'MASCULINO' | 'FEMENINO' | '', className?: string, name?: string) => {
  let g = genero;
  if (!g && name) {
    g = guessGenero(name, false);
  }
  if (g === 'MASCULINO') return <MaleAvatar className={className} />;
  if (g === 'FEMENINO') return <FemaleAvatar className={className} />;
  return <NeutralAvatar className={className} />;
};

interface EstadisticasProps {
  serials: POSItem[];
  modelosDB: Record<string, ModelConfig>;
  onUserClick: (remitente: string) => void;
  usersProfiles: Record<string, import('../types').UserProfile>;
  simCardBatches?: any[];
}

export const Estadisticas: React.FC<EstadisticasProps> = ({
  serials: rawSerials,
  modelosDB,
  onUserClick,
  usersProfiles,
  simCardBatches = []
}) => {
  const serials = useMemo(() => {
    return rawSerials.map(s => {
      if (s.isCasillero && s.status === 'RECUPERADO') {
        return { ...s, isCasillero: false };
      }
      return s;
    });
  }, [rawSerials]);
  const [modalType, setModalType] = useState<'total' | 'disponibles' | 'entregados' | 'android' | 'linux' | 'manual_cruce' | 'zoom' | 'cliente' | 'colaborador' | 'modeloFisico' | 'modeloNegocio' | 'departamento' | 'casillero_completados' | 'casillero_incompletados' | 'casillero_recuperados' | 'casillero_otros' | null>(null);
  const [modalSelectedName, setModalSelectedName] = useState<string | null>(null);
  const [modalDateDesde, setModalDateDesde] = useState('');
  const [modalDateHasta, setModalDateHasta] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [periodModalConfig, setPeriodModalConfig] = useState<{
    period: 'hoy' | 'semana' | 'quincena' | 'mes' | 'trimestre' | 'anual';
    statusGroup: 'entregados' | 'disponibles' | 'total';
  } | null>(null);

  const [exportCasilleroFilter, setExportCasilleroFilter] = useState<'all' | 'no-casillero' | 'only-casillero'>('all');

  const [showSimsModal, setShowSimsModal] = useState(false);
  const [simsSearchQuery, setSimsSearchQuery] = useState('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const [showAllClientesModal, setShowAllClientesModal] = useState(false);
  const [showAllColaboradoresModal, setShowAllColaboradoresModal] = useState(false);
  const [showModelDatesModal, setShowModelDatesModal] = useState(false);
  const [showBizModelDatesModal, setShowBizModelDatesModal] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [bizModelSearchQuery, setBizModelSearchQuery] = useState('');
  const [clientesSearchQuery, setClientesSearchQuery] = useState('');
  const [colaboradoresSearchQuery, setColaboradoresSearchQuery] = useState('');
  const [detailSelectedDate, setDetailSelectedDate] = useState<string | null>(null);

  const [activeStatsTab, setActiveStatsTab] = useState<'total' | 'disponibles' | 'entregados' | 'android' | 'linux' | 'simcards'>('total');
  const [statsSearch, setStatsSearch] = useState('');
  const [statsDateDesde, setStatsDateDesde] = useState('');
  const [statsDateHasta, setStatsDateHasta] = useState('');
  const [statsCurrentPage, setStatsCurrentPage] = useState(1);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);

  const closeAllModals = () => {
    setModalType(null);
    setModalSelectedName(null);
    setPeriodModalConfig(null);
    setShowSimsModal(false);
    setShowAllClientesModal(false);
    setShowAllColaboradoresModal(false);
    setShowModelDatesModal(false);
    setShowBizModelDatesModal(false);
    setModalDateDesde('');
    setModalDateHasta('');
    setDetailSelectedDate(null);
    setModalCurrentPage(1);
  };

  const renderDateRangeFilter = () => (
    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 border border-slate-200 text-xs font-arial flex-shrink-0" style={{ borderRadius: '0px' }}>
      <div className="flex items-center gap-1.5 text-slate-700 font-bold shrink-0">
        <Calendar size={14} className="text-teal-600" />
        <span>Filtrar por Fechas:</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500 font-bold uppercase font-mono text-[9px]">Desde</span>
        <input
          type="date"
          value={modalDateDesde}
          onChange={e => setModalDateDesde(e.target.value)}
          className="p-1.5 bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-slate-500 font-bold text-xs"
          style={{ borderRadius: '0px' }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500 font-bold uppercase font-mono text-[9px]">Hasta</span>
        <input
          type="date"
          value={modalDateHasta}
          onChange={e => setModalDateHasta(e.target.value)}
          className="p-1.5 bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-slate-500 font-bold text-xs"
          style={{ borderRadius: '0px' }}
        />
      </div>
      {(modalDateDesde || modalDateHasta) && (
        <button
          onClick={() => { setModalDateDesde(''); setModalDateHasta(''); }}
          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold border border-red-200 cursor-pointer text-[10px] uppercase font-mono"
          style={{ borderRadius: '0px' }}
        >
          Limpiar
        </button>
      )}
    </div>
  );

  // Handle ESC key press locally to close all modal overlays in Estadisticas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toLocalISOString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getSemanaRange = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);
    return { inicio: toLocalISOString(lunes), fin: toLocalISOString(viernes) };
  };

  const getQuincenaRange = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    const inicio = toLocalISOString(new Date(año, mes, 1));
    let fin;
    if (dia <= 15) {
      fin = toLocalISOString(new Date(año, mes, 15));
    } else {
      const inicioQ2 = toLocalISOString(new Date(año, mes, 16));
      const finQ2 = toLocalISOString(new Date(año, mes + 1, 0));
      return { inicio: inicioQ2, fin: finQ2 };
    }
    return { inicio, fin };
  };

  const getMesRange = () => {
    const hoy = new Date();
    const inicio = toLocalISOString(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const fin = toLocalISOString(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
    return { inicio, fin };
  };

  const getTrimestreRange = () => {
    const hoy = new Date();
    const trimestre = Math.floor(hoy.getMonth() / 3);
    const inicio = toLocalISOString(new Date(hoy.getFullYear(), trimestre * 3, 1));
    const fin = toLocalISOString(new Date(hoy.getFullYear(), trimestre * 3 + 3, 0));
    return { inicio, fin };
  };

  const getAnualRange = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const inicio = toLocalISOString(new Date(año, 0, 1));
    const fin = toLocalISOString(new Date(año, 11, 31));
    return { inicio, fin };
  };

  const getSemestreRange = () => {
    const hoy = new Date();
    const mes = hoy.getMonth();
    const año = hoy.getFullYear();
    const inicio = mes < 6 ? toLocalISOString(new Date(año, 0, 1)) : toLocalISOString(new Date(año, 6, 1));
    const fin = mes < 6 ? toLocalISOString(new Date(año, 5, 30)) : toLocalISOString(new Date(año, 11, 31));
    return { inicio, fin };
  };

  const currentTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const contarPeriodo = (period: 'hoy' | 'semana' | 'quincena' | 'mes' | 'trimestre' | 'anual', statusGroup: 'entregados' | 'disponibles' | 'total') => {
    const hoyStr = currentTodayStr();
    let range = { inicio: hoyStr, fin: hoyStr };

    switch (period) {
      case 'hoy': range = { inicio: hoyStr, fin: hoyStr }; break;
      case 'semana': range = getSemanaRange(); break;
      case 'quincena': range = getQuincenaRange(); break;
      case 'mes': range = getMesRange(); break;
      case 'trimestre': range = getTrimestreRange(); break;
      case 'anual': range = getAnualRange(); break;
    }

    return serials.filter(s => {
      if (s.date < range.inicio || s.date > range.fin) return false;

      // Filter by casillero option
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;

      const st = (s.status || '').toUpperCase().trim();
      if (statusGroup === 'entregados') return ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'ENTREGADO'].includes(st);
      if (statusGroup === 'disponibles') return ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes(st);
      return true;
    }).length;
  };

  const obtenerPeriodoItems = (period: 'hoy' | 'semana' | 'quincena' | 'mes' | 'trimestre' | 'anual', statusGroup: 'entregados' | 'disponibles' | 'total') => {
    const hoyStr = currentTodayStr();
    let range = { inicio: hoyStr, fin: hoyStr };

    switch (period) {
      case 'hoy': range = { inicio: hoyStr, fin: hoyStr }; break;
      case 'semana': range = getSemanaRange(); break;
      case 'quincena': range = getQuincenaRange(); break;
      case 'mes': range = getMesRange(); break;
      case 'trimestre': range = getTrimestreRange(); break;
      case 'anual': range = getAnualRange(); break;
    }

    return serials
      .filter(s => {
        if (s.date < range.inicio || s.date > range.fin) return false;

        // Filter by casillero option
        if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
        if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;

        const st = (s.status || '').toUpperCase().trim();
        if (statusGroup === 'entregados') return ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'ENTREGADO'].includes(st);
        if (statusGroup === 'disponibles') return ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes(st);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const downloadCSV = (csvStr: string, name: string) => {
    const blob = new Blob(["\uFEFF" + csvStr], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, name);
  };

  const handleExportPeriod = (period: 'hoy' | 'semana' | 'quincena' | 'mes' | 'trimestre' | 'anual', statusGroup: 'entregados' | 'disponibles' | 'total') => {
    const hoyStr = currentTodayStr();
    let range = { inicio: hoyStr, fin: hoyStr };

    switch (period) {
      case 'hoy': range = { inicio: hoyStr, fin: hoyStr }; break;
      case 'semana': range = getSemanaRange(); break;
      case 'quincena': range = getQuincenaRange(); break;
      case 'mes': range = getMesRange(); break;
      case 'trimestre': range = getTrimestreRange(); break;
      case 'anual': range = getAnualRange(); break;
    }

    const items = serials.filter(s => {
      if (s.date < range.inicio || s.date > range.fin) return false;

      // Filter by casillero option
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;

      const st = (s.status || '').toUpperCase().trim();
      if (statusGroup === 'entregados') return ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'ENTREGADO'].includes(st);
      if (statusGroup === 'disponibles') return ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes(st);
      return true;
    });

    if (items.length === 0) {
      alert('Sin datos en este rango.');
      return;
    }

    const header = "sep=;\nMODELO;SERIAL;STATUS\n";
    const rows = items.map(s => {
      const m = getTerminalModel(s.serial, modelosDB);
      return `"${m.modelo || 'DESCONOCIDO'}";"${String(s.serial).replace(/"/g, '""')}";"${String(s.status || '').replace(/"/g, '""')}"`;
    });
    const csvContent = header + rows.join("\n");

    const filterSuffix = exportCasilleroFilter === 'no-casillero' ? '_sin_casillero' : exportCasilleroFilter === 'only-casillero' ? '_solo_casillero' : '';
    downloadCSV(csvContent, `informe_${statusGroup}_${period}_${hoyStr}${filterSuffix}.csv`);
    alert(`Exportado ${items.length} registros correspondientes al período.`);
  };

  // Master Stat Counters
  const totalCount = useMemo(() => {
    return serials.filter(s => {
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
      return true;
    }).length;
  }, [serials, exportCasilleroFilter]);

  const disponiblesCount = useMemo(() => {
    return serials.filter(s => {
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
      return ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes((s.status || '').toUpperCase().trim());
    }).length;
  }, [serials, exportCasilleroFilter]);

  const entregadosCount = useMemo(() => {
    return serials.filter(s => {
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
      return ['ENTREGADO', 'ACTIVO', 'SUSPENDIDO', 'PENDIENTE'].includes((s.status || '').toUpperCase().trim());
    }).length;
  }, [serials, exportCasilleroFilter]);

  const androidCount = useMemo(() => {
    return serials.filter(s => {
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
      const modelInfo = getTerminalModel(s.serial, modelosDB);
      return modelInfo.so === 'ANDROID';
    }).length;
  }, [serials, modelosDB, exportCasilleroFilter]);

  const linuxCount = useMemo(() => {
    return serials.filter(s => {
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
      const modelInfo = getTerminalModel(s.serial, modelosDB);
      return modelInfo.so === 'LINUX';
    }).length;
  }, [serials, modelosDB, exportCasilleroFilter]);

  // Intake Channel Metrics (manual_cruce vs zoom)
  const intakeStats = useMemo(() => {
    let manualCruceTot = 0;
    let manualCruceDisp = 0;
    let manualCruceEnt = 0;

    let zoomTot = 0;
    let zoomDisp = 0;
    let zoomEnt = 0;

    serials.forEach(s => {
      // Filter by casillero option
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return;

      const st = (s.status || '').toUpperCase().trim();
      const isDisp = ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes(st);
      const isEnt = ['ENTREGADO', 'ACTIVO', 'SUSPENDIDO', 'PENDIENTE'].includes(st);

      const isClient = !!(s.rif || s.razonSocial);

      if (isClient) {
        zoomTot++;
        if (isDisp) zoomDisp++;
        if (isEnt) zoomEnt++;
      } else {
        manualCruceTot++;
        if (isDisp) manualCruceDisp++;
        if (isEnt) manualCruceEnt++;
      }
    });

    return {
      manual_cruce: { total: manualCruceTot, disponibles: manualCruceDisp, entregados: manualCruceEnt },
      zoom: { total: zoomTot, disponibles: zoomDisp, entregados: zoomEnt }
    };
  }, [serials, exportCasilleroFilter]);

  // Stats by User / Remitente for periods, split by Clientes vs Colaboradores
  const resolvedUsersDeliveryStats = useMemo(() => {
    const statsMap = new Map<string, {
      name: string;
      dia: number;
      semana: number;
      mes: number;
      trimestre: number;
      semestre: number;
      año: number;
      total: number;
      isCliente: boolean;
    }>();

    const hoyStr = currentTodayStr();
    const sem = getSemanaRange();
    const mRange = getMesRange();
    const trim = getTrimestreRange();
    const semest = getSemestreRange();
    const yr = getAnualRange();

    // To avoid filtering serials repeatedly for each user, we can do a single pass or map
    const userSerialsMap = new Map<string, POSItem[]>();
    serials.forEach(s => {
      if (!s.remitente) return;
      const name = s.remitente.toUpperCase().trim();
      if (!userSerialsMap.has(name)) {
        userSerialsMap.set(name, []);
      }
      userSerialsMap.get(name)!.push(s);
    });

    userSerialsMap.forEach((userSerials, name) => {
      // Filter by casillero option
      const filteredSerialsForStats = userSerials.filter(s => {
        if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
        if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
        return true;
      });

      if (filteredSerialsForStats.length === 0) return;

      const p = usersProfiles[name];
      const hasProfile = !!p;
      const isCliente = p ? !!p.isCliente : false;
      const fallbackRif = userSerials.find(s => s.rif)?.rif || '';
      const fallbackRazonSocial = userSerials.find(s => s.razonSocial)?.razonSocial || '';
      const isClienteBySerials = !!(fallbackRif || fallbackRazonSocial || userSerials.some(s => s.isCasillero));
      const showCliente = hasProfile ? isCliente : isClienteBySerials;

      const stat = {
        name,
        dia: 0,
        semana: 0,
        mes: 0,
        trimestre: 0,
        semestre: 0,
        año: 0,
        total: 0,
        isCliente: showCliente
      };

      filteredSerialsForStats.forEach(s => {
        stat.total++;
        if (s.date === hoyStr) stat.dia++;
        if (s.date >= sem.inicio && s.date <= sem.fin) stat.semana++;
        if (s.date >= mRange.inicio && s.date <= mRange.fin) stat.mes++;
        if (s.date >= trim.inicio && s.date <= trim.fin) stat.trimestre++;
        if (s.date >= semest.inicio && s.date <= semest.fin) stat.semestre++;
        if (s.date >= yr.inicio && s.date <= yr.fin) stat.año++;
      });

      statsMap.set(name, stat);
    });

    const allStats = Array.from(statsMap.values());
    const clientesStats = allStats.filter(s => s.isCliente).sort((a, b) => b.total - a.total);
    const colaboradoresStats = allStats.filter(s => !s.isCliente).sort((a, b) => b.total - a.total);

    return {
      clientes: clientesStats,
      colaboradores: colaboradoresStats
    };
  }, [serials, usersProfiles, exportCasilleroFilter]);

  const resolvedFilteredUsersDeliveryStats = useMemo(() => {
    const statsMap = new Map<string, {
      name: string;
      dia: number;
      semana: number;
      mes: number;
      trimestre: number;
      semestre: number;
      año: number;
      total: number;
      isCliente: boolean;
    }>();

    const hoyStr = currentTodayStr();
    const sem = getSemanaRange();
    const mRange = getMesRange();
    const trim = getTrimestreRange();
    const semest = getSemestreRange();
    const yr = getAnualRange();

    let filteredSerials = serials;
    if (modalDateDesde) {
      filteredSerials = filteredSerials.filter(s => s.date >= modalDateDesde);
    }
    if (modalDateHasta) {
      filteredSerials = filteredSerials.filter(s => s.date <= modalDateHasta);
    }

    const userSerialsMap = new Map<string, POSItem[]>();
    filteredSerials.forEach(s => {
      if (!s.remitente) return;
      const name = s.remitente.toUpperCase().trim();
      if (!userSerialsMap.has(name)) {
        userSerialsMap.set(name, []);
      }
      userSerialsMap.get(name)!.push(s);
    });

    userSerialsMap.forEach((userSerials, name) => {
      const filteredSerialsForStats = userSerials.filter(s => {
        if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
        if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
        return true;
      });

      if (filteredSerialsForStats.length === 0) return;

      const p = usersProfiles[name];
      const hasProfile = !!p;
      const isCliente = p ? !!p.isCliente : false;
      const fallbackRif = userSerials.find(s => s.rif)?.rif || '';
      const fallbackRazonSocial = userSerials.find(s => s.razonSocial)?.razonSocial || '';
      const isClienteBySerials = !!(fallbackRif || fallbackRazonSocial || userSerials.some(s => s.isCasillero));
      const showCliente = hasProfile ? isCliente : isClienteBySerials;

      const stat = {
        name,
        dia: 0,
        semana: 0,
        mes: 0,
        trimestre: 0,
        semestre: 0,
        año: 0,
        total: 0,
        isCliente: showCliente
      };

      filteredSerialsForStats.forEach(s => {
        stat.total++;
        if (s.date === hoyStr) stat.dia++;
        if (s.date >= sem.inicio && s.date <= sem.fin) stat.semana++;
        if (s.date >= mRange.inicio && s.date <= mRange.fin) stat.mes++;
        if (s.date >= trim.inicio && s.date <= trim.fin) stat.trimestre++;
        if (s.date >= semest.inicio && s.date <= semest.fin) stat.semestre++;
        if (s.date >= yr.inicio && s.date <= yr.fin) stat.año++;
      });

      statsMap.set(name, stat);
    });

    const allStats = Array.from(statsMap.values());
    const clientesStats = allStats.filter(s => s.isCliente).sort((a, b) => b.total - a.total);
    const colaboradoresStats = allStats.filter(s => !s.isCliente).sort((a, b) => b.total - a.total);

    return {
      clientes: clientesStats,
      colaboradores: colaboradoresStats
    };
  }, [serials, usersProfiles, exportCasilleroFilter, modalDateDesde, modalDateHasta]);

  const top5Clientes = useMemo(() => {
    return resolvedUsersDeliveryStats.clientes.slice(0, 5);
  }, [resolvedUsersDeliveryStats.clientes]);

  const top5Colaboradores = useMemo(() => {
    return resolvedUsersDeliveryStats.colaboradores.slice(0, 5);
  }, [resolvedUsersDeliveryStats.colaboradores]);

  // Physical models arrivals sorted by date
  const physicalModelsArrivals = useMemo(() => {
    return serials
      .filter(s => {
        if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
        if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
        return true;
      })
      .map(s => {
        const mInfo = getTerminalModel(s.serial, modelosDB);
        return {
          ...s,
          modeloName: mInfo.modelo,
          so: mInfo.so
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [serials, modelosDB, exportCasilleroFilter]);

  // Business models arrivals sorted by date
  const bizModelsArrivals = useMemo(() => {
    return serials
      .filter(s => {
        if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
        if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;
        return true;
      })
      .map(s => {
        return {
          ...s,
          bizModelName: s.modeloNegocio || 'SIN ASIGNAR'
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [serials, exportCasilleroFilter]);

  // Casillero metrics counts
  const casilleroMetrics = useMemo(() => {
    const completadas = rawSerials.filter(s => s.isCasillero && s.status !== 'RECUPERADO' && s.esSustitucion && s.serialSustituto && s.fechaSalida).length;
    const incompletas = rawSerials.filter(s => s.isCasillero && s.status !== 'RECUPERADO' && s.esSustitucion && (!s.serialSustituto || !s.fechaSalida)).length;
    const recuperados = rawSerials.filter(s => s.isCasillero && s.status === 'RECUPERADO').length;
    const otros = rawSerials.filter(s => s.isCasillero && s.status !== 'RECUPERADO' && !s.esSustitucion).length;
    
    return [
      { key: 'casillero_completados', label: 'SUSTITUCIONES COMPLETADAS', count: completadas, color: '#10b981' },
      { key: 'casillero_incompletados', label: 'SUSTITUCIONES INCOMPLETAS', count: incompletas, color: '#f59e0b' },
      { key: 'casillero_recuperados', label: 'EQUIPOS RECUPERADOS', count: recuperados, color: '#3b82f6' },
      { key: 'casillero_otros', label: 'OTROS EN CASILLERO', count: otros, color: '#64748b' }
    ] as const;
  }, [rawSerials]);

  const totalCasilleroCount = useMemo(() => {
    return rawSerials.filter(s => s.isCasillero).length;
  }, [rawSerials]);

  // Historical SIM cards calculations
  const posSims = serials
    .filter(s => s.simNumber && s.simNumber.trim() !== '')
    .map(s => ({
      id: `pos_sim_${s.id}`,
      serial: s.simNumber,
      source: `POS: ${s.serial}`,
      status: s.status || 'SIN ESTATUS',
      date: s.date
    }));

  const annulledSims = (simCardBatches || []).flatMap(b => 
    (b.serials || []).map((s: string, idx: number) => ({
      id: `ann_sim_${b.id}_${idx}`,
      serial: s,
      source: `Lote: ${b.title}`,
      status: 'ANULADA',
      date: b.date
    }))
  );

  const allSimsList = annulledSims;
  const totalSimCards = allSimsList.length;

  const getStatsFilteredList = () => {
    if (activeStatsTab === 'simcards') {
      const query = statsSearch.toUpperCase().trim();
      let filteredSims = allSimsList.filter(s => 
        s.serial.toUpperCase().includes(query) || 
        s.source.toUpperCase().includes(query)
      );
      if (statsDateDesde) {
        filteredSims = filteredSims.filter(s => s.date >= statsDateDesde);
      }
      if (statsDateHasta) {
        filteredSims = filteredSims.filter(s => s.date <= statsDateHasta);
      }
      return filteredSims;
    }

    let list = serials;
    if (exportCasilleroFilter === 'no-casillero') {
      list = list.filter(s => !s.isCasillero);
    } else if (exportCasilleroFilter === 'only-casillero') {
      list = list.filter(s => s.isCasillero);
    }

    if (activeStatsTab === 'disponibles') {
      list = list.filter(s => ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes((s.status || '').toUpperCase().trim()));
    } else if (activeStatsTab === 'entregados') {
      list = list.filter(s => ['ENTREGADO', 'ACTIVO', 'SUSPENDIDO', 'PENDIENTE'].includes((s.status || '').toUpperCase().trim()));
    } else if (activeStatsTab === 'android') {
      list = list.filter(s => {
        const modelInfo = getTerminalModel(s.serial, modelosDB);
        return modelInfo.so === 'ANDROID';
      });
    } else if (activeStatsTab === 'linux') {
      list = list.filter(s => {
        const modelInfo = getTerminalModel(s.serial, modelosDB);
        return modelInfo.so === 'LINUX';
      });
    }

    if (statsDateDesde) {
      list = list.filter(s => s.date >= statsDateDesde);
    }
    if (statsDateHasta) {
      list = list.filter(s => s.date <= statsDateHasta);
    }

    if (statsSearch) {
      const lowS = statsSearch.toLowerCase();
      list = list.filter(o => 
        o.serial.toLowerCase().includes(lowS) || 
        o.remitente.toLowerCase().includes(lowS) ||
        (o.rif && o.rif.toLowerCase().includes(lowS)) ||
        (o.razonSocial && o.razonSocial.toLowerCase().includes(lowS))
      );
    }
    return list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const statsList = useMemo(() => {
    return getStatsFilteredList();
  }, [serials, activeStatsTab, statsSearch, statsDateDesde, statsDateHasta, exportCasilleroFilter, modelosDB]);

  // Modal dataset filter
  const getModalItems = () => {
    let list = serials;
    if (exportCasilleroFilter === 'no-casillero') {
      list = list.filter(s => !s.isCasillero);
    } else if (exportCasilleroFilter === 'only-casillero') {
      list = list.filter(s => s.isCasillero);
    }

    if (modalType === 'disponibles') {
      list = list.filter(s => ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes((s.status || '').toUpperCase().trim()));
    } else if (modalType === 'entregados') {
      list = list.filter(s => ['ENTREGADO', 'ACTIVO', 'SUSPENDIDO', 'PENDIENTE'].includes((s.status || '').toUpperCase().trim()));
    } else if (modalType === 'android') {
      list = list.filter(s => {
        const modelInfo = getTerminalModel(s.serial, modelosDB);
        return modelInfo.so === 'ANDROID';
      });
    } else if (modalType === 'linux') {
      list = list.filter(s => {
        const modelInfo = getTerminalModel(s.serial, modelosDB);
        return modelInfo.so === 'LINUX';
      });
    } else if (modalType === 'manual_cruce') {
      list = list.filter(s => !(s.rif || s.razonSocial));
    } else if (modalType === 'zoom') {
      list = list.filter(s => !!(s.rif || s.razonSocial));
    } else if (modalType === 'cliente' || modalType === 'colaborador') {
      list = list.filter(s => s.remitente && s.remitente.toUpperCase().trim() === modalSelectedName?.toUpperCase().trim());
    } else if (modalType === 'modeloFisico') {
      list = list.filter(s => {
        const modelInfo = getTerminalModel(s.serial, modelosDB);
        const name = modelInfo.modelo || 'DESCONOCIDO';
        return name === modalSelectedName;
      });
    } else if (modalType === 'modeloNegocio') {
      list = list.filter(s => {
        if (modalSelectedName === 'SIN ASIGNAR') return !s.modeloNegocio;
        const bizModelStr = s.modeloNegocio?.toUpperCase().trim() || '';
        const modalBizModelStr = modalSelectedName?.toUpperCase().trim() || '';
        if (modalBizModelStr === 'BÁSICO' || modalBizModelStr === 'BASICO') return bizModelStr === 'BASICO' || bizModelStr === 'BÁSICO';
        return bizModelStr === modalBizModelStr;
      });
    } else if (modalType === 'departamento') {
      list = list.filter(s => {
        if (!s.remitente) return false;
        const remKey = s.remitente.toUpperCase().trim();
        const p = usersProfiles[remKey];
        return p && p.isUsuario && p.area && p.area.toUpperCase().trim() === modalSelectedName?.toUpperCase().trim();
      });
    } else if (modalType === 'casillero_completados') {
      list = rawSerials.filter(s => s.isCasillero && s.status !== 'RECUPERADO' && s.esSustitucion && s.serialSustituto && s.fechaSalida);
    } else if (modalType === 'casillero_incompletados') {
      list = rawSerials.filter(s => s.isCasillero && s.status !== 'RECUPERADO' && s.esSustitucion && (!s.serialSustituto || !s.fechaSalida));
    } else if (modalType === 'casillero_recuperados') {
      list = rawSerials.filter(s => s.isCasillero && s.status === 'RECUPERADO');
    } else if (modalType === 'casillero_otros') {
      list = rawSerials.filter(s => s.isCasillero && s.status !== 'RECUPERADO' && !s.esSustitucion);
    }

    if (modalDateDesde) {
      list = list.filter(s => s.date >= modalDateDesde);
    }
    if (modalDateHasta) {
      list = list.filter(s => s.date <= modalDateHasta);
    }

    if (modalSearch) {
      const lowS = modalSearch.toLowerCase();
      list = list.filter(o => 
        o.serial.toLowerCase().includes(lowS) || 
        o.remitente.toLowerCase().includes(lowS) ||
        (o.rif && o.rif.toLowerCase().includes(lowS)) ||
        (o.razonSocial && o.razonSocial.toLowerCase().includes(lowS))
      );
    }
    return list;
  };

  const modalList = useMemo(() => {
    return getModalItems().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [serials, modalType, modalSearch, modelosDB, exportCasilleroFilter, modalDateDesde, modalDateHasta, modalSelectedName]);

  const exportModalDataToCSV = () => {
    if (!modalList || modalList.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const { headers } = getPOSItemFields(modalList[0], modalType || '');
    const header = "sep=;\n" + headers.join(";") + "\n";
    const rows = modalList.map(s => {
      const { values } = getPOSItemFields(s, modalType || '');
      return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";");
    });
    const csvContent = header + rows.join("\n");
    downloadCSV(csvContent, `Exportacion_${modalType}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportSims = () => {
    const query = simsSearchQuery.toUpperCase().trim();
    let filteredSims = allSimsList.filter(s => 
      s.serial.toUpperCase().includes(query) || 
      s.source.toUpperCase().includes(query)
    );

    if (modalDateDesde) {
      filteredSims = filteredSims.filter(s => s.date >= modalDateDesde);
    }
    if (modalDateHasta) {
      filteredSims = filteredSims.filter(s => s.date <= modalDateHasta);
    }

    if (filteredSims.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const header = "sep=;\nSERIAL SIM;LOTE;ESTADO\n";
    const rows = filteredSims.map(s => [
      s.serial || '',
      s.source || '',
      s.status || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
    const csvContent = header + rows.join("\n");
    downloadCSV(csvContent, `Exportacion_SIM_Cards_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Unified General list at the bottom
  const sortedAll = useMemo(() => {
    let list = [...serials];
    if (exportCasilleroFilter === 'no-casillero') {
      list = list.filter(s => !s.isCasillero);
    } else if (exportCasilleroFilter === 'only-casillero') {
      list = list.filter(s => s.isCasillero);
    }
    return list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [serials, exportCasilleroFilter]);

  const totalPages = Math.ceil(sortedAll.length / itemsPerPage) || 1;
  const paginatedAll = sortedAll.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusStyle = (status: string) => {
    const s = (status || '').toUpperCase().trim();
    if (['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes(s)) {
      return 'bg-green-600 text-white border border-green-700 font-bold';
    }
    if (['ENTREGADO', 'ACTIVO', 'SUSPENDIDO', 'PENDIENTE'].includes(s)) {
      return 'bg-orange-500 text-white border border-orange-600 font-bold';
    }
    return 'bg-black text-white border border-zinc-700 font-bold';
  };

  // Chart and Doughnut Data
  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
    const baseTotal = [45, 80, 55, 95, 60];
    const baseAndroid = [25, 48, 32, 63, 38];
    const baseLinux = [15, 22, 16, 20, 15];

    return months.map((m, i) => {
      const monthlySerials = serials.filter(s => {
        if (!s.date) return false;
        
        // Filter by casillero option
        if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return false;
        if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return false;

        const parts = safeSplit(s.date || '', '-');
        const monthNum = parts.length > 1 ? parseInt(parts[1], 10) : NaN;
        return monthNum === (i + 1);
      });

      const addTotal = monthlySerials.length;
      const addAndroid = monthlySerials.filter(s => {
        const mInfo = getTerminalModel(s.serial, modelosDB);
        return mInfo.so === 'ANDROID';
      }).length;
      const addLinux = monthlySerials.filter(s => {
        const mInfo = getTerminalModel(s.serial, modelosDB);
        return mInfo.so === 'LINUX';
      }).length;

      return {
        month: m,
        total: baseTotal[i] + addTotal,
        android: baseAndroid[i] + addAndroid,
        linux: baseLinux[i] + addLinux
      };
    });
  }, [serials, modelosDB, exportCasilleroFilter]);

  const getCurvePath = (points: {x: number, y: number}[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const maxVal = useMemo(() => {
    return Math.max(...chartData.map(d => Math.max(d.total, d.android, d.linux))) || 100;
  }, [chartData]);

  const totalPoints = useMemo(() => {
    return chartData.map((d, i) => ({
      x: 60 + i * 110,
      y: 160 - (d.total / maxVal) * 110
    }));
  }, [chartData, maxVal]);

  const androidPoints = useMemo(() => {
    return chartData.map((d, i) => ({
      x: 60 + i * 110,
      y: 160 - (d.android / maxVal) * 110
    }));
  }, [chartData, maxVal]);

  const linuxPoints = useMemo(() => {
    return chartData.map((d, i) => ({
      x: 60 + i * 110,
      y: 160 - (d.linux / maxVal) * 110
    }));
  }, [chartData, maxVal]);

  const totalDoughnut = Math.max(totalCount, 1);
  const pAndroid = Math.max(androidCount, 0) / totalDoughnut;
  const pLinux = Math.max(linuxCount, 0) / totalDoughnut;
  const pOther = Math.max(totalCount - androidCount - linuxCount, 0) / totalDoughnut;

  const circ = 226.19;
  const strokeAndroid = Math.max(pAndroid * circ, 0);
  const strokeLinux = Math.max(pLinux * circ, 0);
  const strokeOther = Math.max(pOther * circ, 0);

  const offsetAndroid = 0;
  const offsetLinux = -strokeAndroid;
  const offsetOther = -(strokeAndroid + strokeLinux);

  // Delivery by Area calculations
  const areaDeliveryStats = useMemo(() => {
    let atc = 0;
    let ventas = 0;
    let postventa = 0;
    let zoom = 0;
    let otros = 0;

    serials.forEach(s => {
      // Filter by casillero option
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return;

      const isZoom = !!(s.rif || s.razonSocial);
      if (isZoom) {
        zoom++;
      } else if (s.remitente) {
        const remKey = s.remitente.toUpperCase().trim();
        const p = usersProfiles[remKey];
        if (p && p.isUsuario && p.area) {
          const areaUp = p.area.toUpperCase().trim();
          if (areaUp === 'ATC') atc++;
          else if (areaUp === 'VENTAS') ventas++;
          else if (areaUp === 'POSTVENTA') postventa++;
          else otros++;
        } else {
          otros++;
        }
      } else {
        otros++;
      }
    });

    return { atc, ventas, postventa, zoom, otros };
  }, [serials, usersProfiles, exportCasilleroFilter]);

  const totalAreaCount = areaDeliveryStats.atc + areaDeliveryStats.ventas + areaDeliveryStats.postventa + areaDeliveryStats.zoom;
  const totalAreaDoughnut = Math.max(totalAreaCount, 1);
  const pATC = areaDeliveryStats.atc / totalAreaDoughnut;
  const pVentas = areaDeliveryStats.ventas / totalAreaDoughnut;
  const pPostventa = areaDeliveryStats.postventa / totalAreaDoughnut;
  const pZoom = areaDeliveryStats.zoom / totalAreaDoughnut;

  const strokeATC = Math.max(pATC * circ, 0);
  const strokeVentas = Math.max(pVentas * circ, 0);
  const strokePostventa = Math.max(pPostventa * circ, 0);
  const strokeZoom = Math.max(pZoom * circ, 0);

  const offsetATC = 0;
  const offsetVentas = -strokeATC;
  const offsetPostventa = -(strokeATC + strokeVentas);
  const offsetZoom = -(strokeATC + strokeVentas + strokePostventa);

  const totalStatusDoughnut = Math.max(totalCount, 1);
  const pDisponibles = Math.max(disponiblesCount, 0) / totalStatusDoughnut;
  const pEntregados = Math.max(entregadosCount, 0) / totalStatusDoughnut;
  const pOtrosStatus = Math.max(totalCount - disponiblesCount - entregadosCount, 0) / totalStatusDoughnut;

  const strokeDisponibles = Math.max(pDisponibles * circ, 0);
  const strokeEntregados = Math.max(pEntregados * circ, 0);
  const strokeOtrosStatus = Math.max(pOtrosStatus * circ, 0);

  const offsetDisponibles = 0;
  const offsetEntregados = -strokeDisponibles;
  const offsetOtrosStatus = -(strokeDisponibles + strokeEntregados);

  const renderPOSListTable = (items: any[]) => {
    return (
      <div className="overflow-x-auto border border-slate-200" style={{ borderRadius: '0px' }}>
        <table className="w-full text-left min-w-[1100px] border-collapse text-[11px] font-arial bg-white">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-250 text-[9px] text-slate-505 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-24 text-center">Fecha Entrada</th>
              <th className="py-2.5 px-3 w-80">Equipo / Ticket / Cliente</th>
              <th className="py-2.5 px-3 w-40">Accesorios</th>
              <th className="py-2.5 px-3 w-60">Observaciones</th>
              <th className="py-2.5 px-3 w-44">Sustitución</th>
              <th className="py-2.5 px-3 w-60">Liberación / Despacho</th>
              <th className="py-2.5 px-3 w-24 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {items.map(s => {
              const m = getTerminalModel(s.serial, modelosDB);
              return (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors align-top">
                  <td className="py-3 px-2.5 text-center whitespace-nowrap text-slate-700">
                    <div>{s.displayDate || s.date}</div>
                    {s.addedFromCruce && (
                      <div className="mt-1">
                        <span className="text-[8px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5" style={{ borderRadius: '0px' }}>
                          CRUCE
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 bg-white" style={{ borderRadius: '0px' }}>
                      <div className="p-1.5 flex items-center justify-between">
                        <span className="text-[9px] text-slate-450 font-bold uppercase">Serial:</span>
                        <div className="flex items-center gap-1">
                          <span 
                            className="font-mono font-bold text-slate-905 cursor-pointer select-all hover:text-slate-600"
                            onClick={() => handleCopyText(s.serial, `serial-${s.id}`)}
                          >
                            {s.serial}
                          </span>
                          {copiedKey === `serial-${s.id}` && (
                            <span className="inline-flex items-center justify-center w-3 h-3 bg-green-500 rounded-none">
                              <Check size={8} className="text-white" />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-1.5 flex items-center justify-between">
                        <span className="text-[9px] text-slate-450 font-bold uppercase">Guía:</span>
                        <span className="font-bold text-slate-800 uppercase">{s.source || 'S/N'}</span>
                      </div>
                      <div className="p-1.5 flex items-center justify-between">
                        <span className="text-[9px] text-slate-450 font-bold uppercase">Equipo:</span>
                        <span className="font-bold text-slate-805 uppercase">{m.so} - {m.modelo}</span>
                      </div>
                      {s.modeloNegocio && (
                        <div className="p-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-450 font-bold uppercase">Mod. Negocio:</span>
                          <span className="font-bold text-slate-800 uppercase">{s.modeloNegocio}</span>
                        </div>
                      )}
                      <div className="p-1.5 flex items-center justify-between">
                        <span className="text-[9px] text-slate-455 font-bold uppercase">Remitente:</span>
                        <span className="font-bold text-slate-800 uppercase truncate max-w-[130px]" title={s.remitente}>{s.remitente || 'SIN REMITENTE'}</span>
                      </div>
                      <div className="p-1.5 flex items-center justify-between">
                        <span className="text-[9px] text-slate-450 font-bold uppercase">Razón Social:</span>
                        <span className="font-bold text-slate-800 uppercase truncate max-w-[130px]" title={s.razonSocial}>{s.razonSocial || 'SIN RAZÓN SOCIAL'}</span>
                      </div>
                      {s.rif && (
                        <div className="p-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-450 font-bold uppercase">Rif:</span>
                          <span className="font-bold text-slate-800 uppercase select-all">{s.rif}</span>
                        </div>
                      )}
                      {s.ticket && (
                        <div className="p-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-450 font-bold uppercase">Ticket:</span>
                          <span className="font-bold text-slate-800 uppercase select-all">{s.ticket}</span>
                        </div>
                      )}
                      {s.banco && (
                        <div className="p-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-455 font-bold uppercase">Banco:</span>
                          <span className="font-bold text-slate-800 uppercase select-all">{s.banco}</span>
                        </div>
                      )}
                      {(s.bsf || s.usdt) && (
                        <div className="p-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-455 font-bold uppercase">Monto:</span>
                          <span className="font-bold text-slate-850 uppercase text-[10px]">
                            {s.bsf || s.usdt}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2.5">
                    <div className="flex flex-col gap-1">
                      {[
                        { label: 'FORRO', val: s.forro },
                        { label: 'BATERÍA', val: s.bateria },
                        { label: 'CARGADOR', val: s.cargador },
                        { label: 'CAJA', val: s.caja }
                      ].map(acc => (
                        <div 
                          key={acc.label}
                          className={`flex items-center justify-between text-[9px] font-bold px-2 py-0.5 border ${
                            acc.val 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                          style={{ borderRadius: '0px' }}
                        >
                          <span>{acc.label}</span>
                          {acc.val && <Check size={10} />}
                        </div>
                      ))}
                      {s.sim && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                          <span className="text-[8px] text-slate-455 font-bold uppercase">SIM INCORPORADO</span>
                          {s.simNumber && (
                            <span className="font-mono text-[9px] bg-amber-50 text-amber-805 border border-amber-200 px-1 font-bold block text-center" style={{ borderRadius: '0px' }}>
                              {s.simNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2.5">
                    <div className="flex flex-col gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase block mb-0.5">Observación / Estado Físico:</span>
                        <div className="p-1.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold uppercase" style={{ borderRadius: '0px', minHeight: '28px' }}>
                          {s.observaciones || 'NINGUNA'}
                        </div>
                      </div>
                      {s.responsable && (
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold uppercase block mb-0.5">Responsable:</span>
                          <div className="p-1 bg-slate-50 border border-slate-200 text-slate-700 font-bold uppercase" style={{ borderRadius: '0px' }}>
                            {s.responsable}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2.5">
                    {s.esSustitucion ? (
                      <div className="flex flex-col gap-1 border border-blue-200 bg-blue-50/50 p-2" style={{ borderRadius: '0px' }}>
                        <span className="text-[8px] text-blue-700 font-black uppercase">SUSTITUCIÓN ACTIVA</span>
                        {s.serialSustituto && (
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Serial Sustituto:</span>
                            <span className="font-mono font-bold text-slate-850 block select-all">{s.serialSustituto}</span>
                          </div>
                        )}
                        {s.fechaSalida && (
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Fecha Salida:</span>
                            <span className="font-bold text-slate-800 block">{s.fechaSalida}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">SIN SUSTITUCIÓN</span>
                    )}
                  </td>
                  <td className="py-3 px-2.5">
                    {(s.fechaSalidaCliente || s.guiaSalidaCliente || s.destinoSalida) ? (
                      <div className="flex flex-col gap-1 border border-slate-200 p-2 bg-slate-50/50" style={{ borderRadius: '0px' }}>
                        {s.fechaSalidaCliente && (
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Salida Cliente:</span>
                            <span className="font-bold text-slate-800 block">{s.fechaSalidaCliente}</span>
                          </div>
                        )}
                        {s.guiaSalidaCliente && (
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Guía Salida:</span>
                            <span className="font-bold text-slate-850 block uppercase select-all">{s.guiaSalidaCliente}</span>
                          </div>
                        )}
                        {s.destinoSalida && (
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Destino:</span>
                            <span className="font-bold text-slate-800 block uppercase">{s.destinoSalida}</span>
                          </div>
                        )}
                        {s.fechaConfirmada && (
                          <span className="inline-block mt-0.5 bg-green-100 text-green-800 text-[8px] font-bold px-1.5 py-0.5 w-max" style={{ borderRadius: '0px' }}>
                            SALIDA CONFIRMADA
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">SIN SALIDA</span>
                    )}
                  </td>
                  <td className="py-3 px-2.5 text-center">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider inline-block text-center ${getStatusStyle(s.status)}`} style={{ borderRadius: '0px' }}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPOSSummaryTable = (items: any[]) => {
    return (
      <div className="overflow-x-auto border border-slate-200 bg-white" style={{ borderRadius: '0px' }}>
        <table className="w-full text-left min-w-[1000px] border-collapse text-[11px] font-arial">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-250 text-[9px] text-slate-550 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-24">Fecha</th>
              <th className="py-2.5 px-3 w-40">Serial</th>
              <th className="py-2.5 px-3 w-28">Guía / Origen</th>
              <th className="py-2.5 px-3 w-40">Equipo (SO + Modelo)</th>
              <th className="py-2.5 px-3 w-32">Mod. Negocio</th>
              <th className="py-2.5 px-3 w-60">Cliente / Razón Social</th>
              <th className="py-2.5 px-3 w-28">RIF</th>
              <th className="py-2.5 px-3 w-28">Ticket / Banco</th>
              <th className="py-2.5 px-3 text-center w-28">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {items.map((s, idx) => {
              const m = getTerminalModel(s.serial, modelosDB);
              return (
                <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors align-middle">
                  <td className="py-2 px-3 text-center whitespace-nowrap text-slate-700">
                    {s.displayDate || s.date}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900 select-all">
                    {s.serial}
                  </td>
                  <td className="py-2 px-3 text-slate-700 uppercase">
                    {s.source || 'S/N'}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-805 uppercase">
                    {m.so} - {m.modelo}
                  </td>
                  <td className="py-2 px-3 text-slate-750 uppercase font-semibold">
                    {s.modeloNegocio || 'SIN ASIGNAR'}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-800 uppercase truncate max-w-[200px]" title={s.razonSocial}>
                    {s.razonSocial || 'SIN RAZÓN SOCIAL'}
                  </td>
                  <td className="py-2 px-3 text-slate-600 uppercase select-all">
                    {s.rif || 'S/N'}
                  </td>
                  <td className="py-2 px-3 text-slate-700 uppercase">
                    {s.ticket ? `${s.ticket}` : ''} {s.banco ? `(${s.banco})` : ''} {!s.ticket && !s.banco ? 'S/N' : ''}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider inline-block text-center ${getStatusStyle(s.status)}`} style={{ borderRadius: '0px' }}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSIMCardsSummaryTable = (items: any[]) => {
    return (
      <div className="overflow-x-auto border border-slate-200 bg-white" style={{ borderRadius: '0px' }}>
        <table className="w-full text-left min-w-[600px] border-collapse text-[11px] font-arial">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-250 text-[9px] text-slate-550 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-24">Fecha</th>
              <th className="py-2.5 px-3 w-60">Serial SIM-Card</th>
              <th className="py-2.5 px-3 w-60">Fuente / Guía</th>
              <th className="py-2.5 px-3 text-center w-28">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {items.map((s, idx) => {
              return (
                <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors align-middle">
                  <td className="py-2 px-3 text-center whitespace-nowrap text-slate-700">
                    {s.date}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900 select-all">
                    {s.serial}
                  </td>
                  <td className="py-2 px-3 text-slate-700 uppercase">
                    {s.source}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider inline-block text-center ${
                      s.status === 'ANULADA'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes(s.status.toUpperCase())
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-orange-100 text-orange-850 border border-orange-200'
                    }`} style={{ borderRadius: '0px' }}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const getPOSItemHeaders = (type: string): string[] => {
    if (
      type === 'total' ||
      type === 'android' ||
      type === 'linux' ||
      type === 'cliente' || 
      type === 'colaborador' || 
      type === 'disponibles' || 
      type === 'entregados' || 
      type === 'periodo' ||
      type === 'casillero_completados' ||
      type === 'casillero_incompletados' ||
      type === 'casillero_recuperados' ||
      type === 'casillero_otros'
    ) {
      return ['MODELO', 'SERIAL', 'STATUS', 'REMITENTE', 'FECHA DE INGRESO'];
    } else if (type === 'modeloNegocio' || type === 'modeloNegocioDates') {
      return ['MODELO', 'SERIAL', 'GUIA', 'RAZON SOCIAL', 'FECHA DE INGRESO'];
    } else if (type === 'manual_cruce') {
      return ['MODELO', 'SERIAL', 'STATUS', 'REMITENTE', 'FECHA DE INGRESO'];
    } else if (type === 'zoom') {
      return ['MODELO', 'SERIAL', 'GUIA', 'RAZON SOCIAL', 'RIF', 'FECHA DE INGRESO'];
    } else {
      return ['MODELO', 'SERIAL', 'FECHA DE INGRESO'];
    }
  };

  const getPOSItemFields = (s: POSItem, type: string) => {
    const m = getTerminalModel(s.serial, modelosDB);
    const headers = getPOSItemHeaders(type);
    const values = headers.map(h => {
      if (h === 'MODELO') return m.modelo || 'DESCONOCIDO';
      if (h === 'SERIAL') return s.serial || '';
      if (h === 'STATUS') return s.status || '';
      if (h === 'GUIA') return s.source || 'S/N';
      if (h === 'RAZON SOCIAL') return s.razonSocial || 'SIN RAZÓN SOCIAL';
      if (h === 'REMITENTE') return s.remitente || 'DESCONOCIDO';
      if (h === 'RIF') return s.rif || 'S/N';
      if (h === 'FECHA DE INGRESO') return s.displayDate || s.date || '';
      return '';
    });
    return { headers, values };
  };

  const renderPOSCustomTable = (items: any[], type: string) => {
    const headers = getPOSItemHeaders(type);

    return (
      <div className="overflow-x-auto border border-slate-200 bg-white" style={{ borderRadius: '0px' }}>
        <table className="w-full text-left min-w-[500px] border-collapse text-[12px] font-arial">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-250 text-[10px] text-slate-550 font-bold uppercase tracking-wider">
              {headers.map(h => (
                <th key={h} className="py-2 px-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {items.map((s, idx) => {
              const m = getTerminalModel(s.serial, modelosDB);
              return (
                <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors align-middle">
                  {headers.map(h => {
                    if (h === 'MODELO') {
                      return (
                        <td key={h} className="py-2 px-3 text-slate-800 font-bold uppercase">
                          {m.modelo || 'DESCONOCIDO'}
                        </td>
                      );
                    }
                    if (h === 'SERIAL') {
                      return (
                        <td key={h} className="py-2 px-3 font-mono font-bold text-slate-900 select-all">
                          {s.serial}
                        </td>
                      );
                    }
                    if (h === 'STATUS') {
                      return (
                        <td key={h} className="py-2 px-3 font-semibold text-slate-700 uppercase">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider inline-block text-center ${getStatusStyle(s.status)}`} style={{ borderRadius: '0px' }}>
                            {s.status}
                          </span>
                        </td>
                      );
                    }
                    if (h === 'GUIA') {
                      return (
                        <td key={h} className="py-2 px-3 text-slate-700 uppercase font-semibold">
                          {s.source || 'S/N'}
                        </td>
                      );
                    }
                    if (h === 'RAZON SOCIAL') {
                      return (
                        <td key={h} className="py-2 px-3 text-slate-800 uppercase font-bold">
                          {s.razonSocial || 'SIN RAZÓN SOCIAL'}
                        </td>
                      );
                    }
                    if (h === 'REMITENTE') {
                      return (
                        <td key={h} className="py-2 px-3 text-slate-700 uppercase">
                          {s.remitente || 'DESCONOCIDO'}
                        </td>
                      );
                    }
                    if (h === 'RIF') {
                      return (
                        <td key={h} className="py-2 px-3 text-slate-605 font-mono select-all">
                          {s.rif || 'S/N'}
                        </td>
                      );
                    }
                    if (h === 'FECHA DE INGRESO') {
                      return (
                        <td key={h} className="py-2 px-3 text-slate-600 font-mono">
                          {s.displayDate || s.date}
                        </td>
                      );
                    }
                    return null;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSIMOnlySerialsTable = (items: any[]) => {
    return (
      <div className="overflow-x-auto border border-slate-200 bg-white" style={{ borderRadius: '0px' }}>
        <table className="w-full text-left min-w-[400px] border-collapse text-[12px] font-arial">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-250 text-[10px] text-slate-550 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-1/3">SERIAL SIM</th>
              <th className="py-2.5 px-3 w-1/3">LOTE</th>
              <th className="py-2.5 px-3 w-1/3 text-center">ESTADO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {items.map((s, idx) => (
              <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors align-middle">
                <td className="py-2 px-3 font-mono font-bold text-slate-900 select-all">
                  {s.serial}
                </td>
                <td className="py-2 px-3 text-slate-750 uppercase font-semibold">
                  {s.source}
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider inline-block text-center ${
                    s.status === 'ANULADA'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes(s.status.toUpperCase())
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-orange-100 text-orange-850 border border-orange-200'
                  }`} style={{ borderRadius: '0px' }}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 text-black pb-16 estadisticas-tab-container font-arial">
      
      {/* SECCIÓN 1: CONTADORES TÉCNICOS (GRID DE 3 FILAS, 2 COLUMNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-slate-200 pb-4">
        {[
          { id: 'total', label: 'EQUIPOS EN TOTAL', count: serials.length, icon: Layers },
          { id: 'simcards', label: 'HISTORIAL DE LOTE DE SIM CARDS', count: totalSimCards, icon: CardSim },
          { id: 'disponibles', label: 'EQUIPOS DISPONIBLES', count: serials.filter(s => ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes((s.status || '').toUpperCase().trim())).length, icon: Unlock },
          { id: 'entregados', label: 'EQUIPOS ENTREGADOS', count: serials.filter(s => ['ENTREGADO', 'ACTIVO', 'SUSPENDIDO', 'PENDIENTE'].includes((s.status || '').toUpperCase().trim())).length, icon: Lock },
          { id: 'linux', label: 'EQUIPOS LINUX', count: serials.filter(s => getTerminalModel(s.serial, modelosDB).so === 'LINUX').length, icon: Cpu },
          { id: 'android', label: 'EQUIPOS ANDROID', count: serials.filter(s => getTerminalModel(s.serial, modelosDB).so === 'ANDROID').length, icon: Smartphone }
        ].map(b => {
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              onClick={() => {
                if (b.id === 'simcards') {
                  setShowSimsModal(true);
                  setSimsSearchQuery('');
                  setModalDateDesde('');
                  setModalDateHasta('');
                } else {
                  setModalType(b.id as any);
                  setModalSelectedName(null);
                  setModalSearch('');
                  setModalDateDesde('');
                  setModalDateHasta('');
                  setModalCurrentPage(1);
                }
              }}
              className="metric-btn sidebar-btn group flex items-center justify-between gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border border-slate-200 bg-white text-black hover:bg-slate-800 hover:text-white cursor-pointer w-full"
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-black group-hover:text-white transition-colors" />
                <span className="text-black group-hover:text-white transition-colors">{b.label}</span>
              </div>
              <span className="font-mono text-sm font-bold text-black group-hover:text-white transition-colors">
                {b.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SECCIÓN 1.2: CANALES DE INGRESO DE EQUIPOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CANAL 1: CRUCE DE SERIALES / USUARIOS */}
        <div 
          onClick={() => { setModalType('manual_cruce'); setModalSearch(''); }}
          className="bg-white border border-slate-200 flex flex-col justify-between p-4 cursor-pointer hover:border-slate-300 transition-all"
          style={{ borderRadius: '0px' }}
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Cruce de Seriales (Usuarios Disglobal)</span>
            <span className="bg-slate-100 text-slate-800 text-[8px] font-bold px-2 py-0.5 uppercase tracking-wider border border-slate-250" style={{ borderRadius: '0px' }}>Usuarios</span>
          </div>
          <div>
            <div className="text-3xl font-black text-black">
              {intakeStats.manual_cruce.total}{" "}
              <span className="text-sm font-semibold text-slate-500 font-mono">
                ({totalCount > 0 ? Math.round((intakeStats.manual_cruce.total / totalCount) * 100) : 0}%)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-600">
              <div>
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-mono">Disponibles</span>
                <span className="text-black font-black text-sm">{intakeStats.manual_cruce.disponibles}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-mono">Entregados</span>
                <span className="text-black font-black text-sm">{intakeStats.manual_cruce.entregados}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CANAL 2: ENVÍOS VÍA ZOOM / CLIENTES */}
        <div 
          onClick={() => { setModalType('zoom'); setModalSearch(''); }}
          className="bg-white border border-slate-200 flex flex-col justify-between p-4 cursor-pointer hover:border-slate-300 transition-all"
          style={{ borderRadius: '0px' }}
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Recibidos Vía Zoom (Clientes)</span>
            <span className="bg-orange-105 text-orange-850 text-[8px] font-bold px-2 py-0.5 uppercase tracking-wider border border-orange-200" style={{ borderRadius: '0px' }}>Clientes</span>
          </div>
          <div>
            <div className="text-3xl font-black text-black">
              {intakeStats.zoom.total}{" "}
              <span className="text-sm font-semibold text-slate-500 font-mono">
                ({totalCount > 0 ? Math.round((intakeStats.zoom.total / totalCount) * 100) : 0}%)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-600">
              <div>
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-mono">Disponibles</span>
                <span className="text-black font-black text-sm">{intakeStats.zoom.disponibles}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-mono">Entregados</span>
                <span className="text-black font-black text-sm">{intakeStats.zoom.entregados}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1.6: TOP 5 COLABORADORES */}
      <div className="bg-white border border-slate-200 flex flex-col" style={{ borderRadius: '0px' }}>
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-805 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-black" />
              USUARIOS DESTACADOS DE DISGLOBAL
            </h4>

          </div>
          <button
            onClick={() => setShowAllColaboradoresModal(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 cursor-pointer border-none"
            style={{ borderRadius: '0px', color: '#fff' }}
          >
            <Layers size={11} className="text-white" />
            <span>Ver Desglose Completo</span>
          </button>
        </div>

        <div className="p-6 flex flex-col justify-center">
          {(() => {
            if (top5Colaboradores.length === 0) {
              return <div className="text-center py-12 text-slate-400 font-mono text-xs">No hay entregas registradas todavía para colaboradores.</div>;
            }
            const rankLabels = ['1º', '2º', '3º', '4º', '5º'];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 w-full mt-2 select-none">
                {top5Colaboradores.map((colab, index) => {
                  const rank = index + 1;
                  const pProfile = usersProfiles[colab.name];
                  
                  const rankLabels = ['1º', '2º', '3º', '4º', '5º'];
                  let borderClass = 'border-slate-200';
                  let rankBgClass = 'from-slate-50 to-white';
                  let accentColor = '#475569';
                  let numColor = '#94a3b8';

                  if (rank === 1) {
                    borderClass = 'border-amber-500 border-2 shadow-md';
                    rankBgClass = 'from-amber-200 via-amber-100 to-amber-50';
                    accentColor = '#d97706'; // Gold
                    numColor = '#b45309';
                  } else if (rank === 2) {
                    borderClass = 'border-slate-400 border-2';
                    rankBgClass = 'from-slate-200 via-slate-100 to-slate-50';
                    accentColor = '#475569'; // Silver
                    numColor = '#475569';
                  } else if (rank === 3) {
                    borderClass = 'border-amber-800 border-2';
                    rankBgClass = 'from-amber-300/40 via-amber-200/30 to-amber-50';
                    accentColor = '#b45309'; // Bronze
                    numColor = '#92400e';
                  } else {
                    numColor = '#64748b';
                  }

                  return (
                    <div
                      key={colab.name}
                      onClick={() => {
                        setModalType('colaborador');
                        setModalSelectedName(colab.name);
                        setModalSearch('');
                        setDetailSelectedDate(null);
                      }}
                      className={`relative flex flex-col items-center justify-between p-4 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 bg-gradient-to-b ${rankBgClass} border ${borderClass} h-[250px] group`}
                      style={{ borderRadius: '0px' }}
                    >
                      {/* Rank Badge */}
                      <div 
                        className="absolute top-2 left-2 text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border font-mono select-none shadow-sm z-20"
                        style={{ 
                          borderColor: accentColor, 
                          color: '#ffffff',
                          backgroundColor: accentColor
                        }}
                      >
                        {rank}
                      </div>

                      {/* Rank Background Watermark (Más visible y nítido) */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center select-none overflow-hidden pointer-events-none opacity-[0.20] group-hover:opacity-[0.35] transition-opacity font-sans font-black text-[110px] leading-none"
                        style={{ color: numColor }}
                      >
                        {rankLabels[index]}
                      </div>

                      {/* Avatar */}
                      <div className="relative mt-4 z-10">
                        <div 
                          className="w-18 h-18 rounded-full border-2 bg-white overflow-hidden shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                          style={{ borderColor: accentColor }}
                        >
                          {renderAvatarHelper(pProfile?.genero, "w-full h-full", colab.name)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="text-center w-full z-10 mt-auto pb-1">
                        <div 
                          className="text-[11px] font-black text-slate-800 truncate uppercase font-arial max-w-full px-1" 
                          title={colab.name}
                        >
                          {colab.name}
                        </div>
                        <div 
                          className="text-[10px] font-extrabold uppercase font-mono mt-1"
                          style={{ color: accentColor }}
                        >
                          {colab.total} Entregas
                        </div>
                      </div>

                      {/* Bottom Accent Bar */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                        style={{ backgroundColor: accentColor }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* SECCIÓN 1.5: TOP 5 CLIENTES */}
      <div className="bg-white border border-slate-200 flex flex-col" style={{ borderRadius: '0px' }}>
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-805 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-black" />
              CLIENTES CON MAS ENTREGAS
            </h4>

          </div>
          <button
            onClick={() => setShowAllClientesModal(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 cursor-pointer border-none"
            style={{ borderRadius: '0px', color: '#fff' }}
          >
            <Layers size={11} className="text-white" />
            <span>Ver Desglose Completo</span>
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-5 gap-4">
          {top5Clientes.length === 0 ? (
            <div className="col-span-5 text-center py-6 text-slate-400 font-mono text-xs">No hay entregas registradas todavía para clientes.</div>
          ) : (
            top5Clientes.map((u, idx) => (
              <div 
                key={u.name} 
                onClick={() => { setModalType('cliente'); setModalSelectedName(u.name); setModalSearch(''); setDetailSelectedDate(null); }}
                className="bg-white border border-slate-200 flex flex-col justify-between hover:border-slate-350 cursor-pointer transition-all relative"
                style={{ borderRadius: '0px' }}
              >
                <div className="border-b border-slate-100 px-3 py-2 flex justify-between items-center bg-slate-50">
                  <span className="text-[8px] text-slate-400 font-bold uppercase font-mono">CLIENTE</span>
                  <span className="text-[13px] font-black text-slate-900 font-mono bg-amber-100 px-2 py-0.5 border border-amber-200 shadow-2xs">#{idx + 1}</span>
                </div>
                <div className="p-3">
                  <div className="text-xs font-black text-black truncate uppercase font-arial mt-0.5" style={{ color: '#000000' }} title={u.name}>{u.name}</div>
                  <div className="mt-3 border-t border-slate-100 pt-2 flex flex-col">
                    <span className="text-[8px] text-slate-400 font-bold uppercase font-mono leading-none">TOTAL ENTREGAS</span>
                    <span className="text-2xl font-black text-black leading-tight mt-1">{u.total}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 2: GRID DE GRÁFICOS (LINE CHART + DOUGHNUT CHART IN MOCKUP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART WIDE: PERFORMANCE DE INGRESOS */}
        <div className="lg:col-span-12 bg-white border border-slate-200 shadow-sm flex flex-col justify-between" style={{ borderRadius: '0px' }}>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-805">
              Rendimiento de Ingresos (Flujo Mensual)
            </h4>
          </div>

          <div className="p-4 flex flex-col justify-between flex-1 gap-4">
            {/* SVG Line Chart representing curved smooth paths */}
            <div className="w-full h-48 relative mt-2">
              <svg viewBox="0 0 540 180" width="100%" height="100%" className="overflow-visible select-none">
                {/* Horizontal grid lines */}
                <line x1="40" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="90" x2="520" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="160" x2="520" y2="160" stroke="#e2e8f0" />

                {/* Month bottom labels */}
                {chartData.map((d, i) => (
                  <text key={i} x={60 + i * 110} y="175" textAnchor="middle" className="text-[10px] font-bold uppercase tracking-wider" style={{ fill: '#000000' }}>
                    {d.month}
                  </text>
                ))}

                {/* Curved paths styled with deep teal, cerulean blue, and purple */}
                <path d={getCurvePath(totalPoints)} fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
                <path d={getCurvePath(androidPoints)} fill="none" stroke="#0ea5e9" strokeWidth="2.2" strokeLinecap="round" />
                <path d={getCurvePath(linuxPoints)} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />

                {/* Dots and Tooltips replaced with SQUARE markers */}
                {totalPoints.map((p, i) => (
                  <g key={i} className="cursor-pointer group">
                    <rect x={p.x - 3.5} y={p.y - 3.5} width="7" height="7" fill="#0d9488" stroke="white" strokeWidth="1.5" />
                    <title>Total: {chartData[i].total}</title>
                  </g>
                ))}
                {androidPoints.map((p, i) => (
                  <g key={i} className="cursor-pointer group">
                    <rect x={p.x - 3} y={p.y - 3} width="6" height="6" fill="#0ea5e9" stroke="white" strokeWidth="1.2" />
                    <title>Android: {chartData[i].android}</title>
                  </g>
                ))}
                {linuxPoints.map((p, i) => (
                  <g key={i} className="cursor-pointer group">
                    <rect x={p.x - 2.5} y={p.y - 2.5} width="5" height="5" fill="#8b5cf6" stroke="white" strokeWidth="1" />
                    <title>Linux: {chartData[i].linux}</title>
                  </g>
                ))}
              </svg>
            </div>

            {/* Chart Legends */}
            <div className="flex gap-4 justify-center items-center text-[10px] font-bold uppercase tracking-widest mt-2 border-t border-slate-100 pt-3" style={{ color: '#000000' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5" style={{ backgroundColor: '#0d9488', borderRadius: '0px' }}></span>
                <span>Total POS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5" style={{ backgroundColor: '#0ea5e9', borderRadius: '0px' }}></span>
                <span>Android</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5" style={{ backgroundColor: '#8b5cf6', borderRadius: '0px' }}></span>
                <span>Linux</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOUGHNUT NARROW: CATEGORIAS MAS POPULARES */}
        <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm flex flex-col justify-between" style={{ borderRadius: '0px' }}>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-805">
              Distribución por SO
            </h4>
          </div>

          <div className="p-4 flex flex-col justify-between flex-1 gap-4">
            {/* SVG Doughnut chart */}
            <div className="flex-1 flex items-center justify-center py-2 relative">
              <div className="relative">
                <svg width="140" height="140" viewBox="0 0 100 100" className="mx-auto select-none overflow-visible">
                  {/* Circle background */}
                  <circle cx="50" cy="50" r="36" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                  
                  {/* Segment Android: Vibrant deep cerulean -> Vibrant Green */}
                  {strokeAndroid > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#22c55e" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeAndroid} ${circ - strokeAndroid}`} 
                       strokeDashoffset={offsetAndroid} 
                       transform="rotate(-90 50 50)" 
                    />
                  )}

                  {/* Segment Linux: Vibrant turquoise -> Dull Grey */}
                  {strokeLinux > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#64748b" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeLinux} ${circ - strokeLinux}`} 
                       strokeDashoffset={offsetLinux} 
                       transform="rotate(-90 50 50)" 
                    />
                  )}

                  {/* Segment Other: Light grey -> Black */}
                  {strokeOther > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#000000" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeOther} ${circ - strokeOther}`} 
                       strokeDashoffset={offsetOther} 
                       transform="rotate(-90 50 50)" 
                    />
                  )}
                </svg>
                {/* Doughnut center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none mt-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-bold leading-none" style={{ color: '#000000' }}>Total</span>
                  <span className="text-xl font-black font-sans tracking-tight" style={{ color: '#000000' }}>{totalCount}</span>
                </div>
              </div>
            </div>

            {/* Doughnut Legends */}
            <div className="flex flex-col gap-1.5 text-[14px] font-bold uppercase tracking-wider mt-1 border-t border-slate-100 pt-3" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#22c55e', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Android</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{androidCount} ({totalCount > 0 ? Math.round((androidCount / totalCount) * 100) : 0}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#64748b', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Linux</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{linuxCount} ({totalCount > 0 ? Math.round((linuxCount / totalCount) * 100) : 0}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#000000', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Desconocidos</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{totalCount - androidCount - linuxCount} ({totalCount > 0 ? Math.round(((totalCount - androidCount - linuxCount) / totalCount) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOUGHNUT NARROW: ENTREGA POR AREAS */}
        <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm flex flex-col justify-between" style={{ borderRadius: '0px' }}>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-805">
              Distribución por Área de Entrega
            </h4>
          </div>

          <div className="p-4 flex flex-col justify-between flex-1 gap-4">
            {/* SVG Doughnut chart */}
            <div className="flex-1 flex items-center justify-center py-2 relative">
              <div className="relative">
                <svg width="140" height="140" viewBox="0 0 100 100" className="mx-auto select-none overflow-visible">
                  {/* Circle background */}
                  <circle cx="50" cy="50" r="36" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                  
                  {/* Segment ATC: Emerald */}
                  {strokeATC > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#10b981" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeATC} ${circ - strokeATC}`} 
                       strokeDashoffset={offsetATC} 
                       transform="rotate(-90 50 50)" 
                       className="cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => { setModalType('departamento'); setModalSelectedName('ATC'); setModalSearch(''); }}
                    />
                  )}

                  {/* Segment VENTAS: Indigo */}
                  {strokeVentas > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#6366f1" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeVentas} ${circ - strokeVentas}`} 
                       strokeDashoffset={offsetVentas} 
                       transform="rotate(-90 50 50)" 
                       className="cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => { setModalType('departamento'); setModalSelectedName('VENTAS'); setModalSearch(''); }}
                    />
                  )}

                  {/* Segment POSTVENTA: Purple */}
                  {strokePostventa > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#8b5cf6" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokePostventa} ${circ - strokePostventa}`} 
                       strokeDashoffset={offsetPostventa} 
                       transform="rotate(-90 50 50)" 
                       className="cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => { setModalType('departamento'); setModalSelectedName('POSTVENTA'); setModalSearch(''); }}
                    />
                  )}

                  {/* Segment ZOOM: Orange */}
                  {strokeZoom > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#ea580c" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeZoom} ${circ - strokeZoom}`} 
                       strokeDashoffset={offsetZoom} 
                       transform="rotate(-90 50 50)" 
                       className="cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => { setModalType('zoom'); setModalSearch(''); }}
                    />
                  )}
                </svg>
                {/* Doughnut center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none mt-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-bold leading-none" style={{ color: '#000000' }}>Total</span>
                  <span className="text-xl font-black font-sans tracking-tight" style={{ color: '#000000' }}>{totalAreaCount}</span>
                </div>
              </div>
            </div>

            {/* Doughnut Legends */}
            <div className="flex flex-col gap-1.5 text-[14px] font-bold uppercase tracking-wider mt-1 border-t border-slate-100 pt-3" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>
              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-0.5"
                onClick={() => { setModalType('departamento'); setModalSelectedName('ATC'); setModalSearch(''); }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#10b981', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>ATC</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{areaDeliveryStats.atc} ({totalAreaDoughnut > 0 ? Math.round((areaDeliveryStats.atc / totalAreaDoughnut) * 100) : 0}%)</span>
              </div>
              
              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-0.5"
                onClick={() => { setModalType('departamento'); setModalSelectedName('VENTAS'); setModalSearch(''); }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#6366f1', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>VENTAS</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{areaDeliveryStats.ventas} ({totalAreaDoughnut > 0 ? Math.round((areaDeliveryStats.ventas / totalAreaDoughnut) * 100) : 0}%)</span>
              </div>

              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-0.5"
                onClick={() => { setModalType('departamento'); setModalSelectedName('POSTVENTA'); setModalSearch(''); }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#8b5cf6', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>POSTVENTA</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{areaDeliveryStats.postventa} ({totalAreaDoughnut > 0 ? Math.round((areaDeliveryStats.postventa / totalAreaDoughnut) * 100) : 0}%)</span>
              </div>

              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-0.5"
                onClick={() => { setModalType('zoom'); setModalSearch(''); }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#ea580c', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>ZOOM</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{areaDeliveryStats.zoom} ({totalAreaDoughnut > 0 ? Math.round((areaDeliveryStats.zoom / totalAreaDoughnut) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOUGHNUT NARROW: DISTRIBUCIÓN POR ESTATUS */}
        <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm flex flex-col justify-between" style={{ borderRadius: '0px' }}>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-805">
              Distribución por Estatus
            </h4>
          </div>

          <div className="p-4 flex flex-col justify-between flex-1 gap-4">
            {/* SVG Doughnut chart */}
            <div className="flex-1 flex items-center justify-center py-2 relative">
              <div className="relative">
                <svg width="140" height="140" viewBox="0 0 100 100" className="mx-auto select-none overflow-visible">
                  {/* Circle background */}
                  <circle cx="50" cy="50" r="36" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                  
                  {/* Segment Disponibles: Vibrant green */}
                  {strokeDisponibles > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#22c55e" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeDisponibles} ${circ - strokeDisponibles}`} 
                       strokeDashoffset={offsetDisponibles} 
                       transform="rotate(-90 50 50)" 
                       className="cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => { setModalType('disponibles'); setModalSelectedName(null); setModalSearch(''); }}
                    />
                  )}

                  {/* Segment Entregados: Vibrant orange */}
                  {strokeEntregados > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#ea580c" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeEntregados} ${circ - strokeEntregados}`} 
                       strokeDashoffset={offsetEntregados} 
                       transform="rotate(-90 50 50)" 
                       className="cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => { setModalType('entregados'); setModalSelectedName(null); setModalSearch(''); }}
                    />
                  )}

                  {/* Segment Otros / S.A.: Slate */}
                  {strokeOtrosStatus > 0 && (
                    <circle 
                       cx="50" 
                       cy="50" 
                       r="36" 
                       fill="transparent" 
                       stroke="#64748b" 
                       strokeWidth="12" 
                       strokeDasharray={`${strokeOtrosStatus} ${circ - strokeOtrosStatus}`} 
                       strokeDashoffset={offsetOtrosStatus} 
                       transform="rotate(-90 50 50)" 
                    />
                  )}
                </svg>
                {/* Doughnut center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none mt-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-bold leading-none" style={{ color: '#000000' }}>Total</span>
                  <span className="text-xl font-black font-sans tracking-tight" style={{ color: '#000000' }}>{totalCount}</span>
                </div>
              </div>
            </div>

            {/* Doughnut Legends */}
            <div className="flex flex-col gap-1.5 text-[14px] font-bold uppercase tracking-wider mt-1 border-t border-slate-100 pt-3" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>
              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-0.5"
                onClick={() => { setModalType('disponibles'); setModalSelectedName(null); setModalSearch(''); }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#22c55e', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Disponibles</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{disponiblesCount} ({totalCount > 0 ? Math.round((disponiblesCount / totalCount) * 100) : 0}%)</span>
              </div>
              
              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-0.5"
                onClick={() => { setModalType('entregados'); setModalSelectedName(null); setModalSearch(''); }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#ea580c', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Entregados</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{entregadosCount} ({totalCount > 0 ? Math.round((entregadosCount / totalCount) * 100) : 0}%)</span>
              </div>

              <div className="flex justify-between items-center p-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ backgroundColor: '#64748b', borderRadius: '0px' }}></span>
                  <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Otros / S.A.</span>
                </div>
                <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{totalCount - disponiblesCount - entregadosCount} ({totalCount > 0 ? Math.round(((totalCount - disponiblesCount - entregadosCount) / totalCount) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN 3: CONTROL DE HISTÓRICOS Y PERIODOS */}
      <div className="bg-white border border-slate-200 flex flex-col shadow-sm" style={{ borderRadius: '0px' }}>
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center flex-wrap gap-4 justify-between">
          <h4 className="font-bold text-xs tracking-widest uppercase text-slate-805 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4 text-black" />
            Control de Históricos y Periodos
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-arial">Filtro de Casillero:</span>
            <select
              value={exportCasilleroFilter}
              onChange={e => {
                setExportCasilleroFilter(e.target.value as any);
                setCurrentPage(1); // Reset page on filter change
              }}
              className="text-xs p-1.5 bg-white border border-slate-300 text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer font-arial"
              style={{ borderRadius: '0px' }}
            >
              <option value="all">TODOS LOS EQUIPOS (CON CASILLERO)</option>
              <option value="no-casillero">SOLO GESTIÓN GENERAL (SIN CASILLERO)</option>
              <option value="only-casillero">SOLO CASILLERO</option>
            </select>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* PANEL: INGRESOS ENTREGADOS */}
          <div className="bg-slate-50/50 p-4 border border-slate-200 flex flex-col gap-4" style={{ borderRadius: '0px' }}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="font-bold text-[11px] tracking-wider uppercase text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-black" />
                Historial Entregados
              </h5>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {(['hoy', 'semana', 'quincena', 'mes', 'trimestre', 'anual'] as const).map(p => (
                <div key={p} className="bg-white p-2.5 border border-slate-200 flex flex-col items-center justify-between gap-1.5 text-center group transition-all hover:border-slate-350" style={{ borderRadius: '0px' }}>
                  <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase">{p}</span>
                  <span 
                    onClick={() => setPeriodModalConfig({ period: p, statusGroup: 'entregados' })}
                    className="text-lg font-black font-sans tracking-tight text-black hover:text-slate-900 transition-colors cursor-pointer hover:underline"
                    title="Click para ver listado detallado"
                  >
                    {contarPeriodo(p, 'entregados')}
                  </span>
                  <button
                    onClick={() => handleExportPeriod(p, 'entregados')}
                    className="w-full mt-2 py-1 bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 text-[9px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    style={{ borderRadius: '0px' }}
                  >
                    <FileDown size={10} />
                    <span>EXP</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL: INGRESOS DISPONIBLES */}
          <div className="bg-slate-50/50 p-4 border border-slate-200 flex flex-col gap-4" style={{ borderRadius: '0px' }}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="font-bold text-[11px] tracking-wider uppercase text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-black" />
                Historial Disponibles
              </h5>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {(['hoy', 'semana', 'quincena', 'mes', 'trimestre', 'anual'] as const).map(p => (
                <div key={p} className="bg-white p-2.5 border border-slate-200 flex flex-col items-center justify-between gap-1.5 text-center group transition-all hover:border-slate-350" style={{ borderRadius: '0px' }}>
                  <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase">{p}</span>
                  <span 
                    onClick={() => setPeriodModalConfig({ period: p, statusGroup: 'disponibles' })}
                    className="text-lg font-black font-sans tracking-tight text-black hover:text-slate-900 transition-colors cursor-pointer hover:underline"
                    title="Click para ver listado detallado"
                  >
                    {contarPeriodo(p, 'disponibles')}
                  </span>
                  <button
                    onClick={() => handleExportPeriod(p, 'disponibles')}
                    className="w-full mt-2 py-1 bg-green-600 hover:bg-green-700 text-white border border-green-700 text-[9px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    style={{ borderRadius: '0px' }}
                  >
                    <FileDown size={10} />
                    <span>EXP</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL: INGRESOS TOTALES */}
          <div className="bg-slate-50/50 p-4 border border-slate-200 flex flex-col gap-4" style={{ borderRadius: '0px' }}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="font-bold text-[11px] tracking-wider uppercase text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-black" />
                Historial Totales
              </h5>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {(['hoy', 'semana', 'quincena', 'mes', 'trimestre', 'anual'] as const).map(p => (
                <div key={p} className="bg-white p-2.5 border border-slate-200 flex flex-col items-center justify-between gap-1.5 text-center group transition-all hover:border-slate-350" style={{ borderRadius: '0px' }}>
                  <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase">{p}</span>
                  <span 
                    onClick={() => setPeriodModalConfig({ period: p, statusGroup: 'total' })}
                    className="text-lg font-black font-sans tracking-tight text-black hover:text-slate-900 transition-colors cursor-pointer hover:underline"
                    title="Click para ver listado detallado"
                  >
                    {contarPeriodo(p, 'total')}
                  </span>
                  <button
                    onClick={() => handleExportPeriod(p, 'total')}
                    className="w-full mt-2 py-1 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 text-[9px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    style={{ borderRadius: '0px' }}
                  >
                    <FileDown size={10} />
                    <span>EXP</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: MODELOS Y DISTRIBUCIONES (PRESERVED LOGIC) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Modelos Fisicos Card */}
        <div className="bg-white border border-slate-200 shadow-sm flex flex-col" style={{ borderRadius: '0px' }}>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
            <h4 className="font-bold uppercase text-slate-805 text-[12px] font-arial">
              Distribución por Modelo Físico
            </h4>
            <button
              onClick={() => { setShowModelDatesModal(true); setModelSearchQuery(''); }}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-extrabold uppercase transition-colors border border-transparent cursor-pointer flex items-center gap-1"
              style={{ borderRadius: '0px', color: '#fff' }}
            >
              <Calendar size={10} />
              <span>Ver por Fechas</span>
            </button>
          </div>
          <div className="p-3 space-y-0.5 max-h-[220px] overflow-y-auto pr-1">
            {(() => {
              const modelCounts: Record<string, number> = {};
              serials.forEach(s => {
                const modelInfo = getTerminalModel(s.serial, modelosDB);
                const name = modelInfo.modelo || 'DESCONOCIDO';
                modelCounts[name] = (modelCounts[name] || 0) + 1;
              });
              
              return Object.entries(modelCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <div 
                    key={name} 
                    onClick={() => { setModalType('modeloFisico'); setModalSelectedName(name); setModalSearch(''); }}
                    className="bg-white border border-slate-200 border-t-0 first:border-t p-2 flex items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer transition-colors"
                    style={{ borderRadius: '0px' }}
                  >
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase font-arial">{name}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-800 border border-slate-200 font-mono px-2 py-0.5 font-bold font-arial" style={{ borderRadius: '0px' }}>{count}</span>
                  </div>
                ));
            })()}
          </div>
        </div>

        {/* Modelos de Negocio Card */}
        <div className="bg-white border border-slate-200 shadow-sm flex flex-col" style={{ borderRadius: '0px' }}>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
            <h4 className="font-bold uppercase text-slate-805 text-[12px] font-arial">
              Distribución por Modelo de Negocio
            </h4>
            <button
              onClick={() => { setShowBizModelDatesModal(true); setBizModelSearchQuery(''); }}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-extrabold uppercase transition-colors border border-transparent cursor-pointer flex items-center gap-1"
              style={{ borderRadius: '0px', color: '#fff' }}
            >
              <Calendar size={10} />
              <span>Ver por Fechas</span>
            </button>
          </div>
          <div className="p-3 space-y-0.5 max-h-[220px] overflow-y-auto pr-1">
            {[
              { label: 'BÁSICO', count: serials.filter(s => s.modeloNegocio === 'BASICO').length },
              { label: 'COMODATO', count: serials.filter(s => s.modeloNegocio === 'COMODATO').length },
              { label: 'SIN ASIGNAR', count: serials.filter(s => !s.modeloNegocio).length }
            ].map(({ label, count }) => (
              <div 
                key={label} 
                onClick={() => { setModalType('modeloNegocio'); setModalSelectedName(label); setModalSearch(''); }}
                className="bg-white border border-slate-200 border-t-0 first:border-t p-2 flex items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer transition-colors"
                style={{ borderRadius: '0px' }}
              >
                <span className="text-[11px] font-extrabold text-slate-800 uppercase font-arial">{label}</span>
                <span className="text-[11px] bg-slate-100 text-slate-800 border border-slate-200 font-mono px-2 py-0.5 font-bold font-arial" style={{ borderRadius: '0px' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas de Casillero Card */}
        <div className="bg-white border border-slate-200 shadow-sm flex flex-col" style={{ borderRadius: '0px' }}>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
            <h4 className="font-bold uppercase text-slate-805 text-[12px] font-arial">
              Métricas de Casillero (Sustituciones y Recuperados)
            </h4>
          </div>

          <div className="p-3 flex-1 flex flex-col justify-between gap-2">
            {totalCasilleroCount === 0 ? (
              <div className="text-center py-12 text-slate-400 font-mono text-xs uppercase font-bold flex-1 flex items-center justify-center">
                No hay registros en el casillero.
              </div>
            ) : (
              <>
                {/* SVG Doughnut chart */}
                <div className="flex items-center justify-center py-1 relative">
                  <div className="relative">
                    <svg width="110" height="110" viewBox="0 0 100 100" className="mx-auto select-none overflow-visible">
                      {/* Circle background */}
                      <circle cx="50" cy="50" r="36" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                      
                      {/* Segments */}
                      {(() => {
                        const circ = 226.195;
                        let accumulatedLength = 0;
                        
                        return casilleroMetrics.map(({ key, label, count, color }) => {
                          const percentage = totalCasilleroCount > 0 ? (count / totalCasilleroCount) : 0;
                          const strokeLength = percentage * circ;
                          const strokeOffset = -accumulatedLength;
                          accumulatedLength += strokeLength;

                          if (strokeLength <= 0) return null;
                          
                          return (
                            <circle 
                              key={key}
                              cx="50" 
                              cy="50" 
                              r="36" 
                              fill="transparent" 
                              stroke={color} 
                              strokeWidth="12" 
                              strokeDasharray={`${strokeLength} ${circ - strokeLength}`} 
                              strokeDashoffset={strokeOffset} 
                              transform="rotate(-90 50 50)" 
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => { setModalType(key as any); setModalSelectedName(label); setModalSearch(''); }}
                              title={`${label}: ${count}`}
                            />
                          );
                        });
                      })()}
                    </svg>
                    {/* Doughnut center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none mt-0.5">
                      <span className="text-[8px] uppercase tracking-wider font-bold leading-none text-slate-400">Total</span>
                      <span className="text-base font-black font-sans tracking-tight text-slate-800">
                        {totalCasilleroCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Doughnut Legends */}
                <div className="flex flex-col gap-0.5 text-[11px] font-bold uppercase tracking-wider mt-1 border-t border-slate-100 pt-2 max-h-[110px] overflow-y-auto pr-1" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '11px' }}>
                  {(() => {
                    return casilleroMetrics.map(({ key, label, count, color }) => {
                      const percentage = totalCasilleroCount > 0 ? Math.round((count / totalCasilleroCount) * 100) : 0;
                      return (
                        <div 
                          key={key} 
                          onClick={() => { setModalType(key as any); setModalSelectedName(label); setModalSearch(''); }}
                          className="flex justify-between items-center hover:bg-slate-50 border border-slate-200 border-t-0 first:border-t p-1.5 px-2 cursor-pointer transition-colors"
                          style={{ borderRadius: '0px' }}
                        >
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <span className="w-2 h-2 shrink-0" style={{ backgroundColor: color, borderRadius: '0px' }}></span>
                            <span className="truncate text-slate-700" style={{ fontFamily: 'Arial' }} title={label}>{label}</span>
                          </div>
                          <span className="font-mono text-slate-800 shrink-0">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Historial de registros removido: ahora mostrado en la pestaña Registros */}

      {/* DETAIL MODAL OVERLAY */}
      {modalType && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in-overlay backdrop-blur-xs"
          onClick={closeAllModals}
        >
          <div 
            className={`bg-white border border-slate-200 w-full ${(modalType === 'cliente' || modalType === 'colaborador') ? 'max-w-5xl' : 'max-w-6xl'} p-6 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-hidden animate-fade-in font-arial`}
            style={{ borderRadius: '0px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider" style={{ fontFamily: 'Arial', fontWeight: 'bold' }}>
                  Listado: {modalType === 'total' ? 'TODOS LOS EQUIPOS RECIBIDOS' : 
                           modalType === 'disponibles' ? 'EQUIPOS DISPONIBLES' : 
                           modalType === 'entregados' ? 'EQUIPOS ENTREGADOS' :
                           modalType === 'android' ? 'EQUIPOS ANDROID' :
                           modalType === 'linux' ? 'EQUIPOS LINUX' :
                           modalType === 'manual_cruce' ? 'EQUIPOS - CRUCE DE SERIALES (USUARIOS DISGLOBAL)' :
                           modalType === 'zoom' ? 'EQUIPOS - RECIBIDOS VIA ZOOM (CLIENTES)' :
                           modalType === 'cliente' ? `EQUIPOS - CLIENTE: ${modalSelectedName}` :
                           modalType === 'colaborador' ? `EQUIPOS - COLABORADOR: ${modalSelectedName}` :
                           modalType === 'modeloFisico' ? `EQUIPOS - MODELO FÍSICO: ${modalSelectedName}` :
                           modalType === 'modeloNegocio' ? `EQUIPOS - MODELO DE NEGOCIO: ${modalSelectedName}` :
                           modalType === 'departamento' ? `EQUIPOS - DEPARTAMENTO: ${modalSelectedName}` :
                           modalType === 'casillero_completados' ? 'SUSTITUCIONES COMPLETADAS (CASILLERO)' :
                           modalType === 'casillero_incompletados' ? 'SUSTITUCIONES INCOMPLETAS (CASILLERO)' :
                           modalType === 'casillero_recuperados' ? 'EQUIPOS RECUPERADOS (CASILLERO)' :
                           modalType === 'casillero_otros' ? 'OTROS EN CASILLERO' : ''}
                </h3>
                <p className="text-[11px] text-slate-455 mt-1 font-mono">
                  Encontrados: {modalList.length} registros para este enfoque.
                </p>
              </div>
              <div className="flex gap-2">
                {(modalType === 'cliente' || modalType === 'colaborador') ? (
                  <button 
                    onClick={() => {
                      const itemsToExport = detailSelectedDate 
                        ? modalList.filter(s => s.date === detailSelectedDate)
                        : modalList;
                      if (itemsToExport.length === 0) { alert("No hay datos para exportar."); return; }
                      const { headers } = getPOSItemFields(itemsToExport[0], modalType || '');
                      const header = "sep=;\n" + headers.join(";") + "\n";
                      const rows = itemsToExport.map(s => {
                        const { values } = getPOSItemFields(s, modalType || '');
                        return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";");
                      });
                      const csvContent = header + rows.join("\n");
                      downloadCSV(csvContent, `Detalle_${modalType}_${modalSelectedName}_${detailSelectedDate || 'TODOS'}_${new Date().toISOString().split('T')[0]}.csv`);
                    }}
                    className="text-white font-bold bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
                    style={{ borderRadius: '0px', fontFamily: 'Arial' }}
                  >
                    <FileDown size={14} />
                    Exportar CSV
                  </button>
                ) : (
                  <button 
                    onClick={exportModalDataToCSV}
                    className="text-white font-bold bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
                    style={{ borderRadius: '0px' }}
                  >
                    <FileDown size={14} />
                    Exportar a Excel
                  </button>
                )}
                <button 
                  onClick={closeAllModals}
                  className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 text-xs px-2.5 py-1 border border-slate-200 cursor-pointer transition-colors"
                  style={{ borderRadius: '0px' }}
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {/* SPLIT LAYOUT for cliente/colaborador */}
            {(modalType === 'cliente' || modalType === 'colaborador') ? (
              (() => {
                const uniqueDates = [...new Set(modalList.map(s => s.date))] as string[];
                uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                const serialsForDate = detailSelectedDate 
                  ? modalList.filter(s => s.date === detailSelectedDate) 
                  : modalList;
                return (
                  <div className="flex flex-1 overflow-hidden gap-0 border border-slate-200" style={{ borderRadius: '0px' }}>
                    {/* LEFT SIDEBAR: Dates */}
                    <div className="w-52 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50 overflow-y-auto select-none">
                      <div className="px-3 py-2.5 bg-slate-100 border-b border-slate-200 sticky top-0 z-10 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600" style={{ fontFamily: 'Arial' }}>FECHA DE ENTREGAS</span>
                      </div>
                      <div
                        onClick={() => setDetailSelectedDate(null)}
                        className={`w-full text-left px-3 py-3 text-[11px] font-bold uppercase border-b border-slate-250 cursor-pointer transition-colors ${!detailSelectedDate ? (modalType === 'colaborador' ? 'bg-blue-600 text-white font-black' : 'bg-green-600 text-white font-black') : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                        style={{ borderRadius: '0px', fontFamily: 'Arial', fontWeight: 'bold' }}
                      >
                        MOSTRAR TODOS ({modalList.length})
                      </div>
                      <div className="h-2 bg-slate-200 border-b border-slate-250 flex-shrink-0"></div>
                      {uniqueDates.map(date => {
                        const count = modalList.filter(s => s.date === date).length;
                        const isSelected = detailSelectedDate === date;
                        return (
                           <div
                            key={date}
                            onClick={() => setDetailSelectedDate(date)}
                            className={`w-full text-left px-3 py-2.5 text-[11px] font-bold border-b border-slate-100 cursor-pointer transition-colors ${isSelected ? (modalType === 'colaborador' ? 'bg-blue-50 text-blue-700 border-l-2 border-l-blue-500 font-bold' : 'bg-green-50 text-green-700 border-l-2 border-l-green-500 font-bold') : 'text-slate-650 hover:bg-slate-100 bg-white'}`}
                            style={{ borderRadius: '0px', fontFamily: 'Arial', fontWeight: 'bold' }}
                          >
                            {date} <span className="text-slate-400 text-[9px] ml-1">({count})</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* RIGHT PANEL: simple read-only table like Casillero */}
                    <div className="flex-1 overflow-y-auto bg-white p-4 flex flex-col gap-2">
                      <div className="px-1 pb-2 border-b border-slate-100 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500" style={{ fontFamily: 'Arial' }}>
                          {detailSelectedDate ? `SERIALES DEL ${detailSelectedDate}` : 'TODOS LOS SERIALES'} — {serialsForDate.length} equipos
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto font-arial">
                        {serialsForDate.length === 0 ? (
                          <div className="text-center py-10 text-slate-450 uppercase font-bold text-[11px]">No hay seriales para esta fecha.</div>
                        ) : (
                          renderPOSCustomTable(serialsForDate, modalType || '')
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* STANDARD LIST VIEW for other modal types using custom read-only table layout */
              <>
                {/* Date filter container */}
                {renderDateRangeFilter()}

                {/* Modal search bar */}
                <div className="relative flex-shrink-0">
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={e => { setModalSearch(e.target.value); setModalCurrentPage(1); }}
                    placeholder="Filtrar por serial, remitente, cliente RIF..."
                    className="w-full text-xs p-2.5 pl-8 bg-white border border-slate-350 text-slate-800 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 font-bold"
                    style={{ borderRadius: '0px' }}
                  />
                  <Search size={14} className="absolute left-2.5 top-3.5 text-black" />
                </div>

                <div className="overflow-y-auto pr-1 flex-1 font-arial">
                  {modalList.length === 0 ? (
                    <div className="text-center py-10 text-slate-450 font-bold uppercase text-xs">Ningún registro coincide con el filtro del modal.</div>
                  ) : (
                    (() => {
                      const itemsPerPageModal = 20;
                      const totalModalPages = Math.ceil(modalList.length / itemsPerPageModal);
                      const startIndex = (modalCurrentPage - 1) * itemsPerPageModal;
                      const endIndex = startIndex + itemsPerPageModal;
                      const paginatedItems = modalList.slice(startIndex, endIndex);

                      return (
                        <div className="flex flex-col gap-4">
                          {renderPOSCustomTable(paginatedItems, modalType || '')}
                          
                          {totalModalPages > 1 && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 flex-shrink-0">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Página {modalCurrentPage} de {totalModalPages}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  disabled={modalCurrentPage === 1}
                                  onClick={() => setModalCurrentPage(p => Math.max(1, p - 1))}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 text-xs cursor-pointer font-bold uppercase animate-none"
                                  style={{ borderRadius: '0px' }}
                                >
                                  Anterior
                                </button>
                                <button
                                  disabled={modalCurrentPage === totalModalPages}
                                  onClick={() => setModalCurrentPage(p => Math.min(totalModalPages, p + 1))}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 text-xs cursor-pointer font-bold uppercase animate-none"
                                  style={{ borderRadius: '0px' }}
                                >
                                  Siguiente
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* DETALLE PERIOD MODAL OVERLAY */}
      {periodModalConfig && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in-overlay backdrop-blur-xs"
          onClick={closeAllModals}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-6xl p-6 flex flex-col gap-4 shadow-xl max-h-[80vh] overflow-hidden animate-fade-in"
            style={{ borderRadius: '0px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider">
                  {periodModalConfig.statusGroup === 'entregados' 
                    ? 'HISTORIAL DE EQUIPOS ENTREGADOS' 
                    : periodModalConfig.statusGroup === 'disponibles'
                    ? 'HISTORIAL DE EQUIPOS DISPONIBLES'
                    : 'HISTORIAL DE TODOS LOS EQUIPOS'}
                </h3>
                <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono">
                  Rango: {periodModalConfig.period}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    let list = obtenerPeriodoItems(periodModalConfig.period, periodModalConfig.statusGroup);
                    if (modalDateDesde) {
                      list = list.filter(s => s.date >= modalDateDesde);
                    }
                    if (modalDateHasta) {
                      list = list.filter(s => s.date <= modalDateHasta);
                    }
                    if (list.length === 0) {
                      alert("No hay datos para exportar.");
                      return;
                    }
                    const { headers } = getPOSItemFields(list[0], 'periodo');
                    const header = "sep=;\n" + headers.join(";") + "\n";
                    const rows = list.map(s => {
                      const { values } = getPOSItemFields(s, 'periodo');
                      return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";");
                    });
                    const csvContent = header + rows.join("\n");
                    downloadCSV(csvContent, `Periodo_${periodModalConfig.statusGroup}_${periodModalConfig.period}_${new Date().toISOString().split('T')[0]}.csv`);
                  }}
                  className="text-white font-bold bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
                  style={{ borderRadius: '0px' }}
                >
                  <FileDown size={14} />
                  Exportar a Excel
                </button>
                <button 
                  onClick={closeAllModals}
                  className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
                  style={{ borderRadius: '0px' }}
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {/* Date filter container */}
            {renderDateRangeFilter()}

            <div className="overflow-y-auto pr-1 flex-1 font-arial">
              {(() => {
                let list = obtenerPeriodoItems(periodModalConfig.period, periodModalConfig.statusGroup);
                if (modalDateDesde) {
                  list = list.filter(s => s.date >= modalDateDesde);
                }
                if (modalDateHasta) {
                  list = list.filter(s => s.date <= modalDateHasta);
                }
                if (list.length === 0) {
                  return <div className="text-center py-10 text-slate-450">Ningún registro en este periodo con las fechas seleccionadas.</div>;
                }
                return renderPOSCustomTable(list, 'periodo');
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
      
       {/* HISTORIAL GENERAL DE SIM-CARDS REGISTRADAS (PORTAL MODAL) */}
      {showSimsModal && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in-overlay backdrop-blur-xs"
          onClick={closeAllModals}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-xl p-6 flex flex-col gap-4 shadow-xl max-h-[80vh] overflow-hidden animate-fade-in font-arial"
            style={{ borderRadius: '0px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CardSim size={18} className="text-black" />
                  Historial de SIM-Cards Registradas
                </h3>
                <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono">
                  Historial de Equipos + SIM-Cards Anuladas
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportSims}
                  className="text-white font-bold bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
                  style={{ borderRadius: '0px' }}
                >
                  <FileDown size={14} />
                  Exportar CSV
                </button>
                <button 
                  onClick={closeAllModals}
                  className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
                  style={{ borderRadius: '0px' }}
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {/* Date filter container */}
            {renderDateRangeFilter()}

            {/* BUSCADOR DENTRO DE LAS SIM-CARDS */}
            <div className="relative flex-shrink-0">
              <input
                type="text"
                value={simsSearchQuery}
                onChange={e => setSimsSearchQuery(e.target.value)}
                placeholder="BUSCAR POR SERIAL DE SIM-CARD O FUENTE"
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent text-slate-905 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
                style={{ borderRadius: '0px' }}
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-black" />
              {simsSearchQuery && (
                <button
                  onClick={() => setSimsSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-450 hover:text-red-655 cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* TABLA LISTADO DE SIMS */}
            <div className="overflow-y-auto pr-1 flex-1 font-arial">
              {(() => {
                const query = simsSearchQuery.toUpperCase().trim();
                let filteredSims = allSimsList.filter(s => 
                  s.serial.toUpperCase().includes(query) || 
                  s.source.toUpperCase().includes(query)
                );

                if (modalDateDesde) {
                  filteredSims = filteredSims.filter(s => s.date >= modalDateDesde);
                }
                if (modalDateHasta) {
                  filteredSims = filteredSims.filter(s => s.date <= modalDateHasta);
                }

                if (filteredSims.length === 0) {
                  return <div className="text-center py-10 text-slate-455 uppercase font-bold text-[11px] font-arial">No se encontraron seriales de SIM-Card.</div>;
                }

                return renderSIMOnlySerialsTable(filteredSims);
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ALL CLIENTS STATS PERIODICAL OVERLAY (PORTAL MODAL) */}
      {showAllClientesModal && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in-overlay backdrop-blur-xs"
          onClick={closeAllModals}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-4xl p-6 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-hidden animate-fade-in font-arial"
            style={{ borderRadius: '0px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Arial' }}>
                  <Users size={18} className="text-black" />
                  Desglose de Entregas por Clientes
                </h3>
                <p className="text-[10px] text-slate-450 mt-1 uppercase font-mono">
                  Métricas de equipos entregados por periodo de tiempo
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const query = clientesSearchQuery.toUpperCase().trim();
                    const filteredUsers = resolvedFilteredUsersDeliveryStats.clientes.filter(u => 
                      u.name.includes(query)
                    );
                    if (filteredUsers.length === 0) { alert("No hay datos para exportar."); return; }
                    const header = "sep=;\nCLIENTE;TOTAL\n";
                    const rows = filteredUsers.map(u => `"${u.name}";"${u.total}"`);
                    const csvContent = header + rows.join("\n");
                    downloadCSV(csvContent, `Desglose_Clientes_${new Date().toISOString().split('T')[0]}.csv`);
                  }}
                  className="text-white font-bold bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
                  style={{ borderRadius: '0px', fontFamily: 'Arial' }}
                >
                  <FileDown size={14} />
                  Exportar CSV
                </button>
                <button 
                  onClick={closeAllModals}
                  className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
                  style={{ borderRadius: '0px' }}
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {/* Date filter container */}
            {renderDateRangeFilter()}

            {/* Buscador de Clientes */}
            <div className="relative flex-shrink-0">
              <input
                type="text"
                value={clientesSearchQuery}
                onChange={e => setClientesSearchQuery(e.target.value)}
                placeholder="BUSCAR CLIENTE / REMITENTE..."
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent text-slate-905 uppercase placeholder-slate-450 font-bold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
                style={{ borderRadius: '0px' }}
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-black" />
              {clientesSearchQuery && (
                <button
                  onClick={() => setClientesSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-450 hover:text-red-650 cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tabla Tabular de Desglose de Tiempos */}
            <div className="overflow-auto border border-slate-200 flex-1 bg-slate-50" style={{ borderRadius: '0px' }}>
              <table className="w-full text-left border-collapse text-[13px] font-arial">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-black tracking-widest text-slate-600 uppercase sticky top-0 z-10">
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4 text-center font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(() => {
                    const query = clientesSearchQuery.toUpperCase().trim();
                    const filteredUsers = resolvedFilteredUsersDeliveryStats.clientes.filter(u => 
                      u.name.includes(query)
                    );

                    if (filteredUsers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={2} className="text-center py-10 text-slate-400 font-arial text-xs uppercase font-bold">No se encontraron clientes.</td>
                        </tr>
                      );
                    }

                    return filteredUsers.map((u, idx) => (
                      <tr 
                        key={u.name} 
                        onClick={() => {
                          setModalType('cliente');
                          setModalSelectedName(u.name);
                          setModalSearch('');
                          setDetailSelectedDate(null);
                          setShowAllClientesModal(false);
                        }}
                        className="hover:bg-slate-50 text-slate-805 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-extrabold select-all tracking-wider text-slate-900 flex items-center gap-2 text-[13px] font-arial">
                          <span className="text-[10px] text-slate-400 font-sans">#{idx + 1}</span>
                          <span className="uppercase">{u.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-[14px] text-emerald-800 bg-emerald-50/50 font-arial">{u.total}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ALL COLABORADORES STATS PERIODICAL OVERLAY (PORTAL MODAL) */}
      {showAllColaboradoresModal && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in-overlay backdrop-blur-xs"
          onClick={closeAllModals}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-4xl p-6 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-hidden animate-fade-in font-arial"
            style={{ borderRadius: '0px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Arial' }}>
                  <Users size={18} className="text-black" />
                  Desglose de Entregas por Usuarios Disglobal
                </h3>
                <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono">
                  Métricas de equipos entregados por periodo de tiempo
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const query = colaboradoresSearchQuery.toUpperCase().trim();
                    const filteredUsers = resolvedFilteredUsersDeliveryStats.colaboradores.filter(u => 
                      u.name.includes(query)
                    );
                    if (filteredUsers.length === 0) { alert("No hay datos para exportar."); return; }
                    const header = "sep=;\nCOLABORADOR;TOTAL\n";
                    const rows = filteredUsers.map(u => `"${u.name}";"${u.total}"`);
                    const csvContent = header + rows.join("\n");
                    downloadCSV(csvContent, `Desglose_Colaboradores_${new Date().toISOString().split('T')[0]}.csv`);
                  }}
                  className="text-white font-bold bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
                  style={{ borderRadius: '0px', fontFamily: 'Arial' }}
                >
                  <FileDown size={14} />
                  Exportar CSV
                </button>
                <button 
                  onClick={closeAllModals}
                  className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
                  style={{ borderRadius: '0px' }}
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {/* Date filter container */}
            {renderDateRangeFilter()}

            {/* Buscador de Colaboradores */}
            <div className="relative flex-shrink-0">
              <input
                type="text"
                value={colaboradoresSearchQuery}
                onChange={e => setColaboradoresSearchQuery(e.target.value)}
                placeholder="BUSCAR USUARIO DISGLOBAL / REMITENTE..."
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent text-slate-905 uppercase placeholder-slate-400 font-bold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
                style={{ borderRadius: '0px' }}
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-black" />
              {colaboradoresSearchQuery && (
                <button
                  onClick={() => setColaboradoresSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-455 hover:text-red-655 cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tabla Tabular de Desglose de Tiempos */}
            <div className="overflow-auto border border-slate-200 flex-1 bg-slate-50" style={{ borderRadius: '0px' }}>
              <table className="w-full text-left border-collapse text-[13px] font-arial">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-black tracking-widest text-slate-655 uppercase sticky top-0 z-10">
                    <th className="py-3.5 px-4">Usuario / Colaborador</th>
                    <th className="py-3.5 px-4 text-center font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(() => {
                    const query = colaboradoresSearchQuery.toUpperCase().trim();
                    const filteredUsers = resolvedFilteredUsersDeliveryStats.colaboradores.filter(u => 
                      u.name.includes(query)
                    );

                    if (filteredUsers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={2} className="text-center py-10 text-slate-400 font-arial text-xs uppercase font-bold">No se encontraron usuarios.</td>
                        </tr>
                      );
                    }

                    return filteredUsers.map((u, idx) => (
                      <tr 
                        key={u.name} 
                        onClick={() => {
                          setModalType('colaborador');
                          setModalSelectedName(u.name);
                          setModalSearch('');
                          setDetailSelectedDate(null);
                          setShowAllColaboradoresModal(false);
                        }}
                        className="hover:bg-slate-50 text-slate-805 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-extrabold select-all tracking-wider text-slate-900 flex items-center gap-2 text-[13px] font-arial">
                          <span className="text-[10px] text-slate-400 font-sans">#{idx + 1}</span>
                          <span className="uppercase">{u.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-[14px] text-slate-900 bg-slate-200/50 font-arial">{u.total}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* HISTORIAL CRONOLÓGICO DE MODELOS FÍSICOS (PORTAL MODAL) */}
      {showModelDatesModal && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in-overlay backdrop-blur-xs"
          onClick={closeAllModals}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-6xl p-6 flex flex-col gap-4 shadow-xl max-h-[80vh] overflow-hidden animate-fade-in font-arial"
            style={{ borderRadius: '0px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone size={18} className="text-black" />
                  Historial de Arribo por Modelos Físicos
                </h3>
                <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono">
                  Listado cronológico de ingresos agrupados por modelo físico
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const query = modelSearchQuery.toUpperCase().trim();
                    let filtered = physicalModelsArrivals.filter(s => 
                      s.serial.includes(query) ||
                      s.modeloName.toUpperCase().includes(query) ||
                      (s.remitente && s.remitente.toUpperCase().includes(query))
                    );
                    if (modalDateDesde) filtered = filtered.filter(s => s.date >= modalDateDesde);
                    if (modalDateHasta) filtered = filtered.filter(s => s.date <= modalDateHasta);
                    if (filtered.length === 0) { alert("No hay datos para exportar."); return; }
                    const { headers } = getPOSItemFields(filtered[0], 'modeloFisicoDates');
                    const header = "sep=;\n" + headers.join(";") + "\n";
                    const rows = filtered.map(s => {
                      const { values } = getPOSItemFields(s, 'modeloFisicoDates');
                      return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";");
                    });
                    const csvContent = header + rows.join("\n");
                    downloadCSV(csvContent, `Historial_ModelosFisicos_${new Date().toISOString().split('T')[0]}.csv`);
                  }}
                  className="text-white font-bold bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
                  style={{ borderRadius: '0px' }}
                >
                  <FileDown size={14} />
                  Exportar CSV
                </button>
                <button 
                  onClick={closeAllModals}
                  className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
                  style={{ borderRadius: '0px' }}
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {/* Date filter container */}
            {renderDateRangeFilter()}

            {/* Buscador dentro del modal de modelos físicos */}
            <div className="relative flex-shrink-0">
              <input
                type="text"
                value={modelSearchQuery}
                onChange={e => setModelSearchQuery(e.target.value)}
                placeholder="BUSCAR POR MODELO, SERIAL O REMITENTE..."
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent text-slate-905 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
                style={{ borderRadius: '0px' }}
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-black" />
              {modelSearchQuery && (
                <button
                  onClick={() => setModelSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-455 hover:text-red-655 cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Listado / Tabla */}
            <div className="overflow-y-auto pr-1 flex-1 font-arial">
              {(() => {
                const query = modelSearchQuery.toUpperCase().trim();
                let filtered = physicalModelsArrivals.filter(s => 
                  s.serial.includes(query) ||
                  s.modeloName.toUpperCase().includes(query) ||
                  (s.remitente && s.remitente.toUpperCase().includes(query))
                );

                if (modalDateDesde) {
                  filtered = filtered.filter(s => s.date >= modalDateDesde);
                }
                if (modalDateHasta) {
                  filtered = filtered.filter(s => s.date <= modalDateHasta);
                }

                if (filtered.length === 0) {
                  return <div className="text-center py-10 text-slate-450 uppercase font-bold text-[11px] font-arial">No se encontraron registros.</div>;
                }

                return renderPOSCustomTable(filtered, 'modeloFisicoDates');
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* HISTORIAL CRONOLÓGICO DE MODELOS DE NEGOCIO (PORTAL MODAL) */}
      {showBizModelDatesModal && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in-overlay backdrop-blur-xs"
          onClick={closeAllModals}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-6xl p-6 flex flex-col gap-4 shadow-xl max-h-[80vh] overflow-hidden animate-fade-in font-arial"
            style={{ borderRadius: '0px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={18} className="text-black" />
                  Historial de Arribo por Modelos de Negocio
                </h3>
                <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono">
                  Listado cronológico de ingresos agrupados por modelo de negocio
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const query = bizModelSearchQuery.toUpperCase().trim();
                    let filtered = bizModelsArrivals.filter(s => 
                      s.serial.includes(query) ||
                      s.bizModelName.toUpperCase().includes(query) ||
                      (s.remitente && s.remitente.toUpperCase().includes(query))
                    );
                    if (modalDateDesde) filtered = filtered.filter(s => s.date >= modalDateDesde);
                    if (modalDateHasta) filtered = filtered.filter(s => s.date <= modalDateHasta);
                    if (filtered.length === 0) { alert("No hay datos para exportar."); return; }
                    const { headers } = getPOSItemFields(filtered[0], 'modeloNegocioDates');
                    const header = "sep=;\n" + headers.join(";") + "\n";
                    const rows = filtered.map(s => {
                      const { values } = getPOSItemFields(s, 'modeloNegocioDates');
                      return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";");
                    });
                    const csvContent = header + rows.join("\n");
                    downloadCSV(csvContent, `Historial_ModelosNegocio_${new Date().toISOString().split('T')[0]}.csv`);
                  }}
                  className="text-white font-bold bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm border border-green-700"
                  style={{ borderRadius: '0px' }}
                >
                  <FileDown size={14} />
                  Exportar CSV
                </button>
                <button 
                  onClick={closeAllModals}
                  className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
                  style={{ borderRadius: '0px' }}
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {/* Date filter container */}
            {renderDateRangeFilter()}

            {/* Buscador dentro del modal de modelos de negocio */}
            <div className="relative flex-shrink-0">
              <input
                type="text"
                value={bizModelSearchQuery}
                onChange={e => setBizModelSearchQuery(e.target.value)}
                placeholder="BUSCAR POR MODELO DE NEGOCIO, SERIAL O REMITENTE..."
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent text-slate-905 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
                style={{ borderRadius: '0px' }}
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-black" />
              {bizModelSearchQuery && (
                <button
                  onClick={() => setBizModelSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-455 hover:text-red-655 cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Listado / Tabla */}
            <div className="overflow-y-auto pr-1 flex-1 font-arial">
              {(() => {
                const query = bizModelSearchQuery.toUpperCase().trim();
                let filtered = bizModelsArrivals.filter(s => 
                  s.serial.includes(query) ||
                  s.bizModelName.toUpperCase().includes(query) ||
                  (s.remitente && s.remitente.toUpperCase().includes(query))
                );

                if (modalDateDesde) {
                  filtered = filtered.filter(s => s.date >= modalDateDesde);
                }
                if (modalDateHasta) {
                  filtered = filtered.filter(s => s.date <= modalDateHasta);
                }

                if (filtered.length === 0) {
                  return <div className="text-center py-10 text-slate-450 uppercase font-bold text-[11px] font-arial">No se encontraron registros.</div>;
                }

                return renderPOSCustomTable(filtered, 'modeloNegocioDates');
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
