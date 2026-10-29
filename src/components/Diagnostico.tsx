import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, ClipboardList, Layers, Search, Wrench } from 'lucide-react';
import { ModelConfig, AliadoRegistro, POSItem } from '../types';
import { getTerminalModel } from '../data';
import { SerialConSalida } from './SerialConSalida';

export type DiagnosticoStatus =
  | 'PENDIENTE DIAGNOSTICO'
  | 'REPARACION'
  | 'PENDIENTE APROBACION'
  | 'LISTO PARA LA ENTREGA'
  | 'IRREPARABLE'
  | 'CARGA DE LLAVES';
export type ResultadoReparacion = 'REPARADO' | 'LISTO PARA LA ENTREGA' | 'CARGA DE LLAVES' | 'IRREPARABLE';

export interface DiagnosticoEvento {
  id: string;
  etapa: string;
  responsable: string;
  status: string;
  detalle: string;
  fecha: string;
  hora: string;
  createdAt: string;
}

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
  sourceAliadoId?: string;
  salida?: {
    responsable: string;
    destino: string;
    fecha: string;
    hora: string;
    createdAt: string;
  };
  historial?: DiagnosticoEvento[];
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
  serials?: POSItem[];
  registrosAliados?: AliadoRegistro[];
  modelosDB?: Record<string, ModelConfig>;
  registrosDiagnosticos: DiagnosticoRegistro[];
  setRegistrosDiagnosticos: React.Dispatch<React.SetStateAction<DiagnosticoRegistro[]>>;
  serialesCargaLlaves?: string[];
  setSerialesCargaLlaves?: React.Dispatch<React.SetStateAction<string[]>>;
  registrosLaboratorio?: DiagnosticoLaboratorioRegistro[];
  setRegistrosLaboratorio?: React.Dispatch<React.SetStateAction<DiagnosticoLaboratorioRegistro[]>>;
  mode?: 'form' | 'view' | 'repair' | 'keys' | 'laboratorio';
  isReadOnly?: boolean;
}

const DIAGNOSTICO_RESPONSABLES = ['PEDRO', 'LUIS', 'RICHARD', 'LEANDRO'];
const LABORATORIO_RESPONSABLES = ['JORGE', 'WESLEY', 'JESUS'];

const fechaHoraActual = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    fecha: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    hora: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    createdAt: date.toISOString(),
  };
};

