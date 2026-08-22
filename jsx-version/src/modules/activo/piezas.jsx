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

/* Valor derivado: negro, alineado a la derecha, nunca editable */
export const Derivado = ({ label, hint, valor }) => (
  <Row label={label} hint={hint}>
    <div className="text-[13px] font-semibold text-right pr-2" style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
  </Row>
);

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

/* ---------- veredicto ---------- */
export function Veredicto({ tono, texto }) {
  const col = tono === "ok" ? C.pos : tono === "no" ? C.neg : "#8A5D0C";
  const bg = tono === "ok" ? "#E9F3ED" : tono === "no" ? "#FBEAE8" : "#FAF2DF";
  const marca = tono === "ok" ? "✓" : tono === "no" ? "✕" : "!";
  return (
    <div className="rounded-md px-3.5 py-2.5 mt-3 flex items-start gap-2.5" style={{ background: bg, border: `1px solid ${col}` }}>
      <div className="text-[13px] font-bold leading-5" style={{ color: col }}>{marca}</div>
      <div className="text-[12.5px] leading-relaxed" style={{ color: C.ink }}>{texto}</div>
    </div>
  );
}

/* ---------- nota al pie de una tarjeta ---------- */
export const Nota = ({ children }) => (
  <div className="text-[11.5px] leading-relaxed px-4 py-2.5" style={{ color: C.muted, background: C.soft, borderTop: `1px solid ${C.line}` }}>{children}</div>
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
          {rows.map((r, i) => (
            <tr key={i} style={{ background: r.hi ? C.accentSoft : undefined }}>
              {r.cells.map((c, j) => {
                const obj = c && typeof c === "object";
                const txt = obj ? c.t : c;
                const neg = obj && c.neg;
                return j === 0 ? (
                  <th key={j} className="text-[11.5px] px-2 py-1.5 text-left whitespace-nowrap"
                    style={{ color: C.ink, fontWeight: r.sum || r.hi ? 600 : 400, borderBottom: `1px solid ${C.soft}`, borderRight: `1px solid ${C.line}` }}>{txt}</th>
                ) : (
                  <td key={j} className="px-2 py-1.5 text-[11.5px] text-right whitespace-nowrap"
                    style={{ color: neg ? C.neg : C.ink, fontWeight: r.sum || r.hi ? 600 : 400, borderBottom: `1px solid ${C.soft}`, fontVariantNumeric: "tabular-nums" }}>{txt}</td>
                );
              })}
            </tr>
          ))}
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
