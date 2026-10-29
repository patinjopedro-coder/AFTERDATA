import React from 'react';

interface SerialConSalidaProps {
  serial: string;
  salida?: boolean;
}

export const SerialConSalida: React.FC<SerialConSalidaProps> = ({ serial, salida = false }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    <span>{serial}</span>
    {salida && (
      <span
        className="inline-flex items-center justify-center border border-black bg-black px-1 text-[9px] font-black text-white"
        title="Equipo fuera de la base"
        aria-label="Salida registrada"
      >
        S
      </span>
    )}
  </span>
);
