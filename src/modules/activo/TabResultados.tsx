import React from "react";
import { C } from "../../lib/theme";
import { Card } from "../../components/ui";
import { Head, Stats, Nota, GridTable, BarsChart, fM, fP, fP2, fX } from "./piezas";
import { ok } from "../../lib/activos";
import { money, pct } from "../../lib/format";

/* ============================================================
   ACTIVO · 7. TABLERO COMPARATIVO

   La pregunta útil no es "¿cuál es mi tasa?" sino "¿hasta qué tasa
   aguanta este proyecto?". Ese número ya se calcula: es la tasa a
   la que el VPN se hace cero, o sea la TIR. Comparado contra la
   tasa aplicada da el colchón, y el colchón es lo que de verdad
   se defiende frente a un dueño o un inversionista.
   ============================================================ */

/* Puntos porcentuales de colchón entre lo que rinde y lo que le exiges */
const colchon = (tir, td) => (ok(tir) && ok(td) ? tir - td : null);

const fPts = (v) => (ok(v) ? (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + " pts" : "—");

/* Tarjeta por activo: hasta dónde aguanta, y qué tan holgado va */
function Aguante({ nombre, tir, td, nota }: any) {
  const m = colchon(tir, td);
  const tono = !ok(m) ? C.muted : m >= 0.05 ? C.pos : m >= 0 ? "#8A5D0C" : C.neg;
  const bg = !ok(m) ? C.soft : m >= 0.05 ? "#E9F3ED" : m >= 0 ? "#FAF2DF" : "#FBEAE8";
  return (
    <div className="rounded-md px-3.5 py-3" style={{ background: bg, border: `1px solid ${tono}` }}>
      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{nombre}</div>
      {ok(tir) ? (
        <>
          <div className="text-[19px] font-semibold leading-tight mt-1" style={{ color: tono, fontVariantNumeric: "tabular-nums" }}>
            Aguanta hasta {fP(tir)}
          </div>
          <div className="text-[11.5px] mt-1 leading-snug" style={{ color: C.ink }}>
            Le exiges {fP2(td)}. Colchón de <b>{fPts(m)}</b>.
          </div>
          <div className="text-[11px] mt-1.5 leading-snug" style={{ color: C.muted }}>
            {m < 0
              ? "No alcanza: tu tasa tendría que bajar para que convenga."
              : m < 0.05
                ? "Va en el filo: cualquier tropiezo en los supuestos lo voltea."
                : "Tu costo de capital tendría que subir más de eso para que deje de convenir."}
          </div>
        </>
      ) : (
        <>
          <div className="text-[15px] font-semibold leading-tight mt-1" style={{ color: C.muted }}>No aplica</div>
          <div className="text-[11px] mt-1.5 leading-snug" style={{ color: C.muted }}>{nota}</div>
        </>
      )}
    </div>
  );
}

export default function TabResultados({ A, R }: any) {
  const cel = (v, f) => ({ t: f(v), neg: typeof v === "number" && v < 0 });
  const vered = (vpn, tir, td) => {
    const m = colchon(tir, td);
    if (!ok(m)) return vpn > 0 ? "Crea valor" : "Destruye valor";
    return m < 0 ? "No alcanza" : m < 0.05 ? "En el filo" : "Aguanta de sobra";
  };

  return (
    <>
      <Head titulo="Tablero comparativo"
        texto="Todo se calcula en las pestañas anteriores. Aquí sólo se comparan. En el vehículo el número es un costo, así que siempre es negativo: ahí gana el menor." />

      <Card title="¿Hasta qué tasa aguanta cada proyecto?"
        sub="Nadie acierta la tasa de descuento al decimal. Pero sí puedes saber cuánto tendrías que equivocarte para que la decisión cambie.">
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
          <Aguante nombre="Maquinaria" tir={R.maq.tir} td={R.maq.td} />
          <Aguante nombre="Inmueble" tir={R.inm.tir} td={R.inm.td} />
          <Aguante nombre="Terreno" tir={R.ter.tir} td={R.ter.td} />
          <Aguante nombre="Vehículo" tir={null} td={R.auto.td}
            nota="El vehículo no tiene tasa de equilibrio: todos sus flujos son salidas. La decisión no es si comprarlo, sino cómo pagarlo." />
        </div>
        <Nota>
          «Aguanta hasta» es la tasa a la que el VPN se hace cero. Si está muy por encima de la que le exiges, deja de
          importar que tu tasa base sea 15% o 17%: el proyecto conviene en todo ese rango. Si el colchón es de dos o
          tres puntos, la decisión no depende de la tasa, depende de los supuestos de flujo — y ahí sí vale la pena
          pelearse, en la pestaña de sensibilidad.
        </Nota>
      </Card>

      <Card title="¿Hasta cuánto aguantas con deuda?"
        sub="El tope no lo decides tú: lo pone el flujo del propio activo (DSCR) o su valor como garantía. Manda el que pegue primero." pad={false}>
        <GridTable
          head={["", "Maquinaria", "Inmueble", "Terreno", "Vehículo"]}
          rows={[
            { cells: ["Lo que estás pidiendo", fP(A.maq.ltvM), fP(A.inm.ltv), "—", fP(1 - A.auto.pctEng)] },
            { hi: true, cells: ["Hasta dónde te prestan", fP(R.maq.ltvMax), fP(R.inm.ltvMax), "No aplica", "Lo que dé la agencia"] },
            { cells: ["Qué te limita",
              R.maq.limita === "garantia" ? "La garantía" : "El flujo (DSCR)",
              R.inm.limita === "garantia" ? "La garantía" : "El flujo (DSCR)",
              "No tiene flujo propio", "Tu bolsillo"] },
            { cells: ["Pone el banco", cel(R.maq.monto, fM), cel(R.inm.monto, fM), cel(0, fM), cel(A.auto.precio * (1 - A.auto.pctEng), fM)] },
            { hi: true, cells: ["Sale de tu bolsa", cel(R.maq.capProp, fM), cel(R.inm.capProp, fM), cel(R.ter.invTot, fM), cel(A.auto.precio * A.auto.pctEng, fM)] },
            { cells: ["Mínimo que pondrías tú", cel(R.maq.propioMin, fM), cel(R.inm.propioMin, fM), cel(R.ter.invTot, fM), "—"] },
            { cells: ["DSCR año 1", fX(R.maq.dscr), fX(R.inm.dscr), "—", "—"] },
            { cells: ["El activo rinde", fP(R.maq.tir), fP(R.inm.tir), fP(R.ter.tir), "—"] },
            { cells: ["El crédito cuesta", fP2(A.maq.tcM), fP2(A.inm.th), "—", fP2(A.auto.tc)] },
            { sum: true, cells: ["¿La deuda suma?",
              R.maq.apalancaSuma ? "Sí, amplifica" : "No, resta",
              R.inm.apalancaSuma ? "Sí, amplifica" : "No, resta",
              "Nadie lo financia solo", "Ver las tres opciones"] },
          ]}
        />
        <Nota>
          Al terreno nadie te lo financia contra sí mismo: no produce flujo con qué pagar el crédito, así que el
          banco te pediría otra garantía y el pago saldría de la operación. Por eso ahí sale completo de tu bolsa.
          Y ojo con la última línea: la deuda sólo amplifica hacia arriba cuando el activo rinde más de lo que
          cobra el banco. Cuando rinde menos, apalancarte te hunde más rápido.
        </Nota>
      </Card>

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
            { tasa: true, cells: ["Tasa de descuento aplicada", fP2(R.maq.td), fP2(R.inm.td), fP2(R.ter.td), fP2(R.auto.td)] },
            { cells: ["Aguanta hasta (TIR)", fP(R.maq.tir), fP(R.inm.tir), fP(R.ter.tir), "—"] },
            { hi: true, cells: ["Colchón de tasa",
              fPts(colchon(R.maq.tir, R.maq.td)),
              fPts(colchon(R.inm.tir, R.inm.td)),
              fPts(colchon(R.ter.tir, R.ter.td)), "—"] },
            { cells: ["TIRM", fP(R.maq.tirm), "—", "—", "—"] },
            { cells: ["VAE / CAE", cel(R.maq.vaeV, fM), cel(R.inm.vaeV, fM), cel(R.ter.vaeV, fM), cel(R.auto.caeA, fM)] },
            { cells: ["Payback descontado", ok(R.maq.pb) ? R.maq.pb + " años" : "—", "—", "—", "—"] },
            { cells: ["Horizonte", A.maq.ve + " años", A.inm.hor + " años", A.ter.hor + " años", A.auto.anios + " años"] },
            { sum: true, cells: ["Veredicto",
              vered(R.maq.vpn, R.maq.tir, R.maq.td),
              vered(R.inm.vpn, R.inm.tir, R.inm.td),
              vered(R.ter.vpn, R.ter.tir, R.ter.td),
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
          ["¿Dudas de la tasa?", "Mira el colchón. Si es amplio en las dos, la tasa no es lo que decide."],
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
