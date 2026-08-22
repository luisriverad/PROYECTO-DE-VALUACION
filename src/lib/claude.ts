/* Puente con la API de Claude.
   Cada quien carga su propia llave desde la interfaz (botón "Cargar API key"):
   se guarda sólo en el navegador de esa persona, nunca en el servidor, y las
   llamadas salen directo a api.anthropic.com desde su equipo.
   Si no hay llave cargada se usa el proxy de Vite en desarrollo (vite.config.ts)
   o el backend que apunte VITE_API_URL. */

const env: any = (import.meta as any).env || {};
const API_URL = env.VITE_API_URL || "/anthropic/v1/messages";
const DIRECTO = "https://api.anthropic.com/v1/messages";
const LLAVE_LS = "p120-anthropic-key";

export function llaveGuardada() {
  try { return localStorage.getItem(LLAVE_LS) || ""; } catch (e) { return ""; }
}
export function guardarLlave(k) {
  try {
    const v = (k || "").trim();
    if (v) localStorage.setItem(LLAVE_LS, v); else localStorage.removeItem(LLAVE_LS);
  } catch (e) { /* si el navegador no deja escribir, se queda en memoria de la sesión */ }
}
export function borrarLlave() { guardarLlave(""); }
export function hayLlave() { return !!(llaveGuardada() || env.VITE_ANTHROPIC_API_KEY); }

export async function claudeFetch(body) {
  const manual = llaveGuardada();
  const llave = manual || env.VITE_ANTHROPIC_API_KEY;
  const headers = { "Content-Type": "application/json" };
  let url = API_URL;
  if (llave) {
    /* con llave propia se llama directo a Anthropic: así funciona en cualquier
       despliegue, sin backend de por medio */
    if (manual) url = DIRECTO;
    headers["x-api-key"] = llave;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  let r;
  try {
    r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (e) {
    throw new Error(manual
      ? "No se pudo conectar con Anthropic. Revisa tu conexión."
      : "No hay forma de llamar a la IA desde aquí. Carga tu API key con el botón «Cargar API key».");
  }
  if (r.status === 401 || r.status === 403) throw new Error("La API rechazó la llave. Revisa que sea una llave válida de Anthropic y que tenga saldo.");
  if (r.status === 404 && !manual) throw new Error("No hay llave cargada. Usa el botón «Cargar API key» y pega la tuya.");
  if (r.status === 429) throw new Error("Tu cuenta de Anthropic está limitada por ahora (429). Intenta de nuevo en un momento.");
  if (!r.ok) throw new Error("La API respondió " + r.status + ".");
  return r.json();
}

export function textoDe(data) {
  return (data?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}
