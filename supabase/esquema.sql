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

-- Dar de baja no borra: apaga. El trabajo del alumno se conserva y la cuenta
-- se puede reactivar. Borrarla de verdad es `eliminar_cuenta`, más abajo.
alter table public.perfiles add column if not exists activo boolean not null default true;

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

-- ---------- Dar de baja y reactivar ----------
-- Va por función y no por política de update a propósito: los permisos de
-- columna son por rol, no por política, así que abrir la columna `activo` al
-- rol `authenticated` se la abriría también al alumno sobre su propia fila,
-- y podría reactivarse solo. La función comprueba quién llama antes de tocar
-- nada, y se niega a dar de baja a un administrador.
create or replace function public.dar_de_baja(p_id uuid, p_activo boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Sólo el administrador puede dar de baja o reactivar cuentas';
  end if;
  update public.perfiles set activo = p_activo where id = p_id and rol <> 'admin';
end;
$$;

revoke all on function public.dar_de_baja(uuid, boolean) from public;
grant execute on function public.dar_de_baja(uuid, boolean) to authenticated;

-- ---------- Eliminar definitivamente ----------
-- A diferencia de la baja, esto no tiene vuelta atrás: borra la cuenta de
-- `auth.users` —el acceso por la API de Supabase, sesiones y llaves de
-- renovación incluidas—, su perfil y todo su trabajo. El correo queda libre
-- para darse de alta de nuevo desde cero. Los `delete` de avances y perfiles
-- sobran porque las llaves foráneas ya van en cascada, pero se dejan
-- explícitos para no depender de ello. Nunca borra a un administrador.
create or replace function public.eliminar_cuenta(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Sólo el administrador puede eliminar cuentas';
  end if;
  if exists (select 1 from public.perfiles where id = p_id and rol = 'admin') then
    raise exception 'No se puede eliminar una cuenta de administrador';
  end if;
  delete from public.avances where usuario = p_id;
  delete from public.perfiles where id = p_id;
  delete from auth.users where id = p_id;
end;
$$;

revoke all on function public.eliminar_cuenta(uuid) from public, anon;
grant execute on function public.eliminar_cuenta(uuid) to authenticated;

-- ¿La cuenta que llama sigue dada de alta? Lo usan las políticas de avances.
create or replace function public.esta_activo()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select activo from public.perfiles where id = auth.uid()), true);
$$;

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
  for insert with check (auth.uid() = usuario and public.esta_activo());

drop policy if exists "actualiza su avance" on public.avances;
create policy "actualiza su avance" on public.avances
  for update using (auth.uid() = usuario) with check (auth.uid() = usuario and public.esta_activo());

-- El administrador lee todo, pero no escribe: el modelo es del alumno.
drop policy if exists "el admin lee todos los avances" on public.avances;
create policy "el admin lee todos los avances" on public.avances
  for select using (public.es_admin());

-- ============================================================
-- 3. NOMBRAR AL ADMINISTRADOR
-- Corre esta línea con tu correo después de crear tu cuenta.
-- ============================================================
-- update public.perfiles set rol = 'admin' where correo = 'tu@correo.com';

-- ---------- Candado de un solo administrador (opcional pero recomendado) ----------
-- Con esto puesto, ningún script ni consulta puede promover a otra cuenta: la
-- base degrada a 'alumno' cualquier intento de poner 'admin' en un correo
-- distinto, antes de guardarlo. Evita el accidente clásico de correr un
-- `update ... set rol = 'admin'` sin cláusula `where` y quedarse con un grupo
-- entero de administradores.
--
-- Sustituye el correo y descomenta:
--
-- create or replace function public.solo_un_admin()
-- returns trigger language plpgsql security definer set search_path = public as $$
-- begin
--   if new.rol = 'admin' and lower(trim(new.correo)) <> 'tu@correo.com' then
--     new.rol := 'alumno';
--   end if;
--   return new;
-- end $$;
--
-- drop trigger if exists un_solo_admin on public.perfiles;
-- create trigger un_solo_admin
--   before insert or update on public.perfiles
--   for each row execute function public.solo_un_admin();
