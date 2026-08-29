import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import { computeModel } from "../lib/model";

/* ============================================================
   12. ESCENARIOS Y SENSIBILIDAD
   ============================================================ */
export default function TabSensibilidad({ s, m }) {
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
    const casos = [
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

  /* ¿Qué pasa si…? — los mismos dos ejes de la matriz, pero con el incremento
     que se le antoje al usuario. La matriz de arriba queda como está: sirve
     para leer la forma del riesgo de un vistazo; esto es para la pregunta
     puntual que sale en la junta ("¿y si bajo el precio 3.5%?"). */
  const [qp, setQp] = useState(0);
  const [qv, setQv] = useState(0);
  const hay = qp !== 0 || qv !== 0;

  const esc = useMemo(() => {
    const c = JSON.parse(JSON.stringify(s));
    c.productos.forEach((p) => { p.precio = p.precio * (1 + qp); });
    c.plan.unidadesMes = c.plan.unidadesMes.map((u) => u * (1 + qv));
    return computeModel(c);
  }, [s, qp, qv]);

  /* hasta dónde aguanta el precio antes de que el VPN se haga cero, con el
     volumen que se esté probando: se busca por bisección porque el VPN no
     tiene forma cerrada contra el precio (arrastra impuestos, crédito y CT) */
  const quiebre = useMemo(() => {
    const vpnDe = (dp) => {
      const c = JSON.parse(JSON.stringify(s));
      c.productos.forEach((p) => { p.precio = p.precio * (1 + dp); });
      c.plan.unidadesMes = c.plan.unidadesMes.map((u) => u * (1 + qv));
      return computeModel(c).vpn;
    };
    let lo = -0.9, hi = 2;
    if (vpnDe(lo) > 0 || vpnDe(hi) < 0) return NaN;
    for (let k = 0; k < 34; k++) { const mid = (lo + hi) / 2; if (vpnDe(mid) >= 0) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  }, [s, qv]);

  const filas = [
    { lab: "VPN", base: m.vpn, val: esc.vpn, fmt: (x) => money(x), tono: true },
    { lab: "TIR", base: m.tir, val: esc.tir, fmt: (x) => (isFinite(x) ? pct(x) : "—"), tono: true, dif: (a, b) => pct(b - a, 1) },
    { lab: "Valor de la empresa", base: m.ev, val: esc.ev, fmt: (x) => money(x), tono: true },
    { lab: "Ventas Año 1", base: m.anios[0]?.ventas || 0, val: esc.anios[0]?.ventas || 0, fmt: (x) => money(x) },
    { lab: "EBITDA Año 1", base: m.anios[0]?.ebitda || 0, val: esc.anios[0]?.ebitda || 0, fmt: (x) => money(x), tono: true },
    { lab: "Payback descontado", base: m.dpbp, val: esc.dpbp, fmt: (x) => (x ? num(x, 2) + " años" : "No recupera"), dif: (a, b) => (a && b ? num(b - a, 2) + " años" : "—") },
    { lab: "Máxima necesidad de caja", base: m.minMes, val: esc.minMes, fmt: (x) => money(x), tono: true },
    { lab: "Uso de capacidad", base: m.capacidad.uso, val: esc.capacidad.uso, fmt: (x) => pct(x), dif: (a, b) => pct(b - a, 1) },
  ];
  const pasos = [-10, -5, -2.5, -1, 1, 2.5, 5, 10];

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

      {/* ---------- Escenario a la medida, justo debajo de la matriz ---------- */}
      <Card title="¿Qué pasa si…?"
        sub="Los mismos dos ejes de arriba, pero con el incremento que tú quieras: escribe el porcentaje y el modelo se recalcula completo."
        right={hay ? <Btn small onClick={() => { setQp(0); setQv(0); }}>Volver al base</Btn> : null}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { lab: "Precio de venta", val: qp, set: setQp, hint: "Se aplica al precio de lista de todos los productos." },
            { lab: "Volumen", val: qv, set: setQv, hint: "Se aplica a las unidades de los 12 meses del Forecast." },
          ].map((eje) => (
            <div key={eje.lab}>
              <Field label={eje.lab} hint={eje.hint}><PctIn value={eje.val} dec={2} onChange={eje.set} /></Field>
              {/* los saltos de un clic evitan teclear los casos de siempre */}
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {pasos.map((x) => (
                  <Btn key={x} small onClick={() => eje.set(Math.round((eje.val + x / 100) * 10000) / 10000)}>
                    {x > 0 ? "+" : ""}{x}%
                  </Btn>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-[12.5px] mb-3 px-3 py-2 rounded" style={{ background: hay ? (esc.vpn >= 0 ? "#F2F8F4" : "#FDF1F0") : C.soft, color: C.ink }}>
          {hay ? (
            <>Con el precio <b>{qp >= 0 ? "+" : ""}{pct(qp, 2)}</b> y el volumen <b>{qv >= 0 ? "+" : ""}{pct(qv, 2)}</b>, el VPN pasa
              de <b>{money(m.vpn)}</b> a <b style={{ color: color(esc.vpn) }}>{money(esc.vpn)}</b>{" "}
              ({esc.vpn - m.vpn >= 0 ? "+" : "−"}{money(Math.abs(esc.vpn - m.vpn))}).
              {esc.capacidad.uso > 1 && <b style={{ color: C.neg }}> Ojo: ese volumen ya no cabe en la capacidad instalada ({pct(esc.capacidad.uso)}).</b>}</>
          ) : (
            <span style={{ color: C.muted }}>Mueve alguno de los dos porcentajes para ver el escenario. En cero, es el modelo tal como está capturado.</span>
          )}
        </div>

        <table className="w-full">
          <thead><tr>
            <Th align="left" w="34%">Indicador</Th><Th>Base</Th><Th>Escenario</Th><Th>Diferencia</Th>
          </tr></thead>
          <tbody>
            {filas.map((f) => {
              const d = (f.val || 0) - (f.base || 0);
              return (
                <tr key={f.lab}>
                  <Td align="left">{f.lab}</Td>
                  <Td color={C.muted}>{f.fmt(f.base)}</Td>
                  <Td bold color={f.tono ? color(f.val) : C.ink}>{f.fmt(f.val)}</Td>
                  <Td color={!hay ? C.muted : d === 0 ? C.muted : d > 0 ? C.pos : C.neg}>
                    {!hay ? "—" : f.dif ? f.dif(f.base, f.val) : (d >= 0 ? "+" : "−") + money(Math.abs(d))}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="text-[11.5px] mt-3 px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
          {isFinite(quiebre)
            ? <>Con el volumen {qv >= 0 ? "+" : ""}{pct(qv, 2)}, el precio aguanta hasta{" "}
              <b style={{ color: C.ink }}>{quiebre >= 0 ? "+" : ""}{pct(quiebre, 2)}</b> antes de que el VPN se haga cero
              {qp !== 0 && <> — hoy estás probando {qp >= 0 ? "+" : ""}{pct(qp, 2)}, o sea {pct(Math.abs(qp - quiebre), 2)} {qp > quiebre ? "de holgura" : "por debajo del límite"}</>}.
              Es el mismo cálculo de la matriz de arriba, resuelto al revés.</>
            : <>Con este volumen no hay un precio que ponga el VPN en cero dentro de un rango razonable (−90% a +200%).</>}
        </div>
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
