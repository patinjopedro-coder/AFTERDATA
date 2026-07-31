import React, { useState } from 'react';
import { POSItem, ModelConfig, UserProfile } from '../types';
import { formatRif } from '../utils';
import { getTerminalModel } from '../data';
import { Layers, Plus, Check } from 'lucide-react';

interface NuevoSerialProps {
  serials: POSItem[];
  setSerials: React.Dispatch<React.SetStateAction<POSItem[]>>;
  modelosDB: Record<string, ModelConfig>;
  usersProfiles: Record<string, UserProfile>;
  setUsersProfiles?: React.Dispatch<React.SetStateAction<Record<string, UserProfile>>>;
  activeCruceBatchId: string;
  uniqueBancos: string[];
  onAddToast: (msg: string) => void;
  isReadOnly?: boolean;
}

export const NuevoSerial: React.FC<NuevoSerialProps> = ({
  serials,
  setSerials,
  modelosDB,
  usersProfiles,
  setUsersProfiles,
  activeCruceBatchId,
  uniqueBancos,
  onAddToast,
  isReadOnly = false
}) => {
  const [bulkInput, setBulkInput] = useState('');
  const [remitente, setRemitente] = useState('');
  const [guia, setGuia] = useState('');
  const [rif, setRif] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [destino, setDestino] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [modeloManual, setModeloManual] = useState('');
  const [ticket, setTicket] = useState('');
  const [statusSelected, setStatusSelected] = useState<'ENTREGADO' | 'RECUPERADO' | 'DISPONIBLE' | 'SIN ESTATUS'>('SIN ESTATUS');
  const [operadora, setOperadora] = useState<'MOVISTAR' | 'MOVILNET' | 'DIGITEL' | ''>('');
  const [modeloNegocio, setModeloNegocio] = useState<'BASICO' | 'COMODATO' | 'FINANCIAMIENTO' | ''>('');
  const [accForro, setAccForro] = useState(false);
  const [accCargador, setAccCargador] = useState(false);
  const [accCaja, setAccCaja] = useState(false);
  const [accBateria, setAccBateria] = useState(false);
  const [accSim, setAccSim] = useState(false);
  const [costoBsf, setCostoBsf] = useState('');
  const [banco, setBanco] = useState('');
  const [sinCosto, setSinCosto] = useState(false);

  const currentDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleRegister = () => {
    if (isReadOnly) return;
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
    const dNow = new Date();
    const horaStr = `${String(dNow.getHours()).padStart(2, '0')}:${String(dNow.getMinutes()).padStart(2, '0')}:${String(dNow.getSeconds()).padStart(2, '0')}`;
    const isCas = !!(guia || rif || razonSocial || destino || (simNumber && simNumber !== 'NO POSEE') || modeloManual || operadora || modeloNegocio || accForro || accCargador || accCaja || accBateria || accSim || ticket || costoBsf || banco || sinCosto);

    let maxId = serials.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);

    const newItems = rawLines.map((s) => {
      const serialUp = s.toUpperCase();
      maxId++;
      return {
        id: maxId,
        serial: serialUp,
        date: today,
        displayDate: displayToday,
        hora: horaStr,
        status: statusSelected,
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

    // Trigger floating notification requirement:
    // "se ha añadido la siguiente guia (colocar la guia) y la razon social"
    const guiaText = guia.toUpperCase().trim() || 'SIN GUÍA';
    const razonText = razonSocial.toUpperCase().trim() || 'SIN RAZÓN SOCIAL';
    onAddToast(`Se ha añadido la siguiente guía (${guiaText}) y la razón social: ${razonText}`);

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
    setStatusSelected('SIN ESTATUS');
    setOperadora('');
    setModeloNegocio('');
    setAccForro(false);
    setAccCargador(false);
    setAccCaja(false);
    setAccBateria(false);
    setAccSim(false);
    setCostoBsf('');
    setBanco('');
    setSinCosto(false);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-800 pb-16 font-arial max-w-4xl mx-auto">
      <div className="bg-white p-6 border border-slate-200 shadow-md">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="p-1 bg-transparent text-black">
            <Layers size={26} className="text-black" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">FORMULARIO DE NUEVO SERIAL</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Ingreso directo de terminales a la gestión general</p>
          </div>
        </div>

        {isReadOnly ? (
          <div className="p-6 bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase text-center text-xs">
            Modo Observador Activo: No tiene permisos para agregar nuevos seriales.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Campo Seriales Masivos */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                SERIAL
              </label>
              <textarea
                value={bulkInput}
                onChange={e => {
                  const val = e.target.value;
                  setBulkInput(val);
                  const firstSerial = String(val || '').split(/\n+/).map(s => s.trim()).find(Boolean);
                  if (firstSerial) {
                    const detected = getTerminalModel(firstSerial, modelosDB);
                    if (detected && detected.modelo && !detected.modelo.includes('DESCONOCIDO')) {
                      setModeloManual(detected.modelo);
                    }
                  }
                }}
                placeholder=""
                className="w-full min-h-[120px] p-3 bg-slate-100 border border-slate-250 font-mono text-xs uppercase font-semibold focus:outline-none focus:bg-white focus:border-slate-800"
              />
            </div>

            {/* Grid de Formulario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">N° GUIA</label>
                <input
                  type="text"
                  value={guia}
                  onChange={e => setGuia(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Remitente</label>
                <input
                  type="text"
                  value={remitente}
                  onChange={e => setRemitente(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Origen / Destino</label>
                <input
                  type="text"
                  value={destino}
                  onChange={e => setDestino(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              {/* Razón social y RIF sin autollenado por requerimiento */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Razón Social</label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={e => setRazonSocial(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RIF Cliente</label>
                <input
                  type="text"
                  value={rif}
                  onChange={e => setRif(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modelo POS</label>
                <input
                  type="text"
                  value={modeloManual}
                  onChange={e => setModeloManual(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">NUMERO DE TICKET</label>
                <input
                  type="text"
                  value={ticket}
                  onChange={e => setTicket(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">STATUS</label>
                <select
                  value={statusSelected}
                  onChange={e => setStatusSelected(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-bold text-slate-900"
                >
                  <option value="SIN ESTATUS"></option>
                  <option value="ENTREGADO">ENTREGADO</option>
                  <option value="RECUPERADO">RECUPERADO</option>
                  <option value="DISPONIBLE">DISPONIBLE</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operadora</label>
                <select
                  value={operadora}
                  onChange={e => setOperadora(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-bold"
                >
                  <option value=""></option>
                  <option value="MOVISTAR">MOVISTAR</option>
                  <option value="MOVILNET">MOVILNET</option>
                  <option value="DIGITEL">DIGITEL</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">MODELO DE NEGOCIO</label>
                <select
                  value={modeloNegocio}
                  onChange={e => setModeloNegocio(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-bold"
                >
                  <option value=""></option>
                  <option value="BASICO">BÁSICO</option>
                  <option value="COMODATO">COMODATO</option>
                  <option value="FINANCIAMIENTO">FINANCIAMIENTO</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">COSTO</label>
                  <label className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sinCosto}
                      onChange={e => {
                        const checked = e.target.checked;
                        setSinCosto(checked);
                        if (checked) {
                          setCostoBsf('SIN COSTO');
                        } else {
                          if (costoBsf === 'SIN COSTO') setCostoBsf('');
                        }
                      }}
                      className="rounded text-blue-600 bg-slate-100 border-slate-300 focus:ring-0 w-3 h-3"
                    />
                    <span>SIN COSTO</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={costoBsf}
                  onChange={e => setCostoBsf(e.target.value)}
                  disabled={sinCosto}
                  className={`w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold ${sinCosto ? 'bg-slate-200 border-slate-350 text-slate-800 cursor-not-allowed font-bold' : ''}`}
                />
              </div>

              {/* Campo Banco con datalist editable/desplegable */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Banco</label>
                <input
                  type="text"
                  list="bancosListNuevoSerial"
                  value={banco}
                  onChange={e => setBanco(e.target.value)}
                  placeholder="ESCRIBA O SELECCIONE UN BANCO DE LA LISTA..."
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800"
                />
                <datalist id="bancosListNuevoSerial">
                  {uniqueBancos.map((bName) => (
                    <option key={bName} value={bName} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Accesorios */}
            <div className="bg-slate-50 p-3 border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-600 block">ACCESORIOS INCLUIDOS</span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { label: 'FORRO', val: accForro, set: setAccForro },
                  { label: 'CARGADOR', val: accCargador, set: setAccCargador },
                  { label: 'CAJA', val: accCaja, set: setAccCaja },
                  { label: 'BATERÍA', val: accBateria, set: setAccBateria },
                  { label: 'SIM', val: accSim, set: setAccSim },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.set(!item.val)}
                    className={`py-2 px-2 text-[10px] font-bold uppercase border transition-all flex items-center justify-between cursor-pointer ${
                      item.val ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.val && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {accSim && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Número SIM</label>
                <input
                  type="text"
                  value={simNumber}
                  onChange={e => setSimNumber(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-250 uppercase font-mono font-semibold"
                />
              </div>
            )}

            <button
              onClick={handleRegister}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Plus size={16} />
              <span>REGISTRAR EN GESTIÓN GENERAL</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
