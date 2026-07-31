-- ============================================================================
-- DISGLOBAL TRACKING — Esquema SQL para Supabase (Proyecto Remoto/Real)
-- ============================================================================
-- Este esquema corresponde AL PROYECTO que está desplegado en Vercel,
-- no al proyecto TRACKINGDATA-main/local.
--
-- El proyecto remoto usa:
--   - Tabla: 'registros' (configurable via VITE_SUPABASE_TABLE_NAME)
--   - Formato: key-value (clave texto → valor JSON como texto)
--   - Cliente: src/lib/supabase.js
--   - Data loading: src/db.ts → getDBItem('serialesDB', ...)
--
-- El archivo db.ts usa:
--   - serializeValue(value) → JSON.stringify(value) para almacenar
--   - parseValue(value) → JSON.parse(value) para leer
--   - setDBItem: upsert [{ key, value: serializeValue(value) }] on CONFLICT 'key'
--   - getDBItem: select 'key, value' from tabla where key = ?
-- ============================================================================

-- ============================================================================
-- TABLA: registros  (Key-Value Store — la tabla que la app consulta)
--    Esta tabla es la que el código TypeScript usa para leer/escribir datos.
--    Cada fila almacena un objeto JSON (como string) bajo una clave única.
--
--    Schema requerido por src/db.ts:
--      - key:        text  (primary key, usado para eq('key', key))
--      - value:      text  (JSON string, usado para select('key, value'))
--      - created_at: timestamptz (usado en ordenación de obtenerRegistros())
--
--    Keys usadas por la aplicación:
--      serialesDB            → POSItem[]         (seriales POS)
--      enviosExternosDB      → EnvioExterno[]    (envíos externos)
--      modelosDB             → Record<string,ModelConfig>
--      usersProfilesDB       → Record<string,UserProfile>
--      currentTab            → string            (pestaña activa)
--      simCardBatchesDB      → SimBatch[]        (lotes de SIM)
--      standbyListDB         → StandbyItem[]     (stand-by)
--      activeCruceBatchIdDB  → string            (batch ID activo)
--      registrosDB           → any               (registros adicionales)
--      cruce_emailText       → string
--      cruce_fisicoText      → string
--      pos_items             → POSItem[]         (usado en CruceSeriales)
-- ============================================================================

create table if not exists registros (
    key          text primary key,
    value        text,
    created_at   timestamptz not null default now()
);

-- Habilitar cambios en tiempo real (opcional) para la suscripción de la app
-- alter publication supabase_realtime add table registros;


-- ============================================================================
-- TABLA: seriales_staging  (Staging temporal para importar el CSV backup)
--    Esta tabla coincide con el CSV backup_completo_disglobal_2026-07-31.csv
--    con los encabezados en minúsculas.
--    Se usa para transformar los datos a JSON antes de insertar en 'registros'.
-- ============================================================================

-- PASO 0: Limpiar tipos ENUM existentes (PostgreSQL no soporta CREATE TYPE IF NOT EXISTS)
drop type if exists status_enum cascade;
drop type if exists operadora_enum cascade;
drop type if exists modelo_negocio_enum cascade;

create type status_enum as enum (
    'PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO', 'N#A',
    'SIN ESTATUS', 'RECUPERADO', 'ENTREGADO', 'DISPONIBLE'
);

create type operadora_enum as enum (
    'MOVISTAR', 'MOVILNET', 'DIGITEL', 'DISPONIBLE'
);

create type modelo_negocio_enum as enum (
    'BASICO', 'COMODATO', 'FINANCIAMIENTO'
);

create table if not exists seriales_staging (
    id                      bigint primary key,
    serial_cruce            text,
    serial_casillero        text,
    status                  status_enum,
    remitente               text,
    gui_entrada             text,
    is_casillero            boolean default false,
    rif                     text,
    razon_social            text,
    destino                 text,
    observaciones           text,
    responsable             text,
    forro                   boolean default false,
    bateria                 boolean default false,
    cargador                boolean default false,
    caja                    boolean default false,
    sim                     boolean default false,
    sim_number              text,
    operadora               operadora_enum,
    modelo_manual           text,
    modelo_negocio          modelo_negocio_enum,
    entregado_tecnico       boolean default false,
    es_sustitucion          boolean default false,
    serial_sustituto        text,
    sim_sustituto           boolean default false,
    sim_sustituto_number    text,
    fecha_salida            text,
    fecha_salida_cliente    text,
    guia_salida_cliente     text,
    destino_salida          text,
    fecha_confirmada        boolean default false,
    ticket                  text,
    added_from_cruce        boolean default false,
    banco                   text,
    bsf                     text,
    usdt                    text,
    cruce_batch_id          text,
    fecha_ingreso           text
);


