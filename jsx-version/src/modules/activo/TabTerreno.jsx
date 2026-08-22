import React from "react";
import { Card } from "../../components/ui";
import { Head, Cols, SecHead, Campo, Derivado, Stats, Veredicto, Nota, FlowTable, AreaChart, fM, fP, fP2, fX } from "./piezas";
import { ok } from "../../lib/activos";

/* ============================================================
   ACTIVO · 4. TERRENO
   ============================================================ */
export default function TabTerreno({ A, up, R }) {
  const r = R.ter;
  return (
    <>
      <Head titulo="Terreno"
        texto="Un terreno no genera flujo: sólo cuesta cargarlo. Todo el retorno depende del precio de salida y de cuándo llega, que es justo lo que menos controlas." />
      <Cols
        izq={
          <Card title="Supuestos">
            <SecHead>Adquisición</SecHead>
            <Campo A={A} up={up} g="ter" k="precio" label="Precio del terreno" />
            <Campo A={A} up={up} g="ter" k="pctAdq" label="Gastos de adquisición" tipo="pct" />
            <Campo A={A} up={up} g="ter" k="bardeo" label="Bardeo, limpieza y deslinde" />
            <Derivado label="Inversión total" valor={fM(r.invTot)} />

            <SecHead>Costos de carga</SecHead>
            <Campo A={A} up={up} g="ter" k="predial" label="Predial anual" />
            <Campo A={A} up={up} g="ter" k="vigilancia" label="Vigilancia y mantenimiento anual" />
            <Campo A={A} up={up} g="ter" k="rentaTemp" label="Ingreso por uso temporal" hint="Estacionamiento, renta provisional" />

            <SecHead>Salida</SecHead>
            <Campo A={A} up={up} g="ter" k="plus" label="Plusvalía anual esperada" hint="Arriba de la inflación hay que justificarla" tipo="pct" />
            <Campo A={A} up={up} g="ter" k="hor" label="Horizonte hasta la venta (años)" tipo="int" />
            <Campo A={A} up={up} g="ter" k="pctCV" label="Costo de venta" tipo="pct" />
            <Derivado label="Tasa de descuento" valor={fP2(r.td)} />
          </Card>
        }
        der={<>
          <Card title="Resultados">
            <Stats items={[
              { k: "VPN", valor: r.vpn, clave: true },
              { k: "TIR", valor: r.tir, fmt: fP, signo: false },
              { k: "VAE", valor: r.vaeV },
              { k: "Costo de cargarlo", valor: r.pvCarga, n: "Valor presente" },
              { k: "Venta ÷ inversión", valor: r.mult, fmt: fX, signo: false },
              { k: "Plusvalía de equilibrio", valor: r.plusEq, fmt: fP, signo: false, clave: true, n: "La que deja el VPN en cero" },
            ]} />
            {(() => {
              const eq = r.plusEq, p = A.ter.plus;
              if (!ok(eq)) return r.vpn > 0
                ? <Veredicto tono="ok" texto="Crea valor." />
                : <Veredicto tono="no" texto="Destruye valor." />;
              if (r.vpn > 0) return <Veredicto tono="ok" texto={`Crea valor: te bastaría una plusvalía de ${fP(eq)} anual y estás suponiendo ${fP(p)}.`} />;
              return <Veredicto tono="no" texto={`Necesitarías ${fP(eq)} de plusvalía anual para salir tablas, y estás suponiendo ${fP(p)}. Compara ese número contra lo que la zona ha dado de verdad en diez años.`} />;
            })()}
            <div className="mt-4">
              <AreaChart vals={r.Y.map((y) => y.acum)} label="Flujo descontado acumulado. Los primeros años sólo hay salidas." />
            </div>
          </Card>

          <Card title="Flujo de efectivo" pad={false}>
            <FlowTable Y={r.Y} rows={[
              { lab: "Valor estimado del terreno", f: (y) => y.valEst },
              { lab: "Costos de carga (−)", f: (y) => y.carga },
              { lab: "Ingreso por uso temporal", f: (y) => y.ingT },
              { lab: "ISR del uso temporal (−)", f: (y) => y.impT },
              { lab: "Venta bruta", f: (y) => y.venta },
              { lab: "Costo de venta (−)", f: (y) => y.cv },
              { lab: "ISR de la ganancia (−)", f: (y) => y.iga },
              { lab: "FLUJO TOTAL", f: (y) => y.total, sum: true, hi: true },
              { lab: "Flujo descontado", f: (y) => y.desc },
              { lab: "Descontado acumulado", f: (y) => y.acum },
            ]} />
            <Nota>
              El terreno no deprecia, así que no hay escudo fiscal que amortigüe la espera. Cada año que tarda la venta cuesta el predial
              más la tasa de descuento completa.
            </Nota>
          </Card>
        </>}
      />
    </>
  );
}
