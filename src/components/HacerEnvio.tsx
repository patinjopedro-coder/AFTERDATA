import React, { useState, useMemo } from 'react';
import { EnvioExterno, POSItem } from '../types';
import { formatRif } from '../utils';
import { Send, FileSymlink, Trash2, Search, ClipboardList, Check } from 'lucide-react';

interface HacerEnvioProps {
  enviosExternos: EnvioExterno[];
  setEnviosExternos: React.Dispatch<React.SetStateAction<EnvioExterno[]>>;
  serials: POSItem[];
  setSerials: React.Dispatch<React.SetStateAction<POSItem[]>>;
  activeCruceBatchId: string;
}

export const HacerEnvio: React.FC<HacerEnvioProps> = ({
  enviosExternos,
  setEnviosExternos,
  serials,
  setSerials,
  activeCruceBatchId
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [guia, setGuia] = useState('');
  const [serial, setSerial] = useState('');
  const [rif, setRif] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [destino, setDestino] = useState('');
  const [ticket, setTicket] = useState('');
  const [solicitante, setSolicitante] = useState('');

  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !guia.trim() || !serial.trim()) {
      alert('Fecha, Guía de Salida y Serial son obligatorios.');
      return;
    }

    const nuevo: EnvioExterno = {
      fecha,
      guia: guia.trim().toUpperCase(),
      serial: serial.trim().toUpperCase(),
      rif: formatRif(rif),
      razonSocial: razonSocial.trim().toUpperCase(),
      destino: destino.trim().toUpperCase(),
      ticket: ticket.trim().toUpperCase(),
      solicitante: solicitante.trim().toUpperCase()
    };

    setEnviosExternos(prev => [...prev, nuevo]);

    // Create Casillero Entry
    const maxId = serials.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);
    const newPosItem: POSItem = {
      id: maxId + 1,
      serial: 'POR RECIBIR',
      date: fecha,
      displayDate: fecha.split('-').reverse().join('/'),
      status: 'SIN ESTATUS',
      remitente: razonSocial.trim().toUpperCase() || 'ENVÍO SIN SALIENTE',
      source: '',
      isCasillero: true,
      selected: false,
      rif: formatRif(rif),
      razonSocial: razonSocial.trim().toUpperCase(),
      destino: destino.trim().toUpperCase(),
      banco: '',
      simNumber: '',
      operadora: 'DIGITEL',
      responsable: solicitante.trim().toUpperCase(),
      observaciones: 'Generado desde Envíos sin Saliente',
      serialSustituto: serial.trim().toUpperCase(),
      esSustitucion: true,
      fechaSalida: fecha,
      fechaSalidaCliente: fecha,
      guiaSalidaCliente: guia.trim().toUpperCase(),
      fechaConfirmada: true,
      forro: false,
      cargador: false,
      caja: false,
      sim: false,
      bateria: false,
      ticket: ticket.trim().toUpperCase(),
      bsf: '',
      cruceBatchId: activeCruceBatchId || undefined
    };
    
    setSerials(prev => [newPosItem, ...prev]);

    // Reset Form (except date)
    setGuia('');
    setSerial('');
    setRif('');
    setRazonSocial('');
    setDestino('');
    setTicket('');
    setSolicitante('');

    alert('Envío sin saliente registrado con éxito. Se ha añadido a Casillero.');
  };

  const handleDelete = (index: number) => {
    if (confirm('¿Desea eliminar este registro de envío sin saliente?')) {
      setEnviosExternos(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Filter local shipments
  const filtered = useMemo(() => {
    const sLow = search.toLowerCase();
    return enviosExternos.filter(e => {
      return !search ||
        e.serial.toLowerCase().includes(sLow) ||
        e.guia.toLowerCase().includes(sLow) ||
        (e.rif && e.rif.toLowerCase().includes(sLow)) ||
        (e.razonSocial && e.razonSocial.toLowerCase().includes(sLow)) ||
        (e.destino && e.destino.toLowerCase().includes(sLow)) ||
        (e.ticket && e.ticket.toLowerCase().includes(sLow)) ||
        (e.solicitante && e.solicitante.toLowerCase().includes(sLow));
    });
  }, [enviosExternos, search]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-slate-800">
      
      {/* FORMULARIO DE CREACIÓN */}
      <div className="lg:col-span-1 dark-panel p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileSymlink className="text-slate-900 w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider text-slate-900">REGISTRAR ENVÍO</h3>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fecha Salida</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-slate-200"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Número de Guía de Salida</label>
            <input
              type="text"
              value={guia}
              onChange={e => setGuia(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-200"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serial del Equipo (POS)</label>
            <input
              type="text"
              value={serial}
              onChange={e => setSerial(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-200"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Cédula / RIF</label>
            <input
              type="text"
              value={rif}
              onChange={e => setRif(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Razón Social Cliente</label>
            <input
              type="text"
              value={razonSocial}
              onChange={e => setRazonSocial(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Destino</label>
            <input
              type="text"
              value={destino}
              onChange={e => setDestino(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Nro de Ticket</label>
            <input
              type="text"
              value={ticket}
              onChange={e => setTicket(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Solicitante</label>
            <input
              type="text"
              value={solicitante}
              onChange={e => setSolicitante(e.target.value)}
              placeholder=""
              className="w-full text-xs p-2.5 bg-slate-100 border border-transparent rounded-lg text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white-force rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer border border-transparent shadow-sm"
          >
            <Send size={12} className="text-white-force" />
            <span className="text-white-force">Registrar Envío</span>
          </button>
        </form>

      </div>

      {/* REGISTRO DE ENVÍOS ALMACENADOS */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-center text-slate-800">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-slate-650 w-5 h-5" />
            <h3 className="font-bold text-sm tracking-wider uppercase">ENVÍOS SIN SALIENTE</h3>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por serial, guía o RIF..."
              className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-transparent rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <Search size={14} className="absolute left-2.5 top-3 text-slate-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden text-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha Salida</th>
                  <th className="py-3 px-4">Guía Salida</th>
                  <th className="py-3 px-4">Serial POS</th>
                  <th className="py-3 px-4">Cédula / RIF</th>
                  <th className="py-3 px-4">Razón Social Cliente</th>
                  <th className="py-3 px-4">Destino</th>
                  <th className="py-3 px-4 text-center">Ticket</th>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4 w-12 text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400 text-xs font-mono">
                      No hay registros de envíos sin saliente que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filtered.slice().reverse().map((e, index) => {
                    const originalIndex = enviosExternos.length - 1 - index;
                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors text-xs font-mono border-b border-slate-100 text-slate-800">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-650">
                          {e.fecha.split('-').reverse().join('/')}
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className="bg-slate-100 px-2 py-1 rounded text-sm text-slate-700 hover:underline cursor-pointer font-bold border border-transparent shadow-xs font-arial inline-flex items-center gap-1"
                            onClick={() => handleCopyText(e.guia, `guia-${originalIndex}`)}
                          >
                            <span>{e.guia}</span>
                            {copiedKey === `guia-${originalIndex}` && (
                              <span className="inline-flex items-center justify-center bg-emerald-600 border border-emerald-500 rounded p-0.5 ml-1 transition-all animate-fade-in shrink-0">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold select-all text-slate-850 font-bold font-arial">
                          {e.serial}
                        </td>
                        <td className="py-3 px-4 uppercase text-slate-650">{e.rif || '-'}</td>
                        <td className="py-3 px-4 uppercase font-bold text-slate-800 font-arial">{e.razonSocial || '-'}</td>
                        <td className="py-3 px-4 uppercase text-slate-800 font-sans">{e.destino || '-'}</td>
                        <td className="py-3 px-4 text-center text-amber-700">{e.ticket || '-'}</td>
                        <td className="py-3 px-4 uppercase text-slate-650 font-sans">{e.solicitante || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDelete(originalIndex)}
                            className="action-btn-delete p-1.5 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
