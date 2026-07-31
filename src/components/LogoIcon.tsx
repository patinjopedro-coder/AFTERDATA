import React from 'react';

import { safeSplit } from '../utils';
interface LogoIconProps {
  className?: string;
  color?: string;
  animated?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className, color = 'currentColor', animated = false }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
    >
      {animated && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes inlineScreenGreen {
            0%, 100% {
              fill: #ffffff !important;
              stroke: ${color} !important;
              filter: none !important;
            }
            50% {
              fill: #22c55e !important;
              stroke: #22c55e !important;
              filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.85)) !important;
            }
          }
          @keyframes inlineCheckmark {
            0%, 25% {
              opacity: 0 !important;
              stroke-dashoffset: 20 !important;
            }
            40%, 85% {
              opacity: 1 !important;
              stroke-dashoffset: 0 !important;
            }
            100% {
              opacity: 0 !important;
              stroke-dashoffset: 20 !important;
            }
          }
          @keyframes posBounce {
            0%, 100%, 20%, 50%, 80% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-12px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
          .inline-screen-anim {
            animation: inlineScreenGreen 3s ease-in-out infinite !important;
          }
          .inline-checkmark-anim {
            stroke-dasharray: 20 !important;
            stroke-dashoffset: 20 !important;
            animation: inlineCheckmark 3s ease-in-out infinite !important;
          }
          .pos-bounce-anim {
            animation: posBounce 2s ease-in-out infinite;
          }
        `}} />
      )}

      {/* Silueta de la letra 'D' - Gris Claro/Blanco */}
      <path 
        d="M 25 25 H 46 M 74 25 H 75 A 40 40 0 0 1 75 105 H 35 A 10 10 0 0 1 25 95 V 35" 
        stroke={color} 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Grupo animado del Punto de Venta (saltitos) */}
      <g className={animated ? "pos-bounce-anim" : ""}>
        {/* Punto de Venta (POS) - Gris Pizarra */}
        <g stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          {/* Cuerpo Principal */}
          <rect x="42" y="38" width="36" height="58" rx="6" />
          
          {/* Rollo de Papel */}
          <path d="M 48 38 V 34 C 48 32 50 30 52 30 H 68 C 70 30 72 32 72 34 V 38" />
          
          {/* Lineas del Papel */}
          <path d="M 52 30 V 15 M 60 30 V 15 M 68 30 V 15" />
        </g>

        {/* Pantalla (Fuera de grupo para control CSS) */}
        <rect 
          x="48" 
          y="46" 
          width="24" 
          height="22" 
          rx="3" 
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#ffffff"
          className={animated ? "inline-screen-anim" : ""} 
        />
        
        {/* Checkmark (Aprobado) */}
        <path 
          d="M 53 57 L 58 62 L 67 51" 
          stroke="#ffffff" 
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? "inline-checkmark-anim" : ""} 
        />

        {/* Botones del POS */}
        <g fill={color}>
          {/* Fila 1 */}
          <rect x="48" y="76" width="4" height="4" rx="1" />
          <rect x="58" y="76" width="4" height="4" rx="1" />
          <rect x="68" y="76" width="4" height="4" rx="1" />
          
          {/* Fila 2 */}
          <rect x="48" y="84" width="4" height="4" rx="1" />
          <rect x="58" y="84" width="4" height="4" rx="1" />
          <rect x="68" y="84" width="4" height="4" rx="1" />
        </g>
      </g>
    </svg>
  );
};

