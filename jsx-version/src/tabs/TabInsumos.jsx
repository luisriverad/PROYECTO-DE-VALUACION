import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, UnidadIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   2. INSUMOS
   ============================================================ */
export default function TabInsumos({ s, up, m, L }) {
  const add = () => up((n) => { n.insumos.push({ id: uid(), nombre: "Nuevo insumo", costoLote: 0, volumenLote: 1, unidad: "pza" }); });
  return (
    <Card title={L.insumos} sub="Captura la compra como la haces en la realidad: cuánto pagas y cuánto te entregan. La plataforma deriva el costo por unidad."
      right={<Btn kind="primary" small onClick={add}>+ Agregar {L.insumo.toLowerCase()}</Btn>}>
      {s.insumos.length === 0 ? (
        <Empty texto={`Sin ${L.insumos.toLowerCase()} capturados. Agrega el primero para empezar a costear.`} />
      ) : (
        <table className="w-full">
          <thead><tr>
            <Th align="left" w="30%">{L.insumo}</Th><Th>Costo del lote</Th><Th>Volumen del lote</Th>
            <Th align="left" w="16%">Unidad</Th><Th>Costo por unidad</Th><Th w="40"></Th>
          </tr></thead>
          <tbody>
            {s.insumos.map((it, i) => (
              <tr key={it.id}>
                <Td align="left"><TxtIn value={it.nombre} onChange={(v) => up((n) => { n.insumos[i].nombre = v; })} /></Td>
                <Td><NumIn value={it.costoLote} onChange={(v) => up((n) => { n.insumos[i].costoLote = v; })} /></Td>
                <Td><NumIn value={it.volumenLote} dec={1} onChange={(v) => up((n) => { n.insumos[i].volumenLote = v; })} /></Td>
                <Td align="left"><UnidadIn value={it.unidad} onChange={(v) => up((n) => { n.insumos[i].unidad = v; })} /></Td>
                <Td bold>{money(m.insumoUnit[it.id], 2)}</Td>
                <Td><Btn small kind="danger" onClick={() => up((n) => {
                  n.insumos.splice(i, 1);
                  n.productos.forEach((p) => { p.bom = p.bom.filter((b) => b.insumoId !== it.id); });
                })}>×</Btn></Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
