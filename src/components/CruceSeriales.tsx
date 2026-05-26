import React, { useState, useEffect, useRef, useMemo } from 'react';
import { POSItem, POSStatus, ModelConfig, CruceItem, CMSItem } from '../types';
import { 
  FileCheck, ArrowRightLeft, Check, Import, Send, Trash2, Edit2, Play, Search, Database, Layers, X, Clipboard
} from 'lucide-react';

interface CruceSerialesProps {
  serials: POSItem[];
  setSerials: React.Dispatch<React.SetStateAction<POSItem[]>>;
  modelosDB: Record<string, ModelConfig>;
  onUserClick: (remitente: string) => void;
  usersProfiles: Record<string, import('../types').UserProfile>;
}

export const CruceSeriales: React.FC<CruceSerialesProps> = ({
  serials,
  setSerials,
  modelosDB,
  onUserClick,
  usersProfiles
}) => {
  // Real-time text streams state
  const [emailText, setEmailText] = useState(() => localStorage.getItem('cruce_emailText') || '');
  const [fisicoText, setFisicoText] = useState(() => localStorage.getItem('cruce_fisicoText') || '');
  
  // View states for the 2 columns ('visual' or 'edit')
  const [emailViewMode, setEmailViewMode] = useState<'visual' | 'edit'>(() => {
    return (localStorage.getItem('cruce_emailText') || '') !== '' ? 'visual' : 'edit';
  });
  const [fisicoViewMode, setFisicoViewMode] = useState<'visual' | 'edit'>(() => {
    return (localStorage.getItem('cruce_fisicoText') || '') !== '' ? 'visual' : 'edit';
  });

  // Dedicated barcode scanner live input value
  const [scanInput, setScanInput] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [datosMaestro, setDatosMaestro] = useState<CruceItem[]>(() => {
    return JSON.parse(localStorage.getItem('datosMaestro') || '[]');
  });

  // CMS state
  const [datosCMS, setDatosCMS] = useState<CMSItem[]>(() => {
    return JSON.parse(localStorage.getItem('datosCMS') || '[]');
  });

  const [remitenteCorreo, setRemitenteCorreo] = useState('VALIDADOR');

  // Modals view state
  const [isIMSModalOpen, setIsIMSModalOpen] = useState(false);
  const [isCMSModalOpen, setIsCMSModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // IMS raw inputs state (supporting >100.000 vertical spreadsheet rows)
  const [imsSerialsRaw, setImsSerialsRaw] = useState('');
  const [imsStatusRaw, setImsStatusRaw] = useState('');

  // CMS raw inputs state
  const [CMSSerialsRaw, setCMSSerialsRaw] = useState('');
  const [CMSStatusRaw, setCMSStatusRaw] = useState('');
  const [CMSRemitenteRaw, setCMSRemitenteRaw] = useState('');
  const [CMSFechaRaw, setCMSFechaRaw] = useState('');

  // Bulk Status modal states
  const [selectedSerialsBulk, setSelectedSerialsBulk] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartValue, setDragStartValue] = useState<boolean>(true); // select or deselect

  const imsCargado = datosMaestro.length > 0;
  const CMSCargado = datosCMS.length > 0;

  // Persist values in localStorage
  useEffect(() => {
    localStorage.setItem('cruce_emailText', emailText);
    if (emailText === '' && emailViewMode === 'visual') {
      setEmailViewMode('edit');
    }
  }, [emailText]);

  useEffect(() => {
    localStorage.setItem('cruce_fisicoText', fisicoText);
    if (fisicoText === '' && fisicoViewMode === 'visual') {
      setFisicoViewMode('edit');
    }
  }, [fisicoText]);

  useEffect(() => {
    try {
      localStorage.setItem('datosMaestro', JSON.stringify(datosMaestro));
    } catch (e) {
      console.warn("Límite de almacenamiento local superado. Datos persistidos únicamente en memoria activa.");
    }
  }, [datosMaestro]);

  useEffect(() => {
    try {
      localStorage.setItem('datosCMS', JSON.stringify(datosCMS));
    } catch (e) {
      console.warn("Límite de almacenamiento local superado. Datos persistidos únicamente en memoria activa.");
    }
  }, [datosCMS]);

  // Focus barcode scan field when list mode is visual
  useEffect(() => {
    if (fisicoViewMode === 'visual' && scanInputRef.current && !isBulkModalOpen && !isIMSModalOpen && !isCMSModalOpen) {
      scanInputRef.current.focus();
    }
  }, [fisicoViewMode, isBulkModalOpen, isIMSModalOpen, isCMSModalOpen]);

  // Clean O(1) matching index for supreme performance handling elements with 100k+ list lookups
  const maestroMap = useMemo(() => {
    const map: Record<string, CruceItem> = {};
    for (let i = 0; i < datosMaestro.length; i++) {
      const item = datosMaestro[i];
      if (item && item.serial) {
        map[item.serial.trim().toUpperCase()] = item;
      }
    }
    return map;
  }, [datosMaestro]);

  // Clean O(1) matching index for CMS
  const CMSMap = useMemo(() => {
    const map: Record<string, CMSItem> = {};
    for (let i = 0; i < datosCMS.length; i++) {
      const item = datosCMS[i];
      if (item && item.serial) {
        map[item.serial.trim().toUpperCase()] = item;
      }
    }
    return map;
  }, [datosCMS]);

  const lookupValidador = (serial: string) => {
    const cleanSerial = serial.trim().toUpperCase();
    
    // Check CMS first
    const CMSHit = CMSMap[cleanSerial];
    if (CMSHit) {
      return {
        serial: cleanSerial,
        status: CMSHit.status,
        remitente: CMSHit.remitente,
        date: CMSHit.date,
        isCMS: true,
        operadora: 'DISPONIBLE',
        simNumber: '',
        ticket: ''
      };
    }

    // Fallback to IMS
    const hit = maestroMap[cleanSerial];
    if (hit) return hit;

    // Default fallback rule if not registered: Status N#A and classified as DISPONIBLE
    return {
      serial: cleanSerial,
      status: 'N#A' as POSStatus,
      operadora: 'DISPONIBLE',
      simNumber: '',
      ticket: ''
    };
  };

  // Parsing helper
  const parseLines = (text: string) => {
    return text
      .split(/[\r\n,;]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);
  };

  const emailLines = parseLines(emailText);
  const fisicoLines = parseLines(fisicoText);

  const emailUniques = Array.from(new Set(emailLines));
  const fisicoUniques = Array.from(new Set(fisicoLines));

  const emailSet = new Set(emailUniques);
  const fisicoSet = new Set(fisicoUniques);

  const coincidencias = emailUniques.filter(s => fisicoSet.has(s));
  const soloCorreo = emailUniques.filter(s => !fisicoSet.has(s));
  const soloFisico = fisicoUniques.filter(s => !emailSet.has(s));

  const totalUnicos = new Set([...emailUniques, ...fisicoUniques]).size;
  const matchRatio = emailUniques.length ? ((coincidencias.length / emailUniques.length) * 100).toFixed(1) : '0.0';

  const limpiarTodo = () => {
    setEmailText('');
    setFisicoText('');
    setEmailViewMode('edit');
    setFisicoViewMode('edit');
  };

  const updateSerialStatus = (serial: string, newStatus: POSStatus) => {
    const cleanSerial = serial.trim().toUpperCase();
    if (!cleanSerial) return;
    setDatosMaestro(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(item => item.serial === cleanSerial);
      if (idx !== -1) {
        copy[idx] = { ...copy[idx], status: newStatus };
      } else {
        copy.push({
          serial: cleanSerial,
          status: newStatus,
          operadora: '',
          simNumber: '',
          ticket: ''
        });
      }
      return copy;
    });
  };

  // Perform multi-drag highlight selections
  const handleBulkItemMouseDown = (serial: string) => {
    setIsDragging(true);
    const next = new Set(selectedSerialsBulk);
    const isCurrentlySelected = next.has(serial);
    if (isCurrentlySelected) {
      next.delete(serial);
      setDragStartValue(false);
    } else {
      next.add(serial);
      setDragStartValue(true);
    }
    setSelectedSerialsBulk(next);
  };

  const handleBulkItemMouseEnter = (serial: string) => {
    if (!isDragging) return;
    const next = new Set(selectedSerialsBulk);
    if (dragStartValue) {
      next.add(serial);
    } else {
      next.delete(serial);
    }
    setSelectedSerialsBulk(next);
  };

  const handleDragMouseUpRef = useRef<() => void>();
  handleDragMouseUpRef.current = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (handleDragMouseUpRef.current) {
        handleDragMouseUpRef.current();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleSelectAllBulk = () => {
    if (selectedSerialsBulk.size === fisicoUniques.length) {
      setSelectedSerialsBulk(new Set());
    } else {
      setSelectedSerialsBulk(new Set(fisicoUniques));
    }
  };

  const handleAssignBulkStatus = (selectedStatus: POSStatus) => {
    if (selectedSerialsBulk.size === 0) {
      alert("Seleccione al menos un serial de la lista para asignarle estado.");
      return;
    }
    
    // Update matching items in the master structure
    setDatosMaestro(prev => {
      const copy = [...prev];
      selectedSerialsBulk.forEach(serial => {
        const idx = copy.findIndex(item => item.serial === serial);
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], status: selectedStatus };
        } else {
          copy.push({
            serial,
            status: selectedStatus,
            operadora: '',
            simNumber: '',
            ticket: ''
          });
        }
      });
      return copy;
    });

    alert(`✅ Estado "${selectedStatus}" asignado correctamente a ${selectedSerialsBulk.size} seriales.`);
    setSelectedSerialsBulk(new Set());
  };

  // Barcode enter key handler
  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanScan = scanInput.trim().toUpperCase();
      if (!cleanScan) return;

      const current = parseLines(fisicoText);
      if (!current.includes(cleanScan)) {
        const joiner = fisicoText === '' || fisicoText.endsWith('\n') ? '' : '\n';
        setFisicoText(prev => prev + joiner + cleanScan);
      }
      setScanInput('');
      
      setTimeout(() => {
        if (scanInputRef.current) scanInputRef.current.focus();
      }, 30);
    }
  };

  // High performance line-by-line parsing for Excel copy/pastes (>100k lines)
  const handleConfirmIMS = () => {
    if (!imsSerialsRaw.trim()) {
      alert("Ingrese datos válidos en el campo SERIAL TERMINAL.");
      return;
    }

    // Split inputs into lines efficiently
    const sLines = imsSerialsRaw.split(/\r?\n/).map(l => l.trim().toUpperCase()).filter(Boolean);
    const stLines = imsStatusRaw.split(/\r?\n/).map(l => l.trim().toUpperCase());

    const maxRows = Math.max(sLines.length, stLines.length);
    const newMaster: CruceItem[] = [];

    // Loop at core JS speed
    for (let i = 0; i < maxRows; i++) {
      const serialNum = sLines[i];
      if (!serialNum) continue;

      const rawStatus = stLines[i] || 'N#A';
      let finalStatus: POSStatus = 'N#A';
      if (rawStatus.includes('PENDIENTE')) finalStatus = 'PENDIENTE';
      else if (rawStatus.includes('ACTIVO')) finalStatus = 'ACTIVO';
      else if (rawStatus.includes('SUSPENDIDO')) finalStatus = 'SUSPENDIDO';
      else if (rawStatus.includes('CANCELADO')) finalStatus = 'CANCELADO';
      else if (rawStatus.includes('RECUPERADO')) finalStatus = 'RECUPERADO';
      else if (rawStatus.includes('N/A') || rawStatus === 'NA' || rawStatus.includes('N#A')) finalStatus = 'N#A';
      else if (rawStatus === 'SIN ESTATUS') finalStatus = 'SIN ESTATUS';

      newMaster.push({
        serial: serialNum,
        status: finalStatus,
        operadora: '',
        simNumber: '',
        ticket: ''
      });
    }

    setDatosMaestro(newMaster);
    setIsIMSModalOpen(false);
    alert(`⚡ Base de datos IMS cargada con éxito: ${newMaster.length} registros indexados de forma instantánea.`);
  };

  const handleConfirmCMS = () => {
    if (!CMSSerialsRaw.trim()) {
      alert("Ingrese datos válidos en el campo de seriales.");
      return;
    }

    const sLines = CMSSerialsRaw.split(/\r?\n/).map(l => l.trim().toUpperCase()).filter(Boolean);
    const stLines = CMSStatusRaw.split(/\r?\n/).map(l => l.trim().toUpperCase());
    const remLines = CMSRemitenteRaw.split(/\r?\n/).map(l => l.trim().toUpperCase());
    const dateLines = CMSFechaRaw.split(/\r?\n/).map(l => l.trim());

    const maxRows = Math.max(sLines.length, stLines.length, remLines.length, dateLines.length);
    const newCMS: CMSItem[] = [];

    const d = new Date();
    const defaultDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < maxRows; i++) {
      const serialNum = sLines[i];
      if (!serialNum) continue;

      const rawStatus = stLines[i] || 'PENDIENTE';
      let finalStatus: POSStatus = 'PENDIENTE';
      if (rawStatus.includes('ACTIVO')) finalStatus = 'ACTIVO';
      else if (rawStatus.includes('SUSPENDIDO')) finalStatus = 'SUSPENDIDO';
      else if (rawStatus.includes('CANCELADO')) finalStatus = 'CANCELADO';
      else if (rawStatus.includes('RECUPERADO')) finalStatus = 'RECUPERADO';
      else if (rawStatus.includes('N/A') || rawStatus === 'NA' || rawStatus.includes('N#A')) finalStatus = 'N#A';
      else if (rawStatus === 'SIN ESTATUS') finalStatus = 'SIN ESTATUS';

      const finalRemitente = remLines[i] || 'DISGLOBAL';
      let finalDate = dateLines[i] || defaultDate;
      if (!finalDate.match(/^\d{4}-\d{2}-\d{2}$/) && !finalDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        finalDate = defaultDate; // fallback to today if format is off
      }

      newCMS.push({
        serial: serialNum,
        status: finalStatus,
        remitente: finalRemitente,
        date: finalDate
      });
    }

    setDatosCMS(newCMS);
    setIsCMSModalOpen(false);
    alert(`⚡ Base de datos CMS cargada con éxito: ${newCMS.length} registros indexados.`);
  };

  const handleAddMatchesToGeneral = () => {
    if (coincidencias.length === 0) {
      alert('No hay coincidencias detectadas para agregar en este momento.');
      return;
    }

    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const displayToday = today.split('-').reverse().join('/');
    const cleanRemitente = remitenteCorreo.trim().toUpperCase() || 'VALIDADOR';

    let nuevos = 0;
    let actualizados = 0;

    setSerials(prev => {
      const copy = [...prev];
      let maxId = copy.reduce((max, s) => (s && s.id && typeof s.id === 'number') ? Math.max(max, s.id) : max, 0);

      coincidencias.forEach((serial) => {
        const match = lookupValidador(serial);
        
        let finalStatus: POSStatus = 'SIN ESTATUS';
        if (match) {
          finalStatus = match.status; // Always inherit from loaded IMS/CMS
        }

        const idx = copy.findIndex(item => item.serial === serial);
        if (idx !== -1) {
          // Mantener el status original según requerimiento (historial de ingreso)
          if ('isCMS' in match && match.isCMS) {
            if (match.remitente) copy[idx].remitente = match.remitente;
            if (match.date) {
              copy[idx].date = match.date;
              copy[idx].displayDate = match.date.split('-').reverse().join('/');
            }
          } else {
            if (match?.operadora) {
              copy[idx].operadora = match.operadora as any;
            } else {
              copy[idx].operadora = 'DISPONIBLE' as any;
            }
            if (match?.simNumber) {
              copy[idx].sim = true;
              copy[idx].simNumber = match.simNumber;
            }
            if (match?.ticket && !copy[idx].ticket) {
              copy[idx].ticket = match.ticket;
            }
          }
          actualizados++;
        } else {
          const isCMS = 'isCMS' in match && match.isCMS;
          const fallbackOperadora = isCMS ? 'DISPONIBLE' : (match?.operadora || 'DISPONIBLE');
          const finalRemitente = isCMS ? (match.remitente || cleanRemitente) : cleanRemitente;
          const finalDate = isCMS ? (match.date || today) : today;
          const finalDisplayDate = finalDate.split('-').reverse().join('/');

          maxId++;
          copy.unshift({
            id: maxId,
            serial,
            date: finalDate,
            displayDate: finalDisplayDate,
            status: finalStatus,
            remitente: finalRemitente,
            source: 'CRUCE DE CORREO Y FISICO',
            isCasillero: false,
            selected: false,
            rif: '',
            razonSocial: '',
            destino: '',
            observaciones: fallbackOperadora === 'DISPONIBLE' 
              ? 'DISPONIBLE - No encontrado en lista IMS' 
              : 'Añadido automáticamente mediante herramienta de cruce',
            forro: false,
            bateria: false,
            cargador: false,
            caja: false,
            sim: !isCMS && !!match?.simNumber,
            simNumber: (!isCMS && match?.simNumber) || '',
            operadora: fallbackOperadora as any,
            modeloManual: '',
            modeloNegocio: '',
            entregadoTecnico: false,
            esSustitucion: false,
            serialSustituto: '',
            fechaSalida: '',
            fechaSalidaCliente: '',
            guiaSalidaCliente: '',
            destinoSalida: '',
            fechaConfirmada: false,
            ticket: (!isCMS && match?.ticket) || '',
            addedFromCruce: true
          });
          nuevos++;
        }
      });

      return copy;
    });

    alert(`✅ ¡Cruce inteligente completado!\n• ${nuevos} nuevos registros agregados.\n• ${actualizados} terminales existentes actualizados.`);
  };

  const handleExportCruceReport = () => {
    let csv = "SERIAL,CORREO_CONTIENE,FISICO_CONTIENE,MATCH,ESTADO_IMS,OPERADORA,SIM_CARD,TICKET_CASO\n";
    const allSetKeys = Array.from(new Set([...emailUniques, ...fisicoUniques]));

    for (const s of allSetKeys) {
      const inEmail = emailSet.has(s) ? "SI" : "NO";
      const inFisico = fisicoSet.has(s) ? "SI" : "NO";
      const isMatch = (inEmail === "SI" && inFisico === "SI") ? "COINCIDENCIA" : "DIFERENCIA";
      const matchMaster = lookupValidador(s);

      csv += `"${s}","${inEmail}","${inFisico}","${isMatch}","${matchMaster?.status || 'N#A'}","${matchMaster?.operadora || 'DISPONIBLE'}","${matchMaster?.simNumber || ''}","${matchMaster?.ticket || ''}"\n`;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cruce_realtime_reporte_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Aesthetic light pastel style badges with pure WHITE text inside
  const getStatusBadgeStyle = (st: POSStatus) => {
    if (['CANCELADO', 'N#A'].includes(st)) {
      return 'bg-emerald-500/20 text-white border border-emerald-400/30 font-bold px-2 py-0.5 rounded shadow-sm';
    }
    if (['PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'RECUPERADO'].includes(st)) {
      return 'bg-orange-600 text-white border border-orange-550 font-extrabold px-2 py-0.5 rounded shadow-sm';
    }
    return 'bg-slate-800 text-white border border-slate-700 font-semibold px-2 py-0.5 rounded shadow-sm';
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-slate-100 pb-16">
      
      {/* SECCIÓN VALIDADOR / HOJA DE CONTROL: ENVIADO HACIA LOGICA IMS / CMS */}
      <div className="bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Database className="text-white w-5 h-5 animate-pulse" />
            BASES DE DATOS (IMS / CMS)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {imsCargado && (
            <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/25">
              IMS: {datosMaestro.length} REGISTROS
            </span>
          )}
          <button 
            onClick={() => {
              setImsSerialsRaw('');
              setImsStatusRaw('');
              setIsIMSModalOpen(true);
            }}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer select-none border-none"
          >
            <Database size={13} className="text-white" />
            <span>IMS</span>
          </button>

          {CMSCargado && (
            <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/25">
              CMS: {datosCMS.length} REGISTROS
            </span>
          )}
          <button 
            onClick={() => {
              setCMSSerialsRaw('');
              setCMSStatusRaw('');
              setCMSRemitenteRaw('');
              setCMSFechaRaw('');
              setIsCMSModalOpen(true);
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer select-none border-none"
          >
            <Database size={13} className="text-white" />
            <span>CMS</span>
          </button>
        </div>
      </div>

      {/* INPUTS DE SERIALES EN REAL-TIME (ESTRUCTURA DE DOS CAMPOS EXCLUSIVOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL 1: SERIALES DESDE CORREO */}
        <div className="bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col gap-3 min-h-[380px]">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h4 className="font-extrabold text-xs text-blue-400 uppercase tracking-wider">Seriales desde Correo (Digital)</h4>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-[#151925] border border-[#2a2f42] px-2.5 py-0.5 rounded-md text-slate-400 uppercase font-mono">
                Únicos: {emailUniques.length}
              </span>
              
              <button 
                onClick={() => setEmailViewMode(prev => prev === 'visual' ? 'edit' : 'visual')}
                disabled={emailText === ''}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center gap-1 ${
                  emailViewMode === 'visual' 
                    ? 'bg-blue-600/30 border border-blue-500 text-white font-extrabold' 
                    : 'bg-[#151925] border border-[#2a2f42] text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {emailViewMode === 'visual' ? <Edit2 size={10} /> : <Play size={10} />}
                <span>{emailViewMode === 'visual' ? 'Editar' : 'Listo'}</span>
              </button>

              <button 
                onClick={() => {
                  setEmailText('');
                  setEmailViewMode('edit');
                }}
                disabled={emailText === ''}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-slate-300 rounded text-[10px] font-extrabold uppercase cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Limpiar campo correo"
              >
                <Trash2 size={10} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {emailViewMode === 'edit' || emailText === '' ? (
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                value={emailText}
                onChange={e => setEmailText(e.target.value)}
                placeholder="Pegue aquí el listado de seriales que le han llegado al correo (separados por líneas, comas o puntos)..."
                className="w-full flex-1 min-h-[220px] text-xs font-normal p-3.5 bg-[#151925] border border-[#2a2f42] rounded-lg text-white focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 placeholder-slate-600 transition-all font-sans"
              />
              <button
                onClick={() => {
                  if (emailText.trim()) setEmailViewMode('visual');
                }}
                disabled={!emailText.trim()}
                className="w-full py-1.5 bg-blue-600/30 hover:bg-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-blue-300 font-bold text-xs uppercase rounded-lg border border-blue-500/10 cursor-pointer"
              >
                Procesar y Hacer Match
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[350px] pr-1.5 space-y-1.5">
              {emailUniques.map((serial, idx) => {
                const isMatch = fisicoSet.has(serial);
                const dbMatch = lookupValidador(serial);

                return (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold transition-all ${
                      isMatch 
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-300' 
                        : 'bg-slate-950/40 text-slate-500/70 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-sans">
                      <span className="text-[10px] text-slate-500 font-bold font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                      {/* Font size and colors designed for extreme visual precision: pure solid text-white */}
                      <span className="text-white font-mono tracking-wider font-light text-[14px] select-all">{serial}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-sans text-[11px]">
                      <span className={`px-2 py-1.5 rounded text-[12px] font-extrabold uppercase font-sans ${getStatusBadgeStyle(dbMatch.status)}`}>
                        {dbMatch.status}
                      </span>
                      <span className={`px-2 py-1.5 rounded-md text-[12px] font-extrabold uppercase tracking-wider font-sans ${
                        isMatch ? 'bg-green-500 text-white border border-green-400 shadow-sm' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {isMatch ? '✓ MATCH' : 'SIN MATCH'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANEL 2: SERIALES FÍSICOS */}
        <div className="bg-[#1e2336] p-5 rounded-xl border border-[#2a2f42] flex flex-col gap-3 min-h-[380px]">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <h4 className="font-extrabold text-xs text-orange-500 uppercase tracking-wider">Seriales Físicos (Físico)</h4>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-[#151925] border border-[#2a2f42] px-2.5 py-0.5 rounded-md text-slate-400 uppercase font-mono">
                Únicos: {fisicoUniques.length}
              </span>
              
              <button 
                onClick={() => setFisicoViewMode(prev => prev === 'visual' ? 'edit' : 'visual')}
                disabled={fisicoText === ''}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center gap-1 ${
                  fisicoViewMode === 'visual' 
                    ? 'bg-orange-600 border border-orange-500 text-white font-extrabold' 
                    : 'bg-[#151925] border border-[#2a2f42] text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {fisicoViewMode === 'visual' ? <Edit2 size={10} /> : <Play size={10} />}
                <span>{fisicoViewMode === 'visual' ? 'Editar' : 'Listo'}</span>
              </button>

              <button 
                onClick={() => {
                  setFisicoText('');
                  setFisicoViewMode('edit');
                }}
                disabled={fisicoText === ''}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-slate-300 rounded text-[10px] font-extrabold uppercase cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Limpiar campo físico"
              >
                <Trash2 size={10} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {fisicoViewMode === 'edit' || fisicoText === '' ? (
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                value={fisicoText}
                onChange={e => setFisicoText(e.target.value)}
                placeholder="Lea con la pistola de códigos de barra directamente o pegue la lectura física masiva..."
                className="w-full flex-1 min-h-[220px] text-xs font-normal p-3.5 bg-[#151925] border border-[#2a2f42] rounded-lg text-white focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 placeholder-slate-600 transition-all font-sans"
              />
              <button
                onClick={() => {
                  if (fisicoText.trim()) setFisicoViewMode('visual');
                }}
                disabled={!fisicoText.trim()}
                className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase rounded-lg border border-orange-500 hover:border-orange-400 cursor-pointer"
              >
                Procesar y Hacer Match
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2.5">
              
              {/* Barcode scanner live dedicated box inside the visual field */}
              <div className="relative">
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={handleScanKeyDown}
                  placeholder="Pistolee serial físico aquí..."
                  className="w-full text-xs font-bold p-2.5 pl-8 bg-slate-950 border border-orange-500 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-600"
                />
                <Search size={13} className="absolute left-2.5 top-3.5 text-slate-500" />
                <span className="absolute right-2 px-1 rounded text-[8px] bg-slate-900 border border-slate-800 text-slate-500 select-none top-3 uppercase font-mono">Pistola Conectada</span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[220px] pr-1.5 space-y-1.5 border border-slate-850/60 p-2 rounded-lg bg-slate-950/30">
                {fisicoUniques.map((serial, idx) => {
                  const isMatch = emailSet.has(serial);
                  const dbMatch = lookupValidador(serial);

                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold scale-98 transition-all ${
                        isMatch 
                          ? 'bg-orange-400/10 border-orange-300/30 text-slate-100' 
                          : 'bg-slate-950/45 text-slate-300/80 border-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 font-sans">
                        <span className="text-[10px] text-slate-500 font-bold font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                        {/* Font size and colors designed for extreme visual precision: pure solid text-white */}
                        <span className="text-white font-mono tracking-wider font-light text-[14px] select-all">{serial}</span>
                      </div>

                      <div className="flex items-center gap-2 font-sans text-[11px]">
                        {/* Inline custom singular select status dropdown */}
                        <select
                          value={dbMatch?.status || 'N#A'}
                          onChange={(e) => updateSerialStatus(serial, e.target.value as POSStatus)}
                          className={`text-[12px] font-extrabold px-2 py-1.5 rounded border uppercase outline-none cursor-pointer tracking-wider font-sans ${
                            dbMatch 
                              ? getStatusBadgeStyle(dbMatch.status) 
                              : 'bg-slate-900 text-white border-slate-800'
                          }`}
                        >
                          <option value="SIN ESTATUS" className="bg-slate-950 text-slate-400">SIN ESTATUS</option>
                          <option value="ACTIVO" className="bg-slate-950 text-slate-100">ACTIVO</option>
                          <option value="PENDIENTE" className="bg-slate-950 text-slate-100">PENDIENTE</option>
                          <option value="RECUPERADO" className="bg-slate-950 text-slate-100">RECUPERADO</option>
                          <option value="CANCELADO" className="bg-slate-950 text-slate-100">CANCELADO</option>
                          <option value="SUSPENDIDO" className="bg-slate-950 text-slate-100">SUSPENDIDO</option>
                          <option value="N#A" className="bg-slate-950 text-slate-100">N#A</option>
                        </select>

                        <span className={`px-2 py-1.5 rounded-md text-[12px] font-extrabold uppercase tracking-wider font-sans ${
                          isMatch ? 'bg-green-500 text-white border border-green-400 shadow-sm animate-pulse' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {isMatch ? '✓ MATCH' : 'SIN MATCH'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ASIGNACION DE STATUS GRUPAL BUTTON */}
              <button
                onClick={() => {
                  setSelectedSerialsBulk(new Set());
                  setIsBulkModalOpen(true);
                }}
                disabled={fisicoUniques.length === 0}
                className="w-full text-xs font-extrabold uppercase py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none"
              >
                <Layers size={13} className="text-white" />
                <span>ASIGNACION DE STATUS GRUPAL</span>
              </button>
              <button
                onClick={handleAddMatchesToGeneral}
                disabled={coincidencias.length === 0}
                className="w-full text-xs font-extrabold uppercase py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-850 disabled:cursor-not-allowed text-white rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 border-none mt-2"
              >
                <Send size={13} className="text-white" />
                <span>Añadir Coincidencias a Gestión</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* PARAMETROS DE RECONCILIACIÓN DE DATOS (Buttons PENDIENTE/ACTIVO removed based on user request) */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5 shadow-sm">
        <div>
          <label className="text-xs font-extrabold text-blue-400 block mb-1.5 uppercase">REMITENTE:</label>
          <input
            type="text"
            value={remitenteCorreo}
            onChange={e => setRemitenteCorreo(e.target.value.toUpperCase())}
            placeholder="Introduce remitente asignado (ej. VALIDADOR, DISGLOBAL)..."
            className="w-full text-xs font-semibold p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col justify-center">
          <label className="text-xs font-extrabold text-slate-400 block mb-1 uppercase">ESTADO DE TRANSFERENCIA</label>
          <p className="text-[11px] text-slate-400 font-semibold normal-case">
            Los seriales cruzados heredarán directamente sus estados configurados de forma individual u obtenidos desde la Base IMS.
          </p>
        </div>
      </div>

      {/* METRICAS DE INTERSECCIÓN Y BOTONES ACCIÓN */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-lg">
        <h4 className="font-extrabold text-xs tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
          <ArrowRightLeft className="text-blue-500 w-4.5 h-4.5" />
          MÉTRICAS DEL CRUCE Y SALIDA DE CONTROL
        </h4>

        {emailUniques.length === 0 && fisicoUniques.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-6 font-mono uppercase">
            Esperando ingresos en los campos de correo o pistola física...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Coinciden - VERDE VIVO style */}
              <div className="bg-green-600 p-4 border border-green-400 rounded-xl space-y-1 shadow-lg">
                <div className="text-3xl font-black text-white select-all font-sans">{coincidencias.length}</div>
                <div className="text-[10px] text-white font-extrabold uppercase tracking-widest font-sans">Coinciden (Match)</div>
              </div>
              {/* Solo Correo - AZUL ELECTRICO style */}
              <div className="bg-blue-600 p-4 border border-blue-400 rounded-xl space-y-1 shadow-lg">
                <div className="text-3xl font-black text-white select-all font-sans">{soloCorreo.length}</div>
                <div className="text-[10px] text-white font-extrabold uppercase tracking-widest font-sans">Solo en Correo</div>
              </div>
              {/* Solo Físico - NARANJA VIVO style */}
              <div className="bg-orange-600 p-4 border border-orange-400 rounded-xl space-y-1 shadow-lg">
                <div className="text-3xl font-black text-white select-all font-sans">{soloFisico.length}</div>
                <div className="text-[10px] text-white font-extrabold uppercase tracking-widest font-sans">Solo en Físico</div>
              </div>
              {/* Total Seriales Unicos */}
              <div className="bg-slate-900 p-4 border border-slate-700 rounded-xl space-y-1 shadow-lg">
                <div className="text-3xl font-black text-white select-all font-sans">{totalUnicos}</div>
                <div className="text-[10px] text-white font-extrabold uppercase tracking-widest font-sans">Total Seriales Únicos</div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-300 font-bold bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col sm:flex-row items-center justify-center gap-1.5 uppercase font-mono">
              <span>Efectividad del Emparejamiento:</span> 
              <span className={`text-sm font-black font-sans ${parseFloat(matchRatio) >= 80 ? 'text-emerald-400' : parseFloat(matchRatio) >= 50 ? 'text-orange-500' : 'text-red-400'}`}>
                {matchRatio}%
              </span>
              <span className="text-[10px] font-normal text-slate-500 lowercase normal-case">
                ({coincidencias.length} de {emailUniques.length} seriales del correo validados físicamente)
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5 justify-center mt-5 border-t border-slate-850 pt-5">

          <button
            onClick={handleExportCruceReport}
            disabled={totalUnicos === 0}
            className="px-4 py-2 bg-blue-600 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-850 disabled:cursor-not-allowed hover:bg-blue-500 text-white rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Import size={13} />
            <span>Descargar Reporte Cruzado</span>
          </button>

          <button
            onClick={limpiarTodo}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-705 rounded-lg text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 justify-center"
          >
            <Trash2 size={13} />
            <span>Limpiar Campos</span>
          </button>
        </div>
      </div>

      {/* VENTANA EMERGENTE: ALIMENTADOR BASE "IMS" (HIGH PERFORMANCE MODAL) */}
      {isIMSModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Database className="text-orange-400 w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="text-base font-black uppercase text-slate-100 tracking-wider">Cargador de Datos Base IMS</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5 tracking-wider"></p>
                </div>
              </div>
              <button 
                onClick={() => setIsIMSModalOpen(false)}
                className="p-1 px-2.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto">
              
              {/* Columna 1: Seriales */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-orange-200 tracking-wider flex items-center justify-between">
                  <span>SERIAL TERMINAL (Columna)</span>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest lowercase normal-case">una celda por línea</span>
                </label>
                <div className="relative flex-1 flex flex-col">
                  <textarea
                    value={imsSerialsRaw}
                    onChange={e => setImsSerialsRaw(e.target.value)}
                    placeholder="Pegue aquí únicamente la columna de Serials o Equipos de su excel (ejemplo:&#10;80320498&#10;80320499&#10;80320500...)"
                    className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500 font-mono tracking-wider placeholder-slate-700 min-h-[300px] leading-relaxed select-text"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-orange-300">
                    Serales: {imsSerialsRaw.split(/\r?\n/).filter(Boolean).length}
                  </span>
                </div>
              </div>

              {/* Columna 2: Estados */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-orange-200 tracking-wider flex items-center justify-between">
                  <span>STATUS SERVICIO (Columna)</span>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest lowercase normal-case">una celda por línea</span>
                </label>
                <div className="relative flex-1 flex flex-col">
                  <textarea
                    value={imsStatusRaw}
                    onChange={e => setImsStatusRaw(e.target.value)}
                    placeholder="Pegue aquí únicamente la columna de Estados o Status de su excel (ejemplo:&#10;ACTIVO&#10;PENDIENTE&#10;CANCELADO...)"
                    className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500 font-mono tracking-wider placeholder-slate-700 min-h-[300px] leading-relaxed select-text"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-orange-300">
                    Estados: {imsStatusRaw.split(/\r?\n/).filter(Boolean).length}
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-5 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">REGLA IMPORTANTE:</span>
                <span className="text-[10px] text-slate-500 block">
                  La línea 1 del campo izquierdo se emparejará con la línea 1 del derecho. Si no hay correspondencia, se asigna <span className="font-bold text-orange-300">N#A / DISPONIBLE</span>.
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setImsSerialsRaw('');
                    setImsStatusRaw('');
                  }}
                  className="px-4 py-2 border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Limpiar Ventana
                </button>
                <button
                  type="button"
                  onClick={handleConfirmIMS}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 border border-orange-400 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Check size={14} />
                  <span>Procesar y Confirmar Datos IMS</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE: ASIGNACION DE STATUS GRUPAL (HIGH-PRECISION EDIT POPUP) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[75vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Layers className="text-orange-400 w-5.5 h-5.5 animate-bounce" />
                <div>
                  <h3 className="text-base font-black uppercase text-slate-100 tracking-wider">Asignación de Estado Grupal (Físico)</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5 tracking-wider">
                    Arrastre el mouse o use los clics para seleccionar seriales y aplicarles un estado de manera masiva.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 px-2.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>

            {/* Selection Engine */}
            <div className="flex-1 p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-950/30">
              
              {/* Left Selector List */}
              <div className="md:col-span-2 flex flex-col gap-2 h-full">
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                    Seleccionados: {selectedSerialsBulk.size} de {fisicoUniques.length}
                  </span>
                  
                  <button
                    onClick={handleSelectAllBulk}
                    className="text-[9.5px] font-black text-orange-300 hover:text-orange-200 uppercase bg-orange-950/40 border border-orange-500/10 px-2 py-0.5 rounded cursor-pointer transition-all"
                  >
                    {selectedSerialsBulk.size === fisicoUniques.length ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                  </button>
                </div>

                {/* Vertical drag list */}
                <div 
                  className="flex-1 overflow-y-auto space-y-1.5 p-1 bg-slate-950/60 border border-slate-850 rounded-xl max-h-[340px]"
                  style={{ cursor: isDragging ? 'grabbing' : 'auto' }}
                >
                  {fisicoUniques.map((serial, idx) => {
                    const isSelected = selectedSerialsBulk.has(serial);
                    const dbMatch = lookupValidador(serial);

                    return (
                      <div
                        key={idx}
                        onMouseDown={() => handleBulkItemMouseDown(serial)}
                        onMouseEnter={() => handleBulkItemMouseEnter(serial)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all cursor-crosshair select-none ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-400 text-slate-100 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="accent-orange-500 cursor-pointer pointer-events-none"
                          />
                          <span className="text-[10px] text-slate-500 font-bold font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                          {/* Pure solid white text for extreme precise viewing of serials */}
                          <span className="text-white font-mono tracking-wider font-normal text-[12.5px]">{serial}</span>
                        </div>

                        <div className="font-sans text-[11px] flex items-center gap-1.5">
                          <span className={`px-2 py-1 rounded text-[11px] font-extrabold uppercase font-sans ${getStatusBadgeStyle(dbMatch.status)}`}>
                            {dbMatch.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side Control Bar */}
              <div className="flex flex-col gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 h-full justify-between">
                
                <div className="space-y-3.5">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-black uppercase text-orange-200 tracking-wider block mb-1">INSTRUCCIONES DE SELECCIÓN:</span>
                    <span className="text-[10.5px] text-slate-400 block leading-relaxed">
                      1. Haga clic sobre un serial y <strong>arrastre el mouse</strong> sin soltarlo por los demás seriales que desee seleccionar o deseleccionar de forma masiva.<br />
                      2. También puede usar el botón superior para alternar la selección de todos los seriales a la vez.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-orange-200 block uppercase">ASIGNAR UN STATUS GRUPAL:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['ACTIVO', 'PENDIENTE', 'RECUPERADO', 'CANCELADO', 'SUSPENDIDO', 'N#A'] as POSStatus[]).map(statusValue => (
                        <button
                          key={statusValue}
                          onClick={() => handleAssignBulkStatus(statusValue)}
                          disabled={selectedSerialsBulk.size === 0}
                          className="py-2 px-1 text-[9.5px] font-black border uppercase tracking-wider rounded bg-slate-950 hover:bg-slate-900 border-slate-800 hover:border-orange-500 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center"
                        >
                          {statusValue}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal footer action */}
                <div className="pt-4 border-t border-slate-800 mt-auto">
                  <button
                    onClick={() => {
                      handleAddMatchesToGeneral();
                      setIsBulkModalOpen(false);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98"
                  >
                    <Send size={13} />
                    <span>AÑADIR A GESTIÓN GENERAL</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE: ALIMENTADOR BASE "CMS" (HIGH PERFORMANCE MODAL) */}
      {isCMSModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Database className="text-blue-400 w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="text-base font-black uppercase text-slate-100 tracking-wider">Cargador de Datos Base CMS</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5 tracking-wider">Configure seriales masivos asignándoles un estatus, remitente y fecha de lote.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCMSModalOpen(false)}
                className="p-1 px-2.5 rounded bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-slate-950/20">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                
                {/* Field 1: Serials */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                  <label className="text-xs font-black uppercase text-blue-200 tracking-wider flex items-center justify-between">
                    <span>SERIALES</span>
                  </label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={CMSSerialsRaw}
                      onChange={e => setCMSSerialsRaw(e.target.value)}
                      placeholder="Pegue aquí los seriales&#10;(ej: 80320498...)"
                      className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-normal text-white focus:outline-none focus:border-blue-500 font-mono tracking-wider placeholder-slate-700 min-h-[200px] leading-relaxed select-text"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-blue-300">
                      {CMSSerialsRaw.split(/\r?\n/).filter(Boolean).length}
                    </span>
                  </div>
                </div>

                {/* Field 2: Status */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                  <label className="text-xs font-black uppercase text-blue-200 tracking-wider">ESTATUS</label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={CMSStatusRaw}
                      onChange={e => setCMSStatusRaw(e.target.value)}
                      placeholder="Pegue aquí el estatus&#10;(ej: ACTIVO...)"
                      className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-normal text-white focus:outline-none focus:border-blue-500 font-mono tracking-wider placeholder-slate-700 min-h-[200px] leading-relaxed select-text"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-blue-300">
                      {CMSStatusRaw.split(/\r?\n/).filter(Boolean).length}
                    </span>
                  </div>
                </div>

                {/* Field 3: Remitente */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                  <label className="text-xs font-black uppercase text-blue-200 tracking-wider">REMITENTE</label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={CMSRemitenteRaw}
                      onChange={e => setCMSRemitenteRaw(e.target.value)}
                      placeholder="Pegue aquí el remitente&#10;(ej: DISGLOBAL...)"
                      className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-normal text-white focus:outline-none focus:border-blue-500 font-mono tracking-wider placeholder-slate-700 min-h-[200px] leading-relaxed select-text uppercase"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-blue-300">
                      {CMSRemitenteRaw.split(/\r?\n/).filter(Boolean).length}
                    </span>
                  </div>
                </div>

                {/* Field 4: Fecha */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                  <label className="text-xs font-black uppercase text-blue-200 tracking-wider">FECHA LOTE</label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={CMSFechaRaw}
                      onChange={e => setCMSFechaRaw(e.target.value)}
                      placeholder="Pegue aquí la fecha&#10;(ej: 2024-05-25...)"
                      className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-normal text-white focus:outline-none focus:border-blue-500 font-mono tracking-wider placeholder-slate-700 min-h-[200px] leading-relaxed select-text"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-blue-300">
                      {CMSFechaRaw.split(/\r?\n/).filter(Boolean).length}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-4">
              <span className="text-[10px] text-slate-500 block">
                Los datos cargados se asociarán automáticamente en el cruce de seriales.
              </span>
              <div className="flex items-center gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCMSSerialsRaw('');
                    setCMSStatusRaw('');
                    setCMSRemitenteRaw('');
                    setCMSFechaRaw('');
                  }}
                  className="px-4 py-2 border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Limpiar Ventana
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCMS}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 border border-blue-550 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Check size={14} />
                  <span>Confirmar Datos CMS</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
