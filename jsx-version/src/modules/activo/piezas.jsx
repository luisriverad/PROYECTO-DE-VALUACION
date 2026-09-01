/* ============================================================
   PIEZAS DE INTERFAZ DEL MÓDULO "INVERSIÓN ACTIVO"
   Mismos componentes que el resto de la plataforma, con la
   convención de color: azul = lo capturas tú, negro = fórmula.
   ============================================================ */
import React from "react";
import { C } from "../../lib/theme";
import { money, num, pct } from "../../lib/format";
import { NumIn, PctIn } from "../../components/ui";
import { ok } from "../../lib/activos";

/* ---------- formatos cortos ---------- */
export const fM = (v) => money(v);
export const fP = (v) => pct(v, 1);
export const fP2 = (v) => pct(v, 2);
export const fX = (v) => (ok(v) ? num(v, 2) + "x" : "—");
/* diferencia entre dos tasas, en puntos porcentuales, con signo */
export const fPts = (v) => (ok(v) ? (v >= 0 ? "+" : "") + num(v * 100, 1) + " pts" : "—");
/* la misma distancia pero sin signo, para cuando la frase ya dice el sentido:
   "le faltan 1.7 puntos" se lee solo; "le faltan -1.7 pts", no. */
export const fBrecha = (v) => {
  if (!ok(v)) return "—";
  const n = Math.abs(v) * 100;
  return num(n, 1) + (num(n, 1) === "1.0" ? " punto" : " puntos");
};
export const fAnios = (v) => (ok(v) ? v + (v === 1 ? " año" : " años") : "No recupera");
/* compacto para ejes: $1.25M, $840k */
export const fComp = (v) => {
  if (!ok(v)) return "—";
  const a = Math.abs(v), s = v < 0 ? "-" : "";
  if (a >= 1e6) { const m = a / 1e6; return s + "$" + num(m, m % 1 === 0 ? 0 : (m * 10) % 1 === 0 ? 1 : 2) + "M"; }
  if (a >= 1e3) return s + "$" + num(a / 1e3, 0) + "k";
  return money(v);
};

/* ---------- encabezado de bloque dentro de una tarjeta ---------- */
export const SecHead = ({ children }) => (
  <div className="text-[10px] uppercase tracking-wider font-semibold mt-4 mb-2 first:mt-0" style={{ color: C.accent }}>{children}</div>
);

/* ---------- renglón etiqueta + control ---------- */
export const Row = ({ label, hint, children, ancho = 130 }) => (
  <div className="flex items-center gap-3 py-1.5" style={{ borderBottom: `1px dotted ${C.line}` }}>
    <div className="flex-1 min-w-0">
      <div className="text-[12.5px] leading-tight" style={{ color: C.ink }}>{label}</div>
      {hint && <div className="text-[10.5px] italic mt-0.5" style={{ color: C.muted }}>{hint}</div>}
    </div>
    <div className="shrink-0" style={{ width: ancho }}>{children}</div>
  </div>
);

/* Campo capturable: escribe directo en A[g][k] */
export function Campo({ A, up, g, k, label, hint, tipo = "money", dec }) {
  const set = (v) => up((n) => { n[g][k] = tipo === "int" ? Math.max(0, Math.round(v)) : v; });
  return (
    <Row label={label} hint={hint}>
      {tipo === "pct"
        ? <PctIn value={A[g][k]} dec={dec != null ? dec : 2} onChange={set} />
        : <NumIn value={A[g][k]} dec={tipo === "int" ? 0 : tipo === "num" ? 2 : 0} plain={tipo === "int"} onChange={set} />}
    </Row>
  );
}

/* Renglón en pesos que además dice qué tajada de la operación actual
   representa. Se captura de una sola forma —los pesos son lo que corre el
   modelo— y el porcentaje sólo se lee, para dimensionar si el supuesto es
   razonable: «me sube las ventas 7.5%» se juzga solo; «$900,000», no. */
