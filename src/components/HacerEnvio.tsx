import React, { useState, useMemo } from 'react';
import { EnvioExterno, POSItem } from '../types';
import { formatRif, copyToClipboard } from '../utils';
import { Trash2, Search, ClipboardList, Check } from 'lucide-react';

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
    await copyToClipboard(text);
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
      ticket: ticket.trim().toUpperCase()
    };

    setEnviosExternos(prev => [...prev, nuevo]);

    // Create Casillero Entry
    const maxId = serials.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);
    const newPosItem: POSItem = {
      id: maxId + 1,
      serial: 'POR RECIBIR',
      date: fecha,
      displayDate: safeSplit(fecha || '', '-').reverse().join('/'),
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
        (e.ticket && e.ticket.toLowerCase().includes(sLow));
    });
  }, [enviosExternos, search]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800">

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
                  <th className="py-3 px-4 w-12 text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs font-mono">
                      No hay registros de envíos sin saliente que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filtered.slice().reverse().map((e, index) => {
                    const originalIndex = enviosExternos.length - 1 - index;
                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors text-xs font-mono border-b border-slate-100 text-slate-800">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-650">
                          {safeSplit(e.fecha || '', '-').reverse().join('/')}
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
