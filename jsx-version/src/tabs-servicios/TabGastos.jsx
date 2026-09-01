import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   5. GASTOS
   ============================================================ */
export default function TabGastos({ s, up, m }) {
  const bloques = [
    ["admin", "Gastos administrativos"],
    ["oper", "Gastos operativos"],
    ["venta", "Gastos de venta"],
  ];
  const anioCambio = s.supuestos.anioCambioGastos;
  return (
    <>
      <div className="text-[12px] mb-3 px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
        Captura el gasto <b style={{ color: C.ink }}>mensual</b>. La segunda columna es la estructura a la que migras a partir del <b style={{ color: C.ink }}>Año {anioCambio}</b> (nuevas contrataciones, cambio de oficinas, etc.).
      </div>

      {bloques.map(([k, titulo]) => {
        const arr = s.gastos[k];
        const t1 = arr.reduce((a, g) => a + (g.m1 || 0), 0), t2 = arr.reduce((a, g) => a + (g.m2 || 0), 0);
        return (
          <Card key={k} title={titulo}
            right={<Btn small kind="primary" onClick={() => up((n) => { n.gastos[k].push({ id: uid(), nombre: "Nuevo concepto", m1: 0, m2: 0 }); })}>+ Agregar</Btn>}>
            {arr.length === 0 ? <Empty texto="Sin conceptos." /> : (
              <table className="w-full">
                <thead><tr>
                  <Th align="left" w="45%">Concepto</Th><Th>Mensual Año 1–{anioCambio - 1}</Th><Th>Mensual Año {anioCambio}+</Th><Th>Anual Año 1</Th><Th w="40"></Th>
                </tr></thead>
                <tbody>
                  {arr.map((g, i) => (
                    <tr key={g.id}>
                      <Td align="left"><TxtIn value={g.nombre} onChange={(v) => up((n) => { n.gastos[k][i].nombre = v; })} /></Td>
                      <Td><NumIn value={g.m1} dec={0} onChange={(v) => up((n) => { n.gastos[k][i].m1 = v; })} /></Td>
                      <Td><NumIn value={g.m2} dec={0} onChange={(v) => up((n) => { n.gastos[k][i].m2 = v; })} /></Td>
                      <Td color={C.muted}>{money(g.m1 * 12)}</Td>
                      <Td><Btn small kind="danger" onClick={() => up((n) => { n.gastos[k].splice(i, 1); })}>×</Btn></Td>
                    </tr>
                  ))}
                  <tr><Td align="left" bold>Total</Td><Td bold>{money(t1)}</Td><Td bold>{money(t2)}</Td><Td bold>{money(t1 * 12)}</Td><Td></Td></tr>
                </tbody>
              </table>
            )}
          </Card>
        );
      })}

      <Card title="Gastos variables por unidad vendida" sub="Empaque, comisiones, envío: todo lo que solo existe si vendes."
        right={<Btn small kind="primary" onClick={() => up((n) => { n.gastos.porPieza.push({ id: uid(), nombre: "Nuevo concepto", costo: 0 }); })}>+ Agregar</Btn>}>
        {s.gastos.porPieza.length === 0 ? <Empty texto="Sin conceptos." /> : (
          <table className="w-full">
            <thead><tr><Th align="left" w="55%">Concepto</Th><Th>Costo por unidad</Th><Th w="40"></Th></tr></thead>
            <tbody>
              {s.gastos.porPieza.map((g, i) => (
                <tr key={g.id}>
                  <Td align="left"><TxtIn value={g.nombre} onChange={(v) => up((n) => { n.gastos.porPieza[i].nombre = v; })} /></Td>
                  <Td><NumIn value={g.costo} onChange={(v) => up((n) => { n.gastos.porPieza[i].costo = v; })} /></Td>
                  <Td><Btn small kind="danger" onClick={() => up((n) => { n.gastos.porPieza.splice(i, 1); })}>×</Btn></Td>
                </tr>
              ))}
              <tr><Td align="left" bold>Total por unidad</Td><Td bold>{money(m.costoPorPieza, 2)}</Td><Td></Td></tr>
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Absorción de gasto en el costo" sub="Cada unidad tiene que cargar su parte del gasto de estructura.">
        <div className="grid grid-cols-4 gap-3">
          <KPI label="Gasto total Año 1" value={money(m.gastoTotalAnio1)} sub="Fijos + variables de venta" />
          <KPI label="Unidades Año 1" value={num(m.unidadesAnio[0], 0)} />
          <KPI label="Absorción por unidad" value={money(m.absorcion, 2)} />
          <KPI label="Gasto fijo mensual" value={money(m.gFijoMes1)} sub={`Año ${anioCambio}+: ${money(m.gFijoMes2)}`} />
        </div>
      </Card>
    </>
  );
}
