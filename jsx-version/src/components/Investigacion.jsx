/* ============================================================
   INVESTIGACIÓN PROFUNDA y CONTRASTE
   Las dos pestañas del grupo «Investigación». Las comparten los módulos de
   empresa y de servicios: el estado vive en `s.investigacion` de cada uno, así
   que cada proyecto guarda su propia investigación en la nube.
   ============================================================ */
import React, { useEffect, useMemo, useState } from "react";
import { C } from "../lib/theme";
import { Card, Btn, Field, TxtIn, TxtArea, Th, Td, KPI, Empty, inputCls, inputSt } from "./ui";
import {
  TEMAS, SEV, asegurar, temaVacio, tieneDatos, hayDescripcion, investigarTema,
  contrasteNumerico, correrContraste, pedirContraste, tomarPedido, pestanas,
} from "../lib/investigacion";
import { money, num } from "../lib/format";
import { estadoPerfil, MIN_PALABRAS } from "../lib/perfil";

const cuando = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

function Aviso({ children, tono = "neg" }) {
  const neg = tono === "neg";
  return (
    <div className="text-[12px] px-3 py-2 rounded mb-3 leading-relaxed"
      style={{ background: neg ? "#FDECEA" : C.soft, color: neg ? C.neg : C.muted, border: `1px solid ${neg ? "#EDB4AE" : C.line}` }}>
      {children}
    </div>
  );
}

export function Severidad({ sev }) {
  const S = SEV[sev] || SEV.media;
  return (
    <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
      style={{ background: S.fondo, color: S.color }}>{S.etiqueta}</span>
  );
}

/* Cifra de la investigación. Vacía quiere decir «no hay dato», no cero: un
   cero de inflación inventaría una fricción que no existe. */
function CifraIn({ c, value, onChange }) {
  const [txt, setTxt] = useState(null);
  const esPct = c.tipo === "pct";
  const vista = value == null || !isFinite(value) ? ""
    : esPct ? num(value * 100, 2) : c.tipo === "money" ? money(value) : num(value, 2);
  return (
    <div className="relative">
      <input className={inputCls} style={{ ...inputSt, textAlign: "right", fontVariantNumeric: "tabular-nums", paddingRight: esPct ? 22 : 8 }}
        value={txt !== null ? txt : vista} placeholder="sin dato"
        onFocus={() => setTxt(value == null ? "" : String(esPct ? +(value * 100).toFixed(4) : value))}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={() => {
          const limpio = String(txt ?? "").replace(/[^0-9.\-]/g, "");
          const v = parseFloat(limpio);
          onChange(limpio === "" || !isFinite(v) ? null : esPct ? v / 100 : v);
          setTxt(null);
        }} />
      {esPct && <span className="absolute right-2 top-1.5 text-[11px]" style={{ color: C.muted }}>%</span>}
    </div>
  );
}

function BotonContraste({ onClick, disabled, children = "CONTRASTE" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      title="Revisa toda la plataforma contra esta investigación y marca los puntos de fricción"
      style={{ background: C.ink, color: C.white, border: `1px solid ${C.ink}`, opacity: disabled ? 0.5 : 1, letterSpacing: "0.08em" }}
      className="text-[12px] font-bold px-4 py-1.5 rounded hover:opacity-80 transition-opacity">
      {children}
    </button>
  );
}

/* ============================================================
   PESTAÑA: INVESTIGACIÓN PROFUNDA
   ============================================================ */
