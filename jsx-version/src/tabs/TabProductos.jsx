import React, { useState } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct } from "../lib/format";
import { Card, Btn, NumIn, PctIn, Th, Td, KPI, Empty } from "../components/ui";

/* ============================================================
   4. PRICING
   ============================================================ */
export default function TabProductos({ s, up, m, L }) {
  const [selRaw, setSel] = useState(0);
  const sel = Math.min(selRaw, Math.max(0, s.productos.length - 1));
  const p = s.productos[sel];
  const pc = m.prod[sel];

  const addProd = () => up((n) => { n.productos.push({ id: uid(), nombre: "Nuevo " + L.prodS.toLowerCase(), mix: 0, margen: 0.2, precio: 0, bom: [], mo: [] }); });

  return (
    <>
      <Card title="Pricing"
        sub="Del costo unitario al precio de lista: cuánto gasto absorbe cada pieza, qué margen le pides y en cuánto la vendes. Haz clic en un renglón para ver su costeo abajo."
        right={<Btn kind="primary" small onClick={addProd}>+ Producto / Servicio</Btn>}>
        {s.productos.length === 0 ? <Empty texto="Sin productos capturados." /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="w-full" style={{ minWidth: 1040 }}>
              <thead><tr>
                <Th align="left" w="16%">{L.prodS}</Th>
                <Th>Costo unitario (MP &amp; MOD)</Th><Th>Costos de {L.cp}</Th><Th>Absorción de gasto</Th>
                <Th>% de gasto vs costo</Th><Th>Costo unitario estándar</Th><Th>Margen esperado</Th>
                <Th>Precio de venta</Th><Th>Redondeo</Th><Th>Margen real</Th>
              </tr></thead>
              <tbody>
                {m.prod.map((x, i) => (
                  <tr key={x.id} style={{ background: i === sel ? C.soft : undefined, cursor: "pointer" }} onClick={() => setSel(i)}>
                    <Td align="left">{x.nombre}</Td>
                    <Td>{money(x.directo, 2)}</Td>
                    <Td>{money(x.cp, 2)}</Td>
                    <Td>{money(x.absorcion, 2)}</Td>
                    <Td color={C.muted}>{x.produccion > 0 ? pct(x.absorcion / x.produccion, 1) : "—"}</Td>
                    <Td bold>{money(x.estandar, 2)}</Td>
                    <Td><PctIn value={x.margen} dec={1} onChange={(v) => up((n) => { n.productos[i].margen = v; })} /></Td>
                    <Td>{money(x.sugerido, 2)}</Td>
                    <Td><NumIn value={x.precio} dec={0} onChange={(v) => up((n) => { n.productos[i].precio = v; })} /></Td>
                    <Td bold color={x.margenReal < 0 ? C.neg : C.pos}>{pct(x.margenReal)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-2 text-[11px]" style={{ color: C.muted }}>
          Costo unitario estándar = costo directo + costos de {L.cp} + absorción de gasto. El precio de venta es ese costo con
          el margen esperado encima; el <b style={{ color: C.ink }}>redondeo</b> es el precio de lista con el que realmente
          sales al mercado, y de ahí se calcula el margen real. De dónde sale la absorción de gasto se explica en «Resumen de impacto».
        </div>
      </Card>

      {/* el costeo renglón por renglón vive en Explosionado; aquí sólo el
          resultado del producto seleccionado arriba */}
      {p && pc && (
        <>
          <div className="text-[11.5px] mb-2" style={{ color: C.muted }}>
            Costeo de <b style={{ color: C.ink }}>{p.nombre}</b> — haz clic en otro renglón de la tabla para cambiarlo.
          </div>
          <div className="grid grid-cols-4 gap-3">
            <KPI label="Materiales + MO" value={money(pc.directo, 2)} sub={`${money(pc.mp, 2)} materiales · ${money(pc.mod, 2)} MO`} />
            <KPI label={"Costos de " + L.cp} value={money(pc.cp, 2)} sub={money(pc.cpVar, 2) + " variable"} />
            <KPI label="Costo estándar" value={money(pc.estandar, 2)} sub="Con absorción de gasto" />
            <KPI label="Margen de contribución" value={pct(pc.margenContrib)} sub="Precio − costo variable" />
          </div>
        </>
      )}
    </>
  );
}
