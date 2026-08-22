import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, LlaveIA, inputCls, inputSt } from "../components/ui";
import { claudeFetch, textoDe } from "../lib/claude";

/* ============================================================
   13. DIAGNÓSTICO IA
   ============================================================ */
export default function TabIA({ s, m }) {
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  const diagnosticar = async () => {
    setCargando(true); setTexto(""); setError("");
    const resumen = {
      empresa: s.empresa.nombre, tipo: s.empresa.tipo, horizonte: s.supuestos.horizonte,
      inversion: Math.round(m.inversion), vpn: Math.round(m.vpn), tir: m.tir, wacc: m.waccNom,
      payback: m.dpbp, ventasAnio1: Math.round(m.anios[0]?.ventas || 0),
      margenBrutoAnio1: m.anios[0] ? m.anios[0].ub / m.anios[0].ventas : null,
      ebitdaAnio1: Math.round(m.anios[0]?.ebitda || 0),
      ebitPorAnio: m.anios.map((a) => Math.round(a.ebit)),
      ventasPorAnio: m.anios.map((a) => Math.round(a.ventas)),
      usoCapacidad: m.capacidad.uso, puntoEquilibrioUnidades: Math.round(m.peUnidades),
      unidadesAnio1: Math.round(m.unidadesAnio[0]), absorcionPorUnidad: Math.round(m.absorcion),
      equity: Math.round(m.equity), participacionPostMoney: m.pctPost,
      capitalTrabajoAnio1: Math.round(m.ct[1]?.ctn || 0),
      creditoMonto: s.credito.activo ? s.credito.monto : 0, tasaCredito: s.credito.tasaAnual,
      productos: m.prod.map((p) => ({ nombre: p.nombre, mix: p.mix, precio: p.precio, costoEstandar: Math.round(p.estandar), margenReal: p.margenReal })),
    };
    try {
      const data = await claudeFetch({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Eres un consultor senior de rentabilidad evaluando un proyecto de inversión para un comité. Tono ejecutivo, directo, sin preámbulo, español de México. Nada de adjetivos vacíos.

Datos del modelo:
${JSON.stringify(resumen, null, 1)}

Entrega, en máximo 350 palabras y en texto plano sin markdown:
LECTURA DEL CASO: 3 hallazgos duros, con los números que los sostienen.
RIESGO PRINCIPAL: el supuesto que si falla tumba el caso.
CONCLUSIÓN: una frase.
DECISIÓN: invertir / negociar condiciones / rediseñar el modelo / no invertir, y por qué.
ELIMINACIÓN: qué hay que quitar o dejar de hacer para que el número mejore.`
          }],
        });
      const t = textoDe(data);
      setTexto(t || "Sin respuesta.");
    } catch (e) { setError("No se pudo generar el diagnóstico: " + e.message); }
    finally { setCargando(false); }
  };

  return (
    <>
      <Card title="Diagnóstico ejecutivo del proyecto" sub="La IA lee tu modelo completo y lo evalúa como lo haría un comité de inversión."
        right={<div className="flex gap-2 items-center">
          <LlaveIA />
          <Btn kind="primary" small onClick={diagnosticar} disabled={cargando}>{cargando ? "Analizando…" : "Generar diagnóstico"}</Btn>
        </div>}>
        {error && <div className="text-[12px] px-3 py-2 rounded mb-3" style={{ background: "#FDECEA", color: C.neg }}>{error}</div>}
        {texto ? (
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: C.ink }}>{texto}</div>
        ) : (
          <div className="text-[12.5px]" style={{ color: C.muted }}>
            El diagnóstico usa los resultados actuales: inversión de {money(m.inversion)}, VPN de {money(m.vpn)}, TIR de {pct(m.tir)} contra un WACC de {pct(m.waccNom)}.
          </div>
        )}
      </Card>

      <Card title="Tablero de defensa" sub="Los números que te van a preguntar en la presentación.">
        <div className="grid grid-cols-4 gap-3">
          <KPI label="Inversión requerida" value={money(m.inversion)} />
          <KPI label="VPN" value={money(m.vpn)} tone={m.vpn >= 0 ? "pos" : "neg"} />
          <KPI label="TIR vs WACC" value={pct(m.tir) + " / " + pct(m.waccNom)} tone={m.tir >= m.waccNom ? "pos" : "neg"} />
          <KPI label="Payback descontado" value={m.dpbp ? num(m.dpbp, 2) + " años" : "No recupera"} />
          <KPI label="Uso de capacidad" value={pct(m.capacidad.uso)} tone={m.capacidad.uso > 1 ? "neg" : "pos"} />
          <KPI label="Equilibrio Año 1" value={num(m.peUnidades, 0) + " u"} sub={`Plan: ${num(m.unidadesAnio[0], 0)} u`} />
          <KPI label="Valor del capital" value={money(m.equity)} />
          <KPI label="Participación post-money" value={pct(m.pctPost)} />
        </div>
      </Card>

      <Card title="Criterios de decisión" sub="Cómo se lee cada indicador.">
        <table className="w-full">
          <thead><tr><Th align="left" w="20%">Indicador</Th><Th align="left" w="34%">Regla</Th><Th align="left">Lectura de tu proyecto</Th></tr></thead>
          <tbody>
            <tr>
              <Td align="left" bold>VPN</Td>
              <Td align="left" color={C.muted}>Positivo: el proyecto crea valor por encima del costo del dinero.</Td>
              <Td align="left" color={m.vpn >= 0 ? C.pos : C.neg}>
                {m.vpn >= 0 ? `Crea ${money(m.vpn)} de valor sobre la exigencia del ${pct(m.waccNom, 1)}.` : `Destruye ${money(Math.abs(m.vpn))} contra la exigencia del ${pct(m.waccNom, 1)}.`}
              </Td>
            </tr>
            <tr>
              <Td align="left" bold>TIR</Td>
              <Td align="left" color={C.muted}>Debe superar al WACC con margen suficiente para el riesgo de ejecución.</Td>
              <Td align="left" color={m.tir >= m.waccNom ? C.pos : C.neg}>
                {isFinite(m.tir) ? `${pct(m.tir)} contra ${pct(m.waccNom)}: ${m.tir >= m.waccNom ? "spread de " + pct(m.tir - m.waccNom) : "por debajo del costo de capital"}.` : "No calculable con estos flujos."}
              </Td>
            </tr>
            <tr>
              <Td align="left" bold>Payback descontado</Td>
              <Td align="left" color={C.muted}>Cuánto tarda el dinero en volver, ya descontado.</Td>
              <Td align="left" color={m.dpbp ? C.ink : C.neg}>{m.dpbp ? `${num(m.dpbp, 2)} años dentro del horizonte.` : "No se recupera dentro del horizonte proyectado."}</Td>
            </tr>
            <tr>
              <Td align="left" bold>Capacidad</Td>
              <Td align="left" color={C.muted}>El plan de ventas debe caber en la operación instalada.</Td>
              <Td align="left" color={m.capacidad.uso > 1 ? C.neg : C.ink}>
                {m.capacidad.uso > 1 ? "El plan excede la capacidad: falta inversión o gente." : `Uso del ${pct(m.capacidad.uso)}; queda holgura para crecer.`}
              </Td>
            </tr>
          </tbody>
        </table>
      </Card>
    </>
  );
}

