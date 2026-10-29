import React, { useMemo, useState } from 'react';
import { Plus, Layers, ArrowRight } from 'lucide-react';
import { AliadoRegistro } from '../types';
import { buildAliadoRegistro } from '../utils';
import { DiagnosticoRegistro } from './Diagnostico';
import { SerialConSalida } from './SerialConSalida';

interface RecepcionAliadosProps {
  registrosAliados: AliadoRegistro[];
  setRegistrosAliados: React.Dispatch<React.SetStateAction<AliadoRegistro[]>>;
  registrosDiagnosticos: DiagnosticoRegistro[];
  mode?: 'form' | 'view';
  isReadOnly?: boolean;
}

export const RecepcionAliados: React.FC<RecepcionAliadosProps> = ({
  registrosAliados,
  setRegistrosAliados,
  registrosDiagnosticos,
  mode = 'form',
  isReadOnly = false,
}) => {
  const [modelo, setModelo] = useState('');
  const [serial, setSerial] = useState('');
  const [aliado, setAliado] = useState('');

  const handleRegister = () => {
    if (isReadOnly) return;
    const modeloTrim = modelo.trim();
    const serialTrim = serial.trim();
    const aliadoTrim = aliado.trim();

    if (!modeloTrim || !serialTrim || !aliadoTrim) {
      alert('Debe completar Modelo, Serial y Aliado.');
      return;
    }

    const registro = buildAliadoRegistro({
      modelo: modeloTrim,
      serial: serialTrim,
      aliado: aliadoTrim,
      createdAt: new Date(),
    });

    setRegistrosAliados(prev => [registro, ...prev]);
    setModelo('');
    setSerial('');
    setAliado('');
  };

  const total = useMemo(() => registrosAliados.length, [registrosAliados]);

  if (mode === 'form') {
    return (
      <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 shadow-md overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="p-1 bg-transparent text-black">
              <Layers size={26} className="text-black" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">RECEPCION ALIADOS</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Registro de equipos externos / aliados</p>
            </div>
          </div>

          <div className="p-6">
            {isReadOnly ? (
              <div className="p-6 bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase text-center text-xs mb-6">
                Modo Observador Activo: No tiene permisos para registrar equipos aliados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modelo</label>
                  <input
                    type="text"
                    value={modelo}
                    onChange={e => setModelo(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serial</label>
                  <input
                    type="text"
                    value={serial}
                    onChange={e => setSerial(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aliado</label>
                  <input
                    type="text"
                    value={aliado}
                    onChange={e => setAliado(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                  />
                </div>

                <button
                  onClick={handleRegister}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 rounded-full"
                >
                  <Plus size={16} />
                  <span>Registrar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-5xl mx-auto">
      <div className="bg-white border border-slate-200 shadow-md overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="p-1 bg-transparent text-black">
            <Layers size={26} className="text-black" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">CANAL ALIADOS</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Inventario de equipos ya registrados para el flujo de diagnóstico</p>
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
              <span className="text-[10px] font-bold uppercase">Canal de recepción</span>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-200">
            <div className="grid grid-cols-[1.2fr_1.2fr_1.2fr_1fr_1fr_1.2fr] bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <div className="px-3 py-2">Fecha</div>
              <div className="px-3 py-2">Hora</div>
              <div className="px-3 py-2">Aliado</div>
              <div className="px-3 py-2">Modelo</div>
              <div className="px-3 py-2">Serial</div>
              <div className="px-3 py-2">Flujo</div>
            </div>

            {registrosAliados.length === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] font-bold uppercase text-slate-400">
                No hay equipos registrados.
              </div>
            ) : (
              registrosAliados.map((registro) => (
                <div key={registro.id} className="grid grid-cols-[1.2fr_1.2fr_1.2fr_1fr_1fr_1.2fr] border-b border-slate-200 last:border-b-0 text-[11px] font-semibold text-slate-700">
                  <div className="px-3 py-3">{registro.fecha}</div>
                  <div className="px-3 py-3">{registro.hora}</div>
                  <div className="px-3 py-3">{registro.aliado}</div>
                  <div className="px-3 py-3 uppercase">{registro.modelo}</div>
                  <div className="px-3 py-3 uppercase font-mono">
                    <SerialConSalida
                      serial={registro.serial}
                      salida={registrosDiagnosticos.some(item => item.serial.trim().toUpperCase() === registro.serial.trim().toUpperCase() && !!item.salida)}
                    />
                  </div>
                  <div className="px-3 py-2">
                    <span className="py-2 text-[10px] font-black uppercase text-slate-600">
                      {registrosDiagnosticos.some(item => item.serial.trim().toUpperCase() === registro.serial.trim().toUpperCase())
                        ? 'En flujo'
                        : 'Disponible en diagnóstico'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
