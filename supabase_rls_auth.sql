-- ============================================================================
-- DISGLOBAL TRACKING — Row Level Security para la tabla 'registros'
-- ============================================================================
--
--   EJECUTAR ESTE ARCHIVO AHORA. Es lo que desbloquea la lectura de datos.
--
-- Diagnóstico (comprobado el 31/07/2026 con peticiones reales a la API):
--
--   Misma consulta, dos identidades distintas:
--     · con la clave service_role  -> 2211 registros
--     · con un token de usuario    -> HTTP 200 y []  (cero filas, SIN error)
--
-- La tabla 'registros' ya tenía RLS activado pero NINGUNA política. Postgres no
-- devuelve error en ese caso: filtra todas las filas y responde una lista vacía.
-- Por eso la aplicación nunca mostró datos y nunca mostró un fallo. La clave
-- service_role no lo revelaba porque, por diseño, se salta RLS.
--
-- Este script crea las políticas que faltaban. Sin él, ni la app antigua ni la
-- nueva pueden leer nada.
--
-- Orden:
--   1. Ejecutar este script en el SQL Editor de Supabase.
--   2. Probar en local: entrar y ver los 2211 registros.
--   3. Desplegar la rama con el login de Supabase Auth.
--
-- Ojo: como las políticas exigen sesión iniciada, el bundle que hoy está en
-- producción (que no tiene login) seguirá sin leer hasta que despliegues.
--
-- Para revertir, al final del archivo hay un bloque de emergencia.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Estado actual (ejecuta esto primero y guarda el resultado)
-- ----------------------------------------------------------------------------
select relrowsecurity as rls_activo from pg_class where relname = 'registros';
select policyname, roles, cmd from pg_policies where tablename = 'registros';


-- ----------------------------------------------------------------------------
-- 2. Función auxiliar: ¿el usuario de la sesión es administrador?
--
--    El rol vive en app_metadata del usuario, que solo la clave service_role
--    puede modificar y que viaja firmado dentro del JWT. Leerlo de user_metadata
--    sería inseguro: ahí el propio usuario puede escribir desde el navegador.
-- ----------------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin',
    false
  );
$$;


-- ----------------------------------------------------------------------------
-- 3. Activar RLS y definir políticas
--
--    Lectura : cualquier usuario con sesión iniciada (admins y observadores).
--    Escritura: solo administradores. Los observadores quedan en solo lectura
--               de verdad, no únicamente en la interfaz.
--
--    Nota: la app ya no escribe 'currentTab' en esta tabla (ahora es preferencia
--    local de cada navegador), así que un observador no necesita escribir nada.
-- ----------------------------------------------------------------------------
alter table registros enable row level security;

drop policy if exists "lectura autenticada" on registros;
create policy "lectura autenticada"
  on registros for select
  to authenticated
  using (true);

drop policy if exists "insercion solo admin" on registros;
create policy "insercion solo admin"
  on registros for insert
  to authenticated
  with check (public.es_admin());

drop policy if exists "actualizacion solo admin" on registros;
create policy "actualizacion solo admin"
  on registros for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "borrado solo admin" on registros;
create policy "borrado solo admin"
  on registros for delete
  to authenticated
  using (public.es_admin());


-- ----------------------------------------------------------------------------
-- 4. Verificación
-- ----------------------------------------------------------------------------
-- Debe devolver rls_activo = true y las cuatro políticas:
select relrowsecurity as rls_activo from pg_class where relname = 'registros';
select policyname, roles, cmd from pg_policies where tablename = 'registros' order by policyname;

-- Comprobación práctica desde la aplicación:
--   - Entrar como Pedro (admin)      -> ve los 2211 registros y puede editar.
--   - Entrar como PAIVA (observer)   -> ve los 2211 registros, no puede guardar.
--   - Sin iniciar sesión             -> no ve absolutamente nada.


-- ============================================================================
-- BLOQUE DE EMERGENCIA — revertir si algo sale mal
-- ============================================================================
-- Descomenta y ejecuta SOLO si necesitas volver al estado anterior:
--
-- alter table registros disable row level security;
--
-- Con esto la tabla vuelve a ser accesible con la clave anon y la aplicación
-- antigua funciona otra vez. Recuerda que eso reabre el acceso público.
-- ============================================================================
