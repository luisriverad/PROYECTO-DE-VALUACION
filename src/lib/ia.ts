/* Puente con la IA. Cada quien carga su propia llave desde la interfaz: se
   guarda sólo en el navegador de esa persona, nunca en el servidor, y las
   llamadas salen directo del equipo de quien la usa.

   Acepta llaves de varios proveedores porque no todos tienen cuenta de
   Anthropic. Pero no dan lo mismo: sólo Anthropic trae búsqueda en web
   integrada, y estos supuestos son datos de mercado con fecha. Sin búsqueda,
   el modelo contesta de memoria y la memoria tiene fecha de caducidad.
   Por eso la interfaz lo dice y por eso Anthropic es el que se recomienda. */

const env: any = (import.meta as any).env || {};
const PROXY = env.VITE_API_URL || "/anthropic/v1/messages";
const LS = "p120-ia-config";
const LS_VIEJO = "p120-anthropic-key";

/* ---------- catálogo de proveedores ---------- */
export const PROVEEDORES: any = {
  anthropic: {
    nombre: "Anthropic (Claude)",
    recomendado: true,
    busca: true,
    prefijo: "sk-ant-",
    modelo: "claude-opus-5",
    consola: "https://console.anthropic.com/settings/keys",
    ayudaLlave: "Empieza con sk-ant-",
    url: () => "https://api.anthropic.com/v1/messages",
    headers: (k) => ({
      "Content-Type": "application/json",
      "x-api-key": k,
      "anthropic-version": "2023-06-01",
      /* sin esta cabecera el navegador no deja llamar directo */
      "anthropic-dangerous-direct-browser-access": "true",
    }),
    body: (prompt, modelo, maxTokens, buscar) => {
      const b: any = {
        model: modelo,
        max_tokens: maxTokens,
        output_config: { effort: "medium" },
        messages: [{ role: "user", content: prompt }],
      };
      if (buscar) b.tools = [{ type: "web_search_20260209", name: "web_search" }];
      return b;
    },
    /* la respuesta trae bloques de razonamiento y de búsqueda además del texto */
    texto: (d) => (d?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n"),
  },

  openai: {
    nombre: "OpenAI (GPT)",
    busca: false,
    prefijo: "sk-",
    modelo: "gpt-4o",
    consola: "https://platform.openai.com/api-keys",
    ayudaLlave: "Empieza con sk-",
    url: () => "https://api.openai.com/v1/chat/completions",
    headers: (k) => ({ "Content-Type": "application/json", Authorization: "Bearer " + k }),
    body: (prompt, modelo, maxTokens) => ({
      model: modelo,
      max_completion_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
    texto: (d) => d?.choices?.[0]?.message?.content || "",
  },

  google: {
    nombre: "Google (Gemini)",
    busca: false,
    prefijo: "AIza",
    modelo: "gemini-2.0-flash",
    consola: "https://aistudio.google.com/apikey",
    ayudaLlave: "Empieza con AIza",
    url: (modelo) => `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
    headers: (k) => ({ "Content-Type": "application/json", "x-goog-api-key": k }),
    body: (prompt, modelo, maxTokens) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    texto: (d) => (d?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join(""),
  },

  compatible: {
    nombre: "Otro (compatible con OpenAI)",
    busca: false,
    prefijo: null,
    modelo: "",
    pideUrl: true,
    consola: null,
    ayudaLlave: "OpenRouter, Groq, DeepSeek, Together, Azure, un modelo local…",
    url: (modelo, url) => url,
    headers: (k) => ({ "Content-Type": "application/json", Authorization: "Bearer " + k }),
    body: (prompt, modelo, maxTokens) => ({
      model: modelo,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
    texto: (d) => d?.choices?.[0]?.message?.content || "",
  },
};

export const LISTA = ["anthropic", "openai", "google", "compatible"];

/* Adivina el proveedor por el prefijo de la llave, para no hacer preguntar */
export function detectaProveedor(llave) {
  const k = (llave || "").trim();
  if (!k) return null;
  if (k.startsWith("sk-ant-")) return "anthropic";
  if (k.startsWith("AIza")) return "google";
  if (k.startsWith("sk-")) return "openai";
  return null;
}

/* ---------- configuración guardada en el navegador ---------- */
const VACIA = { prov: "anthropic", llave: "", modelo: "", url: "" };

export function cargarConfig() {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) return Object.assign({}, VACIA, JSON.parse(raw));
    /* migración: quien ya tenía cargada una llave de Anthropic no la vuelve a pegar */
    const vieja = localStorage.getItem(LS_VIEJO);
    if (vieja) return Object.assign({}, VACIA, { llave: vieja });
  } catch (e) { /* si el navegador no deja leer, se trabaja sin llave */ }
  return Object.assign({}, VACIA);
}

export function guardarConfig(c) {
  try {
    const v = Object.assign({}, VACIA, c);
    v.llave = (v.llave || "").trim();
    if (!v.llave) { localStorage.removeItem(LS); localStorage.removeItem(LS_VIEJO); return; }
    localStorage.setItem(LS, JSON.stringify(v));
    localStorage.removeItem(LS_VIEJO);
  } catch (e) { /* sin persistencia; la sesión sigue funcionando */ }
}

export function borrarConfig() { guardarConfig(Object.assign({}, VACIA)); }
export function llaveGuardada() { return cargarConfig().llave; }
export function hayLlave() { return !!(llaveGuardada() || env.VITE_ANTHROPIC_API_KEY); }
/* ¿el proveedor cargado puede consultar datos de mercado en vivo? */
export function buscaEnWeb() {
  const c = cargarConfig();
  return !c.llave || PROVEEDORES[c.prov]?.busca;
}
export function nombreProveedor() {
  const c = cargarConfig();
  return c.llave ? (PROVEEDORES[c.prov]?.nombre || c.prov) : "Anthropic (Claude)";
}

/* Cuando el proveedor no puede buscar, se le dice al modelo que conteste con lo
   que sabe y que lo confiese, en vez de inventar una cifra con cara de dato. */
const SIN_BUSQUEDA = `

IMPORTANTE: no tienes acceso a búsqueda en internet en esta llamada. Responde con lo que sepas, pero en el campo "nota" advierte explícitamente que las cifras vienen de tu conocimiento previo y no de una consulta en vivo, y di de qué fecha es ese conocimiento. Prefiere rangos prudentes sobre cifras exactas falsas.`;

/* ---------- llamada ---------- */
export async function iaFetch({ prompt, maxTokens = 8000, buscar = false }: any) {
  const c = cargarConfig();
  const manual = !!c.llave;
  const llave = c.llave || env.VITE_ANTHROPIC_API_KEY;
  const P = PROVEEDORES[c.prov] || PROVEEDORES.anthropic;
  const nombre = manual ? P.nombre : "Anthropic (Claude)";

  /* sin llave propia se cae al proxy de desarrollo, que sólo habla con Anthropic */
  const A = PROVEEDORES.anthropic;
  const usa = manual ? P : A;
  const modelo = (manual ? (c.modelo || "").trim() : "") || usa.modelo;
  const puedeBuscar = buscar && !!usa.busca;

  if (manual && usa.pideUrl && !(c.url || "").trim())
    throw new Error("Falta la dirección del servicio. Ábrela con «Cargar API key» y pega la URL completa del endpoint.");
  if (manual && !modelo)
    throw new Error("Falta el nombre del modelo. Ábrelo con «Cargar API key» y escribe cuál quieres usar.");

  const texto = prompt + (buscar && !puedeBuscar ? SIN_BUSQUEDA : "");
  const url = manual ? usa.url(modelo, (c.url || "").trim()) : PROXY;
  const headers = manual
    ? usa.headers(llave)
    : Object.assign({ "Content-Type": "application/json" },
        llave ? A.headers(llave) : {});
  const body = (manual ? usa : A).body(texto, modelo, maxTokens, puedeBuscar);

  let r;
  try {
    r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (e) {
    throw new Error(manual
      ? `No se pudo conectar con ${nombre}. Revisa tu conexión, y si es un servicio propio, que permita llamadas desde el navegador.`
      : "No hay forma de llamar a la IA desde aquí. Carga tu API key con el botón «Cargar API key».");
  }

  if (r.status === 401 || r.status === 403)
    throw new Error(`${nombre} rechazó la llave. Revisa que sea válida, que corresponda al proveedor que elegiste y que tenga saldo.`);
  if (r.status === 404) {
    if (!manual) throw new Error("No hay llave cargada. Usa el botón «Cargar API key» y pega la tuya.");
    throw new Error(`${nombre} no reconoce el modelo «${modelo}». Cámbialo en «Cargar API key».`);
  }
  if (r.status === 429)
    throw new Error(`Tu cuenta de ${nombre} está limitada por ahora (429). Intenta de nuevo en un momento.`);
  if (!r.ok) {
    let det = "";
    try { const j = await r.json(); det = j?.error?.message || j?.message || ""; } catch (e) { /* sin detalle */ }
    throw new Error(`${nombre} respondió ${r.status}${det ? ": " + det : "."}`);
  }

  const data = await r.json();
  return { texto: (manual ? usa : A).texto(data) || "", proveedor: nombre, busco: puedeBuscar, data };
}
