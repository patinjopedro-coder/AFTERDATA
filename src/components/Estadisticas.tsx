import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { POSItem, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { 
  BarChart3, Calendar, FileDown, Search, 
  Layers, Cpu, Smartphone, CardSim, Users, Compass, Check
} from 'lucide-react';

/* ── Custom POS icon with closed lock (Entregados) ── */
const PosLocked: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#0f766e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* POS terminal body */}
    <rect x="2" y="4" width="14" height="14" rx="2" stroke={color} strokeWidth="1.6" fill="none" />
    {/* Screen */}
    <rect x="4" y="6" width="10" height="5" rx="1" fill={color} opacity="0.25" />
    {/* Keypad dots */}
    <circle cx="5.5" cy="13" r="0.7" fill={color} />
    <circle cx="9" cy="13" r="0.7" fill={color} />
    <circle cx="12.5" cy="13" r="0.7" fill={color} />
    <circle cx="5.5" cy="16" r="0.7" fill={color} />
    <circle cx="9" cy="16" r="0.7" fill={color} />
    <circle cx="12.5" cy="16" r="0.7" fill={color} />
    {/* Closed lock – overlapping bottom-right */}
    <g transform="translate(12, 12)">
      {/* Lock shackle (closed arc) */}
      <path d="M2.5 4.5 V3 A2.5 2.5 0 0 0 -2.5 3 V4.5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Lock body */}
      <rect x="-3.5" y="4.5" width="7" height="5.5" rx="1.2" fill={color} />
      {/* Keyhole */}
      <circle cx="0" cy="7.2" r="1" fill="white" />
      <rect x="-0.5" y="8" width="1" height="1.2" fill="white" />
    </g>
  </svg>
);

/* ── Custom POS icon with open lock (Disponibles) ── */
const PosUnlocked: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#0f766e' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* POS terminal body */}
    <rect x="2" y="4" width="14" height="14" rx="2" stroke={color} strokeWidth="1.6" fill="none" />
    {/* Screen */}
    <rect x="4" y="6" width="10" height="5" rx="1" fill={color} opacity="0.25" />
    {/* Keypad dots */}
    <circle cx="5.5" cy="13" r="0.7" fill={color} />
    <circle cx="9" cy="13" r="0.7" fill={color} />
    <circle cx="12.5" cy="13" r="0.7" fill={color} />
    <circle cx="5.5" cy="16" r="0.7" fill={color} />
    <circle cx="9" cy="16" r="0.7" fill={color} />
    <circle cx="12.5" cy="16" r="0.7" fill={color} />
    {/* Open lock – overlapping bottom-right, shackle swung open to the right */}
    <g transform="translate(12, 12)">
      {/* Open shackle – right side open/raised */}
      <path d="M-2.5 4.5 V3 A2.5 2.5 0 0 1 2.5 3 V1" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Lock body */}
      <rect x="-3.5" y="4.5" width="7" height="5.5" rx="1.2" fill={color} />
      {/* Keyhole */}
      <circle cx="0" cy="7.2" r="1" fill="white" />
      <rect x="-0.5" y="8" width="1" height="1.2" fill="white" />
    </g>
  </svg>
);

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

interface EstadisticasProps {
  serials: POSItem[];
  modelosDB: Record<string, ModelConfig>;
  onUserClick: (remitente: string) => void;
  usersProfiles: Record<string, import('../types').UserProfile>;
  simCardBatches?: any[];
}