export function CampoDual({ A, up, g, k, bk, label, hint, refTexto }) {
  const base = A[g][bk] || 0;
  const pesos = A[g][k] || 0;
  const p = base > 0 ? pesos / base : null;
  return (
    <div className="py-1.5" style={{ borderBottom: `1px dotted ${C.line}` }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] leading-tight" style={{ color: C.ink }}>{label}</div>
          {hint && <div className="text-[10.5px] italic mt-0.5" style={{ color: C.muted }}>{hint}</div>}
        </div>
        <div className="shrink-0" style={{ width: 130 }}>
          <NumIn value={pesos} dec={0} onChange={(v) => up((n) => { n[g][k] = v; })} />
        </div>
      </div>
      <div className="text-[10.5px] mt-0.5" style={{ color: C.muted }}>
        {p != null ? `${pct(p, 2)} de ${refTexto}` : `Captura ${refTexto} para ver qué porcentaje representa`}
      </div>
    </div>
  );
}

/* Referencia de la operación actual: no entra en ningún cálculo, sólo sirve
   para poner los renglones de arriba en escala. */
export function CampoRef({ A, up, g, k, label, hint }) {
  return <Row label={label} hint={hint}><NumIn value={A[g][k]} dec={0} onChange={(v) => up((n) => { n[g][k] = v; })} /></Row>;
}

/* Deslizador: para las decisiones donde importa recorrer el rango entero,
   no atinarle a un número. `tope` pinta hasta dónde te dejan llegar. */
export function Slider({ label, hint, value, onChange, min = 0, max = 1, step = 0.01,
  fmt, tope, topeLabel, izq, der }) {
  const f = fmt || ((v) => pct(v, 0));
  const pos = (v) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const pasado = tope != null && value > tope;
  return (
    <div className="py-2.5" style={{ borderBottom: `1px dotted ${C.line}` }}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[12.5px] leading-tight" style={{ color: C.ink }}>{label}</div>
        <div className="text-[16px] font-semibold" style={{ color: pasado ? C.neg : C.azul, fontVariantNumeric: "tabular-nums" }}>{f(value)}</div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full mt-1.5" style={{ accentColor: pasado ? C.neg : C.accent, display: "block" }} />
      {/* regla: verde hasta donde te prestan, rojo mas alla */}
      {tope != null && (
        <div className="relative mt-0.5 mb-1" style={{ height: 4 }}>
          <div className="absolute rounded-sm" style={{ left: 0, width: pos(tope) + "%", top: 0, bottom: 0, background: C.accent }} />
          <div className="absolute rounded-sm" style={{ left: pos(tope) + "%", right: 0, top: 0, bottom: 0, background: C.neg, opacity: 0.75 }} />
          <div className="absolute" style={{ left: pos(tope) + "%", top: -3, bottom: -3, width: 2, background: C.ink }} />
        </div>
      )}
      <div className="flex justify-between text-[10px]" style={{ color: C.muted }}>
        <span>{izq || f(min)}</span>
        {tope != null && <span style={{ color: pasado ? C.neg : C.ink, fontWeight: 600 }}>{topeLabel || ("tope " + f(tope))}</span>}
        <span>{der || f(max)}</span>
      </div>
      {hint && <div className="text-[10.5px] italic mt-0.5" style={{ color: C.muted }}>{hint}</div>}
    </div>
  );
}

