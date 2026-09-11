/* ============================================================
   INVESTIGACIÓN Y CONTRASTE
   El modelo financiero es un conjunto de supuestos; la investigación es lo que
   está pasando allá afuera. Este módulo junta la segunda —mercado, competencia,
   precios, costos, economía, financiamiento, regulación y riesgos— y la pone
   frente a la primera para encontrar dónde no cuadran.

   Dos capas de contraste:
   1. Numérico, sin IA: cada cifra clave de la investigación contra el supuesto
      que le corresponde en el modelo. Es instantáneo, se recalcula al mover
      cualquier número y no depende de que la IA esté de buen humor.
   2. Profundo, con IA: lee el modelo completo y la investigación completa y
      busca también las fricciones que no son un número contra otro.

   A la IA que investiga no se le pasan los supuestos del modelo, sólo qué es
   el negocio: si viera los números del alumno, tendería a confirmarlos.
   ============================================================ */
import { iaFetch } from "./ia";
import { money, pct, num, montosEnTexto } from "./format";
import { textoPerfil, perfilListo } from "./perfil";

/* ---------- frentes de investigación ----------
   `cifras` son los datos duros que alimentan el contraste numérico: la IA los
   llena y el alumno los puede corregir a mano. */
export const TEMAS: any[] = [
  {
    k: "mercado", titulo: "Mercado y demanda", corto: "Mercado",
    pregunta: "Qué tan grande es el mercado, qué tan rápido crece, quién compra, cuándo y por qué.",
    guia: "Define el tamaño del mercado local en pesos al año para este giro en la zona que puede atender el negocio (y a nivel nacional si no hay dato local), el perfil del consumidor objetivo en esa región, sus hábitos de consumo actuales (frecuencia, estacionalidad y canales por donde compra) y las tendencias de crecimiento impulsadas por el contexto demográfico y digital, con el crecimiento anual reciente y el esperado.",
    cifras: [
      { k: "tamanoMercado", etiqueta: "Tamaño del mercado", tipo: "money", ayuda: "pesos al año, en la zona que puede atender el negocio" },
      { k: "crecMercado", etiqueta: "Crecimiento anual del mercado", tipo: "pct", ayuda: "decimal: 0.06 = 6%" },
    ],
  },
  {
    k: "competencia", titulo: "Competencia", corto: "Competencia",
    pregunta: "Quién ya vende esto, qué tan fuerte es y en qué se diferencia.",
    guia: "Identifica a los principales competidores directos e indirectos en la ciudad y el estado, con nombre, apoyándote en el DENUE del INEGI (cuántos establecimientos del giro hay en la zona) y en sus sitios y redes: locales, nacionales, digitales y sustitutos. Analiza sus fortalezas, debilidades, participación estimada, precios si son públicos y la propuesta de valor que comunican en medios y redes. Cierra con las barreras de entrada del giro. En 'hallazgos', un renglón por competidor relevante.",
    cifras: [
      { k: "numCompetidores", etiqueta: "Competidores relevantes", tipo: "num", ayuda: "cuántos compiten de verdad por el mismo cliente" },
    ],
  },
  {
    k: "precios", titulo: "Precios de mercado", corto: "Precios",
    pregunta: "Cuánto se cobra hoy allá afuera por lo mismo o por algo equivalente.",
    guia: "Analiza la estructura de precios del mercado local para productos o servicios equivalentes a los de este negocio: precios de venta al público actuales en tiendas, sitios de los competidores, marketplaces (Mercado Libre, Amazon) y tabuladores del gremio. Da el rango típico por unidad de venta, qué explica la diferencia entre el barato y el caro, las estrategias de precio de la competencia (descuentos, paquetes, precio de entrada), la elasticidad o disposición a pagar del cliente en esa zona económica y si los precios del giro vienen subiendo o bajando.",
    cifras: [
      { k: "precioMin", etiqueta: "Precio típico mínimo", tipo: "money", ayuda: "por unidad de venta, sin IVA" },
      { k: "precioMax", etiqueta: "Precio típico máximo", tipo: "money", ayuda: "por unidad de venta, sin IVA" },
    ],
  },
  {
    k: "costos", titulo: "Costos e insumos", corto: "Costos",
    pregunta: "Cuánto cuesta de verdad producir y operar: insumos, sueldos y renta.",
    guia: "Determina los costos operativos promedio de la industria en esa región específica: renta comercial o industrial por metro cuadrado en la zona, sueldos de mercado del personal operativo según la zona (bolsas de trabajo, tabuladores, salario base de cotización del IMSS) y el salario mínimo vigente de CONASAMI, precios actuales de los principales insumos o materias primas del giro y su tendencia, costo de energía y servicios, y logística local.",
    cifras: [
      { k: "salarioOperativo", etiqueta: "Sueldo mensual de mercado del personal operativo", tipo: "money", ayuda: "bruto, por persona" },
      { k: "inflacionInsumos", etiqueta: "Alza anual en precios de insumos", tipo: "pct", ayuda: "decimal: 0.07 = 7%" },
    ],
  },
  {
    k: "economia", titulo: "Entorno económico", corto: "Economía",
    pregunta: "El clima de la economía donde va a vivir el proyecto.",
    guia: "Evalúa el entorno macro y microeconómico local: PIB estatal y nacional (y del sector, si hay), inflación anual más reciente y la esperada para los próximos años (encuesta de expectativas de Banxico), tasa de interés objetivo de Banxico, rendimiento del Bono M a 10 años, tipo de cambio, nivel de empleo y desempleo, y poder adquisitivo de la población en la ciudad seleccionada. Señala cualquier aceleración o desaceleración del consumo en este giro.",
    cifras: [
      { k: "inflacion", etiqueta: "Inflación anual esperada", tipo: "pct", ayuda: "decimal" },
      { k: "tasaReferencia", etiqueta: "Tasa objetivo de Banxico", tipo: "pct", ayuda: "decimal" },
      { k: "bono10", etiqueta: "Bono M a 10 años", tipo: "pct", ayuda: "decimal" },
      { k: "crecPIB", etiqueta: "Crecimiento real del PIB", tipo: "pct", ayuda: "decimal, largo plazo" },
      { k: "tipoCambio", etiqueta: "Tipo de cambio (pesos por dólar)", tipo: "num", ayuda: "" },
    ],
  },
  {
    k: "financiamiento", titulo: "Financiamiento y valuación", corto: "Financiamiento",
    pregunta: "A qué costo se consigue dinero y cuánto vale un negocio así cuando se vende.",
    guia: "Mapea las opciones de financiamiento disponibles para una empresa de este tamaño y etapa en México: crédito PyME de la banca comercial, programas de Nafin y Bancomext, fintech, fondos estatales y capital privado activo en la región, con sus tasas de interés anuales actuales, plazos y garantías típicas. Agrega los múltiplos de valuación del sector (EV/EBITDA o EV/EBIT) en transacciones privadas o empresas comparables, de preferencia de Damodaran para mercados emergentes.",
    cifras: [
      { k: "tasaCreditoPyme", etiqueta: "Tasa de crédito PyME", tipo: "pct", ayuda: "anual, decimal" },
      { k: "multiploSector", etiqueta: "Múltiplo de valuación del sector", tipo: "num", ayuda: "veces EBIT o EBITDA" },
    ],
  },
  {
    k: "regulacion", titulo: "Regulación y fiscal", corto: "Regulación",
    pregunta: "Qué exige la ley para operar y cuánto se lleva el fisco.",
    guia: "Detalla el marco legal, normativo y fiscal aplicable: tasa de ISR y PTU, régimen fiscal conveniente para este tamaño y obligaciones ante el SAT, impuestos estatales (como el impuesto sobre nómina), normas (NOM) que exige el giro, y las licencias y permisos municipales requeridos para operarlo en la ciudad seleccionada, con su costo y el tiempo de obtenerlos. Incluye los cambios regulatorios recientes o en puerta (laborales, ambientales, de etiquetado, reforma de 40 horas, etc.) y su efecto en costos.",
    cifras: [
      { k: "isr", etiqueta: "Tasa de ISR aplicable", tipo: "pct", ayuda: "decimal" },
      { k: "ptu", etiqueta: "PTU", tipo: "pct", ayuda: "decimal" },
    ],
  },
  {
    k: "riesgos", titulo: "Riesgos", corto: "Riesgos",
    pregunta: "Lo que puede salir mal, qué tan probable es y cuánto dolería.",
    guia: "Identifica y evalúa los principales riesgos del entorno propios de este giro y esta zona: de mercado y saturación, volatilidad de insumos y proveedores, tipo de cambio, regulatorios locales, seguridad física y digital, climáticos, tecnológicos y barreras de entrada, con casos reales cuando los haya. En 'hallazgos', un renglón por riesgo: en 'dato' el riesgo, en 'valor' su probabilidad e impacto (alta/media/baja) y cómo se mitiga.",
    cifras: [],
  },
];

