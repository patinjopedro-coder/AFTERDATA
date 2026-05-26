import React, { useState } from 'react';
import { POSItem, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { 
  BarChart3, Calendar, FileDown, Search, 
  HelpCircle, ChevronLeft, ChevronRight, PieChart, Users, Compass, Layers 
} from 'lucide-react';

interface EstadisticasProps {
  serials: POSItem[];
  modelosDB: Record<string, ModelConfig>;
  onUserClick: (remitente: string) => void;
  usersProfiles: Record<string, import('../types').UserProfile>;
}

export const Estadisticas: React.FC<EstadisticasProps> = ({
  serials,
  modelosDB,
  onUserClick,
  usersProfiles
}) => {
  const [modalType, setModalType] = useState<'total' | 'disponibles' | 'entregados' | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [periodModalConfig, setPeriodModalConfig] = useState<{
    period: 'hoy' | 'semana' | 'quincena' | 'mes' | 'trimestre' | 'anual';
    statusGroup: 'entregados' | 'disponibles';
  } | null>(null);

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
      if (statusGroup === 'entregados') return ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(s.status);
      if (statusGroup === 'disponibles') return ['CANCELADO', 'N#A'].includes(s.status);
      return true;
    }).length;
  };

  const obtenerPeriodoItems = (period: 'hoy' | 'semana' | 'quincena' | 'mes' | 'trimestre' | 'anual', statusGroup: 'entregados' | 'disponibles') => {
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
        if (statusGroup === 'entregados') return ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(s.status);
        if (statusGroup === 'disponibles') return ['CANCELADO', 'N#A'].includes(s.status);
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
      if (statusGroup === 'entregados') return ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(s.status);
      if (statusGroup === 'disponibles') return ['CANCELADO', 'N#A'].includes(s.status);
      return true;
    });

    if (items.length === 0) {
      alert('Sin datos en este rango.');
      return;
    }

    let csv = "SERIAL,MODELO,SO,ESTADO,REMITENTE,RIF,RAZON_SOCIAL,TICKET,FECHA\n";
    items.forEach(s => {
      const m = getTerminalModel(s.serial, modelosDB);
      csv += `"${s.serial}","${m.modelo}","${m.so}","${s.status}","${s.remitente}","${s.rif || ''}","${s.razonSocial || ''}","${s.ticket || ''}","${s.date}"\n`;
    });

    downloadCSV(csv, `informe_${statusGroup}_${period}_${hoyStr}.csv`);
    alert(`Exportado ${items.length} registros correspondientes al período.`);
  };

  // Master Stat Counters
  const totalCount = serials.length;
  const disponiblesCount = serials.filter(s => ['CANCELADO', 'N#A'].includes(s.status)).length;
  const entregadosCount = serials.filter(s => ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(s.status)).length;

  // Modal dataset filter
  const getModalItems = () => {
    let list = serials;
    if (modalType === 'disponibles') {
      list = serials.filter(s => ['CANCELADO', 'N#A'].includes(s.status));
    } else if (modalType === 'entregados') {
      list = serials.filter(s => ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(s.status));
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

  const modalList = getModalItems().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Unified General list at the bottom
  const sortedAll = [...serials].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedAll.length / itemsPerPage) || 1;
  const paginatedAll = sortedAll.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusStyle = (status: string) => {
    if (['CANCELADO', 'N#A'].includes(status)) {
      return 'bg-emerald-600 text-white border border-emerald-500/30 font-bold';
    }
    return 'bg-orange-500 text-white border border-orange-400/30 font-bold';
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100 pb-16">
      
      {/* SECCIÓN 1: CONTADORES TÉCNICOS INTEGRALES DE LA RED DE POS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div 
          onClick={() => { setModalType('total'); setModalSearch(''); }}
          className="bg-[#1e2336] p-5 rounded-2xl border border-[#2a2f42] hover:border-blue-500/40 transition-all cursor-pointer shadow-sm group relative"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
               <Layers size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#8f9bba] font-bold">Total Registrados</div>
              <div className="text-4xl font-black text-white font-simplifica tracking-widest pt-1">{totalCount}</div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => { setModalType('disponibles'); setModalSearch(''); }}
          className="bg-[#1e2336] p-5 rounded-2xl border border-[#2a2f42] hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm group relative"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
               <Compass size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#8f9bba] font-bold">DISPONIBLES</div>
              <div className="text-4xl font-black text-white font-simplifica tracking-widest pt-1">{disponiblesCount}</div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => { setModalType('entregados'); setModalSearch(''); }}
          className="bg-[#1e2336] p-5 rounded-2xl border border-[#2a2f42] hover:border-orange-500/40 transition-all cursor-pointer shadow-sm group relative"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
               <Users size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#8f9bba] font-bold">TOTAL ENTREGADOS</div>
              <div className="text-4xl font-black text-white font-simplifica tracking-widest pt-1">{entregadosCount}</div>
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN 2: HISTÓRICOS DE INGRESOS POR PERÍODOS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* PANEL: INGRESOS ENTREGADOS */}
        <div className="bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-300 flex items-center gap-1.5">
              <Calendar className="text-orange-500 w-4.5 h-4.5" />
              HISTORIAL DE EQUIPOS ENTREGADOS
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {(['hoy', 'semana', 'quincena', 'mes', 'trimestre', 'anual'] as const).map(p => (
              <div key={p} className="bg-[#151925] p-3 rounded-xl border border-[#2a2f42] flex flex-col items-center justify-between gap-1.5 text-center group">
                <span className="text-[11px] text-slate-300 font-extrabold tracking-wider uppercase">{p}</span>
                <span 
                  onClick={() => setPeriodModalConfig({ period: p, statusGroup: 'entregados' })}
                  className="text-2xl font-black font-simplifica tracking-widest text-white group-hover:text-orange-400 transition-colors cursor-pointer hover:underline"
                  title="Click para ver listado detallado"
                >
                  {contarPeriodo(p, 'entregados')}
                </span>
                <button
                  onClick={() => handleExportPeriod(p, 'entregados')}
                  className="w-full mt-2 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <FileDown size={11} />
                  <span>EXP</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL: INGRESOS DISPONIBLES */}
        <div className="bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-300 flex items-center gap-1.5">
              <Calendar className="text-emerald-500 w-4.5 h-4.5" />
              HISTORIAL DE EQUIPOS DISPONIBLES
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {(['hoy', 'semana', 'quincena', 'mes', 'trimestre', 'anual'] as const).map(p => (
              <div key={p} className="bg-[#151925] p-3 rounded-xl border border-[#2a2f42] flex flex-col items-center justify-between gap-1.5 text-center group">
                <span className="text-[11px] text-slate-300 font-extrabold tracking-wider uppercase">{p}</span>
                <span 
                  onClick={() => setPeriodModalConfig({ period: p, statusGroup: 'disponibles' })}
                  className="text-2xl font-black font-simplifica tracking-widest text-white group-hover:text-emerald-400 transition-colors cursor-pointer hover:underline"
                  title="Click para ver listado detallado"
                >
                  {contarPeriodo(p, 'disponibles')}
                </span>
                <button
                  onClick={() => handleExportPeriod(p, 'disponibles')}
                  className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <FileDown size={11} />
                  <span>EXP</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ESTADÍSTICAS COMPLEMENTARIAS ANUALES: FLUJO DE ENTRADA DE EQUIPOS */}
      <div className="bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col gap-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-xs tracking-widest uppercase text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              FLUJO DE ENTRADA DE EQUIPOS
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Monitoreo automático de ingreso por canal de remisión</p>
          </div>
          
          {/* BOTONES DE EXPORTACIÓN ANUAL COMPACTOS */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleExportPeriod('anual', 'total')}
              className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-[9.5px] border border-blue-500/15 rounded-md cursor-pointer transition-all uppercase tracking-wider shadow-sm"
              title="Descargar todos los ingresos anuales en Excel"
            >
              EXCEL INGRESOS ANUALES
            </button>
            <button 
              onClick={() => handleExportPeriod('anual', 'entregados')}
              className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-600 text-orange-400 hover:text-white font-bold text-[9.5px] border border-orange-500/15 rounded-md cursor-pointer transition-all uppercase tracking-wider shadow-sm"
              title="Descargar entregas anuales en Excel"
            >
              EXCEL ENTREGADOS ANUAL
            </button>
            <button 
              onClick={() => handleExportPeriod('anual', 'disponibles')}
              className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-[9.5px] border border-emerald-500/15 rounded-md cursor-pointer transition-all uppercase tracking-wider shadow-sm"
              title="Descargar stock disponible anual en Excel"
            >
              EXCEL DISPONIBLES ANUAL
            </button>
          </div>
        </div>

        {/* METRICAS DINAMICAS CALCULADAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* COLUMNA 1: AUDITORÍA DE INVENTARIO */}
          <div className="lg:col-span-4 bg-[#151925] p-4 rounded-xl border border-[#2a2f42] flex flex-col justify-between gap-4">
            <div>
              <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase block mb-3">Auditoría Operativa</span>
              
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase">
                    <span>Equipos Activos / Pendientes</span>
                    <span className="text-white font-simplifica tracking-wider font-bold">
                      {serials.length > 0 ? Math.round((serials.filter(s => ['ACTIVO', 'PENDIENTE', 'SUSPENDIDO'].includes(s.status)).length / serials.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${serials.length > 0 ? (serials.filter(s => ['ACTIVO', 'PENDIENTE', 'SUSPENDIDO'].includes(s.status)).length / serials.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase">
                    <span>Cancelados / Recuperados</span>
                    <span className="text-white font-simplifica tracking-wider font-bold">
                      {serials.length > 0 ? Math.round((serials.filter(s => ['CANCELADO', 'N#A', 'RECUPERADO'].includes(s.status)).length / serials.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                      style={{ width: `${serials.length > 0 ? (serials.filter(s => ['CANCELADO', 'N#A', 'RECUPERADO'].includes(s.status)).length / serials.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase">
                    <span>Sin Estatus Asignado</span>
                    <span className="text-white font-simplifica tracking-wider font-bold">
                      {serials.length > 0 ? Math.round((serials.filter(s => ['SIN ESTATUS', ''].includes(s.status)).length / serials.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full"
                      style={{ width: `${serials.length > 0 ? (serials.filter(s => ['SIN ESTATUS', ''].includes(s.status)).length / serials.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-500 border-t border-slate-900 pt-3 text-center uppercase font-mono">
              Calculado en tiempo real en base a registros físicos y de correo
            </div>
          </div>

          {/* COLUMNA 2: DETECTIVE DE MODELOS CRÍTICOS Y DISPONIBILIDAD */}
          <div className="lg:col-span-8 bg-[#151925] p-4 rounded-xl border border-[#2a2f42] flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase block mb-3">Estado de Abastecimiento por Modelo</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[170px] overflow-y-auto pr-1">
                {Array.from(new Set(serials.map(s => s.remitente ? s.remitente.toUpperCase().trim() : 'S/R'))).sort().map(rem => {
                  const remitenteSerials = serials.filter(s => (s.remitente ? s.remitente.toUpperCase().trim() : 'S/R') === rem);
                  const disponibles = remitenteSerials.filter(s => ['CANCELADO', 'N#A', 'RECUPERADO'].includes(s.status || '') || s.status === 'SIN ESTATUS').length;
                  const entregados = remitenteSerials.filter(s => ['ACTIVO', 'PENDIENTE', 'SUSPENDIDO'].includes(s.status || '')).length;
                  const total = remitenteSerials.length;

                  if (total === 0) return null;

                  return (
                    <div key={rem} className="bg-[#151925] p-2.5 rounded-lg border border-[#2a2f42] flex items-center justify-between gap-3 shadow-sm hover:border-[#3b82f6]/50 transition-colors">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-slate-200 truncate uppercase">{rem}</span>
                        <span className="text-[8.5px] text-slate-500 mt-0.5 uppercase font-sans">Totales: {total} • Entregados: {entregados}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-slate-300 block font-bold leading-none">{disponibles} Disp</span>
                        </div>
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETALLE COMPORTAMIENTO GENERAL TABULAR EN BASE */}
      <div className="bg-[#1e2336] rounded-xl border border-[#2a2f42] overflow-hidden">
        <div className="p-4 border-b border-[#2a2f42] flex justify-between items-center bg-[#151925]/30">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 className="text-blue-500 w-4.5 h-4.5" />
            Tabla General de Registro y Control
          </h4>

          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 px-2 bg-[#151925] hover:bg-white/5 disabled:opacity-30 border border-[#2a2f42] text-[10px] font-bold rounded cursor-pointer"
            >
              ATRÁS
            </button>
            <span className="text-xs font-mono text-slate-400">Pág {currentPage} de {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1 px-2 bg-[#151925] hover:bg-white/5 disabled:opacity-30 border border-[#2a2f42] text-[10px] font-bold rounded cursor-pointer"
            >
              SIGUIENTE
            </button>
          </div>
        </div>

        <div className="overflow-x-auto text-[11px] font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#151925]/50 border-b border-[#2a2f42] text-[9px] text-slate-500 font-bold tracking-widest uppercase">
                <th className="py-2.5 px-4">Serial Terminal</th>
                <th className="py-2.5 px-4">Modelo POS</th>
                <th className="py-2.5 px-4 w-36">Estado Actual</th>
                <th className="py-2.5 px-4">Remitente Origen</th>
                <th className="py-2.5 px-4 w-32">Destino</th>
                <th className="py-2.5 px-4 w-32">Fecha Ingreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f42]/60">
              {paginatedAll.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-mono">No hay seriales en la base de datos local.</td>
                </tr>
              ) : (
                paginatedAll.map(s => {
                  const m = getTerminalModel(s.serial, modelosDB);
                  return (
                    <tr key={s.id} className="hover:bg-white/5 text-slate-300">
                      <td className="py-2 px-4 font-bold select-all tracking-wider text-slate-200">
                        {s.serial}
                      </td>
                      <td className="py-2 px-4 uppercase font-sans text-slate-400">
                        {m.modelo}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider block text-center w-28 ${getStatusStyle(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 uppercase font-sans text-slate-300 font-semibold">
                        <span 
                          onClick={() => onUserClick(s.remitente)}
                          className="cursor-pointer hover:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {s.remitente}
                          {usersProfiles[s.remitente] && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Perfil asociado"></span>
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-4 uppercase font-sans text-slate-400">{s.destino || '-'}</td>
                      <td className="py-2 px-4 text-slate-400">{s.displayDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {modalType && (
        <div 
          className="fixed inset-0 bg-[#111421]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModalType(null)}
        >
          <div 
            className="bg-[#1e2336] border border-[#2a2f42] rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-[#2a2f42] pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-blue-400 uppercase tracking-wider">
                  Listado: {modalType === 'total' ? 'TODOS LOS EQUIPOS' : modalType === 'disponibles' ? 'EQUIPOS DISPONIBLES' : 'EQUIPOS ENTREGADOS'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Encontrados: {modalList.length} registros para este enfoque.
                </p>
              </div>
              <button 
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white font-bold p-1 bg-[#151925] rounded border border-[#2a2f42]"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Modal search bar */}
            <div className="relative flex-shrink-0">
              <input
                type="text"
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                placeholder="Filtrar por serial, remitente, cliente RIF..."
                className="w-full text-xs p-2.5 pl-8 bg-[#151925] border border-[#2a2f42] rounded-lg text-slate-300 focus:outline-none focus:border-[#3b82f6]/50"
              />
              <Search size={14} className="absolute left-2.5 top-3.5 text-slate-500" />
            </div>

            <div className="overflow-y-auto pr-1 flex-1 font-mono text-[11px] divide-y divide-[#2a2f42]/80">
              {modalList.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Ningún registro coincide con el filtro del modal.</div>
              ) : (
                modalList.map(s => {
                  const m = getTerminalModel(s.serial, modelosDB);
                  return (
                    <div key={s.id} className="py-2.5 hover:bg-white/5 flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-blue-300 select-all tracking-wider">{s.serial}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{m.modelo}</span>
                        {s.razonSocial && (
                          <span className="text-[10px] text-slate-400 font-sans">Cliente: {s.razonSocial}</span>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider block text-center ${getStatusStyle(s.status)}`}>
                          {s.status}
                        </span>
                        <span className="text-[9px] text-slate-500">Ingreso: {s.displayDate}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETALLE PERIOD MODAL OVERLAY */}
      {periodModalConfig && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPeriodModalConfig(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 flex flex-col gap-4 shadow-2xl max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-blue-400 uppercase tracking-wider">
                  {periodModalConfig.statusGroup === 'entregados' 
                    ? 'HISTORIAL DE EQUIPOS ENTREGADOS' 
                    : 'HISTORIAL DE EQUIPOS DISPONIBLES'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                  Rango: {periodModalConfig.period} · Encontrados: {obtenerPeriodoItems(periodModalConfig.period, periodModalConfig.statusGroup).length}
                </p>
              </div>
              <button 
                onClick={() => setPeriodModalConfig(null)}
                className="text-slate-450 hover:text-white font-bold p-1 bg-slate-800 rounded text-xs px-2.5 py-1 transition-all border-none cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 font-mono text-[11px] divide-y divide-slate-800/80">
              {(() => {
                const items = obtenerPeriodoItems(periodModalConfig.period, periodModalConfig.statusGroup);
                if (items.length === 0) {
                  return <div className="text-center py-10 text-slate-500 uppercase">Sin registros en este periodo.</div>;
                }
                return items.map(s => {
                  const m = getTerminalModel(s.serial, modelosDB);
                  return (
                    <div key={s.id} className="py-2.5 flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-blue-300 select-all tracking-wider">{s.serial}</span>
                        <span className="text-[10px] text-slate-400 font-sans">{m.modelo}</span>
                        {s.remitente && (
                          <span className="text-[10px] text-slate-500 font-sans">Remitente: {s.remitente}</span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider block text-center ${getStatusStyle(s.status)}`}>
                          {s.status}
                        </span>
                        <span className="text-[9px] text-slate-500">{s.displayDate}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