const crearEvento = (etapa: string, responsable: string, status: string, detalle: string): DiagnosticoEvento => {
  const fecha = fechaHoraActual(new Date());
  return {
    id: `evento-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    etapa,
    responsable,
    status,
    detalle,
    ...fecha,
  };
};

const serialNormalizado = (serial: string) => serial.trim().toUpperCase();

export const Diagnostico: React.FC<DiagnosticoProps> = ({
  serials = [],
  registrosAliados = [],
  modelosDB = {},
  registrosDiagnosticos,
  setRegistrosDiagnosticos,
  setSerialesCargaLlaves,
  registrosLaboratorio = [],
  mode = 'form',
  isReadOnly = false,
}) => {
  const [buscar, setBuscar] = useState('');
  const [responsablesPorSerial, setResponsablesPorSerial] = useState<Record<string, string>>({});
  const [statusPorSerial, setStatusPorSerial] = useState<Record<string, '' | 'REPARACION' | 'LISTO PARA LA ENTREGA'>>({});
  const [responsablesLaboratorio, setResponsablesLaboratorio] = useState<Record<string, string>>({});
  const [resultadosLaboratorio, setResultadosLaboratorio] = useState<Record<string, ResultadoReparacion | ''>>({});
  const [serialCargaLlaves, setSerialCargaLlaves] = useState('');

  const equiposExistentes = useMemo(() => {
    const encontrados = new Map<string, { serial: string; modelo: string; origen: 'NEXGO' | 'ALIADO'; aliado?: string }>();
    for (const registro of registrosAliados) {
      const key = serialNormalizado(registro.serial);
      if (key) encontrados.set(key, {
        serial: key,
        modelo: registro.modelo || 'SIN MODELO',
        origen: 'ALIADO',
        aliado: registro.aliado,
      });
    }
    for (const equipo of serials) {
      const key = serialNormalizado(equipo.serial || '');
      if (key && !encontrados.has(key)) encontrados.set(key, {
        serial: key,
        modelo: equipo.modeloManual || getTerminalModel(key, modelosDB).modelo || 'SIN MODELO',
        origen: 'NEXGO',
      });
    }
    return Array.from(encontrados.values());
  }, [serials, registrosAliados, modelosDB]);

  const registrosUnicosPorSerial = useMemo(() => {
    const masRecientes = new Map<string, DiagnosticoRegistro>();
    const ordenados = [...registrosDiagnosticos].sort((a, b) => (
      (a.createdAt || a.fechaHora).localeCompare(b.createdAt || b.fechaHora)
    ));
    for (const registro of ordenados) masRecientes.set(serialNormalizado(registro.serial), registro);
    return Array.from(masRecientes.values());
  }, [registrosDiagnosticos]);

  const registroPorSerial = useMemo(() => new Map(
    registrosUnicosPorSerial.map(registro => [serialNormalizado(registro.serial), registro])
  ), [registrosUnicosPorSerial]);

  const equiposFiltrados = useMemo(() => {
    const filtro = serialNormalizado(buscar);
    return equiposExistentes.filter(equipo => {
      const registro = registroPorSerial.get(equipo.serial);
      if (registro?.salida) return false;
      return !filtro || equipo.serial.includes(filtro) ||
        equipo.modelo.toUpperCase().includes(filtro) ||
        (equipo.aliado || '').toUpperCase().includes(filtro);
    });
  }, [buscar, equiposExistentes, registroPorSerial]);

  const itemsEnReparacion = useMemo(
    () => registrosUnicosPorSerial.filter(registro =>
      registro.status === 'REPARACION' && !registro.salida &&
      equiposExistentes.some(equipo => equipo.serial === serialNormalizado(registro.serial))
    ),
    [registrosUnicosPorSerial, equiposExistentes]
  );

  const historial = useMemo(() => {
    const flujo = registrosDiagnosticos.flatMap(registro => {
      const eventos = registro.historial?.length ? registro.historial : [{
        id: `legado-${registro.id}`,
        etapa: 'DIAGNOSTICO',
        responsable: registro.responsable || '-',
        status: registro.status,
        detalle: registro.resultadoReparacion || 'Registro previo al historial de etapas.',
        fecha: registro.fecha,
        hora: registro.hora,
        createdAt: registro.createdAt || registro.fechaHora,
      }];
      return eventos.map(evento => ({ ...evento, registro }));
    });
    const eventosLegadosVistos = new Set<string>();
    const flujoSinDuplicadosLegados = flujo.filter(evento => {
      if (evento.id.startsWith('legado-')) {
        const clave = [
          serialNormalizado(evento.registro.serial),
          evento.etapa,
          evento.responsable,
          evento.status,
          evento.detalle,
        ].join('|');
        if (eventosLegadosVistos.has(clave)) return false;
        eventosLegadosVistos.add(clave);
      }
      return true;
    });
    const serialesConHistorialLaboratorio = new Set(flujoSinDuplicadosLegados
      .filter(evento => evento.etapa === 'LABORATORIO / REPARACION')
      .map(evento => serialNormalizado(evento.registro.serial)));
    const laboratorioPrevio = registrosLaboratorio
      .filter(registro => !serialesConHistorialLaboratorio.has(serialNormalizado(registro.serial)))
      .map(registro => ({
        id: registro.id,
        etapa: 'LABORATORIO / REPARACION',
        responsable: registro.responsable,
        status: 'DIAGNOSTICO REGISTRADO',
        detalle: registro.diagnostico,
        fecha: registro.fecha,
        hora: registro.hora,
        createdAt: registro.createdAt,
        registro: registrosDiagnosticos.find(item => serialNormalizado(item.serial) === serialNormalizado(registro.serial)) || {
          id: `legado-lab-${registro.id}`,
          serial: registro.serial,
          modelo: 'SIN MODELO',
          origen: 'NEXGO' as const,
          responsable: registro.responsable,
          status: 'REPARACION' as const,
          fecha: registro.fecha,
          hora: registro.hora,
          fechaHora: registro.createdAt,
        },
      }));
    return [...flujoSinDuplicadosLegados, ...laboratorioPrevio].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [registrosDiagnosticos, registrosLaboratorio]);

  const iniciarDiagnostico = (equipo: typeof equiposExistentes[number]) => {
    if (isReadOnly) return;
    const responsable = responsablesPorSerial[equipo.serial] || '';
    const status = statusPorSerial[equipo.serial] || '';
    if (!responsable || !status) {
      alert('Seleccione responsable y status del diagnóstico.');
      return;
    }
    const fecha = fechaHoraActual(new Date());
    const evento = crearEvento('DIAGNOSTICO', responsable, status, 'Equipo existente recibido para diagnóstico.');
    const registro: DiagnosticoRegistro = {
      id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      serial: equipo.serial,
      modelo: equipo.modelo,
      origen: equipo.origen,
      aliado: equipo.aliado,
      responsable,
      status,
      fecha: fecha.fecha,
      hora: fecha.hora,
      fechaHora: fecha.createdAt,
      createdAt: fecha.createdAt,
      historial: [evento],
    };
    setRegistrosDiagnosticos(prev => prev.some(item => serialNormalizado(item.serial) === equipo.serial)
      ? prev
      : [registro, ...prev]);
  };

  const guardarDiagnosticoPendiente = (registro: DiagnosticoRegistro) => {
    if (isReadOnly) return;
    const serial = serialNormalizado(registro.serial);
    const responsable = responsablesPorSerial[serial] || '';
    const status = statusPorSerial[serial] || '';
    if (!responsable || !status) {
      alert('Seleccione responsable y status del diagnóstico.');
      return;
    }
    const evento = crearEvento('DIAGNOSTICO', responsable, status, 'Status de diagnóstico registrado.');
    setRegistrosDiagnosticos(prev => prev.map(item => item.id === registro.id ? {
      ...item,
      responsable,
      status,
      historial: [...(item.historial || []), evento],
    } : item));
  };

  const aprobarEquipo = (registro: DiagnosticoRegistro) => {
    if (isReadOnly) return;
    const responsable = responsablesPorSerial[serialNormalizado(registro.serial)] || '';
    if (!responsable) {
      alert('Seleccione quién aprueba el equipo para entrega.');
      return;
    }
    const evento = crearEvento('APROBACION DIAGNOSTICO', responsable, 'LISTO PARA LA ENTREGA', 'Equipo reparado y aprobado para entrega.');
    setRegistrosDiagnosticos(prev => prev.map(item => item.id === registro.id ? {
      ...item,
      responsable,
      status: 'LISTO PARA LA ENTREGA',
      historial: [...(item.historial || []), evento],
    } : item));
  };

  const guardarResultadoLaboratorio = (registro: DiagnosticoRegistro) => {
    if (isReadOnly) return;
    const responsable = responsablesLaboratorio[registro.id] || '';
    const resultado = resultadosLaboratorio[registro.id] || '';
    if (!responsable || !resultado) {
      alert('Seleccione el responsable y el resultado del laboratorio.');
      return;
    }
    const status: DiagnosticoStatus = resultado === 'REPARADO' || resultado === 'LISTO PARA LA ENTREGA'
      ? 'PENDIENTE APROBACION'
      : resultado;
    const evento = crearEvento(
      'LABORATORIO / REPARACION',
      responsable,
      resultado,
      resultado === 'REPARADO' ? 'Equipo reparado; retorna a Diagnóstico para aprobación.' : 'Resultado registrado por el laboratorio.'
    );
    setRegistrosDiagnosticos(prev => prev.map(item => item.id === registro.id ? {
      ...item,
      laboratorio: responsable,
      resultadoReparacion: resultado,
      status,
      historial: [...(item.historial || []), evento],
    } : item));
  };

  const handleMarkKeyLoad = () => {
    if (isReadOnly || !setSerialesCargaLlaves) return;
    const serial = serialNormalizado(serialCargaLlaves);
    if (!serial) {
      alert('Debe ingresar un serial.');
      return;
    }
    if (!equiposExistentes.some(equipo => equipo.serial === serial)) {
      alert('El serial no existe en Gestión General ni en Recepción Aliados.');
      return;
    }
    setSerialesCargaLlaves(prev => prev.some(item => serialNormalizado(item) === serial) ? prev : [...prev, serial]);
    setSerialCargaLlaves('');
  };

  if (mode === 'keys') {
    return (
      <section className="bg-white border border-slate-200 shadow-md p-6 max-w-6xl mx-auto">
        <h2 className="text-lg font-black uppercase text-slate-900">CARGA DE LLAVES</h2>
        <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Marque seriales que ya existen en el inventario</p>
        {isReadOnly ? (
          <div className="mt-5 p-5 bg-slate-100 text-slate-600 font-bold uppercase text-center text-xs">Solo lectura</div>
        ) : (
          <form className="mt-5 flex flex-col sm:flex-row gap-3 items-end" onSubmit={event => { event.preventDefault(); handleMarkKeyLoad(); }}>
            <label className="flex-1 w-full text-[10px] text-slate-500 font-bold uppercase">
              Serial existente
              <input value={serialCargaLlaves} onChange={event => setSerialCargaLlaves(event.target.value)} className="mt-1 w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase" />
            </label>
            <button type="submit" className="py-3 px-5 bg-emerald-600 text-white font-extrabold text-xs uppercase flex items-center gap-2"><Check size={16} />Marcar carga de llaves</button>
          </form>
        )}
      </section>
    );
  }

  if (mode === 'repair' || mode === 'laboratorio') {
    return (
      <section className="bg-white border border-slate-200 shadow-md overflow-hidden max-w-6xl mx-auto">
        <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <Wrench size={26} className="text-black" />
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900">LABORATORIO / REPARACION</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Acciones para seriales existentes enviados a reparación</p>
          </div>
        </header>
        <div className="p-6 space-y-3">
          {itemsEnReparacion.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11px] font-bold uppercase text-slate-400 border border-slate-200">No hay seriales en reparación.</div>
          ) : itemsEnReparacion.map(registro => {
            const equipo = equiposExistentes.find(item => item.serial === serialNormalizado(registro.serial));
            return (
            <div key={registro.id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_auto] gap-3 items-end border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="font-mono text-xs font-bold uppercase"><SerialConSalida serial={registro.serial} /></div>
                <div className="mt-1 text-[10px] font-semibold uppercase text-slate-500">
                  {equipo?.modelo || registro.modelo} · {equipo?.origen === 'ALIADO' ? `ALIADO ${equipo.aliado || ''}` : 'NEXGO'}
                </div>
              </div>
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Responsable laboratorio
                <select value={responsablesLaboratorio[registro.id] || ''} onChange={event => setResponsablesLaboratorio(prev => ({ ...prev, [registro.id]: event.target.value }))} disabled={isReadOnly} className="mt-1 w-full text-xs p-2.5 bg-white border border-slate-250 uppercase text-slate-800">
                  <option value="">SELECCIONE</option>
                  {LABORATORIO_RESPONSABLES.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
                </select>
              </label>
              <label className="text-[9px] font-bold uppercase text-slate-500">
                Resultado
                <select value={resultadosLaboratorio[registro.id] || ''} onChange={event => setResultadosLaboratorio(prev => ({ ...prev, [registro.id]: event.target.value as ResultadoReparacion | '' }))} disabled={isReadOnly} className="mt-1 w-full text-xs p-2.5 bg-white border border-slate-250 uppercase text-slate-800">
                  <option value="">SELECCIONE</option>
                  <option value="REPARADO">REPARADO</option>
                  <option value="CARGA DE LLAVES">CARGA DE LLAVES</option>
                  <option value="IRREPARABLE">IRREPARABLE</option>
                </select>
              </label>
              {!isReadOnly && (
                <button type="button" onClick={() => guardarResultadoLaboratorio(registro)} className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} />Guardar acción
                </button>
              )}
            </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (mode === 'view') {
    return (
      <section className="bg-white border border-slate-200 shadow-md overflow-hidden max-w-6xl mx-auto">
        <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <Layers size={26} className="text-black" />
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900">CANAL DE DIAGNOSTICOS</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Historial de etapas y responsables; solo consulta</p>
          </div>
        </header>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800">Historial del flujo</h3>
              <p className="text-[10px] font-bold uppercase text-slate-500">Intervenciones registradas: {historial.length}</p>
            </div>
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500"><ArrowRight size={14} />Solo lectura</span>
          </div>
          {historial.length === 0 ? (
            <div className="border border-slate-200 px-4 py-8 text-center text-[11px] font-bold uppercase text-slate-400">Todavía no hay intervenciones registradas.</div>
          ) : (
            <div className="overflow-x-auto border border-slate-200">
              <div className="min-w-[1100px]">
                <div className="grid grid-cols-[150px_180px_190px_180px_220px_1fr] bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                  <div className="px-3 py-3">Fecha / Hora</div><div className="px-3 py-3">Serial</div><div className="px-3 py-3">Etapa</div>
                  <div className="px-3 py-3">Responsable</div><div className="px-3 py-3">Status</div><div className="px-3 py-3">Detalle</div>
                </div>
                {historial.map(evento => (
                  <div key={evento.id} className="grid grid-cols-[150px_180px_190px_180px_220px_1fr] border-t border-slate-200 text-[10px] font-semibold uppercase text-slate-700">
                    <div className="px-3 py-3">{evento.fecha} {evento.hora}</div>
                    <div className="px-3 py-3 font-mono"><SerialConSalida serial={evento.registro.serial} salida={!!evento.registro.salida} /></div>
                    <div className="px-3 py-3">{evento.etapa}</div>
                    <div className="px-3 py-3">{evento.responsable || '-'}</div>
                    <div className="px-3 py-3">{evento.status}</div>
                    <div className="px-3 py-3 normal-case">{evento.detalle}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-200 shadow-md overflow-hidden max-w-6xl mx-auto">
      <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
        <ClipboardList size={26} className="text-black" />
        <div>
          <h2 className="text-lg font-black uppercase text-slate-900">DIAGNOSTICO</h2>
          <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Seleccione seriales ya registrados en Gestión General o Recepción Aliados</p>
        </div>
      </header>
      <div className="p-6">
        <label className="relative mb-4 block max-w-lg">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input value={buscar} onChange={event => setBuscar(event.target.value)} placeholder="Buscar serial, modelo o aliado" className="w-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs uppercase" />
        </label>
        {equiposFiltrados.length === 0 ? (
          <div className="border border-slate-200 px-4 py-8 text-center text-[11px] font-bold uppercase text-slate-400">No hay seriales existentes que coincidan con la búsqueda.</div>
        ) : (
          <div className="space-y-2">
            {equiposFiltrados.map(equipo => {
              const registro = registroPorSerial.get(equipo.serial);
              const responsableSeleccionado = responsablesPorSerial[equipo.serial] || '';
              if (registro) {
                return (
                  <div key={equipo.serial} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1.2fr_auto] gap-3 items-center border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <div className="font-mono text-xs font-bold uppercase"><SerialConSalida serial={equipo.serial} /></div>
                      <div className="mt-1 text-[10px] font-semibold uppercase text-slate-500">{equipo.modelo} · {equipo.origen === 'ALIADO' ? `ALIADO ${equipo.aliado || ''}` : 'NEXGO'}</div>
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-700">{registro.status}</div>
                    {registro.status === 'PENDIENTE APROBACION' || registro.status === 'PENDIENTE DIAGNOSTICO' ? (
                      <select aria-label={`Responsable de aprobación ${equipo.serial}`} value={responsableSeleccionado} onChange={event => setResponsablesPorSerial(prev => ({ ...prev, [equipo.serial]: event.target.value }))} disabled={isReadOnly} className="w-full text-xs p-2.5 bg-white border border-slate-250 uppercase">
                        <option value="">{registro.status === 'PENDIENTE APROBACION' ? 'RESPONSABLE DE APROBACION' : 'RESPONSABLE DE DIAGNOSTICO'}</option>
                        {DIAGNOSTICO_RESPONSABLES.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
                      </select>
                    ) : (
                      <div className="text-[10px] font-semibold uppercase text-slate-500">Responsable: {registro.responsable || '-'}</div>
                    )}
                    {registro.status === 'PENDIENTE DIAGNOSTICO' && (
                      <select aria-label={`Status de diagnóstico ${equipo.serial}`} value={statusPorSerial[equipo.serial] || ''} onChange={event => setStatusPorSerial(prev => ({ ...prev, [equipo.serial]: event.target.value as '' | 'REPARACION' | 'LISTO PARA LA ENTREGA' }))} disabled={isReadOnly} className="w-full text-xs p-2.5 bg-white border border-slate-250 uppercase">
                        <option value="">SELECCIONE STATUS</option>
                        <option value="REPARACION">REPARACION</option>
                        <option value="LISTO PARA LA ENTREGA">LISTO PARA LA ENTREGA</option>
                      </select>
                    )}
                    {registro.status === 'PENDIENTE APROBACION' && !isReadOnly ? (
                      <button type="button" onClick={() => aprobarEquipo(registro)} className="py-2.5 px-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase">Aprobar entrega</button>
                    ) : registro.status === 'PENDIENTE DIAGNOSTICO' && !isReadOnly ? (
                      <button type="button" onClick={() => guardarDiagnosticoPendiente(registro)} className="py-2.5 px-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase">Guardar diagnóstico</button>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-slate-400">{registro.status === 'REPARACION' ? 'En cola de laboratorio' : registro.status === 'LISTO PARA LA ENTREGA' ? 'Aprobado para salida' : registro.status}</span>
                    )}
                  </div>
                );
              }
              return (
                <div key={equipo.serial} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_auto] gap-3 items-center border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <div className="font-mono text-xs font-bold uppercase"><SerialConSalida serial={equipo.serial} /></div>
                    <div className="mt-1 text-[10px] font-semibold uppercase text-slate-500">{equipo.modelo} · {equipo.origen === 'ALIADO' ? `ALIADO ${equipo.aliado || ''}` : 'NEXGO'}</div>
                  </div>
                  <select aria-label={`Responsable del diagnóstico ${equipo.serial}`} value={responsableSeleccionado} onChange={event => setResponsablesPorSerial(prev => ({ ...prev, [equipo.serial]: event.target.value }))} disabled={isReadOnly} className="w-full text-xs p-2.5 bg-white border border-slate-250 uppercase">
                    <option value="">SELECCIONE RESPONSABLE</option>
                    {DIAGNOSTICO_RESPONSABLES.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
                  </select>
                  <select aria-label={`Status de diagnóstico ${equipo.serial}`} value={statusPorSerial[equipo.serial] || ''} onChange={event => setStatusPorSerial(prev => ({ ...prev, [equipo.serial]: event.target.value as '' | 'REPARACION' | 'LISTO PARA LA ENTREGA' }))} disabled={isReadOnly} className="w-full text-xs p-2.5 bg-white border border-slate-250 uppercase">
                    <option value="">SELECCIONE STATUS</option>
                    <option value="REPARACION">REPARACION</option>
                    <option value="LISTO PARA LA ENTREGA">LISTO PARA LA ENTREGA</option>
                  </select>
                  {!isReadOnly && <button type="button" onClick={() => iniciarDiagnostico(equipo)} className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase">Guardar diagnóstico</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
