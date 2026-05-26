import React, { useState } from 'react';
import { POSItem, POSStatus, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { 
  FileText, CheckSquare, Square, Search, Layers, 
  Trash2, Filter, ChevronLeft, ChevronRight, User, 
  MapPin, ShieldCheck, HelpCircle, FileSpreadsheet, Play
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
  usersProfiles
}) => {
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

  // Table Configuration & Filter States
  const [statusFilter, setStatusFilter] = useState<POSStatus | 'TODOS'>('TODOS');
  const [bulkStatus, setBulkStatus] = useState<POSStatus>('PENDIENTE');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

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
    const isCas = !!(guia || rif || razonSocial || destino || simNumber || modeloManual || operadora || modeloNegocio || accForro || accCargador || accCaja || accBateria || ticket);

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
        rif: rif.toUpperCase().trim(),
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
        ticket: ticket.toUpperCase().trim()
      };
    });

    setSerials(prev => [...newItems, ...prev]);

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

    alert(`Se registraron ${newItems.length} seriales correctamente.`);
  };

  // Filter computations
  const filteredSerials = serials.filter(s => {
    const searchLow = globalSearch.toLowerCase();
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

  // Sorting: order from newest to oldest
  const sortedSerials = [...filteredSerials].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination
  const totalPages = Math.ceil(sortedSerials.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSerials = sortedSerials.slice(startIndex, startIndex + itemsPerPage);

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

  const handleUpdateDate = (id: number, dateStr: string) => {
    const displayVal = dateStr.split('-').reverse().join('/');
    setSerials(prev => prev.map(s => s.id === id ? { ...s, date: dateStr, displayDate: displayVal } : s));
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

  const getStatusColor = (status: POSStatus) => {
    switch (status) {
      case 'PENDIENTE': 
      case 'ACTIVO': 
      case 'SUSPENDIDO': 
        return 'bg-orange-500 text-white border border-orange-400/30 font-bold';
      case 'CANCELADO': 
      case 'N#A': 
      case 'RECUPERADO':
        return 'bg-emerald-600 text-white border border-emerald-500/30 font-bold';
      default: return 'bg-slate-700/30 text-slate-300 border border-slate-600/50';
    }
  };

  const isAllSelected = paginatedSerials.length > 0 && paginatedSerials.every(s => s.selected);

  // Suggested Unique Remitentes for Datalist
  const uniqueRemitentes = Array.from(new Set(serials.map(s => s.remitente))).filter(Boolean);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in text-slate-100">
      
      {/* SIDEBAR: INPUT DIRECTO LOGÍSTICO */}
      <div className="xl:col-span-1 bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="text-blue-500 w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider text-blue-400">INGRESAR PAGO / RECEPCIÓN</h3>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SERIAL</label>
          <textarea
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
            rows={5}
            placeholder=""
            className="w-full text-xs font-mono p-3 bg-[#151925] border border-[#2a2f42] rounded-lg text-emerald-400 focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remitente</label>
            <input
              type="text"
              list="formRemitenteList"
              value={remitente}
              onChange={e => setRemitente(e.target.value)}
              placeholder="CLIENTE / AGENCIA"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase focus:outline-none focus:border-blue-500"
            />
            <datalist id="formRemitenteList">
              {uniqueRemitentes.map(r => <option key={r} value={r} />)}
            </datalist>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">N° Guía (Entrada)</label>
            <input
              type="text"
              value={guia}
              onChange={e => setGuia(e.target.value)}
              placeholder="OPCIONAL"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RIF Cliente</label>
            <input
              type="text"
              value={rif}
              onChange={e => setRif(e.target.value)}
              placeholder="J-12345..."
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Razón Social</label>
            <input
              type="text"
              value={razonSocial}
              onChange={e => setRazonSocial(e.target.value)}
              placeholder="EMPRESA C.A."
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">Destino</label>
            <input
              type="text"
              value={destino}
              onChange={e => setDestino(e.target.value)}
              placeholder="MUNICIPIO / CIUDAD"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">Número SIM</label>
            <input
              type="text"
              value={simNumber}
              onChange={e => setSimNumber(e.target.value)}
              placeholder="SERIAL SIM"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modelo POS (Manual)</label>
            <input
              type="text"
              value={modeloManual}
              onChange={e => setModeloManual(e.target.value)}
              placeholder="EJ: T650P"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">Ticket / Caso</label>
            <input
              type="text"
              value={ticket}
              onChange={e => setTicket(e.target.value)}
              placeholder="CASO N°"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operadora</label>
            <select
              value={operadora}
              onChange={e => setOperadora(e.target.value as any)}
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
            >
              <option value="">SIN OPERADORA</option>
              <option value="MOVISTAR">MOVISTAR</option>
              <option value="MOVILNET">MOVILNET</option>
              <option value="DIGITEL">DIGITEL</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modelo Negocio</label>
            <select
              value={modeloNegocio}
              onChange={e => setModeloNegocio(e.target.value as any)}
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
            >
              <option value="">SIN MODELO</option>
              <option value="BASICO">BÁSICO</option>
              <option value="COMODATO">COMODATO</option>
            </select>
          </div>
        </div>

        {/* ACCESORIOS GESTION COMPLETA */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
              <input type="checkbox" checked={accForro} onChange={e => setAccForro(e.target.checked)} className="rounded text-blue-500 bg-slate-950" />
              <span>FORRO</span>
            </label>
            <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
              <input type="checkbox" checked={accCargador} onChange={e => setAccCargador(e.target.checked)} className="rounded text-blue-500 bg-slate-950" />
              <span>CARGADOR</span>
            </label>
            <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
              <input type="checkbox" checked={accCaja} onChange={e => setAccCaja(e.target.checked)} className="rounded text-blue-500 bg-slate-950" />
              <span>CAJA</span>
            </label>
            <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
              <input type="checkbox" checked={accBateria} onChange={e => setAccBateria(e.target.checked)} className="rounded text-blue-500 bg-slate-950" />
              <span>BATERÍA</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleRegister}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 mt-2 shadow-lg hover:shadow-blue-500/20 shadow-blue-500/5 cursor-pointer"
        >
          <Play fill="currentColor" size={10} />
          <span>Procesar y Registrar POS</span>
        </button>
      </div>

      {/* COMPONENTE PRINCIPAL: TABLA & ACCIONES MASIVAS */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        
        {/* BARRA DE ACCIONES MASIVAS Y FILTROS */}
        <div className="bg-[#1e2336] p-4 rounded-xl border border-[#2a2f42] flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value as POSStatus)}
              className="text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
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
              className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Aplicar a Página
            </button>
            
            <button
              onClick={applyBulkStatusToSelected}
              className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Aplicar a Seleccionados
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center justify-end w-full md:w-auto">
            {(['TODOS', 'PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO', 'RECUPERADO', 'N#A', 'SIN ESTATUS'] as const).map(f => {
              const count = serials.filter(s => {
                const modelInfo = getTerminalModel(s.serial, modelosDB);
                const matchesGlobal = !globalSearch || 
                  s.serial.toLowerCase().includes(globalSearch.toLowerCase()) || 
                  s.remitente.toLowerCase().includes(globalSearch.toLowerCase()) ||
                  modelInfo.modelo.toLowerCase().includes(globalSearch.toLowerCase());
                return matchesGlobal && (f === 'TODOS' || s.status === f);
              }).length;

              return (
                <button
                  key={f}
                  onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    statusFilter === f 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                      : 'bg-slate-950/75 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {f === 'SIN ESTATUS' ? 'SIN EST' : f} ({count})
                </button>
              );
            })}
          </div>

        </div>

        {/* CONTENEDOR DE LA TABLA */}
        <div className="bg-[#1e2336] rounded-xl border border-[#2a2f42] overflow-hidden">
          
          <div className="p-4 border-b border-[#2a2f42] flex justify-between items-center bg-[#151925]/30">
            <div className="flex items-center gap-2">
              <Filter className="text-slate-500 w-4 h-4" />
              <span className="text-xs text-slate-400 font-semibold uppercase">
                Listado ({sortedSerials.length} terminales encontrados)
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-xs text-slate-500 mr-2">Página {currentPage} de {totalPages}</span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 rounded-md cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 rounded-md cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151925]/50 border-b border-[#2a2f42] text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">
                    <button
                      onClick={() => toggleSelectAll(!isAllSelected)}
                      className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors inline-block"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Serial / Modelo</th>
                  <th className="py-3 px-4 w-36">Estado</th>
                  <th className="py-3 px-4 w-36">Disponibilidad</th>
                  <th className="py-3 px-4">Remitente / Guía</th>
                  <th className="py-3 px-4 w-36">Fecha Ingreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedSerials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500 text-xs font-mono">
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

                    const serialColorClass = isRepetido
                      ? 'text-red-400 font-bold decoration-dotted underline'
                      : isNew
                        ? 'text-emerald-400 font-bold'
                        : 'text-blue-300';

                    return (
                      <tr 
                        key={s.id} 
                        className={`hover:bg-white/5 border-b border-[#2a2f42]/40 transition-colors ${s.selected ? 'bg-blue-600/5' : ''}`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!s.selected}
                            onChange={() => handleSelectRow(s.id)}
                            className="rounded text-blue-600 bg-slate-900 border-slate-800"
                          />
                        </td>
                        <td className="py-3 px-4 object-contain">
                          <div className="flex flex-col gap-0.5">
                            <span 
                              data-serial={s.serial}
                              className={`text-sm tracking-wider cursor-help hover:text-white select-all font-mono transition-colors ${serialColorClass}`}
                              onMouseEnter={(e) => onShowHistory(s.serial, e.currentTarget)}
                              onMouseLeave={onHideHistory}
                              onClick={async () => {
                                await navigator.clipboard.writeText(s.serial);
                                alert(`Serial ${s.serial} copiado al portapapeles.`);
                              }}
                            >
                              {s.serial}
                            </span>
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded tracking-wide uppercase">
                                {modelInfo.so === 'ANDROID' ? 'android' : modelInfo.so === 'LINUX' ? 'linux' : 'unk'}
                              </span>
                              {s.ticket && (
                                <span className="text-[9px] bg-blue-900/30 text-blue-300 font-mono px-1.5 py-0.5 rounded">
                                  TKT: {s.ticket}
                                </span>
                              )}
                              {s.destino && (
                                <span className="text-[9px] bg-emerald-950/60 text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                                  DST: {s.destino}
                                </span>
                              )}
                              {s.isCasillero && (
                                <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded border border-blue-500/25 shadow-sm">
                                  CASILLERO
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 font-medium">{modelInfo.modelo}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={s.status}
                            onChange={e => handleUpdateStatus(s.id, e.target.value as POSStatus)}
                            className={`text-xs px-2 py-1 rounded font-bold uppercase ${getStatusColor(s.status)} focus:ring-1 focus:ring-blue-500 outline-none`}
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
                            <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                              DISPONIBLE
                            </span>
                          ) : isEntregado ? (
                            <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-orange-400/20 shadow-sm shadow-orange-500/10">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                              ENTREGADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-slate-900 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                              SIN ESTATUS
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="flex flex-col">
                            <span 
                              className="font-bold text-slate-200 cursor-pointer hover:text-blue-400 hover:underline flex items-center gap-1"
                              onClick={() => onUserClick(s.remitente)}
                            >
                              {s.remitente}
                              {usersProfiles[s.remitente] && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Perfil asociado"></span>
                              )}
                            </span>
                            {s.source && (
                              <span className="text-[10px] text-slate-500 select-all font-mono mt-0.5">
                                GUIA: {s.source}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="date"
                            value={s.date}
                            onChange={e => handleUpdateDate(s.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded font-mono text-[11px] p-1 text-slate-300 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#2a2f42] bg-[#151925]/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-slate-500 text-xs">
              Viendo {paginatedSerials.length} de {filteredSerials.length} terminales en total.
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-900 disabled:opacity-30 rounded border border-slate-800 cursor-pointer"
              >
                Primera
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-900 disabled:opacity-30 rounded border border-slate-800 cursor-pointer"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-xs bg-slate-900 rounded border border-slate-800 text-slate-300 flex items-center">
                Pág. {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-900 disabled:opacity-30 rounded border border-slate-800 cursor-pointer"
              >
                Siguiente
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-900 disabled:opacity-30 rounded border border-slate-800 cursor-pointer"
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
