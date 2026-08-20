import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   COSTOS DE PRODUCCIÓN — directos e indirectos, semi-variables
   ============================================================ */
export default function TabCostosProduccion({ s, up, m, L }: any) {
  const PC = s.prodCostos || { directos: [], indirectos: [] };
  const u1 = m.unidadesAnio[0] || 0;
  const hrs1 = u1 * m.horasProm;

  const anual = (g) => (g.fijoMes || 0) * 12 + (g.porUnidad || 0) * u1 + (g.porHora || 0) * hrs1;
  const unitario = (g) => (g.porUnidad || 0) + (g.porHora || 0) * m.horasProm;

  const Bloque = ({ k, titulo, sub }: any) => {
    const arr = PC[k];
    return (
      <Card title={titulo} sub={sub}
        right={<Btn small kind="primary" onClick={() => up((n) => { n.prodCostos[k].push({ id: uid(), nombre: "Nuevo concepto", fijoMes: 0, porUnidad: 0, porHora: 0 }); })}>+ Agregar</Btn>}>
        {arr.length === 0 ? <Empty texto="Sin conceptos." /> : (
          <table className="w-full">
            <thead><tr>
              <Th align="left" w="30%">Concepto</Th>
              <Th>Base fija mensual</Th><Th>Por unidad</Th><Th>Por hora de MO</Th>
              <Th>Costo unitario</Th><Th>Costo Año 1</Th><Th w="40"></Th>
            </tr></thead>
            <tbody>
              {arr.map((g, i) => (
                <tr key={g.id}>
                  <Td align="left"><TxtIn value={g.nombre} onChange={(v) => up((n) => { n.prodCostos[k][i].nombre = v; })} /></Td>
                  <Td><NumIn value={g.fijoMes} dec={0} onChange={(v) => up((n) => { n.prodCostos[k][i].fijoMes = v; })} /></Td>
                  <Td><NumIn value={g.porUnidad} onChange={(v) => up((n) => { n.prodCostos[k][i].porUnidad = v; })} /></Td>
                  <Td><NumIn value={g.porHora} onChange={(v) => up((n) => { n.prodCostos[k][i].porHora = v; })} /></Td>
                  <Td color={C.muted}>{money(unitario(g), 2)}</Td>
                  <Td bold>{money(anual(g))}</Td>
                  <Td><Btn small kind="danger" onClick={() => up((n) => { n.prodCostos[k].splice(i, 1); })}>×</Btn></Td>
                </tr>
              ))}
              <tr>
                <Td align="left" bold>Total</Td>
                <Td bold>{money(arr.reduce((a, g) => a + (g.fijoMes || 0), 0))}</Td>
                <Td colSpan={2}></Td>
                <Td bold>{money(arr.reduce((a, g) => a + unitario(g), 0), 2)}</Td>
                <Td bold>{money(arr.reduce((a, g) => a + anual(g), 0))}</Td>
                <Td></Td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>
    );
  };

  const totalAnual = [...PC.directos, ...PC.indirectos].reduce((a, g) => a + anual(g), 0);
  const pctVentas = m.anios[0]?.ventas ? totalAnual / m.anios[0].ventas : NaN;

  return (
    <>
      <div className="text-[12px] mb-3 px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
        Ningún costo de {L.cp} es puramente fijo ni puramente variable. Cada concepto se captura en tres piezas: la <b style={{ color: C.ink }}>base fija</b> que pagas aunque no produzcas, el <b style={{ color: C.ink }}>consumo por unidad</b> y el <b style={{ color: C.ink }}>consumo por hora de mano de obra</b>. Usa el que corresponda y deja los otros en cero.
      </div>

      <Bloque k="directos" titulo={"Costos directos de " + L.cp}
        sub="Se consumen al producir: energía eléctrica, agua, gas, combustible." />
      <Bloque k="indirectos" titulo={"Costos indirectos de " + L.cp}
        sub="Sostienen la operación sin incorporarse al producto: químicos, mantenimiento, herramienta, equipo de protección." />

      <Card title="Impacto en el costo unitario" sub="Así se reparte entre los productos.">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <KPI label="Base fija mensual" value={money(m.cpFijoMes)} sub={money(m.cpFijoMes * 12) + " al año"} />
          <KPI label="Costo variable por unidad" value={money(m.cpVarU, 2)} sub={`${num(m.horasProm, 2)} hrs de MO por unidad`} />
          <KPI label="Costo total Año 1" value={money(totalAnual)} />
          <KPI label="% sobre ventas" value={pct(pctVentas)} />
        </div>
        <table className="w-full">
          <thead><tr>
            <Th align="left" w="26%">{L.prodS}</Th><Th>Horas de MO</Th><Th>Variable trazable</Th>
            <Th>Prorrateo de la base fija</Th><Th>Costo de {L.cp} por unidad</Th><Th>% del costo estándar</Th>
          </tr></thead>
          <tbody>
            {m.prod.map((p) => (
              <tr key={p.id}>
                <Td align="left">{p.nombre}</Td>
                <Td color={C.muted}>{num(p.horas, 2)}</Td>
                <Td>{money(p.cpVar, 2)}</Td>
                <Td>{money(m.cpFijoUnit, 2)}</Td>
                <Td bold>{money(p.cp, 2)}</Td>
                <Td color={C.muted}>{pct(p.estandar > 0 ? p.cp / p.estandar : NaN)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11.5px] mt-3 px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
          La parte variable se traza a cada {L.prodS.toLowerCase()} por sus propias horas y unidades. La base fija se prorratea entre el volumen del Año 1: si vendes menos de lo planeado, ese prorrateo se encarece y el margen real cae, aunque el precio no se mueva.
        </div>
      </Card>
    </>
  );
}