export const Estadisticas: React.FC<EstadisticasProps> = ({
  serials,
  modelosDB,
  onUserClick,
  usersProfiles,
  simCardBatches = []
}) => {
  const [modalType, setModalType] = useState<'total' | 'disponibles' | 'entregados' | 'android' | 'linux' | 'manual_cruce' | 'zoom' | 'cliente' | 'colaborador' | 'modeloFisico' | 'modeloNegocio' | 'departamento' | null>(null);
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
    await navigator.clipboard.writeText(text);
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
  };

  const renderDateRangeFilter = () => (
    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-arial flex-shrink-0">
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
          className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-slate-500 font-bold text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500 font-bold uppercase font-mono text-[9px]">Hasta</span>
        <input
          type="date"
          value={modalDateHasta}
          onChange={e => setModalDateHasta(e.target.value)}
          className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-slate-500 font-bold text-xs"
        />
      </div>
      {(modalDateDesde || modalDateHasta) && (
        <button
          onClick={() => { setModalDateDesde(''); setModalDateHasta(''); }}
          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg border border-red-200 cursor-pointer text-[10px] uppercase font-mono"
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
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

    let csv = "sep=,\nSERIAL,MODELO,SO,ESTADO,REMITENTE,RIF,RAZON_SOCIAL,TICKET,FECHA\n";
    items.forEach(s => {
      const m = getTerminalModel(s.serial, modelosDB);
      csv += `"${s.serial}","${m.modelo}","${m.so}","${s.status}","${s.remitente}","${s.rif || ''}","${s.razonSocial || ''}","${s.ticket || ''}","${s.date}"\n`;
    });

    const filterSuffix = exportCasilleroFilter === 'no-casillero' ? '_sin_casillero' : exportCasilleroFilter === 'only-casillero' ? '_solo_casillero' : '';
    downloadCSV(csv, `informe_${statusGroup}_${period}_${hoyStr}${filterSuffix}.csv`);
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

  // Areas distribution counts
  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    serials.forEach(s => {
      // Filter by casillero option
      if (exportCasilleroFilter === 'no-casillero' && s.isCasillero) return;
      if (exportCasilleroFilter === 'only-casillero' && !s.isCasillero) return;
      if (!s.remitente) return;

      const remKey = s.remitente.toUpperCase().trim();
      const p = usersProfiles[remKey];
      // Check if remitente is User and has an area
      if (p && p.isUsuario && p.area && p.area.trim() !== '') {
        const areaUp = p.area.toUpperCase().trim();
        counts[areaUp] = (counts[areaUp] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [serials, usersProfiles, exportCasilleroFilter]);

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
    const header = "sep=,\nSERIAL,MODELO,SO,ESTATUS,REMITENTE,CLIENTE_RAZON_SOCIAL,TICKET,GUIA_ENTRADA,DESTINO,FECHA_INGRESO";
    const rows = modalList.map(s => {
      const m = getTerminalModel(s.serial, modelosDB);
      return [
        s.serial,
        m.modelo,
        m.so,
        s.status || 'SIN ESTATUS',
        s.remitente || '',
        s.razonSocial || '',
        s.ticket || '',
        s.source || '',
        s.destino || '',
        s.displayDate || s.date || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csvContent = [header, ...rows].join("\n");
    downloadCSV(csvContent, `Exportacion_${modalType}_${new Date().toISOString().split('T')[0]}.csv`);
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

        const monthNum = parseInt(s.date.split('-')[1], 10);
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

  return (
    <div className="flex flex-col gap-6 text-black pb-16 estadisticas-tab-container font-arial">
      
      {/* SECCIÓN 1: CONTADORES TÉCNICOS (TOP KPI CARDS IN MOCKUP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: TOTAL RECIBIDOS & TOTAL SIM-CARDS */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div 
            onClick={() => { setModalType('total'); setModalSearch(''); }}
            className="bg-white text-black rounded-2xl p-6 hover:border-slate-350 transition-all cursor-pointer shadow-sm flex flex-col justify-between h-[216px] relative border border-slate-200"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-black" style={{ color: '#000000' }}>TOTAL RECIBIDOS</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#ccfbf1' }}>
                <Layers size={18} style={{ color: '#0f766e' }} />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center my-2">
              <div className="text-[5.5rem] font-black font-sans leading-none tracking-tighter text-black select-all" style={{ color: '#000000' }}>
                {totalCount}
              </div>
            </div>
            <div className="text-[10px] text-black font-bold" style={{ color: '#000000' }}>
              +{serials.filter(s => s.date && (Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000) <= 7)).length} últimos 7 días
            </div>
          </div>

          {/* BOTÓN TOTAL SIM-CARDS HISTÓRICO */}
          <button
            onClick={() => { setShowSimsModal(true); setSimsSearchQuery(''); }}
            className="w-full h-[80px] bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-350 transition-all flex items-center justify-between p-5 cursor-pointer stats-sims-btn"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#eff6ff' }}>
                <CardSim size={18} style={{ color: '#2563eb' }} />
              </div>
              <div className="text-left">
                <div className="text-[12px] font-extrabold uppercase tracking-widest text-black" style={{ color: '#000000', fontFamily: 'Arial' }}>SIM-Cards</div>
                <div className="text-[9px] text-black font-bold uppercase mt-0.5 font-mono" style={{ color: '#000000' }}>REGISTRADAS HISTÓRICAMENTE</div>
              </div>
            </div>
            <div className="text-3xl font-black font-sans text-black" style={{ color: '#000000' }}>
              {totalSimCards}
            </div>
          </button>
        </div>

        {/* COLUMNA 2: ANDROID (TOP) & ENTREGADOS (BOTTOM) */}
        <div className="flex flex-col gap-6">
          {/* CARD 2: ANDROID CARD */}
          <div 
            onClick={() => { setModalType('android'); setModalSearch(''); }}
            className="bg-white text-black rounded-2xl p-6 hover:border-slate-350 transition-all cursor-pointer shadow-sm flex flex-col justify-between h-36 relative border border-slate-200"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-black" style={{ color: '#000000' }}>EQUIPOS ANDROID</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#ccfbf1' }}>
                <Smartphone size={18} style={{ color: '#0f766e' }} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black font-sans leading-none tracking-tight text-black" style={{ color: '#000000' }}>{androidCount}</div>
            </div>
          </div>

          {/* CARD 4: ENTREGADOS CARD */}
          <div 
            onClick={() => { setModalType('entregados'); setModalSearch(''); }}
            className="bg-white text-black rounded-2xl p-6 hover:border-slate-350 transition-all cursor-pointer shadow-sm flex flex-col justify-between h-36 relative border border-slate-200"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-black" style={{ color: '#000000' }}>EQUIPOS ENTREGADOS</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#ccfbf1' }}>
                <PosLocked size={20} color="#0f766e" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black font-sans leading-none tracking-tight text-black" style={{ color: '#000000' }}>{entregadosCount}</div>
            </div>
          </div>
        </div>

        {/* COLUMNA 3: LINUX (TOP) & DISPONIBLES (BOTTOM) */}
        <div className="flex flex-col gap-6">
          {/* CARD 3: LINUX CARD */}
          <div 
            onClick={() => { setModalType('linux'); setModalSearch(''); }}
            className="bg-white text-black rounded-2xl p-6 hover:border-slate-350 transition-all cursor-pointer shadow-sm flex flex-col justify-between h-36 relative border border-slate-200"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-black" style={{ color: '#000000' }}>EQUIPOS LINUX</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#ccfbf1' }}>
                <svg className="w-[18px] h-[18px]" style={{ color: '#0f766e' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <line x1="10" y1="4" x2="14" y2="4" />
                  <circle cx="8" cy="15" r="0.75" fill="currentColor" />
                  <circle cx="12" cy="15" r="0.75" fill="currentColor" />
                  <circle cx="16" cy="15" r="0.75" fill="currentColor" />
                  <circle cx="8" cy="18" r="0.75" fill="currentColor" />
                  <circle cx="12" cy="18" r="0.75" fill="currentColor" />
                  <circle cx="16" cy="18" r="0.75" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black font-sans leading-none tracking-tight text-black" style={{ color: '#000000' }}>{linuxCount}</div>
            </div>
          </div>

          {/* CARD 5: DISPONIBLES CARD */}
          <div 
            onClick={() => { setModalType('disponibles'); setModalSearch(''); }}
            className="bg-white text-black rounded-2xl p-6 hover:border-slate-350 transition-all cursor-pointer shadow-sm flex flex-col justify-between h-36 relative border border-slate-200"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-black" style={{ color: '#000000' }}>EQUIPOS DISPONIBLES</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#ccfbf1' }}>
                <PosUnlocked size={20} color="#0f766e" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black font-sans leading-none tracking-tight text-black" style={{ color: '#000000' }}>{disponiblesCount}</div>
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN 1.2: CANALES DE INGRESO DE EQUIPOS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="font-bold text-xs tracking-widest uppercase text-black flex items-center gap-1.5" style={{ color: '#000000' }}>
            <Layers className="w-4.5 h-4.5" style={{ color: '#2563eb' }} />
            Canales de Ingreso de Equipos (Filtro por Canal)
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 font-mono">
            BASE TOTAL: {totalCount} EQUIPOS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CANAL 1: CRUCE DE SERIALES / USUARIOS */}
          <div 
            onClick={() => { setModalType('manual_cruce'); setModalSearch(''); }}
            className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 flex flex-col justify-between gap-3 shadow-xs cursor-pointer hover:border-blue-300 transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider">Cruce de Seriales (Usuarios Disglobal)</span>
                <h5 className="text-2xl font-black text-slate-800 mt-1">
                  {intakeStats.manual_cruce.total}{" "}
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    ({totalCount > 0 ? Math.round((intakeStats.manual_cruce.total / totalCount) * 100) : 0}%)
                  </span>
                </h5>
              </div>
              <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Usuarios</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1 border-t border-blue-100/50 pt-2 text-[10px] font-bold text-slate-650">
              <div>
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-mono">Disponibles</span>
                <span className="text-green-600 font-black text-xs">{intakeStats.manual_cruce.disponibles}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-mono">Entregados</span>
                <span className="text-orange-500 font-black text-xs">{intakeStats.manual_cruce.entregados}</span>
              </div>
            </div>
          </div>

          {/* CANAL 2: ENVÍOS VÍA ZOOM / CLIENTES */}
          <div 
            onClick={() => { setModalType('zoom'); setModalSearch(''); }}
            className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 flex flex-col justify-between gap-3 shadow-xs cursor-pointer hover:border-amber-300 transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider">Recibidos Vía Zoom (Clientes)</span>
                <h5 className="text-2xl font-black text-slate-800 mt-1">
                  {intakeStats.zoom.total}{" "}
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    ({totalCount > 0 ? Math.round((intakeStats.zoom.total / totalCount) * 100) : 0}%)
                  </span>
                </h5>
              </div>
              <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Clientes</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1 border-t border-amber-100/50 pt-2 text-[10px] font-bold text-slate-650">
              <div>
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-mono">Disponibles</span>
                <span className="text-green-600 font-black text-xs">{intakeStats.zoom.disponibles}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-mono">Entregados</span>
                <span className="text-orange-500 font-black text-xs">{intakeStats.zoom.entregados}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1.6: TOP 5 COLABORADORES */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 border-t-4 border-t-blue-500 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase text-black flex items-center gap-1.5" style={{ color: '#000000' }}>
              <Users className="w-4.5 h-4.5" style={{ color: '#3b82f6' }} />
              TOP 5 USUARIOS DISGLOBAL CON MAYOR ENTREGAS
            </h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 font-mono">COLABORADORES QUE MÁS DISPOSITIVOS HAN INGRESADO/ENTREGADO</p>
          </div>
          <button
            onClick={() => setShowAllColaboradoresModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white-force rounded-xl text-xs font-extrabold uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-none"
          >
            <Layers size={13} />
            <span>Ver Desglose Completo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {top5Colaboradores.length === 0 ? (
            <div className="col-span-5 text-center py-6 text-slate-400 font-mono text-xs">No hay entregas registradas todavía para colaboradores.</div>
          ) : (
            top5Colaboradores.map((u, idx) => (
              <div 
                key={u.name} 
                onClick={() => { setModalType('colaborador'); setModalSelectedName(u.name); setModalSearch(''); }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-2 hover:border-slate-350 cursor-pointer transition-all shadow-xs relative"
              >
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-slate-200/80 flex items-center justify-center text-[9px] font-black font-sans text-slate-600">
                  #{idx + 1}
                </div>
                <div className="pr-6">
                  <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">COLABORADOR</div>
                  <div className="text-xs font-black text-black truncate uppercase font-arial mt-0.5" style={{ color: '#000000' }} title={u.name}>{u.name}</div>
                </div>
                <div className="mt-2">
                  <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">TOTAL ENTREGAS</div>
                  <div className="text-xl font-black font-sans text-blue-600" style={{ color: '#3b82f6' }}>{u.total}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 1.5: TOP 5 CLIENTES */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 border-t-4 border-t-green-500 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase text-black flex items-center gap-1.5" style={{ color: '#000000' }}>
              <Users className="w-4.5 h-4.5" style={{ color: '#16a34a' }} />
              TOP 5 CLIENTES CON MAYOR ENTREGAS
            </h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 font-mono">CLIENTES QUE MÁS DISPOSITIVOS HAN INGRESADO/ENTREGADO</p>
          </div>
          <button
            onClick={() => setShowAllClientesModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white-force rounded-xl text-xs font-extrabold uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-none"
          >
            <Layers size={13} />
            <span>Ver Desglose Completo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {top5Clientes.length === 0 ? (
            <div className="col-span-5 text-center py-6 text-slate-400 font-mono text-xs">No hay entregas registradas todavía para clientes.</div>
          ) : (
            top5Clientes.map((u, idx) => (
              <div 
                key={u.name} 
                onClick={() => { setModalType('cliente'); setModalSelectedName(u.name); setModalSearch(''); }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-2 hover:border-slate-350 cursor-pointer transition-all shadow-xs relative"
              >
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-slate-200/80 flex items-center justify-center text-[9px] font-black font-sans text-slate-600">
                  #{idx + 1}
                </div>
                <div className="pr-6">
                  <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">CLIENTE</div>
                  <div className="text-xs font-black text-black truncate uppercase font-arial mt-0.5" style={{ color: '#000000' }} title={u.name}>{u.name}</div>
                </div>
                <div className="mt-2">
                  <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">TOTAL ENTREGAS</div>
                  <div className="text-xl font-black font-sans text-emerald-600" style={{ color: '#16a34a' }}>{u.total}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 2: GRID DE GRÁFICOS (LINE CHART + DOUGHNUT CHART IN MOCKUP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART WIDE: PERFORMANCE DE INGRESOS */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-xs tracking-widest uppercase text-black" style={{ color: '#000000' }}>
                Rendimiento de Ingresos (Flujo Mensual)
              </h4>
            </div>
          </div>

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

              {/* Dots and Tooltips */}
              {totalPoints.map((p, i) => (
                <g key={i} className="cursor-pointer group">
                  <circle cx={p.x} cy={p.y} r="4" fill="#0d9488" stroke="white" strokeWidth="1.5" />
                  <title>Total: {chartData[i].total}</title>
                </g>
              ))}
              {androidPoints.map((p, i) => (
                <g key={i} className="cursor-pointer group">
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />
                  <title>Android: {chartData[i].android}</title>
                </g>
              ))}
              {linuxPoints.map((p, i) => (
                <g key={i} className="cursor-pointer group">
                  <circle cx={p.x} cy={p.y} r="3" fill="#8b5cf6" stroke="white" strokeWidth="1" />
                  <title>Linux: {chartData[i].linux}</title>
                </g>
              ))}
            </svg>
          </div>

          {/* Chart Legends */}
          <div className="flex gap-4 justify-center items-center text-[10px] font-bold uppercase tracking-widest mt-2 border-t border-slate-100 pt-3" style={{ color: '#000000' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#0d9488' }}></span>
              <span>Total POS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#0ea5e9' }}></span>
              <span>Android</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#8b5cf6' }}></span>
              <span>Linux</span>
            </div>
          </div>
        </div>

        {/* DOUGHNUT NARROW: CATEGORIAS MAS POPULARES */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-xs tracking-widest uppercase text-black" style={{ color: '#000000' }}>
              Distribución por SO
            </h4>
          </div>

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
                     strokeLinecap="round"
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
                     strokeLinecap="round"
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
                     strokeLinecap="round"
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
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }}></span>
                <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Android</span>
              </div>
              <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{androidCount} ({totalCount > 0 ? Math.round((androidCount / totalCount) * 100) : 0}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#64748b' }}></span>
                <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Linux</span>
              </div>
              <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{linuxCount} ({totalCount > 0 ? Math.round((linuxCount / totalCount) * 100) : 0}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#000000' }}></span>
                <span style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>Desconocidos</span>
              </div>
              <span className="font-mono text-[14px]" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>{totalCount - androidCount - linuxCount} ({totalCount > 0 ? Math.round(((totalCount - androidCount - linuxCount) / totalCount) * 100) : 0}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN 3: CONTROL DE HISTÓRICOS Y PERIODOS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col gap-5 shadow-sm">
        <div className="flex items-center flex-wrap gap-4 border-b border-slate-100 pb-3">
          <h4 className="font-bold text-xs tracking-widest uppercase text-black flex items-center gap-1.5 shrink-0" style={{ color: '#000000' }}>
            <Calendar className="w-4.5 h-4.5" style={{ color: '#0d9488' }} />
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
              className="text-xs p-1 bg-slate-50 border border-slate-250 rounded-lg text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer font-arial"
            >
              <option value="all">TODOS LOS EQUIPOS (CON CASILLERO)</option>
              <option value="no-casillero">SOLO GESTIÓN GENERAL (SIN CASILLERO)</option>
              <option value="only-casillero">SOLO CASILLERO</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* PANEL: INGRESOS ENTREGADOS */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="font-bold text-[11px] tracking-wider uppercase text-black flex items-center gap-1.5" style={{ color: '#000000' }}>
                <Users className="w-3.5 h-3.5 text-orange-500" />
                Historial Entregados
              </h5>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {(['hoy', 'semana', 'quincena', 'mes', 'trimestre', 'anual'] as const).map(p => (
                <div key={p} className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col items-center justify-between gap-1.5 text-center group transition-all hover:border-slate-350">
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
                    className="w-full mt-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded border border-orange-600 text-[9px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileDown size={10} />
                    <span>EXP</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL: INGRESOS DISPONIBLES */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="font-bold text-[11px] tracking-wider uppercase text-black flex items-center gap-1.5" style={{ color: '#000000' }}>
                <Smartphone className="w-3.5 h-3.5 text-green-600" />
                Historial Disponibles
              </h5>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {(['hoy', 'semana', 'quincena', 'mes', 'trimestre', 'anual'] as const).map(p => (
                <div key={p} className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col items-center justify-between gap-1.5 text-center group transition-all hover:border-slate-350">
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
                    className="w-full mt-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded border border-green-700 text-[9px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileDown size={10} />
                    <span>EXP</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL: INGRESOS TOTALES */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="font-bold text-[11px] tracking-wider uppercase text-black flex items-center gap-1.5" style={{ color: '#000000' }}>
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Historial Totales
              </h5>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {(['hoy', 'semana', 'quincena', 'mes', 'trimestre', 'anual'] as const).map(p => (
                <div key={p} className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col items-center justify-between gap-1.5 text-center group transition-all hover:border-slate-350">
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
                    className="w-full mt-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-700 text-[9px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h4 className="font-bold uppercase text-black text-[16px] font-arial" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '16px' }}>
              Distribución por Modelo Físico
            </h4>
            <button
              onClick={() => { setShowModelDatesModal(true); setModelSearchQuery(''); }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold uppercase transition-colors border border-slate-200 cursor-pointer shadow-sm flex items-center gap-1"
            >
              <Calendar size={11} />
              <span>Ver por Fechas</span>
            </button>
          </div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
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
                    className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:border-slate-350 transition-colors cursor-pointer"
                  >
                    <span className="text-[14px] font-bold text-black truncate uppercase font-arial" style={{ fontSize: '14px', fontFamily: 'Arial', color: '#000000' }}>{name}</span>
                    <span className="text-[14px] bg-slate-200 text-black font-mono px-2 py-0.5 rounded-lg flex-shrink-0 font-bold font-arial" style={{ fontSize: '14px', fontFamily: 'Arial', color: '#000000' }}>{count}</span>
                  </div>
                ));
            })()}
          </div>
        </div>

        {/* Modelos de Negocio Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h4 className="font-bold uppercase text-black text-[16px] font-arial" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '16px' }}>
              Distribución por Modelo de Negocio
            </h4>
            <button
              onClick={() => { setShowBizModelDatesModal(true); setBizModelSearchQuery(''); }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold uppercase transition-colors border border-slate-200 cursor-pointer shadow-sm flex items-center gap-1"
            >
              <Calendar size={11} />
              <span>Ver por Fechas</span>
            </button>
          </div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {[
              { label: 'BÁSICO', count: serials.filter(s => s.modeloNegocio === 'BASICO').length },
              { label: 'COMODATO', count: serials.filter(s => s.modeloNegocio === 'COMODATO').length },
              { label: 'SIN ASIGNAR', count: serials.filter(s => !s.modeloNegocio).length }
            ].map(({ label, count }) => (
              <div 
                key={label} 
                onClick={() => { setModalType('modeloNegocio'); setModalSelectedName(label); setModalSearch(''); }}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:border-slate-350 transition-colors cursor-pointer"
              >
                <span className="text-[14px] font-bold text-black truncate uppercase font-arial" style={{ fontSize: '14px', fontFamily: 'Arial', color: '#000000' }}>{label}</span>
                <span className="text-[14px] bg-slate-200 text-black font-mono px-2 py-0.5 rounded-lg flex-shrink-0 font-bold font-arial" style={{ fontSize: '14px', fontFamily: 'Arial', color: '#000000' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por Departamento (Usuarios) Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h4 className="font-bold uppercase text-black text-[16px] font-arial" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '16px' }}>
              Distribución por Departamento (Usuarios)
            </h4>
          </div>

          {areaCounts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-xs uppercase font-bold flex-1 flex items-center justify-center">
              No hay registros de departamentos.
            </div>
          ) : (
            <>
              {/* SVG Doughnut chart */}
              <div className="flex items-center justify-center py-1 relative">
                <div className="relative">
                  <svg width="120" height="120" viewBox="0 0 100 100" className="mx-auto select-none overflow-visible">
                    {/* Circle background */}
                    <circle cx="50" cy="50" r="36" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                    
                    {/* Segments */}
                    {(() => {
                      const circ = 226.195;
                      const totalAreaCount = areaCounts.reduce((acc, curr) => acc + curr[1], 0);
                      let accumulatedLength = 0;
                      
                      return areaCounts.map(([label, count], index) => {
                        const percentage = totalAreaCount > 0 ? (count / totalAreaCount) : 0;
                        const strokeLength = percentage * circ;
                        const strokeOffset = -accumulatedLength;
                        accumulatedLength += strokeLength;
                        const color = DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];

                        if (strokeLength <= 0) return null;
                        
                        return (
                          <circle 
                            key={label}
                            cx="50" 
                            cy="50" 
                            r="36" 
                            fill="transparent" 
                            stroke={color} 
                            strokeWidth="12" 
                            strokeDasharray={`${strokeLength} ${circ - strokeLength}`} 
                            strokeDashoffset={strokeOffset} 
                            transform="rotate(-90 50 50)" 
                            strokeLinecap="round"
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => { setModalType('departamento'); setModalSelectedName(label); setModalSearch(''); }}
                            title={`${label}: ${count}`}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Doughnut center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none mt-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold leading-none" style={{ color: '#000000' }}>Total</span>
                    <span className="text-lg font-black font-sans tracking-tight" style={{ color: '#000000' }}>
                      {areaCounts.reduce((acc, curr) => acc + curr[1], 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doughnut Legends */}
              <div className="flex flex-col gap-1.5 text-[14px] font-bold uppercase tracking-wider mt-1 border-t border-slate-100 pt-3 max-h-[120px] overflow-y-auto pr-1" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>
                {(() => {
                  const totalAreaCount = areaCounts.reduce((acc, curr) => acc + curr[1], 0);
                  return areaCounts.map(([label, count], index) => {
                    const color = DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
                    const percentage = totalAreaCount > 0 ? Math.round((count / totalAreaCount) * 100) : 0;
                    return (
                      <div 
                        key={label} 
                        onClick={() => { setModalType('departamento'); setModalSelectedName(label); setModalSearch(''); }}
                        className="flex justify-between items-center hover:bg-slate-50 hover:border-slate-100 border border-transparent rounded-lg p-1.5 px-2 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                          <span className="truncate" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }} title={label}>{label}</span>
                        </div>
                        <span className="font-mono text-[14px] shrink-0" style={{ color: '#000000', fontFamily: 'Arial', fontSize: '14px' }}>
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

      {/* SECCIÓN 5: RECENT CUSTOMERS / REGISTRO COMPLETO TABULAR */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h4 className="font-black text-xs text-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#000000' }}>
            <BarChart3 className="w-4.5 h-4.5" style={{ color: '#0d9488' }} />
            Tabla General de Registro y Control
          </h4>

          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-[10px] font-bold rounded-lg cursor-pointer text-slate-700 transition-colors pagination-btn"
            >
              ATRÁS
            </button>
            <span className="text-xs font-mono text-slate-400 font-bold">Pág {currentPage} de {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-[10px] font-bold rounded-lg cursor-pointer text-slate-700 transition-colors pagination-btn"
            >
              SIGUIENTE
            </button>
          </div>
        </div>

        <div className="overflow-x-auto text-[11px] font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9px] text-slate-400 font-black tracking-widest uppercase">
                <th className="py-3 px-4">Serial Terminal</th>
                <th className="py-3 px-4">Modelo POS</th>
                <th className="py-3 px-4 w-36">Estado Actual</th>
                <th className="py-3 px-4">Remitente Origen</th>
                <th className="py-3 px-4 w-32">Destino</th>
                <th className="py-3 px-4 w-32">Fecha Ingreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {paginatedAll.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-mono">No hay seriales en la base de datos local.</td>
                </tr>
              ) : (
                paginatedAll.map(s => {
                  const m = getTerminalModel(s.serial, modelosDB);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 text-black">
                      <td className="py-3 px-4 font-bold select-all tracking-wider text-black">
                        {s.serial}
                      </td>
                      <td className="py-3 px-4 uppercase font-sans text-black">
                        {m.modelo}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider block text-center w-28 ${getStatusStyle(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase font-sans text-black font-semibold">
                        <span 
                          onClick={() => onUserClick(s.remitente)}
                          className="cursor-pointer hover:text-black hover:underline flex items-center gap-1"
                        >
                          {s.remitente}
                          {usersProfiles[s.remitente] && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-350" title="Perfil asociado"></span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase font-sans text-black">{s.destino || '-'}</td>
                      <td className="py-3 px-4 text-black">{s.displayDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {modalType && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in-overlay backdrop-blur-xs"
          onClick={closeAllModals}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider">
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
                           modalType === 'departamento' ? `EQUIPOS - DEPARTAMENTO: ${modalSelectedName}` : ''}
                </h3>
                <p className="text-[11px] text-slate-450 mt-1 font-mono">
                  Encontrados: {modalList.length} registros para este enfoque.
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={exportModalDataToCSV}
                  className="text-white font-bold bg-green-600 hover:bg-green-700 rounded border border-green-700 px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileDown size={14} />
                  Exportar a Excel
                </button>
                <button 
                  onClick={closeAllModals}
                  className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 px-2.5 py-1 text-xs cursor-pointer transition-colors"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {/* Date filter container */}
            {renderDateRangeFilter()}

            {/* Modal search bar */}
            <div className="relative flex-shrink-0">
              <input
                type="text"
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                placeholder="Filtrar por serial, remitente, cliente RIF..."
                className="w-full text-xs p-2.5 pl-8 bg-white border border-slate-350 rounded-lg text-slate-800 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
              <Search size={14} className="absolute left-2.5 top-3.5" style={{ color: '#0d9488' }} />
            </div>

            <div className="overflow-y-auto pr-1 flex-1 font-arial text-[13px] flex flex-col gap-2">
              {modalList.length === 0 ? (
                <div className="text-center py-10 text-slate-450">Ningún registro coincide con el filtro del modal.</div>
              ) : (
                modalList.map(s => {
                  const m = getTerminalModel(s.serial, modelosDB);
                  return (
                    <div key={s.id} className="py-3 px-4 hover:bg-slate-100/70 bg-slate-50/50 border border-slate-200/60 rounded-xl flex justify-between items-center gap-4 transition-all">
                      <div className="flex flex-col gap-1">
                        <span 
                          className="text-[14px] font-extrabold text-slate-900 select-all tracking-wider font-arial cursor-pointer hover:text-slate-600 transition-colors flex items-center gap-1"
                          onClick={(e) => { e.stopPropagation(); handleCopyText(s.serial, `modal-serial-${s.id}`); }}
                          title="Click para copiar"
                        >
                          {s.serial}
                          {copiedKey === `modal-serial-${s.id}` && (
                            <span className="inline-flex items-center justify-center bg-emerald-600 border border-emerald-500 rounded p-0.5 ml-1 transition-all animate-fade-in shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600 font-medium font-arial">
                          <span className="bg-slate-200/70 text-slate-800 px-1.5 py-0.5 rounded font-bold uppercase">{m.modelo}</span>
                          {s.razonSocial && (
                            <span className="text-slate-700">Cliente: <span className="font-bold">{s.razonSocial}</span></span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider block text-center ${getStatusStyle(s.status)}`}>
                          {s.status}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 font-arial">Ingreso: {s.displayDate}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 flex flex-col gap-4 shadow-xl max-h-[80vh] overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider">
                  {periodModalConfig.statusGroup === 'entregados' 
                    ? 'HISTORIAL DE EQUIPOS ENTREGADOS' 
                    : 'HISTORIAL DE EQUIPOS DISPONIBLES'}
                </h3>
                <p className="text-[10px] text-slate-450 mt-1 uppercase font-mono">
                  Rango: {periodModalConfig.period}
                </p>
              </div>
              <button 
                onClick={closeAllModals}
                className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 rounded text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Date filter container */}
            {renderDateRangeFilter()}

            <div className="overflow-y-auto pr-1 flex-1 font-arial text-[13px] flex flex-col gap-2">
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
                return list.map(s => {
                  const m = getTerminalModel(s.serial, modelosDB);
                  return (
                    <div key={s.id} className="py-3 px-4 hover:bg-slate-100/70 bg-slate-50/50 border border-slate-200/60 rounded-xl flex justify-between items-center gap-4 transition-all">
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-extrabold text-slate-900 select-all tracking-wider font-arial">{s.serial}</span>
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600 font-medium font-arial">
                          <span className="bg-slate-200/70 text-slate-800 px-1.5 py-0.5 rounded font-bold uppercase">{m.modelo}</span>
                          {s.remitente && (
                            <span className="text-slate-700">Remitente: <span className="font-bold">{s.remitente}</span></span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider block text-center ${getStatusStyle(s.status)}`}>
                          {s.status}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 font-arial">{s.displayDate}</span>
                      </div>
                    </div>
                  );
                });
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
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 flex flex-col gap-4 shadow-xl max-h-[80vh] overflow-hidden animate-fade-in font-arial"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CardSim size={18} className="text-blue-600 animate-pulse" />
                  Historial de SIM-Cards Registradas
                </h3>
                <p className="text-[10px] text-slate-450 mt-1 uppercase font-mono">
                  Historial de Equipos + SIM-Cards Anuladas
                </p>
              </div>
              <button 
                onClick={closeAllModals}
                className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 rounded text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
              >
                Cerrar ✕
              </button>
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
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent rounded-xl text-slate-900 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-slate-455" />
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
            <div className="overflow-y-auto pr-1 flex-1 font-arial text-[13px] bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
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
                  return <div className="text-center py-10 text-slate-450 uppercase font-bold text-[11px] font-arial">No se encontraron seriales de SIM-Card.</div>;
                }

                return filteredSims.map((s, idx) => (
                  <div key={s.id} className="py-3 px-4 hover:bg-slate-100/70 bg-white border border-slate-200/60 rounded-xl flex justify-between items-center gap-4 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-extrabold text-slate-900 select-all tracking-wider font-arial">{s.serial}</span>
                      <span className="text-[12px] text-slate-600 font-medium font-arial uppercase">{s.source}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider block text-center ${
                        s.status === 'ANULADA'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : ['DISPONIBLE', 'CANCELADO', 'RECUPERADO', 'N#A'].includes(s.status.toUpperCase())
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-orange-100 text-orange-850 border border-orange-200'
                      }`}>
                        {s.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 font-arial">{s.date}</span>
                    </div>
                  </div>
                ));
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
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-hidden animate-fade-in font-arial"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users size={18} className="text-emerald-600" style={{ color: '#16a34a' }} />
                  Desglose de Entregas por Clientes
                </h3>
                <p className="text-[10px] text-slate-450 mt-1 uppercase font-mono">
                  Métricas de equipos entregados por periodo de tiempo
                </p>
              </div>
              <button 
                onClick={closeAllModals}
                className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 rounded text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
              >
                Cerrar ✕
              </button>
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
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent rounded-xl text-slate-900 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-slate-455" />
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
            <div className="overflow-auto border border-slate-200 rounded-xl flex-1 bg-slate-50">
              <table className="w-full text-left border-collapse text-[13px] font-arial">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-black tracking-widest text-slate-600 uppercase sticky top-0 z-10">
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4 text-center">Día</th>
                    <th className="py-3.5 px-4 text-center">Semana</th>
                    <th className="py-3.5 px-4 text-center">Mes</th>
                    <th className="py-3.5 px-4 text-center">Trimestre</th>
                    <th className="py-3.5 px-4 text-center">Semestre</th>
                    <th className="py-3.5 px-4 text-center">Año</th>
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
                          <td colSpan={8} className="text-center py-10 text-slate-400 font-arial text-xs uppercase font-bold">No se encontraron clientes.</td>
                        </tr>
                      );
                    }

                    return filteredUsers.map((u, idx) => (
                      <tr key={u.name} className="hover:bg-slate-50 text-slate-800 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold select-all tracking-wider text-slate-900 flex items-center gap-2 text-[13px] font-arial">
                          <span className="text-[10px] text-slate-400 font-sans">#{idx + 1}</span>
                          <span className="uppercase">{u.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-emerald-650 text-[13px] font-arial">{u.dia || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600 text-[13px] font-arial">{u.semana || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600 text-[13px] font-arial">{u.mes || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600 text-[13px] font-arial">{u.trimestre || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600 text-[13px] font-arial">{u.semestre || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600 text-[13px] font-arial">{u.año || '-'}</td>
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
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-hidden animate-fade-in font-arial"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users size={18} className="text-slate-900" style={{ color: '#0f172a' }} />
                  Desglose de Entregas por Usuarios Disglobal
                </h3>
                <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono">
                  Métricas de equipos entregados por periodo de tiempo
                </p>
              </div>
              <button 
                onClick={closeAllModals}
                className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 rounded text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
              >
                Cerrar ✕
              </button>
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
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent rounded-xl text-slate-900 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-slate-455" />
              {colaboradoresSearchQuery && (
                <button
                  onClick={() => setColaboradoresSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-450 hover:text-red-655 cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tabla Tabular de Desglose de Tiempos */}
            <div className="overflow-auto border border-slate-200 rounded-xl flex-1 bg-slate-50">
              <table className="w-full text-left border-collapse text-[13px] font-arial">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-black tracking-widest text-slate-655 uppercase sticky top-0 z-10">
                    <th className="py-3.5 px-4">Usuario / Colaborador</th>
                    <th className="py-3.5 px-4 text-center">Día</th>
                    <th className="py-3.5 px-4 text-center">Semana</th>
                    <th className="py-3.5 px-4 text-center">Mes</th>
                    <th className="py-3.5 px-4 text-center">Trimestre</th>
                    <th className="py-3.5 px-4 text-center">Semestre</th>
                    <th className="py-3.5 px-4 text-center">Año</th>
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
                          <td colSpan={8} className="text-center py-10 text-slate-400 font-arial text-xs uppercase font-bold">No se encontraron usuarios.</td>
                        </tr>
                      );
                    }

                    return filteredUsers.map((u, idx) => (
                      <tr key={u.name} className="hover:bg-slate-50 text-slate-800 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold select-all tracking-wider text-slate-900 flex items-center gap-2 text-[13px] font-arial">
                          <span className="text-[10px] text-slate-400 font-sans">#{idx + 1}</span>
                          <span className="uppercase">{u.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-[13px] font-arial">{u.dia || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-[13px] font-arial">{u.semana || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-[13px] font-arial">{u.mes || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-[13px] font-arial">{u.trimestre || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-[13px] font-arial">{u.semestre || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-[13px] font-arial">{u.año || '-'}</td>
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
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-6 flex flex-col gap-4 shadow-xl max-h-[80vh] overflow-hidden animate-fade-in font-arial"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone size={18} className="text-blue-600" />
                  Historial de Arribo por Modelos Físicos
                </h3>
                <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono">
                  Listado cronológico de ingresos agrupados por modelo físico
                </p>
              </div>
              <button 
                onClick={closeAllModals}
                className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 rounded text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
              >
                Cerrar ✕
              </button>
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
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent rounded-xl text-slate-900 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-slate-455" />
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
            <div className="overflow-y-auto pr-1 flex-1 font-arial text-[13px] bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
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

                return filtered.map(s => (
                  <div key={s.id} className="py-3 px-4 hover:bg-slate-100/70 bg-white border border-slate-200/60 rounded-xl flex justify-between items-center gap-4 transition-all">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[14px] font-extrabold text-slate-900 select-all tracking-wider font-arial">{s.serial}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-sans uppercase font-bold leading-none">{s.modeloName}</span>
                        <span className="text-[10px] bg-slate-200/80 text-slate-500 px-1.5 py-0.5 rounded font-sans uppercase leading-none">{s.so}</span>
                      </div>
                      {s.remitente && (
                        <span className="text-[12px] text-slate-600 font-arial mt-0.5">Remitente: <span className="font-bold uppercase">{s.remitente}</span></span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider block text-center ${getStatusStyle(s.status)}`}>
                        {s.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 font-arial">{s.displayDate}</span>
                    </div>
                  </div>
                ));
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
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-6 flex flex-col gap-4 shadow-xl max-h-[80vh] overflow-hidden animate-fade-in font-arial"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  Historial de Arribo por Modelos de Negocio
                </h3>
                <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono">
                  Listado cronológico de ingresos agrupados por modelo de negocio
                </p>
              </div>
              <button 
                onClick={closeAllModals}
                className="text-slate-700 font-bold p-1 bg-slate-100 hover:bg-slate-200 rounded text-xs px-2.5 py-1 border border-slate-200 cursor-pointer"
              >
                Cerrar ✕
              </button>
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
                className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent rounded-xl text-slate-900 uppercase placeholder-slate-400 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all font-mono"
              />
              <Search size={13} className="absolute left-2.5 top-3.5 text-slate-455" />
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
            <div className="overflow-y-auto pr-1 flex-1 font-arial text-[13px] bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
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

                return filtered.map(s => (
                  <div key={s.id} className="py-3 px-4 hover:bg-slate-100/70 bg-white border border-slate-200/60 rounded-xl flex justify-between items-center gap-4 transition-all">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[14px] font-extrabold text-slate-900 select-all tracking-wider font-arial">{s.serial}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-sans uppercase font-bold leading-none">{s.bizModelName}</span>
                      </div>
                      {s.remitente && (
                        <span className="text-[12px] text-slate-600 font-arial mt-0.5">Remitente: <span className="font-bold uppercase">{s.remitente}</span></span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider block text-center ${getStatusStyle(s.status)}`}>
                        {s.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 font-arial">{s.displayDate}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
