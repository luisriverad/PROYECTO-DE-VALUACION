import React, { useMemo } from "react";
import { C } from "../../lib/theme";
import { Card, NumIn, PctIn } from "../../components/ui";
import { Head, Stats, Veredicto, Nota, fM, fP, fP2 } from "./piezas";
import { calcMaq } from "../../lib/activos";
import { money } from "../../lib/format";

/* ============================================================
   ACTIVO · 9. ESCENARIOS
   El modelo de maquinaria se corre tres veces completo y se pondera.
   ============================================================ */
const FILAS = [
  { k: "ing1", label: "Ingresos o ahorros año 1", tipo: "money" },
  { k: "gIng", label: "Crecimiento de ingresos", tipo: "pct" },
  { k: "cos1", label: "Costos año 1", tipo: "money" },
  { k: "precio", label: "Precio del equipo", tipo: "money" },
  { k: "rv", label: "Valor de rescate", tipo: "money" },
  { k: "ve", label: "Vida económica (años)", tipo: "int" },
];
const NOMBRES = ["Pesimista", "Base", "Optimista"];

export default function TabEscenarios({ A, up, R }: any) {
  const vpns = useMemo(() => [0, 1, 2].map((idx) => {
    const ov: any = {};
    FILAS.forEach((f) => { ov[f.k] = A.esc[f.k][idx]; });
    return calcMaq(A, R.sup, ov).vpn;
  }), [A, R.sup]);

  const probs = [A.esc.p1, A.esc.p2, A.esc.p3];
  const esperado = probs.reduce((s, p, i) => s + p * vpns[i], 0);
  const pPerdida = probs.reduce((s, p, i) => s + (vpns[i] < 0 ? p : 0), 0);
  const peor = Math.min(...vpns);
  const rango = Math.max(...vpns) - peor;
  const suma = probs.reduce((s, p) => s + p, 0);

  const setCelda = (k, idx, v) => up((n) => { n.esc[k][idx] = k === "ve" ? Math.max(1, Math.round(v)) : v; });
  const setProb = (pk, v) => up((n) => { n.esc[pk] = v; });

  const Celda = ({ f, idx }: any) => (
    <td className="px-2 py-1.5" style={{ borderBottom: `1px solid ${C.soft}`, minWidth: 130 }}>
      {f.tipo === "pct"
        ? <PctIn value={A.esc[f.k][idx]} onChange={(v) => setCelda(f.k, idx, v)} />
        : <NumIn value={A.esc[f.k][idx]} dec={0} plain={f.tipo === "int"} onChange={(v) => setCelda(f.k, idx, v)} />}
    </td>
  );

  return (
    <>
      <Head titulo="Escenarios"
        texto="Un solo VPN no dice qué tan malo puede ser. Aquí el modelo de maquinaria se corre tres veces completo, con sus propios supuestos, y se pondera. Cambia cualquier celda y los tres VPN se recalculan solos." />

      <Card title="Supuestos de cada escenario" pad={false}>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Variable", ...NOMBRES].map((h, i) => (
                  <th key={h} className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-2 ${i === 0 ? "text-left" : "text-right"}`}
                    style={{ color: C.muted, background: C.soft, borderBottom: `1px solid ${C.line}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FILAS.map((f) => (
                <tr key={f.k}>
                  <th className="text-[12px] px-2 py-1.5 text-left font-normal whitespace-nowrap"
                    style={{ color: C.ink, borderBottom: `1px solid ${C.soft}`, borderRight: `1px solid ${C.line}`, minWidth: 220 }}>{f.label}</th>
                  {[0, 1, 2].map((idx) => <Celda key={idx} f={f} idx={idx} />)}
                </tr>
              ))}
              <tr>
                <th className="text-[12px] px-2 py-1.5 text-left font-semibold whitespace-nowrap"
                  style={{ color: C.tasaTexto, background: C.tasaBg, borderBottom: `1px solid ${C.tasaLinea}`, borderTop: `1px solid ${C.tasaLinea}`, borderRight: `1px solid ${C.line}` }}>
                  Tasa de descuento
                  <div className="text-[10.5px] italic font-normal" style={{ color: C.muted }}>Igual en los tres. Se define en la pestaña «Tasa de descuento»</div>
                </th>
                {[0, 1, 2].map((idx) => (
                  <td key={idx} className="px-2 py-1.5 text-[14px] text-right font-semibold"
                    style={{ color: C.ink, background: C.tasaBg, borderBottom: `1px solid ${C.tasaLinea}`, borderTop: `1px solid ${C.tasaLinea}`, fontVariantNumeric: "tabular-nums" }}>{fP2(R.sup.tasas.maq)}</td>
                ))}
              </tr>
              <tr>
                <th className="text-[12px] px-2 py-1.5 text-left font-semibold whitespace-nowrap"
                  style={{ color: C.ink, borderBottom: `1px solid ${C.soft}`, borderRight: `1px solid ${C.line}`, borderTop: `1px solid ${C.line}` }}>Probabilidad asignada</th>
                {["p1", "p2", "p3"].map((pk) => (
                  <td key={pk} className="px-2 py-1.5" style={{ borderBottom: `1px solid ${C.soft}`, borderTop: `1px solid ${C.line}` }}>
                    <PctIn value={A.esc[pk]} dec={1} onChange={(v) => setProb(pk, v)} />
                  </td>
                ))}
              </tr>
              <tr style={{ background: C.accentSoft }}>
                <th className="text-[12px] px-2 py-2 text-left font-semibold whitespace-nowrap"
                  style={{ color: C.ink, background: C.accentSoft, borderRight: `1px solid ${C.line}` }}>VPN resultante</th>
                {vpns.map((v, i) => (
                  <td key={i} className="px-2 py-2 text-[13px] text-right font-semibold"
                    style={{ color: v < 0 ? C.neg : C.pos, fontVariantNumeric: "tabular-nums" }}>{money(v)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <Nota>
          Sé coherente dentro de cada escenario: si en el pesimista baja el volumen, normalmente también baja el
          precio. La tasa de descuento ya no se captura escenario por escenario — los tres se descuentan a la
          misma, la que define la pestaña <b>Tasa de descuento</b>, para que lo único que cambie entre columnas
          sea el negocio y no la vara con que lo mides. Si lo que quieres es ver qué pasa al mover la tasa, ésa
          es la pestaña de sensibilidad.
        </Nota>
      </Card>

      <Card title="Resultado ponderado">
        <Stats items={[
          { k: "VPN esperado", valor: esperado, clave: true },
          { k: "Probabilidad de pérdida", valor: pPerdida, fmt: fP, signo: false, n: "Peso de los escenarios con VPN negativo" },
          { k: "Peor caso", valor: peor, n: "Cuánto puedes perder" },
          { k: "Rango", valor: rango, signo: false },
          { k: "Suma de probabilidades", valor: suma, fmt: fP, signo: false, n: "Debe dar 100%" },
        ]} />
        {(() => {
          if (Math.abs(suma - 1) > 0.005)
            return <Veredicto tono="mid" texto={`Las probabilidades suman ${fP(suma)}. Ajústalas a 100% para que el promedio signifique algo.`} />;
          if (esperado <= 0) return <Veredicto tono="no" texto="No pasa: el VPN esperado es negativo." />;
          if (pPerdida > 0.30)
            return <Veredicto tono="mid" texto={`Pasa, pero hay ${fP(pPerdida)} de probabilidad de perder. Define desde ahora cómo te sales si el escenario malo se cumple.`} />;
          return <Veredicto tono="ok" texto="Pasa con margen razonable." />;
        })()}
        <div className="mt-3">
          <Nota>Un VPN esperado positivo con 40% de probabilidad de pérdida no es un buen proyecto: es una apuesta. Antes de firmar, pregúntate si la empresa aguanta el escenario pesimista completo.</Nota>
        </div>
      </Card>
    </>
  );
}
