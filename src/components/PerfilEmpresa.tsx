/* ============================================================
   DESCRIPCIÓN Y DIAGNÓSTICO DE LA EMPRESA
   Vive únicamente en Empresa y supuestos. Todo lo que la IA sabe del negocio
   sale de aquí: costo de capital, investigación y contraste.
   ============================================================ */
import React, { useState } from "react";
import { C } from "../lib/theme";
import { money, num } from "../lib/format";
import { Card, TxtIn, inputCls, inputSt } from "./ui";
import { SECCIONES, MIN_PALABRAS, estadoPerfil } from "../lib/perfil";

const GUIA = "Cuéntalo como se lo contarías a un inversionista: qué vendes y a quién, dónde operas y desde cuándo, "
  + "por dónde vendes y cuánto, contra quién compites y por qué te eligen, quién te surte, cómo te financias, "
  + "qué quieres hacer con esta inversión y qué te preocupa que salga mal.";

/* Número opcional: vacío quiere decir «no lo sé», no cero. Un cero en ventas
   o en la tasa del banco diría algo falso sobre la empresa. */
function NumOpt({ value, onChange, tipo, placeholder }: any) {
  const [txt, setTxt] = useState<any>(null);
  const esPct = tipo === "pct";
  const vista = value == null || !isFinite(value) ? ""
    : esPct ? num(value * 100, 1) : tipo === "money" ? money(value) : num(value, 0);
  return (
    <div className="relative">
      <input className={inputCls} style={{ ...inputSt, textAlign: "right", fontVariantNumeric: "tabular-nums", paddingRight: esPct ? 22 : 8 }}
        value={txt !== null ? txt : vista} placeholder={placeholder || "sin dato"}
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

/* Etiqueta en un div y no en <label>: dentro de un label, un clic en el texto
   activaría el primer botón de las opciones múltiples. */
function Pregunta({ etiqueta, children }: any) {
  return (
    <div>
      <div className="text-[11px] mb-1 font-medium" style={{ color: C.muted }}>{etiqueta}</div>
      {children}
    </div>
  );
}

export default function PerfilEmpresa({ s, up }: any) {
  const e = s.empresa || {};
  const d = e.diagnostico || {};
  const st = estadoPerfil(s);
  const avance = Math.min(1, st.palabras / MIN_PALABRAS);
  const setD = (k: string, v: any) => up((n: any) => { n.empresa.diagnostico = { ...(n.empresa.diagnostico || {}), [k]: v }; });

  const entrada = (p: any) => {
    const v = d[p.k];
    if (p.tipo === "txt") return <TxtIn value={v} placeholder={p.ph} onChange={(x: any) => setD(p.k, x)} />;
    if (p.tipo === "sel") return (
      <select className={inputCls} style={{ ...inputSt, cursor: "pointer" }} value={v || ""} onChange={(ev) => setD(p.k, ev.target.value)}>
        <option value="">— elige —</option>
        {p.opciones.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    if (p.tipo === "multi") {
      const sel: string[] = Array.isArray(v) ? v : [];
      return (
        <div className="flex flex-wrap gap-1">
          {p.opciones.map((o: string) => {
            const on = sel.includes(o);
            return (
              <button key={o} type="button"
                onClick={() => setD(p.k, on ? sel.filter((x) => x !== o) : [...sel, o])}
                style={{ background: on ? C.azul : C.white, color: on ? C.white : C.ink, border: `1px solid ${on ? C.azul : C.line}` }}
                className="text-[11.5px] px-2 py-0.5 rounded hover:opacity-80 transition-opacity">
                {on ? "✓ " : ""}{o}
              </button>
            );
          })}
        </div>
      );
    }
    return <NumOpt value={v} tipo={p.tipo} placeholder={p.ph} onChange={(x: any) => setD(p.k, x)} />;
  };

  return (
    <>
      <Card title="Descripción del negocio"
        sub="Obligatoria. Es lo que lee la IA para obtener tus parámetros de costo de capital, investigar tu mercado y hacer el CONTRASTE. Escríbela tú, con tus palabras: nadie conoce tu negocio mejor que tú."
        right={
          <div className="text-right">
            <div className="text-[18px] font-semibold leading-none" style={{ color: st.listo ? C.pos : C.neg, fontVariantNumeric: "tabular-nums" }}>
              {st.palabras}<span className="text-[12px] font-medium" style={{ color: C.muted }}> / {MIN_PALABRAS}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wide font-semibold mt-0.5" style={{ color: st.listo ? C.pos : C.muted }}>
              {st.listo ? "✓ palabras" : "palabras mínimo"}
            </div>
          </div>
        }>
        <textarea className={inputCls} rows={8} value={e.descripcion || ""} placeholder={GUIA}
          style={{ ...inputSt, resize: "vertical", lineHeight: 1.6, borderColor: st.listo || !st.palabras ? C.line : C.warn }}
          onChange={(ev) => up((n: any) => { n.empresa.descripcion = ev.target.value; })} />
        <div className="mt-2 rounded-full overflow-hidden" style={{ height: 5, background: C.soft }}>
          <div style={{ width: `${avance * 100}%`, height: "100%", background: st.listo ? C.pos : C.warn, transition: "width .2s" }} />
        </div>
        <div className="text-[11.5px] mt-1.5 leading-relaxed" style={{ color: st.listo ? C.pos : C.muted }}>
          {st.listo
            ? "✓ Suficiente para que la IA trabaje. Entre más concreta, mejor: nombres, cifras, lugares."
            : st.palabras === 0
              ? `Escribe al menos ${MIN_PALABRAS} palabras. Mientras tanto quedan bloqueados los botones de IA de Costo de capital, Investigación y CONTRASTE.`
              : `Faltan ${st.faltan} ${st.faltan === 1 ? "palabra" : "palabras"}. Mientras no llegue a ${MIN_PALABRAS}, los botones de IA de Costo de capital, Investigación y CONTRASTE quedan bloqueados.`}
        </div>
      </Card>

      <Card title="Diagnóstico de la empresa"
        sub="Preguntas puntuales. Ajustan las primas de riesgo del costo de capital (tamaño, etapa, dependencia, país), le dicen a la investigación dónde buscar y el CONTRASTE las pone frente a tu modelo."
        right={
          <div className="text-[11px] font-semibold px-2 py-1 rounded"
            style={{ background: st.respondidas === st.total ? C.accentSoft : C.soft, color: st.respondidas === st.total ? "#3E6B27" : C.muted }}>
            {st.respondidas} de {st.total} respondidas
          </div>
        }>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {SECCIONES.map((sec) => (
            <div key={sec.titulo} className="rounded-lg p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
              <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: C.ink }}>{sec.titulo}</div>
              <div className="flex flex-col gap-2.5">
                {sec.preguntas.map((p: any) => <Pregunta key={p.k} etiqueta={p.etiqueta}>{entrada(p)}</Pregunta>)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