export const seedInvestigacion = () => ({ contexto: "", temas: {}, contraste: null });
export const temaVacio = () => ({ resumen: "", hallazgos: [], cifras: {}, implicaciones: "", notas: "", fuentes: [], fecha: "" });

/* Garantiza la estructura dentro de un borrador de `up`: los proyectos
   guardados antes de este módulo no la traen. */
export function asegurar(n: any) {
  if (!n.investigacion || typeof n.investigacion !== "object") n.investigacion = seedInvestigacion();
  if (!n.investigacion.temas) n.investigacion.temas = {};
  return n.investigacion;
}

export function tieneDatos(t: any) {
  if (!t) return false;
  const cifras = Object.values(t.cifras || {}).some((v) => typeof v === "number" && isFinite(v as number));
  return !!(t.resumen || (t.hallazgos || []).length || (t.notas || "").trim() || cifras);
}

/* ---------- a qué pestaña mandar cada fricción ---------- */
export function pestanas(L: any) {
  return {
    empresa: "Empresa y supuestos", explosion: L?.explosionTab || "Explosionado", insumos: L?.insumos || "Insumos",
    mo: L?.mo || "Mano de obra", prodcostos: L?.cpTab || "Costos", resumen: "Resumen de impacto", productos: "Pricing",
    pyl: "Forecast", plan: "Plan de ventas y precios", gastos: "Gastos", inversion: "Inversiones y activos",
    credito: "Crédito", wacc: "Costo de capital", rentab: "Rentabilidad y valuación", sens: "Escenarios",
    investigacion: "Investigación profunda",
  };
}

