-- ============================================================
-- Esquema de la plataforma: acceso, roles y avances
-- Supabase → SQL Editor → New query. Se puede correr las veces
-- que haga falta: todo el guion es idempotente.
-- ============================================================

-- ============================================================
-- 1. PERFILES
-- Una fila por usuario. La cuenta y la contraseña viven en auth.users,
-- que es de Supabase y no se toca; aquí sólo va lo del curso.
-- Hay un solo administrador; el resto son alumnos.
-- ============================================================
create table if not exists public.perfiles (
  id            uuid primary key references auth.users on delete cascade,
  correo        text,
  nombre        text,
  rol           text not null default 'alumno',
  grupo         text,
  ultimo_acceso timestamptz
);

alter table public.perfiles enable row level security;

-- El check va aparte para poder re-correr el guion sobre una tabla que ya existe.
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check
  check (rol in ('admin', 'alumno'));

-- ---------- Alta automática ----------
-- Cada usuario nuevo estrena su fila como alumno.
create or replace function public.nuevo_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, correo, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.nuevo_perfil();

-- Rellena el perfil de las cuentas creadas antes de instalar el trigger.
insert into public.perfiles (id, correo, nombre)
select u.id, u.email, split_part(u.email, '@', 1)
from auth.users u
where not exists (select 1 from public.perfiles p where p.id = u.id);

-- ---------- Quién es administrador ----------
-- Va como función `security definer` a propósito: una política de RLS sobre
-- `perfiles` que consultara `perfiles` directamente entraría en recursión
-- infinita. La función salta RLS y corta el ciclo.
create or replace function public.es_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- ---------- Quién ve qué ----------
drop policy if exists "lee su propio perfil" on public.perfiles;
create policy "lee su propio perfil" on public.perfiles
  for select using (auth.uid() = id);

drop policy if exists "el admin lee todo el padrón" on public.perfiles;
create policy "el admin lee todo el padrón" on public.perfiles
  for select using (public.es_admin());

-- El alumno escribe en su fila, pero el permiso por columna de abajo limita esa
-- escritura a `ultimo_acceso`: no puede ascenderse a administrador.
drop policy if exists "marca su propia entrada" on public.perfiles;
create policy "marca su propia entrada" on public.perfiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.perfiles from authenticated;
grant update (ultimo_acceso) on public.perfiles to authenticated;

-- ============================================================
-- 2. AVANCES
-- El trabajo de cada alumno, una fila por módulo. `estado` es el modelo
-- completo tal cual lo maneja la aplicación; `resumen` son las cifras que
-- el administrador ve en el tablero sin tener que abrir el modelo entero.
-- ============================================================
create table if not exists public.avances (
  usuario     uuid not null references auth.users on delete cascade,
  modulo      text not null,
  estado      jsonb not null,
  resumen     jsonb,
  actualizado timestamptz not null default now(),
  primary key (usuario, modulo)
);

alter table public.avances enable row level security;

alter table public.avances drop constraint if exists avances_modulo_check;
alter table public.avances add constraint avances_modulo_check
  check (modulo in ('empresa', 'servicios', 'activo'));

-- Cada quien es dueño de su trabajo: lo lee y lo escribe, y nadie más lo toca.
drop policy if exists "lee su avance" on public.avances;
create policy "lee su avance" on public.avances
  for select using (auth.uid() = usuario);

drop policy if exists "guarda su avance" on public.avances;
create policy "guarda su avance" on public.avances
  for insert with check (auth.uid() = usuario);

drop policy if exists "actualiza su avance" on public.avances;
create policy "actualiza su avance" on public.avances
  for update using (auth.uid() = usuario) with check (auth.uid() = usuario);

-- El administrador lee todo, pero no escribe: el modelo es del alumno.
drop policy if exists "el admin lee todos los avances" on public.avances;
create policy "el admin lee todos los avances" on public.avances
  for select using (public.es_admin());

-- ============================================================
-- 3. NOMBRAR AL ADMINISTRADOR
-- Corre esta línea con tu correo después de crear tu cuenta.
-- ============================================================
-- update public.perfiles set rol = 'admin' where correo = 'tu@correo.com';
