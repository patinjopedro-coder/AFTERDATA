import React, { useState } from 'react';
import { EnvioExterno } from '../types';
import { Send, FileSymlink, Trash2, Search, ClipboardList } from 'lucide-react';

interface HacerEnvioProps {
  enviosExternos: EnvioExterno[];
  setEnviosExternos: React.Dispatch<React.SetStateAction<EnvioExterno[]>>;
}

export const HacerEnvio: React.FC<HacerEnvioProps> = ({
  enviosExternos,
  setEnviosExternos
}) => {
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
      rif: rif.trim().toUpperCase(),
      razonSocial: razonSocial.trim().toUpperCase(),
      destino: destino.trim().toUpperCase(),
      ticket: ticket.trim().toUpperCase(),
      solicitante: solicitante.trim().toUpperCase()
    };

    setEnviosExternos(prev => [...prev, nuevo]);

    // Reset Form (except date)
    setGuia('');
    setSerial('');
    setRif('');
    setRazonSocial('');
    setDestino('');
    setTicket('');
    setSolicitante('');

    alert('Envío externo registrado con éxito.');
  };

  const handleDelete = (index: number) => {
    if (confirm('¿Desea eliminar este registro de envío externo?')) {
      setEnviosExternos(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Filter local shipments
  const filtered = enviosExternos.filter(e => {
    const sLow = search.toLowerCase();
    return !search ||
      e.serial.toLowerCase().includes(sLow) ||
      e.guia.toLowerCase().includes(sLow) ||
      (e.rif && e.rif.toLowerCase().includes(sLow)) ||
      (e.razonSocial && e.razonSocial.toLowerCase().includes(sLow)) ||
      (e.destino && e.destino.toLowerCase().includes(sLow)) ||
      (e.ticket && e.ticket.toLowerCase().includes(sLow)) ||
      (e.solicitante && e.solicitante.toLowerCase().includes(sLow));
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in text-slate-100">
      
      {/* FORMULARIO DE CREACIÓN */}
      <div className="lg:col-span-1 bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileSymlink className="text-emerald-500 w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wider text-emerald-400">REGISTRAR ENVÍO</h3>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha Salida</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-semibold uppercase"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Número de Guía de Salida</label>
            <input
              type="text"
              value={guia}
              onChange={e => setGuia(e.target.value)}
              placeholder="GUÍA REQUERIDA"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Serial del Equipo (POS)</label>
            <input
              type="text"
              value={serial}
              onChange={e => setSerial(e.target.value)}
              placeholder="SERIAL REQUERIDO"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">Cédula / RIF</label>
            <input
              type="text"
              value={rif}
              onChange={e => setRif(e.target.value)}
              placeholder="RIF RECEPTOR"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">Razón Social Cliente</label>
            <input
              type="text"
              value={razonSocial}
              onChange={e => setRazonSocial(e.target.value)}
              placeholder="NOMBRE O EMPRESA"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">Destino</label>
            <input
              type="text"
              value={destino}
              onChange={e => setDestino(e.target.value)}
              placeholder="CIUDAD DE LLEGADA"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">N° Ticket / Caso</label>
            <input
              type="text"
              value={ticket}
              onChange={e => setTicket(e.target.value)}
              placeholder="OPCIONAL"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">Solicitante</label>
            <input
              type="text"
              value={solicitante}
              onChange={e => setSolicitante(e.target.value)}
              placeholder="QUIÉN SOLICITA EL ENVÍO"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 uppercase"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-2 shadow-lg hover:shadow-emerald-500/20 shadow-emerald-500/5 cursor-pointer"
          >
            <Send size={12} />
            <span>Registrar Envío</span>
          </button>
        </form>

      </div>

      {/* REGISTRO DE ENVÍOS ALMACENADOS */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        
        <div className="bg-[#1e2336] p-4 rounded-xl border border-[#2a2f42] flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-slate-400 w-5 h-5" />
            <h3 className="font-bold text-sm tracking-wider uppercase">Envíos Externos Registrados</h3>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por serial, guía o RIF..."
              className="w-full text-xs p-2.5 pl-8 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            />
            <Search size={14} className="absolute left-2.5 top-3 text-slate-500" />
          </div>
        </div>

        <div className="bg-[#1e2336] rounded-xl border border-[#2a2f42] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151925]/50 border-b border-[#2a2f42] text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-[#2a2f42]/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500 text-xs font-mono">
                      No hay registros de envíos externos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filtered.slice().reverse().map((e, index) => {
                    const originalIndex = enviosExternos.length - 1 - index;
                    return (
                      <tr key={index} className="hover:bg-white/5 transition-colors text-xs font-mono">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                          {e.fecha.split('-').reverse().join('/')}
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className="bg-slate-950 px-2 py-1 rounded text-[11px] text-slate-300 hover:text-blue-400 cursor-pointer font-bold border border-slate-850"
                            onClick={() => navigator.clipboard.writeText(e.guia)}
                          >
                            {e.guia}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold select-all text-blue-300">
                          {e.serial}
                        </td>
                        <td className="py-3 px-4 uppercase text-slate-300">{e.rif || '-'}</td>
                        <td className="py-3 px-4 uppercase font-bold text-slate-200 font-sans">{e.razonSocial || '-'}</td>
                        <td className="py-3 px-4 uppercase text-slate-200 font-sans">{e.destino || '-'}</td>
                        <td className="py-3 px-4 text-center text-amber-400">{e.ticket || '-'}</td>
                        <td className="py-3 px-4 uppercase text-slate-400 font-sans">{e.solicitante || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDelete(originalIndex)}
                            className="text-red-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
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
