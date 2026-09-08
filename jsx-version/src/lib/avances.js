/* El trabajo de cada alumno, guardado en la nube.

   Antes la plataforma sólo recordaba el módulo de activos, y sólo en el
   navegador donde se capturó: cerrar la pestaña costaba el avance de empresa y
   servicios. Ahora los tres módulos se guardan contra la cuenta, así que el
   alumno los recupera desde cualquier computadora y el administrador puede ver
   cómo van.

   Se guarda solo, sin botón: escribir es barato y perder el trabajo de una
   clase no. Lo que sí se cuida es no escribir en cada tecla —de ahí el
   retardo— porque cada carácter dispararía una llamada a la base. */

import { sb, configurado } from "./auth";

export const MODULOS_GUARDABLES = ["empresa", "servicios", "activo"];

/* ---------- resúmenes ----------
   Las cifras que el administrador ve en el tablero. Van aparte del modelo
   completo para que listar a todo el grupo no signifique bajar treinta modelos
   enteros: la lista lee `resumen`, y el modelo sólo se toca si hace falta. */
export function resumenEmpresa(estado, m) {
  return {
    empresario: estado?.empresa?.empresario || "",
    proyecto: estado?.empresa?.nombre || "",
    tipo: estado?.empresa?.tipo || "",
    vpn: num(m?.vpn), tir: num(m?.tir), wacc: num(m?.waccNom),
    inversion: num(m?.inversion), ev: num(m?.ev),
    ventas: num(m?.anios?.[0]?.ventas),
  };
}

export function resumenActivo(estado) {
  const A = estado || {};
  /* cuántos de los cuatro activos trae capturados: es la señal de avance */
  const capturados = ["maq", "inm", "ter", "auto"].filter((k) => A[k] && Object.keys(A[k]).length).length;
  return { tasa: num(A?.sup?.wacc), isr: num(A?.sup?.isr), capturados };
}

/* jsonb no acepta NaN ni Infinity: un número sucio rompería el guardado entero */
function num(v) { return typeof v === "number" && isFinite(v) ? v : null; }

/* ---------- cargar ----------
   Devuelve { empresa, servicios, activo } con lo que haya guardado. Lo que no
   exista se queda fuera y la aplicación arranca ese módulo con el ejemplo. */
export async function cargarAvances(usuario) {
  if (!configurado || !usuario) return {};
  const { data, error } = await sb.from("avances").select("modulo, estado").eq("usuario", usuario);
  if (error) throw new Error("No se pudo recuperar tu trabajo: " + error.message);
  const out = {};
  for (const f of data || []) if (f?.estado) out[f.modulo] = f.estado;
  return out;
}

/* ---------- guardar ----------
   Un temporizador por módulo: mientras el alumno teclea se reprograma, y la
   escritura ocurre cuando para. */
const timers = {};
const RETARDO = 1500;

/* Estado del guardado, para poder decirlo en pantalla sin adivinar. */
let avisar = null;
export function alGuardar(fn) { avisar = fn; }

export function guardarAvance(usuario, modulo, estado, resumen) {
  if (!configurado || !usuario) return;
  clearTimeout(timers[modulo]);
  avisar?.("guardando");
  timers[modulo] = setTimeout(() => { escribir(usuario, modulo, estado, resumen); }, RETARDO);
}

/* Guardado inmediato, el del botón. No espera el retardo y sí devuelve el
   resultado, porque quien lo aprieta está esperando una respuesta. */
export async function guardarTodo(usuario, piezas) {
  if (!configurado) return "El acceso a la nube no está configurado todavía.";
  if (!usuario) return "No hay sesión abierta.";
  for (const k of Object.keys(timers)) clearTimeout(timers[k]);
  avisar?.("guardando");
  for (const p of piezas) {
    const err = await escribir(usuario, p.modulo, p.estado, p.resumen);
    if (err) return err;   /* si una falla, las demás van a fallar igual */
  }
  return null;
}

/* La escritura, una sola. Devuelve el problema en español o null si quedó. */
async function escribir(usuario, modulo, estado, resumen) {
  try {
    const { error } = await sb.from("avances").upsert({
      usuario, modulo, estado, resumen, actualizado: new Date().toISOString(),
    }, { onConflict: "usuario,modulo" });
    if (error) throw new Error(error.message);
    avisar?.("guardado");
    return null;
  } catch (e) {
    /* no se interrumpe el trabajo: el alumno sigue capturando y el siguiente
       cambio reintenta. Lo que no se hace es fingir que se guardó. */
    const msg = e?.message || "";
    avisar?.("error", msg);
    return explicar(msg);
  }
}

/* Los errores de Postgres son crípticos y los dos que de verdad salen aquí
   tienen una causa concreta que conviene decir con todas sus letras. */
function explicar(msg) {
  if (/schema cache|PGRST205|does not exist/i.test(msg))
    return "Las tablas todavía no existen en Supabase. Hay que correr supabase/esquema.sql en el SQL Editor.";
  if (/row-level security|violates row-level/i.test(msg))
    return "La base rechazó el guardado por las políticas de acceso. Revisa que supabase/esquema.sql se haya corrido completo.";
  if (/JWT|token|expired/i.test(msg))
    return "La sesión caducó. Vuelve a entrar y reintenta.";
  return "No se pudo guardar: " + (msg || "error desconocido");
}

/* ---------- tablero del administrador ----------
   Todos los avances con su resumen. El modelo completo no se baja aquí: para
   listar al grupo bastan las cifras. */
export async function traerAvances() {
  if (!configurado) return [];
  const { data, error } = await sb.from("avances").select("usuario, modulo, resumen, actualizado");
  if (error) throw new Error("No se pudieron leer los avances: " + error.message);
  return data || [];
}
