import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   6. INVERSIONES Y ACTIVOS
   ============================================================ */
export default function TabInversion({ s, up, m }) {
  const totalDep = s.activos.filter((a) => a.tipo === "dep").reduce((a, b) => a + b.inversion, 0);
  const totalAmo = s.activos.filter((a) => a.tipo === "amort").reduce((a, b) => a + b.inversion, 0);
  return (
    <>
      <Card title="Activos e inversiones" sub="Lo que compras una vez y se deprecia o amortiza contra el resultado."
        right={<Btn small kind="primary" onClick={() => up((n) => { n.activos.push({ id: uid(), nombre: "Nuevo activo", inversion: 0, anios: 10, tipo: "dep", mesInicio: 1 }); })}>+ Agregar activo</Btn>}>
        {s.activos.length === 0 ? <Empty texto="Sin activos capturados." /> : (
          <table className="w-full">
            <thead><tr>
              <Th align="left" w="30%">Activo</Th><Th>Inversión</Th><Th align="left">Tratamiento</Th>
              <Th>Vida útil (años)</Th><Th>Mes de alta</Th><Th>Cargo mensual</Th><Th>Cargo anual</Th><Th w="40"></Th>
            </tr></thead>
            <tbody>
              {s.activos.map((a, i) => (
                <tr key={a.id}>
                  <Td align="left"><TxtIn value={a.nombre} onChange={(v) => up((n) => { n.activos[i].nombre = v; })} /></Td>
                  <Td><NumIn value={a.inversion} dec={0} onChange={(v) => up((n) => { n.activos[i].inversion = v; })} /></Td>
                  <Td align="left">
                    <select className={inputCls} style={inputSt} value={a.tipo} onChange={(e) => up((n) => { n.activos[i].tipo = e.target.value; })}>
                      <option value="dep">Depreciación</option><option value="amort">Amortización</option>
                    </select>
                  </Td>
                  <Td><NumIn value={a.anios} dec={0} onChange={(v) => up((n) => { n.activos[i].anios = v; })} /></Td>
                  <Td><NumIn value={a.mesInicio} dec={0} onChange={(v) => up((n) => { n.activos[i].mesInicio = v; })} /></Td>
                  <Td>{money(a.inversion / ((a.anios || 1) * 12), 2)}</Td>
                  <Td>{money(a.inversion / (a.anios || 1))}</Td>
                  <Td><Btn small kind="danger" onClick={() => up((n) => { n.activos.splice(i, 1); })}>×</Btn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <KPI label="Inversión en activo fijo" value={money(totalDep)} />
          <KPI label="Inversión amortizable" value={money(totalAmo)} />
          <KPI label="D&A Año 1" value={money(m.anios[0]?.dep + m.anios[0]?.amo)} />
          <KPI label="Guía SAT" value="10 / 5 / 3" sub="Maquinaria 10 · autos 5 · cómputo 3" />
        </div>
      </Card>

      <Card title="CAPEX de reposición por año" sub="Inversiones adicionales que golpean el flujo, no el estado de resultados.">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${s.supuestos.horizonte}, minmax(0,1fr))` }}>
          {Array.from({ length: s.supuestos.horizonte }).map((_, i) => (
            <Field key={i} label={"Año " + (i + 1)}>
              <NumIn value={s.valuacion.capex[i] || 0} dec={0} onChange={(v) => up((n) => { n.valuacion.capex[i] = v; })} />
            </Field>
          ))}
        </div>
      </Card>
    </>
  );
}
