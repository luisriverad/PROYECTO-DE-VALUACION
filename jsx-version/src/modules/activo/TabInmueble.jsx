import React from "react";
import { Card } from "../../components/ui";
import { Head, Cols, SecHead, Campo, Derivado, Stats, Veredicto, Nota, FlowTable, AreaChart, fM, fP, fP2, fX } from "./piezas";
import { ok } from "../../lib/activos";

/* ============================================================
   ACTIVO · 3. INMUEBLE
   ============================================================ */
export default function TabInmueble({ A, up, R }) {
  const r = R.inm;
  const noi1 = r.Y[1] ? r.Y[1].noi : 0;
  const noiSal = r.Y[r.i.hor] ? r.Y[r.i.hor].noi * (1 + r.i.gRenta) : 0;
  const vSal = r.Y[r.i.hor] ? r.Y[r.i.hor].vs : 0;
  return (
    <>
      <Head titulo="Inmueble"
        texto="El flujo se llama NOI y el valor terminal es una salida a cap rate. Se evalúa dos veces: el proyecto sin deuda, y tu capital propio con la hipoteca adentro." />
      <Cols
        izq={
          <Card title="Supuestos">
            <SecHead>Adquisición</SecHead>
            <Campo A={A} up={up} g="inm" k="precio" label="Precio del inmueble" />
            <Campo A={A} up={up} g="inm" k="pctAdq" label="Gastos de adquisición" hint="ISAI, notario, avalúo" tipo="pct" />
            <Campo A={A} up={up} g="inm" k="remod" label="Remodelación inicial" />
            <Derivado label="Valor de la propiedad" hint="Inversión total: base del cap rate de entrada" valor={fM(r.invTot)} />

            <SecHead>Financiamiento</SecHead>
            <Campo A={A} up={up} g="inm" k="ltv" label="LTV — % financiado" hint="0% si compras de contado" tipo="pct" />
            <Derivado label="Monto del crédito" valor={fM(r.monto)} />
            <Derivado label="Capital propio invertido" valor={fM(r.capProp)} />
            <Campo A={A} up={up} g="inm" k="th" label="Tasa hipotecaria" tipo="pct" />
            <Campo A={A} up={up} g="inm" k="plazo" label="Plazo (años)" tipo="int" />
            <Derivado label="Pago anual" valor={fM(r.pago)} />

            <SecHead>Operación</SecHead>
            <Campo A={A} up={up} g="inm" k="rentaMes" label="Renta mensual inicial" />
            <Campo A={A} up={up} g="inm" k="gRenta" label="Incremento anual de la renta" tipo="pct" />
            <Campo A={A} up={up} g="inm" k="vac" label="Vacancia e incobrables" hint="Un mes vacío al año ≈ 8%" tipo="pct" />
            <Campo A={A} up={up} g="inm" k="predial" label="Predial anual" />
            <Campo A={A} up={up} g="inm" k="seguro" label="Seguro anual" />
            <Campo A={A} up={up} g="inm" k="pctMan" label="Mantenimiento (% renta efectiva)" tipo="pct" />
            <Campo A={A} up={up} g="inm" k="pctAdm" label="Administración (% renta efectiva)" tipo="pct" />
            <Campo A={A} up={up} g="inm" k="pctConstr" label="% del valor que es construcción" hint="El terreno no se deprecia" tipo="pct" />
            <Campo A={A} up={up} g="inm" k="tasaDep" label="Tasa de depreciación fiscal" tipo="pct" />
            <Derivado label="Depreciación anual" valor={fM(r.depA)} />

            <SecHead>Salida</SecHead>
            <Campo A={A} up={up} g="inm" k="hor" label="Horizonte de tenencia (años)" hint="Máximo 10" tipo="int" />
            <Campo A={A} up={up} g="inm" k="capSal" label="Cap rate de salida" hint="Prudente: igual o mayor al de entrada" tipo="pct" />
            <Campo A={A} up={up} g="inm" k="pctCV" label="Costo de venta" tipo="pct" />
            <Derivado label="Tasa sin deuda" valor={fP2(r.td)} />
            <Derivado label="Tasa del capital propio (Ke)" valor={fP2(r.ke)} />
          </Card>
        }
        der={<>
          <Card title="Resultados">
            <Stats items={[
              { k: "VPN sin deuda", valor: r.vpn, clave: true, n: "Del proyecto en sí" },
              { k: "TIR sin deuda", valor: r.tir, fmt: fP, signo: false },
              { k: "VPN del capital", valor: r.vpnL, clave: true, n: "Con hipoteca, a Ke" },
              { k: "TIR apalancada", valor: r.tirL, fmt: fP, signo: false },
              { k: "NOI año 1", valor: noi1, signo: false, n: "Renta efectiva − gastos operativos" },
              { k: "Cap rate entrada", valor: r.capEnt, fmt: fP, signo: false, n: "NOI ÷ valor de la propiedad" },
              { k: "Cash-on-cash", valor: r.coc, fmt: fP, signo: false, n: "Año 1 sobre capital propio" },
              { k: "DSCR año 1", valor: r.dscr, fmt: fX, signo: false, n: "Sano arriba de 1.25x" },
              { k: "VAE sin deuda", valor: r.vaeV },
            ]} />
            <div className="mt-4">
              <SecHead>De dónde sale el cap rate</SecHead>
              <Derivado label="NOI del año 1" hint="Renta efectiva − predial − seguro − mantenimiento − administración" valor={fM(noi1)} />
              <Derivado label="Valor de la propiedad" hint="Precio + gastos de adquisición + remodelación" valor={fM(r.invTot)} />
              <Derivado label="Cap rate de entrada" hint="NOI del año 1 ÷ valor de la propiedad" valor={fP2(r.capEnt)} />
              <Derivado label={`NOI del año ${r.i.hor + 1}`} hint="El primer año del que compra: es lo que capitaliza a la salida" valor={fM(noiSal)} />
              <Derivado label="Valor de la propiedad a la salida" hint={`NOI del año ${r.i.hor + 1} ÷ cap rate de salida (${fP2(r.i.capSal)})`} valor={fM(vSal)} />
            </div>
            {(() => {
              if (r.vpn > 0 && ok(r.dscr) && r.dscr < 1.25)
                return <Veredicto tono="mid" texto={`El inmueble crea valor, pero el DSCR de ${fX(r.dscr)} deja poco colchón: un par de meses vacío y el crédito aprieta.`} />;
              if (r.vpn > 0) return <Veredicto tono="ok" texto="Crea valor. Sensibiliza el cap rate de salida antes de firmar." />;
              return <Veredicto tono="no" texto="Destruye valor a la tasa que le estás exigiendo." />;
            })()}
            <div className="mt-4">
              <AreaChart vals={r.Y.map((y) => y.acum)} label="Flujo sin deuda, descontado y acumulado." />
            </div>
          </Card>

          <Card title="Flujo de efectivo" pad={false}>
            <FlowTable Y={r.Y} rows={[
              { lab: "Renta bruta potencial", f: (y) => y.rb },
              { lab: "Vacancia e incobrables (−)", f: (y) => y.vac },
              { lab: "Renta efectiva", f: (y) => y.rEf, sum: true },
              { lab: "Predial (−)", f: (y) => y.pre },
              { lab: "Seguro (−)", f: (y) => y.seg },
              { lab: "Mantenimiento (−)", f: (y) => y.man },
              { lab: "Administración (−)", f: (y) => y.adm },
              { lab: "NOI", f: (y) => y.noi, sum: true, hi: true },
              { lab: "Saldo del crédito", f: (y) => y.saldo },
              { lab: "Intereses (−)", f: (y) => y.intr },
              { lab: "Amortización de capital (−)", f: (y) => y.amo },
              { lab: "ISR sin deuda (−)", f: (y) => y.isr0 },
              { lab: "ISR con deuda (−)", f: (y) => y.isr1 },
              { lab: "Valor de salida bruto", f: (y) => y.vs },
              { lab: "Costo de venta (−)", f: (y) => y.cv },
              { lab: "ISR de la ganancia (−)", f: (y) => y.iga },
              { lab: "Liquidación del crédito (−)", f: (y) => y.liq },
              { lab: "FLUJO SIN DEUDA", f: (y) => y.fu, sum: true, hi: true },
              { lab: "FLUJO AL CAPITAL", f: (y) => y.fl, sum: true, hi: true },
            ]} />
            <Nota>
              El precio de salida explica una parte grande del resultado. Revisa el peso que tiene y muévelo ±1 punto en la pestaña de sensibilidad.
            </Nota>
          </Card>
        </>}
      />
    </>
  );
}
