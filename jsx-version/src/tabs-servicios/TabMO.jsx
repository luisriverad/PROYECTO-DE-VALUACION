import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   3. MANO DE OBRA
   ============================================================ */
export default function TabMO({ s, up, m, L }) {
  const add = () => up((n) => { n.recursosMO.push({ id: uid(), nombre: "Nuevo puesto", sueldoMensual: 0, personas: 1, horasMes: 160, ineficiencia: 0 }); });
  // la nómina no baja por ser ineficiente: lo que cambia es cuánta de ella compra producción
  const inefDe = (r) => (r.sueldoMensual || 0) * (r.personas || 1) * 12 * (r.ineficiencia || 0);
  const costoInef = s.recursosMO.reduce((a, r) => a + inefDe(r), 0);
  return (
    <>
      <Card title={L.mo} sub={`El sueldo se convierte en tarifa por hora; esa tarifa es la que absorbe cada ${L.uni} ${L.entregada}. El índice de ineficiencia descuenta lo que se va en preparación, paros, retrabajo y tiempo muerto: el sueldo no baja, las horas productivas sí.`}
        right={<Btn kind="primary" small onClick={add}>+ Agregar puesto</Btn>}>
        {s.recursosMO.length === 0 ? <Empty texto="Sin puestos capturados." /> : (
          <table className="w-full">
            <thead><tr>
              <Th align="left" w="24%">Puesto</Th><Th>Sueldo mensual</Th><Th>Personas</Th>
              <Th>Horas contratadas / mes</Th><Th>Índice de ineficiencia</Th><Th>Horas productivas / mes</Th>
              <Th>Costo por hora</Th><Th>Nómina anual</Th><Th>Costo de la ineficiencia</Th><Th w="40"></Th>
            </tr></thead>
            <tbody>
              {s.recursosMO.map((r, i) => (
                <tr key={r.id}>
                  <Td align="left"><TxtIn value={r.nombre} onChange={(v) => up((n) => { n.recursosMO[i].nombre = v; })} /></Td>
                  <Td><NumIn value={r.sueldoMensual} onChange={(v) => up((n) => { n.recursosMO[i].sueldoMensual = v; })} /></Td>
                  <Td><NumIn value={r.personas} dec={0} onChange={(v) => up((n) => { n.recursosMO[i].personas = v; })} /></Td>
                  <Td><NumIn value={r.horasMes} dec={0} onChange={(v) => up((n) => { n.recursosMO[i].horasMes = v; })} /></Td>
                  <Td><PctIn value={r.ineficiencia || 0} dec={1} onChange={(v) => up((n) => { n.recursosMO[i].ineficiencia = Math.min(Math.max(v, 0), 0.99); })} /></Td>
                  <Td color={C.muted}>{num(m.moHorasEfect[r.id], 0)}</Td>
                  <Td bold>{money(m.moHora[r.id], 2)}</Td>
                  <Td>{money(r.sueldoMensual * r.personas * 12)}</Td>
                  <Td color={inefDe(r) > 0 ? C.neg : C.muted}>{money(inefDe(r))}</Td>
                  <Td><Btn small kind="danger" onClick={() => up((n) => {
                    n.recursosMO.splice(i, 1);
                    n.productos.forEach((p) => { p.mo = p.mo.filter((x) => x.moId !== r.id); });
                  })}>×</Btn></Td>
                </tr>
              ))}
              <tr>
                <Td align="left" bold>Nómina directa total</Td><Td bold>{money(m.nominaMes)}</Td>
                <Td colSpan={5}></Td><Td bold>{money(m.nominaMes * 12)}</Td>
                <Td bold color={costoInef > 0 ? C.neg : C.muted}>{money(costoInef)}</Td><Td></Td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>

      {/* La capacidad que sale de esta plantilla se lee en «Resumen de impacto». */}
      {costoInef > 0 && (
        <div className="px-3 py-2 rounded text-[12px]" style={{ background: C.soft, color: C.ink }}>
          La nómina anual sigue siendo <b>{money(m.nominaMes * 12)}</b> — la ineficiencia no baja lo que pagas. Lo que cambia es que
          <b> {money(costoInef)}</b> de esa nómina no compra producción, y por eso la tarifa por hora sube y cada {L.uni} carga más {L.mo.toLowerCase()}.
        </div>
      )}
    </>
  );
}
