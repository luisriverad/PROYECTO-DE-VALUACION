import React, { useState } from "react";
import { C } from "../lib/theme";
import { uid, money, pct } from "../lib/format";
import { Card, Btn, NumIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   1. EXPLOSIONADO DE MATERIALES  (hoja "Costeo" del libro)
   El costo estándar sin absorción de gasto, armado renglón por renglón:
   la lista de materiales y las horas de cada modelo, con su capacidad.
   Escribe sobre el mismo estado que Materias primas, Mano de obra y
   Productos, así que la captura va y viene entre las cuatro pestañas.
   ============================================================ */
export default function TabExplosion({ s, up, m, L }) {
  const totalMP = m.prod.reduce((a, p) => a + p.mp * (p.mix || 0), 0);
  const totalMO = m.prod.reduce((a, p) => a + p.mod * (p.mix || 0), 0);

  /* Con varios modelos apilados no se encuentra nada: al dar de alta uno,
     su tarjeta se trae a la vista y queda marcada con el acento. */
  const [vaId, setVaId] = useState(null);
  const irA = (id) => {
    setVaId(id);
    const el = typeof document !== "undefined" && document.getElementById("exp-" + id);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addProd = () => {
    const id = uid();
    up((n) => { n.productos.push({ id, nombre: "Nuevo " + L.prodS.toLowerCase(), mix: 0, margen: 0.2, precio: 0, bom: [], mo: [] }); });
    /* el renglón nuevo aparece hasta abajo: llévalo a la vista solo */
    setTimeout(() => irA(id), 60);
  };

  /* Borrar arrastra su lista de materiales y sus horas, y no hay deshacer:
     se pregunta sólo cuando hay algo capturado que perder. */
  const borrarProd = (pi) => {
    const p = s.productos[pi];
    const renglones = (p.bom || []).length + (p.mo || []).length;
    if (renglones > 0 && typeof window !== "undefined" &&
        !window.confirm(`Se elimina «${p.nombre}» con sus ${renglones} renglones de material y mano de obra. Esto no se puede deshacer. ¿Continuar?`)) return;
    if (vaId === p.id) setVaId(null);
    up((n) => { n.productos.splice(pi, 1); });
  };
  const addMat = (pi) => up((n) => { if (s.insumos[0]) n.productos[pi].bom.push({ insumoId: s.insumos[0].id, cant: 0 }); });
  const addMano = (pi) => up((n) => { if (s.recursosMO[0]) n.productos[pi].mo.push({ moId: s.recursosMO[0].id, horas: 0 }); });

  return (
    <>
      <Card title="Explosionado de materiales"
        sub="El costo estándar armado renglón por renglón: qué lleva cada pieza, cuánto consume y a qué precio. Es la misma captura de Materias primas, Mano de obra y Productos vista del derecho — lo que corrijas aquí se corrige allá, y al revés.">
        <div className="grid grid-cols-4 gap-3">
          <KPI label="Materiales por pieza" value={money(totalMP, 2)} sub="Promedio ponderado por mezcla" />
          <KPI label="Mano de obra por pieza" value={money(totalMO, 2)} sub="Promedio ponderado por mezcla" />
          <KPI label="Costo estándar sin absorción" value={money(totalMP + totalMO, 2)} />
          <KPI label="Absorción de gasto" value={money(m.absorcion, 2)} sub="Se carga en Pricing" />
        </div>
      </Card>

      {/* ---------- Alta de productos ---------- */}
      <div className="flex justify-end">
        <Btn kind="primary" small onClick={addProd}>+ Producto / Servicio</Btn>
      </div>

      {/* ---------- Lista de materiales por producto ---------- */}
      {s.productos.length === 0 ? (
        <Card title="Lista de materiales"><Empty texto={`Sin ${L.prod.toLowerCase()} capturados. Agrega el primero para explosionar su costo.`} /></Card>
      ) : null}

      {s.productos.map((p, pi) => {
        const pc = m.prod[pi];
        if (!pc) return null;
        return (
          <div key={p.id} id={"exp-" + p.id}
            /* la tarjeta a la que acabas de saltar queda marcada con el acento */
            style={{ scrollMarginTop: 12, borderRadius: 8,
              boxShadow: vaId === p.id ? `0 0 0 2px ${C.accent}` : undefined }}>
          <Card
            /* el nombre se escribe aquí mismo: es el único lugar de esta
               pestaña donde se bautiza al modelo */
            title={
              <input className="p120-titulo-edit" style={{ maxWidth: 360 }}
                value={p.nombre || ""} placeholder={`Sin nombre`}
                title={`Escribe para renombrar este ${L.prodS.toLowerCase()}`}
                onChange={(e) => up((n) => { n.productos[pi].nombre = e.target.value; })} />
            }
            sub={`Mezcla ${pct(p.mix || 0)} · consumo por pieza producida`}
            right={
              <div className="flex gap-2">
                <Btn small onClick={() => addMat(pi)} disabled={!s.insumos.length}
                  title={s.insumos.length ? `Agregar un renglón de ${L.insumo.toLowerCase()}`
                    : `No hay ${L.insumos.toLowerCase()} capturados: captúralos primero en la pestaña «${L.insumos}»`}>+ Material</Btn>
                <Btn small onClick={() => addMano(pi)} disabled={!s.recursosMO.length}
                  title={s.recursosMO.length ? "Agregar un renglón de mano de obra"
                    : `No hay ${L.mo.toLowerCase()} capturada: captúrala primero en la pestaña «${L.mo}»`}>+ Mano de obra</Btn>
                <Btn small kind="danger" title={"Eliminar " + p.nombre} onClick={() => borrarProd(pi)}>×</Btn>
              </div>
            }>
            <table className="w-full">
              <thead><tr>
                <Th align="left" w="34%">Concepto</Th><Th>Cantidad</Th><Th align="left" w="10%">Unidad</Th>
                <Th>Costo unitario</Th><Th>Importe por pieza</Th><Th w="34"></Th>
              </tr></thead>
              <tbody>
                {(p.bom || []).map((b, i) => {
                  const ins = s.insumos.find((x) => x.id === b.insumoId);
                  return (
                    <tr key={"b" + i}>
                      <Td align="left">
                        <select className={inputCls} style={inputSt} value={b.insumoId}
                          onChange={(e) => up((n) => { n.productos[pi].bom[i].insumoId = e.target.value; })}>
                          {s.insumos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                        </select>
                      </Td>
                      <Td><NumIn value={b.cant} dec={3} onChange={(v) => up((n) => { n.productos[pi].bom[i].cant = v; })} /></Td>
                      <Td align="left" color={C.muted}>{ins?.unidad || "—"}</Td>
                      <Td color={C.muted}>{money(m.insumoUnit[b.insumoId], 2)}</Td>
                      <Td>{money((m.insumoUnit[b.insumoId] || 0) * (b.cant || 0), 3)}</Td>
                      <Td><Btn small kind="danger" onClick={() => up((n) => { n.productos[pi].bom.splice(i, 1); })}>×</Btn></Td>
                    </tr>
                  );
                })}
                {!s.insumos.length && (
                  <tr>
                    <Td align="left" colSpan={6}>
                      <div className="text-[11.5px] leading-relaxed px-1 py-1.5" style={{ color: C.neg }}>
                        No hay {L.insumos.toLowerCase()} capturados todavía, así que no hay de dónde escoger:
                        el botón «+ Material» está apagado por eso. Captúralos primero en la pestaña
                        <b style={{ color: C.ink }}> {L.insumos}</b> y aquí los vas a poder elegir.
                      </div>
                    </Td>
                  </tr>
                )}
                {!!s.insumos.length && !(p.bom || []).length && (
                  <tr>
                    <Td align="left" colSpan={6}>
                      <div className="text-[11.5px] px-1 py-1.5" style={{ color: C.muted }}>
                        Sin materiales en este {L.prodS.toLowerCase()}. Usa «+ Material» para agregar el primero.
                      </div>
                    </Td>
                  </tr>
                )}
                <tr><Td align="left" colSpan={4} color={C.muted}>Materiales</Td><Td bold>{money(pc.mp, 2)}</Td><Td></Td></tr>

                {(p.mo || []).map((b, i) => (
                  <tr key={"m" + i}>
                    <Td align="left">
                      <select className={inputCls} style={inputSt} value={b.moId}
                        onChange={(e) => up((n) => { n.productos[pi].mo[i].moId = e.target.value; })}>
                        {s.recursosMO.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                      </select>
                    </Td>
                    <Td><NumIn value={b.horas} dec={2} onChange={(v) => up((n) => { n.productos[pi].mo[i].horas = v; })} /></Td>
                    <Td align="left" color={C.muted}>hrs</Td>
                    <Td color={C.muted}>{money(m.moHora[b.moId], 2)}</Td>
                    <Td>{money((m.moHora[b.moId] || 0) * (b.horas || 0), 2)}</Td>
                    <Td><Btn small kind="danger" onClick={() => up((n) => { n.productos[pi].mo.splice(i, 1); })}>×</Btn></Td>
                  </tr>
                ))}
                {!s.recursosMO.length && (
                  <tr>
                    <Td align="left" colSpan={6}>
                      <div className="text-[11.5px] leading-relaxed px-1 py-1.5" style={{ color: C.neg }}>
                        No hay {L.mo.toLowerCase()} capturada todavía, así que no hay de dónde escoger.
                        Captúrala primero en la pestaña <b style={{ color: C.ink }}>{L.mo}</b>.
                      </div>
                    </Td>
                  </tr>
                )}
                {!!s.recursosMO.length && !(p.mo || []).length && (
                  <tr>
                    <Td align="left" colSpan={6}>
                      <div className="text-[11.5px] px-1 py-1.5" style={{ color: C.muted }}>
                        Sin mano de obra en este {L.prodS.toLowerCase()}. Usa «+ Mano de obra» para agregar el primero.
                      </div>
                    </Td>
                  </tr>
                )}
                <tr><Td align="left" colSpan={4} color={C.muted}>Mano de obra</Td><Td bold>{money(pc.mod, 2)}</Td><Td></Td></tr>

                <tr>
                  <Td align="left" colSpan={4} bold>Costo estándar sin absorción de gasto</Td>
                  <Td bold bg={C.accentSoft}>{money(pc.directo, 2)}</Td><Td bg={C.accentSoft}></Td>
                </tr>
                <tr>
                  <Td align="left" colSpan={4} color={C.muted}>Con costos de {L.cp} y absorción de gasto</Td>
                  <Td color={C.muted}>{money(pc.estandar, 2)}</Td><Td></Td>
                </tr>
              </tbody>
            </table>
          </Card>
          </div>
        );
      })}
    </>
  );
}
