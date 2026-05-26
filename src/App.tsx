import { useState, useEffect, useRef } from 'react';
import { POSItem, EnvioExterno, ModelConfig, POSStatus, UserProfile } from './types';
import { INITIAL_SERIALS, INITIAL_MODELS } from './data';
import { getDBItem, setDBItem } from './db';
import { GestionGeneral } from './components/GestionGeneral';
import { LogoIcon } from './components/LogoIcon';
import { Casillero } from './components/Casillero';
import { HacerEnvio } from './components/HacerEnvio';
import { CruceSeriales } from './components/CruceSeriales';
import { EquiposEnviados } from './components/EquiposEnviados';
import { Modelos } from './components/Modelos';
import { Estadisticas } from './components/Estadisticas';
import { Usuarios } from './components/Usuarios';

// Lucide icons
import {
  Database, FileSpreadsheet, Download, RefreshCw,
  Trash2, Layers, Search, Calendar, FolderCheck,
  Settings, BarChart3, Users, Network, Terminal, ShieldAlert, Send
} from 'lucide-react';

// -------------------------------------------------------------
// HELPER: Sanitize / deduplicate serial IDs
// -------------------------------------------------------------
function sanitizeSerials(loaded: POSItem[]): POSItem[] {
  const seenIds = new Set<number>();
  const currentMax = loaded.reduce((max, item) =>
    (item && item.id && typeof item.id === 'number' && !isNaN(item.id)) ? Math.max(max, item.id) : max,
    0
  );
  let nextUniqueId = currentMax + 1;

  return loaded.map((item) => {
    if (!item || !item.id || typeof item.id !== 'number' || isNaN(item.id) || seenIds.has(item.id)) {
      const assignedId = nextUniqueId++;
      seenIds.add(assignedId);
      return { ...item, id: assignedId };
    }
    seenIds.add(item.id);
    return item;
  });
}

