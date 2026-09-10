/* Puente con la IA. Cada quien carga su propia llave desde el encabezado.

   La llave es de la cuenta, no del navegador: se guarda bajo el id de la
   cuenta que entró, sólo esa cuenta la puede usar y se borra al salir. Si
   alguien más entra con su cuenta en la misma computadora, no ve ni usa la
   llave de nadie: tiene que cargar la suya. Por lo mismo no hay llave de
   respaldo compartida —ni compilada en el bundle ni inyectada por un proxy—:
   una llave común la pagaría una persona y la usarían todas.

   Las llamadas salen directo del equipo de quien la usa al proveedor; la
   llave nunca pasa por el servidor de la plataforma.

   Acepta llaves de varios proveedores porque no todos tienen cuenta de
   Anthropic. Pero no dan lo mismo: sólo Anthropic trae búsqueda en web
   integrada, y estos supuestos son datos de mercado con fecha. Sin búsqueda,
   el modelo contesta de memoria y la memoria tiene fecha de caducidad.
   Por eso la interfaz lo dice y por eso Anthropic es el que se recomienda. */

const LS = "p120-ia-config";
/* De cuando la llave era del navegador y no de la cuenta: no se sabe de quién
   es, así que se borra en vez de heredársela a quien entre. */
const LEGADAS = ["p120-ia-config", "p120-anthropic-key"];

/* Qué acepta cada generación de Claude. Elegir un modelo de la lista de la
   cuenta no sirve de nada si luego la llamada lleva opciones que ese modelo
   rechaza. El esfuerzo lo informa la propia lista de modelos; cuando no se
   sabe (nombre escrito a mano), se decide por el nombre. La búsqueda con
   filtrado dinámico sólo existe de Opus 4.6 / Sonnet 4.6 en adelante: a los
   anteriores se les pide la búsqueda básica. */
const CON_ESFUERZO = /claude-(opus-(5|4-[5-9])|sonnet-(5|4-6)|fable|mythos)/;
const BUSQUEDA_NUEVA = /claude-(opus-(5|4-[6-9])|sonnet-(5|4-6))/;

/* ---------- catálogo de proveedores ----------
   `modelos` dice dónde pedir la lista de modelos de la cuenta y cómo leerla:
   cada renglón queda como { id, nombre, esfuerzo, maxSalida }. */
