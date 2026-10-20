import React, { useMemo, useState } from 'react';
import { Plus, Layers, ArrowRight, Wrench, CheckCircle2 } from 'lucide-react';

export type DiagnosticoStatus = 'REPARACION' | 'LISTO PARA LA ENTREGA';
export type ResultadoReparacion = 'LISTO PARA LA ENTREGA' | 'CARGA DE LLAVES' | 'IRREPARABLE';

export interface DiagnosticoRegistro {
  id: string;
  serial: string;
  modelo: string;
  origen: 'NEXGO' | 'ALIADO';
  aliado?: string;
  responsable: string;
  status: DiagnosticoStatus;
  laboratorio?: string;
  resultadoReparacion?: ResultadoReparacion;
  fecha: string;
  hora: string;
  fechaHora: string;
  createdAt?: string;
}

interface DiagnosticoProps {
  registrosDiagnosticos: DiagnosticoRegistro[];
  setRegistrosDiagnosticos: React.Dispatch<React.SetStateAction<DiagnosticoRegistro[]>>;
  mode?: 'form' | 'view' | 'repair';
}

const buildDiagnosticoRegistro = ({
  serial,
  modelo,
  origen,
  aliado,
  responsable,
  status,
  createdAt,
}: {
  serial: string;
  modelo: string;
  origen: 'NEXGO' | 'ALIADO';
  aliado?: string;
  responsable: string;
  status: DiagnosticoStatus;
  createdAt: Date;
}): DiagnosticoRegistro => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fecha = `${createdAt.getFullYear()}-${pad(createdAt.getMonth() + 1)}-${pad(createdAt.getDate())}`;
  const hora = `${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}:${pad(createdAt.getSeconds())}`;

  return {
    id: `diag-${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    serial: serial.trim(),
    modelo: modelo.trim(),
    origen,
    aliado: origen === 'ALIADO' ? (aliado?.trim() || 'SIN ALIADO') : undefined,
    responsable: responsable.trim(),
    status,
    fecha,
    hora,
    fechaHora: createdAt.toISOString(),
    createdAt: createdAt.toISOString(),
  };
};

export const Diagnostico: React.FC<DiagnosticoProps> = ({
  registrosDiagnosticos,
  setRegistrosDiagnosticos,
  mode = 'form',
}) => {
  const [serial, setSerial] = useState('');
  const [modelo, setModelo] = useState('');
  const [origen, setOrigen] = useState<'NEXGO' | 'ALIADO'>('NEXGO');
  const [aliado, setAliado] = useState('');
  const [responsable, setResponsable] = useState('');
  const [status, setStatus] = useState<DiagnosticoStatus>('REPARACION');

  const itemsEnReparacion = useMemo(
    () => registrosDiagnosticos.filter(item => item.status === 'REPARACION'),
    [registrosDiagnosticos]
  );

  const handleRegister = () => {
    const serialTrim = serial.trim();
    const modeloTrim = modelo.trim();
    const responsableTrim = responsable.trim();

    if (!serialTrim || !modeloTrim || !responsableTrim) {
      alert('Debe completar serial, modelo y responsable del diagnóstico.');
      return;
    }

    if (origen === 'ALIADO' && !aliado.trim()) {
      alert('Debe indicar el nombre del aliado cuando el origen sea ALIADO.');
      return;
    }

    const registro = buildDiagnosticoRegistro({
      serial: serialTrim,
      modelo: modeloTrim,
      origen,
      aliado: aliado.trim(),
      responsable: responsableTrim,
      status,
      createdAt: new Date(),
    });

    setRegistrosDiagnosticos(prev => [registro, ...prev]);
    setSerial('');
    setModelo('');
    setOrigen('NEXGO');
    setAliado('');
    setResponsable('');
    setStatus('REPARACION');
  };

  const total = useMemo(() => registrosDiagnosticos.length, [registrosDiagnosticos]);

  const getRegistroEstado = (registro: DiagnosticoRegistro) => registro.resultadoReparacion || registro.status;

  const updateRegistroReparacion = (registroId: string, patch: Partial<DiagnosticoRegistro>) => {
    setRegistrosDiagnosticos(prev => prev.map(item => item.id === registroId ? { ...item, ...patch } : item));
  };

  const handleResultadoReparacion = (registroId: string, resultado: ResultadoReparacion) => {
    updateRegistroReparacion(registroId, {
      resultadoReparacion: resultado,
      status: resultado === 'LISTO PARA LA ENTREGA' ? 'LISTO PARA LA ENTREGA' : 'REPARACION',
    });
  };

  if (mode === 'repair') {
    return (
      <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-6xl mx-auto">
        <div className="bg-white border border-slate-200 shadow-md overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="p-1 bg-transparent text-black">
              <Wrench size={26} className="text-black" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">REPARACION</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Equipos asignados al laboratorio</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serial del equipo</label>
                <input
                  type="text"
                  value={serial}
                  onChange={e => setSerial(e.target.value)}
                  placeholder="Serial del equipo"
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modelo</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={e => setModelo(e.target.value)}
                  placeholder="Modelo del equipo"
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>
            </div>

            {itemsEnReparacion.length === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] font-bold uppercase text-slate-400 border border-slate-200">
                No hay equipos en reparación.
              </div>
            ) : (
              itemsEnReparacion.map((registro) => (
                <div key={registro.id} className="border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Laboratorio</label>
                      <input
                        type="text"
                        value={registro.laboratorio || ''}
                        onChange={e => updateRegistroReparacion(registro.id, { laboratorio: e.target.value })}
                        placeholder="Responsable del laboratorio"
                        className="w-full text-xs p-2.5 bg-white border border-slate-250 uppercase font-semibold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</label>
                      <select
                        value={registro.resultadoReparacion || 'LISTO PARA LA ENTREGA'}
                        onChange={e => handleResultadoReparacion(registro.id, e.target.value as ResultadoReparacion)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-250 uppercase font-semibold"
                      >
                        <option value="LISTO PARA LA ENTREGA">LISTO PARA LA ENTREGA</option>
                        <option value="CARGA DE LLAVES">CARGA DE LLAVES</option>
                        <option value="IRREPARABLE">IRREPARABLE</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'form') {
    return (
      <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 shadow-md overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="p-1 bg-transparent text-black">
              <Wrench size={26} className="text-black" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">DIAGNOSTICO</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Registro de equipos para diagnóstico</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
              <div className="flex flex-col gap-1 xl:col-span-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serial</label>
                <input
                  type="text"
                  value={serial}
                  onChange={e => setSerial(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1 xl:col-span-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modelo</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={e => setModelo(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1 xl:col-span-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Origen</label>
                <select
                  value={origen}
                  onChange={e => setOrigen(e.target.value as 'NEXGO' | 'ALIADO')}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                >
                  <option value="NEXGO">NEXGO</option>
                  <option value="ALIADO">ALIADO</option>
                </select>
              </div>

              {origen === 'ALIADO' && (
                <div className="flex flex-col gap-1 xl:col-span-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aliado</label>
                  <input
                    type="text"
                    value={aliado}
                    onChange={e => setAliado(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                    placeholder="NOMBRE DEL ALIADO"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1 xl:col-span-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Responsable</label>
                <select
                  value={responsable}
                  onChange={e => setResponsable(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                >
                  <option value="">SELECCIONE</option>
                  <option value="PEDRO">PEDRO</option>
                  <option value="RICHARD">RICHARD</option>
                  <option value="LEANDRO">LEANDRO</option>
                  <option value="LUIS">LUIS</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 xl:col-span-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as DiagnosticoStatus)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                >
                  <option value="REPARACION">REPARACION</option>
                  <option value="LISTO PARA LA ENTREGA">LISTO PARA LA ENTREGA</option>
                </select>
              </div>

              <button
                onClick={handleRegister}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 rounded-full xl:col-span-1"
              >
                <Plus size={16} />
                <span>Registrar Diagnostico</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-6xl mx-auto">
      <div className="bg-white border border-slate-200 shadow-md overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="p-1 bg-transparent text-black">
            <Layers size={26} className="text-black" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">CANAL DE DIAGNOSTICOS</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Historial extenso del diagnóstico del equipo</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Registros</h3>
              <p className="text-[10px] font-bold uppercase text-slate-500">Total registrados: {total}</p>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ArrowRight size={14} />
              <span className="text-[10px] font-bold uppercase">Solo lectura</span>
            </div>
          </div>

          {registrosDiagnosticos.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11px] font-bold uppercase text-slate-400 border border-slate-200">
              No hay diagnósticos registrados.
            </div>
          ) : (
            <div className="space-y-4">
              {registrosDiagnosticos.map((registro) => (
                <div key={registro.id} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 text-[11px] font-semibold text-slate-700">
                    <div><span className="block text-[9px] uppercase text-slate-500 font-black">Fecha</span>{registro.fecha}</div>
                    <div><span className="block text-[9px] uppercase text-slate-500 font-black">Hora</span>{registro.hora}</div>
                    <div><span className="block text-[9px] uppercase text-slate-500 font-black">Serial</span>{registro.serial}</div>
                    <div><span className="block text-[9px] uppercase text-slate-500 font-black">Modelo</span>{registro.modelo}</div>
                    <div><span className="block text-[9px] uppercase text-slate-500 font-black">Origen</span>{registro.origen === 'ALIADO' ? `ALIADO (${registro.aliado || 'SIN ALIADO'})` : 'NEXGO'}</div>
                    <div><span className="block text-[9px] uppercase text-slate-500 font-black">Responsable</span>{registro.responsable}</div>
                    <div className="xl:col-span-2"><span className="block text-[9px] uppercase text-slate-500 font-black">Status</span>{getRegistroEstado(registro)}</div>
                    {registro.laboratorio && (
                      <div className="xl:col-span-2"><span className="block text-[9px] uppercase text-slate-500 font-black">Laboratorio</span>{registro.laboratorio}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
