import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   COSTOS DE PRODUCCIÓN — directos e indirectos, semi-variables
   ============================================================ */
export default function TabCostosProduccion({ s, up, m, L }) {
  const PC = s.prodCostos || { directos: [], indirectos: [] };
  const u1 = m.unidadesAnio[0] || 0;
  const hrs1 = u1 * m.horasProm;

  const anual = (g) => (g.fijoMes || 0) * 12 + (g.porUnidad || 0) * u1 + (g.porHora || 0) * hrs1;
  const unitario = (g) => (g.porUnidad || 0) + (g.porHora || 0) * m.horasProm;

  const Bloque = ({ k, titulo, sub }) => {
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
        Ningún costo de {L.cp} es puramente fijo ni puramente variable. Cada concepto se captura en tres partes: la <b style={{ color: C.ink }}>base fija</b> que pagas aunque no vendas, el <b style={{ color: C.ink }}>consumo por {L.uni}</b> y el <b style={{ color: C.ink }}>consumo por hora de personal</b>. Usa el que corresponda y deja los otros en cero.
      </div>

      <Bloque k="directos" titulo={"Costos directos de " + L.cp}
        sub={`Se consumen al ${L.verbo}: energía eléctrica, agua, gas, combustible, licencias.`} />
      <Bloque k="indirectos" titulo={"Costos indirectos de " + L.cp}
        sub="Sostienen la operación sin incorporarse al producto: químicos, mantenimiento, herramienta, equipo de protección." />

      {/* El reparto de estos costos entre los productos se lee en «Resumen de impacto». */}
      <div className="text-[12px] px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
        Estos costos suman <b style={{ color: C.ink }}>{money(totalAnual)}</b> en el Año 1, el <b style={{ color: C.ink }}>{pct(pctVentas)}</b> de las ventas. Cómo se reparten entre los {L.prod.toLowerCase()} y qué le cargan a cada unidad se ve en «Resumen de impacto».
      </div>
    </>
  );
}
