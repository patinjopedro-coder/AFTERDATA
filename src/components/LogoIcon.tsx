import React from 'react';

interface LogoIconProps {
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
    >
      <defs>
        {/* Glow effects para resaltar los colores neon */}
        <filter id="glowYellow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Silueta de la letra 'D' - Amarilla */}
      <path 
        d="M 25 25 H 46 M 74 25 H 75 A 40 40 0 0 1 75 105 H 35 A 10 10 0 0 1 25 95 V 35" 
        stroke="#facc15" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter="url(#glowYellow)"
      />

      {/* Punto de Venta (POS) - Azul Chillón */}
      <g stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowBlue)">
        {/* Cuerpo Principal */}
        <rect x="42" y="38" width="36" height="58" rx="6" />
        
        {/* Pantalla */}
        <rect x="48" y="46" width="24" height="22" rx="3" />
        
        {/* Checkmark (Aprobado) */}
        <path d="M 53 57 L 58 62 L 67 51" />
        
        {/* Rollo de Papel */}
        <path d="M 48 38 V 34 C 48 32 50 30 52 30 H 68 C 70 30 72 32 72 34 V 38" />
        
        {/* Lineas del Papel */}
        <path d="M 52 30 V 15 M 60 30 V 15 M 68 30 V 15" />
      </g>

      {/* Botones del POS */}
      <g fill="#0ea5e9" filter="url(#glowBlue)">
        {/* Fila 1 */}
        <rect x="48" y="76" width="4" height="4" rx="1" />
        <rect x="58" y="76" width="4" height="4" rx="1" />
        <rect x="68" y="76" width="4" height="4" rx="1" />
        
        {/* Fila 2 */}
        <rect x="48" y="84" width="4" height="4" rx="1" />
        <rect x="58" y="84" width="4" height="4" rx="1" />
        <rect x="68" y="84" width="4" height="4" rx="1" />
      </g>
    </svg>
  );
};
