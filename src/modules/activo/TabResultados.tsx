import React from "react";
import { C } from "../../lib/theme";
import { Card } from "../../components/ui";
import { Head, Stats, Nota, GridTable, BarsChart, fM, fP, fP2, fX } from "./piezas";
import { ok } from "../../lib/activos";
import { money, pct } from "../../lib/format";

/* ============================================================
   ACTIVO · 7. TABLERO COMPARATIVO
   ============================================================ */
export default function TabResultados({ A, R }: any) {
  const cel = (v, f) => ({ t: f(v), neg: typeof v === "number" && v < 0 });

  return (
    <>
      <Head titulo="Tablero comparativo"
        texto="Todo se calcula en las pestañas anteriores. Aquí sólo se comparan. En el vehículo el número es un costo, así que siempre es negativo: ahí gana el menor." />

      <Card title="VPN por tipo de inversión">
        <BarsChart items={[
          { name: "Maquinaria", v: R.maq.vpn },
          { name: "Inmueble", v: R.inm.vpn },
          { name: "Terreno", v: R.ter.vpn },
          { name: "Vehículo (costo)", v: R.auto.vpA },
        ]} />
      </Card>

      <Card title="Indicadores lado a lado" pad={false}>
        <GridTable
          head={["Indicador", "Maquinaria", "Inmueble", "Terreno", "Vehículo"]}
          rows={[
            { hi: true, cells: ["VPN", cel(R.maq.vpn, fM), cel(R.inm.vpn, fM), cel(R.ter.vpn, fM), cel(R.auto.vpA, fM)] },
            { cells: ["TIR", fP(R.maq.tir), fP(R.inm.tir), fP(R.ter.tir), "—"] },
            { cells: ["TIRM", fP(R.maq.tirm), "—", "—", "—"] },
            { cells: ["VAE / CAE", cel(R.maq.vaeV, fM), cel(R.inm.vaeV, fM), cel(R.ter.vaeV, fM), cel(R.auto.caeA, fM)] },
            { cells: ["Payback descontado", ok(R.maq.pb) ? R.maq.pb + " años" : "—", "—", "—", "—"] },
            { cells: ["Tasa aplicada", fP2(R.maq.td), fP2(R.inm.td), fP2(R.ter.td), fP2(R.auto.td)] },
            { cells: ["Horizonte", A.maq.ve + " años", A.inm.hor + " años", A.ter.hor + " años", A.auto.anios + " años"] },
            { sum: true, cells: ["Veredicto",
              R.maq.vpn > 0 ? "Crea valor" : "Destruye valor",
              R.inm.vpn > 0 ? "Crea valor" : "Destruye valor",
              R.ter.vpn > 0 ? "Crea valor" : "Destruye valor",
              R.auto.ganador] },
          ]}
        />
        <Nota>El VPN del vehículo es un costo en valor presente, no una ganancia: entre las tres formas de tenerlo gana la menos negativa.</Nota>
      </Card>

      <Card title="Si tienes que elegir entre varias">
        {[
          ["¿Alcanza el capital para todas?", "Acepta todas las de VPN positivo. No compiten entre sí."],
          ["¿El capital está racionado?", "Ordena por índice de rentabilidad, no por VPN absoluto."],
          ["¿Son mutuamente excluyentes?", "Gana el VPN más alto. La TIR se equivoca cuando las escalas difieren."],
          ["¿Tienen vidas distintas?", "Compara por VAE, nunca por VPN directo."],
          ["¿Empatan?", "Desempata con el payback descontado y con qué tan reversible es cada decisión."],
        ].map(([q, a]) => (
          <div key={q} className="grid gap-4 py-2" style={{ gridTemplateColumns: "1fr 1.4fr", borderBottom: `1px dotted ${C.line}` }}>
            <div className="text-[12.5px] font-semibold" style={{ color: C.ink }}>{q}</div>
            <div className="text-[12.5px]" style={{ color: C.muted }}>{a}</div>
          </div>
        ))}
      </Card>
    </>
  );
}
