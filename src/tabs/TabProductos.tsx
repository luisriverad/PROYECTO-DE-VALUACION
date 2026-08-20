import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   4. PRODUCTOS Y COSTEO
   ============================================================ */
export default function TabProductos({ s, up, m, L }: any) {
  const [sel, setSel] = useState(0);
  const p = s.productos[sel];
  const pc = m.prod[sel];
  const mixTotal = s.productos.reduce((a, x) => a + (x.mix || 0), 0);

  const addProd = () => up((n) => { n.productos.push({ id: uid(), nombre: "Nuevo " + L.prodS.toLowerCase(), mix: 0, margen: 0.2, precio: 0, bom: [], mo: [] }); });

  return (
    <>
      <Card title={L.prod} sub="La mezcla define cuánto pesa cada línea en el resultado. Debe sumar 100%."
        right={<Btn kind="primary" small onClick={addProd}>+ Agregar {L.prodS.toLowerCase()}</Btn>}>
        {s.productos.length === 0 ? <Empty texto="Sin productos capturados." /> : (
          <table className="w-full">
            <thead><tr>
              <Th align="left" w="20%">{L.prodS}</Th><Th>Mezcla</Th><Th>Materiales + MO</Th><Th>Costos de {L.cp}</Th>
              <Th>Costo de {L.cp}</Th><Th>Absorción de gasto</Th><Th>Costo estándar</Th><Th>Margen objetivo</Th>
              <Th>Precio sugerido</Th><Th>Precio de lista</Th><Th>Margen real</Th><Th w="40"></Th>
            </tr></thead>
            <tbody>
              {m.prod.map((x, i) => (
                <tr key={x.id} style={{ background: i === sel ? C.soft : undefined, cursor: "pointer" }} onClick={() => setSel(i)}>
                  <Td align="left"><TxtIn value={x.nombre} onChange={(v) => up((n) => { n.productos[i].nombre = v; })} /></Td>
                  <Td><PctIn value={x.mix} dec={1} onChange={(v) => up((n) => { n.productos[i].mix = v; })} /></Td>
                  <Td>{money(x.directo, 2)}</Td>
                  <Td>{money(x.cp, 2)}</Td>
                  <Td>{money(x.produccion, 2)}</Td>
                  <Td>{money(x.absorcion, 2)}</Td>
                  <Td bold>{money(x.estandar, 2)}</Td>
                  <Td><PctIn value={x.margen} dec={1} onChange={(v) => up((n) => { n.productos[i].margen = v; })} /></Td>
                  <Td>{money(x.sugerido, 2)}</Td>
                  <Td><NumIn value={x.precio} dec={0} onChange={(v) => up((n) => { n.productos[i].precio = v; })} /></Td>
                  <Td bold color={x.margenReal < 0 ? C.neg : C.pos}>{pct(x.margenReal)}</Td>
                  <Td><Btn small kind="danger" onClick={(e) => { up((n) => { n.productos.splice(i, 1); }); setSel(0); }}>×</Btn></Td>
                </tr>
              ))}
              <tr>
                <Td align="left" bold>Total</Td>
                <Td bold color={Math.abs(mixTotal - 1) > 0.001 ? C.neg : C.pos}>{pct(mixTotal)}</Td>
                <Td colSpan={10}></Td>
              </tr>
            </tbody>
          </table>
        )}
        {Math.abs(mixTotal - 1) > 0.001 && s.productos.length > 0 && (
          <div className="mt-2 text-[11px]" style={{ color: C.neg }}>La mezcla no suma 100%: el volumen proyectado no se está repartiendo completo.</div>
        )}
      </Card>

      {p && (
        <div className="grid grid-cols-2 gap-4">
          <Card title={L.bom + " — " + p.nombre} sub="Consumo por unidad producida."
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
                        <Td><NumIn value={b.cant} dec={4} onChange={(v) => up((n) => { n.productos[sel].bom[i].cant = v; })} /></Td>
                        <Td align="left" color={C.muted}>{ins?.unidad}</Td>
                        <Td>{money((m.insumoUnit[b.insumoId] || 0) * b.cant, 2)}</Td>
                        <Td><Btn small kind="danger" onClick={() => up((n) => { n.productos[sel].bom.splice(i, 1); })}>×</Btn></Td>
                      </tr>
                    );
                  })}
                  <tr><Td align="left" bold colSpan={3}>Costo de materiales</Td><Td bold>{money(pc.mp, 2)}</Td><Td></Td></tr>
                </tbody>
              </table>
            )}
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
