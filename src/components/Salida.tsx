import React, { useState } from 'react';
import { CheckCircle2, PackageCheck } from 'lucide-react';
import { DiagnosticoRegistro } from './Diagnostico';
import { SerialConSalida } from './SerialConSalida';

const RESPONSABLES_SALIDA = ['GENYERLING', 'CARLOS'];
const DESTINOS_SALIDA = ['ALMACEN', 'PEDRO', 'NANCY', 'TIENDA', 'VENTAS', 'POSTVENTAS'];

interface SalidaProps {
  registrosDiagnosticos: DiagnosticoRegistro[];
  onRegistrarSalida: (registroId: string, salida: NonNullable<DiagnosticoRegistro['salida']>) => void;
  isReadOnly?: boolean;
}

export const Salida: React.FC<SalidaProps> = ({
  registrosDiagnosticos,
  onRegistrarSalida,
  isReadOnly = false,
}) => {
  const [responsables, setResponsables] = useState<Record<string, string>>({});
  const [destinos, setDestinos] = useState<Record<string, string>>({});
  const equiposPorSerial = new Map<string, DiagnosticoRegistro>();
  for (const registro of [...registrosDiagnosticos].sort((a, b) => (
    (a.createdAt || a.fechaHora).localeCompare(b.createdAt || b.fechaHora)
  ))) {
    equiposPorSerial.set(registro.serial.trim().toUpperCase(), registro);
  }
  const equiposListos = Array.from(equiposPorSerial.values())
    .filter(registro => registro.status === 'LISTO PARA LA ENTREGA');

  const handleRegistrarSalida = (registro: DiagnosticoRegistro) => {
    if (isReadOnly || registro.salida) return;
    const responsable = responsables[registro.id] || '';
    const destino = destinos[registro.id] || '';
    if (!responsable || !destino) {
      alert('Seleccione el responsable y el destino de la salida.');
      return;
    }

    const createdAt = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    onRegistrarSalida(registro.id, {
      responsable,
      destino,
      fecha: `${createdAt.getFullYear()}-${pad(createdAt.getMonth() + 1)}-${pad(createdAt.getDate())}`,
      hora: `${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}:${pad(createdAt.getSeconds())}`,
      createdAt: createdAt.toISOString(),
    });
  };

  return (
    <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-6xl mx-auto">
      <div className="bg-white border border-slate-200 shadow-md overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="p-1 bg-transparent text-black">
            <PackageCheck size={26} className="text-black" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">SALIDA</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">
              Registre el destino de equipos aprobados para entrega
            </p>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {equiposListos.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11px] font-bold uppercase text-slate-400 border border-slate-200">
              No hay equipos listos para salida.
            </div>
          ) : equiposListos.map(registro => (
            <div key={registro.id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-3 items-center border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Serial / Modelo</span>
                <span className="text-xs font-mono font-bold uppercase text-slate-800">
                  <SerialConSalida serial={registro.serial} salida={!!registro.salida} />
                </span>
                <span className="text-[10px] font-semibold uppercase text-slate-500">{registro.modelo}</span>
              </div>
              {registro.salida ? (
                <>
                  <div className="text-[10px] font-bold uppercase">Responsable: {registro.salida.responsable}</div>
                  <div className="text-[10px] font-bold uppercase">Destino: {registro.salida.destino}</div>
                  <div className="text-[10px] font-semibold">{registro.salida.fecha} {registro.salida.hora}</div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700">
                    <CheckCircle2 size={14} /> Salida registrada
                  </span>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-1 text-[9px] font-bold uppercase text-slate-500">
                    Responsable
                    <select
                      value={responsables[registro.id] || ''}
                      onChange={event => setResponsables(prev => ({ ...prev, [registro.id]: event.target.value }))}
                      disabled={isReadOnly}
                      className="w-full text-xs p-2.5 bg-white border border-slate-250 uppercase font-semibold text-slate-800"
                    >
                      <option value="">SELECCIONE</option>
                      {RESPONSABLES_SALIDA.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[9px] font-bold uppercase text-slate-500">
                    Destino
                    <select
                      value={destinos[registro.id] || ''}
                      onChange={event => setDestinos(prev => ({ ...prev, [registro.id]: event.target.value }))}
                      disabled={isReadOnly}
                      className="w-full text-xs p-2.5 bg-white border border-slate-250 uppercase font-semibold text-slate-800"
                    >
                      <option value="">SELECCIONE</option>
                      {DESTINOS_SALIDA.map(destino => <option key={destino} value={destino}>{destino}</option>)}
                    </select>
                  </label>
                  {isReadOnly ? (
                    <span className="text-[10px] font-bold uppercase text-slate-400">Solo consulta</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegistrarSalida(registro)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Registrar salida
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
