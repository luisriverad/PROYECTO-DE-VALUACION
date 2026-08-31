import React, { useMemo } from "react";
import { C } from "../lib/theme";
import { money, num, pct } from "../lib/format";
import { Card, Th, Td, KPI, Empty } from "../components/ui";

/* ============================================================
   RESUMEN DE IMPACTO
   Las tres lecturas que cierran el costeo, juntas: qué alcanza a
   producir la plantilla en horas, lo mismo traducido a piezas, y
   cómo cae el costo de producción sobre cada unidad.
   Aquí no se captura nada: todo sale de Mano de obra, del
   Explosionado y de Costos de producción.
   ============================================================ */

/* Renglón de apoyo dentro de un encabezado de tabla: explica la columna sin
   gritar en mayúsculas, para que la tabla se entienda sin manual. */
const Sub = ({ children }) => (
  <span className="block normal-case tracking-normal font-normal text-[10px] mt-0.5" style={{ opacity: .8 }}>{children}</span>
);

export default function TabResumenImpacto({ s, m, L }) {
  const cap = m.capacidad;

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

  /* --- capacidad en piezas: lo que rinde cada puesto contra el plan --- */
  const horasAnio = (r) => (m.moHorasEfect[r.id] || 0) * (r.personas || 1) * 12;
  const pzasTec = (r) => { const h = horasPza[r.id] || 0; return h > 0 ? horasAnio(r) / h : 0; };
  const capInstalada = s.recursosMO.reduce((a, r) => a + pzasTec(r), 0);
  const ventaProy = m.unidadesAnio[0] || 0;
  const dif = capInstalada - ventaProy;

  /* --- costos de producción del Año 1 --- */
  const PC = s.prodCostos || { directos: [], indirectos: [] };
  const u1 = m.unidadesAnio[0] || 0;
  const hrs1 = u1 * m.horasProm;
  const anual = (g) => (g.fijoMes || 0) * 12 + (g.porUnidad || 0) * u1 + (g.porHora || 0) * hrs1;
  const totalAnual = [...PC.directos, ...PC.indirectos].reduce((a, g) => a + anual(g), 0);
  const pctVentas = m.anios[0]?.ventas ? totalAnual / m.anios[0].ventas : NaN;

  /* --- los conceptos capturados, para enseñar de dónde sale cada suma --- */
  const CONCEPTOS = [
    ...PC.directos.map((g) => ({ ...g, grupo: "Directo" })),
    ...PC.indirectos.map((g) => ({ ...g, grupo: "Indirecto" })),
  ];
  const varU = (g) => (g.porUnidad || 0) + (g.porHora || 0) * m.horasProm;

  /* --- gasto del año que cada pieza tiene que absorber (venía de Pricing) --- */
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

  return (
    <>
      <div className="text-[12px] mb-3 px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
        Lo que el costeo deja como consecuencia: <b style={{ color: C.ink }}>cuánto aguanta la operación</b> y <b style={{ color: C.ink }}>cuánto carga cada unidad</b>. Nada se captura aquí; se corrige en {L.mo}, en el Explosionado o en {L.cpTab}.
      </div>

      {/* ---------- Capacidad en horas ---------- */}
      <Card title="Capacidad instalada, en horas" sub="El plan de ventas no sirve si la operación no lo aguanta.">
        <div className="grid grid-cols-4 gap-3">
          <KPI label="Horas productivas / año" value={num(cap.horasDisp, 0)} sub="Ya netas de ineficiencia" />
          <KPI label="Horas requeridas / año" value={num(cap.horasReq, 0)} sub="Según plan de ventas Año 1" />
          <KPI label="Uso de capacidad" value={pct(cap.uso)} tone={cap.uso > 1 ? "neg" : cap.uso > 0.85 ? undefined : "pos"} />
          <KPI label="Holgura" value={num(cap.horasDisp - cap.horasReq, 0) + " hrs"} tone={cap.horasDisp - cap.horasReq < 0 ? "neg" : "pos"} />
        </div>
        {cap.uso > 1 && (
          <div className="mt-3 px-3 py-2 rounded text-[12px]" style={{ background: "#FDECEA", color: C.neg }}>
            El plan exige más horas de las que existen. O contratas, o inviertes en capacidad, o el presupuesto es ficción.
          </div>
        )}
      </Card>

      {/* ---------- Capacidad en piezas ---------- */}
      <Card title="Capacidad instalada, en piezas" sub="Las mismas horas, traducidas a piezas al año: lo que la plantilla alcanza a producir contra lo que el plan promete vender.">
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

      {/* ---------- Costo unitario ---------- */}
      <Card title={`Cuánto le cargan los costos de ${L.cp} a cada unidad`}
        sub={`Los conceptos capturados en ${L.cpTab}, repartidos entre lo que se va a producir.`}>

        {/* La cuenta en palabras, con los números de este modelo */}
        <div className="text-[12.5px] mb-4 px-3 py-2.5 rounded leading-relaxed" style={{ background: C.soft, color: C.ink }}>
          Cada unidad carga dos cosas. <b>A · lo que se consume al producirla</b>: {money(m.cpVarU, 2)} en promedio,
          que es el consumo por unidad de cada concepto más su costo por hora de mano de obra por las {num(m.horasProm, 2)} hrs
          que lleva una unidad. <b>B · una rebanada de la base fija</b>, la que se paga aunque no se produzca:
          {" "}{money(m.cpFijoMes)} al mes × 12 = {money(m.cpFijoMes * 12)} al año, ÷ {num(u1, 0)} unidades del Año 1
          = <b>{money(m.cpFijoUnit, 2)}</b> por unidad. La tabla de abajo desglosa las dos sumas concepto por concepto.
        </div>

        <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: C.muted }}>
          1 · De dónde salen esas dos cifras
        </div>
        {CONCEPTOS.length === 0 ? <Empty texto={`Sin conceptos capturados en ${L.cpTab}.`} /> : (
          <table className="w-full mb-5">
            <thead><tr>
              <Th align="left" w="26%">Concepto</Th>
              <Th>Base fija mensual<Sub>capturada</Sub></Th>
              <Th>Base fija al año<Sub>× 12 meses</Sub></Th>
              <Th>Consumo por unidad<Sub>capturado</Sub></Th>
              <Th>Por hora de MO<Sub>× {num(m.horasProm, 2)} hrs</Sub></Th>
              <Th>A · Variable por unidad<Sub>las dos anteriores</Sub></Th>
            </tr></thead>
            <tbody>
              {CONCEPTOS.map((g) => (
                <tr key={g.id}>
                  <Td align="left">{g.nombre} <span style={{ color: C.muted }}>· {g.grupo}</span></Td>
                  <Td color={C.muted}>{money(g.fijoMes || 0)}</Td>
                  <Td>{money((g.fijoMes || 0) * 12)}</Td>
                  <Td color={C.muted}>{money(g.porUnidad || 0, 2)}</Td>
                  <Td color={C.muted}>{money((g.porHora || 0) * m.horasProm, 2)}</Td>
                  <Td>{money(varU(g), 2)}</Td>
                </tr>
              ))}
              <tr>
                <Td align="left" bold>Total capturado</Td>
                <Td bold>{money(m.cpFijoMes)}</Td>
                <Td bold bg={C.accentSoft}>{money(m.cpFijoMes * 12)}</Td>
                <Td colSpan={2}></Td>
                <Td bold bg={C.accentSoft}>{money(m.cpVarU, 2)}</Td>
              </tr>
            </tbody>
          </table>
        )}

        <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: C.muted }}>
          2 · Cómo cae sobre cada unidad
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <KPI label="A · Se consume al producir" value={money(m.cpVarU, 2)} sub={`Por unidad · ${num(m.horasProm, 2)} hrs de MO en promedio`} />
          <KPI label="B · Rebanada de la base fija" value={money(m.cpFijoUnit, 2)} sub={`${money(m.cpFijoMes)} al mes, repartidos entre ${num(u1, 0)} unidades`} />
          <KPI label="A + B · Carga por unidad" value={money(m.cpVarU + m.cpFijoUnit, 2)} sub="Promedio de la mezcla de venta" />
          <KPI label="Costo total Año 1" value={money(totalAnual)} sub={`${pct(pctVentas)} de las ventas del año`} />
        </div>

        <table className="w-full">
          <thead><tr>
            <Th align="left" w="24%">{L.prodS}</Th>
            <Th>Horas de MO<Sub>por unidad</Sub></Th>
            <Th>A · Se consume<Sub>al producir una unidad</Sub></Th>
            <Th>B · Base fija<Sub>igual para todos</Sub></Th>
            <Th>A + B<Sub>carga por unidad</Sub></Th>
            <Th>Peso en el costo<Sub>de la unidad terminada</Sub></Th>
          </tr></thead>
          <tbody>
            {m.prod.map((p) => (
              <tr key={p.id}>
                <Td align="left">{p.nombre}</Td>
                <Td color={C.muted}>{num(p.horas, 2)}</Td>
                <Td>{money(p.cpVar, 2)}</Td>
                <Td color={C.muted}>{money(m.cpFijoUnit, 2)}</Td>
                <Td bold>{money(p.cp, 2)}</Td>
                <Td color={C.muted}>{pct(p.estandar > 0 ? p.cp / p.estandar : NaN)}</Td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-[11.5px] mt-3 px-3 py-2 rounded leading-relaxed" style={{ background: C.soft, color: C.muted }}>
          <b style={{ color: C.ink }}>Por qué importa el prorrateo:</b> la columna A cambia de {L.prodS.toLowerCase()} a {L.prodS.toLowerCase()},
          porque cada uno consume sus propias horas. La columna B es la misma para todos y depende del volumen:
          si vendes menos de las {num(u1, 0)} unidades planeadas, esos {money(m.cpFijoMes * 12)} se reparten entre menos piezas,
          cada una se encarece y el margen real cae aunque el precio no se mueva. La última columna dice qué tanto de la unidad
          terminada son costos de {L.cp}; el resto son materiales y mano de obra.
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
            <KPI label="Volumen mínimo para el margen objetivo"
              value={escala.unidades > 0 ? num(escala.unidades, 0) + " pzas" : "—"}
              tone={escala.unidades > 0 && escala.unidades <= u1 ? "pos" : "neg"}
              sub={escala.unidades > 0
                ? (escala.unidades <= u1
                  ? `Con los precios de lista de hoy · el plan trae ${num(u1, 0)} pzas y lo pasa`
                  : `Con los precios de lista de hoy · ${pct(escala.unidades / u1 - 1)} más que las ${num(u1, 0)} del plan`)
                : "Con los precios de lista de hoy no lo alcanza ningún volumen"} />
            {/* según de qué lado del mínimo caiga el plan, lo que interesa es
                el colchón que traes o lo que bajaría la absorción al llegar */}
            {!(escala.unidades > 0) ? (
              <KPI label="Absorción al volumen objetivo" value="—" sub="No hay volumen que alcance: sube precio o baja costo" />
            ) : escala.unidades <= u1 ? (
              <KPI label="Colchón sobre ese mínimo" value={pct(u1 / escala.unidades - 1)} tone="pos"
                sub={`El plan trae ${num(u1 - escala.unidades, 0)} pzas de más; puede caer ${pct(1 - escala.unidades / u1)} y el margen objetivo se sostiene`} />
            ) : (
              <KPI label="Absorción al volumen objetivo" value={money(escala.absorcionMeta, 2)}
                sub={`Lo que cargaría cada pieza al llegar a ${num(escala.unidades, 0)} pzas · hoy ${money(m.absorcion, 2)} a ${num(u1, 0)}`} />
            )}
          </div>
        )}

        {/* Los dos números de la derecha se prestan a confusión: van explicados */}
        {escala && escala.unidades > 0 && (
          <div className="text-[11.5px] mb-4 px-3 py-2.5 rounded leading-relaxed" style={{ background: C.soft, color: C.muted }}>
            <b style={{ color: C.ink }}>Volumen mínimo para el margen objetivo.</b> Es el punto en el que el negocio llega
            al margen que pediste ({pct(escala.objetivo)} ponderado) sin tocar los precios de lista. Por debajo de{" "}
            {num(escala.unidades, 0)} pzas, los {money(escala.fijos)} de gasto fijo del año se reparten entre menos piezas,
            la absorción por pieza sube — sería {money(escala.absorcionMeta, 2)} justo en ese punto, contra{" "}
            {money(m.absorcion, 2)} a las {num(u1, 0)} pzas del plan — y el margen se cae solo, aunque nada más haya cambiado.
            {escala.unidades <= u1 ? (
              <> <b style={{ color: C.ink }}>Colchón sobre ese mínimo.</b> Qué tan lejos está el plan de ese piso:
                trae {num(u1 - escala.unidades, 0)} pzas de más, un {pct(u1 / escala.unidades - 1)} arriba del mínimo.
                Dicho al revés, las ventas pueden quedarse hasta {pct(1 - escala.unidades / u1)} abajo de lo planeado
                antes de que el margen objetivo deje de cumplirse.</>
            ) : (
              <> <b style={{ color: C.neg }}>No hay colchón:</b> el plan se queda {num(escala.unidades - u1, 0)} pzas corto
                de ese mínimo, así que con este volumen el margen objetivo no se alcanza. Hay que vender más, subir precio
                o bajar costo.</>
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
              así que la absorción por pieza sólo baja con volumen: a {num(u1, 0)} pzas carga {money(m.absorcion, 2)}.</>
          )}
          {escala && !(escala.unidades > 0) && (
            <> <b style={{ color: C.neg }}>Ningún volumen alcanza el margen objetivo:</b> el precio de lista ponderado
              ({money(escala.precio)}) no cubre el costo variable ({money(escala.variable, 2)}) más ese margen. Por mucho
              que vendas, la absorción por pieza tiende a cero pero el margen se queda corto: hay que mover precio o costo.</>
          )}
        </div>
      </Card>

    </>
  );
}
