import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart, Cell
} from "recharts";

/* ============================================================
   9. FORECAST
   ============================================================ */
export default function TabPyL({ s, up, m }) {
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

  const mixTotal = s.productos.reduce((a, p) => a + (p.mix || 0), 0);
  const mixOk = Math.abs(mixTotal - 1) <= 0.001;

  const chart = m.meses.map((x) => ({ mes: x.mes, Ventas: Math.round(x.ventas), EBITDA: Math.round(x.ebitda), Acumulada: Math.round(x.acum) }));

  return (
    <>
      <Card title="Forecast" sub="Las piezas por modelo mandan: cámbialas aquí y todo el estado financiero se recalcula."
        right={<div className="flex gap-2">
          <Btn small kind={vista === "mensual" ? "dark" : "ghost"} onClick={() => setVista("mensual")}>Año 1 mensual</Btn>
          <Btn small kind={vista === "anual" ? "dark" : "ghost"} onClick={() => setVista("anual")}>{s.supuestos.horizonte} años</Btn>
        </div>} pad={false}>
        <div style={{ overflowX: "auto" }} className="p-4">
          <table className="w-full" style={{ minWidth: vista === "mensual" ? 1320 : 780 }}>
            <thead><tr>
              <Th align="left" w="240">Concepto</Th>
              {head.map((h) => <Th key={h}>{h}</Th>)}
              {vista === "mensual" && <Th>Total</Th>}
            </tr></thead>
            <tbody>
              <tr>
                <Td align="left" bold bg={C.soft} colSpan={cols.length + (vista === "mensual" ? 2 : 1)}>
                  <div className="flex items-center justify-between gap-4">
                    <span>Piezas por modelo — es lo que mueve todo el forecast</span>
                    <span className="text-[11px] font-normal" style={{ color: mixOk ? C.pos : C.neg }}>
                      {mixOk
                        ? `Mix completo · ${pct(mixTotal, 1)}`
                        : `El mix suma ${pct(mixTotal, 1)}: ajusta los porcentajes hasta llegar a 100%`}
                    </span>
                  </div>
                </Td>
              </tr>
              {s.productos.map((p, iProd) => (
                <tr key={p.id}>
                  <Td align="left" color={C.muted}>
                    <div className="flex items-center gap-2" style={{ paddingLeft: 12 }}>
                      <span className="flex-1">{p.nombre}</span>
                      <div style={{ width: 74 }}>
                        <PctIn value={p.mix || 0} dec={1} onChange={(v) => up((n) => { n.productos[iProd].mix = v; })} />
                      </div>
                    </div>
                  </Td>
                  {cols.map((c, i) => <Td key={i} color={C.muted}>{num((c.unidades || 0) * (p.mix || 0), 0)}</Td>)}
                  {vista === "mensual" && <Td color={C.muted}>{num(cols.reduce((a, c) => a + (c.unidades || 0) * (p.mix || 0), 0), 0)}</Td>}
                </tr>
              ))}
              <tr>
                <Td align="left" bold>Piezas totales</Td>
                {cols.map((c, i) => (
                  <Td key={i} bold>
                    {vista === "mensual"
                      ? <NumIn value={s.plan.unidadesMes[i]} dec={0} plain align="right" onChange={(v) => up((n) => { n.plan.unidadesMes[i] = v; })} />
                      : num(c.unidades, 0)}
                  </Td>
                ))}
                {vista === "mensual" && <Td bold>{num(cols.reduce((a, c) => a + (c.unidades || 0), 0), 0)}</Td>}
              </tr>
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
          <div className="text-[11px] mt-3" style={{ color: C.muted }}>
            Captura el porcentaje del mix junto a cada modelo — entre todos deben sumar 100% o el volumen no se reparte completo.
            Es el mismo campo de Pricing, igual que las piezas totales son el mismo campo del Plan de ventas:
            los cambies donde los cambies, es el mismo número.
          </div>
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
