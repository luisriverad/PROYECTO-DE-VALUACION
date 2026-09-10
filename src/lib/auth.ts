/* Sesión de la plataforma.

   La autenticación vive en Supabase: las contraseñas se cifran y se validan
   del lado del servidor, nunca viajan al bundle ni se guardan aquí. Lo único
   que se compila en el navegador es la URL del proyecto y la llave «anon»,
   que están hechas para ser públicas: no dan acceso a nada por sí solas
   porque las tablas están protegidas con RLS (row level security).

   El rol —administrador o alumno— no vive en la cuenta sino en la tabla
   `perfiles`, una fila por usuario. Así se puede cambiar desde el panel de
   Supabase sin tocar el código, y el alumno no puede ascenderse solo: sólo
   tiene permiso de escritura sobre la columna `ultimo_acceso`. */

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { ligarCuenta, olvidarLlave } from "./ia";

const env: any = (import.meta as any).env || {};

/* ---------- conexión ----------
   Pega aquí los dos datos del proyecto (Supabase → Project Settings → API).
   Se pueden sobreescribir al compilar con VITE_SUPABASE_URL y
   VITE_SUPABASE_ANON_KEY, que tienen prioridad. */
const URL_FIJA = "https://yhccdtawlsrjnnyqgsdd.supabase.co";
const ANON_FIJA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY2NkdGF3bHNyam5ueXFnc2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MjMwMjUsImV4cCI6MjEwNDM5OTAyNX0.h6G2GNL57qsX90fae_BTqL0HdGOcx9dKEuA5tqkBbws";

export const SUPABASE_URL = String(env.VITE_SUPABASE_URL || URL_FIJA || "").trim();
export const SUPABASE_ANON = String(env.VITE_SUPABASE_ANON_KEY || ANON_FIJA || "").trim();

/* Mientras no estén configurados, la plataforma lo dice de frente en vez de
   fallar con un error de red que nadie sabe interpretar. */
export const configurado = !!(SUPABASE_URL && SUPABASE_ANON);

export const sb: any = configurado ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

/* ---------- roles ----------
   Hay un solo administrador —quien da el curso— y el resto son alumnos.
   El rol se lee de la tabla, nunca del correo: cambiarlo es una línea en
   Supabase y no exige recompilar ni republicar nada. */
export function esAdmin(perfil: any) { return perfil?.rol === "admin"; }

/* ---------- perfil ----------
   Trae nombre y rol de la fila del usuario. Si la fila no existe todavía
   —cuenta recién creada a mano sin perfil— se asume alumno, que es el rol
   sin privilegios: ante la duda, el menos poderoso. */
async function traerPerfil(userId: string, correo: string) {
  const base: any = { id: userId, correo, nombre: correo.split("@")[0], rol: "alumno", activo: true };
  try {
    /* `*` y no una lista de columnas: si la base va una versión atrasada y le
       falta alguna, se prefiere leer el perfil con lo que haya —y sobre todo
       el rol— a que la consulta entera falle y todos entren como alumnos. */
    const { data, error } = await sb.from("perfiles").select("*").eq("id", userId).maybeSingle();
    if (error) {
      /* Que no se pueda leer el perfil no impide trabajar, pero sí explica que
         alguien no vea lo que le toca. Se guarda para poder decirlo en pantalla
         en vez de dejar al usuario adivinando. */
      base._fallo = error.message || "no se pudo leer el perfil";
      return base;
    }
    if (data) return Object.assign(base, data, { correo });
    base._fallo = "tu cuenta no tiene fila en la tabla de perfiles";
  } catch (e: any) {
    base._fallo = e?.message || "no se pudo consultar el perfil";
  }
  return base;
}

/* Deja constancia de la última entrada, que es lo que el profesor ve en el
   tablero de grupo. Si falla no se interrumpe el acceso: es un dato de apoyo,
   no un requisito para trabajar. */
async function marcarAcceso(userId: string) {
  try { await sb.from("perfiles").update({ ultimo_acceso: new Date().toISOString() }).eq("id", userId); }
  catch (e) { /* dato de apoyo, no bloquea */ }
}

/* ---------- hook de sesión ----------
   Devuelve el estado completo de la puerta: si todavía está averiguando si hay
   sesión, quién entró y con qué rol. */
export function useSesion() {
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);

  useEffect(() => {
    if (!configurado) { setCargando(false); return; }
    let vivo = true;

    const aplicar = async (sesion: any) => {
      /* la llave de la IA se liga a la cuenta que entró, antes de pintar nada */
      ligarCuenta(sesion?.user?.id || null);
      if (!sesion?.user) { if (vivo) { setPerfil(null); setCargando(false); } return; }
      const p = await traerPerfil(sesion.user.id, sesion.user.email || "");
      if (vivo) { setPerfil(p); setCargando(false); }
    };

    /* la sesión sobrevive al refresh: Supabase la guarda y la renueva sola */
    sb.auth.getSession().then(({ data }: any) => aplicar(data?.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e: any, sesion: any) => aplicar(sesion));

    return () => { vivo = false; sub?.subscription?.unsubscribe(); };
  }, []);

  return { cargando, perfil, entrar, salir };
}

/* ---------- entrar y salir ---------- */
/* Devuelve un mensaje de error en español, o null si entró bien. Los mensajes
   de Supabase vienen en inglés y son crípticos para quien no programa. */
