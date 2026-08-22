import React from "react";
import { Card } from "../../components/ui";
import { Head, Cols, SecHead, Campo, Derivado, Stats, Veredicto, Nota, FlowTable, BarsChart, fM, fP2 } from "./piezas";
import { money } from "../../lib/format";

/* ============================================================
   ACTIVO · 5. VEHÍCULO — contado, crédito o arrendamiento
   ============================================================ */
export default function TabVehiculo({ A, up, R }) {
  const r = R.auto;
  return (
    <>
      <Head titulo="Vehículo"
        texto="Un auto casi nunca genera ingresos: genera costos. Por eso los tres números son negativos y gana el menos negativo." />
      <Cols
        izq={
          <Card title="Supuestos">
            <SecHead>El vehículo</SecHead>
            <Campo A={A} up={up} g="auto" k="precio" label="Precio del vehículo" />
            <Campo A={A} up={up} g="auto" k="anios" label="Años de uso previstos" tipo="int" />
            <Campo A={A} up={up} g="auto" k="rv" label="Valor de reventa al final" hint="Consulta guías de precios reales" />

            <SecHead>Costos anuales (iguales en las tres opciones)</SecHead>
            <Campo A={A} up={up} g="auto" k="seguro" label="Seguro anual" />
            <Campo A={A} up={up} g="auto" k="tenencia" label="Tenencia, refrendo y verificación" />
            <Campo A={A} up={up} g="auto" k="mto1" label="Mantenimiento año 1" />
            <Campo A={A} up={up} g="auto" k="gMto" label="Crecimiento del mantenimiento" tipo="pct" />
            <Campo A={A} up={up} g="auto" k="combustible" label="Combustible y casetas" hint="Déjalo en 0 si es idéntico en las tres" />

            <SecHead>Opción B — crédito</SecHead>
            <Campo A={A} up={up} g="auto" k="pctEng" label="Enganche" tipo="pct" />
            <Derivado label="Enganche $" valor={fM(r.eng)} />
            <Derivado label="Monto financiado" valor={fM(r.fin)} />
            <Campo A={A} up={up} g="auto" k="tc" label="Tasa anual del crédito" tipo="pct" />
            <Campo A={A} up={up} g="auto" k="plazoC" label="Plazo (años)" tipo="int" />
            <Derivado label="Pago anual" valor={fM(r.pagoC)} />

            <SecHead>Opción C — arrendamiento puro</SecHead>
            <Campo A={A} up={up} g="auto" k="rentaMes" label="Renta mensual" />
            <Campo A={A} up={up} g="auto" k="deposito" label="Depósito en garantía" hint="Se recupera al final" />
            <Campo A={A} up={up} g="auto" k="gRentaA" label="Incremento anual de la renta" tipo="pct" />
            <Campo A={A} up={up} g="auto" k="incluidos" label="¿Seguro y mantto. incluidos? 1 sí / 0 no" tipo="int" />

            <SecHead>Fiscal</SecHead>
            <Campo A={A} up={up} g="auto" k="ded" label="% del uso que es deducible" hint="Confirma topes con tu contador" tipo="pct" />
            <Campo A={A} up={up} g="auto" k="vfisc" label="Vida fiscal (años)" tipo="int" />
            <Derivado label="Depreciación anual" valor={fM(r.depA)} />
            <Derivado label="Tasa de descuento" valor={fP2(r.td)} />
          </Card>
        }
        der={<>
          <Card title="Costo de cada opción">
            <Stats items={[
              { k: "VP costo — Contado", valor: r.vpA },
              { k: "VP costo — Crédito", valor: r.vpB },
              { k: "VP costo — Arrendam.", valor: r.vpC },
              { k: "CAE — Contado", valor: r.caeA, n: "Costo anual equivalente" },
              { k: "CAE — Crédito", valor: r.caeB },
              { k: "CAE — Arrendam.", valor: r.caeC },
            ]} />
            <Veredicto tono="ok" texto={`Gana ${r.ganador}, por ${money(Math.abs(r.ahorro))} de valor presente frente a la segunda mejor.`} />
            <div className="mt-4">
              <BarsChart items={r.orden.map((o) => ({ name: o.n, v: o.v }))} />
            </div>
          </Card>

          <Card title="Flujo de las tres opciones" pad={false}>
            <FlowTable Y={r.Y} rows={[
              { lab: "Costos operativos (−)", f: (y) => y.comun },
              { lab: "Escudo fiscal de los costos", f: (y) => y.escC },
              { lab: "Escudo fiscal de la depreciación", f: (y) => y.escD },
              { lab: "Reventa neta de impuestos", f: (y) => y.rev },
              { lab: "A · CONTADO", f: (y) => y.A, sum: true, hi: true },
              { lab: "Saldo del crédito", f: (y) => y.saldo },
              { lab: "Pago del crédito (−)", f: (y) => y.pagoT },
              { lab: "Escudo fiscal de intereses", f: (y) => y.escI },
              { lab: "Liquidación al vender (−)", f: (y) => y.liq },
              { lab: "B · CRÉDITO", f: (y) => y.B, sum: true, hi: true },
              { lab: "Renta del arrendamiento (−)", f: (y) => y.renta },
              { lab: "Escudo fiscal de la renta", f: (y) => y.escR },
              { lab: "Costos no incluidos (−)", f: (y) => y.comC },
              { lab: "Devolución del depósito", f: (y) => y.dev },
              { lab: "C · ARRENDAMIENTO", f: (y) => y.C, sum: true, hi: true },
            ]} />
            <Nota>
              El arrendamiento gana casi siempre en flujo y casi nunca en patrimonio: al final no eres dueño de nada. Si el activo
              residual te importa, ese es un argumento que este modelo no puede pesar por ti.
            </Nota>
          </Card>
        </>}
      />
    </>
  );
}