-- ============================================================================
-- MIGRACIÓN: CSV backup → registros (clave 'serialesDB')
-- ============================================================================
--
-- PASO 1: Importar el CSV a la tabla seriales_staging
--   (en el SQL Editor web de Supabase: Table Editor → seriales_staging → Import)
--   - Delimiter: ; (punto y coma)
--   - Format: CSV
--   - Header row: sí
--
-- PASO 2: Ejecutar esta sección para convertir y cargar en 'registros'
-- ============================================================================

-- Convertir fecha DD/MM/YYYY → YYYY-MM-DD para el campo 'date'
-- y mantener DD/MM/YYYY para 'displayDate'
-- Insertar como JSON string en registros con key 'serialesDB'
insert into registros (key, value, created_at)
values (
    'serialesDB',
    (
        select jsonb_pretty(
            jsonb_agg(
                jsonb_build_object(
                    'id',                    s.id,
                    'serial',                s.serial_cruce,
                    'date',                  to_char(to_date(s.fecha_ingreso, 'DD/MM/YYYY'), 'YYYY-MM-DD'),
                    'displayDate',           s.fecha_ingreso,
                    'status',                s.status,
                    'remitente',             s.remitente,
                    'source',                s.gui_entrada,
                    'isCasillero',           s.is_casillero,
                    'selected',              false,
                    'rif',                   s.rif,
                    'razonSocial',           s.razon_social,
                    'destino',               s.destino,
                    'observaciones',         s.observaciones,
                    'notaReparacion',        '',
                    'responsable',           s.responsable,
                    'forro',                 s.forro,
                    'bateria',               s.bateria,
                    'cargador',              s.cargador,
                    'caja',                  s.caja,
                    'sim',                   s.sim,
                    'simNumber',             s.sim_number,
                    'operadora',             s.operadora,
                    'modeloManual',          s.modelo_manual,
                    'modeloNegocio',         s.modelo_negocio,
                    'entregadoTecnico',      s.entregado_tecnico,
                    'esSustitucion',         s.es_sustitucion,
                    'serialSustituto',       s.serial_sustituto,
                    'salienteSinRecibir',    false,
                    'simSustitu',            s.sim_sustituto,
                    'simSustitutoNumber',    s.sim_sustituto_number,
                    'modeloSustituto',       '',
                    'entregadoDisglobal',    false,
                    'entregadoA',            '',
                    'fechaSalida',           s.fecha_salida,
                    'fechaSalidaCliente',    s.fecha_salida_cliente,
                    'guiaSalidaCliente',     s.guia_salida_cliente,
                    'destinoSalida',         s.destino_salida,
                    'fechaConfirmada',       s.fecha_confirmada,
                    'ticket',                s.ticket,
                    'addedFromCruce',        s.added_from_cruce,
                    'banco',                 s.banco,
                    'bsf',                   s.bsf,
                    'usdt',                  s.usdt,
                    'cruceBatchId',          s.cruce_batch_id,
                    'sinCosto',              false,
                    'hora',                  '',
                    'history',               '[]'::jsonb
                )
            )
        )::text
        from (select * from seriales_staging order by id) s
    ),
    now()
)
on conflict (key) do update
    set value = excluded.value,
        created_at = now();

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT key, length(value) as value_length, created_at FROM registros WHERE key = 'serialesDB';
-- SELECT jsonb_array_length(value::jsonb) as num_records FROM registros WHERE key = 'serialesDB';
-- Debería devolver: serialesDB, 2211 registros

-- Limpiar tabla de staging (opcional)
-- drop table if exists seriales_staging cascade;
-- drop type if exists status_enum cascade;
-- drop type if exists operadora_enum cascade;
-- drop type if exists modelo_negocio_enum cascade;

-- ============================================================================
-- FIN
-- ============================================================================
