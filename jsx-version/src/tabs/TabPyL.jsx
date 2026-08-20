import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart, Cell
} from "recharts";

/* ============================================================
   9. ESTADO DE RESULTADOS
   ============================================================ */
export default function TabPyL({ s, m }) {
  const [vista, setVista] = useState("mensual");
  const cols = vista === "mensual" ? m.meses : m.anios;
  const head = vista === "mensual" ? m.meses.map((x) => x.mes) : m.anios.map((a) => a.label);

  const R = ({ label, f, bold, pctSobre, tone, indent, unidades, total = "sum" }) => {
    const fmt = (v) => (pctSobre ? pct(v) : unidades ? num(v, 0) : money(v));
    return (
      <tr>
        <Td align="left" bold={bold} color={tone === "muted" ? C.muted : undefined}>
          <span style={{ paddingLeft: indent ? 12 : 0 }}>{label}</span>
        </Td>
        {cols.map((c, i) => {
          const v = pctSobre ? (c.ventas ? f(c) / c.ventas : NaN) : f(c);
          return <Td key={i} bold={bold} color={v < 0 ? C.neg : bold ? C.ink : undefined}>{fmt(v)}</Td>;
        })}
        {vista === "mensual" && (
          <Td bold={bold}>
            {pctSobre || total === "none" ? "" : total === "last" ? fmt(f(cols[cols.length - 1])) : fmt(cols.reduce((a, c) => a + f(c), 0))}
          </Td>
        )}
      </tr>
    );
  };

  const chart = m.meses.map((x) => ({ mes: x.mes, Ventas: Math.round(x.ventas), EBITDA: Math.round(x.ebitda), Acumulada: Math.round(x.acum) }));

  return (
    <>
      <Card title="Estado de resultados proyectado"
        right={<div className="flex gap-2">
          <Btn small kind={vista === "mensual" ? "dark" : "ghost"} onClick={() => setVista("mensual")}>Año 1 mensual</Btn>
          <Btn small kind={vista === "anual" ? "dark" : "ghost"} onClick={() => setVista("anual")}>{s.supuestos.horizonte} años</Btn>
        </div>} pad={false}>
        <div style={{ overflowX: "auto" }} className="p-4">
          <table className="w-full" style={{ minWidth: vista === "mensual" ? 1200 : 700 }}>
            <thead><tr>
              <Th align="left" w="180">Concepto</Th>
              {head.map((h) => <Th key={h}>{h}</Th>)}
              {vista === "mensual" && <Th>Total</Th>}
            </tr></thead>
            <tbody>
              <R label="Unidades" f={(c) => c.unidades} tone="muted" unidades />
              <R label="Ventas" f={(c) => c.ventas} bold />
              <R label="Materiales" f={(c) => -c.mp} indent />
              <R label="Nómina directa" f={(c) => -c.nomina} indent />
              <R label="Costos directos de producción" f={(c) => -c.cpDir} indent />
              <R label="Costos indirectos de producción" f={(c) => -c.cpInd} indent />
              <R label="Utilidad bruta" f={(c) => c.ub} bold />
              <R label="% sobre ventas" f={(c) => c.ub} pctSobre tone="muted" />
              <R label="Gastos fijos" f={(c) => -c.gFijo} indent />
              <R label="Gastos variables de venta" f={(c) => -c.gVar} indent />
              <R label="EBITDA" f={(c) => c.ebitda} bold />
              <R label="% sobre ventas" f={(c) => c.ebitda} pctSobre tone="muted" />
              <R label="Depreciación" f={(c) => -c.dep} indent />
              <R label="Amortización" f={(c) => -c.amo} indent />
              <R label="Utilidad de operación (EBIT)" f={(c) => c.ebit} bold />
              <R label="Gasto financiero" f={(c) => -c.fin} indent />
              <R label="Utilidad antes de impuestos" f={(c) => c.uai} />
              <R label="ISR + PTU" f={(c) => -c.imp} indent />
              <R label="Utilidad neta" f={(c) => c.neta} bold />
              <R label="% sobre ventas" f={(c) => c.neta} pctSobre tone="muted" />
              <R label="Utilidad acumulada" f={(c) => c.acum} bold total="last" />
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Curva J — utilidad acumulada Año 1" sub="El punto más bajo es la caja que tienes que poner.">
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <ComposedChart data={chart}>
                <CartesianGrid stroke={C.soft} vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => nfmt(0).format(v / 1000) + "k"} />
                <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke={C.ink} />
                <Bar dataKey="EBITDA" fill={C.ink} radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="Acumulada" stroke={C.accent} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Punto de equilibrio operativo" sub="Cuánto tienes que vender para no perder.">
          <div className="grid grid-cols-2 gap-3">
            <KPI label="Unidades de equilibrio / año" value={num(m.peUnidades, 0)} />
            <KPI label="Venta de equilibrio" value={money(m.pePesos)} />
            <KPI label="Margen de contribución unitario" value={money(m.cmuProm, 2)} />
            <KPI label="Costos fijos totales Año 1" value={money(m.costosFijosAnio1)} />
          </div>
          <div className="mt-3 text-[12px] px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
            {isFinite(m.peUnidades) && m.unidadesAnio[0] > 0 ? (
              m.unidadesAnio[0] >= m.peUnidades
                ? <>El plan del Año 1 supera el equilibrio por <b style={{ color: C.pos }}>{pct(m.unidadesAnio[0] / m.peUnidades - 1)}</b>. Ese es tu colchón antes de perder dinero.</>
                : <>El plan del Año 1 queda <b style={{ color: C.neg }}>{pct(1 - m.unidadesAnio[0] / m.peUnidades)}</b> por debajo del equilibrio. El Año 1 cierra en pérdida por diseño.</>
            ) : "Captura precios y costos para calcular el equilibrio."}
          </div>
        </Card>
      </div>
    </>
  );
}