/* ---------- respuesta de la IA ---------- */
/* Con búsqueda en web, Anthropic parte el texto en muchos bloques (uno por cita)
   y mete razonamiento antes de buscar. El JSON está en el texto posterior a la
   última búsqueda, y hay que pegarlo tal cual: unir con saltos de línea rompe
   las cadenas del JSON. */
export function leerJSON(res: any) {
  let txt = res?.texto || "";
  const bloques = res?.data?.content;
  if (Array.isArray(bloques)) {
    let ult = -1;
    bloques.forEach((b: any, i: number) => { if (b?.type && b.type !== "text") ult = i; });
    const t = bloques.slice(ult + 1).filter((b: any) => b?.type === "text").map((b: any) => b.text).join("");
    if (t.includes("{")) txt = t;
  }
  const j = txt.replace(/```json|```/g, "").trim();
  const a = j.indexOf("{"), b = j.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("La IA no devolvió datos legibles. Intenta de nuevo.");
  try { return JSON.parse(j.slice(a, b + 1)); }
  catch (e) { throw new Error("La respuesta de la IA llegó incompleta o mal formada. Intenta de nuevo."); }
}

/* Las páginas que la IA de verdad consultó, tomadas de la respuesta de la
   búsqueda y no de lo que el modelo diga: las citadas primero. */
export function fuentesDe(res: any) {
  const out: any[] = [];
  const vistos = new Set();
  const poner = (url: any, titulo: any) => {
    if (!url || vistos.has(url)) return;
    vistos.add(url);
    out.push({ url, titulo: titulo || url });
  };
  const bloques = res?.data?.content || [];
  for (const b of bloques) if (b?.type === "text" && Array.isArray(b.citations)) for (const c of b.citations) poner(c?.url, c?.title);
  for (const b of bloques) if (b?.type === "web_search_tool_result" && Array.isArray(b.content)) for (const r of b.content) poner(r?.url, r?.title);
  return out.slice(0, 15);
}

const numero = (v: any) => {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") { const x = parseFloat(v.replace(/[^0-9.\-]/g, "")); return isFinite(x) ? x : null; }
  return null;
};

/* ---------- qué es el negocio (sin sus supuestos) ---------- */
/* Dónde opera, tal como lo capturó en el diagnóstico: ciudad, estado, país. */
function zonaDe(s: any) {
  const d = s.empresa?.diagnostico || {};
  return [d.ciudad, d.estado, d.pais].map((x: any) => String(x || "").trim()).filter(Boolean).join(", ");
}

/* Qué es el negocio: giro, ubicación y lo que vende según el modelo (nombres,
   no números), más el perfil que el empresario capturó en Empresa y supuestos. */
function queEsElNegocio(s: any, L: any) {
  const prods = (s.productos || []).map((p: any) => p.nombre).filter(Boolean);
  return [
    `Tipo de negocio / sector: giro ${s.empresa?.tipo || "—"} · sector declarado ${s.wacc?.sector || "—"}`,
    `País / Estado / Ciudad: ${zonaDe(s) || "(no indicados: supón México)"}`,
    `Supuestos comerciales: vende ${prods.length ? prods.join(", ") : "(productos no capturados)"}; unidad de venta: ${L?.uni || "unidad"}`,
    "",
    textoPerfil(s),
  ].join("\n");
}

/* la investigación sólo arranca con la descripción completa */
export function hayDescripcion(s: any) {
  return perfilListo(s);
}

