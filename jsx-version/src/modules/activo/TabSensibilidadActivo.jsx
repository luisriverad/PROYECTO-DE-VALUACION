import React, { useMemo } from "react";
import { Card } from "../../components/ui";
import { Head, Nota, GridTable, fM, fP } from "./piezas";
import { calcMaq, calcInm, calcTer, solve, ok } from "../../lib/activos";

/* ============================================================
   ACTIVO · 8. SENSIBILIDAD
   ============================================================ */
const DELTAS = [-0.04, -0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03, 0.04];

export default function TabSensibilidadActivo({ A, R }) {
  const sup = R.sup;

  /* VPN a distintas tasas */
  const tasas = useMemo(() => DELTAS.map((d) => ({
    d,
    maq: calcMaq(A, sup, { td: sup.tasas.maq + d }).vpn,
    inm: calcInm(A, sup, { td: sup.tasas.inm + d }).vpn,
    ter: calcTer(A, sup, { td: sup.tasas.ter + d, _ns: true }).vpn,
  })), [A, sup]);

  /* Maquinaria: matriz ingresos × costos */
  const matriz = useMemo(() => {
    const ings = [-0.25, -0.125, 0, 0.125, 0.25].map((k) => Math.round(A.maq.ing1 * (1 + k)));
    const coss = [-0.25, -0.125, 0, 0.125, 0.25].map((k) => Math.round(A.maq.cos1 * (1 + k)));
    return { ings, coss, vpn: ings.map((iv) => coss.map((cv) => calcMaq(A, sup, { ing1: iv, cos1: cv }).vpn)) };
  }, [A, sup]);

  /* Valores de equilibrio */
  const equilibrio = useMemo(() => {
    const eqIng = solve((x) => calcMaq(A, sup, { ing1: x }).vpn, 0, A.maq.ing1 * 6);
    const eqRen = solve((x) => calcInm(A, sup, { rentaMes: x }).vpn, 0, A.inm.rentaMes * 6);
    const eqPlu = R.ter.plusEq;
    return { eqIng, eqRen, eqPlu };
  }, [A, sup, R.ter.plusEq]);

  const lectura = (eq, actual) => {
    const holgura = ok(eq) && eq < actual;
    return { t: holgura ? "Con holgura" : "Sin holgura", neg: !holgura };
  };
  const cel = (v) => ({ t: fM(v), neg: v < 0 });

  return (
    <>
      <Head titulo="Sensibilidad"
        texto="Un VPN solo es una opinión disfrazada de cálculo. Estas tres tablas dicen qué tan frágil es y en qué supuesto conviene invertir tiempo de investigación." />

      <Card title="VPN a distintas tasas de descuento" pad={false}>
        <GridTable
          head={["Variación sobre la tasa base", "Maquinaria", "Inmueble", "Terreno"]}
          rows={tasas.map((r) => ({
            hi: r.d === 0,
            cells: [
              r.d === 0 ? "base · sin cambio" : (r.d > 0 ? "+" : "−") + Math.abs(r.d * 100).toFixed(0) + (Math.abs(r.d * 100) < 1.5 ? " punto" : " puntos"),
              cel(r.maq), cel(r.inm), cel(r.ter),
            ],
          }))}
        />
        <Nota>Si el VPN cambia de signo dentro de dos puntos, la decisión depende de la tasa y no del activo. Ahí conviene afinar el WACC antes de firmar nada.</Nota>
      </Card>

      <Card title="Maquinaria — VPN según ingresos y costos" pad={false}>
        <GridTable
          head={["Ingresos año 1  ↓   /   Costos →", ...matriz.coss.map(fM)]}
          rows={matriz.ings.map((iv, i) => ({ cells: [fM(iv), ...matriz.vpn[i].map(cel)] }))}
        />
        <Nota>Cada celda vuelve a correr el modelo completo con esos dos supuestos. La diagonal te dice si el proyecto aguanta que las dos cosas salgan mal a la vez.</Nota>
      </Card>

      <Card title="Valores de equilibrio — el supuesto que deja el VPN en cero" pad={false}>
        <GridTable
          head={["Activo y supuesto", "Valor de equilibrio", "Lo que supusiste", "Lectura"]}
          rows={[
            { cells: ["Maquinaria — ingresos año 1", fM(equilibrio.eqIng), fM(A.maq.ing1), lectura(equilibrio.eqIng, A.maq.ing1)] },
            { cells: ["Inmueble — renta mensual", fM(equilibrio.eqRen), fM(A.inm.rentaMes), lectura(equilibrio.eqRen, A.inm.rentaMes)] },
            { cells: ["Terreno — plusvalía anual", fP(equilibrio.eqPlu), fP(A.ter.plus), lectura(equilibrio.eqPlu, A.ter.plus)] },
          ]}
        />
        <Nota>
          Ésta es la prueba más honesta que existe: compara el valor de equilibrio contra lo que tu operación ha logrado de verdad.
          Si el equilibrio está arriba de tu mejor año, el proyecto no es ambicioso, es una ilusión.
        </Nota>
      </Card>
    </>
  );
}