export default function App() {
  // -------------------------------------------------------------
  // STATE DEFINITIONS — start with empty defaults, load from IndexedDB
  // -------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [serials, setSerials] = useState<POSItem[]>([]);
  const [enviosExternos, setEnviosExternos] = useState<EnvioExterno[]>([]);
  const [modelosDB, setModelosDB] = useState<Record<string, ModelConfig>>(INITIAL_MODELS);
  const [usersProfiles, setUsersProfiles] = useState<Record<string, UserProfile>>({});
  const [currentTab, setCurrentTab] = useState<string>('general');

  // Global Filter States (shared reactively between tables)
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeCasillero, setIncludeCasillero] = useState(true);

  // Floating History Tooltip State
  const [historyTooltip, setHistoryTooltip] = useState<{
    serial: string;
    clientX: number;
    clientY: number;
  } | null>(null);

  // Global User Profile Modal State
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);

  // -------------------------------------------------------------
  // LOAD ALL DATA FROM INDEXEDDB ON MOUNT
  // db.ts handles automatic migration from localStorage automatically
  // -------------------------------------------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        const [loadedSerials, loadedEnvios, loadedModelos, loadedProfiles, loadedTab] = await Promise.all([
          getDBItem<POSItem[]>('serialesDB', INITIAL_SERIALS),
          getDBItem<EnvioExterno[]>('enviosExternosDB', []),
          getDBItem<Record<string, ModelConfig>>('modelosDB', INITIAL_MODELS),
          getDBItem<Record<string, UserProfile>>('usersProfilesDB', {}),
          getDBItem<string>('currentTab', 'general'),
        ]);

        setSerials(sanitizeSerials(Array.isArray(loadedSerials) ? loadedSerials : INITIAL_SERIALS));
        setEnviosExternos(Array.isArray(loadedEnvios) ? loadedEnvios : []);
        setModelosDB(loadedModelos && typeof loadedModelos === 'object' ? loadedModelos : INITIAL_MODELS);
        setUsersProfiles(loadedProfiles && typeof loadedProfiles === 'object' ? loadedProfiles : {});
        setCurrentTab(typeof loadedTab === 'string' ? loadedTab : 'general');
      } catch (e) {
        console.error('Error loading from IndexedDB:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  // -------------------------------------------------------------
  // PERSIST STATES TO INDEXEDDB ON EVERY CHANGE
  // Guard with !isLoading to avoid overwriting real data with empty defaults
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isLoading) setDBItem('serialesDB', serials);
  }, [serials, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('enviosExternosDB', enviosExternos);
  }, [enviosExternos, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('modelosDB', modelosDB);
  }, [modelosDB, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('usersProfilesDB', usersProfiles);
  }, [usersProfiles, isLoading]);

  useEffect(() => {
    if (!isLoading) setDBItem('currentTab', currentTab);
  }, [currentTab, isLoading]);

  // -------------------------------------------------------------
  // MASTER HEADER CONTROL ACTIONS
  // -------------------------------------------------------------
  const handleImportCSVData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (fileEvent) => {
        try {
          const csvText = fileEvent.target?.result as string;
          const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) {
            alert("Archivo inválido o vacío.");
            return;
          }

          const parsedHeaders = lines[0].split(',').map(h => h.toUpperCase().trim());
          if (!parsedHeaders.some(h => h.includes('SERIAL'))) {
            alert("Formato no reconocido o falto de columna SERIAL.");
            return;
          }

          if (confirm("¿Está seguro de importar los registros? Esto reescribirá la base logistica local.")) {
            // Find positions
            const idxID = parsedHeaders.findIndex(h => h.includes('ID'));
            const idxSerial = parsedHeaders.findIndex(h => h.includes('SERIAL'));
            const idxStatus = parsedHeaders.findIndex(h => h.includes('STATUS') || h.includes('ESTADO'));
            const idxRemitente = parsedHeaders.findIndex(h => h.includes('REMITENTE'));
            const idxRif = parsedHeaders.findIndex(h => h.includes('RIF'));
            const idxRazon = parsedHeaders.findIndex(h => h.includes('RAZON'));
            const idxSource = parsedHeaders.findIndex(h => h.includes('GUIAENTRADA') || h.includes('ORIGEN'));
            const idxFecha = parsedHeaders.findIndex(h => h.includes('FECHA'));
            const idxForro = parsedHeaders.findIndex(h => h.includes('FORRO'));
            const idxBateria = parsedHeaders.findIndex(h => h.includes('BATERIA'));
            const idxCargador = parsedHeaders.findIndex(h => h.includes('CARGADOR'));
            const idxCaja = parsedHeaders.findIndex(h => h.includes('CAJA'));
            const idxSim = parsedHeaders.findIndex(h => h.includes('SIM'));
            const idxSimNum = parsedHeaders.findIndex(h => h.includes('SIMNUMBER') || h.includes('NUMEROSIM'));
            const idxOper = parsedHeaders.findIndex(h => h.includes('OPERADORA'));
            const idxModManual = parsedHeaders.findIndex(h => h.includes('MODELOMANUAL') || h.includes('MODELOMANUAL'));
            const idxNegocio = parsedHeaders.findIndex(h => h.includes('MODELONEGOCIO'));
            const idxEntregadoTec = parsedHeaders.findIndex(h => h.includes('ENTREGADOTECNICO'));
            const idxSust = parsedHeaders.findIndex(h => h.includes('ESSUSTITUCION'));
            const idxSerialSust = parsedHeaders.findIndex(h => h.includes('SUSTITUTO'));
            const idxFechaSalida = parsedHeaders.findIndex(h => h.includes('FECHASALIDA'));
            const idxFechaLiberacion = parsedHeaders.findIndex(h => h.includes('FECHASALIDACLIENTE'));
            const idxGuiaLib = parsedHeaders.findIndex(h => h.includes('GUIASALIDACLIENTE'));
            const idxDestinoSalida = parsedHeaders.findIndex(h => h.includes('DESTINOSALIDA'));
            const idxObs = parsedHeaders.findIndex(h => h.includes('OBSERVACIONES'));
            const idxResp = parsedHeaders.findIndex(h => h.includes('RESPONSABLE'));
            const idxTicket = parsedHeaders.findIndex(h => h.includes('TICKET'));
            const idxDestino = parsedHeaders.findIndex(h => h.includes('DESTINO'));

            const importedItems: POSItem[] = [];

            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
              if (cols.length < 2) continue;

              const cleanSerial = cols[idxSerial]?.toUpperCase() || '';
              if (!cleanSerial) continue;

              const d = new Date();
              const defaultLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const rawDate = cols[idxFecha] || defaultLocal;
              const formatDisplayDate = rawDate.split('-').reverse().join('/');

              const rawIdVal = idxID !== -1 && cols[idxID] && !isNaN(parseInt(cols[idxID])) ? parseInt(cols[idxID]) : 0;
              const statusVal = (idxStatus !== -1 ? cols[idxStatus].toUpperCase() : 'PENDIENTE') as POSStatus;

              importedItems.push({
                id: rawIdVal,
                serial: cleanSerial,
                date: rawDate,
                displayDate: formatDisplayDate,
                status: statusVal,
                remitente: idxRemitente !== -1 ? cols[idxRemitente].toUpperCase() : '',
                source: idxSource !== -1 ? cols[idxSource].toUpperCase() : '',
                isCasillero: idxSource !== -1 && !!cols[idxSource],
                selected: false,
                rif: idxRif !== -1 ? cols[idxRif].toUpperCase() : '',
                razonSocial: idxRazon !== -1 ? cols[idxRazon].toUpperCase() : '',
                observaciones: idxObs !== -1 ? cols[idxObs] : '',
                responsable: idxResp !== -1 ? cols[idxResp] : '',
                forro: idxForro !== -1 ? (cols[idxForro]?.toLowerCase() === 'true') : false,
                bateria: idxBateria !== -1 ? (cols[idxBateria]?.toLowerCase() === 'true') : false,
                cargador: idxCargador !== -1 ? (cols[idxCargador]?.toLowerCase() === 'true') : false,
                caja: idxCaja !== -1 ? (cols[idxCaja]?.toLowerCase() === 'true') : false,
                sim: idxSim !== -1 ? (cols[idxSim]?.toLowerCase() === 'true') : false,
                simNumber: idxSimNum !== -1 ? cols[idxSimNum] : '',
                operadora: idxOper !== -1 ? (cols[idxOper]?.toUpperCase() as any) : '',
                modeloManual: idxModManual !== -1 ? cols[idxModManual] : '',
                modeloNegocio: idxNegocio !== -1 ? (cols[idxNegocio]?.toUpperCase() as any) : '',
                entregadoTecnico: idxEntregadoTec !== -1 ? (cols[idxEntregadoTec]?.toLowerCase() === 'true') : false,
                esSustitucion: idxSust !== -1 ? (cols[idxSust]?.toLowerCase() === 'true') : false,
                serialSustituto: idxSerialSust !== -1 ? cols[idxSerialSust] : '',
                fechaSalida: idxFechaSalida !== -1 ? cols[idxFechaSalida] : '',
                fechaSalidaCliente: idxFechaLiberacion !== -1 ? cols[idxFechaLiberacion] : '',
                guiaSalidaCliente: idxGuiaLib !== -1 ? cols[idxGuiaLib] : '',
                destinoSalida: idxDestinoSalida !== -1 ? cols[idxDestinoSalida] : '',
                fechaConfirmada: false,
                ticket: idxTicket !== -1 ? cols[idxTicket].toUpperCase() : '',
                destino: idxDestino !== -1 ? cols[idxDestino].toUpperCase() : ''
              });
            }

            if (importedItems.length > 0) {
              // Ensure absolute uniqueness across the imported array
              const seenImportedIds = new Set<number>();
              const maxExistingId = serials.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);
              let fallbackId = maxExistingId + 1;

              const sanitizedImported = importedItems.map((item) => {
                if (!item.id || seenImportedIds.has(item.id)) {
                  const assigned = fallbackId++;
                  seenImportedIds.add(assigned);
                  return { ...item, id: assigned };
                }
                seenImportedIds.add(item.id);
                return item;
              });

              setSerials(sanitizedImported);
              alert(`¡Se importaron ${sanitizedImported.length} terminales exitosamente!`);
            } else {
              alert("No se cargaron registros válidos del archivo.");
            }
          }
        } catch (e: any) {
          alert(`Error procesando e importando el archivo: ${e.message}`);
        }
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  };

  const handleExportCSV = () => {
    let csv = "SERIAL,ESTADO,REMITENTE,RIF,RAZON_SOCIAL,TICKET,GUIA_ENTRADA,DESTINO,FECHA_INGRESO\n";
    serials.forEach(s => {
      csv += `"${s.serial}","${s.status}","${s.remitente}","${s.rif || ''}","${s.razonSocial || ''}","${s.ticket || ''}","${s.source || ''}","${s.destino || ''}","${s.date}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `disglobal_tracking_report_${localDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const dataObj = {
      backup: 'DISGLOBAL TRACKING',
      date: new Date().toISOString(),
      serials,
      enviosExternos,
      modelosDB,
      usersProfiles
    };
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedro_disglobal_backup_${localDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullCSVBackup = () => {
    let csv = "ID,SERIAL,STATUS,REMITENTE,GUI_ENTRADA,RIF,RAZON_SOCIAL,TICKET,DESTINO,OBSERVACIONES,RESPONSABLE,FORRO,BATERIA,CARGADOR,CAJA,SIM,SIM_NUMBER,OPERADORA,MODELO_NEGOCIO,ENTREGADO_TECNICO,FECHA_LLEGADA\n";
    serials.forEach(s => {
      csv += `"${s.id}","${s.serial}","${s.status}","${s.remitente}","${s.source || ''}","${s.rif || ''}","${s.razonSocial || ''}","${s.ticket || ''}","${s.destino || ''}","${s.observaciones || ''}","${s.responsable || ''}","${s.forro}","${s.bateria}","${s.cargador}","${s.caja}","${s.sim}","${s.simNumber || ''}","${s.operadora || ''}","${s.modeloNegocio || ''}","${s.entregadoTecnico}","${s.date}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_completo_disglobal_${localDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // HISTORY TOOLTIP LOGIC (POP OVERLAY ON HOVER)
  // -------------------------------------------------------------
  const showHistory = (serial: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    setHistoryTooltip({
      serial,
      clientX: rect.left,
      clientY: rect.bottom + window.scrollY
    });
  };

  const hideHistory = () => {
    setHistoryTooltip(null);
  };

  // Filter history logs for current serial
  const getSerialHistoryLogs = (serial: string) => {
    return serials
      .filter(s => s.serial === serial)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // -------------------------------------------------------------
  // LOADING SCREEN
  // -------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 font-sans">
        <LogoIcon className="w-28 h-28 filter drop-shadow-[0_0_24px_rgba(14,165,233,0.35)] animate-pulse" />
        <div className="flex flex-col items-center gap-2">
          <p className="text-blue-400 font-mono text-sm uppercase tracking-[0.2em] animate-pulse">
            Cargando base de datos...
          </p>
          <p className="text-slate-600 font-mono text-xs tracking-wider">
            DISGLOBAL TRACKING · IndexedDB
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-bg font-sans antialiased text-slate-100 flex flex-col selection:bg-blue-600/60 selection:text-white">

      {/* GLOBAL HEADER BAR */}
      <header className="bg-[#151925]/80 border-b border-[#2a2f42] backdrop-blur-md sticky top-0 z-40 py-5 px-6 md:px-12 lg:px-16">
        <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-8">

          <div className="flex items-center gap-4 cursor-pointer select-none">
            <LogoIcon className="w-20 h-20 md:w-24 md:h-24 filter drop-shadow-[0_0_16px_rgba(14,165,233,0.2)] transition-all hover:scale-105 duration-300" />
            <div>
              <h1 className="text-xl md:text-2xl lg:text-[28px] font-simplifica uppercase tracking-[0.16em] leading-none flex items-center flex-wrap gap-2">
                <span className="text-yellow-400 font-extrabold glow-yellow">DISGLOBAL</span>{' '}
                <span className="text-blue-500 font-light glow-blue hover:text-blue-400 transition-colors">TRACKING</span>
              </h1>
              <p className="text-xs text-slate-500 font-mono tracking-wider mt-1.5 uppercase">REGISTROS • FECHAS • RIF • SERIALES</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-5 gap-y-3.5">
            <button
              onClick={handleImportCSVData}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet size={13} className="text-emerald-500/80" />
              <span>Importar Datos</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-blue-500/5 hover:bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Download size={13} className="text-blue-500/80" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-800/25 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Terminal size={13} className="text-slate-500" />
              <span>Exportar JSON</span>
            </button>



            <button
              onClick={handleExportFullCSVBackup}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-800/25 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Database size={13} className="text-slate-500" />
              <span>BD Completa</span>
            </button>
          </div>

        </div>
      </header>

      {/* DETALLE FILTROS REACTIVOS UNIFICADOS DE TABLA */}
      <section className="bg-[#1e2336] border-b border-[#2a2f42] p-4 md:px-8 lg:px-12 flex-shrink-0">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* SEARCH BAR UNIT */}
          <div className="relative">
            <input
              type="text"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="BUSCAR SERIAL, RIF, GUIA O REMITENTE"
              className="w-full text-[11px] p-3 pl-8 bg-[#151925] border border-[#2a2f42] rounded-xl text-slate-100 uppercase placeholder-slate-450 font-sans font-bold tracking-wide focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <Search size={14} className="absolute left-2.5 top-4 text-slate-500" />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-3 text-[10px] font-bold text-slate-500 hover:text-slate-300"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* DATE RANGE SPLIT */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#151925] border border-[#2a2f42] rounded-xl text-slate-300 font-mono uppercase"
              />
              <span className="absolute -top-2 left-3 px-1 text-[8px] bg-[#1e2336] text-slate-400 font-black tracking-widest uppercase">Desde</span>
            </div>

            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#151925] border border-[#2a2f42] rounded-xl text-slate-300 font-mono uppercase"
              />
              <span className="absolute -top-2 left-3 px-1 text-[8px] bg-[#1e2336] text-slate-400 font-black tracking-widest uppercase">Hasta</span>
            </div>
          </div>

          {/* INCLUSIVE CHECK */}
          <div className="flex items-center justify-end md:justify-center lg:justify-end gap-3 px-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 select-none cursor-pointer tracking-wider">
              <input
                type="checkbox"
                checked={includeCasillero}
                onChange={e => setIncludeCasillero(e.target.checked)}
                className="rounded text-blue-500 bg-slate-900 border-slate-800"
              />
              <span>INCLUIR EQUIPOS DE CASILLERO</span>
            </label>
          </div>

        </div>
      </section>

      {/* SECCIÓN 3: PESTAÑAS DE NAVEGACIÓN PRINCIPAL */}
      <nav className="bg-transparent w-full px-4 md:px-8 lg:px-12 mt-6">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#2a2f42]/50">
          {[
            { id: 'general', label: 'Gestión General', icon: Layers },
            { id: 'casillero', label: 'Casillero', icon: FolderCheck },
            { id: 'hacerEnvio', label: 'Hacer Envío', icon: Send },
            { id: 'cruce', label: 'Cruce de Seriales', icon: Network },
            { id: 'envios', label: 'Equipos Enviados', icon: FileSpreadsheet },
            { id: 'modelos', label: 'Modelos Registrados', icon: Settings },
            { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
            { id: 'usuarios', label: 'Usuarios / Clientes', icon: Users }
          ].map(t => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setCurrentTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider font-sans transition-all rounded-xl cursor-pointer ${isActive
                  ? 'bg-[#3b82f6] text-white border border-[#3b82f6]/20 shadow-md shadow-blue-500/10'
                  : 'bg-[#1e2336] hover:bg-[#252a40] hover:text-slate-200 text-slate-400 border border-[#2a2f42]'
                  }`}
              >
                <Icon size={19} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* CORE BODY CONTAINER */}
      <main className="w-full p-4 md:p-8 lg:px-12 flex-grow">

        {currentTab === 'general' && (
          <GestionGeneral
            serials={serials}
            setSerials={setSerials}
            modelosDB={modelosDB}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            includeCasillero={includeCasillero}
            setIncludeCasillero={setIncludeCasillero}
            onShowHistory={showHistory}
            onHideHistory={hideHistory}
            onUserClick={(remitente: string) => setViewingProfile(remitente)}
            usersProfiles={usersProfiles}
          />
        )}

        {currentTab === 'casillero' && (
          <Casillero
            serials={serials}
            setSerials={setSerials}
            modelosDB={modelosDB}
            globalSearch={globalSearch}
            dateFrom={dateFrom}
            dateTo={dateTo}
            statusFilter="TODOS"
            onUserClick={(remitente: string) => setViewingProfile(remitente)}
            usersProfiles={usersProfiles}
          />
        )}

        {currentTab === 'hacerEnvio' && (
          <HacerEnvio
            enviosExternos={enviosExternos}
            setEnviosExternos={setEnviosExternos}
          />
        )}

        {currentTab === 'cruce' && (
          <CruceSeriales
            serials={serials}
            setSerials={setSerials}
            modelosDB={modelosDB}
            onUserClick={(remitente: string) => setViewingProfile(remitente)}
            usersProfiles={usersProfiles}
          />
        )}

        {currentTab === 'envios' && (
          <EquiposEnviados
            serials={serials}
            enviosExternos={enviosExternos}
            modelosDB={modelosDB}
            globalSearch={globalSearch}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        )}

        {currentTab === 'modelos' && (
          <Modelos
            modelosDB={modelosDB}
            setModelosDB={setModelosDB}
          />
        )}

        {currentTab === 'estadisticas' && (
          <Estadisticas
            serials={serials}
            modelosDB={modelosDB}
            onUserClick={(remitente: string) => setViewingProfile(remitente)}
            usersProfiles={usersProfiles}
          />
        )}

        {currentTab === 'usuarios' && (
          <Usuarios
            serials={serials}
            modelosDB={modelosDB}
            globalSearch={globalSearch}
            usersProfiles={usersProfiles}
            setUsersProfiles={setUsersProfiles}
          />
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="border-t border-[#2a2f42] bg-[#151925]/80 p-5 text-center mt-10 text-[11px] text-slate-600 font-mono tracking-wider flex-shrink-0">
        <div className="w-full px-4 md:px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-3">
          <span>© {new Date().getFullYear()} DISGLOBAL INC. Todos los Derechos Reservados.</span>
          <span className="flex items-center gap-1.5">
            <Database size={10} className="text-blue-500/60" />
            Almacenamiento: IndexedDB
          </span>
        </div>
      </footer>

      {/* FLOATING RETRACED HISTORY OVERLAY POPUP */}
      {historyTooltip && (
        <div
          className="absolute z-50 bg-slate-950/95 border border-blue-500/40 rounded-xl p-3 shadow-2xl min-w-[270px] max-w-[340px] pointer-events-none mt-2 font-mono text-[11px] animate-fade-in text-slate-100 backdrop-blur-md"
          style={{
            left: historyTooltip.clientX,
            top: historyTooltip.clientY
          }}
        >
          <div className="font-bold text-[12px] text-blue-400 border-b border-slate-800 pb-1.5 mb-1.5 uppercase font-sans">
            Recibo de Historial
          </div>
          <div className="text-slate-400 font-sans tracking-wide">
            Serial: <span className="font-mono text-white text-xs font-black">{historyTooltip.serial}</span>
          </div>

          <div className="mt-2 text-[10px] space-y-1.5">
            {getSerialHistoryLogs(historyTooltip.serial).length === 0 ? (
              <div className="text-slate-600">No hay logs previos en la base general.</div>
            ) : (
              getSerialHistoryLogs(historyTooltip.serial).map((log, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-900/60 pb-1">
                  <div>
                    <div className="font-bold text-slate-300">{log.displayDate}</div>
                    <div className="text-[9px] text-slate-500 uppercase">{log.remitente}</div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${['CANCELADO', 'N#A'].includes(log.status)
                    ? 'bg-emerald-600 text-white'
                    : ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(log.status)
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-300'
                    }`}>
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* GLOBAL USER PROFILE MODAL */}
      {viewingProfile && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingProfile(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{viewingProfile}</h3>
                <p className="text-[10px] text-slate-500 font-mono">Ficha de Remitente Logístico</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 font-sans text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Nombre Completo</span>
                <span className="text-slate-300 font-semibold">{usersProfiles[viewingProfile]?.nombreCompleto || 'No especificado'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Área / Departamento</span>
                <span className="text-slate-300 font-semibold">{usersProfiles[viewingProfile]?.area || 'No especificada'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Cargo</span>
                <span className="text-slate-300 font-semibold">{usersProfiles[viewingProfile]?.cargo || 'No especificado'}</span>
              </div>
            </div>

            <button 
              onClick={() => setViewingProfile(null)}
              className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