/* ---------- investigar un frente ---------- */
export async function investigarTema(k: string, s: any, L: any) {
  const T = TEMAS.find((t) => t.k === k);
  if (!T) throw new Error("Frente de investigación desconocido.");
  const llaves = T.cifras.map((c: any) => `"${c.k}": número o null`).join(", ");
  const explica = T.cifras.map((c: any) => `- ${c.k}: ${c.etiqueta}${c.ayuda ? " (" + c.ayuda + ")" : ""}`).join("\n");
  const zona = zonaDe(s);
  /* lo que el empresario ya averiguó de este frente: entra como información
     previa del proyecto, para que la IA la valide y no la ignore */
  const previo = String(((s.investigacion || {}).temas || {})[k]?.notas || "").trim();

  /* Un frente por consulta: cada uno trae sus cifras para el contraste y se
     puede volver a investigar solo. La salida es JSON porque de ahí comen la
     pantalla y el contraste numérico. */
  const res = await iaFetch({
    maxTokens: 16000,
    buscar: true,
    prompt: `Actúa como experto en Inteligencia de Negocios, Analista Macroeconómico y Consultor de Estrategia Comercial. Estás haciendo una investigación de mercado profunda y exhaustiva de un proyecto de inversión en 8 frentes clave: ${TEMAS.map((t) => t.corto).join(", ")}. En esta consulta desarrollas sólo uno: ${T.titulo.toUpperCase()}. Los demás se investigan por separado; no los repitas. Español de México.

### CONTEXTO DEL PROYECTO
Integra y valida de manera estricta esta información interna de la plataforma. Si lo que encuentres la contradice (el giro, la zona, el cliente, los competidores que menciona), dilo en el resumen.
${queEsElNegocio(s, L)}${previo ? `\n\nLo que el empresario ya averiguó por su cuenta sobre este frente:\n"""\n${previo}\n"""` : ""}

### FUENTES DE INFORMACIÓN OBLIGATORIAS
1. Organismos oficiales de México: INEGI (directorio DENUE, censos económicos), Secretaría de Economía, SHCP y SAT, Banxico, IMSS y CONASAMI.
2. Cámaras y asociaciones del sector: información y reportes de las asociaciones relevantes para este giro.
3. Medios especializados en economía y negocios: El Financiero, El Economista, Bloomberg, Forbes México, Expansión y la prensa local de ${zona || "la zona donde opera"}.
4. Pulso digital: conversaciones, quejas frecuentes y demandas de los usuarios en las redes y plataformas relevantes para el giro.
Prefiere datos de los últimos 24 meses y di la fecha de cada uno.

### FRENTE A DESARROLLAR: ${T.titulo.toUpperCase()}
Desarróllalo de forma cuantitativa y cualitativa para la ubicación seleccionada.
${T.guia}

### REGLAS
- Si el país o la ciudad no se indican, supón México.
- No inventes cifras. Si no encuentras un dato, déjalo en null y dilo en el resumen.
- Montos en pesos mexicanos. En los textos (resumen, hallazgos, implicaciones) escribe los montos con signo $, comas en los miles y dos decimales ($65,000,000,000.00 MXN) y los porcentajes con su signo (4.5%), nunca como decimal.
- Sólo en "cifras" van números sin formato: montos sin signo ni comas, y tasas y porcentajes como decimal (0.045 = 4.5%).

### FORMATO DE SALIDA
Cada hallazgo es una viñeta corta con un dato específico (cifra, porcentaje o hecho concreto) y la fuente o el medio que lo respalda.
Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin backticks y sin texto adicional, con esta forma:
{"resumen":"4 a 6 líneas con lo esencial","hallazgos":[{"dato":"qué es","valor":"el número o el hecho, con unidad","fuente":"nombre de la fuente o el medio","url":"https://...","fecha":"mes y año"}],"cifras":{${llaves}},"implicaciones":"qué significa para este proyecto, en 2 a 4 líneas","confianza":"alta, media o baja"}
Entre 6 y 12 hallazgos.${T.cifras.length ? `\nEn "cifras" usa exactamente estas llaves:\n${explica}` : `\n"cifras" va vacío: {}`}`,
  });

  const j = leerJSON(res);
  const cifras: any = {};
  for (const c of T.cifras) cifras[c.k] = numero(j?.cifras?.[c.k]);
  return {
    resumen: montosEnTexto(j?.resumen),
    hallazgos: (Array.isArray(j?.hallazgos) ? j.hallazgos : []).slice(0, 12).map((h: any) => ({
      id: Math.random().toString(36).slice(2, 9),
      dato: montosEnTexto(h?.dato), valor: montosEnTexto(h?.valor), fuente: String(h?.fuente || ""),
      url: String(h?.url || ""), fecha: String(h?.fecha || ""),
    })),
    cifras,
    implicaciones: montosEnTexto(j?.implicaciones),
    confianza: String(j?.confianza || ""),
    fuentes: fuentesDe(res),
    fecha: new Date().toISOString(),
    proveedor: res.proveedor,
    busco: !!res.busco,
  };
}

/* ============================================================
   CONTRASTE NUMÉRICO
   Cada renglón: el supuesto del modelo, la cifra de afuera, la brecha y qué
   significa. Si falta la cifra de afuera, el supuesto queda como pendiente de
   investigar en vez de darse por bueno.
   ============================================================ */
export const SEV: any = {
  alta: { orden: 0, etiqueta: "Alta", color: "#B3261E", fondo: "#FDECEA" },
  media: { orden: 1, etiqueta: "Media", color: "#C08A19", fondo: "#FBF3E0" },
  baja: { orden: 2, etiqueta: "Baja", color: "#2B5D8A", fondo: "#E8F0F7" },
  ok: { orden: 3, etiqueta: "Alineado", color: "#1F7A4D", fondo: "#E4F2EA" },
};

