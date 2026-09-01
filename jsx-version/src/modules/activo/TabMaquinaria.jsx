import React, { useMemo } from "react";
import { Card } from "../../components/ui";
import { Head, Cols, SecHead, Campo, CampoDual, CampoRef, Derivado, Slider, Reparto, Apalancamiento, Stats, Veredicto, Nota, FlowTable, AreaChart, fM, fP, fP2, fX, fPts, fBrecha, fAnios, NotaTasa, TasaBox } from "./piezas";
import { ok, solve, calcMaq } from "../../lib/activos";

/* ============================================================
   ACTIVO · 2. MAQUINARIA Y EQUIPO PRODUCTIVO
   ============================================================ */
export default function TabMaquinaria({ A, up, R }) {
  const r = R.maq;
  /* Cuando el equipo no se paga, decir "no se paga" no ayuda a nadie: lo que
     sirve es el número que tendría que cambiar. Se despeja sólo en ese caso,
     porque cada despeje vuelve a correr el modelo doscientas veces. */
  const eq = useMemo(() => {
    if (!ok(r.vpn) || r.vpn > 0) return null;
    const m = A.maq;
    return {
      ing: m.ing1 > 0 ? solve((x) => calcMaq(A, R.sup, { ing1: x }).vpn, 0, m.ing1 * 8) : null,
      aho: m.aho1 > 0 ? solve((x) => calcMaq(A, R.sup, { aho1: x }).vpn, 0, m.aho1 * 8) : null,
      precio: m.precio > 0 ? solve((x) => calcMaq(A, R.sup, { precio: x }).vpn, 0, m.precio) : null,
    };
  }, [A, R.sup, r.vpn]);

  return (
    <>
      <Head titulo="Maquinaria y equipo productivo"
        texto="Flujo incremental: sólo lo que cambia por tener el activo. Sirve igual para ampliación que para reemplazo. Si el equipo no genera ventas nuevas, deja los ingresos en cero y captura sólo los ahorros." />
      <Cols
        izq={
          <Card title="Supuestos">
            <SecHead>Inversión inicial</SecHead>
            <Campo A={A} up={up} g="maq" k="precio" label="Precio del equipo" />
            <Campo A={A} up={up} g="maq" k="fletes" label="Fletes, aranceles y seguro" />
            <Campo A={A} up={up} g="maq" k="instal" label="Instalación y puesta en marcha" />
            <Campo A={A} up={up} g="maq" k="capac" label="Capacitación" />
            <Derivado label="Base de depreciación" valor={fM(r.base)} />
            <Derivado label="Capital de trabajo inicial" hint="Se calcula con el % de abajo" valor={fM(r.ct0)} />
            <Campo A={A} up={up} g="maq" k="venta" label="Venta del activo reemplazado" hint="0 si es ampliación" />
            <Campo A={A} up={up} g="maq" k="libros" label="Valor en libros del reemplazado" />
            <Derivado label="Inversión neta año 0" valor={fM(r.inv0)} />

            <SecHead>Financiamiento</SecHead>
            <Slider label="¿Cuánto pone el banco?" value={A.maq.ltvM}
              onChange={(v) => up((n) => { n.maq.ltvM = v; })}
              min={0} max={0.9} step={0.05}
              tope={ok(r.ltvMax) ? Math.min(r.ltvMax, 0.9) : null}
              izq="Todo de tu bolsa" der="90%"
              topeLabel={ok(r.ltvMax) ? "te prestan hasta " + fP(r.ltvMax) : null}
              hint="Crédito refaccionario sobre el equipo. El capital de trabajo no se financia: ése siempre sale de ti." />
            <Reparto deuda={r.monto} propio={r.capProp} />
            <Campo A={A} up={up} g="maq" k="tcM" label="Tasa del crédito" tipo="pct" />
            <Campo A={A} up={up} g="maq" k="plazoM" label="Plazo (años)" tipo="int" />
            <Campo A={A} up={up} g="maq" k="dscrMin" label="DSCR mínimo del banco" hint="EBITDA entre servicio de deuda. Casi siempre 1.20x o 1.25x" tipo="num" />
            <Campo A={A} up={up} g="maq" k="ltvTope" label="LTV máximo por garantía" hint="Lo más que presta el banco contra el equipo, rinda lo que rinda" tipo="pct" />
            <Derivado label="Pago anual" valor={fM(r.pago)} />
            <Derivado label="Hasta dónde te prestan"
              hint={r.limita === "garantia" ? "Aquí topa la garantía" : `LTV al que el DSCR toca ${fX(A.maq.dscrMin)}`}
              valor={fP(r.ltvMax)} />
            <Derivado label="Mínimo que pones tú" hint="Aun apalancándote al tope" valor={fM(r.propioMin)} />

            <SecHead>Operación</SecHead>
            <Campo A={A} up={up} g="maq" k="ve" label="Vida económica (años)" hint="Cuántos lo vas a usar de verdad" tipo="int" />
            <Campo A={A} up={up} g="maq" k="vf" label="Vida fiscal (años)" hint="Confírmala con tu contador" tipo="int" />
            <Derivado label="Depreciación anual" valor={fM(r.depA)} />
            {/* referencias: no entran al cálculo, sólo ponen en escala lo de abajo */}
            <CampoRef A={A} up={up} g="maq" k="baseIng" label="Ventas actuales al año" hint="Sólo referencia, no entra al cálculo" />
            <CampoRef A={A} up={up} g="maq" k="baseCos" label="Costo actual al año" hint="Sólo referencia, no entra al cálculo" />
            <CampoDual A={A} up={up} g="maq" k="ing1" bk="baseIng"
              label="Ingresos incrementales año 1" refTexto="tus ventas actuales" />
            <Campo A={A} up={up} g="maq" k="gIng" label="Crecimiento de ingresos" tipo="pct" />
            <CampoDual A={A} up={up} g="maq" k="aho1" bk="baseCos"
              label="Ahorros en costos año 1" hint="Mano de obra, energía, merma" refTexto="tu costo actual" />
            <CampoDual A={A} up={up} g="maq" k="cos1" bk="baseCos"
              label="Costos incrementales año 1" refTexto="tu costo actual" />
            <Campo A={A} up={up} g="maq" k="gCos" label="Crecimiento de costos" tipo="pct" />
            <Campo A={A} up={up} g="maq" k="pctCT" label="Capital de trabajo (% de ingresos)" tipo="pct" />
            <Campo A={A} up={up} g="maq" k="mto1" label="CapEx de mantenimiento año 1" />
            <Campo A={A} up={up} g="maq" k="rv" label="Valor de rescate" hint="Precio real de mercado secundario" />
            <Derivado label="Valor en libros al final" valor={fM(r.vl)} />
            <TasaBox valor={fP2(r.td)} nota="Tasa base de la empresa más la prima adicional del equipo." origen="Sólo lectura. Se define en la pestaña «Tasa de descuento»." />
            <NotaTasa detalle="allá defines la tasa base de la empresa y la prima adicional del equipo." />
          </Card>
        }
        der={<>
          <Card title="¿Hasta dónde te puedes apalancar?"
            sub="Mueve el deslizador. El proyecto no cambia; cambia cuánto sale de tu bolsa y qué tan amplificado te regresa.">
            <Apalancamiento activo="el equipo"
              ltv={A.maq.ltvM} monto={r.monto} propio={r.capProp}
              dscr={r.dscr} dscrMin={A.maq.dscrMin}
              ltvMax={r.ltvMax} ltvDscr={r.ltvDscr} limita={r.limita} propioMin={r.propioMin}
              apalancaSuma={r.apalancaSuma} rinde={r.tir} cuesta={A.maq.tcM}
              vpn={r.vpn} tirSin={r.tir} tirCon={r.tirL} />
          </Card>

          <Card title="Resultados">
            <Stats items={[
              { k: "VPN", valor: r.vpn, clave: true, n: "Pesos de hoy que agrega" },
              { k: "TIR", valor: r.tir, fmt: fP, signo: false, n: "Contra la tasa exigida" },
              { k: "TIRM", valor: r.tirm, fmt: fP, signo: false, n: "Reinversión al WACC" },
              { k: "VAE", valor: r.vaeV, n: "Renta anual equivalente" },
              { k: "Índice rentab.", valor: r.ir, fmt: fX, signo: false, n: "VPN por peso invertido" },
              { k: "Payback desc.", valor: r.pb, fmt: fAnios, signo: false, n: "Años de exposición" },
            ]} />
            {(() => {
              if (!ok(r.vpn)) return <Veredicto tono="mid" texto="Faltan datos para concluir." />;
              if (r.vpn > 0) return <Veredicto tono="ok" texto={`Crea valor. La TIR de ${fP(r.tir)} supera la tasa exigida de ${fP(r.td)}.`} />;
              /* Las palancas: qué número tendría que cambiar, y cuánto */
              const flujo = ok(eq && eq.ing) && A.maq.ing1 > 0
                ? `Saldría tablas con ${fM(eq.ing)} de ingresos incrementales el año 1, ${fP(eq.ing / A.maq.ing1 - 1)} más de lo que estás suponiendo.`
                : ok(eq && eq.aho) && A.maq.aho1 > 0
                  ? `Saldría tablas con ${fM(eq.aho)} de ahorros el año 1, ${fP(eq.aho / A.maq.aho1 - 1)} más de lo que estás suponiendo.`
                  : null;
              const compra = ok(eq && eq.precio)
                ? `${flujo ? "O c" : "C"}omprándolo en ${fM(eq.precio)} en vez de ${fM(A.maq.precio)} —${fP(1 - eq.precio / A.maq.precio)} menos— también sale tablas. Ése es el precio máximo que este equipo aguanta.`
                : "Ni regalado sale tablas: la operación que le estás colgando pierde dinero sola, sin contar la inversión.";
              return <Veredicto tono="no"
                texto={`Destruye valor: en estos términos el equipo se lleva ${fM(-r.vpn)} de valor presente en vez de agregarlo.`}
                detalle={[
                  ok(r.tir)
                    ? `Rinde ${fP(r.tir)} y le estás exigiendo ${fP(r.td)}: le faltan ${fBrecha(r.td - r.tir)} para salir tablas.`
                    : "Los flujos ni siquiera alcanzan a devolver lo invertido, así que no hay TIR que comparar contra la tasa exigida.",
                  ok(r.vaeV) ? `Repartido en el tiempo, es como pagar ${fM(-r.vaeV)} cada año durante los ${A.maq.ve} años de vida útil.` : null,
                  flujo,
                  compra,
                  "El crédito no cambia esto. La deuda amplifica el resultado, no le cambia el signo. Si lo quieres salvar, tiene que ser por el lado del flujo: más ingresos o ahorros, menos costos, o un precio de compra más bajo.",
                ]} />;
            })()}
            <div className="mt-4">
              <AreaChart vals={r.Y.map((y) => y.acum)} label="Flujo descontado acumulado, año 0 al 10. Cruza el cero en el payback descontado." />
            </div>
          </Card>

          <Card title="Flujo de efectivo incremental" pad={false}>
            <FlowTable Y={r.Y} rows={[
              { lab: "Ingresos incrementales", f: (y) => y.ing },
              { lab: "Ahorros en costos", f: (y) => y.aho },
              { lab: "Costos y gastos (−)", f: (y) => y.cos },
              { lab: "EBITDA incremental", f: (y) => y.ebitda, sum: true },
              { lab: "Depreciación fiscal (−)", f: (y) => y.dep },
              { lab: "EBIT", f: (y) => y.ebit, sum: true },
              { lab: "ISR (−)", f: (y) => y.imp },
              { lab: "NOPAT", f: (y) => y.nopat, sum: true },
              { lab: "+ Depreciación", f: (y) => y.addDep },
              { lab: "Capital de trabajo (−)", f: (y) => y.dct },
              { lab: "CapEx de mantenimiento (−)", f: (y) => y.capex },
              { lab: "Flujo operativo", f: (y) => y.fcfOp, sum: true },
              { lab: "Inversión inicial", f: (y) => y.invR },
              { lab: "Rescate después de impuestos", f: (y) => y.resc },
              { lab: "Recuperación de capital de trabajo", f: (y) => y.recCT },
              { lab: "FLUJO TOTAL", f: (y) => y.total, sum: true, hi: true },
              { lab: "Flujo descontado", f: (y) => y.desc },
              { lab: "Descontado acumulado", f: (y) => y.acum },
            ]} />
            <Nota>
              El flujo no incluye intereses ni pago de capital: el costo del financiamiento ya está dentro de la tasa de descuento.
              Meterlo aquí sería contarlo dos veces.
            </Nota>
          </Card>
        </>}
      />
    </>
  );
}
