/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type POSStatus = 'PENDIENTE' | 'ACTIVO' | 'SUSPENDIDO' | 'CANCELADO' | 'N#A' | 'SIN ESTATUS' | 'RECUPERADO';

export type OperatingSystem = 'ANDROID' | 'LINUX' | 'DESCONOCIDO';

export interface POSItem {
  id: number;
  serial: string;
  date: string;
  displayDate: string;
  status: POSStatus;
  remitente: string;
  source: string; // Guía de entrada o proveniencia
  isCasillero: boolean;
  selected?: boolean;
  rif?: string;
  razonSocial?: string;
  destino?: string;
  observaciones?: string;
  responsable?: string;
  forro?: boolean;
  bateria?: boolean;
  cargador?: boolean;
  caja?: boolean;
  sim?: boolean;
  simNumber?: string;
  operadora?: 'MOVISTAR' | 'MOVILNET' | 'DIGITEL' | '';
  modeloManual?: string;
  modeloNegocio?: 'BASICO' | 'COMODATO' | '';
  entregadoTecnico?: boolean;
  esSustitucion?: boolean;
  serialSustituto?: string;
  fechaSalida?: string;
  fechaSalidaCliente?: string;
  guiaSalidaCliente?: string;
  destinoSalida?: string;
  fechaConfirmada?: boolean;
  ticket?: string;
  addedFromCruce?: boolean;
}

export interface EnvioExterno {
  fecha: string;
  guia: string;
  serial: string;
  rif?: string;
  razonSocial?: string;
  destino?: string;
  ticket?: string;
  solicitante?: string;
}

export interface ModelConfig {
  modelo: string;
  so: OperatingSystem;
}

export interface UserProfile {
  remitenteId: string;
  nombreCompleto: string;
  area: string;
  cargo: string;
}

export interface CruceItem {
  serial: string;
  status: POSStatus;
  operadora?: string;
  simNumber?: string;
  ticket?: string;
}

export interface CMSItem {
  serial: string;
  status: POSStatus;
  remitente: string;
  date: string;
}

