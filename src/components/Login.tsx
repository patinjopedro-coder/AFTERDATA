import React, { useState } from 'react';
import { safeSplit } from '../utils';
import { Lock, User } from 'lucide-react';
import { LogoIcon } from './LogoIcon';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = username.trim();
    const upper = normalized.toUpperCase();
    if ((normalized === 'Pedro' && password === 'Blackopioum12') || (normalized === 'Genyerling' && password === '1234') || (normalized === 'Murachi' && password === '1234')) {
      localStorage.setItem('disglobal_authenticated', 'true');
      const storeUser = normalized === 'Pedro' ? 'Pedro' : (normalized === 'Genyerling' ? 'Genyerling' : 'Murachi');
      localStorage.setItem('disglobal_username', storeUser);
      localStorage.setItem('disglobal_role', 'admin');
      onLoginSuccess();
    } else if (upper === 'PAIVA' && password === '1234') {
      localStorage.setItem('disglobal_authenticated', 'true');
      localStorage.setItem('disglobal_username', 'J. PAIVA');
      localStorage.setItem('disglobal_role', 'observer');
      onLoginSuccess();
    } else if (upper === 'MIRNA' && password === '1234') {
      localStorage.setItem('disglobal_authenticated', 'true');
      localStorage.setItem('disglobal_username', 'M. ARMAS');
      localStorage.setItem('disglobal_role', 'observer');
      onLoginSuccess();
    } else {
      setError('Usuario o contraseña incorrectos.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc] font-arial select-none overflow-hidden">
      
      {/* PANEL IZQUIERDO: INICIO DE SESIÓN */}
      <div className="w-full md:w-[450px] bg-white border-r border-slate-200 shadow-2xl p-10 flex flex-col justify-center gap-8 z-10 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1">
            <span className="text-[10px] font-bold bg-[#2c3e50] text-white px-2 py-0.5 rounded-full font-mono uppercase tracking-widest" style={{ color: '#ffffff' }}>TRACKING</span>
          </div>
          <h2 className="text-[24px] font-black text-slate-800 uppercase tracking-wider mt-4 font-arial">INGRESE CREDENCIALES</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-red-550 border border-red-200 text-white text-xs font-bold rounded-xl animate-fade-in uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-slate-400" />
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder=""
              className="w-full text-xs p-3 bg-slate-100 border border-transparent rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={12} className="text-slate-400" />
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder=""
              className="w-full text-xs p-3 bg-slate-100 border border-transparent rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-slate-50 focus:border-slate-350 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-none shadow-md mt-2 text-white-force"
          >
            <span>Ingresar al Sistema</span>
          </button>
        </form>
      </div>

      {/* AREA DERECHA/CENTRO: LOGO */}
      <div className="flex-1 flex items-center justify-center p-12 relative dashboard-bg">
        <div className="flex flex-col items-center gap-8">
          
          {/* Logo grande usando LogoIcon */}
          <LogoIcon className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80" color="#1e293b" animated={true} />

          {/* Nombre al lado del logo */}
          <div className="text-center flex flex-col font-arial">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-800 tracking-tight leading-none">
              TRACKING
            </h1>
          </div>

        </div>
      </div>

    </div>
  );
};
