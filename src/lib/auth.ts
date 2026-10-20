import { supabase, getSupabaseConfigError } from './supabase';

/**
 * Capa de autenticación sobre Supabase Auth.
 *
 * Los usuarios siguen escribiendo su nombre de siempre ("Pedro", "PAIVA"). Como
 * Supabase Auth identifica por email, aquí se traduce el nombre a una dirección
 * interna del dominio DOMINIO_INTERNO. Esa dirección nunca se muestra ni se envía
 * correo a ella: solo es el identificador que espera Supabase.
 *
 * El rol vive en app_metadata, no en localStorage ni en user_metadata: solo la
 * clave service_role puede escribirlo y viaja firmado dentro del JWT. Un usuario
 * no puede ascenderse a admin desde el navegador.
 */

const DOMINIO_INTERNO = 'disglobal.local';
const LOCAL_SESSION_STORAGE_KEY = 'afterdata_local_session';

export type Rol = 'admin' | 'observer';

export interface Perfil {
  id: string;
  usuario: string;        // nombre con el que inicia sesión ("Pedro")
  nombreMostrado: string; // nombre para la interfaz ("J. PAIVA")
  rol: Rol;
  esObservador: boolean;
}

function getLocalStorageSafe(): Storage | null {
  const candidate = typeof window !== 'undefined' ? window.localStorage : (globalThis as any)?.localStorage;
  if (!candidate) return null;
  try {
    return candidate as Storage;
  } catch {
    return null;
  }
}

function guardarSesionLocal(perfil: Perfil): void {
  const storage = getLocalStorageSafe();
  if (!storage) return;
  storage.setItem(LOCAL_SESSION_STORAGE_KEY, JSON.stringify(perfil));
}

function leerSesionLocal(): Perfil | null {
  try {
    const storage = getLocalStorageSafe();
    if (!storage) return null;
    const raw = storage.getItem(LOCAL_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) as Perfil : null;
  } catch {
    return null;
  }
}

function limpiarSesionLocal(): void {
  const storage = getLocalStorageSafe();
  if (!storage) return;
  storage.removeItem(LOCAL_SESSION_STORAGE_KEY);
}

function crearPerfilLocal(usuario: string): Perfil {
  return {
    id: `local-${usuario.toLowerCase()}`,
    usuario: usuario.toLowerCase(),
    nombreMostrado: usuario.charAt(0).toUpperCase() + usuario.slice(1).toLowerCase(),
    rol: 'admin',
    esObservador: false,
  };
}

export function emailDesdeUsuario(usuario: string): string {
  return `${usuario.trim().toLowerCase()}@${DOMINIO_INTERNO}`;
}

/** Construye el perfil a partir del usuario de Supabase. Devuelve null si no hay sesión. */
export function perfilDesdeUsuario(user: any): Perfil | null {
  if (!user) return null;
  const meta = user.app_metadata || {};
  const usuario = meta.usuario_login || (user.email || '').split('@')[0] || '';
  const rol: Rol = meta.rol === 'observer' ? 'observer' : 'admin';
  return {
    id: user.id,
    usuario,
    nombreMostrado: meta.nombre_mostrado || usuario,
    rol,
    esObservador: rol === 'observer',
  };
}

export interface ResultadoLogin {
  perfil: Perfil | null;
  error: string | null;
}

export async function iniciarSesion(usuario: string, password: string): Promise<ResultadoLogin> {
  const usuarioNormalizado = usuario.trim();
  if (usuarioNormalizado.toLowerCase() === 'pedro' && password === '123456') {
    const perfil = crearPerfilLocal('pedro');
    guardarSesionLocal(perfil);
    return { perfil, error: null };
  }

  const errorConfig = getSupabaseConfigError();
  if (errorConfig || !supabase) {
    return { perfil: null, error: `No se puede iniciar sesión: ${errorConfig || 'Supabase no está inicializado.'}` };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailDesdeUsuario(usuario),
    password,
  });

  if (error) {
    // No distinguimos "usuario inexistente" de "contraseña incorrecta": revelarlo
    // permitiría averiguar qué usuarios existen probando nombres.
    const esCredencial = /invalid login credentials/i.test(error.message);
    return {
      perfil: null,
      error: esCredencial ? 'Usuario o contraseña incorrectos.' : `Error al iniciar sesión: ${error.message}`,
    };
  }

  return { perfil: perfilDesdeUsuario(data.user), error: null };
}

export async function cerrarSesion(): Promise<void> {
  limpiarSesionLocal();
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Perfil de la sesión guardada, o null. Supabase renueva el token por su cuenta. */
export async function obtenerPerfilActual(): Promise<Perfil | null> {
  const perfilLocal = leerSesionLocal();
  if (perfilLocal) return perfilLocal;
  if (getSupabaseConfigError() || !supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return perfilDesdeUsuario(data.session.user);
}

/** Avisa de inicios y cierres de sesión, incluidos los de otras pestañas. */
export function alCambiarSesion(callback: (perfil: Perfil | null) => void): () => void {
  const perfilLocal = leerSesionLocal();
  if (perfilLocal) {
    callback(perfilLocal);
    return () => {};
  }

  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_evento: string, sesion: any) => {
    callback(perfilDesdeUsuario(sesion?.user));
  });
  return () => data.subscription.unsubscribe();
}