export function TabInvestigacion({ s, up, L, irA, flash }) {
  const inv = s.investigacion || {};
  const temas = inv.temas || {};
  const [activo, setActivo] = useState(TEMAS[0].k);
  const [estado, setEstado] = useState({});
  const [todo, setTodo] = useState(false);

  const setTema = (k, fn) => up((n) => {
    const I = asegurar(n);
    if (!I.temas[k]) I.temas[k] = temaVacio();
    fn(I.temas[k]);
  });

  const investigar = async (k) => {
    setEstado((e) => ({ ...e, [k]: "cargando" }));
    try {
      const r = await investigarTema(k, s, L);
      /* las notas son del empresario: volver a investigar no las pisa */
      up((n) => { const I = asegurar(n); I.temas[k] = { ...r, notas: I.temas[k]?.notas || "" }; });
      setEstado((e) => ({ ...e, [k]: null }));
    } catch (e) {
      setEstado((x) => ({ ...x, [k]: { error: e?.message || "No se pudo investigar." } }));
    }
  };

  const puedeEmpezar = () => {
    if (hayDescripcion(s)) return true;
    flash?.(`Primero describe tu empresa en Empresa y supuestos: faltan ${estadoPerfil(s).faltan} palabras.`);
    return false;
  };

  /* De dos en dos: los ocho a la vez chocan con el límite de la cuenta. */
  const investigarTodo = async () => {
    if (!puedeEmpezar()) return;
    setTodo(true);
    const cola = TEMAS.map((t) => t.k);
    const trabajador = async () => { while (cola.length) await investigar(cola.shift()); };
    await Promise.all([trabajador(), trabajador()]);
    setTodo(false);
  };

  const contrastar = () => { pedirContraste(); irA?.("contraste"); };

  const T = TEMAS.find((t) => t.k === activo);
  const d = temas[activo] || temaVacio();
  const est = estado[activo];
  const cubiertos = TEMAS.filter((t) => tieneDatos(temas[t.k])).length;
  const st = estadoPerfil(s);

  return (
    <>
      <Card title="Investigación profunda"
        sub="Lo que está pasando allá afuera: mercado, competencia, precios, costos, economía, financiamiento, regulación y riesgos. Después, CONTRASTE lo pone frente a tus supuestos."
        right={<div className="flex gap-2 items-center">
          <Btn small onClick={investigarTodo} disabled={todo || !st.listo}>{todo ? "Investigando…" : "Investigar todo"}</Btn>
          <BotonContraste onClick={contrastar} />
        </div>}>
        {/* la descripción ya no se escribe aquí: se lee de Empresa y supuestos */}
        <div className="rounded-lg px-3 py-2 flex items-center justify-between gap-3 flex-wrap text-[11.5px] leading-relaxed"
          style={{ background: st.listo ? C.soft : "#FBF3E0", border: `1px solid ${st.listo ? C.line : "#E9CF8F"}` }}>
          <span style={{ color: st.listo ? C.muted : C.ink }}>
            {st.listo ? (
              <>La IA investiga a partir de la descripción y el diagnóstico de <b style={{ color: C.ink }}>Empresa y supuestos</b>
                {" "}({st.palabras} palabras · {st.respondidas} de {st.total} preguntas respondidas). Entre más completo el perfil, más fina la investigación.</>
            ) : (
              <><b>Falta la descripción de tu empresa.</b> Llevas {st.palabras} de {MIN_PALABRAS} palabras. La investigación se habilita en
                cuanto la completes en Empresa y supuestos.</>
            )}
          </span>
          <button onClick={() => irA?.("empresa")} className="text-[11px] font-medium hover:underline shrink-0" style={{ color: C.azul }}>
            {st.listo ? "Revisar el perfil →" : "Ir a Empresa y supuestos →"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 mb-2 flex-wrap">
          <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>
            Frentes · {cubiertos} de {TEMAS.length} investigados
          </div>
          <div className="text-[11px]" style={{ color: C.muted }}>
            Cada frente se investiga en internet y tarda uno o dos minutos. Funciona mejor con llave de Anthropic, la única que busca en vivo.
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TEMAS.map((t) => {
            const on = t.k === activo;
            const e = estado[t.k];
            const punto = e === "cargando" ? C.warn : e?.error ? C.neg : tieneDatos(temas[t.k]) ? C.pos : C.line;
            return (
              <button key={t.k} onClick={() => setActivo(t.k)}
                style={{ background: on ? C.ink : C.white, color: on ? C.white : C.ink, border: `1px solid ${on ? C.ink : C.line}` }}
                className="text-[12px] px-2.5 py-1 rounded flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: punto, display: "inline-block" }} />
                {t.corto}{e === "cargando" ? "…" : ""}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title={T.titulo} sub={T.pregunta}
        right={<Btn kind="primary" small disabled={est === "cargando" || !st.listo}
          onClick={() => { if (puedeEmpezar()) investigar(activo); }}>
          {est === "cargando" ? "Investigando…" : d.fecha ? "Volver a investigar" : "Investigar con IA"}
        </Btn>}>
        {est?.error && <Aviso>{est.error}</Aviso>}
        {est === "cargando" && <Aviso tono="info">La IA está buscando en internet. Puede tardar uno o dos minutos; puedes seguir trabajando en otra pestaña.</Aviso>}
        {d.fecha && !d.busco && (
          <Aviso tono="info">Este frente se investigó con {d.proveedor || "un proveedor"} sin búsqueda en vivo: las cifras vienen de la memoria del modelo. Verifícalas antes de defenderlas.</Aviso>
        )}

        {!tieneDatos(d) && est !== "cargando" && (
          <Empty texto="Todavía no hay nada aquí. Investiga con IA o captura tú mismo lo que sabes." />
        )}

        {d.resumen && (
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: C.muted }}>
              Lo esencial{d.confianza ? ` · confianza ${d.confianza}` : ""}{d.fecha ? ` · ${cuando(d.fecha)}` : ""}
            </div>
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{d.resumen}</div>
          </div>
        )}

        {T.cifras.length > 0 && (
          <div className="mb-4 rounded-lg p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: C.muted }}>
              Cifras clave · alimentan el contraste numérico
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
              {T.cifras.map((c) => (
                <Field key={c.k} label={c.etiqueta} hint={c.ayuda}>
                  <CifraIn c={c} value={d.cifras?.[c.k]}
                    onChange={(v) => setTema(activo, (t) => { t.cifras = { ...(t.cifras || {}), [c.k]: v }; })} />
                </Field>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>Hallazgos</div>
          <Btn small onClick={() => setTema(activo, (t) => {
            t.hallazgos = [...(t.hallazgos || []), { id: Math.random().toString(36).slice(2, 9), dato: "", valor: "", fuente: "", url: "", fecha: "" }];
          })}>+ Hallazgo</Btn>
        </div>
        {(d.hallazgos || []).length ? (
          <div className="overflow-x-auto mb-4">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead><tr>
                <Th align="left" w="30%">Dato</Th><Th align="left" w="24%">Valor</Th><Th align="left">Fuente</Th><Th align="left" w="110">Fecha</Th><Th w="30"></Th>
              </tr></thead>
              <tbody>
                {d.hallazgos.map((h, i) => {
                  const campo = (k) => (v) => setTema(activo, (t) => { t.hallazgos[i] = { ...t.hallazgos[i], [k]: v }; });
                  return (
                    <tr key={h.id || i}>
                      <td className="px-1 py-1"><TxtIn value={h.dato} onChange={campo("dato")} placeholder="Qué es" /></td>
                      <td className="px-1 py-1"><TxtIn value={h.valor} onChange={campo("valor")} placeholder="Cifra o hecho" /></td>
                      <td className="px-1 py-1">
                        <div className="flex items-center gap-1">
                          <TxtIn value={h.fuente} onChange={campo("fuente")} placeholder="Fuente" />
                          {/^https?:\/\//.test(h.url || "") && (
                            <a href={h.url} target="_blank" rel="noreferrer noopener" title={h.url}
                              className="text-[11px] shrink-0" style={{ color: C.azul }}>abrir ↗</a>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-1"><TxtIn value={h.fecha} onChange={campo("fecha")} placeholder="Mes y año" /></td>
                      <td className="px-1 py-1 text-center">
                        <button title="Quitar este hallazgo" className="text-[13px] hover:opacity-60" style={{ color: C.muted }}
                          onClick={() => setTema(activo, (t) => { t.hallazgos.splice(i, 1); })}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-[12px] mb-4" style={{ color: C.muted }}>Sin hallazgos todavía.</div>
        )}

        {d.implicaciones && (
          <div className="mb-4 px-3 py-2 rounded" style={{ background: C.accentSoft, border: `1px solid ${C.accent}` }}>
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#3E6B27" }}>Qué significa para tu proyecto</div>
            <div className="text-[12.5px] leading-relaxed">{d.implicaciones}</div>
          </div>
        )}

        <Field label="Tus notas de campo"
          hint="Lo que viste tú: entrevistas con clientes, visitas a la competencia, cotizaciones de proveedores. También entra al contraste, y volver a investigar no lo borra.">
          <TxtArea rows={3} value={d.notas} onChange={(v) => setTema(activo, (t) => { t.notas = v; })}
            placeholder="Ej.: Visité 3 zapaterías del centro; los botines de piel similares van de $2,800 a $4,200." />
        </Field>

        {(d.fuentes || []).length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: C.muted }}>
              Páginas que consultó la IA
            </div>
            <div className="flex flex-col gap-0.5">
              {d.fuentes.map((f) => (
                <a key={f.url} href={f.url} target="_blank" rel="noreferrer noopener"
                  className="text-[11.5px] truncate hover:underline" style={{ color: C.azul }} title={f.url}>{f.titulo}</a>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

/* ============================================================
   PESTAÑA: CONTRASTE
   ============================================================ */
export function TabContraste({ s, up, m, L, irA }) {
  const inv = s.investigacion || {};
  const temas = inv.temas || {};
  const res = inv.contraste;
  const tabs = pestanas(L);
  const numerico = useMemo(() => contrasteNumerico(s, m), [s, m]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cubiertos = TEMAS.filter((t) => tieneDatos(temas[t.k])).length;
  const friccNum = numerico.filas.filter((f) => f.sev !== "ok");
  const altasNum = friccNum.filter((f) => f.sev === "alta").length;

  const correr = async () => {
    if (!cubiertos) { setError("Todavía no hay investigación que contrastar. Ve a Investigación profunda e investiga al menos un frente."); return; }
    setCargando(true); setError("");
    try {
      const r = await correrContraste(s, m, L, numerico);
      up((n) => { asegurar(n).contraste = r; });
    } catch (e) {
      setError("No se pudo hacer el contraste: " + (e?.message || "error desconocido"));
    } finally { setCargando(false); }
  };

  /* llegó aquí desde el botón CONTRASTE de la investigación */
  useEffect(() => { if (tomarPedido()) correr(); }, []);

  const IrA = ({ tab }) => tab && tabs[tab] ? (
    <button onClick={() => irA?.(tab)} className="text-[11px] font-medium hover:underline whitespace-nowrap" style={{ color: C.azul }}>
      {tabs[tab]} →
    </button>
  ) : null;

  const nombreTema = (k) => TEMAS.find((t) => t.k === k)?.titulo || k;
  const pendientesPorTema = {};
  for (const p of numerico.pendientes) (pendientesPorTema[p.tema] = pendientesPorTema[p.tema] || []).push(p.supuesto);

  return (
    <>
      <Card title="Contraste · lo supuesto vs. lo que está pasando allá afuera"
        sub="Revisa toda la plataforma contra tu investigación y marca los puntos de fricción: supuestos que la realidad no respalda."
        right={<div className="flex gap-2 items-center">
          <BotonContraste onClick={correr} disabled={cargando}>{cargando ? "CONTRASTANDO…" : "CONTRASTE"}</BotonContraste>
        </div>}>
        {error && <Aviso>{error}</Aviso>}
        {cargando && <Aviso tono="info">La IA está leyendo tu modelo completo contra la investigación. Tarda alrededor de un minuto.</Aviso>}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <KPI label="Investigación" value={`${cubiertos} de ${TEMAS.length}`} sub="frentes con evidencia"
            tone={cubiertos === TEMAS.length ? "pos" : undefined} />
          <KPI label="Fricciones numéricas" value={String(friccNum.length)}
            sub={`${altasNum} de severidad alta · ${numerico.filas.length - friccNum.length} alineados`} tone={altasNum ? "neg" : friccNum.length ? undefined : "pos"} />
          <KPI label="Fricciones de fondo (IA)" value={res ? String(res.fricciones.length) : "—"}
            sub={res ? `${res.fricciones.filter((f) => f.severidad === "alta").length} de severidad alta` : "corre CONTRASTE"} />
          <KPI label="Consistencia" value={res?.consistencia != null ? `${res.consistencia} / 100` : "—"} destaca
            sub={res ? `Contraste del ${cuando(res.fecha)}` : "qué tanto resiste el modelo"} />
        </div>
      </Card>

      <Card title="Contraste numérico"
        sub="Instantáneo y sin IA: cada cifra clave de la investigación contra el supuesto que le toca. Se recalcula solo en cuanto mueves un número.">
        {numerico.filas.length === 0 ? (
          <Empty texto="Aún no hay cifras clave investigadas. Llénalas en Investigación profunda (Economía, Mercado, Precios, Costos, Financiamiento, Regulación)." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead><tr style={{ background: C.soft }}>
                <Th align="left">Fricción</Th><Th align="left">Supuesto</Th><Th>En tu modelo</Th><Th>Allá afuera</Th><Th>Brecha</Th><Th align="left">Lectura</Th><Th align="left"></Th>
              </tr></thead>
              <tbody>
                {numerico.filas.map((f, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                    <Td align="left"><Severidad sev={f.sev} /></Td>
                    <Td align="left" bold>
                      <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>{f.area}</div>
                      {f.supuesto}
                    </Td>
                    <Td>{f.modelo}</Td>
                    <Td>{f.mercado}</Td>
                    <Td color={SEV[f.sev].color} bold>{f.brecha}</Td>
                    <td className="px-2 py-1.5 text-[12px] leading-snug" style={{ borderBottom: `1px solid ${C.soft}`, color: C.muted, minWidth: 260 }}>{f.lectura}</td>
                    <Td align="left"><IrA tab={f.tab} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {numerico.pendientes.length > 0 && (
          <div className="mt-4 rounded-lg p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
            <div className="text-[12px] font-semibold mb-1">Supuestos todavía sin evidencia</div>
            <div className="text-[11.5px] mb-2" style={{ color: C.muted }}>
              No se pueden contrastar hasta tener la cifra de afuera. Un supuesto sin evidencia no es un supuesto bueno: es uno sin revisar.
            </div>
            <div className="flex flex-col gap-1">
              {Object.keys(pendientesPorTema).map((k) => (
                <div key={k} className="text-[12px]">
                  <b>{nombreTema(k)}:</b> <span style={{ color: C.muted }}>{pendientesPorTema[k].join(", ")}</span>{" "}
                  <button onClick={() => irA?.("investigacion")} className="text-[11px] font-medium hover:underline" style={{ color: C.azul }}>investigar →</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card title="Revisión de fondo"
        sub="La IA lee el modelo completo y la investigación completa, como en una due diligence, y busca también lo que no es un número contra otro.">
        {!res ? (
          <Empty texto={cubiertos ? "Aprieta CONTRASTE para la revisión de fondo." : "Primero investiga al menos un frente; luego aprieta CONTRASTE."} />
        ) : (
          <>
            {res.veredicto && (
              <div className="mb-4 px-3 py-2.5 rounded" style={{ background: C.tasaBg, border: `1px solid ${C.tasaLinea}` }}>
                <div className="text-[11px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: C.tasaTexto }}>Veredicto</div>
                <div className="text-[13px] leading-relaxed" style={{ color: C.ink }}>{res.veredicto}</div>
              </div>
            )}

            {res.fricciones.length === 0 ? (
              <Empty texto="La IA no encontró fricciones de fondo con la evidencia disponible." />
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {res.fricciones.map((f, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ border: `1px solid ${C.line}`, borderLeft: `4px solid ${SEV[f.severidad].color}`, background: C.white }}>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Severidad sev={f.severidad} />
                        <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>{f.area}</span>
                        <span className="text-[13px] font-semibold">{f.supuesto}</span>
                      </div>
                      <IrA tab={f.tab} />
                    </div>
                    <div className="grid gap-3 mb-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>En tu modelo</div>
                        <div className="text-[12.5px]">{f.valorModelo || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>Allá afuera</div>
                        <div className="text-[12.5px]">{f.valorMercado || "—"}</div>
                        {f.evidencia && <div className="text-[11.5px] mt-0.5" style={{ color: C.muted }}>{f.evidencia}</div>}
                      </div>
                    </div>
                    {f.impacto && <div className="text-[12px] leading-relaxed"><b>Impacto:</b> {f.impacto}</div>}
                    {f.recomendacion && <div className="text-[12px] leading-relaxed mt-0.5"><b>Qué cambiar:</b> {f.recomendacion}</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              <div>
                <div className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: C.muted }}>Puntos ciegos</div>
                {res.puntosCiegos.length ? (
                  <ul className="text-[12px] leading-relaxed list-disc pl-4">{res.puntosCiegos.map((p, i) => <li key={i}>{p}</li>)}</ul>
                ) : <div className="text-[12px]" style={{ color: C.muted }}>Ninguno señalado.</div>}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: C.muted }}>Lo que sí resiste</div>
                {res.fortalezas.length ? (
                  <ul className="text-[12px] leading-relaxed list-disc pl-4">{res.fortalezas.map((p, i) => <li key={i}>{p}</li>)}</ul>
                ) : <div className="text-[12px]" style={{ color: C.muted }}>Nada señalado.</div>}
              </div>
            </div>

            <div className="text-[10.5px] mt-4" style={{ color: C.muted }}>
              Contraste del {cuando(res.fecha)} con {res.proveedor}. Si cambias el modelo o la investigación, vuelve a correrlo: esta revisión no se actualiza sola, la numérica sí.
            </div>
          </>
        )}
      </Card>
    </>
  );
}