export function contrasteNumerico(s: any, m: any) {
  const T = (s.investigacion || {}).temas || {};
  const cif = (tema: string, k: string) => { const v = T[tema]?.cifras?.[k]; return typeof v === "number" && isFinite(v) ? v : null; };
  const filas: any[] = [];
  const pendientes: any[] = [];
  const fila = (o: any) => filas.push(o);
  const falta = (supuesto: string, tema: string) => pendientes.push({ supuesto, tema });
  const pp = (v: number) => (v >= 0 ? "+" : "−") + num(Math.abs(v) * 100, 1) + " pp";
  const sp = s.supuestos || {};
  const H = m?.anios?.length || 0;

  /* inflación */
  const infM = cif("economia", "inflacion");
  if (infM == null) falta("Inflación anual", "economia");
  else {
    const b = sp.inflacion - infM;
    fila({
      area: "Economía", supuesto: "Inflación anual", tab: "empresa",
      modelo: pct(sp.inflacion), mercado: pct(infM), brecha: pp(b),
      sev: Math.abs(b) >= 0.02 ? "alta" : Math.abs(b) >= 0.01 ? "media" : "ok",
      lectura: Math.abs(b) < 0.01 ? "En línea con lo esperado." : b < 0
        ? "Supones menos inflación de la que viene: costos, nómina y gastos crecerán más rápido que en tu proyección."
        : "Supones más inflación de la esperada: los costos salen inflados y, si indexas precios, también las ventas.",
    });
  }

  /* tasa libre de riesgo */
  const bono = cif("economia", "bono10");
  if (bono == null) falta("Tasa libre de riesgo", "economia");
  else if (s.wacc) {
    const b = s.wacc.rf - bono;
    fila({
      area: "Economía", supuesto: "Tasa libre de riesgo (Bono M 10 años)", tab: "wacc",
      modelo: pct(s.wacc.rf, 2), mercado: pct(bono, 2), brecha: pp(b),
      sev: Math.abs(b) >= 0.015 ? "alta" : Math.abs(b) >= 0.0075 ? "media" : "ok",
      lectura: Math.abs(b) < 0.0075 ? "En línea con el bono." : b < 0
        ? "Tu tasa base está por debajo del bono: el WACC sale bajo y el valor del proyecto, inflado."
        : "Tu tasa base está por encima del bono: castigas el valor más de lo necesario.",
    });
  }

  /* crecimiento a perpetuidad contra la economía */
  const pib = cif("economia", "crecPIB");
  if (pib == null) falta("Crecimiento a perpetuidad", "economia");
  else {
    const nominal = (1 + pib) * (1 + (infM ?? sp.inflacion)) - 1;
    const b = sp.gPerp - nominal;
    fila({
      area: "Economía", supuesto: "Crecimiento a perpetuidad (g)", tab: "empresa",
      modelo: pct(sp.gPerp), mercado: pct(nominal) + " nominal", brecha: pp(b),
      sev: b > 0 ? "alta" : "ok",
      lectura: b > 0
        ? "El valor terminal supone que la empresa crece para siempre más rápido que toda la economía. Ningún negocio lo sostiene: baja g."
        : "Por debajo del crecimiento nominal de la economía, como debe ser.",
    });
  }

  /* crecimiento del plan contra el mercado */
  const crecM = cif("mercado", "crecMercado");
  const crecs = ((s.plan || {}).crec || []).slice(0, Math.max(H - 1, 1)).filter((x: any) => typeof x === "number");
  const crecP = crecs.length ? crecs.reduce((a: number, b: number) => a + b, 0) / crecs.length : null;
  if (crecM == null) falta("Crecimiento de ventas", "mercado");
  else if (crecP != null) {
    const b = crecP - crecM;
    fila({
      area: "Mercado", supuesto: "Crecimiento anual de las ventas (promedio)", tab: "plan",
      modelo: pct(crecP), mercado: pct(crecM), brecha: pp(b),
      sev: b > 0.15 ? "alta" : b > 0.07 ? "media" : "ok",
      lectura: b <= 0.07 ? "Creces a un ritmo que el mercado puede dar." :
        `Creces ${num(b * 100, 0)} puntos más rápido que el mercado: el plan sólo cuadra quitándole clientes a la competencia, y hay que explicar con qué.`,
    });
  }

  /* cuota de mercado implícita */
  const tam = cif("mercado", "tamanoMercado");
  if (tam == null) falta("Cuota de mercado implícita", "mercado");
  else if (tam > 0 && H) {
    const ventasUlt = m.anios[H - 1].ventas;
    const tamUlt = tam * Math.pow(1 + (crecM ?? 0), H - 1);
    const cuota = ventasUlt / tamUlt;
    fila({
      area: "Mercado", supuesto: `Cuota de mercado en el año ${H}`, tab: "plan",
      modelo: money(ventasUlt) + " de ventas", mercado: money(tamUlt) + " de mercado", brecha: pct(cuota, 2) + " de cuota",
      sev: cuota > 0.1 ? "alta" : cuota > 0.03 ? "media" : "ok",
      lectura: cuota > 0.1 ? "Un negocio que arranca rara vez se queda con más del 10% de su mercado. Revisa el volumen o la definición del mercado."
        : cuota > 0.03 ? "Una cuota ambiciosa para un negocio nuevo: necesita una ventaja clara y presupuesto de venta que la sostenga."
          : "Una cuota modesta y creíble.",
    });
  }

  /* precios por producto */
  const pMin = cif("precios", "precioMin"), pMax = cif("precios", "precioMax");
  if (pMin == null && pMax == null) falta("Precios de venta", "precios");
  else {
    for (const p of s.productos || []) {
      if (!(p.precio > 0)) continue;
      const lo = pMin ?? 0, hi = pMax ?? Infinity;
      let sev = "ok", lectura = "Dentro del rango que se cobra allá afuera.", brecha = "—";
      if (p.precio > hi) {
        const r = p.precio / hi - 1;
        sev = r > 0.3 ? "alta" : r > 0.1 ? "media" : "baja";
        brecha = "+" + pct(r, 0) + " sobre el máximo";
        lectura = "Más caro que lo que cobra el mercado: la diferenciación tiene que ser evidente o el volumen no llega.";
      } else if (p.precio < lo) {
        const r = 1 - p.precio / lo;
        sev = r > 0.3 ? "media" : "baja";
        brecha = "−" + pct(r, 0) + " bajo el mínimo";
        lectura = "Más barato que el mercado: o dejas dinero en la mesa o el cliente va a desconfiar del precio.";
      }
      fila({
        area: "Precios", supuesto: `Precio de ${p.nombre || "producto"}`, tab: "productos",
        modelo: money(p.precio), mercado: `${pMin != null ? money(pMin) : "—"} a ${pMax != null ? money(pMax) : "—"}`, brecha, sev, lectura,
      });
    }
  }

  /* sueldos */
  const sueldoM = cif("costos", "salarioOperativo");
  const gente = (s.recursosMO || []).filter((r: any) => r.sueldoMensual > 0);
  if (sueldoM == null) falta("Sueldos del personal", "costos");
  else if (gente.length && sueldoM > 0) {
    const personas = gente.reduce((a: number, r: any) => a + (r.personas || 1), 0);
    const prom = gente.reduce((a: number, r: any) => a + r.sueldoMensual * (r.personas || 1), 0) / personas;
    const r = prom / sueldoM;
    fila({
      area: "Costos", supuesto: "Sueldo promedio del personal operativo", tab: "mo",
      modelo: money(prom), mercado: money(sueldoM), brecha: (r >= 1 ? "+" : "−") + pct(Math.abs(r - 1), 0),
      sev: r < 0.8 ? "alta" : r < 0.9 ? "media" : r > 1.3 ? "baja" : "ok",
      lectura: r < 0.9 ? "Pagas por debajo del mercado: o la nómina está subestimada o te va a costar contratar y retener."
        : r > 1.3 ? "Pagas bastante por encima del mercado: cuida que se traduzca en productividad." : "En línea con el mercado.",
    });
  }

  /* insumos contra la inflación general del modelo */
  const infIns = cif("costos", "inflacionInsumos");
  if (infIns == null) falta("Alza de precios de insumos", "costos");
  else {
    const b = infIns - sp.inflacion;
    fila({
      area: "Costos", supuesto: "Alza anual de insumos (el modelo usa la inflación general)", tab: "empresa",
      modelo: pct(sp.inflacion), mercado: pct(infIns), brecha: pp(-b),
      sev: b > 0.03 ? "alta" : b > 0.015 ? "media" : "ok",
      lectura: b > 0.015 ? "Tus insumos suben más rápido que la inflación que usas: el margen bruto real se erosiona año con año."
        : "La inflación del modelo alcanza para cubrir el alza de insumos.",
    });
  }

  /* crédito */
  const tasaM = cif("financiamiento", "tasaCreditoPyme");
  if (s.credito?.activo && s.credito.monto > 0) {
    if (tasaM == null) falta("Tasa del crédito", "financiamiento");
    else {
      const b = s.credito.tasaAnual - tasaM;
      fila({
        area: "Financiamiento", supuesto: "Tasa del crédito", tab: "credito",
        modelo: pct(s.credito.tasaAnual), mercado: pct(tasaM), brecha: pp(b),
        sev: b < -0.04 ? "alta" : b < -0.02 ? "media" : "ok",
        lectura: b < -0.02 ? "Supones un crédito más barato de lo que hoy presta la banca a una PyME: los intereses reales serán mayores."
          : "Una tasa que hoy sí se consigue.",
      });
    }
  }

  /* coherencia interna: el crédito del modelo contra lo que el empresario
     dice que le cobra su banco en el diagnóstico */
  const tasaDiag = s.empresa?.diagnostico?.tasaBanco;
  if (s.credito?.activo && s.credito.monto > 0 && typeof tasaDiag === "number" && isFinite(tasaDiag) && tasaDiag > 0) {
    const b = s.credito.tasaAnual - tasaDiag;
    fila({
      area: "Coherencia", supuesto: "Tasa del crédito vs. la que te cobra tu banco", tab: "credito",
      modelo: pct(s.credito.tasaAnual), mercado: pct(tasaDiag) + " según tu diagnóstico", brecha: pp(b),
      sev: b < -0.02 ? "alta" : Math.abs(b) > 0.01 ? "media" : "ok",
      lectura: b < -0.02 ? "Tu modelo supone un crédito más barato del que tú mismo dices pagar."
        : Math.abs(b) > 0.01 ? "El modelo y tu diagnóstico no dicen la misma tasa: deja una sola." : "El modelo coincide con lo que pagas.",
    });
  }

  /* múltiplo de valuación */
  const mult = cif("financiamiento", "multiploSector");
  if (mult == null) falta("Múltiplo de valuación", "financiamiento");
  else if (mult > 0 && s.valuacion) {
    const r = s.valuacion.multiplo / mult;
    fila({
      area: "Financiamiento", supuesto: "Múltiplo de salida", tab: "rentab",
      modelo: num(s.valuacion.multiplo, 1) + "x", mercado: num(mult, 1) + "x", brecha: (r >= 1 ? "+" : "−") + pct(Math.abs(r - 1), 0),
      sev: r > 1.4 ? "alta" : r > 1.2 ? "media" : r < 0.7 ? "baja" : "ok",
      lectura: r > 1.2 ? "Valúas la salida más cara que el sector: el valor por múltiplo sale inflado."
        : r < 0.7 ? "Tu múltiplo es conservador frente al sector." : "En línea con el sector.",
    });
  }

  /* fiscal */
  for (const [k, nombre] of [["isr", "Tasa de ISR"], ["ptu", "PTU"]] as any) {
    const v = cif("regulacion", k);
    if (v == null) { falta(nombre, "regulacion"); continue; }
    const b = (sp[k] || 0) - v;
    fila({
      area: "Regulación", supuesto: nombre, tab: "empresa",
      modelo: pct(sp[k] || 0), mercado: pct(v), brecha: pp(b),
      sev: b < -0.005 ? "media" : Math.abs(b) > 0.005 ? "baja" : "ok",
      lectura: b < -0.005 ? "Supones menos impuestos de los que marca la ley: la utilidad neta sale inflada."
        : Math.abs(b) > 0.005 ? "Supones más impuestos de los que aplican." : "Conforme a la ley.",
    });
  }

  filas.sort((a, b) => SEV[a.sev].orden - SEV[b.sev].orden);
  return { filas, pendientes };
}

