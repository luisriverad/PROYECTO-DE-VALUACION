import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct } from "../lib/format";
import { Card, Btn, NumIn, PctIn, Th, Td, KPI, Empty } from "../components/ui";

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

  /* ¿A qué volumen deja de doler la absorción?
     El costo estándar es costo variable por pieza + los fijos que se absorben
     repartidos entre el volumen del año:
         estándar(u) = variable + fijosAbsorbidos / u
     Igualando el margen ponderado al objetivo se despeja el volumen. Ojo: el
     margen objetivo se captura como sobreprecio contra el costo (precio =
     costo × (1 + margen)), y el margen real se mide contra el precio, así que
     hay que convertirlo: m/(1+m). */
  const escala = useMemo(() => {
    const mixT = s.productos.reduce((a, x) => a + (x.mix || 0), 0);
    if (!m.prod.length || mixT <= 0) return null;
    const w = (x) => (x.mix || 0) / mixT;
    const fijos = ((m.gFijoMes1 || 0) + (m.cpFijoMes || 0)) * 12;
    const variable = m.prod.reduce((a, x) => a + (x.directo + x.cpVar) * w(x), 0) + (m.costoPorPieza || 0);
    const precio = m.prod.reduce((a, x) => a + (x.precio || 0) * w(x), 0);
    const objetivo = m.prod.reduce((a, x) => a + ((x.margen || 0) / (1 + (x.margen || 0))) * w(x), 0);
    const real = precio > 0 ? 1 - (variable + (u1 > 0 ? fijos / u1 : 0)) / precio : NaN;
    /* lo que queda del precio para pagar fijos una vez cubierto el variable y
       apartado el margen objetivo; si no queda nada, ningún volumen alcanza */
    const holgura = precio * (1 - objetivo) - variable;
    const unidades = holgura > 0 ? fijos / holgura : NaN;
    return { fijos, variable, precio, objetivo, real, unidades,
      absorcionMeta: unidades > 0 ? fijos / unidades + (m.costoPorPieza || 0) : NaN };
  }, [m, s.productos, u1]);

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
          sales al mercado, y de ahí se calcula el margen real.
        </div>
      </Card>

      <Card title="De dónde sale la absorción de gasto"
        sub={`El gasto del Año 1 repartido entre las piezas del plan: ${num(u1, 0)} pzas.`}>
        {escala && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <KPI label="Absorción por pieza" value={money(m.absorcion, 2)}
              sub={`${money(m.gastoTotalAnio1)} ÷ ${num(u1, 0)} pzas del Forecast`} />
            <KPI label="Margen real ponderado" value={pct(escala.real)}
              tone={escala.real < escala.objetivo ? "neg" : "pos"}
              sub={`Objetivo ponderado ${pct(escala.objetivo)}`} />
            <KPI label="Unidades para el margen objetivo"
              value={escala.unidades > 0 ? num(escala.unidades, 0) + " pzas" : "—"}
              tone={escala.unidades > 0 && escala.unidades <= u1 ? "pos" : "neg"}
              sub={escala.unidades > 0
                ? (escala.unidades <= u1 ? "El plan del Año 1 ya lo alcanza"
                  : `${pct(escala.unidades / u1 - 1)} más que las ${num(u1, 0)} del plan`)
                : "El precio de lista no da para ese margen"} />
            {/* según de qué lado del mínimo caiga el plan, lo que interesa es
                el colchón que traes o lo que bajaría la absorción al llegar */}
            {!(escala.unidades > 0) ? (
              <KPI label="Absorción al volumen objetivo" value="—" sub="Sube precio o baja costo" />
            ) : escala.unidades <= u1 ? (
              <KPI label="Colchón sobre ese volumen" value={pct(u1 / escala.unidades - 1)} tone="pos"
                sub={`${num(u1 - escala.unidades, 0)} pzas de más en el plan`} />
            ) : (
              <KPI label="Absorción al volumen objetivo" value={money(escala.absorcionMeta, 2)}
                sub={`Hoy ${money(m.absorcion, 2)} a ${num(u1, 0)} pzas`} />
            )}
          </div>
        )}
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
          {escala && escala.unidades > 0 && (
            <> Los <b style={{ color: C.ink }}>{money(escala.fijos)}</b> de gasto fijo del año no cambian si vendes más,
              así que la absorción por pieza sólo baja con volumen: a {num(u1, 0)} pzas carga {money(m.absorcion, 2)}.
              Con los precios de lista de hoy, el margen objetivo se alcanza desde{" "}
              <b style={{ color: C.ink }}>{num(escala.unidades, 0)} pzas al año</b> — ahí la absorción sería{" "}
              {money(escala.absorcionMeta, 2)}. {escala.unidades <= u1
                ? `El plan trae ${num(u1 - escala.unidades, 0)} pzas de colchón.`
                : `El plan se queda ${num(escala.unidades - u1, 0)} pzas corto.`}</>
          )}
          {escala && !(escala.unidades > 0) && (
            <> <b style={{ color: C.neg }}>Ningún volumen alcanza el margen objetivo:</b> el precio de lista ponderado
              ({money(escala.precio)}) no cubre el costo variable ({money(escala.variable, 2)}) más ese margen. Por mucho
              que vendas, la absorción por pieza tiende a cero pero el margen se queda corto: hay que mover precio o costo.</>
          )}
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
