import React, { useState, useMemo } from 'react';
import { POSItem, POSStatus, ModelConfig } from '../types';
import { getTerminalModel } from '../data';
import { formatRif, trackAndLogChanges, copyToClipboard, downloadBlob } from '../utils';
import { 
  FileText, CheckSquare, Square, Search, Layers, 
  Trash2, Filter, ChevronLeft, ChevronRight, User, 
  MapPin, ShieldCheck, HelpCircle, FileSpreadsheet, Play, Check,
  Pencil, X
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
  const [editingItem, setEditingItem] = useState<POSItem | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<POSItem>>({});
  const [isBatchSearchOpen, setIsBatchSearchOpen] = useState(false);

  const getTagClass = (value?: string) => {
    const normalized = (value || '').toUpperCase().trim();
    switch (normalized) {
      case 'COMODATO':
        return 'inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700';
      case 'BASICO':
        return 'inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600';
      case 'CASILLERO':
        return 'inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700';
      default:
        return 'inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500';
    }
  };
  const [batchSearchInput, setBatchSearchInput] = useState('');

  const handleCopyText = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const openEdit = (item: POSItem) => {
    setEditingItem(item);
    setEditDraft({ ...item });
  };

  const saveEdit = () => {
    if (!editingItem) return;
    setSerials(prev => prev.map(s => {
      if (s.id !== editingItem.id) return s;
      const draft = { ...editDraft };
      if (editDraft.date && editDraft.date !== s.date) {
        draft.displayDate = editDraft.date.split('-').reverse().join('/');
      }
      if (s.serial === 'POR RECIBIR' && draft.serial && draft.serial !== 'POR RECIBIR') {
        draft.salienteSinRecibir = false;
      }
      return trackAndLogChanges(s, draft);
    }));
    setEditingItem(null);
    setEditDraft({});
  };

  const renderEditModal = () => {
    if (!editingItem) return null;
    const fields: Array<{ key: keyof POSItem; label: string; type?: string }> = [
      { key: 'serial', label: 'Serial' },
      { key: 'remitente', label: 'Remitente' },
      { key: 'source', label: 'Guía de Entrada' },
      { key: 'rif', label: 'RIF' },
      { key: 'razonSocial', label: 'Razón Social' },
      { key: 'destino', label: 'Destino / Origen' },
      { key: 'ticket', label: 'Ticket' },
      { key: 'responsable', label: 'Responsable' },
      { key: 'banco', label: 'Banco' },
      { key: 'bsf', label: 'Costo' },
      { key: 'observaciones', label: 'Observaciones' },
      { key: 'date', label: 'Fecha Ingreso (YYYY-MM-DD)', type: 'date' },
    ];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div className="bg-white w-full max-w-lg mx-4 shadow-2xl" style={{ borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Editar — {editingItem.serial}</span>
            <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-100 cursor-pointer" style={{ borderRadius: '4px' }}>
              <X size={16} className="text-slate-600" />
            </button>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
            {/* Campos principales (excepto costo, observaciones, fecha) */}
            {fields.filter(f => f.key !== 'bsf' && f.key !== 'observaciones' && f.key !== 'date').map(f => {
              return (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{f.label}</label>
                  <input
                    type="text"
                    list={f.key === 'banco' ? 'editBancoList' : undefined}
                    value={(editDraft[f.key] as string) || ''}
                    onChange={e => {
                      const val = e.target.value;
                      const processed = (f.key === 'responsable' && val.toUpperCase() === 'PEDRO') ? 'PEDRO PATIÑO' : val.toUpperCase();
                      setEditDraft(d => ({ ...d, [f.key]: processed }));
                    }}
                    className="w-full text-xs p-2 bg-slate-100 border border-transparent text-black font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-slate-300"
                    style={{ borderRadius: '4px' }}
                  />
                  {f.key === 'banco' && (
                    <datalist id="editBancoList">
                      {uniqueBancos.map(b => <option key={b} value={b} />)}
                    </datalist>
                  )}
                </div>
              );
            })}

            {/* Sin Costo Checkbox - col-span-2 */}
            <div className="flex items-center gap-2 mt-3 col-span-2 bg-slate-50 p-2.5 border border-slate-100" style={{ borderRadius: '0px' }}>
              <input
                type="checkbox"
                id="editSinCosto"
                checked={!!editDraft.sinCosto}
                onChange={e => {
                  const checked = e.target.checked;
                  setEditDraft(d => ({
                    ...d,
                    sinCosto: checked,
                    bsf: checked ? '' : d.bsf,
                    usdt: checked ? '' : d.usdt
                  }));
                }}
                className="rounded text-green-600 bg-white border-slate-300 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="editSinCosto" className="text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer select-none">
                Sin Costo
              </label>
            </div>

            {/* Campo de Costo */}
            {(() => {
              const isDisabled = !!editDraft.sinCosto;
              return (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Costo</label>
                  <input
                    type="text"
                    value={editDraft.bsf || ''}
                    disabled={isDisabled}
                    onChange={e => setEditDraft(d => ({ ...d, bsf: e.target.value.toUpperCase(), usdt: '' }))}
                    className={`w-full text-xs p-2 bg-${isDisabled ? 'slate-200' : 'slate-100'} border border-${isDisabled ? 'slate-350' : 'transparent'} text-black font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-slate-300 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ borderRadius: '4px' }}
                  />
                </div>
              );
            })()}

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Observaciones</label>
              <input
                type="text"
                value={editDraft.observaciones || ''}
                onChange={e => setEditDraft(d => ({ ...d, observaciones: e.target.value.toUpperCase() }))}
                className="w-full text-xs p-2 bg-slate-100 border border-transparent text-black font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-slate-300"
                style={{ borderRadius: '4px' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fecha Ingreso (YYYY-MM-DD)</label>
              <input
                type="date"
                value={editDraft.date || ''}
                onChange={e => setEditDraft(d => ({ ...d, date: e.target.value }))}
                className="w-full text-xs p-2 bg-slate-100 border border-transparent text-black font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-slate-300"
                style={{ borderRadius: '4px' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estado</label>
              <select
                value={(editDraft.status as string) || ''}
                disabled={editDraft.serial === 'POR RECIBIR'}
                onChange={e => setEditDraft(d => ({ ...d, status: e.target.value as POSStatus }))}
                className={`w-full text-xs p-2 bg-slate-100 border border-transparent text-black font-bold uppercase focus:outline-none focus:ring-1 focus:ring-slate-300 ${
                  editDraft.serial === 'POR RECIBIR' ? 'opacity-55 cursor-not-allowed' : ''
                }`}
                style={{ borderRadius: '4px' }}
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
                <option value="CANCELADO">CANCELADO</option>
                <option value="N#A">N#A</option>
                <option value="RECUPERADO">RECUPERADO</option>
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="ENTREGADO">ENTREGADO</option>
                <option value="SIN ESTATUS">SIN ESTATUS</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modelo Negocio</label>
              <select
                value={(editDraft.modeloNegocio as string) || ''}
                onChange={e => setEditDraft(d => ({ ...d, modeloNegocio: e.target.value as any }))}
                className="w-full text-xs p-2 bg-slate-100 border border-transparent text-black font-bold uppercase focus:outline-none focus:ring-1 focus:ring-slate-300"
                style={{ borderRadius: '4px' }}
              >
                <option value="">SIN ASIGNAR</option>
                <option value="BASICO">BÁSICO</option>
                <option value="COMODATO">COMODATO</option>
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2 py-1">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editDraft.simSustituto}
                  onChange={e => setEditDraft(d => ({
                    ...d,
                    simSustituto: e.target.checked,
                    simSustitutoNumber: e.target.checked ? d.simSustitutoNumber : ''
                  }))}
                  className="rounded text-amber-600 bg-slate-100 border-slate-200 focus:ring-0"
                />
                <span>SIM Sustituto</span>
              </label>
            </div>
            {editDraft.simSustituto && (
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Número SIM Sustituto</label>
                <input
                  type="text"
                  value={editDraft.simSustitutoNumber || ''}
                  onChange={e => setEditDraft(d => ({ ...d, simSustitutoNumber: e.target.value.toUpperCase() }))}
                  className="w-full text-xs p-2 bg-slate-100 border border-transparent text-black font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-slate-300"
                  style={{ borderRadius: '4px' }}
                />
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 text-xs font-bold uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              style={{ borderRadius: '4px' }}
            >Cancelar</button>
            <button
              onClick={saveEdit}
              className="px-4 py-2 text-xs font-bold uppercase bg-[#0a0a0a] hover:bg-slate-800 text-white cursor-pointer"
              style={{ borderRadius: '4px' }}
            >Guardar Cambios</button>
          </div>
        </div>
      </div>
    );
  };

  const renderBatchSearchModal = () => {
    if (!isBatchSearchOpen) return null;

    const searchSerials = batchSearchInput
      .split(/[\n,;\s]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const results = searchSerials.map(searchSerial => {
      const match = serials.find(s => s.serial.trim().toUpperCase() === searchSerial);
      return {
        serial: searchSerial,
        found: !!match,
        status: match ? match.status : 'NO REGISTRADO',
        date: match ? (match.displayDate || match.date.split('-').reverse().join('/')) : '-'
      };
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div className="bg-white w-full max-w-4xl mx-4 shadow-2xl flex flex-col" style={{ borderRadius: '4px', border: '1px solid #e2e8f0', height: '80vh', maxHeight: '600px' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-slate-900" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Búsqueda por Lote</span>
            </div>
            <button onClick={() => { setIsBatchSearchOpen(false); setBatchSearchInput(''); }} className="p-1 hover:bg-slate-100 cursor-pointer" style={{ borderRadius: '4px' }}>
              <X size={16} className="text-slate-600" />
            </button>
          </div>

          <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden min-h-0">
            {/* Columna Izquierda: Input */}
            <div className="flex flex-col gap-2 h-full">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Pegue la lista de seriales (uno por línea, o separados por comas/espacios)
              </label>
              <textarea
                value={batchSearchInput}
                onChange={e => setBatchSearchInput(e.target.value)}
                placeholder="Ingrese los seriales aquí..."
                className="flex-1 w-full text-xs p-3 bg-slate-50 border border-slate-200 text-black font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none font-mono"
                style={{ borderRadius: '4px' }}
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase shrink-0">
                <span>Cantidad ingresada: {searchSerials.length}</span>
                <button 
                  onClick={() => setBatchSearchInput('')} 
                  className="text-red-500 hover:text-red-700 cursor-pointer font-bold"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Columna Derecha: Resultados */}
            <div className="flex flex-col gap-2 h-full overflow-hidden">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0">
                Resultados de la búsqueda
              </label>
              <div className="flex-1 border border-slate-200 bg-slate-50 overflow-y-auto" style={{ borderRadius: '4px' }}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-250 text-[9px] text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                      <th className="py-2 px-3">Serial</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Fecha Ingreso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-10 text-slate-400 font-mono">
                          Ingrese seriales a la izquierda para ver su información.
                        </td>
                      </tr>
                    ) : (
                      results.map((res, index) => (
                        <tr key={index} className="hover:bg-slate-100 bg-white">
                          <td className="py-2 px-3 font-semibold font-mono tracking-wider uppercase text-slate-800">
                            {res.serial}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded-none text-[10px] font-bold ${
                              res.status === 'NO REGISTRADO' 
                                ? 'bg-rose-100 text-rose-800' 
                                : getStatusColor(res.status as POSStatus)
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold font-mono text-slate-700">
                            {res.date}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              onClick={() => { setIsBatchSearchOpen(false); setBatchSearchInput(''); }}
              className="px-4 py-2 text-xs font-bold uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              style={{ borderRadius: '4px' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
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
  const [accSim, setAccSim] = useState(false);
  const [costoBsf, setCostoBsf] = useState('');
  const [costoUsdt, setCostoUsdt] = useState('');
  const [banco, setBanco] = useState('');
  const [sinCosto, setSinCosto] = useState(false);

  const detectModelFromSerial = (serial: string, models: Record<string, any>): string => {
    if (!serial || !models) return '';
    const upper = serial.trim().toUpperCase();
    const sortedPrefixes = Object.keys(models).sort((a, b) => b.length - a.length);
    for (const prefix of sortedPrefixes) {
      if (upper.startsWith(prefix.toUpperCase())) {
        return prefix;
      }
    }
    for (const prefix of sortedPrefixes) {
      if (upper.includes(prefix.toUpperCase())) {
        return prefix;
      }
    }
    return '';
  };

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
    const isCas = !!(guia || rif || razonSocial || destino || (simNumber && simNumber !== 'NO POSEE') || modeloManual || operadora || modeloNegocio || accForro || accCargador || accCaja || accBateria || accSim || ticket || costoBsf || costoUsdt || banco || sinCosto);

    let maxId = serials.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);

    const newItems = rawLines.map((s) => {
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
        responsable: 'PEDRO PATIÑO',
        forro: accForro,
        bateria: accBateria,
        cargador: accCargador,
        caja: accCaja,
        sim: accSim,
        simNumber: accSim ? (simNumber.toUpperCase().trim() || 'NO POSEE') : 'NO POSEE',
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
        usdt: '',
        banco: banco.toUpperCase().trim(),
        cruceBatchId: activeCruceBatchId || undefined,
        sinCosto: sinCosto
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
    setAccSim(false);
    setCostoBsf('');
    setCostoUsdt('');
    setBanco('');
    setSinCosto(false);

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
        (s.banco && s.banco.toLowerCase().includes(searchLow)) ||
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
      if (!hasFiltersActive && s.isCasillero && s.status !== 'RECUPERADO') return false;
      if (hasFiltersActive && !includeCasillero && s.isCasillero && s.status !== 'RECUPERADO') return false;

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
    setSerials(prev => prev.map(s => {
      if (s.id === id) {
        if (s.serial === 'POR RECIBIR') {
          alert('El equipo sigue sin recibir. El estado debe ser PENDIENTE.');
          return s;
        }
        return trackAndLogChanges(s, { status });
      }
      return s;
    }));
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
        return trackAndLogChanges(s, {
          displayDate: displayVal,
          date: internalDate || s.date
        });
      }
      return s;
    }));
  };

  const applyBulkStatusToPage = () => {
    const pageIds = new Set(paginatedSerials.map(s => s.id));
    setSerials(prev => prev.map(s => pageIds.has(s.id) ? trackAndLogChanges(s, { status: bulkStatus }) : s));
    alert(`Se actualizó el estatus a ${bulkStatus} para los equipos de la página actual.`);
  };

  const applyBulkStatusToSelected = () => {
    const selectedCount = serials.filter(s => s.selected).length;
    if (selectedCount === 0) {
      alert('NO HAY EQUIPOS SELECCIONADOS');
      return;
    }
    setSerials(prev => prev.map(s => s.selected ? trackAndLogChanges(s, { status: bulkStatus }) : s));
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
      case 'ENTREGADO': 
        return 'bg-amber-100 text-amber-800 border-none font-bold shadow-xs';
      case 'CANCELADO': 
      case 'N#A': 
      case 'RECUPERADO':
      case 'DISPONIBLE':
        return 'bg-emerald-100 text-emerald-800 border-none font-bold shadow-xs';
      case 'SIN ESTATUS':
      default:
        return 'bg-slate-100 text-slate-800 border-none font-bold shadow-xs';
    }
  };

  const isAllSelected = paginatedSerials.length > 0 && paginatedSerials.every(s => s.selected);

  const handleExportFilteredOrSelected = () => {
    const selected = serials.filter(s => s.selected);
    const targets = selected.length > 0 ? selected : filteredSerials;

    if (targets.length === 0) {
      alert("No hay registros seleccionados o reflejados para exportar.");
      return;
    }

    let csv = "sep=;\nID;SERIAL_CRUCE;SERIAL_CASILLERO;STATUS;REMITENTE;GUI_ENTRADA;IS_CASILLERO;RIF;RAZON_SOCIAL;DESTINO;OBSERVACIONES;RESPONSABLE;FORRO;BATERIA;CARGADOR;CAJA;SIM;SIM_NUMBER;OPERADORA;MODELO_MANUAL;MODELO_NEGOCIO;ENTREGADO_TECNICO;ES_SUSTITUCION;SERIAL_SUSTITUTO;SIM_SUSTITUTO;SIM_SUSTITUTO_NUMBER;FECHA_SALIDA;FECHA_SALIDA_CLIENTE;GUIA_SALIDA_CLIENTE;DESTINO_SALIDA;FECHA_CONFIRMADA;TICKET;ADDED_FROM_CRUCE;BANCO;BSF;USDT;SIN_COSTO;CRUCE_BATCH_ID;FECHA_INGRESO\n";
    targets.forEach(s => {
      const serialCruce = !s.isCasillero ? s.serial : '';
      const serialCasillero = s.isCasillero ? s.serial : '';
      csv += `"${s.id}";"${serialCruce}";"${serialCasillero}";"${s.status}";"${s.remitente}";"${s.source || ''}";"${!!s.isCasillero}";"${s.rif || ''}";"${s.razonSocial || ''}";"${s.destino || ''}";"${s.notaReparacion || s.observaciones || ''}";"${s.responsable || ''}";"${!!s.forro}";"${!!s.bateria}";"${!!s.cargador}";"${!!s.caja}";"${!!s.sim}";"${s.simNumber || ''}";"${s.operadora || ''}";"${s.modeloManual || ''}";"${s.modeloNegocio || ''}";"${!!s.entregadoTecnico}";"${!!s.esSustitucion}";"${s.serialSustituto || ''}";"${!!s.simSustituto}";"${s.simSustitutoNumber || ''}";"${s.fechaSalida || ''}";"${s.fechaSalidaCliente || ''}";"${s.guiaSalidaCliente || ''}";"${s.destinoSalida || ''}";"${!!s.fechaConfirmada}";"${s.ticket || ''}";"${!!s.addedFromCruce}";"${s.banco || ''}";"${s.bsf || ''}";"${s.usdt || ''}";"${!!s.sinCosto}";"${s.cruceBatchId || ''}";"${s.date}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const filename = `exportacion_gestion_${localDate}.csv`;
    downloadBlob(blob, filename);
  };

  // Suggested Unique Remitentes for Datalist
  const uniqueRemitentes = useMemo(() => {
    return Array.from(new Set(serials.map(s => s.remitente))).filter(Boolean);
  }, [serials]);

  // Suggested Unique Bancos for Datalist
  const uniqueBancos = useMemo(() => {
    return Array.from(new Set(serials.map(s => s.banco).filter(Boolean))).sort();
  }, [serials]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 text-slate-800 gestion-general-tab">
      
      {/* SIDEBAR: INPUT DIRECTO LOGÍSTICO */}
      <div className="xl:col-span-1 dark-panel p-5 flex flex-col gap-4 h-fit">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="text-slate-900 w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider text-slate-900">INGRESAR SERIAL</h3>
        </div>

        {/* GRID DE INGRESO DE DATOS COMPACTO */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {/* Fila 1: Guía y Serial */}
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
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serial</label>
            <input
              type="text"
              value={bulkInput}
              onChange={e => {
                const val = e.target.value;
                setBulkInput(val);
                const firstSerial = val.split(/[\n,;\s]+/)[0] || '';
                const detected = detectModelFromSerial(firstSerial, modelosDB);
                if (detected) {
                  setModeloManual(detected);
                }
              }}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>



          {/* Fila 2: Remitente y Origen */}
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
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Origen</label>
            <input
              type="text"
              value={destino}
              onChange={e => setDestino(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>

          {/* Fila 3: Razón Social y RIF */}
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

          {/* Fila 4: Modelo y Ticket */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modelo POS</label>
            <input
              type="text"
              value={modeloManual}
              onChange={e => setModeloManual(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nro de Ticket</label>
            <input
              type="text"
              value={ticket}
              onChange={e => setTicket(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
          </div>

          {/* Número SIM moved below accessory buttons (see below) */}
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

          {/* Fila 6: Modelo Negocio */}
          <div className="flex flex-col gap-1 col-span-2">
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

          {/* Fila 7: Costo y al lado BANCO */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Costo</label>
            <input
              type="text"
              value={costoBsf}
              onChange={e => setCostoBsf(e.target.value)}
              disabled={sinCosto}
              placeholder=""
              className={`w-full text-sm p-2.5 bg-${sinCosto ? 'slate-200' : 'slate-100'} border border-${sinCosto ? 'slate-350' : 'transparent'} rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] ${sinCosto ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Banco</label>
            <input
              type="text"
              list="formBancoList"
              value={banco}
              onChange={e => setBanco(e.target.value)}
              placeholder=""
              className="w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
            />
            <datalist id="formBancoList">
              {uniqueBancos.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>

        {/* ACCESORIOS GESTION COMPLETA */}
        <div className="col-span-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
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
            <button
              type="button"
              onClick={() => {
                const newVal = !accSim;
                setAccSim(newVal);
                if (!newVal) {
                  setSimNumber('');
                } else {
                  setSimNumber('');
                }
              }}
              className={`flex items-center justify-between text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer border accessory-btn ${
                accSim ? 'active' : ''
              }`}
            >
              <span>SIM</span>
              {accSim && <Check size={12} />}
            </button>
            <button
              type="button"
              onClick={() => {
                const newVal = !sinCosto;
                setSinCosto(newVal);
                if (newVal) {
                  setCostoBsf('');
                  setCostoUsdt('');
                }
              }}
              className={`flex items-center justify-between text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer border accessory-btn ${
                sinCosto ? 'active' : ''
              }`}
            >
              <span>SIN COSTO</span>
              {sinCosto && <Check size={12} />}
            </button>
          </div>
        </div>

        {/* Número SIM: placed below the accessory buttons, enabled only when SIM is checked */}
        <div className="col-span-3 mt-3">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Número SIM</label>
          <input
            type="text"
            value={simNumber}
            onChange={e => setSimNumber(e.target.value)}
            placeholder=""
            disabled={!accSim}
            className={`w-full text-sm p-2.5 bg-slate-100 border border-transparent rounded-lg text-black uppercase font-arial font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] ${
              !accSim ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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
            <div className="flex flex-wrap gap-1.5 items-center flex-1 justify-end">
              <button
                onClick={deleteSelectedSerials}
                className="btn-red bg-red-500 hover:bg-red-600 text-white font-arial font-bold uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-none border border-red-500 cursor-pointer transition-all shadow-xs h-[28px] flex items-center justify-center text-white-force gap-1"
                style={{ color: '#ffffff' }}
                title="Eliminar seleccionados"
              >
                <Trash2 size={12} />
                ELIMINAR
              </button>

              <button
                onClick={handleExportFilteredOrSelected}
                className="btn-green bg-green-600 hover:bg-green-700 text-white font-arial font-bold uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-none border border-green-600 cursor-pointer transition-all shadow-xs h-[28px] flex items-center justify-center text-white-force gap-1"
                style={{ color: '#ffffff' }}
                title="Exportar seleccionados o reflejados a CSV"
              >
                <FileSpreadsheet size={12} />
                EXPORTAR CSV
              </button>

              <button
                onClick={() => setIsBatchSearchOpen(true)}
                className="btn-blue bg-blue-600 hover:bg-blue-700 text-white font-arial font-bold uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-none border border-blue-600 cursor-pointer transition-all shadow-xs h-[28px] flex items-center justify-center text-white-force gap-1"
                style={{ color: '#ffffff' }}
                title="Búsqueda por lote de seriales"
              >
                <Search size={12} />
                BÚSQUEDA POR LOTE
              </button>
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
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="rounded text-blue-600 bg-slate-100 border-slate-200 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">SERIAL</th>
                  <th className="py-3 px-4">MODELO</th>
                  <th className="py-3 px-4 w-36">STATUS</th>
                  <th className="py-3 px-4 w-36">DISPONIBILIDAD</th>
                  <th className="py-3 px-4">GUIA</th>
                  <th className="py-3 px-4">REMITENTE</th>
                  <th className="py-3 px-4 w-36">FECHA DE INGRESO</th>
                  <th className="py-3 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSerials.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 text-xs font-mono">
                      No se encontraron registros de terminales para los filtros establecidos.
                    </td>
                  </tr>
                ) : (
                  paginatedSerials.map(s => {
                    const modelInfo = getTerminalModel(s.serial, modelosDB);
                    const isNew = s.date && (Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000) <= 7);
                    const isRepetido = serials.filter(o => o.serial === s.serial).length > 1;

                    // Availability Indicator
                    const isDisponible = s.status === 'CANCELADO' || s.status === 'N#A' || s.status === 'RECUPERADO' || s.status === 'DISPONIBLE';
                    const isEntregado = s.status === 'PENDIENTE' || s.status === 'ACTIVO' || s.status === 'SUSPENDIDO' || s.status === 'ENTREGADO';

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
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span 
                              data-serial={s.serial}
                              className="text-sm cursor-help hover:text-slate-900 select-all font-bold tracking-wider transition-colors flex items-center gap-1.5 text-slate-800 font-arial"
                              onMouseEnter={(e) => {
                                if (serials.filter(o => o.serial === s.serial).length > 1) {
                                  onShowHistory(s.serial, e.currentTarget);
                                }
                              }}
                              onMouseLeave={onHideHistory}
                              onClick={async (e) => {
                                  e.stopPropagation();
                                  handleCopyText(s.serial, `serial-${s.id}`);
                              }}
                              title="Click para copiar serial"
                            >
                              <span className={`w-2 h-2 shrink-0 ${
                                ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'ENTREGADO'].includes(s.status)
                                  ? 'bg-orange-500'
                                  : ['CANCELADO', 'N#A', 'RECUPERADO', 'DISPONIBLE'].includes(s.status)
                                    ? 'bg-green-600'
                                    : 'bg-slate-400'
                              }`} style={{ borderRadius: '0px' }}></span>
                              <span style={{ letterSpacing: '0.08em' }}>{s.serial}</span>
                              {copiedKey === `serial-${s.id}` && (
                                <span className="inline-flex items-center justify-center bg-emerald-600 border border-emerald-500 rounded-none p-0.5 ml-1 transition-all animate-fade-in shrink-0">
                                  <Check className="w-2 h-2 text-white" />
                                </span>
                              )}
                            </span>
                            {(s.ticket || s.modeloNegocio) && (
                              <div className="flex flex-wrap items-center gap-1 pl-3.5">
                                {s.ticket && (
                                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                    TKT: {s.ticket}
                                  </span>
                                )}
                                {s.modeloNegocio && (
                                  <span className={getTagClass(s.modeloNegocio)}>{s.modeloNegocio}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5 font-arial">
                            <span className="text-xs font-bold text-slate-800 uppercase">
                              {modelInfo.so === 'ANDROID' ? 'ANDROID' : modelInfo.so === 'LINUX' ? 'LINUX' : 'UNK'} - {modelInfo.modelo}
                            </span>
                            {(s.sinCosto || s.banco || s.bsf || s.usdt) && (
                              <div className="text-[9px] text-slate-500 font-semibold uppercase font-arial">
                                {s.sinCosto ? (
                                  <span className="text-emerald-700 font-bold uppercase">SIN COSTO</span>
                                ) : (
                                  <>
                                    {s.banco && `${s.banco}`}
                                    {s.banco && (s.bsf || s.usdt) && ' - '}
                                    {s.bsf || s.usdt}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={s.status}
                            onChange={e => handleUpdateStatus(s.id, e.target.value as POSStatus)}
                            className={`text-xs px-2 py-1 rounded-none font-bold uppercase ${
                              ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'ENTREGADO'].includes(s.status)
                                ? 'status-select-orange'
                                : ['CANCELADO', 'N#A', 'RECUPERADO', 'DISPONIBLE'].includes(s.status)
                                  ? 'status-select-green'
                                  : 'bg-slate-100 text-slate-800'
                            } focus:ring-1 focus:ring-zinc-400 outline-none`}
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="ACTIVO">ACTIVO</option>
                            <option value="SUSPENDIDO">SUSPENDIDO</option>
                            <option value="CANCELADO">CANCELADO</option>
                            <option value="N#A">N#A</option>
                            <option value="RECUPERADO">RECUPERADO</option>
                            <option value="DISPONIBLE">DISPONIBLE</option>
                            <option value="ENTREGADO">ENTREGADO</option>
                            <option value="SIN ESTATUS">SIN ESTATUS</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {isDisponible ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-700 text-[10px] font-black uppercase">
                              <span className="w-1.5 h-1.5 bg-green-500 animate-pulse" style={{ borderRadius: '0px' }}></span>
                              DISPONIBLE
                            </span>
                          ) : isEntregado ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-700 text-[10px] font-black uppercase">
                              <span className="w-1.5 h-1.5 bg-orange-500 animate-pulse" style={{ borderRadius: '0px' }}></span>
                              ENTREGADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-700 text-[10px] font-black uppercase">
                              <span className="w-1.5 h-1.5 bg-slate-500" style={{ borderRadius: '0px' }}></span>
                              SIN ESTATUS
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          {s.source ? (
                            <span 
                              className="text-xs font-bold text-slate-800 select-all font-arial cursor-pointer hover:text-slate-950 hover:underline inline-flex items-center gap-1"
                              onClick={async (e) => {
                                e.stopPropagation();
                                handleCopyText(s.source, `guia-${s.id}`);
                              }}
                              title="Click para copiar guía"
                            >
                              <span>{s.source}</span>
                              {copiedKey === `guia-${s.id}` && (
                                <span className="inline-flex items-center justify-center bg-emerald-600 border border-emerald-500 rounded-none p-0.5 ml-1 transition-all animate-fade-in shrink-0">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span 
                            className="font-bold text-slate-800 cursor-pointer hover:text-slate-950 hover:underline flex items-center gap-1 font-arial uppercase"
                            onClick={() => onUserClick(s.remitente)}
                          >
                            {s.remitente}
                            {usersProfiles[s.remitente] && (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" title="Perfil asociado"></span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={s.displayDate || s.date.split('-').reverse().join('/')}
                            onChange={e => handleUpdateDateText(s.id, e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="bg-slate-100 border border-transparent rounded-none font-bold font-arial text-xs p-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 w-24 text-center"
                            style={{ fontFamily: 'Arial', fontWeight: 'bold' }}
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => openEdit(s)}
                            title="Editar registro"
                            className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-500 cursor-pointer transition-colors"
                            style={{ borderRadius: '0px' }}
                          >
                            <Pencil size={13} />
                          </button>
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

      {renderEditModal()}
      {renderBatchSearchModal()}
    </div>
  );
};
