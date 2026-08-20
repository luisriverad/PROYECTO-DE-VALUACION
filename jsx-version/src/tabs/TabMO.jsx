import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   3. MANO DE OBRA
   ============================================================ */
export default function TabMO({ s, up, m, L }) {
  const add = () => up((n) => { n.recursosMO.push({ id: uid(), nombre: "Nuevo puesto", sueldoMensual: 0, personas: 1, horasMes: 160 }); });
  const cap = m.capacidad;
  return (
    <>
      <Card title={L.mo} sub="El sueldo se convierte en tarifa por hora; esa tarifa es la que absorbe cada unidad producida."
        right={<Btn kind="primary" small onClick={add}>+ Agregar puesto</Btn>}>
        {s.recursosMO.length === 0 ? <Empty texto="Sin puestos capturados." /> : (
          <table className="w-full">
            <thead><tr>
              <Th align="left" w="30%">Puesto</Th><Th>Sueldo mensual</Th><Th>Personas</Th>
              <Th>Horas productivas / mes</Th><Th>Costo por hora</Th><Th>Costo anual</Th><Th w="40"></Th>
            </tr></thead>
            <tbody>
              {s.recursosMO.map((r, i) => (
                <tr key={r.id}>
                  <Td align="left"><TxtIn value={r.nombre} onChange={(v) => up((n) => { n.recursosMO[i].nombre = v; })} /></Td>
                  <Td><NumIn value={r.sueldoMensual} onChange={(v) => up((n) => { n.recursosMO[i].sueldoMensual = v; })} /></Td>
                  <Td><NumIn value={r.personas} dec={0} onChange={(v) => up((n) => { n.recursosMO[i].personas = v; })} /></Td>
                  <Td><NumIn value={r.horasMes} dec={0} onChange={(v) => up((n) => { n.recursosMO[i].horasMes = v; })} /></Td>
                  <Td bold>{money(m.moHora[r.id], 2)}</Td>
                  <Td>{money(r.sueldoMensual * r.personas * 12)}</Td>
                  <Td><Btn small kind="danger" onClick={() => up((n) => {
                    n.recursosMO.splice(i, 1);
                    n.productos.forEach((p) => { p.mo = p.mo.filter((x) => x.moId !== r.id); });
                  })}>×</Btn></Td>
                </tr>
              ))}
              <tr>
                <Td align="left" bold>Nómina directa total</Td><Td bold>{money(m.nominaMes)}</Td>
                <Td colSpan={3}></Td><Td bold>{money(m.nominaMes * 12)}</Td><Td></Td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Capacidad instalada" sub="El plan de ventas no sirve si la operación no lo aguanta.">
        <div className="grid grid-cols-4 gap-3">
          <KPI label="Horas disponibles / año" value={num(cap.horasDisp, 0)} />
          <KPI label="Horas requeridas / año" value={num(cap.horasReq, 0)} sub="Según plan de ventas Año 1" />
          <KPI label="Uso de capacidad" value={pct(cap.uso)} tone={cap.uso > 1 ? "neg" : cap.uso > 0.85 ? undefined : "pos"} />
          <KPI label="Holgura" value={num(cap.horasDisp - cap.horasReq, 0) + " hrs"} tone={cap.horasDisp - cap.horasReq < 0 ? "neg" : "pos"} />
        </div>
        {cap.uso > 1 && (
          <div className="mt-3 px-3 py-2 rounded text-[12px]" style={{ background: "#FDECEA", color: C.neg }}>
            El plan exige más horas de las que existen. O contratas, o inviertes en capacidad, o el presupuesto es ficción.
          </div>
        )}
      </Card>
    </>
  );
}