export async function entrar(correo: string, contrasena: string) {
  if (!configurado) return "La plataforma todavía no tiene configurado el acceso. Avisa al administrador.";
  const mail = (correo || "").trim().toLowerCase();
  if (!mail || !contrasena) return "Escribe tu correo y tu contraseña.";

  let r: any;
  try {
    r = await sb.auth.signInWithPassword({ email: mail, password: contrasena });
  } catch (e) {
    return "No se pudo conectar. Revisa tu conexión a internet e intenta de nuevo.";
  }

  const msg = r?.error?.message || "";
  if (msg) {
    if (/invalid login credentials/i.test(msg)) return "El correo o la contraseña no coinciden.";
    if (/email not confirmed/i.test(msg)) return "Tu cuenta todavía no está confirmada. Revisa el correo de alta.";
    if (/rate|too many/i.test(msg)) return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
    return "No se pudo entrar: " + msg;
  }

  if (r?.data?.user?.id) marcarAcceso(r.data.user.id);
  return null;
}

/* ---------- darse de alta ----------
   El nombre del empresario se manda como metadato de la cuenta; el trigger de
   la base lo copia a `perfiles.nombre` al crear la fila. Así el administrador
   ve nombres de personas en el padrón, no direcciones de correo.

   Devuelve null si quedó y entró, un texto si algo falló, y el aviso de
   confirmación si el proyecto exige verificar el correo. */
export async function registrar(nombre: string, correo: string, contrasena: string) {
  if (!configurado) return "La plataforma todavía no tiene configurado el acceso. Avisa al administrador.";
  const mail = (correo || "").trim().toLowerCase();
  const quien = (nombre || "").trim();
  if (!quien) return "Escribe el nombre del empresario.";
  if (!mail) return "Escribe tu correo.";
  if ((contrasena || "").length < 6) return "La contraseña necesita al menos 6 caracteres.";

  let r: any;
  try {
    r = await sb.auth.signUp({ email: mail, password: contrasena, options: { data: { nombre: quien } } });
  } catch (e) {
    return "No se pudo conectar. Revisa tu conexión a internet e intenta de nuevo.";
  }

  const msg = r?.error?.message || "";
  if (msg) {
    if (/already registered|already been registered|user already/i.test(msg))
      return "Ese correo ya tiene cuenta. Entra con tu contraseña o pide que te la restablezcan.";
    if (/password/i.test(msg)) return "La contraseña no cumple el mínimo del sistema: usa al menos 6 caracteres.";
    if (/invalid.*email|email.*invalid/i.test(msg)) return "Ese correo no parece válido.";
    if (/signups? not allowed|disabled/i.test(msg))
      return "El alta de cuentas está deshabilitada en este momento. Pídele el alta al administrador.";
    return "No se pudo crear la cuenta: " + msg;
  }

  /* sin sesión de vuelta, el proyecto pide confirmar el correo antes de entrar */
  if (!r?.data?.session) return "CONFIRMA";

  if (r?.data?.user?.id) marcarAcceso(r.data.user.id);
  return null;
}

/* Salir borra la llave de la IA de este navegador: en una computadora
   compartida no queda nada que el siguiente pueda usar. */
export async function salir() {
  olvidarLlave();
  ligarCuenta(null);
  try { await sb?.auth?.signOut(); } catch (e) { /* la sesión local ya se limpió */ }
}

/* ---------- dar de baja y reactivar ----------
   La comprobación de quién manda vive en la base, no aquí: esta llamada sólo
   pide, y Postgres decide. Un alumno que la invocara a mano recibiría el
   mismo «no» que si no existiera el botón. */
export async function cambiarAlta(id: string, activo: boolean) {
  if (!configurado) return "El acceso a la nube no está configurado.";
  const { error } = await sb.rpc("dar_de_baja", { p_id: id, p_activo: activo });
  if (error) {
    if (/Sólo el administrador|permission|denied/i.test(error.message || ""))
      return "Sólo el administrador puede dar de baja o reactivar cuentas.";
    if (/function|does not exist|schema cache/i.test(error.message || ""))
      return "Falta correr la última versión de supabase/esquema.sql: la función dar_de_baja no existe todavía.";
    return "No se pudo cambiar el alta: " + error.message;
  }
  return null;
}

/* ---------- eliminar definitivamente ----------
   Borra la cuenta de Supabase —ya no puede entrar ni por la API—, su perfil y
   todo su trabajo. Igual que la baja, quien decide si se puede es la base. */
export async function eliminarCuenta(id: string) {
  if (!configurado) return "El acceso a la nube no está configurado.";
  const { error } = await sb.rpc("eliminar_cuenta", { p_id: id });
  if (error) {
    const msg = error.message || "";
    if (/administrador/i.test(msg)) return msg;
    if (/permission|denied/i.test(msg)) return "Sólo el administrador puede eliminar cuentas.";
    if (/function|does not exist|schema cache/i.test(msg))
      return "Falta correr la última versión de supabase/esquema.sql: la función eliminar_cuenta no existe todavía.";
    return "No se pudo eliminar la cuenta: " + msg;
  }
  return null;
}

/* ---------- padrón ----------
   Quién tiene cuenta y cuándo entró por última vez. La política de RLS sólo
   deja que esta consulta devuelva a todos si quien pregunta es el
   administrador; a un alumno le devolvería únicamente su propia fila. */
export async function traerPadron() {
  if (!configurado) return [];
  const { data, error } = await sb.from("perfiles")
    .select("id, nombre, correo, rol, grupo, activo, ultimo_acceso")
    .order("nombre", { ascending: true });
  if (error) throw new Error("No se pudo leer el padrón: " + error.message);
  return data || [];
}
