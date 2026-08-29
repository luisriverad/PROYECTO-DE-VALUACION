import React, { useMemo, useState } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct } from "../lib/format";
import { Card, Btn, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   1. EXPLOSIONADO DE MATERIALES  (hoja "Costeo" del libro)
   El costo estándar sin absorción de gasto, armado renglón por renglón:
   la lista de materiales y las horas de cada modelo, con su capacidad.
   Escribe sobre el mismo estado que Materias primas, Mano de obra y
   Productos, así que la captura va y viene entre las cuatro pestañas.
   ============================================================ */
export default function TabExplosion({ s, up, m, L }) {
  /* --- horas por pieza de cada puesto, leídas de las listas de los modelos --- */
  const horasPza = useMemo(() => {
    const r = {};
    s.recursosMO.forEach((x) => {
      const usos = [];
      s.productos.forEach((p) => (p.mo || []).forEach((b) => { if (b.moId === x.id) usos.push({ mix: p.mix || 0, horas: b.horas || 0 }); }));
      if (!usos.length) { r[x.id] = 0; return; }
      const mixT = usos.reduce((a, u) => a + u.mix, 0);
      r[x.id] = mixT > 0 ? usos.reduce((a, u) => a + u.horas * u.mix, 0) / mixT
        : usos.reduce((a, u) => a + u.horas, 0) / usos.length;
    });
    return r;
  }, [s.recursosMO, s.productos]);

  /* --- capacidad, como en la hoja: piezas que rinde cada puesto contra el plan --- */
  const horasAnio = (r) => (m.moHorasEfect[r.id] || 0) * (r.personas || 1) * 12;
  const pzasTec = (r) => { const h = horasPza[r.id] || 0; return h > 0 ? horasAnio(r) / h : 0; };
  const capInstalada = s.recursosMO.reduce((a, r) => a + pzasTec(r), 0);
  const ventaProy = m.unidadesAnio[0] || 0;
  const dif = capInstalada - ventaProy;

  const mixTotal = s.productos.reduce((a, p) => a + (p.mix || 0), 0);
  const mixOk = Math.abs(mixTotal - 1) <= 0.001;
  const totalMP = m.prod.reduce((a, p) => a + p.mp * (p.mix || 0), 0);
  const totalMO = m.prod.reduce((a, p) => a + p.mod * (p.mix || 0), 0);

  /* Con varios modelos apilados no se encuentra nada. El renglón del resumen
     lleva a su explosión de abajo; no esconde las demás, porque el chiste de
     esta pestaña es poder comparar los componentes de todas. */
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

      {/* ---------- Resumen por producto: mezcla, costo y precio ---------- */}
      <Card title={`${L.prod} — resumen`}
        sub={`Haz clic en un renglón para saltar a su explosión, abajo. La mezcla se captura en el Forecast; el margen objetivo y el precio de lista, en Pricing.`}
        right={<Btn kind="primary" small onClick={addProd}>+ Producto / Servicio</Btn>}>
        {s.productos.length === 0 ? <Empty texto={`Sin ${L.prod.toLowerCase()} capturados.`} /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="w-full" style={{ minWidth: 980 }}>
              <thead><tr>
                <Th align="left" w="20%">{L.prodS}</Th><Th>Mezcla</Th><Th>Materiales + MO</Th><Th>Costos de {L.cp}</Th>
                <Th>Costo de {L.cp}</Th><Th>Absorción de gasto</Th><Th>Costo estándar</Th><Th>Margen objetivo</Th>
                <Th>Precio sugerido</Th><Th>Precio de lista</Th><Th>Margen real</Th><Th w="34"></Th>
              </tr></thead>
              <tbody>
                {m.prod.map((x, i) => {
                  const on = vaId === x.id;
                  return (
                  <tr key={x.id} onClick={() => irA(x.id)}
                    title={`Ir a la explosión de ${x.nombre}`}
                    style={{ background: on ? C.accentSoft : undefined, cursor: "pointer" }}>
                    <Td align="left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] shrink-0" style={{ color: on ? C.accent : C.line }}>▸</span>
                        {/* el nombre se edita sin abrir ni cerrar el renglón */}
                        <span className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <TxtIn value={x.nombre} onChange={(v) => up((n) => { n.productos[i].nombre = v; })} />
                        </span>
                      </div>
                    </Td>
                    <Td><span title="Se captura en el Forecast">{pct(x.mix || 0, 1)}</span></Td>
                    <Td>{money(x.directo, 2)}</Td>
                    <Td>{money(x.cp, 2)}</Td>
                    <Td>{money(x.produccion, 2)}</Td>
                    <Td>{money(x.absorcion, 2)}</Td>
                    <Td bold>{money(x.estandar, 2)}</Td>
                    <Td><span title="Se captura en Pricing">{pct(x.margen || 0, 1)}</span></Td>
                    <Td>{money(x.sugerido, 2)}</Td>
                    <Td><span title="Se captura en Pricing">{money(x.precio)}</span></Td>
                    <Td bold color={x.margenReal < 0 ? C.neg : C.pos}>{pct(x.margenReal)}</Td>
                    <Td>
                      <span onClick={(e) => e.stopPropagation()}>
                        <Btn small kind="danger" title={`Eliminar ${x.nombre}`} onClick={() => borrarProd(i)}>×</Btn>
                      </span>
                    </Td>
                  </tr>
                  );
                })}
                <tr>
                  <Td align="left" bold>Total</Td>
                  <Td bold color={mixOk ? C.pos : C.neg}>{pct(mixTotal)}</Td>
                  <Td colSpan={10}></Td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {!mixOk && s.productos.length > 0 && (
          <div className="mt-2 text-[11px]" style={{ color: C.neg }}>
            La mezcla no suma 100%: el volumen proyectado no se está repartiendo completo. Corrígela en el Forecast.
          </div>
        )}
      </Card>

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
          <Card title={p.nombre} sub={`Mezcla ${pct(p.mix || 0)} · consumo por pieza producida`}
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

      {/* ---------- Capacidad en piezas (filas 66-68 de la hoja) ---------- */}
      <Card title="Capacidad instalada" sub="Las horas por pieza de arriba, traducidas a piezas al año: lo que la plantilla alcanza a producir contra lo que el plan promete vender.">
        <div className="grid grid-cols-3 gap-3">
          <KPI label="Capacidad instalada" value={num(capInstalada, 0) + " pzas"} sub="Horas productivas ÷ horas por pieza" />
          <KPI label="Venta proyectada Año 1" value={num(ventaProy, 0) + " pzas"} sub="Plan de ventas" />
          <KPI label="Diferencia" value={num(dif, 0) + " pzas"} sub={capInstalada > 0 ? pct(dif / capInstalada) + " de la capacidad" : "—"} tone={dif < 0 ? "neg" : "pos"} />
        </div>
        {dif < 0 && (
          <div className="mt-3 px-3 py-2 rounded text-[12px]" style={{ background: "#FDECEA", color: C.neg }}>
            El plan pide más piezas de las que la plantilla alcanza a producir. O contratas, o subes horas, o el plan no se cumple.
          </div>
        )}
      </Card>
    </>
  );
}