/* ============================================================
   CONTRASTE PROFUNDO (IA)
   ============================================================ */
/* Foto del modelo: los supuestos y resultados que importan para contrastar. */
function fotoDelModelo(s: any, m: any) {
  const r = (v: any) => (typeof v === "number" && isFinite(v) ? Math.round(v) : null);
  const d = (v: any, k = 4) => (typeof v === "number" && isFinite(v) ? +v.toFixed(k) : null);
  const a1 = m?.anios?.[0] || {};
  return {
    empresa: s.empresa?.nombre, giro: s.empresa?.tipo, anioArranque: s.empresa?.anio, horizonteAnios: s.supuestos?.horizonte,
    supuestos: {
      inflacion: s.supuestos?.inflacion, crecimientoPerpetuo: s.supuestos?.gPerp, isr: s.supuestos?.isr, ptu: s.supuestos?.ptu,
      diasCartera: s.supuestos?.dso, clientesConCredito: s.supuestos?.pctCredito, diasInventario: s.supuestos?.dio, diasProveedores: s.supuestos?.dpo,
      preciosIndexadosAInflacion: s.supuestos?.indexarPrecios,
    },
    productos: (m?.prod || []).map((p: any) => ({ nombre: p.nombre, precio: p.precio, mezcla: p.mix, costoEstandar: r(p.estandar), margenReal: d(p.margenReal) })),
    planDeVentas: { unidadesMensualesAnio1: s.plan?.unidadesMes, crecimientoAnual: s.plan?.crec, unidadesPorAnio: (m?.unidadesAnio || []).map(r) },
    ventasPorAnio: (m?.anios || []).map((x: any) => r(x.ventas)),
    ebitdaPorAnio: (m?.anios || []).map((x: any) => r(x.ebitda)),
    margenBrutoAnio1: a1.ventas ? d(a1.ub / a1.ventas) : null,
    gastosAnio1: { administracion: r(m?.gAdmin1), operacion: r(m?.gOper1), ventaYMarketing: r(m?.gVenta1), total: r(m?.gastoTotalAnio1) },
    personal: (s.recursosMO || []).map((x: any) => ({ puesto: x.nombre, sueldoMensual: x.sueldoMensual, personas: x.personas })),
    insumos: (s.insumos || []).map((x: any) => ({ nombre: x.nombre, costoUnitario: x.volumenLote ? d(x.costoLote / x.volumenLote, 2) : null, unidad: x.unidad })),
    inversiones: (s.activos || []).map((x: any) => ({ nombre: x.nombre, monto: x.inversion })),
    credito: s.credito?.activo ? { monto: s.credito.monto, tasaAnual: s.credito.tasaAnual, plazoAnios: s.credito.plazoAnios } : null,
    costoDeCapital: s.wacc ? { tasaLibreRiesgo: s.wacc.rf, beta: s.wacc.beta, primaMercado: s.wacc.erp, riesgoPais: s.wacc.crp, primaTamano: s.wacc.pTamano, primaEtapa: s.wacc.pStartup, waccNominal: d(m?.waccNom) } : null,
    resultados: {
      inversionRequerida: r(m?.inversion), vpn: r(m?.vpn), tir: d(m?.tir), paybackDescontadoAnios: d(m?.dpbp, 2),
      valorEmpresa: r(m?.ev), multiploSalida: s.valuacion?.multiplo, usoDeCapacidad: d(m?.capacidad?.uso), puntoEquilibrioUnidadesAnio1: r(m?.peUnidades),
    },
  };
}

