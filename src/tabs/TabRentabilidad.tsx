import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart, Cell
} from "recharts";

/* ============================================================
   11. RENTABILIDAD Y VALUACIÓN
   ============================================================ */
export default function TabRentabilidad({ s, up, m }: any) {
  const v = s.valuacion;
  const flujoChart = m.flujos.map((f) => ({ y: "Año " + f.y, FCF: Math.round(f.fcf) }));
  const acumChart = m.acumSerie.map((a) => ({ y: "Año " + a.y, Acumulado: Math.round(a.acum) }));

  return (
    <>
      <div className="grid grid-cols-5 gap-3 mb-4">
        <KPI label="Inversión requerida" value={money(m.inversion)} sub="Máxima necesidad de caja" />
        <KPI label="VPN" value={money(m.vpn)} tone={m.vpn >= 0 ? "pos" : "neg"} sub={`Descontado al ${pct(m.waccNom, 1)}`} />
        <KPI label="TIR" value={pct(m.tir)} tone={m.tir >= m.waccNom ? "pos" : "neg"} sub={`vs WACC ${pct(m.waccNom, 1)}`} />
        <KPI label="TIR con perpetuidad" value={pct(m.tirPerp)} tone={m.tirPerp >= m.waccNom ? "pos" : "neg"} />
        <KPI label="Payback descontado" value={m.dpbp ? num(m.dpbp, 2) + " años" : "No recupera"} tone={m.dpbp ? "pos" : "neg"} />
      </div>

      <Card title="Flujo de efectivo libre" sub="NOPAT + depreciación y amortización ± capital de trabajo − inversiones." pad={false}>
        <div className="p-4" style={{ overflowX: "auto" }}>
          <table className="w-full">
            <thead><tr>
              <Th align="left" w="220">Concepto</Th>{m.flujos.map((f) => <Th key={f.y}>Año {f.y}</Th>)}
            </tr></thead>
            <tbody>
              <tr><Td align="left">Utilidad de operación (EBIT)</Td><Td>—</Td>{m.anios.map((a) => <Td key={a.y} color={a.ebit < 0 ? C.neg : undefined}>{money(a.ebit)}</Td>)}</tr>
              <tr><Td align="left">NOPAT</Td>{m.flujos.map((f) => <Td key={f.y} color={f.nopat < 0 ? C.neg : undefined}>{f.y === 0 ? "—" : money(f.nopat)}</Td>)}</tr>
              <tr><Td align="left">+ Depreciación y amortización</Td>{m.flujos.map((f) => <Td key={f.y}>{f.y === 0 ? "—" : money(f.dam)}</Td>)}</tr>
              <tr><Td align="left">± Variación en capital de trabajo</Td>{m.flujos.map((f) => <Td key={f.y} color={f.dCT < 0 ? C.neg : undefined}>{f.y === 0 ? "—" : money(f.dCT)}</Td>)}</tr>
              <tr><Td align="left">− Inversión (CAPEX)</Td>{m.flujos.map((f) => <Td key={f.y} color={f.capex < 0 ? C.neg : undefined}>{money(f.capex)}</Td>)}</tr>
              <tr><Td align="left" bold>Flujo de efectivo libre</Td>{m.flujos.map((f) => <Td key={f.y} bold color={f.fcf < 0 ? C.neg : C.pos}>{money(f.fcf)}</Td>)}</tr>
              <tr><Td align="left" color={C.muted}>Flujo descontado</Td>{m.flujos.map((f) => <Td key={f.y} color={C.muted}>{money(f.fcf / Math.pow(1 + m.waccNom, f.y))}</Td>)}</tr>
              <tr><Td align="left" color={C.muted}>Acumulado descontado</Td>{m.acumSerie.map((a) => <Td key={a.y} color={a.acum < 0 ? C.neg : C.pos}>{money(a.acum)}</Td>)}</tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Recuperación de la inversión">
          <div style={{ height: 230 }}>
            <ResponsiveContainer>
              <BarChart data={acumChart}>
                <CartesianGrid stroke={C.soft} vertical={false} />
                <XAxis dataKey="y" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(x) => nfmt(0).format(x / 1000) + "k"} />
                <Tooltip formatter={(x) => money(x)} contentStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke={C.ink} />
                <Bar dataKey="Acumulado" radius={[3, 3, 0, 0]}>
                  {acumChart.map((d, i) => <Cell key={i} fill={d.Acumulado >= 0 ? C.pos : C.neg} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Flujo de efectivo libre por año">
          <div style={{ height: 230 }}>
            <ResponsiveContainer>
              <BarChart data={flujoChart}>
                <CartesianGrid stroke={C.soft} vertical={false} />
                <XAxis dataKey="y" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(x) => nfmt(0).format(x / 1000) + "k"} />
                <Tooltip formatter={(x) => money(x)} contentStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke={C.ink} />
                <Bar dataKey="FCF" radius={[3, 3, 0, 0]}>
                  {flujoChart.map((d, i) => <Cell key={i} fill={d.FCF >= 0 ? C.accent : C.neg} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Valuación por flujos descontados">
          <table className="w-full">
            <tbody>
              <tr><Td align="left">Valor presente de los flujos ({s.supuestos.horizonte} años)</Td><Td>{money(m.vpOperacion)}</Td></tr>
              <tr><Td align="left">Valor terminal (perpetuidad g = {pct(s.supuestos.gPerp, 1)})</Td><Td>{money(m.vt)}</Td></tr>
              <tr><Td align="left">Valor terminal a valor presente</Td><Td>{money(m.vpVT)}</Td></tr>
              <tr><Td align="left" bold>Valor de la empresa (Enterprise Value)</Td><Td bold>{money(m.ev)}</Td></tr>
              <tr><Td align="left" color={C.muted}>+ Caja</Td><Td><NumIn value={v.caja} dec={0} onChange={(x) => up((n) => { n.valuacion.caja = x; })} /></Td></tr>
              <tr><Td align="left" color={C.muted}>− Pasivos laborales</Td><Td><NumIn value={v.pasLab} dec={0} onChange={(x) => up((n) => { n.valuacion.pasLab = x; })} /></Td></tr>
              <tr><Td align="left" color={C.muted}>− Pasivos financieros</Td><Td><NumIn value={v.pasFin} dec={0} onChange={(x) => up((n) => { n.valuacion.pasFin = x; })} /></Td></tr>
              <tr><Td align="left" bold>Valor del capital (Equity Value)</Td><Td bold>{money(m.equity)}</Td></tr>
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <KPI label="Participación post-money" value={pct(m.pctPost)} sub="Inversión / Equity Value" />
            <KPI label="Participación pre-money" value={pct(m.pctPre)} sub="Inversión / (Equity − Inversión)" />
          </div>
        </Card>

        <Card title="Valuación por múltiplos y contraste">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Múltiplo EBIT del sector"><NumIn value={v.multiplo} dec={2} onChange={(x) => up((n) => { n.valuacion.multiplo = x; })} /></Field>
            <Field label="Inversión (dejar vacío = automática)">
              <NumIn value={v.inversionManual == null ? m.inversionAuto : v.inversionManual} dec={0}
                onChange={(x) => up((n) => { n.valuacion.inversionManual = x; })} />
            </Field>
          </div>
          <table className="w-full">
            <tbody>
              <tr><Td align="left">EBIT mediano del horizonte</Td><Td>{money(m.medEbit)}</Td></tr>
              <tr><Td align="left">Valuación por múltiplo (a valor presente)</Td><Td bold>{money(m.valMultiplo)}</Td></tr>
              <tr><Td align="left">Diferencia contra flujos descontados</Td><Td color={m.valMultiplo - m.ev < 0 ? C.neg : C.pos}>{money(m.valMultiplo - m.ev)}</Td></tr>
              <tr><Td align="left" color={C.muted}>Máxima necesidad de caja (mes)</Td><Td color={C.muted}>{money(m.minMes)}</Td></tr>
              <tr><Td align="left" color={C.muted}>Primer año con utilidad de operación</Td><Td color={C.muted}>{m.anioEquilibrio ? "Año " + m.anioEquilibrio : "Ninguno"}</Td></tr>
              <tr><Td align="left" color={C.muted}>Primer mes con EBIT positivo</Td><Td color={C.muted}>{m.mesEquilibrio >= 0 ? MESES[m.mesEquilibrio] : "Ninguno"}</Td></tr>
            </tbody>
          </table>
          {v.inversionManual != null && (
            <div className="mt-2"><Btn small onClick={() => up((n) => { n.valuacion.inversionManual = null; })}>Volver a inversión automática</Btn></div>
          )}
        </Card>
      </div>

      <Card title="Capital de trabajo por año" sub="El crecimiento se financia con caja antes de generarla.">
        <table className="w-full">
          <thead><tr><Th align="left">Concepto</Th>{m.ct.map((c) => <Th key={c.y}>Año {c.y}</Th>)}</tr></thead>
          <tbody>
            <tr><Td align="left">Cuentas por cobrar</Td>{m.ct.map((c) => <Td key={c.y}>{money(c.cxc)}</Td>)}</tr>
            <tr><Td align="left">Inventarios</Td>{m.ct.map((c) => <Td key={c.y}>{money(c.inv)}</Td>)}</tr>
            <tr><Td align="left">Cuentas por pagar</Td>{m.ct.map((c) => <Td key={c.y}>{money(-c.cxp)}</Td>)}</tr>
            <tr><Td align="left" bold>Capital de trabajo neto</Td>{m.ct.map((c) => <Td key={c.y} bold>{money(c.ctn)}</Td>)}</tr>
            <tr><Td align="left" color={C.muted}>Impacto en el flujo</Td>{m.ct.map((c) => <Td key={c.y} color={c.delta < 0 ? C.neg : C.pos}>{money(c.delta)}</Td>)}</tr>
          </tbody>
        </table>
      </Card>
    </>
  );
}
