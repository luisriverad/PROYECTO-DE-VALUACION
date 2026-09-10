/* ============================================================
   PERFIL DE LA EMPRESA
   La descripción y el diagnóstico que el empresario captura una sola vez, en
   Empresa y supuestos. De aquí comen todas las funciones de IA que necesitan
   saber qué negocio es: los parámetros del costo de capital, la
   investigación y el contraste. Un solo lugar para escribirlo evita que cada
   pestaña trabaje con una versión distinta del mismo negocio.

   La descripción es obligatoria y con mínimo de palabras: con dos renglones la
   IA rellena con suposiciones, y una suposición con cara de dato es peor que
   no tener el dato.
   ============================================================ */

export const MIN_PALABRAS = 100;

/* Cuenta palabras de verdad: un guion o unos signos sueltos no son palabra. */
export function contarPalabras(t: any) {
  return String(t || "").trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/* Las preguntas del diagnóstico. Cada una está porque alimenta algo:
   ventas, personas y etapa → primas de tamaño y de etapa; cliente más grande,
   gobierno y proveedores → prima de negociación; país → riesgo país; lo demás
   orienta la investigación y el contraste.
   tipo: txt · num · money · pct · sel · multi */
export const SECCIONES: any[] = [
  {
    titulo: "El negocio",
    preguntas: [
      { k: "producto", tipo: "txt", etiqueta: "¿Qué vendes exactamente?", ph: "Botines y mocasines de piel hechos a mano" },
      { k: "cliente", tipo: "txt", etiqueta: "¿Quién te compra?", ph: "Mujeres de 25 a 45 años, nivel medio-alto" },
      { k: "posicion", tipo: "sel", etiqueta: "¿Cómo te posicionas en precio?", opciones: ["Económico", "Medio", "Premium"] },
      { k: "canales", tipo: "multi", etiqueta: "¿Por dónde vendes?",
        opciones: ["Tienda física propia", "Tienda en línea propia", "Marketplaces", "Redes sociales", "Mayoristas o distribuidores", "Venta directa a empresas", "Gobierno"] },
    ],
  },
  {
    titulo: "Dónde y desde cuándo",
    preguntas: [
      { k: "pais", tipo: "txt", etiqueta: "País", ph: "México" },
      { k: "estado", tipo: "txt", etiqueta: "Estado", ph: "Guanajuato" },
      { k: "ciudad", tipo: "txt", etiqueta: "Ciudad o zona", ph: "León" },
      { k: "etapa", tipo: "sel", etiqueta: "¿En qué etapa está?",
        opciones: ["Idea: todavía no vende", "Arranque: menos de 1 año vendiendo", "Crecimiento: de 1 a 3 años", "Establecida: más de 3 años"] },
      { k: "anios", tipo: "num", etiqueta: "Años operando", ph: "0 si apenas arranca" },
    ],
  },
  {
    titulo: "Tamaño",
    preguntas: [
      { k: "ventas", tipo: "money", etiqueta: "Ventas del último año (pesos)", ph: "0 si todavía no vende" },
      { k: "empleados", tipo: "num", etiqueta: "Personas trabajando, contándote", ph: "" },
      { k: "clientePrincipal", tipo: "pct", etiqueta: "¿Qué parte de tus ventas es tu cliente más grande?", ph: "" },
    ],
  },
  {
    titulo: "Mercado y competencia",
    preguntas: [
      { k: "competidores", tipo: "txt", etiqueta: "¿Contra quién compites? Con nombre", ph: "Flexi, Andrea, talleres del centro" },
      { k: "diferenciador", tipo: "txt", etiqueta: "¿Por qué te comprarían a ti y no a ellos?", ph: "" },
      { k: "proveedores", tipo: "txt", etiqueta: "Proveedores o insumos críticos", ph: "Piel de tenería local; suelas importadas" },
    ],
  },
  {
    titulo: "Dinero y riesgo",
    preguntas: [
      { k: "financiamiento", tipo: "sel", etiqueta: "¿Cómo se financia hoy?",
        opciones: ["Sólo capital propio", "Socios o inversionistas", "Crédito bancario", "Familia o proveedores", "Mixto"] },
      { k: "tasaBanco", tipo: "pct", etiqueta: "Si tienes crédito, ¿a qué tasa anual?", ph: "" },
      { k: "gobierno", tipo: "sel", etiqueta: "¿Quién toma las decisiones?",
        opciones: ["Una sola persona", "Socios de palabra", "Socios con acuerdos por escrito", "Consejo o estatutos formales"] },
      { k: "riesgo", tipo: "txt", etiqueta: "¿Qué es lo que más te preocupa que salga mal?", ph: "" },
    ],
  },
];
export const PREGUNTAS = SECCIONES.flatMap((s) => s.preguntas);

export function respondida(p: any, v: any) {
  if (p.tipo === "multi") return Array.isArray(v) && v.length > 0;
  if (p.tipo === "txt" || p.tipo === "sel") return !!String(v ?? "").trim();
  return typeof v === "number" && isFinite(v);
}

export function estadoPerfil(s: any) {
  const e = s?.empresa || {};
  const d = e.diagnostico || {};
  const palabras = contarPalabras(e.descripcion);
  return {
    palabras,
    faltan: Math.max(0, MIN_PALABRAS - palabras),
    listo: palabras >= MIN_PALABRAS,
    respondidas: PREGUNTAS.filter((p) => respondida(p, d[p.k])).length,
    total: PREGUNTAS.length,
  };
}
export const perfilListo = (s: any) => estadoPerfil(s).listo;

/* El perfil en texto para los prompts: la descripción tal cual y sólo las
   respuestas que sí se dieron. Una pregunta sin responder no se manda vacía:
   la IA la tomaría como "no aplica". */
export function textoPerfil(s: any) {
  const e = s?.empresa || {};
  const d = e.diagnostico || {};
  const lineas: any[] = [];
  for (const p of PREGUNTAS) {
    const v = d[p.k];
    if (!respondida(p, v)) continue;
    const val = p.tipo === "multi" ? v.join(", ")
      : p.tipo === "money" ? "$" + Math.round(v).toLocaleString("en-US") + " MXN"
        : p.tipo === "pct" ? (v * 100).toFixed(1) + "%"
          : String(v).trim();
    lineas.push(`- ${p.etiqueta.replace(/^¿/, "").replace(/\?$/, "")}: ${val}`);
  }
  return [
    `Empresa: ${e.nombre || "(sin nombre)"} · giro ${e.tipo || "—"} · año de arranque del proyecto ${e.anio || "—"}`,
    `Descripción del empresario:\n"""\n${String(e.descripcion || "").trim() || "(no la escribió)"}\n"""`,
    lineas.length ? `Diagnóstico:\n${lineas.join("\n")}` : "Diagnóstico: (sin responder)",
  ].join("\n\n");
}
