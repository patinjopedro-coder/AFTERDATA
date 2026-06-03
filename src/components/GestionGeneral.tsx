import React, { useState, useMemo } from 'react';
import { POSItem, POSStatus, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { formatRif } from '../utils';
import { 
  FileText, CheckSquare, Square, Search, Layers, 
  Trash2, Filter, ChevronLeft, ChevronRight, User, 
  MapPin, ShieldCheck, HelpCircle, FileSpreadsheet, Play, Check
} from 'lucide-react';

interface GestionGeneralProps {
  serials: POSItem[];
  setSerials: React.Dispatch<React.SetStateAction<POSItem[]>>;
  modelosDB: Record<string, ModelConfig>;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  dateFrom: string;
  setDateFrom: (s: string) => void;
  dateTo: string;
  setDateTo: (s: string) => void;
  includeCasillero: boolean;
  setIncludeCasillero: React.Dispatch<React.SetStateAction<boolean>>;
  onShowHistory: (serial: string, el: HTMLElement) => void;
  onHideHistory: () => void;
  onUserClick: (remitente: string) => void;
  usersProfiles: Record<string, import('../types').UserProfile>;
  setUsersProfiles?: React.Dispatch<React.SetStateAction<Record<string, import('../types').UserProfile>>>;
  activeCruceBatchId: string;
}

export const GestionGeneral: React.FC<GestionGeneralProps> = ({
  serials,
  setSerials,
  modelosDB,
  globalSearch,
  dateFrom,
  dateTo,
  includeCasillero,
  setIncludeCasillero,
  onShowHistory,
  onHideHistory,
  onUserClick,
  usersProfiles,
  setUsersProfiles,
  activeCruceBatchId
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Form State
  const [bulkInput, setBulkInput] = useState('');
  const [remitente, setRemitente] = useState('');
  const [guia, setGuia] = useState('');
  const [rif, setRif] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [destino, setDestino] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [modeloManual, setModeloManual] = useState('');
  const [ticket, setTicket] = useState('');
  const [operadora, setOperadora] = useState<'MOVISTAR' | 'MOVILNET' | 'DIGITEL' | ''>('');
  const [modeloNegocio, setModeloNegocio] = useState<'BASICO' | 'COMODATO' | ''>('');
  const [accForro, setAccForro] = useState(false);
  const [accCargador, setAccCargador] = useState(false);
  const [accCaja, setAccCaja] = useState(false);
  const [accBateria, setAccBateria] = useState(false);
  const [costoBsf, setCostoBsf] = useState('');
  const [costoUsdt, setCostoUsdt] = useState('');

  const handleRemitenteChange = (val: string) => {
    setRemitente(val);
    const searchVal = val.toUpperCase().trim();
    if (searchVal.length >= 4) {
      const profile = usersProfiles[searchVal];
      if (profile) {
        if (profile.rif) setRif(profile.rif);
        if (profile.razonSocial) setRazonSocial(profile.razonSocial);
        if (profile.ubicacion) setDestino(profile.ubicacion);
      } else {
        const match = serials.find(s => s.remitente && s.remitente.toUpperCase().trim() === searchVal);
        if (match) {
          if (match.rif) setRif(match.rif);
          if (match.razonSocial) setRazonSocial(match.razonSocial);
          if (match.destino) setDestino(match.destino);
        }
      }
    }
  };

  // Table Configuration & Filter States
  const [statusFilter, setStatusFilter] = useState<POSStatus | 'TODOS'>('TODOS');
  const [bulkStatus, setBulkStatus] = useState<POSStatus>('PENDIENTE');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const currentDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleRegister = () => {
    const rawLines = bulkInput.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) {
      alert('POR FAVOR INGRESE AL MENOS UN SERIAL');
      return;
    }
    if (!remitente.trim()) {
      alert('POR FAVOR INDIQUE EL REMITENTE');
      return;
    }

    const today = currentDateStr();
    const displayToday = today.split('-').reverse().join('/');
    const isCas = !!(guia || rif || razonSocial || destino || simNumber || modeloManual || operadora || modeloNegocio || accForro || accCargador || accCaja || accBateria || ticket || costoBsf || costoUsdt);

    let maxId = serials.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);

    const newItems: POSItem[] = rawLines.map((s) => {
      const serialUp = s.toUpperCase();
      maxId++;
      return {
        id: maxId,
        serial: serialUp,
        date: today,
        displayDate: displayToday,
        status: 'SIN ESTATUS',
        remitente: remitente.toUpperCase().trim(),
        source: guia.toUpperCase().trim(),
        isCasillero: isCas,
        selected: false,
        rif: formatRif(rif),
        razonSocial: razonSocial.toUpperCase().trim(),
        destino: destino.toUpperCase().trim(),
        observaciones: '',
        forro: accForro,
        bateria: accBateria,
        cargador: accCargador,
        caja: accCaja,
        sim: !!simNumber,
        simNumber: simNumber.toUpperCase().trim(),
        operadora,
        modeloManual: modeloManual.toUpperCase().trim(),
        modeloNegocio,
        entregadoTecnico: false,
        esSustitucion: false,
        serialSustituto: '',
        fechaSalida: '',
        fechaSalidaCliente: '',
        guiaSalidaCliente: '',
        destinoSalida: '',
        fechaConfirmada: false,
        ticket: ticket.toUpperCase().trim(),
        bsf: costoBsf.toUpperCase().trim(),
        usdt: costoUsdt.toUpperCase().trim(),
        cruceBatchId: activeCruceBatchId || undefined
      };
    });

    setSerials(prev => [...newItems, ...prev]);

    if (isCas && setUsersProfiles && remitente.trim()) {
      const remKey = remitente.toUpperCase().trim();
      setUsersProfiles(prev => {
        const existing = prev[remKey];
        return {
          ...prev,
          [remKey]: {
            remitenteId: remKey,
            nombreCompleto: existing?.nombreCompleto || razonSocial.toUpperCase().trim() || remKey,
            isUsuario: existing?.isUsuario !== undefined ? existing.isUsuario : false,
            isCliente: true,
            area: existing?.area || '',
            cargo: existing?.cargo || '',
            rif: formatRif(rif) || existing?.rif || '',
            razonSocial: razonSocial.toUpperCase().trim() || existing?.razonSocial || remKey,
            ubicacion: existing?.ubicacion || destino.toUpperCase().trim() || '',
            telefono: existing?.telefono || ''
          }
        };
      });
    }

    // Cleanup Form
    setBulkInput('');
    setRemitente('');
    setGuia('');
    setRif('');
    setRazonSocial('');
    setDestino('');
    setSimNumber('');
    setModeloManual('');
    setTicket('');
    setOperadora('');
    setModeloNegocio('');
    setAccForro(false);
    setAccCargador(false);
    setAccCaja(false);
    setAccBateria(false);
    setCostoBsf('');
    setCostoUsdt('');

    alert(`Se registraron ${newItems.length} seriales correctamente.`);
  };

  // Filter computations
  const filteredSerials = useMemo(() => {
    const searchLow = globalSearch.toLowerCase();
    return serials.filter(s => {
      const modelInfo = getTerminalModel(s.serial, modelosDB);
      const inSearch = !globalSearch || 
        s.serial.toLowerCase().includes(searchLow) ||
        s.remitente.toLowerCase().includes(searchLow) ||
        (s.rif && s.rif.toLowerCase().includes(searchLow)) ||
        (s.razonSocial && s.razonSocial.toLowerCase().includes(searchLow)) ||
        (s.source && s.source.toLowerCase().includes(searchLow)) ||
        (s.destino && s.destino.toLowerCase().includes(searchLow)) ||
        (s.ticket && s.ticket.toLowerCase().includes(searchLow)) ||
        (s.operadora && s.operadora.toLowerCase().includes(searchLow)) ||
        (s.modeloManual && s.modeloManual.toLowerCase().includes(searchLow)) ||
        modelInfo.modelo.toLowerCase().includes(searchLow);

      const matchStatus = statusFilter === 'TODOS' || s.status === statusFilter;
      const matchDateFrom = !dateFrom || s.date >= dateFrom;
      const matchDateTo = !dateTo || s.date <= dateTo;

      // Con o sin casillero
      const hasFiltersActive = globalSearch !== '' || dateFrom !== '' || dateTo !== '' || statusFilter !== 'TODOS' || includeCasillero;
      if (!hasFiltersActive && s.isCasillero) return false;
      if (hasFiltersActive && !includeCasillero && s.isCasillero) return false;

      return inSearch && matchStatus && matchDateFrom && matchDateTo;
    });
  }, [serials, globalSearch, statusFilter, dateFrom, dateTo, includeCasillero, modelosDB]);

  // Group and sort batches
  const finalBatchesList = useMemo(() => {
    const batches = new Set<string>();
    filteredSerials.forEach(s => {
      if (s.cruceBatchId) {
        batches.add(s.cruceBatchId);
      }
    });

    const sortedBatches = Array.from(batches).sort((a, b) => {
      const matchA = a.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
      const matchB = b.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (matchA && matchB) {
        const dateA = new Date(
          parseInt(matchA[3]),
          parseInt(matchA[2]) - 1,
          parseInt(matchA[1]),
          parseInt(matchA[4]),
          parseInt(matchA[5]),
          parseInt(matchA[6])
        );
        const dateB = new Date(
          parseInt(matchB[3]),
          parseInt(matchB[2]) - 1,
          parseInt(matchB[1]),
          parseInt(matchB[4]),
          parseInt(matchB[5]),
          parseInt(matchB[6])
        );
        return dateB.getTime() - dateA.getTime();
      }
      return b.localeCompare(a);
    });

    const hasHistorial = filteredSerials.some(s => !s.cruceBatchId);
    if (hasHistorial) {
      sortedBatches.push('HISTORIAL');
    }

    if (sortedBatches.length === 0) {
      return ['HISTORIAL'];
    }
    return sortedBatches;
  }, [filteredSerials]);

  const totalPages = finalBatchesList.length;
  const activeBatch = finalBatchesList[currentPage - 1] || 'HISTORIAL';

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Sorting: order from newest to oldest (by ID descending)
  const sortedSerials = useMemo(() => {
    return [...filteredSerials].sort((a, b) => b.id - a.id);
  }, [filteredSerials]);

  // Pagination by batch instead of items count
  const paginatedSerials = useMemo(() => {
    return sortedSerials.filter(s => {
      if (activeBatch === 'HISTORIAL') {
        return !s.cruceBatchId;
      }
      return s.cruceBatchId === activeBatch;
    });
  }, [sortedSerials, activeBatch]);

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = new Set(paginatedSerials.map(s => s.id));
    setSerials(prev => prev.map(s => visibleIds.has(s.id) ? { ...s, selected: checked } : s));
  };

  const handleSelectRow = (id: number) => {
    setSerials(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const handleUpdateStatus = (id: number, status: POSStatus) => {
    setSerials(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleUpdateDateText = (id: number, textVal: string) => {
    let internalDate = '';
    let displayVal = textVal;
    if (textVal.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [d, m, y] = textVal.split('/');
      internalDate = `${y}-${m}-${d}`;
    } else if (textVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
      internalDate = textVal;
      displayVal = textVal.split('-').reverse().join('/');
    }
    setSerials(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          displayDate: displayVal,
          date: internalDate || s.date
        };
      }
      return s;
    }));
  };

  const applyBulkStatusToPage = () => {
    const pageIds = new Set(paginatedSerials.map(s => s.id));
    setSerials(prev => prev.map(s => pageIds.has(s.id) ? { ...s, status: bulkStatus } : s));
    alert(`Se actualizó el estatus a ${bulkStatus} para los equipos de la página actual.`);
  };

  const applyBulkStatusToSelected = () => {
    const selectedCount = serials.filter(s => s.selected).length;
    if (selectedCount === 0) {
      alert('NO HAY EQUIPOS SELECCIONADOS');
      return;
    }
    setSerials(prev => prev.map(s => s.selected ? { ...s, status: bulkStatus } : s));
    alert(`Se actualizó el estatus a ${bulkStatus} para ${selectedCount} equipos seleccionados.`);
  };

  const deleteSelectedSerials = () => {
    const selectedCount = serials.filter(s => s.selected).length;
    if (selectedCount === 0) {
      alert('NO HAY EQUIPOS SELECCIONADOS');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar ${selectedCount} equipos seleccionados? Esta acción no se puede deshacer.`)) {
      setSerials(prev => prev.filter(s => !s.selected));
    }
  };

  const getStatusColor = (status: POSStatus) => {
    switch (status) {
      case 'PENDIENTE': 
      case 'ACTIVO': 
      case 'SUSPENDIDO': 
        return 'bg-amber-100 text-amber-800 border-none font-bold shadow-xs';
      case 'CANCELADO': 
      case 'N#A': 
      case 'RECUPERADO':
        return 'bg-emerald-100 text-emerald-800 border-none font-bold shadow-xs';
      case 'SIN ESTATUS':
      default:
        return 'bg-slate-100 text-slate-800 border-none font-bold shadow-xs';
    }
  };

  const isAllSelected = paginatedSerials.length > 0 && paginatedSerials.every(s => s.selected);

  // Suggested Unique Remitentes for Datalist
  const uniqueRemitentes = useMemo(() => {
    return Array.from(new Set(serials.map(s => s.remitente))).filter(Boolean);
  }, [serials]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in text-slate-800 gestion-general-tab">
      
      {/* SIDEBAR: INPUT DIRECTO LOGÍSTICO */}
      <div className="xl:col-span-1 dark-panel p-5 flex flex-col gap-4 h-fit">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="text-slate-900 w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider text-slate-900">INGRESAR SERIAL</h3>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SERIAL</label>
          <textarea
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
            rows={5}
            placeholder=""
            className="w-full text-sm font-arial p-3 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Remitente</label>
            <input
              type="text"
              list="formRemitenteList"
              value={remitente}
              onChange={e => handleRemitenteChange(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
            <datalist id="formRemitenteList">
              {remitente.trim().length >= 4 && uniqueRemitentes.map(r => <option key={r} value={r} />)}
            </datalist>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">N° Guía (Entrada)</label>
            <input
              type="text"
              value={guia}
              onChange={e => setGuia(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RIF Cliente</label>
            <input
              type="text"
              value={rif}
              onChange={e => setRif(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Razón Social</label>
            <input
              type="text"
              value={razonSocial}
              onChange={e => setRazonSocial(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">UBICACION DE ORIGEN</label>
            <input
              type="text"
              value={destino}
              onChange={e => setDestino(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Número SIM</label>
            <input
              type="text"
              value={simNumber}
              onChange={e => setSimNumber(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modelo POS (Manual)</label>
            <input
              type="text"
              value={modeloManual}
              onChange={e => setModeloManual(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Ticket / Caso</label>
            <input
              type="text"
              value={ticket}
              onChange={e => setTicket(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operadora</label>
            <select
              value={operadora}
              onChange={e => setOperadora(e.target.value as any)}
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            >
              <option value=""></option>
              <option value="MOVISTAR">MOVISTAR</option>
              <option value="MOVILNET">MOVILNET</option>
              <option value="DIGITEL">DIGITEL</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modelo Negocio</label>
            <select
              value={modeloNegocio}
              onChange={e => setModeloNegocio(e.target.value as any)}
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            >
              <option value=""></option>
              <option value="BASICO">BÁSICO</option>
              <option value="COMODATO">COMODATO</option>
            </select>
          </div>
        </div>

        {/* ACCESORIOS GESTION COMPLETA */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setAccForro(!accForro)}
              className={`flex items-center justify-between text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer border accessory-btn ${
                accForro ? 'active' : ''
              }`}
            >
              <span>FORRO</span>
              {accForro && <Check size={12} />}
            </button>
            
            <button
              type="button"
              onClick={() => setAccCargador(!accCargador)}
              className={`flex items-center justify-between text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer border accessory-btn ${
                accCargador ? 'active' : ''
              }`}
            >
              <span>CARGADOR</span>
              {accCargador && <Check size={12} />}
            </button>

            <button
              type="button"
              onClick={() => setAccCaja(!accCaja)}
              className={`flex items-center justify-between text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer border accessory-btn ${
                accCaja ? 'active' : ''
              }`}
            >
              <span>CAJA</span>
              {accCaja && <Check size={12} />}
            </button>

            <button
              type="button"
              onClick={() => setAccBateria(!accBateria)}
              className={`flex items-center justify-between text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer border accessory-btn ${
                accBateria ? 'active' : ''
              }`}
            >
              <span>BATERÍA</span>
              {accBateria && <Check size={12} />}
            </button>
          </div>
        </div>

        {/* COSTO FIELDS */}
        <div className="grid grid-cols-2 gap-3.5 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Costo (BsF)</label>
            <input
              type="text"
              value={costoBsf}
              onChange={e => setCostoBsf(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Costo (USDT)</label>
            <input
              type="text"
              value={costoUsdt}
              onChange={e => setCostoUsdt(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>
        </div>

        <button
          onClick={handleRegister}
          className="w-full py-3 btn-green text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-sm"
        >
          <Play fill="currentColor" size={10} className="text-white" />
          <span>Registrar POS</span>
        </button>
      </div>

      {/* COMPONENTE PRINCIPAL: TABLA & ACCIONES MASIVAS */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        
        {/* BARRA DE ACCIONES MASIVAS Y FILTROS */}
        <div className="dark-panel p-4 flex flex-col gap-3.5">
          
          {/* Fila 1: Acciones Masivas */}
          <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-slate-100 w-full">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider min-w-[110px]">Acciones en lote:</span>
            <div className="flex flex-wrap gap-1.5 items-center flex-1">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value as POSStatus)}
                className="bulk-select focus:outline-none cursor-pointer"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
                <option value="CANCELADO">CANCELADO</option>
                <option value="N#A">N#A</option>
                <option value="RECUPERADO">RECUPERADO</option>
                <option value="SIN ESTATUS">SIN ESTATUS</option>
              </select>
              
              <button
                onClick={applyBulkStatusToPage}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-arial font-bold uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-lg border border-[#22c55e] cursor-pointer transition-all shadow-xs h-[28px] flex items-center justify-center text-white-force"
                style={{ color: '#ffffff' }}
              >
                APLICAR A PÁGINA
              </button>
              
              <button
                onClick={applyBulkStatusToSelected}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-arial font-bold uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-lg border border-[#22c55e] cursor-pointer transition-all shadow-xs h-[28px] flex items-center justify-center text-white-force"
                style={{ color: '#ffffff' }}
              >
                APLICAR A SELECCIONADOS
              </button>
              
              <button
                onClick={deleteSelectedSerials}
                className="bg-red-500 hover:bg-red-600 text-white font-arial font-bold uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-lg border border-red-500 cursor-pointer transition-all shadow-xs h-[28px] flex items-center justify-center text-white-force gap-1"
                style={{ color: '#ffffff' }}
                title="Eliminar seleccionados"
              >
                <Trash2 size={12} />
                ELIMINAR
              </button>
            </div>
          </div>

          {/* Fila 2: Filtros de Estado */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider min-w-[110px]">Filtrar por estado:</span>
            <div className="flex flex-wrap gap-1.5 items-center flex-1">
              {(['TODOS', 'PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO', 'RECUPERADO', 'N#A', 'SIN ESTATUS'] as const).map(f => {
                const count = serials.filter(s => {
                  const modelInfo = getTerminalModel(s.serial, modelosDB);
                  const matchesGlobal = !globalSearch || 
                    s.serial.toLowerCase().includes(globalSearch.toLowerCase()) || 
                    s.remitente.toLowerCase().includes(globalSearch.toLowerCase()) ||
                    modelInfo.modelo.toLowerCase().includes(globalSearch.toLowerCase());
                  return matchesGlobal && (f === 'TODOS' || s.status === f);
                }).length;

                const isActive = statusFilter === f;
                let customClass = "";
                if (f === 'TODOS') {
                  customClass = "status-btn-todos";
                } else if (f === 'PENDIENTE' || f === 'ACTIVO' || f === 'SUSPENDIDO') {
                  customClass = "status-btn-orange";
                } else if (f === 'CANCELADO' || f === 'RECUPERADO' || f === 'N#A') {
                  customClass = "status-btn-green";
                } else if (f === 'SIN ESTATUS') {
                  customClass = "status-btn-gray";
                }

                return (
                  <button
                    key={f}
                    onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
                    className={`status-filter-btn ${customClass} ${isActive ? 'active-filter' : ''}`}
                  >
                    {f === 'SIN ESTATUS' ? 'SIN EST' : f} ({count})
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* CONTENEDOR DE LA TABLA */}
        <div className="dark-panel overflow-hidden shadow-strong">
          
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <Filter className="text-slate-500 w-4 h-4" />
              <span className="font-arial uppercase font-black text-xs text-slate-800 tracking-wider">
                {activeBatch === 'HISTORIAL'
                  ? `LISTADO - HISTORIAL GENERAL (${paginatedSerials.length} terminales)`
                  : `LISTADO - ${activeBatch} (${paginatedSerials.length} terminales)`}
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-xs text-slate-500 mr-2">Página {currentPage} de {totalPages}</span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-md cursor-pointer text-slate-700 pagination-btn"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-md cursor-pointer text-slate-700 pagination-btn"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">
                    <button
                      onClick={() => toggleSelectAll(!isAllSelected)}
                      className="text-slate-500 hover:text-slate-800 p-1 rounded transition-colors inline-block"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-slate-800" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Serial / Modelo</th>
                  <th className="py-3 px-4 w-36">Estado</th>
                  <th className="py-3 px-4 w-36">Disponibilidad</th>
                  <th className="py-3 px-4">Remitente</th>
                  <th className="py-3 px-4">Guía</th>
                  <th className="py-3 px-4 w-36">Fecha Ingreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSerials.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 text-xs font-mono">
                      No se encontraron registros de terminales para los filtros establecidos.
                    </td>
                  </tr>
                ) : (
                  paginatedSerials.map(s => {
                    const modelInfo = getTerminalModel(s.serial, modelosDB);
                    const isNew = s.date && (Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000) <= 7);
                    const isRepetido = serials.filter(o => o.serial === s.serial).length > 1;

                    // Availability Indicator
                    const isDisponible = s.status === 'CANCELADO' || s.status === 'N#A' || s.status === 'RECUPERADO';
                    const isEntregado = s.status === 'PENDIENTE' || s.status === 'ACTIVO' || s.status === 'SUSPENDIDO';

                    const serialColorClass = 'text-slate-800 font-bold';

                    return (
                      <tr 
                        key={s.id} 
                        className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${s.selected ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!s.selected}
                            onChange={() => handleSelectRow(s.id)}
                            className="rounded text-blue-600 bg-slate-100 border-slate-200 focus:ring-0"
                          />
                        </td>
                        <td className="py-3 px-4 object-contain">
                          <div className="flex flex-col gap-0.5">
                            <span 
                              data-serial={s.serial}
                              className={`text-sm cursor-help hover:text-slate-900 select-all font-arial tracking-[0.1em] transition-colors flex items-center gap-1 ${serialColorClass}`}
                              onMouseEnter={(e) => onShowHistory(s.serial, e.currentTarget)}
                              onMouseLeave={onHideHistory}
                              onClick={async (e) => {
                                  e.stopPropagation();
                                  handleCopyText(s.serial, `serial-${s.id}`);
                              }}
                            >
                              <span style={{ letterSpacing: '0.08em' }}>{s.serial}</span>
                              {copiedKey === `serial-${s.id}` && (
                                <span className="inline-flex items-center justify-center bg-emerald-600 border border-emerald-500 rounded p-0.5 ml-1 transition-all animate-fade-in shrink-0">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </span>
                              )}
                            </span>
                            <div className="flex flex-wrap gap-1.5 items-center -ml-1">
                              <span className="text-[9px] bg-slate-100 text-slate-600 font-arial px-1.5 py-0.5 rounded uppercase font-semibold">
                                {modelInfo.so === 'ANDROID' ? 'android' : modelInfo.so === 'LINUX' ? 'linux' : 'unk'}
                              </span>
                              {s.ticket && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 font-arial px-1.5 py-0.5 rounded font-semibold">
                                  TKT: {s.ticket}
                                </span>
                              )}
                              {s.destino && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 font-arial px-1.5 py-0.5 rounded font-semibold">
                                  ORIGEN: {s.destino}
                                </span>
                              )}
                              {s.isCasillero && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded border border-transparent shadow-xs font-arial">
                                  CASILLERO
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 font-medium font-arial">{modelInfo.modelo}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={s.status}
                            onChange={e => handleUpdateStatus(s.id, e.target.value as POSStatus)}
                            className={`text-xs px-2 py-1 rounded font-bold uppercase ${getStatusColor(s.status)} focus:ring-1 focus:ring-zinc-400 outline-none`}
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="ACTIVO">ACTIVO</option>
                            <option value="SUSPENDIDO">SUSPENDIDO</option>
                            <option value="CANCELADO">CANCELADO</option>
                            <option value="N#A">N#A</option>
                            <option value="RECUPERADO">RECUPERADO</option>
                            <option value="SIN ESTATUS">SIN ESTATUS</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {isDisponible ? (
                            <span 
                              className="inline-flex items-center gap-1.5 bg-white text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-slate-200"
                              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              DISPONIBLE
                            </span>
                          ) : isEntregado ? (
                            <span 
                              className="inline-flex items-center gap-1.5 bg-white text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-slate-200"
                              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                              ENTREGADO
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1.5 bg-white text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-slate-200"
                              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                              SIN ESTATUS
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span 
                            className="font-bold text-slate-850 cursor-pointer hover:text-slate-950 hover:underline flex items-center gap-1 font-arial uppercase"
                            onClick={() => onUserClick(s.remitente)}
                          >
                            {s.remitente}
                            {usersProfiles[s.remitente] && (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" title="Perfil asociado"></span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          {s.source ? (
                            <span 
                              className="text-xs font-bold text-slate-850 select-all font-arial cursor-pointer hover:text-slate-950 hover:underline inline-flex items-center gap-1"
                              onClick={async (e) => {
                                e.stopPropagation();
                                handleCopyText(s.source, `guia-${s.id}`);
                              }}
                              title="Click para copiar guía"
                            >
                              <span>{s.source}</span>
                              {copiedKey === `guia-${s.id}` && (
                                <span className="inline-flex items-center justify-center bg-emerald-600 border border-emerald-500 rounded p-0.5 ml-1 transition-all animate-fade-in shrink-0">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={s.displayDate || s.date.split('-').reverse().join('/')}
                            onChange={e => handleUpdateDateText(s.id, e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="bg-slate-100 border border-transparent rounded font-mono text-[11px] p-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 w-24 text-center"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-slate-500 text-xs">
              Viendo {paginatedSerials.length} terminales de este lote (Total: {filteredSerials.length} filtrados).
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded cursor-pointer text-slate-700 pagination-btn"
              >
                Primera
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded cursor-pointer text-slate-700 pagination-btn"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-xs bg-slate-100 rounded border border-transparent text-slate-700 flex items-center">
                Pág. {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded cursor-pointer text-slate-700 pagination-btn"
              >
                Siguiente
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded cursor-pointer text-slate-700 pagination-btn"
              >
                Última ({totalPages})
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
