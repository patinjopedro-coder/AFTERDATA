import React, { useMemo, useState } from 'react';
import { Plus, Layers, ArrowRight, Wrench, CheckCircle2, Check } from 'lucide-react';

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

export interface DiagnosticoLaboratorioRegistro {
  id: string;
  serial: string;
  diagnostico: string;
  responsable: string;
  fecha: string;
  hora: string;
  createdAt: string;
}

interface DiagnosticoProps {
  registrosDiagnosticos: DiagnosticoRegistro[];
  setRegistrosDiagnosticos: React.Dispatch<React.SetStateAction<DiagnosticoRegistro[]>>;
  serialesCargaLlaves?: string[];
  setSerialesCargaLlaves?: React.Dispatch<React.SetStateAction<string[]>>;
  registrosLaboratorio: DiagnosticoLaboratorioRegistro[];
  setRegistrosLaboratorio: React.Dispatch<React.SetStateAction<DiagnosticoLaboratorioRegistro[]>>;
  mode?: 'form' | 'view' | 'repair' | 'keys' | 'laboratorio';
  isReadOnly?: boolean;
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
  serialesCargaLlaves = [],
  setSerialesCargaLlaves,
  registrosLaboratorio,
  setRegistrosLaboratorio,
  mode = 'form',
  isReadOnly = false,
}) => {
  const [serial, setSerial] = useState('');
  const [serialCargaLlaves, setSerialCargaLlaves] = useState('');
  const [serialLaboratorio, setSerialLaboratorio] = useState('');
  const [diagnosticoLaboratorio, setDiagnosticoLaboratorio] = useState('');
  const [responsableLaboratorio, setResponsableLaboratorio] = useState('');
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

  const registrosCanal = useMemo(() => {
    const serialesDiagnostico = new Set(
      registrosDiagnosticos.map(registro => registro.serial.trim().toUpperCase())
    );
    const serialesLaboratorioIncluidos = new Set<string>();
    const laboratoriosSinDiagnostico = registrosLaboratorio.filter(registro => {
      const serialNormalizado = registro.serial.trim().toUpperCase();
      if (serialesDiagnostico.has(serialNormalizado) || serialesLaboratorioIncluidos.has(serialNormalizado)) {
        return false;
      }
      serialesLaboratorioIncluidos.add(serialNormalizado);
      return true;
    });

    const serialesRepresentados = new Set([
      ...serialesDiagnostico,
      ...registrosLaboratorio.map(registro => registro.serial.trim().toUpperCase()),
    ]);
    const cargasLlavesSinDiagnostico = serialesCargaLlaves
      .map(serial => serial.trim().toUpperCase())
      .filter(serial => serial && !serialesRepresentados.has(serial))
      .filter((serial, index, seriales) => seriales.indexOf(serial) === index);

    return [
      ...registrosDiagnosticos.map(registro => ({
        key: `diagnostico-${registro.id}`,
        serial: registro.serial,
        diagnostico: registro,
        laboratorio: registrosLaboratorio.find(
          item => item.serial.trim().toUpperCase() === registro.serial.trim().toUpperCase()
        ) || null,
      })),
      ...laboratoriosSinDiagnostico.map(laboratorio => ({
        key: `laboratorio-${laboratorio.id}`,
        serial: laboratorio.serial,
        diagnostico: null,
        laboratorio,
      })),
      ...cargasLlavesSinDiagnostico.map(serial => ({
        key: `carga-llaves-${serial}`,
        serial,
        diagnostico: null,
        laboratorio: null,
      })),
    ];
  }, [registrosDiagnosticos, registrosLaboratorio, serialesCargaLlaves]);
  const total = useMemo(() => registrosCanal.length, [registrosCanal]);

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

  const handleMarkKeyLoad = () => {
    if (isReadOnly || !setSerialesCargaLlaves) return;
    const serialNormalizado = serialCargaLlaves.trim().toUpperCase();
    if (!serialNormalizado) {
      alert('Debe ingresar un serial.');
      return;
    }

    setSerialesCargaLlaves(prev => (
      prev.some(item => item.trim().toUpperCase() === serialNormalizado)
        ? prev
        : [...prev, serialNormalizado]
    ));
    setSerialCargaLlaves('');
  };

  const handleRegisterLaboratorio = () => {
    if (isReadOnly) return;
    const serialNormalizado = serialLaboratorio.trim().toUpperCase();
    const diagnosticoTrim = diagnosticoLaboratorio.trim();
    const responsableTrim = responsableLaboratorio.trim();

    if (!serialNormalizado || !diagnosticoTrim || !responsableTrim) {
      alert('Debe completar serial, diagnóstico y responsable del laboratorio.');
      return;
    }

    const createdAt = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    setRegistrosLaboratorio(prev => [{
      id: `lab-${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      serial: serialNormalizado,
      diagnostico: diagnosticoTrim,
      responsable: responsableTrim,
      fecha: `${createdAt.getFullYear()}-${pad(createdAt.getMonth() + 1)}-${pad(createdAt.getDate())}`,
      hora: `${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}:${pad(createdAt.getSeconds())}`,
      createdAt: createdAt.toISOString(),
    }, ...prev]);
    setSerialLaboratorio('');
    setDiagnosticoLaboratorio('');
    setResponsableLaboratorio('');
  };

  if (mode === 'laboratorio') {
    return (
      <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-6xl mx-auto">
        <div className="bg-white border border-slate-200 shadow-md overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="p-1 bg-transparent text-black">
              <Wrench size={26} className="text-black" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">LABORATORIO</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Registre la observación y responsable del serial</p>
            </div>
          </div>

          <div className="p-6">
            {isReadOnly ? (
              <div className="p-6 bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase text-center text-xs">
                Modo Observador Activo: No tiene permisos para registrar información del laboratorio.
              </div>
            ) : (
              <form
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                onSubmit={event => {
                  event.preventDefault();
                  handleRegisterLaboratorio();
                }}
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serial</label>
                  <input
                    type="text"
                    value={serialLaboratorio}
                    onChange={event => setSerialLaboratorio(event.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Diagnóstico</label>
                  <textarea
                    value={diagnosticoLaboratorio}
                    onChange={event => setDiagnosticoLaboratorio(event.target.value)}
                    className="w-full min-h-[42px] text-xs p-2.5 bg-slate-100 border border-slate-250 font-semibold"
                    rows={1}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Responsable</label>
                  <input
                    type="text"
                    value={responsableLaboratorio}
                    onChange={event => setResponsableLaboratorio(event.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="md:col-span-3 w-full md:w-auto md:justify-self-end py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 rounded-full"
                >
                  <CheckCircle2 size={16} />
                  <span>Guardar diagnóstico de laboratorio</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'keys') {
    return (
      <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-6xl mx-auto">
        <div className="bg-white border border-slate-200 shadow-md overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="p-1 bg-transparent text-black">
              <Wrench size={26} className="text-black" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">CARGA DE LLAVES</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Marque los seriales que completaron la carga de llaves</p>
            </div>
          </div>

          <div className="p-6">
            {isReadOnly ? (
              <div className="p-6 bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase text-center text-xs">
                Modo Observador Activo: No tiene permisos para marcar cargas de llaves.
              </div>
            ) : (
              <form
                className="flex flex-col sm:flex-row gap-3 items-end"
                onSubmit={event => {
                  event.preventDefault();
                  handleMarkKeyLoad();
                }}
              >
                <div className="flex flex-col gap-1 flex-1 w-full">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serial</label>
                  <input
                    type="text"
                    value={serialCargaLlaves}
                    onChange={event => setSerialCargaLlaves(event.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                    placeholder="Ingrese el serial"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 rounded-full"
                >
                  <Check size={16} />
                  <span>Marcar carga de llaves</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

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

          {registrosCanal.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11px] font-bold uppercase text-slate-400 border border-slate-200">
              No hay diagnósticos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200">
              <div className="min-w-[1650px]">
                <div className="grid grid-cols-[130px_100px_180px_140px_180px_140px_180px_130px_190px_280px] bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <div className="px-3 py-3">Fecha</div>
                  <div className="px-3 py-3">Hora</div>
                  <div className="px-3 py-3">Serial</div>
                  <div className="px-3 py-3">Modelo</div>
                  <div className="px-3 py-3">Origen</div>
                  <div className="px-3 py-3">Responsable</div>
                  <div className="px-3 py-3">Status</div>
                  <div className="px-3 py-3 text-center">Carga de llaves</div>
                  <div className="px-3 py-3">Responsable laboratorio</div>
                  <div className="px-3 py-3">Diagnóstico laboratorio</div>
                </div>
                {registrosCanal.map(({ key, serial, diagnostico, laboratorio }) => {
                  const serialRegistro = serial;
                  const cargaLlavesMarcada = serialRegistro && serialesCargaLlaves.some(
                    item => item.trim().toUpperCase() === serialRegistro.trim().toUpperCase()
                  );
                  return (
                    <div
                      key={key}
                      className="grid grid-cols-[130px_100px_180px_140px_180px_140px_180px_130px_190px_280px] border-b border-slate-200 last:border-b-0 text-[11px] font-semibold text-slate-700"
                    >
                      <div className="px-3 py-3 whitespace-nowrap">{diagnostico?.fecha || laboratorio?.fecha || '-'}</div>
                      <div className="px-3 py-3 whitespace-nowrap">{diagnostico?.hora || laboratorio?.hora || '-'}</div>
                      <div className="px-3 py-3 uppercase font-mono whitespace-nowrap">{serialRegistro}</div>
                      <div className="px-3 py-3 uppercase whitespace-nowrap">{diagnostico?.modelo || '-'}</div>
                      <div className="px-3 py-3 uppercase whitespace-nowrap">{diagnostico ? (diagnostico.origen === 'ALIADO' ? `ALIADO (${diagnostico.aliado || 'SIN ALIADO'})` : 'NEXGO') : '-'}</div>
                      <div className="px-3 py-3 uppercase whitespace-nowrap">{diagnostico?.responsable || '-'}</div>
                      <div className="px-3 py-3 uppercase whitespace-nowrap">{diagnostico ? getRegistroEstado(diagnostico) : '-'}</div>
                      <div className="px-3 py-3 flex justify-center">
                        {cargaLlavesMarcada && (
                          <Check size={16} className="text-emerald-600" aria-label="Carga de llaves marcada" />
                        )}
                      </div>
                      <div className="px-3 py-3 uppercase whitespace-nowrap">{laboratorio?.responsable || '-'}</div>
                      <div className="px-3 py-3 whitespace-nowrap">{laboratorio?.diagnostico || '-'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
