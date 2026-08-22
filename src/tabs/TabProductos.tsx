import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   4. PRICING
   ============================================================ */
export default function TabProductos({ s, up, m, L }: any) {
  const [selRaw, setSel] = useState(0);
  const sel = Math.min(selRaw, Math.max(0, s.productos.length - 1));
  const p = s.productos[sel];
  const pc = m.prod[sel];

  const u1 = m.unidadesAnio[0] || 0;
  const GASTOS = [
    { lab: "Gasto administrativo", total: (m.gAdmin1 || 0) * 12 },
    { lab: "Gasto de operación", total: (m.gOper1 || 0) * 12 },
    { lab: "Gasto de venta", total: (m.gVenta1 || 0) * 12 },
    { lab: "Gasto variable por pieza", total: (m.costoPorPieza || 0) * u1 },
  ];

  const addProd = () => up((n) => { n.productos.push({ id: uid(), nombre: "Nuevo " + L.prodS.toLowerCase(), mix: 0, margen: 0.2, precio: 0, bom: [], mo: [] }); });

  return (
    <>
      <Card title="Pricing"
        sub="Del costo unitario al precio de lista: cuánto gasto absorbe cada pieza, qué margen le pides y en cuánto la vendes. Haz clic en un renglón para ver su costeo abajo."
        right={<Btn kind="primary" small onClick={addProd}>+ Agregar {L.prodS.toLowerCase()}</Btn>}>
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
          sales al mercado, y de ahí se calcula el margen real.
        </div>
      </Card>

      <Card title="De dónde sale la absorción de gasto"
        sub={`El gasto del Año 1 repartido entre las piezas del plan: ${num(u1, 0)} pzas.`}>
        <table className="w-full">
          <thead><tr>
            <Th align="left" w="40%">Concepto</Th><Th>Gasto total Año 1</Th><Th>Volumen estimado (pzas)</Th><Th>Absorción por pieza</Th>
          </tr></thead>
          <tbody>
            {GASTOS.map((g) => (
              <tr key={g.lab}>
                <Td align="left">{g.lab}</Td>
                <Td>{money(g.total)}</Td>
                <Td color={C.muted}>{num(u1, 0)}</Td>
                <Td>{money(u1 > 0 ? g.total / u1 : 0, 2)}</Td>
              </tr>
            ))}
            <tr>
              <Td align="left" bold>Total de gastos</Td>
              <Td bold>{money(m.gastoTotalAnio1)}</Td>
              <Td color={C.muted}>{num(u1, 0)}</Td>
              <Td bold bg={C.accentSoft}>{money(m.absorcion, 2)}</Td>
            </tr>
          </tbody>
        </table>
        <div className="mt-2 text-[11px]" style={{ color: C.muted }}>
          Es la misma absorción para todas las líneas: el gasto no se traza a un modelo en particular, se reparte por pieza.
          Los importes se capturan en <b style={{ color: C.ink }}>Gastos</b> y el volumen sale del Forecast.
        </div>
      </Card>

      {p && (
        <div className="grid grid-cols-2 gap-4">
          <Card title={L.bom + " — " + p.nombre} sub="Consumo por unidad producida. La cantidad se captura en Explosionado de materiales: aquí sólo se lee, para que sea el mismo número."
            right={<Btn small onClick={() => up((n) => { if (s.insumos[0]) n.productos[sel].bom.push({ insumoId: s.insumos[0].id, cant: 0 }); })} disabled={!s.insumos.length}>+ Renglón</Btn>}>
            {!s.insumos.length ? <Empty texto={`Primero captura ${L.insumos.toLowerCase()}.`} /> : (
              <table className="w-full">
                <thead><tr><Th align="left" w="42%">{L.insumo}</Th><Th>Cantidad</Th><Th align="left">Unidad</Th><Th>Costo</Th><Th w="34"></Th></tr></thead>
                <tbody>
                  {p.bom.map((b, i) => {
                    const ins = s.insumos.find((x) => x.id === b.insumoId);
                    return (
                      <tr key={i}>
                        <Td align="left">
                          <select className={inputCls} style={inputSt} value={b.insumoId} onChange={(e) => up((n) => { n.productos[sel].bom[i].insumoId = e.target.value; })}>
                            {s.insumos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                          </select>
                        </Td>
                        <Td><span title="Se captura en Explosionado de materiales">{num(b.cant || 0, 3)}</span></Td>
                        <Td align="left" color={C.muted}>{ins?.unidad}</Td>
                        <Td>{money((m.insumoUnit[b.insumoId] || 0) * b.cant, 3)}</Td>
                        <Td><Btn small kind="danger" onClick={() => up((n) => { n.productos[sel].bom.splice(i, 1); })}>×</Btn></Td>
                      </tr>
                    );
                  })}
                  <tr><Td align="left" bold colSpan={3}>Costo de materiales</Td><Td bold>{money(pc.mp, 2)}</Td><Td></Td></tr>
                </tbody>
              </table>
            )}
            <div className="mt-2 text-[11px]" style={{ color: C.muted }}>
              Las cantidades vienen de <b style={{ color: C.ink }}>Explosionado de materiales</b>. Cámbialas allá y aquí se
              actualizan solas: es el mismo renglón, no una copia.
            </div>
          </Card>

          <Card title={"Mano de obra — " + p.nombre} sub="Horas que consume cada unidad."
            right={<Btn small onClick={() => up((n) => { if (s.recursosMO[0]) n.productos[sel].mo.push({ moId: s.recursosMO[0].id, horas: 0 }); })} disabled={!s.recursosMO.length}>+ Renglón</Btn>}>
            {!s.recursosMO.length ? <Empty texto="Primero captura los puestos de mano de obra." /> : (
              <table className="w-full">
                <thead><tr><Th align="left" w="45%">Puesto</Th><Th>Horas por unidad</Th><Th>Costo</Th><Th w="34"></Th></tr></thead>
                <tbody>
                  {p.mo.map((b, i) => (
                    <tr key={i}>
                      <Td align="left">
                        <select className={inputCls} style={inputSt} value={b.moId} onChange={(e) => up((n) => { n.productos[sel].mo[i].moId = e.target.value; })}>
                          {s.recursosMO.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                        </select>
                      </Td>
                      <Td><NumIn value={b.horas} dec={2} onChange={(v) => up((n) => { n.productos[sel].mo[i].horas = v; })} /></Td>
                      <Td>{money((m.moHora[b.moId] || 0) * b.horas, 2)}</Td>
                      <Td><Btn small kind="danger" onClick={() => up((n) => { n.productos[sel].mo.splice(i, 1); })}>×</Btn></Td>
                    </tr>
                  ))}
                  <tr><Td align="left" bold colSpan={2}>Costo de mano de obra</Td><Td bold>{money(pc.mod, 2)}</Td><Td></Td></tr>
                </tbody>
              </table>
            )}
            <div className="mt-3 grid grid-cols-4 gap-2">
              <KPI label="Materiales + MO" value={money(pc.directo, 2)} />
              <KPI label={"Costos de " + L.cp} value={money(pc.cp, 2)} sub={money(pc.cpVar, 2) + " variable"} />
              <KPI label="Costo estándar" value={money(pc.estandar, 2)} sub="Con absorción de gasto" />
              <KPI label="Margen de contribución" value={pct(pc.margenContrib)} sub="Precio − costo variable" />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