export const PROVEEDORES = {
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
    body: (prompt, modelo, maxTokens, buscar, c) => {
      const b = {
        model: modelo,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      };
      const esfuerzo = c?.esfuerzo != null ? !!c.esfuerzo : CON_ESFUERZO.test(modelo);
      if (esfuerzo) b.output_config = { effort: "medium" };
      if (buscar) b.tools = [{ type: BUSQUEDA_NUEVA.test(modelo) ? "web_search_20260209" : "web_search_20250305", name: "web_search" }];
      return b;
    },
    /* la respuesta trae bloques de razonamiento y de búsqueda además del texto */
    texto: (d) => (d?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n"),
    modelos: {
      url: () => "https://api.anthropic.com/v1/models?limit=100",
      leer: (d) => (d?.data || []).filter((m) => m?.id).map((m) => ({
        id: m.id,
        nombre: m.display_name || m.id,
        esfuerzo: m?.capabilities?.effort?.medium?.supported ?? null,
        maxSalida: typeof m?.max_tokens === "number" ? m.max_tokens : null,
      })),
    },
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
    /* la lista de OpenAI trae de todo: se dejan sólo los modelos que conversan */
    modelos: {
      url: () => "https://api.openai.com/v1/models",
      leer: (d) => (d?.data || [])
        .filter((m) => /^(gpt-|o\d|chatgpt)/.test(m?.id || "")
          && !/(audio|realtime|transcribe|tts|image|embed|whisper|dall-e|moderation|search|instruct|codex)/.test(m.id))
        .sort((a, b) => (b.created || 0) - (a.created || 0))
        .map((m) => ({ id: m.id, nombre: m.id, esfuerzo: null, maxSalida: null })),
    },
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
    modelos: {
      url: () => "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
      leer: (d) => (d?.models || [])
        .filter((m) => (m?.supportedGenerationMethods || []).includes("generateContent")
          && /gemini/.test(m.name || "") && !/(embedding|aqa|tts|image|live)/.test(m.name))
        .map((m) => ({
          id: String(m.name).replace(/^models\//, ""),
          nombre: m.displayName || String(m.name).replace(/^models\//, ""),
          esfuerzo: null,
          maxSalida: typeof m.outputTokenLimit === "number" ? m.outputTokenLimit : null,
        }))
        .sort((a, b) => b.id.localeCompare(a.id)),
    },
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
    /* la lista vive junto al endpoint de chat: …/v1/chat/completions → …/v1/models */
    modelos: {
      url: (u) => (u ? u.replace(/\/chat\/completions\/?$/, "").replace(/\/+$/, "") + "/models" : ""),
      leer: (d) => (d?.data || d?.models || [])
        .map((m) => ({ id: m?.id || m?.name, nombre: m?.name || m?.id, esfuerzo: null, maxSalida: null }))
        .filter((m) => m.id),
    },
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

/* ---------- a qué cuenta pertenece la llave ----------
   La sesión liga la cuenta al entrar y la desliga al salir. Sin cuenta ligada
   no se lee, no se guarda y no se usa ninguna llave. */
let cuenta = null;
const ranura = () => (cuenta ? `${LS}:${cuenta}` : null);

export function ligarCuenta(id) {
  cuenta = id ? String(id) : null;
  try { for (const k of LEGADAS) localStorage.removeItem(k); } catch (e) { /* sin acceso al almacenamiento */ }
}

/* Al salir: la llave se va con la cuenta. En una computadora compartida no
   queda nada para el que sigue. */
export function olvidarLlave() {
  const k = ranura();
  try { if (k) localStorage.removeItem(k); } catch (e) { /* sin acceso al almacenamiento */ }
}

export function hayCuenta() { return !!cuenta; }

/* ---------- configuración de la cuenta ----------
   `esfuerzo` y `maxSalida` vienen de la lista de modelos del proveedor: qué
   acepta el modelo elegido. null = no se sabe, se decide por el nombre. */
const VACIA = { prov: "anthropic", llave: "", modelo: "", url: "", esfuerzo: null, maxSalida: null };

export function cargarConfig() {
  const k = ranura();
  if (!k) return Object.assign({}, VACIA);
  try {
    const raw = localStorage.getItem(k);
    if (raw) return Object.assign({}, VACIA, JSON.parse(raw));
  } catch (e) { /* si el navegador no deja leer, se trabaja sin llave */ }
  return Object.assign({}, VACIA);
}

/* Devuelve si quedó guardada: sin cuenta o con el almacenamiento bloqueado
   (modo privado estricto) no se puede, y la interfaz lo tiene que decir. */
export function guardarConfig(c) {
  const k = ranura();
  if (!k) return false;
  try {
    const v = Object.assign({}, VACIA, c);
    v.llave = (v.llave || "").trim();
    if (!v.llave) { localStorage.removeItem(k); return true; }
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) { return false; }
}

export function borrarConfig() { olvidarLlave(); }
export function hayLlave() { return !!cargarConfig().llave; }

/* Para mostrar que hay llave sin mostrar la llave: el prefijo y los últimos
   cuatro caracteres, que bastan para reconocerla y no sirven para usarla. */
export function mascara(llave) {
  const k = (llave || "").trim();
  if (!k) return "";
  if (k.length < 16) return "••••" + k.slice(-2);
  return k.slice(0, 7) + "…" + k.slice(-4);
}

/* ¿el proveedor cargado puede consultar datos de mercado en vivo? */
export function buscaEnWeb() {
  const c = cargarConfig();
  return !c.llave || !!PROVEEDORES[c.prov]?.busca;
}
export function nombreProveedor() {
  const c = cargarConfig();
  return c.llave ? (PROVEEDORES[c.prov]?.nombre || c.prov) : "Anthropic (Claude)";
}

/* ---------- modelos de la cuenta ----------
   Se le pregunta al proveedor qué modelos tiene la cuenta dueña de la llave:
   así se elige de una lista real en vez de adivinar un nombre, y de paso se
   comprueba que la llave sirve. Sin llave nueva se usa la guardada de esta
   cuenta —sólo si es del mismo proveedor—, que nunca sale de este archivo. */
export async function listarModelos({ prov, llave, url }) {
  if (!cuenta) throw new Error("Entra con tu cuenta primero.");
  const P = PROVEEDORES[prov] || PROVEEDORES.anthropic;
  const guardada = cargarConfig();
  const k = (llave || "").trim() || (guardada.prov === prov ? (guardada.llave || "").trim() : "");
  if (!k) throw new Error("Pega tu llave para ver los modelos de tu cuenta.");
  const dir = P.modelos.url((url || "").trim());
  if (!dir) throw new Error("Escribe primero la dirección del servicio.");

  let r;
  try {
    r = await fetch(dir, { headers: P.headers(k) });
  } catch (e) {
    throw new Error(P.pideUrl
      ? "Ese servicio no respondió con su lista de modelos. Revisa la dirección, o escribe el nombre del modelo a mano."
      : `No se pudo consultar a ${P.nombre}. Revisa tu conexión a internet.`);
  }
  if (r.status === 401 || r.status === 403)
    throw new Error(`${P.nombre} no reconoce esta llave. Revisa que esté completa y que sea de ${P.nombre}.`);
  if (!r.ok)
    throw new Error(`${P.nombre} respondió ${r.status} al pedir la lista de modelos. Puedes escribir el nombre a mano.`);

  const lista = P.modelos.leer(await r.json());
  if (!lista.length) throw new Error("Tu cuenta no tiene modelos de texto disponibles. Puedes escribir el nombre a mano.");
  return lista;
}

/* Cuando el proveedor no puede buscar, se le dice al modelo que conteste con lo
   que sabe y que lo confiese, en vez de inventar una cifra con cara de dato. */
const SIN_BUSQUEDA = `

IMPORTANTE: no tienes acceso a búsqueda en internet en esta llamada. Responde con lo que sepas, pero en el campo "nota" advierte explícitamente que las cifras vienen de tu conocimiento previo y no de una consulta en vivo, y di de qué fecha es ese conocimiento. Prefiere rangos prudentes sobre cifras exactas falsas.`;

/* ---------- llamada ----------
   Siempre con la llave de la cuenta que entró. Si no la ha cargado, no hay
   llamada: no existe una llave de reserva de la cual colgarse. */
export async function iaFetch({ prompt, maxTokens = 8000, buscar = false }) {
  if (!cuenta) throw new Error("Entra con tu cuenta para usar la IA.");
  const c = cargarConfig();
  const llave = (c.llave || "").trim();
  if (!llave) throw new Error("No has cargado tu API key. Usa el botón «CARGA DE API KEY» del encabezado y pega la tuya.");

  const P = PROVEEDORES[c.prov] || PROVEEDORES.anthropic;
  const nombre = P.nombre;
  const modelo = (c.modelo || "").trim() || P.modelo;
  const puedeBuscar = buscar && !!P.busca;
  /* un modelo chico no acepta pedirle más texto del que puede escribir */
  const tope = typeof c.maxSalida === "number" && c.maxSalida > 0 ? Math.min(maxTokens, c.maxSalida) : maxTokens;

  if (P.pideUrl && !(c.url || "").trim())
    throw new Error("Falta la dirección del servicio. Ábrela en «CARGA DE API KEY» y pega la URL completa del endpoint.");
  if (!modelo)
    throw new Error("Falta el nombre del modelo. Escríbelo en «CARGA DE API KEY».");

  const texto = prompt + (buscar && !puedeBuscar ? SIN_BUSQUEDA : "");
  const url = P.url(modelo, (c.url || "").trim());
  const headers = P.headers(llave);
  const body = P.body(texto, modelo, tope, puedeBuscar, c);

  let r;
  try {
    r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (e) {
    throw new Error(`No se pudo conectar con ${nombre}. Revisa tu conexión, y si es un servicio propio, que permita llamadas desde el navegador.`);
  }

  if (r.status === 401 || r.status === 403)
    throw new Error(`${nombre} rechazó la llave. Revisa que sea válida, que corresponda al proveedor que elegiste y que tenga saldo.`);
  if (r.status === 404)
    throw new Error(`${nombre} no reconoce el modelo «${modelo}». Cámbialo en «CARGA DE API KEY».`);
  if (r.status === 429)
    throw new Error(`Tu cuenta de ${nombre} está limitada por ahora (429). Intenta de nuevo en un momento.`);
  if (!r.ok) {
    let det = "";
    try { const j = await r.json(); det = j?.error?.message || j?.message || ""; } catch (e) { /* sin detalle */ }
    throw new Error(`${nombre} respondió ${r.status}${det ? ": " + det : "."}`);
  }

  let data = await r.json();

  /* La búsqueda en web corre del lado de Anthropic y, si se alarga, la respuesta
     llega en pausa (`pause_turn`) a medio trabajo. Se le devuelve lo que ya
     hizo para que siga donde se quedó, en vez de quedarse con media respuesta. */
  if (puedeBuscar && P === PROVEEDORES.anthropic) {
    let bloques = data?.content || [];
    for (let i = 0; i < 4 && data?.stop_reason === "pause_turn"; i++) {
      const sigue = { ...body, messages: [body.messages[0], { role: "assistant", content: bloques }] };
      let r2;
      try { r2 = await fetch(url, { method: "POST", headers, body: JSON.stringify(sigue) }); }
      catch (e) { break; }
      if (!r2.ok) break;
      data = await r2.json();
      bloques = bloques.concat(data?.content || []);
    }
    data = { ...data, content: bloques };
  }

  return { texto: P.texto(data) || "", proveedor: nombre, busco: puedeBuscar, data };
}
