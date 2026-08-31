import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart, Cell
} from "recharts";

/* ============================================================
   7. PLAN DE VENTAS
   ============================================================ */
export default function TabPlan({ s, up, m, L }: any) {
  const data = m.meses.map((x) => ({ mes: x.mes, Ventas: Math.round(x.ventas), Unidades: x.unidades }));
  return (
    <>
      {/* Las piezas del mes se capturan en el Forecast, en el renglón «Piezas
          totales». Aquí sólo se leen: por eso van en negro y sin caja de captura. */}
      <Card title="Plan de unidades — Año 1" sub="Mes a mes. Aquí se decide si el proyecto arranca o se ahoga.">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(12, minmax(0,1fr))" }}>
          {MESES.map((mes, i) => (
            <Field key={mes} label={mes}>
              <div className="w-full px-2 py-1.5 rounded text-[13px] text-right"
                style={{ background: C.soft, border: `1px solid ${C.line}`, color: C.ink, fontVariantNumeric: "tabular-nums" }}>
                {num(m.meses[i]?.unidades || 0, 0)}
              </div>
            </Field>
          ))}
        </div>
        <div className="mt-2 text-[11px]" style={{ color: C.muted }}>
          Estas piezas ya no se capturan aquí: vienen del <b style={{ color: C.ink }}>Forecast</b>, del renglón «Piezas totales».
          Cámbialas ahí y este plan y todo lo que cuelga de él se recalculan solos.
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          <KPI label="Unidades Año 1" value={num(m.unidadesAnio[0], 0)} />
          <KPI label="Ventas Año 1" value={money(m.anios[0]?.ventas)} />
          <KPI label="Precio promedio ponderado" value={money(m.precioProm, 2)} />
          <KPI label="Ticket variable unitario" value={money(m.cvProm, 2)} sub="Materiales + gasto por unidad" />
        </div>
      </Card>

      <Card title="Crecimiento de años siguientes">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${s.supuestos.horizonte - 1}, minmax(0,1fr))` }}>
          {Array.from({ length: s.supuestos.horizonte - 1 }).map((_, i) => (
            <Field key={i} label={`Año ${i + 2} vs Año ${i + 1}`}>
              <PctIn value={s.plan.crec[i] || 0} dec={1} onChange={(v) => up((n) => { n.plan.crec[i] = v; })} />
            </Field>
          ))}
        </div>
        <table className="w-full mt-4">
          <thead><tr><Th align="left">Concepto</Th>{m.anios.map((a) => <Th key={a.y}>{a.label}</Th>)}</tr></thead>
          <tbody>
            <tr><Td align="left">Unidades</Td>{m.anios.map((a) => <Td key={a.y}>{num(a.unidades, 0)}</Td>)}</tr>
            <tr><Td align="left">Ventas</Td>{m.anios.map((a) => <Td key={a.y} bold>{money(a.ventas)}</Td>)}</tr>
          </tbody>
        </table>
      </Card>

      <Card title="Estacionalidad de la venta">
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.soft} vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => nfmt(0).format(v / 1000) + "k"} />
              <Tooltip formatter={(v, n) => (n === "Ventas" ? money(v) : num(v, 0))} contentStyle={{ fontSize: 12, border: `1px solid ${C.line}` }} />
              <Bar dataKey="Ventas" fill={C.accent} radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
