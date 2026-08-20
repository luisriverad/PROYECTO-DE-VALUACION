import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import { computeModel } from "../lib/model";

/* ============================================================
   12. ESCENARIOS Y SENSIBILIDAD
   ============================================================ */
export default function TabSensibilidad({ s, m }: any) {
  const deltas = [-0.2, -0.1, 0, 0.1, 0.2];

  const grid = useMemo(() => {
    return deltas.map((dp) =>
      deltas.map((dv) => {
        const c = JSON.parse(JSON.stringify(s));
        c.productos.forEach((p) => { p.precio = p.precio * (1 + dp); });
        c.plan.unidadesMes = c.plan.unidadesMes.map((u) => u * (1 + dv));
        const r = computeModel(c);
        return { vpn: r.vpn, tir: r.tir };
      })
    );
  }, [s]);

  const variables = useMemo(() => {
    const base = m.vpn;
    const casos: any[] = [
      ["Precio de venta", (c, f) => c.productos.forEach((p) => { p.precio *= f; })],
      ["Volumen", (c, f) => { c.plan.unidadesMes = c.plan.unidadesMes.map((u) => u * f); }],
      ["Costo de materiales", (c, f) => c.insumos.forEach((i) => { i.costoLote *= f; })],
      ["Nómina directa", (c, f) => c.recursosMO.forEach((r) => { r.sueldoMensual *= f; })],
      ["Gastos fijos", (c, f) => { ["admin", "oper", "venta"].forEach((k) => c.gastos[k].forEach((g) => { g.m1 *= f; g.m2 *= f; })); }],
      ["WACC", (c, f) => { c.wacc.conv = c.wacc.conv + (f - 1) * 0.5; }],
    ];
    return casos.map(([nombre, fn]) => {
      const calc = (f) => { const c = JSON.parse(JSON.stringify(s)); fn(c, f); return computeModel(c).vpn; };
      const menos = calc(0.9), mas = calc(1.1);
      return { nombre, menos, mas, rango: Math.abs(mas - menos), base };
    }).sort((a, b) => b.rango - a.rango);
  }, [s, m.vpn]);

  const maxRango = Math.max(...variables.map((v) => v.rango), 1);
  const color = (v) => (v >= 0 ? C.pos : C.neg);

  return (
    <>
      <Card title="Sensibilidad del VPN" sub="Cada celda recalcula el modelo completo: precio contra volumen.">
        <table className="w-full">
          <thead><tr>
            <Th align="left" w="120">Precio ↓ / Volumen →</Th>
            {deltas.map((d) => <Th key={d}>{d > 0 ? "+" : ""}{pct(d, 0)}</Th>)}
          </tr></thead>
          <tbody>
            {deltas.map((dp, i) => (
              <tr key={dp}>
                <Td align="left" bold>{dp > 0 ? "+" : ""}{pct(dp, 0)}</Td>
                {deltas.map((dv, j) => {
                  const cell = grid[i][j];
                  const esBase = dp === 0 && dv === 0;
                  return (
                    <Td key={dv} bold={esBase} bg={esBase ? C.accentSoft : cell.vpn >= 0 ? "#F2F8F4" : "#FDF1F0"} color={color(cell.vpn)}>
                      <div>{money(cell.vpn)}</div>
                      <div className="text-[10px]" style={{ color: C.muted }}>TIR {pct(cell.tir, 0)}</div>
                    </Td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] mt-2" style={{ color: C.muted }}>Celda marcada: escenario base. Verde: VPN positivo. Rojo: destruye valor.</div>
      </Card>

      <Card title="¿Qué variable mueve realmente el resultado?" sub="Impacto en el VPN de una variación de ±10% en cada variable.">
        <div className="space-y-2">
          {variables.map((v) => {
            const w = (v.rango / maxRango) * 100;
            return (
              <div key={v.nombre} className="flex items-center gap-3">
                <div className="text-[12px] w-40 shrink-0">{v.nombre}</div>
                <div className="flex-1 h-6 rounded relative" style={{ background: C.soft }}>
                  <div className="h-6 rounded" style={{ width: w + "%", background: C.accent }} />
                </div>
                <div className="text-[11px] w-56 shrink-0 text-right" style={{ color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: color(v.menos) }}>{money(v.menos)}</span>
                  {" → "}
                  <span style={{ color: color(v.mas) }}>{money(v.mas)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[11.5px] mt-3 px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
          La variable de arriba es donde se juega el proyecto. Ahí es donde vale la pena invertir tiempo de gestión, no en la de abajo.
        </div>
      </Card>
    </>
  );
}