/* Reparto visual de quien pone el dinero */
export function Reparto({ deuda, propio }) {
  const tot = (deuda || 0) + (propio || 0);
  const pd = tot > 0 ? (deuda / tot) * 100 : 0;
  return (
    <div className="mt-1">
      <div className="flex rounded overflow-hidden" style={{ height: 26, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-center overflow-hidden" style={{ width: pd + "%", background: C.ink }}>
          {pd > 16 && <span className="text-[10.5px] font-semibold whitespace-nowrap" style={{ color: C.white }}>Banco</span>}
        </div>
        <div className="flex items-center justify-center overflow-hidden" style={{ width: (100 - pd) + "%", background: C.accent }}>
          {/* "Capital propio" es largo: sólo cabe cuando la franja da el ancho */}
          {100 - pd > 34 && <span className="text-[10.5px] font-semibold whitespace-nowrap" style={{ color: C.white }}>Capital propio</span>}
        </div>
      </div>
      <div className="flex justify-between mt-1 text-[11.5px]" style={{ fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: C.ink }}>Banco <b>{money(deuda)}</b></span>
        <span style={{ color: C.accent }}>Capital propio <b>{money(propio)}</b></span>
      </div>
    </div>
  );
}

/* Tarjeta de apalancamiento, igual para maquinaria e inmueble: cuánto pone el
   banco, hasta dónde te deja llegar y si la deuda te suma o te resta. */
export function Apalancamiento({ ltv, monto, propio, dscr, dscrMin, ltvMax, ltvDscr, limita,
  propioMin, apalancaSuma, rinde, cuesta, vpn, tirSin, tirCon, extra, activo }) {
  const pasado = ok(ltvMax) && ltv > ltvMax;
  const porGarantia = limita === "garantia";
  return (
    <>
      <Reparto deuda={monto} propio={propio} />
      <div className="mt-3">
        <Stats items={[
          { k: "Sale de tu bolsa", valor: propio, signo: false, clave: true },
          { k: "DSCR año 1", valor: dscr, fmt: fX, signo: false, n: `El banco pide ${fX(dscrMin)}` },
          { k: "TIR apalancada", valor: tirCon, fmt: fP, signo: false, n: `Sin deuda rinde ${fP(tirSin)}` },
        ].concat(extra || [])} />
      </div>
      {pasado
        ? <Veredicto tono="no" texto={`Estás pidiendo ${fP(ltv)} y te prestan hasta ${fP(ltvMax)}. ${porGarantia
            ? `Ahí topa la garantía: nadie te presta más que eso contra ${activo}, por bien que pague.`
            : `Ahí topa el DSCR: el flujo ya no alcanza a cubrir el servicio con el colchón que te piden.`} Tendrías que poner al menos ${fM(propioMin)} de tu bolsa.`} />
        : !apalancaSuma
          ? <Veredicto tono="mid" texto={`Aquí la deuda te resta: ${activo} rinde ${fP(rinde)} y el crédito te cuesta ${fP2(cuesta)}. Cada peso que pidas prestado se lleva la diferencia. Conviene apalancarte poco, o negociar la tasa.`} />
          : <Veredicto tono="ok" texto={`La deuda te suma: ${activo} rinde ${fP(rinde)} y el crédito cuesta ${fP2(cuesta)}. Puedes llegar hasta ${fP(ltvMax)}${porGarantia ? ", donde topa la garantía" : `, donde el DSCR toca ${fX(dscrMin)}`}, y ahí pondrías ${fM(propioMin)} de tu bolsa en vez de ${fM(propio)}.`} />}
      <Nota>
        Apalancarte no hace bueno un mal negocio: el VPN sin deuda ({fM(vpn)}) no se mueve un peso cuando jalas el
        deslizador. Lo que la deuda hace es amplificar — para arriba si el activo rinde más que el crédito, para
        abajo si rinde menos — y decidir cuánto de tu capital queda amarrado aquí en vez de en otra cosa.
        {ok(ltvDscr) && ok(ltvMax) && (
          <> Aquí te limita <b>{porGarantia ? "la garantía" : "el flujo"}</b>: por DSCR aguantarías {fP(ltvDscr)}
          {porGarantia ? ", pero el colateral no da para tanto." : " y ése es el que pega primero."}</>
        )}
      </Nota>
    </>
  );
}

/* Valor derivado: negro, alineado a la derecha, nunca editable */
export const Derivado = ({ label, hint, valor }) => (
  <Row label={label} hint={hint}>
    <div className="text-[13px] font-semibold text-right pr-2" style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
  </Row>
);

/* La tasa de descuento, en caja naranja. Es el número que menos se entiende y el
   que más mueve el resultado, así que va igual en todas las pestañas.
   El color vive en la caja y en la etiqueta; la cifra se queda en negro para
   que se lea como lo que es, un dato, y no como un semáforo. */
export function TasaBox({ label = "Tasa de descuento", valor, nota, origen, chico }) {
  return (
    <div className={`rounded-md ${chico ? "px-2.5 py-1.5 my-1" : "px-3 py-2.5 my-2"}`}
      style={{ background: C.tasaBg, border: `1px solid ${C.tasaLinea}` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={`${chico ? "text-[9.5px]" : "text-[10px]"} uppercase tracking-wider font-semibold`}
            style={{ color: C.tasaTexto }}>{label}</div>
          {nota && <div className="text-[10.5px] leading-snug mt-0.5" style={{ color: C.muted }}>{nota}</div>}
        </div>
        <div className={`${chico ? "text-[15px]" : "text-[22px]"} font-semibold shrink-0 leading-none`}
          style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
      </div>
      {origen && (
        <div className="text-[10.5px] italic mt-1.5 pt-1.5" style={{ color: C.muted, borderTop: `1px dotted ${C.tasaLinea}` }}>
          {origen}
        </div>
      )}
    </div>
  );
}

/* ---------- mosaico de indicadores ---------- */
export function Stats({ items }) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
      {items.map((sp, idx) => {
        const v = sp.valor;
        const tono = sp.signo === false || !ok(v) ? C.ink : v > 0 ? C.pos : v < 0 ? C.neg : C.ink;
        return (
          <div key={idx} className="rounded-md px-3 py-2.5"
            style={{ background: sp.clave ? C.accentSoft : C.soft, border: `1px solid ${C.line}`, borderTop: `2px solid ${sp.clave ? C.accent : C.line}` }}>
            <div className="text-[9.5px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{sp.k}</div>
            <div className="text-[17px] font-semibold leading-tight mt-0.5" style={{ color: tono, fontVariantNumeric: "tabular-nums" }}>
              {(sp.fmt || fM)(v)}
            </div>
            {sp.n && <div className="text-[10.5px] mt-1 leading-snug" style={{ color: C.muted }}>{sp.n}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- veredicto ----------
   Un "no" merece más explicación que un "sí": cuando el proyecto pasa basta
   con decirlo, pero cuando destruye valor hay que decir cuánto, por qué y
   qué tendría que cambiar para que pasara. Eso va en `detalle`, una lista
   de renglones cortos debajo del veredicto; los nulos se ignoran, para que
   cada pestaña arme sólo los que puede calcular. */
export function Veredicto({ tono, texto, detalle }) {
  const col = tono === "ok" ? C.pos : tono === "no" ? C.neg : "#8A5D0C";
  const bg = tono === "ok" ? "#E9F3ED" : tono === "no" ? "#FBEAE8" : "#FAF2DF";
  const marca = tono === "ok" ? "✓" : tono === "no" ? "✕" : "!";
  const lineas = (detalle || []).filter(Boolean);
  return (
    <div className="rounded-md px-3.5 py-2.5 mt-3 flex items-start gap-2.5" style={{ background: bg, border: `1px solid ${col}` }}>
      <div className="text-[13px] font-bold leading-5" style={{ color: col }}>{marca}</div>
      <div className="min-w-0">
        <div className={`text-[12.5px] leading-relaxed${lineas.length ? " font-semibold" : ""}`} style={{ color: C.ink }}>{texto}</div>
        {lineas.length > 0 && (
          <div className="mt-2 pt-2 flex flex-col gap-1.5" style={{ borderTop: `1px dotted ${col}` }}>
            {lineas.map((l, k) => (
              <div key={k} className="flex items-start gap-2">
                <div className="text-[12px] leading-relaxed shrink-0" style={{ color: col }}>—</div>
                <div className="text-[12px] leading-relaxed" style={{ color: C.ink }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- nota al pie de una tarjeta ---------- */
export const Nota = ({ children }) => (
  <div className="text-[11.5px] leading-relaxed px-4 py-2.5" style={{ color: C.muted, background: C.soft, borderTop: `1px solid ${C.line}` }}>{children}</div>
);

/* La tasa de descuento no se captura en las pestañas de activo: se arma una sola
   vez en "Tasa de descuento" y baja a las cuatro, para que todas se midan igual. */
export const NotaTasa = ({ detalle }) => (
  <Nota>
    <b>La tasa de descuento no se edita aquí.</b> Se arma en la pestaña <b>Tasa de descuento</b> y baja sola a
    las cuatro pestañas de activo, para que todas se midan con la misma vara. Si la quieres mover, muévela allá:
    {detalle ? " " + detalle : ""} Lo que sí capturas aquí es el costo del crédito de <i>este</i> activo, que es
    lo que te cobra el banco por él, no el costo de capital de la empresa.
  </Nota>
);

/* ---------- tabla de flujo por año (0 a 10) ---------- */
export function FlowTable({ Y, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th className="text-[10px] uppercase tracking-wide font-semibold px-2 py-2 text-left"
              style={{ color: C.muted, background: C.soft, borderBottom: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}`, position: "sticky", left: 0, minWidth: 230, zIndex: 2 }}>Concepto</th>
            {Y.map((y) => (
              <th key={y.t} className="text-[10px] uppercase tracking-wide font-semibold px-2 py-2 text-right whitespace-nowrap"
                style={{ color: C.muted, background: C.soft, borderBottom: `1px solid ${C.line}` }}>Año {y.t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: r.hi ? C.accentSoft : undefined }}>
              <th className="text-[11.5px] px-2 py-1.5 text-left font-normal whitespace-nowrap"
                style={{
                  color: C.ink, fontWeight: r.sum ? 600 : 400, background: r.hi ? C.accentSoft : C.white,
                  borderBottom: `1px solid ${C.soft}`, borderRight: `1px solid ${C.line}`,
                  borderTop: r.sum ? `1px solid ${C.line}` : undefined,
                  position: "sticky", left: 0, minWidth: 230, zIndex: 1,
                }}>{r.lab}</th>
              {Y.map((y) => {
                const v = r.f(y);
                return (
                  <td key={y.t} className="px-2 py-1.5 text-[11.5px] text-right whitespace-nowrap"
                    style={{
                      color: v < 0 ? C.neg : C.ink, fontWeight: r.sum ? 600 : 400,
                      borderBottom: `1px solid ${C.soft}`, borderTop: r.sum ? `1px solid ${C.line}` : undefined,
                      fontVariantNumeric: "tabular-nums",
                    }}>{(r.fmt || fM)(v)}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- tabla genérica ---------- */
export function GridTable({ head, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-2 ${i === 0 ? "text-left" : "text-right"} whitespace-nowrap`}
                style={{ color: C.muted, background: C.soft, borderBottom: `1px solid ${C.line}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            /* r.tasa pinta el renglón de la tasa de descuento del mismo naranja
               que la caja, para que se reconozca en cualquier tabla */
            const fondo = r.tasa ? C.tasaBg : r.hi ? C.accentSoft : undefined;
            const linea = r.tasa ? C.tasaLinea : C.soft;
            const fuerte = r.sum || r.hi || r.tasa;
            return (
              <tr key={i} style={{ background: fondo }}>
                {r.cells.map((c, j) => {
                  const obj = c && typeof c === "object";
                  const txt = obj ? c.t : c;
                  const neg = obj && c.neg;
                  return j === 0 ? (
                    <th key={j} className="text-[11.5px] px-2 py-1.5 text-left whitespace-nowrap"
                      style={{ color: r.tasa ? C.tasaTexto : C.ink, fontWeight: fuerte ? 600 : 400, borderBottom: `1px solid ${linea}`, borderTop: r.tasa ? `1px solid ${C.tasaLinea}` : undefined, borderRight: `1px solid ${C.line}` }}>{txt}</th>
                  ) : (
                    <td key={j} className="px-2 py-1.5 text-[11.5px] text-right whitespace-nowrap"
                      style={{ color: neg ? C.neg : C.ink, fontWeight: fuerte ? 600 : 400, borderBottom: `1px solid ${linea}`, borderTop: r.tasa ? `1px solid ${C.tasaLinea}` : undefined, fontVariantNumeric: "tabular-nums" }}>{txt}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- área acumulada ---------- */
/* ---------- escala con cortes redondos ---------- */
const paso = (x) => {
  const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x) || 1)));
  const f = Math.abs(x) / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
};

/* ---------- área con ejes rotulados: años abajo, pesos a la izquierda ---------- */
export function AreaChart({ vals, label, unidad = "Año" }) {
  const n = vals.length;
  const W = 640, izq = 68, der = 16, arriba = 16, alto = 118;
  const x0 = izq, x1 = W - der, y1 = arriba + alto;
  const crudos = vals.map((v) => (ok(v) ? v : 0));
  const step = paso((Math.max(...crudos, 0) - Math.min(...crudos, 0)) / 4 || 1);
  const mn = Math.floor(Math.min(...crudos, 0) / step) * step;
  const mx = Math.ceil(Math.max(...crudos, 0) / step) * step;
  const rng = mx - mn || 1;
  const X = (i) => x0 + (i * (x1 - x0)) / (n - 1 || 1);
  const Yc = (v) => arriba + alto - ((v - mn) / rng) * alto;
  const cortes = []; for (let t = mn; t <= mx + step / 2; t += step) cortes.push(t);
  const cero = Yc(0);
  const d = crudos.map((v, i) => (i ? "L" : "M") + X(i) + " " + Yc(v)).join(" ");
  const relleno = d + " L" + X(n - 1) + " " + cero + " L" + X(0) + " " + cero + " Z";
  const cruce = crudos.findIndex((v, i) => i > 0 && v >= 0 && crudos[i - 1] < 0);
  const ult = crudos[n - 1];
  return (
    <div className="pt-1">
      <svg viewBox={`0 0 ${W} 178`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
        {/* cortes horizontales rotulados en pesos */}
        {cortes.map((t, i) => (
          <g key={i}>
            <line x1={x0} x2={x1} y1={Yc(t)} y2={Yc(t)} stroke={C.line} strokeWidth={1}
              strokeDasharray={t === 0 ? "4 4" : "2 5"} opacity={t === 0 ? 1 : 0.7} />
            <text x={x0 - 8} y={Yc(t) + 3.2} textAnchor="end" fontSize={9.5}
              fill={t === 0 ? C.ink : C.muted} style={{ fontVariantNumeric: "tabular-nums" }}>{fComp(t)}</text>
          </g>
        ))}
        <path d={relleno} fill={C.accent} opacity={0.16} />
        <path d={d} fill="none" stroke={C.accent} strokeWidth={2} strokeLinejoin="round" />
        {/* año en que el acumulado cruza el cero */}
        {cruce > 0 && (
          <g>
            <line x1={X(cruce)} x2={X(cruce)} y1={arriba} y2={y1} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
            <text x={X(cruce)} y={arriba - 5} textAnchor={cruce > n - 3 ? "end" : "middle"} fontSize={9.5} fill={C.muted} stroke={C.white} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">Recupera en {cruce}</text>
          </g>
        )}
        {crudos.map((v, i) => (
          <circle key={i} cx={X(i)} cy={Yc(v)} r={i === n - 1 ? 4 : 2.5}
            fill={i === n - 1 ? C.accent : C.white} stroke={C.accent} strokeWidth={1.5} />
        ))}
        {/* valor del primer y del último punto, que son los que se leen */}
        <text x={X(0) + 6} y={Yc(crudos[0]) > arriba + alto / 2 ? Yc(crudos[0]) - 9 : Yc(crudos[0]) + 14}
          textAnchor="start" fontSize={10} fill={C.muted} stroke={C.white} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round"
          style={{ fontVariantNumeric: "tabular-nums" }}>{money(crudos[0])}</text>
        <text x={X(n - 1)} y={Yc(ult) < arriba + 20 ? Yc(ult) + 16 : Yc(ult) - 10} textAnchor="end" fontSize={11} fontWeight={600} stroke={C.white} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round"
          fill={ult >= 0 ? C.pos : C.neg} style={{ fontVariantNumeric: "tabular-nums" }}>{money(ult)}</text>
        {/* eje de años */}
        <line x1={x0} x2={x1} y1={y1} y2={y1} stroke={C.line} strokeWidth={1} />
        {crudos.map((v, i) => (
          <text key={i} x={X(i)} y={y1 + 14} textAnchor="middle" fontSize={9.5} fill={C.muted}
            style={{ fontVariantNumeric: "tabular-nums" }}>{i}</text>
        ))}
        <text x={(x0 + x1) / 2} y={y1 + 30} textAnchor="middle" fontSize={9.5} fill={C.muted}>{unidad}</text>
      </svg>
      {label && <div className="text-[11px] mt-2" style={{ color: C.muted }}>{label}</div>}
    </div>
  );
}

/* ---------- barras horizontales con cero al centro ---------- */
export function BarsChart({ items }) {
  const vals = items.map((o) => (ok(o.v) ? o.v : 0));
  const mx = Math.max(...vals, 0), mn = Math.min(...vals, 0);
  const rng = mx - mn || 1;
  const cero = ((0 - mn) / rng) * 100;
  const COLS = "minmax(96px,130px) minmax(0,1fr) minmax(90px,120px)";
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((o, i) => {
        const v = ok(o.v) ? o.v : 0;
        const pv = ((v - mn) / rng) * 100;
        const col = v >= 0 ? C.accent : C.neg;
        return (
          <div key={i} className="grid items-center gap-3" style={{ gridTemplateColumns: "minmax(96px,130px) minmax(0,1fr) minmax(90px,120px)" }}>
            <div className="text-[12px] text-right leading-tight" style={{ color: C.ink }}>{o.name}</div>
            <div className="relative rounded" style={{ height: 22, background: C.soft, border: `1px solid ${C.line}` }}>
              <div className="absolute" style={{ left: cero + "%", top: -2, bottom: -2, width: 1, background: C.line }} />
              <div className="absolute rounded-sm" style={{ left: Math.min(cero, pv) + "%", width: Math.max(0.6, Math.abs(pv - cero)) + "%", top: 3, bottom: 3, background: col }} />
            </div>
            <div className="text-[12px] font-semibold text-right" style={{ color: col, fontVariantNumeric: "tabular-nums" }}>{money(o.v)}</div>
          </div>
        );
      })}
      {/* escala: qué tan grande es el ancho de la barra */}
      <div className="grid items-center gap-3" style={{ gridTemplateColumns: COLS }}>
        <div />
        <div className="relative h-3.5 text-[9.5px]" style={{ color: C.muted, fontVariantNumeric: "tabular-nums" }}>
          {cero > 6 && <span className="absolute left-0 top-0">{fComp(mn)}</span>}
          <span className="absolute top-0" style={{ left: cero + "%", transform: "translateX(-50%)" }}>$0</span>
          {cero < 94 && <span className="absolute right-0 top-0">{fComp(mx)}</span>}
        </div>
        <div />
      </div>
    </div>
  );
}

/* ---------- dos columnas: supuestos a la izquierda, salidas a la derecha ---------- */
export const Cols = ({ izq, der }) => (
  <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(320px,380px) minmax(0,1fr)", alignItems: "start" }}>
    <div className="min-w-0">{izq}</div>
    <div className="min-w-0">{der}</div>
  </div>
);

/* ---------- encabezado de pestaña ---------- */
export const Head = ({ titulo, texto }) => (
  <div className="mb-4">
    <div className="text-[17px] font-semibold tracking-tight" style={{ color: C.ink }}>{titulo}</div>
    {texto && <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: C.muted, maxWidth: "82ch" }}>{texto}</div>}
  </div>
);
