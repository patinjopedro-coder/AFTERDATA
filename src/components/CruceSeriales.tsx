import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { POSItem, POSStatus, ModelConfig, CruceItem, CMSItem } from '../types';
import { getDBItem, setDBItem, getLocalItem, setLocalItem } from '../db';
import { copyToClipboard } from '../utils';
import { 
  FileCheck, ArrowRightLeft, Check, Import, Send, Trash2, Edit2, Play, Search, Database, Layers, X, Clipboard
} from 'lucide-react';

interface CruceSerialesProps {
  serials: POSItem[];
  setSerials: React.Dispatch<React.SetStateAction<POSItem[]>>;
  modelosDB: Record<string, ModelConfig>;
  onUserClick: (remitente: string) => void;
  usersProfiles: Record<string, import('../types').UserProfile>;
  activeCruceBatchId: string;
  setActiveCruceBatchId: (id: string) => void;
  setCurrentTab: (tab: string) => void;
}

export const CruceSeriales: React.FC<CruceSerialesProps> = ({
  serials,
  setSerials,
  modelosDB,
  onUserClick,
  usersProfiles,
  activeCruceBatchId,
  setActiveCruceBatchId,
  setCurrentTab
}) => {
  // Real-time text streams state
  const [emailText, setEmailText] = useState('');
  const [fisicoText, setFisicoText] = useState('');
  
  // View states for the 2 columns ('visual' or 'edit')
  const [emailViewMode, setEmailViewMode] = useState<'visual' | 'edit'>('edit');
  const [fisicoViewMode, setFisicoViewMode] = useState<'visual' | 'edit'>('edit');



  const [datosMaestro, setDatosMaestro] = useState<CruceItem[]>([]);

  // CMS state
  const [datosCMS, setDatosCMS] = useState<CMSItem[]>([]);

  const isLoadedRef = useRef(false);

  // Load persisted CruceSeriales data from Supabase/IndexedDB on mount
  useEffect(() => {
    (async () => {
      const [savedEmail, savedFisico, savedMaestro, savedCMS] = await Promise.all([
        getDBItem<string>('cruce_emailText', ''),
        getDBItem<string>('cruce_fisicoText', ''),
        getLocalItem<CruceItem[]>('datosMaestro', []),
        getLocalItem<CMSItem[]>('datosCMS', []),
      ]);
      setEmailText(savedEmail);
      setFisicoText(savedFisico);
      if (savedEmail) setEmailViewMode('visual');
      if (savedFisico) setFisicoViewMode('visual');
      setDatosMaestro(Array.isArray(savedMaestro) ? savedMaestro : []);
      setDatosCMS(Array.isArray(savedCMS) ? savedCMS : []);
      isLoadedRef.current = true;
    })();
  }, []);

  const [remitenteCorreo, setRemitenteCorreo] = useState('');
  const [isRemitentePromptOpen, setIsRemitentePromptOpen] = useState(false);
  const [modalRemitenteValue, setModalRemitenteValue] = useState('');
  const [showMainSuggestions, setShowMainSuggestions] = useState(false);
  const [showModalSuggestions, setShowModalSuggestions] = useState(false);

  const existingRemitentes = useMemo(() => {
    const names = new Set<string>();
    if (usersProfiles) {
      Object.keys(usersProfiles).forEach(key => {
        if (key) {
          names.add(key.toUpperCase().trim());
        }
        const p = usersProfiles[key];
        if (p && p.nombreCompleto) {
          names.add(p.nombreCompleto.toUpperCase().trim());
        }
      });
    }
    if (serials) {
      serials.forEach(s => {
        if (s && s.remitente) {
          names.add(s.remitente.toUpperCase().trim());
        }
      });
    }
    names.delete('S/R (SIN REMITENTE)');
    names.delete('');
    return Array.from(names).sort();
  }, [usersProfiles, serials]);

  const mainSuggestions = useMemo(() => {
    const query = remitenteCorreo.toUpperCase().trim();
    if (!query) return [];
    return existingRemitentes.filter(r => r.startsWith(query));
  }, [remitenteCorreo, existingRemitentes]);

  const modalSuggestions = useMemo(() => {
    const query = modalRemitenteValue.toUpperCase().trim();
    if (!query) return [];
    return existingRemitentes.filter(r => r.startsWith(query));
  }, [modalRemitenteValue, existingRemitentes]);

  // Modals view state
  const [isIMSModalOpen, setIsIMSModalOpen] = useState(false);
  const [isCMSModalOpen, setIsCMSModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);

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

  // Persist values via db.ts (Supabase + local fallback)
  useEffect(() => {
    if (!isLoadedRef.current) return;
    setDBItem('cruce_emailText', emailText);
    if (emailText === '' && emailViewMode === 'visual') {
      setEmailViewMode('edit');
    }
  }, [emailText]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    setDBItem('cruce_fisicoText', fisicoText);
    if (fisicoText === '' && fisicoViewMode === 'visual') {
      setFisicoViewMode('edit');
    }
  }, [fisicoText]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    setLocalItem('datosMaestro', datosMaestro);
  }, [datosMaestro]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    setLocalItem('datosCMS', datosCMS);
  }, [datosCMS]);



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

  const proceedWithAdding = (remName: string) => {
    const d = new Date();
    const formatTimeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    const formatDayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const newBatchId = `LOTE - ${formatDayStr} ${formatTimeStr}`;

    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const displayToday = today.split('-').reverse().join('/');
    const cleanRemitente = remName.trim().toUpperCase() || 'VALIDADOR';

    let nuevos = 0;
    let actualizados = 0;

    setActiveCruceBatchId(newBatchId);

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
          // Inmutablemente actualizar el elemento existente
          const existing = copy[idx];
          let updatedItem = { ...existing, cruceBatchId: newBatchId };

          if ('isCMS' in match && match.isCMS) {
            if (match.remitente) updatedItem = { ...updatedItem, remitente: match.remitente };
            if (match.date) {
              updatedItem = {
                ...updatedItem,
                date: match.date,
                displayDate: match.date.split('-').reverse().join('/')
              };
            }
          } else {
            if (match?.operadora) {
              updatedItem = { ...updatedItem, operadora: match.operadora as any };
            } else {
              updatedItem = { ...updatedItem, operadora: 'DISPONIBLE' as any };
            }
            if (match?.simNumber) {
              updatedItem = { ...updatedItem, sim: true, simNumber: match.simNumber };
            }
            if (match?.ticket && !existing.ticket) {
              updatedItem = { ...updatedItem, ticket: match.ticket };
            }
          }
          copy[idx] = updatedItem;
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
            addedFromCruce: true,
            cruceBatchId: newBatchId
          });
          nuevos++;
        }
      });

      return copy;
    });

    alert(`✅ ¡Cruce inteligente completado!\n• ${nuevos} nuevos registros agregados.\n• ${actualizados} terminales existentes actualizados.`);
    setRemitenteCorreo('');
    setCurrentTab('general');
  };

  const handleAddMatchesToGeneral = () => {
    if (coincidencias.length === 0) {
      alert('No hay coincidencias detectadas para agregar en este momento.');
      return;
    }

    if (!remitenteCorreo.trim()) {
      setModalRemitenteValue('');
      setIsRemitentePromptOpen(true);
      return;
    }

    proceedWithAdding(remitenteCorreo);
  };

  const handleExportCruceReport = () => {
    const allSetKeys = Array.from(new Set([...emailUniques, ...fisicoUniques]));
    if (allSetKeys.length === 0) return;

    let csv = "sep=;\nSERIAL;ESTADO\n";

    for (const s of allSetKeys) {
      const matchMaster = lookupValidador(s);
      const status = matchMaster?.status || 'N#A';
      csv += `"${s}";"${status}"\n`;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_cruzado_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Aesthetic light pastel style badges with pure WHITE text inside
  const getStatusBadgeStyle = (st: POSStatus) => {
    if (['CANCELADO', 'N#A', 'RECUPERADO'].includes(st)) {
      return 'bg-green-600 text-white border border-green-700 font-bold px-2 py-0.5 rounded shadow-sm';
    }
    if (['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(st)) {
      return 'bg-orange-600 text-white border border-orange-550 font-extrabold px-2 py-0.5 rounded shadow-sm';
    }
    return 'bg-slate-500 text-white border border-slate-600 font-semibold px-2 py-0.5 rounded shadow-xs';
  };

  return (
    <div className="flex flex-col gap-5 text-slate-800 pb-16 font-arial cruce-tab-container">
      
      {/* SECCIÓN VALIDADOR / HOJA DE CONTROL: ENVIADO HACIA LOGICA IMS / CMS */}
      <div className="dark-panel p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 animate-pulse" style={{ color: '#0d9488' }} />
            BASES DE DATOS (IMS / CMS)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {imsCargado && (
              <div className="flex items-center justify-center mr-1" title="Base IMS cargada y activa">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                </span>
              </div>
            )}
            <button 
              onClick={() => {
                setImsSerialsRaw('');
                setImsStatusRaw('');
                setIsIMSModalOpen(true);
              }}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer select-none border-none btn-green"
            >
              <Database size={13} className="text-white" />
              <span>IMS</span>
            </button>
            {imsCargado && (
              <button 
                onClick={() => {
                  if (window.confirm("¿Está seguro de que desea limpiar la base de datos IMS cargada?")) {
                    setDatosMaestro([]);
                  }
                }}
                className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer select-none border-none btn-red"
                title="Limpiar Base IMS"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                setCMSSerialsRaw('');
                setCMSStatusRaw('');
                setCMSRemitenteRaw('');
                setCMSFechaRaw('');
                setIsCMSModalOpen(true);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer select-none border-none btn-blue"
            >
              <Database size={13} className="text-white" />
              <span>CMS</span>
            </button>
            {CMSCargado && (
              <button 
                onClick={() => {
                  if (window.confirm("¿Está seguro de que desea limpiar la base de datos CMS cargada?")) {
                    setDatosCMS([]);
                  }
                }}
                className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer select-none border-none btn-red"
                title="Limpiar Base CMS"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* INPUTS DE SERIALES EN REAL-TIME (ESTRUCTURA DE DOS CAMPOS EXCLUSIVOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL 1: SERIALES DESDE CORREO */}
        <div className="dark-panel p-5 flex flex-col gap-3 min-h-[380px]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-550 animate-pulse"></span>
              <h4 className="font-extrabold text-xs text-blue-600 uppercase tracking-wider">SERIALES EN CORREO</h4>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-700 uppercase font-mono">
                Únicos: {emailUniques.length}
              </span>
              
              <button 
                onClick={() => setEmailViewMode(prev => prev === 'visual' ? 'edit' : 'visual')}
                disabled={emailText === ''}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center gap-1 ${
                  emailViewMode === 'visual' 
                    ? 'toggle-active' 
                    : 'toggle-inactive disabled:opacity-50 disabled:cursor-not-allowed'
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
                className="px-2 py-1 toggle-inactive disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
                className="w-full flex-1 min-h-[220px] text-xs font-semibold p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 placeholder-slate-400 transition-all font-sans"
              />
              <button
                onClick={() => {
                  if (emailText.trim()) setEmailViewMode('visual');
                }}
                disabled={!emailText.trim()}
                className="w-full py-1.5 btn-blue disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase cursor-pointer transition-all"
              >
                Procesar y Hacer Match
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-1 pr-1.5 space-y-1.5">
              {emailUniques.map((serial, idx) => {
                const isMatch = fisicoSet.has(serial);
                const dbMatch = lookupValidador(serial);

                return (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold transition-all ${
                      isMatch 
                        ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm' 
                        : 'bg-slate-50 text-slate-450 border-slate-150 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-sans">
                      <span className="text-[10px] text-slate-500 font-bold font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                      <span className="text-slate-800 font-mono tracking-wider font-semibold text-[13px] select-all">{serial}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-sans text-[11px]">
                      <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase font-sans ${getStatusBadgeStyle(dbMatch.status)}`}>
                        {dbMatch.status}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider font-sans ${
                        isMatch ? 'bg-green-600 text-white border border-green-500 shadow-xs' : 'bg-slate-500 text-white border border-slate-600 shadow-xs'
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
        <div className="dark-panel p-5 flex flex-col gap-3 min-h-[380px]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <h4 className="font-extrabold text-xs text-orange-600 uppercase tracking-wider">SERIALES EN FISICO</h4>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-700 uppercase font-mono">
                Únicos: {fisicoUniques.length}
              </span>
              
              <button 
                onClick={() => setFisicoViewMode(prev => prev === 'visual' ? 'edit' : 'visual')}
                disabled={fisicoText === ''}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center gap-1 ${
                  fisicoViewMode === 'visual' 
                    ? 'toggle-active' 
                    : 'toggle-inactive disabled:opacity-50 disabled:cursor-not-allowed'
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
                className="px-2 py-1 toggle-inactive disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
                className="w-full flex-1 min-h-[220px] text-xs font-semibold p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-300 placeholder-slate-400 transition-all font-sans"
              />
              <button
                onClick={() => {
                  if (fisicoText.trim()) setFisicoViewMode('visual');
                }}
                disabled={!fisicoText.trim()}
                className="w-full py-1.5 btn-orange disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase cursor-pointer transition-all"
              >
                Procesar y Hacer Match
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2.5">
              


              <div className="flex-1 pr-1.5 space-y-1.5 border border-slate-150 p-2 rounded-xl bg-slate-50">
                {fisicoUniques.map((serial, idx) => {
                  const isMatch = emailSet.has(serial);
                  const dbMatch = lookupValidador(serial);

                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold scale-98 transition-all ${
                        isMatch 
                          ? 'bg-white border-orange-500 text-slate-800 shadow-sm' 
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 font-sans">
                        <span className="text-[10px] text-slate-550 font-bold font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                        <span className="text-slate-850 font-mono tracking-wider font-semibold text-[13px] select-all">{serial}</span>
                      </div>

                      <div className="flex items-center gap-2 font-sans text-[11px]">
                        {/* Inline custom select */}
                        <select
                          value={dbMatch?.status || 'N#A'}
                          onChange={(e) => updateSerialStatus(serial, e.target.value as POSStatus)}
                          className={`text-[10px] font-extrabold px-1.5 py-1 rounded border uppercase outline-none cursor-pointer tracking-wider font-sans ${
                            dbMatch 
                              ? (['CANCELADO', 'N#A', 'RECUPERADO'].includes(dbMatch.status) ? 'status-select-green' : ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(dbMatch.status) ? 'status-select-orange' : 'bg-slate-500 text-white')
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <option value="SIN ESTATUS">SIN ESTATUS</option>
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="RECUPERADO">RECUPERADO</option>
                          <option value="CANCELADO">CANCELADO</option>
                          <option value="SUSPENDIDO">SUSPENDIDO</option>
                          <option value="N#A">N#A</option>
                        </select>

                        <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider font-sans ${
                          isMatch ? 'bg-green-600 text-white border border-green-500 shadow-xs' : 'bg-slate-500 text-white border border-slate-600 shadow-xs'
                        }`}>
                          {isMatch ? '✓ MATCH' : 'SIN MATCH'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LISTA DE SERIALES PLANA BUTTON */}
              <button
                onClick={() => setIsFlatModalOpen(true)}
                disabled={fisicoUniques.length === 0}
                className="w-full text-xs font-extrabold uppercase py-2.5 bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2 text-white-force"
                style={{ color: '#ffffff' }}
              >
                <Clipboard size={13} className="text-white" />
                <span>LISTA DE SERIALES PLANA</span>
              </button>

              {/* ASIGNACION DE STATUS GRUPAL BUTTON */}
              <button
                onClick={() => {
                  setSelectedSerialsBulk(new Set());
                  setIsBulkModalOpen(true);
                }}
                disabled={fisicoUniques.length === 0}
                className="w-full text-xs font-extrabold uppercase py-2.5 btn-orange transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Layers size={13} className="text-white" />
                <span>ASIGNACION DE STATUS GRUPAL</span>
              </button>
              <button
                onClick={handleAddMatchesToGeneral}
                disabled={coincidencias.length === 0}
                className="w-full text-xs font-extrabold uppercase py-2.5 btn-green disabled:bg-slate-100 disabled:text-slate-450 disabled:border-slate-200 disabled:cursor-not-allowed text-white transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Send size={13} className="text-white" />
                <span>Añadir Coincidencias a Gestión</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* PARAMETROS DE RECONCILIACIÓN DE DATOS */}
      <div className="dark-panel p-5">
        <div className="relative">
          <label className="text-xs font-extrabold text-blue-600 block mb-1.5 uppercase">REMITENTE:</label>
          <input
            type="text"
            value={remitenteCorreo}
            onChange={e => {
              setRemitenteCorreo(e.target.value.toUpperCase());
              setShowMainSuggestions(true);
            }}
            onFocus={() => setShowMainSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowMainSuggestions(false), 200);
            }}
            placeholder="Introduce remitente asignado (ej. VALIDADOR, DISGLOBAL)..."
            className="w-full text-xs font-semibold p-2.5 bg-slate-100 border border-transparent rounded-xl text-slate-800 focus:outline-none focus:bg-slate-50 focus:border-slate-300 transition-all font-semibold uppercase"
          />
          {showMainSuggestions && mainSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {mainSuggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  onMouseDown={() => {
                    setRemitenteCorreo(suggestion);
                    setShowMainSuggestions(false);
                  }}
                  className="px-3.5 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer uppercase border-b border-slate-50 last:border-b-0"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* METRICAS DE INTERSECCIÓN Y BOTONES ACCIÓN */}
      <div className="dark-panel p-6">
        <h4 className="font-extrabold text-xs tracking-wider text-slate-800 uppercase mb-4 flex items-center gap-2">
          <ArrowRightLeft className="text-blue-600 w-4.5 h-4.5" />
          MÉTRICAS DEL CRUCE Y SALIDA DE CONTROL
        </h4>

        {emailUniques.length === 0 && fisicoUniques.length === 0 ? (
          <div className="text-center text-xs text-slate-450 py-6 font-mono uppercase">
            Esperando ingresos en los campos de correo o pistola física...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Coinciden */}
              <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-md">
                <div className="text-3xl font-black text-emerald-600 select-all font-sans">{coincidencias.length}</div>
                <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-sans">Coinciden (Match)</div>
              </div>
              {/* Solo Correo */}
              <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-md">
                <div className="text-3xl font-black text-blue-600 select-all font-sans">{soloCorreo.length}</div>
                <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-sans">Solo en Correo</div>
              </div>
              {/* Solo Físico */}
              <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-md">
                <div className="text-3xl font-black text-orange-500 select-all font-sans">{soloFisico.length}</div>
                <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-sans">Solo en Físico</div>
              </div>
              {/* Total Seriales Unicos */}
              <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-md">
                <div className="text-3xl font-black text-slate-800 select-all font-sans">{totalUnicos}</div>
                <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-sans">Total Seriales Únicos</div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-750 font-bold bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 uppercase font-mono shadow-xs">
              <span>Efectividad del Emparejamiento:</span> 
              <span className={`text-sm font-black font-sans ${parseFloat(matchRatio) >= 80 ? 'text-emerald-600' : parseFloat(matchRatio) >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                {matchRatio}%
              </span>
              <span className="text-[10px] font-normal text-slate-500 lowercase normal-case">
                ({coincidencias.length} de {emailUniques.length} seriales del correo validados físicamente)
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5 justify-center mt-5 border-t border-slate-100 pt-5">

          <button
            onClick={handleExportCruceReport}
            disabled={totalUnicos === 0}
            className="px-4 py-2 btn-blue disabled:opacity-50 text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Import size={13} />
            <span>Descargar Reporte Cruzado</span>
          </button>

          <button
            onClick={limpiarTodo}
            className="px-4 py-2 toggle-inactive text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 justify-center"
          >
            <Trash2 size={13} />
            <span>Limpiar Campos</span>
          </button>
        </div>
      </div>

      {isIMSModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fade-in-overlay font-arial">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-xl overflow-hidden animate-fade-in text-slate-800">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 animate-pulse" style={{ color: '#0d9488' }} />
                <div>
                  <h3 className="text-base font-black uppercase text-slate-800 tracking-wider">Cargador de Datos Base IMS</h3>
                  <p className="text-[10px] text-slate-450 uppercase font-mono mt-0.5 tracking-wider">Configure seriales base para la reconciliación.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsIMSModalOpen(false)}
                className="p-1 px-2.5 toggle-inactive uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto bg-slate-50/50">
              
              {/* Columna 1: Seriales */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-550 uppercase font-mono font-bold tracking-wider flex items-center justify-between">
                  <span>SERIAL TERMINAL (Columna)</span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-widest lowercase normal-case">una celda por línea</span>
                </label>
                <div className="relative flex-1 flex flex-col">
                  <textarea
                    value={imsSerialsRaw}
                    onChange={e => setImsSerialsRaw(e.target.value)}
                    placeholder="Pegue aquí únicamente la columna de Serials o Equipos de su excel (ejemplo:&#10;80320498&#10;80320499&#10;80320500...)"
                    className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-350 font-mono tracking-wider placeholder-slate-400 min-h-[300px] leading-relaxed select-text"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-sm">
                    Seriales: {imsSerialsRaw.split(/\r?\n/).filter(Boolean).length}
                  </span>
                </div>
              </div>

              {/* Columna 2: Estados */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-550 uppercase font-mono font-bold tracking-wider flex items-center justify-between">
                  <span>STATUS SERVICIO (Columna)</span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-widest lowercase normal-case">una celda por línea</span>
                </label>
                <div className="relative flex-1 flex flex-col">
                  <textarea
                    value={imsStatusRaw}
                    onChange={e => setImsStatusRaw(e.target.value)}
                    placeholder="Pegue aquí únicamente la columna de Estados o Status de su excel (ejemplo:&#10;ACTIVO&#10;PENDIENTE&#10;CANCELADO...)"
                    className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-350 font-mono tracking-wider placeholder-slate-400 min-h-[300px] leading-relaxed select-text"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-sm">
                    Estados: {imsStatusRaw.split(/\r?\n/).filter(Boolean).length}
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">REGLA IMPORTANTE:</span>
                <span className="text-[10px] text-slate-650 block">
                  La línea 1 del campo izquierdo se emparejará con la línea 1 del derecho. Si no hay correspondencia, se asigna <span className="font-bold text-orange-600">N#A / DISPONIBLE</span>.
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setImsSerialsRaw('');
                    setImsStatusRaw('');
                  }}
                  className="px-4 py-2 toggle-inactive text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Limpiar Ventana
                </button>
                <button
                  type="button"
                  onClick={handleConfirmIMS}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-transparent text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98"
                >
                  <Check size={14} className="text-white" />
                  <span>Procesar y Confirmar Datos IMS</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {isFlatModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fade-in-overlay select-none font-arial">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg flex flex-col shadow-xl overflow-hidden animate-fade-in text-slate-800">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clipboard className="text-slate-850 w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Lista de Seriales Plana</h3>
                  <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">
                    {fisicoUniques.length} seriales únicos escaneados
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsFlatModalOpen(false)}
                className="p-1 px-2.5 toggle-inactive uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-3.5 select-text">
              <p className="text-xs text-slate-500 font-sans">
                Puede arrastrar el ratón para seleccionar una parte de la lista o hacer clic dentro del cuadro para seleccionarlos todos y copiarlos directamente a su correo:
              </p>
              
              <textarea
                readOnly
                value={fisicoUniques.join('\n')}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full h-64 font-mono text-xs p-3.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none select-text cursor-text"
                title="Haga clic para seleccionar todo"
              />

              <div className="flex gap-2 justify-end mt-1">
                 <button
                  onClick={() => {
                    copyToClipboard(fisicoUniques.join('\n'));
                    alert('⚡ Todos los seriales han sido copiados al portapapeles.');
                  }}
                  className="btn-green font-arial font-bold uppercase text-[10px] tracking-wider px-4 py-2 cursor-pointer transition-all flex items-center gap-1.5 text-white-force"
                  style={{ color: '#ffffff' }}
                >
                  <Clipboard size={12} />
                  Copiar Todo
                </button>
                <button
                  onClick={() => setIsFlatModalOpen(false)}
                  className="px-4 py-2 toggle-inactive text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {isBulkModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fade-in-overlay select-none font-arial">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-4xl h-[75vh] flex flex-col shadow-xl overflow-hidden animate-fade-in text-slate-800">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Layers className="text-slate-850 w-5.5 h-5.5 animate-bounce" />
                <div>
                  <h3 className="text-base font-black uppercase text-slate-800 tracking-wider">Asignación de Estado Grupal (Físico)</h3>
                  <p className="text-[10px] text-slate-450 uppercase font-mono mt-0.5 tracking-wider">
                    Arrastre el mouse o use los clics para seleccionar seriales y aplicarles un estado de manera masiva.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 px-2.5 toggle-inactive uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>

            {/* Selection Engine */}
            <div className="flex-1 p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/50">
              
              {/* Left Selector List */}
              <div className="md:col-span-2 flex flex-col gap-2 h-full">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-150 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">
                    Seleccionados: {selectedSerialsBulk.size} de {fisicoUniques.length}
                  </span>
                  
                  <button
                    onClick={handleSelectAllBulk}
                    className="px-2 py-0.5 toggle-inactive text-[9.5px] font-black uppercase cursor-pointer transition-all"
                  >
                    {selectedSerialsBulk.size === fisicoUniques.length ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                  </button>
                </div>

                {/* Vertical drag list */}
                <div 
                  className="flex-1 overflow-y-auto space-y-1.5 p-1 bg-white border border-slate-150 rounded-xl max-h-[340px] shadow-sm"
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
                            ? 'bg-orange-50 border-orange-350 text-orange-850 shadow-xs'
                            : 'bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-blue-600 bg-slate-100 border-slate-200 focus:ring-0 cursor-pointer pointer-events-none"
                          />
                          <span className="text-[10px] text-slate-400 font-bold font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                          {/* Pure solid white text for extreme precise viewing of serials */}
                          <span className="text-slate-800 font-mono tracking-wider font-semibold text-[12.5px]">{serial}</span>
                        </div>

                        <div className="font-sans text-[11px] flex items-center gap-1.5">
                          <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase font-sans ${getStatusBadgeStyle(dbMatch.status)}`}>
                            {dbMatch.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side Control Bar */}
              <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-150 h-full justify-between shadow-sm">
                
                <div className="space-y-3.5">
                  <div className="p-3 bg-slate-55 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-750 tracking-wider block mb-1">INSTRUCCIONES DE SELECCIÓN:</span>
                    <span className="text-[10.5px] text-slate-650 block leading-relaxed">
                      1. Haga clic sobre un serial y <strong>arrastre el mouse</strong> sin soltarlo por los demás seriales que desee seleccionar o deseleccionar de forma masiva.<br />
                      2. También puede usar el botón superior para alternar la selección de todos los seriales a la vez.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-slate-700 block uppercase">ASIGNAR UN STATUS GRUPAL:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['ACTIVO', 'PENDIENTE', 'RECUPERADO', 'CANCELADO', 'SUSPENDIDO', 'N#A'] as POSStatus[]).map(statusValue => (
                        <button
                          key={statusValue}
                          onClick={() => handleAssignBulkStatus(statusValue)}
                          disabled={selectedSerialsBulk.size === 0}
                          className="py-2 px-1 toggle-inactive text-[9.5px] font-black uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all text-center flex items-center justify-center"
                        >
                          {statusValue}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal footer action */}
                <div className="pt-4 border-t border-slate-150 mt-auto">
                  <button
                    onClick={() => {
                      handleAddMatchesToGeneral();
                      setIsBulkModalOpen(false);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 border-none btn-green text-white-force"
                  >
                    <Send size={13} />
                    <span>AÑADIR A GESTIÓN GENERAL</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>,
        document.body
      )}

      {/* VENTANA EMERGENTE: ALIMENTADOR BASE "CMS" (HIGH PERFORMANCE MODAL) */}
      {isCMSModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fade-in-overlay font-arial">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-xl overflow-hidden animate-fade-in text-slate-800">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Database className="text-blue-600 w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="text-base font-black uppercase text-slate-800 tracking-wider">Cargador de Datos Base CMS</h3>
                  <p className="text-[10px] text-slate-450 uppercase font-mono mt-0.5 tracking-wider">Configure seriales masivos asignándoles un estatus, remitente y fecha de lote.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCMSModalOpen(false)}
                className="p-1 px-2.5 toggle-inactive uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-slate-50/50">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                
                {/* Field 1: Serials */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                  <label className="text-xs font-black uppercase text-blue-600 tracking-wider flex items-center justify-between">
                    <span>SERIALES</span>
                  </label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={CMSSerialsRaw}
                      onChange={e => setCMSSerialsRaw(e.target.value)}
                      placeholder="Pegue aquí los seriales&#10;(ej: 80320498...)"
                      className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-355 font-mono tracking-wider placeholder-slate-400 min-h-[200px] leading-relaxed select-text shadow-sm"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-sm">
                      {CMSSerialsRaw.split(/\r?\n/).filter(Boolean).length}
                    </span>
                  </div>
                </div>

                {/* Field 2: Status */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                  <label className="text-xs font-black uppercase text-blue-600 tracking-wider">ESTATUS</label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={CMSStatusRaw}
                      onChange={e => setCMSStatusRaw(e.target.value)}
                      placeholder="Pegue aquí el estatus&#10;(ej: ACTIVO...)"
                      className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-355 font-mono tracking-wider placeholder-slate-400 min-h-[200px] leading-relaxed select-text shadow-sm"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-sm">
                      {CMSStatusRaw.split(/\r?\n/).filter(Boolean).length}
                    </span>
                  </div>
                </div>

                {/* Field 3: Remitente */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                  <label className="text-xs font-black uppercase text-blue-600 tracking-wider">REMITENTE</label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={CMSRemitenteRaw}
                      onChange={e => setCMSRemitenteRaw(e.target.value)}
                      placeholder="Pegue aquí el remitente&#10;(ej: DISGLOBAL...)"
                      className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-355 font-mono tracking-wider placeholder-slate-400 min-h-[200px] leading-relaxed select-text uppercase shadow-sm"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-sm">
                      {CMSRemitenteRaw.split(/\r?\n/).filter(Boolean).length}
                    </span>
                  </div>
                </div>

                {/* Field 4: Fecha */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                  <label className="text-xs font-black uppercase text-blue-600 tracking-wider">FECHA LOTE</label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      value={CMSFechaRaw}
                      onChange={e => setCMSFechaRaw(e.target.value)}
                      placeholder="Pegue aquí la fecha&#10;(ej: 2024-05-25...)"
                      className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-slate-50 focus:border-slate-355 font-mono tracking-wider placeholder-slate-400 min-h-[200px] leading-relaxed select-text shadow-sm"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-sm">
                      {CMSFechaRaw.split(/\r?\n/).filter(Boolean).length}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-4">
              <span className="text-[10px] text-slate-450 block uppercase font-bold">
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
                  className="px-4 py-2 toggle-inactive text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Limpiar Ventana
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCMS}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 border border-transparent text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg btn-blue active:scale-98"
                >
                  <Check size={14} className="text-white" />
                  <span>Confirmar Datos CMS</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {isRemitentePromptOpen && createPortal(
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fade-in-overlay font-arial">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md flex flex-col shadow-xl overflow-hidden animate-fade-in text-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="text-slate-850 w-5 h-5" />
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Remitente Requerido</h3>
              </div>
              <button 
                onClick={() => setIsRemitentePromptOpen(false)}
                className="p-1 px-2.5 toggle-inactive uppercase cursor-pointer text-[10px] font-black tracking-wider transition-all"
              >
                Cancelar ✕
              </button>
            </div>
            {/* Content */}
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-slate-650 font-sans">
                Por favor, introduzca el nombre del remitente para completar el cruce de seriales e ingresarlos en la gestión general.
              </p>
              
              <div className="relative">
                <label className="text-[10px] text-slate-550 uppercase font-mono font-bold tracking-wider block mb-1">
                  Nombre del Remitente:
                </label>
                <input
                  type="text"
                  value={modalRemitenteValue}
                  onChange={e => {
                    setModalRemitenteValue(e.target.value.toUpperCase());
                    setShowModalSuggestions(true);
                  }}
                  onFocus={() => setShowModalSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowModalSuggestions(false), 200);
                  }}
                  placeholder="Escriba el remitente (ej. VALIDADOR, DISGLOBAL)..."
                  className="w-full text-xs font-semibold p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-slate-350 transition-all font-semibold uppercase"
                  autoFocus
                />
                {showModalSuggestions && modalSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {modalSuggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        onMouseDown={() => {
                          setModalRemitenteValue(suggestion);
                          setShowModalSuggestions(false);
                        }}
                        className="px-3.5 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer uppercase border-b border-slate-50 last:border-b-0"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => setIsRemitentePromptOpen(false)}
                  className="px-4 py-2 toggle-inactive text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const val = modalRemitenteValue.trim().toUpperCase();
                    if (!val) {
                      alert('Debe introducir un remitente válido.');
                      return;
                    }
                    setRemitenteCorreo(val);
                    setIsRemitentePromptOpen(false);
                    proceedWithAdding(val);
                  }}
                  className="btn-green font-arial font-bold uppercase text-[10px] tracking-wider px-4 py-2 cursor-pointer transition-all flex items-center gap-1.5 text-white-force"
                  style={{ color: '#ffffff' }}
                >
                  <Check size={12} />
                  Confirmar y Guardar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