function investigacionParaIA(s: any) {
  const T = (s.investigacion || {}).temas || {};
  return TEMAS.filter((t) => tieneDatos(T[t.k])).map((t) => {
    const x = T[t.k];
    return {
      frente: t.titulo, fecha: x.fecha ? x.fecha.slice(0, 10) : null, resumen: x.resumen, cifras: x.cifras,
      hallazgos: (x.hallazgos || []).map((h: any) => ({ dato: h.dato, valor: h.valor, fuente: h.fuente, fecha: h.fecha })),
      implicaciones: x.implicaciones, notasDelEmpresario: x.notas || undefined,
    };
  });
}

export async function correrContraste(s: any, m: any, L: any, numerico: any) {
  const tabs: any = pestanas(L);
  const inv = investigacionParaIA(s);
  if (!inv.length) throw new Error("Todavía no hay investigación que contrastar. Investiga al menos un frente.");
  const sinInvestigar = TEMAS.filter((t) => !tieneDatos(((s.investigacion || {}).temas || {})[t.k])).map((t) => t.titulo);
  const yaVistas = numerico.filas.filter((f: any) => f.sev !== "ok").map((f: any) => `${f.supuesto}: modelo ${f.modelo} vs. mercado ${f.mercado} (${f.sev})`);

  const res = await iaFetch({
    maxTokens: 16000,
    prompt: `Eres socio de un fondo de inversión haciendo due diligence de un proyecto. Tu trabajo es contrastar los supuestos de este modelo financiero contra la investigación de campo y encontrar las fricciones: los puntos donde lo que el empresario supone no cuadra con lo que está pasando allá afuera. Español de México, directo, sin adjetivos vacíos.

EL NEGOCIO SEGÚN EL EMPRESARIO (descripción y diagnóstico que capturó en Empresa y supuestos):
${textoPerfil(s)}

EL MODELO (lo que el empresario supone):
${JSON.stringify(fotoDelModelo(s, m))}

LA INVESTIGACIÓN (lo que está pasando allá afuera):
${JSON.stringify(inv)}

FRENTES SIN INVESTIGAR: ${sinInvestigar.length ? sinInvestigar.join(", ") : "ninguno"}

CONTRASTE NUMÉRICO YA CALCULADO (no lo repitas tal cual; úsalo y ve más allá):
${yaVistas.length ? yaVistas.join("\n") : "sin fricciones numéricas"}

Reglas:
- Usa sólo la evidencia de la investigación. Si un supuesto que mueve el resultado no tiene evidencia, no la inventes: ponlo en "puntosCiegos".
- Busca sobre todo las fricciones que no son un número contra otro: competidores que ya ocupan el nicho, regulación que exige inversión o gasto no presupuestado, riesgos sin colchón en el modelo, estacionalidad que el plan mensual ignora, un canal de venta sin gasto de marketing que lo sostenga, capacidad, capital de trabajo que no corresponde a cómo cobra y paga el giro, precios que no aguantan la competencia.
- Contrasta también lo que el empresario dice de su negocio contra la investigación y contra su propio modelo: dice ser premium pero cobra por debajo del mercado, dice vender en línea o en marketplaces pero no presupuesta comisiones ni envíos, dice que su cliente más grande es buena parte de las ventas y el plan no lo refleja, dice que le preocupa un riesgo y el modelo no tiene colchón para él, dice ser una empresa establecida y el plan arranca desde cero, etc.
- Cada fricción cita el número del modelo y la evidencia concreta que lo contradice.
- Escribe los montos con signo $, comas en los miles y dos decimales ($1,250,000.00) y los porcentajes con su signo (4.5%), nunca como decimal.
- "tab" debe ser exactamente una de estas claves: ${Object.keys(tabs).map((k) => `${k} (${tabs[k]})`).join(", ")}.
- Ordena de mayor a menor severidad. Máximo 12 fricciones.
- "consistencia" es un entero de 0 a 100: qué tanto resiste el modelo el contraste con la realidad.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin backticks y sin texto adicional:
{"veredicto":"2 a 3 líneas","consistencia":0,"fricciones":[{"area":"...","supuesto":"...","valorModelo":"...","evidencia":"...","valorMercado":"...","severidad":"alta, media o baja","impacto":"qué le pasa al VPN, la TIR o la caja si la realidad gana","recomendacion":"qué cambiar en el modelo, concreto","tab":"..."}],"puntosCiegos":["..."],"fortalezas":["..."]}`,
  });

  const j = leerJSON(res);
  const sevOk = (v: any) => (["alta", "media", "baja"].includes(String(v).toLowerCase()) ? String(v).toLowerCase() : "media");
  const c = numero(j?.consistencia);
  return {
    fecha: new Date().toISOString(),
    proveedor: res.proveedor,
    veredicto: montosEnTexto(j?.veredicto),
    consistencia: c == null ? null : Math.max(0, Math.min(100, Math.round(c))),
    fricciones: (Array.isArray(j?.fricciones) ? j.fricciones : []).slice(0, 12).map((f: any) => ({
      area: String(f?.area || ""), supuesto: String(f?.supuesto || ""), valorModelo: montosEnTexto(f?.valorModelo),
      evidencia: montosEnTexto(f?.evidencia), valorMercado: montosEnTexto(f?.valorMercado), severidad: sevOk(f?.severidad),
      impacto: montosEnTexto(f?.impacto), recomendacion: montosEnTexto(f?.recomendacion), tab: tabs[f?.tab] ? f.tab : "",
    })).sort((a: any, b: any) => SEV[a.severidad].orden - SEV[b.severidad].orden),
    puntosCiegos: (Array.isArray(j?.puntosCiegos) ? j.puntosCiegos : []).map(String).slice(0, 10),
    fortalezas: (Array.isArray(j?.fortalezas) ? j.fortalezas : []).map(String).slice(0, 8),
  };
}

/* El botón CONTRASTE de la pestaña de investigación manda a la pestaña de
   contraste y le pide que corra en cuanto aparezca. */
let pedido = false;
export function pedirContraste() { pedido = true; }
export function tomarPedido() { const p = pedido; pedido = false; return p; }
