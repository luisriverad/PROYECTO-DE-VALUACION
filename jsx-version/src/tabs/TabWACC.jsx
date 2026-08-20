import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import { claudeFetch, textoDe } from "../lib/claude";

/* ============================================================
   10. COSTO DE CAPITAL + IA DAMODARAN
   ============================================================ */
export default function TabWACC({ s, up, m, flash }) {
  const w = s.wacc;
  const [cargando, setCargando] = useState(false);
  const [res, setRes] = useState(null);

  const buscarDamodaran = async () => {
    setCargando(true); setRes(null);
    try {
      const data = await claudeFetch({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `Busca en las bases de datos públicas de Aswath Damodaran (NYU Stern, páginas de "Data: Current" y "Country Default Spreads and Risk Premiums") los parámetros más recientes para valuar una empresa en México del sector: "${w.sector}".

Necesito:
1. beta: beta desapalancada (unlevered beta) de la industria más cercana, mercado global o emerging markets.
2. erp: equity risk premium madura (mature market premium, típicamente el implícito del S&P 500).
3. crp: country risk premium de México.
4. rf: tasa libre de riesgo, rendimiento del bono gubernamental mexicano a 10 años (Bono M).
5. industria: nombre exacto de la industria de Damodaran que usaste.
6. fecha: fecha o edición de los datos.
7. nota: una línea explicando qué industria elegiste y por qué.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin backticks y sin texto adicional, con esta forma exacta:
{"beta":1.15,"erp":0.045,"crp":0.035,"rf":0.095,"industria":"...","fecha":"...","nota":"..."}
Los valores numéricos deben ser decimales (0.045 = 4.5%).`
          }],
        });
      const txt = textoDe(data);
      const j = txt.replace(/```json|```/g, "").trim();
      const start = j.indexOf("{"), end = j.lastIndexOf("}");
      const parsed = JSON.parse(j.slice(start, end + 1));
      setRes(parsed);
    } catch (e) {
      flash("No se pudo obtener la información: " + e.message);
    } finally { setCargando(false); }
  };

  const aplicar = () => {
    up((n) => {
      if (isFinite(res.beta)) n.wacc.beta = res.beta;
      if (isFinite(res.erp)) n.wacc.erp = res.erp;
      if (isFinite(res.crp)) n.wacc.crp = res.crp;
      if (isFinite(res.rf)) n.wacc.rf = res.rf;
      n.wacc.fuente = `Damodaran · ${res.industria || w.sector} · ${res.fecha || ""}`;
      n.wacc.notas.beta = res.nota || n.wacc.notas.beta;
    });
    flash("Parámetros aplicados al modelo.");
  };

  const Row = ({ label, children, valor, nota, notaKey }) => (
    <tr>
      <Td align="left" w="30%">{label}</Td>
      <Td w="120">{children}</Td>
      <Td align="left" color={C.muted}>
        {notaKey
          ? <TxtIn value={w.notas[notaKey]} onChange={(v) => up((n) => { n.wacc.notas[notaKey] = v; })} placeholder="Fuente / justificación" />
          : nota}
      </Td>
    </tr>
  );

  return (
    <>
      <Card title="Parámetros de mercado" sub="El costo de capital es la vara con la que se mide todo lo demás."
        right={<Btn kind="primary" small onClick={buscarDamodaran} disabled={cargando}>{cargando ? "Buscando…" : "Buscar datos Damodaran con IA"}</Btn>}>
        <div className="mb-3 grid grid-cols-3 gap-3">
          <Field label="Sector / industria" hint="Escríbelo como lo nombraría Damodaran: Apparel, Retail (General), Software (System & Application), Trucking…">
            <TxtIn value={w.sector} onChange={(v) => up((n) => { n.wacc.sector = v; })} />
          </Field>
          {w.fuente && <div className="col-span-2 text-[11px] self-end pb-2" style={{ color: C.muted }}>Fuente activa: {w.fuente}</div>}
        </div>

        {res && (
          <div className="mb-4 rounded p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
            <div className="text-[12px] font-semibold mb-2">Resultado de la búsqueda</div>
            <div className="grid grid-cols-4 gap-3 mb-2">
              <KPI label="Beta desapalancada" value={num(res.beta, 2)} />
              <KPI label="ERP madura" value={pct(res.erp, 2)} />
              <KPI label="Country risk premium" value={pct(res.crp, 2)} />
              <KPI label="Tasa libre de riesgo" value={pct(res.rf, 2)} />
            </div>
            <div className="text-[11.5px] mb-2" style={{ color: C.muted }}>
              <b style={{ color: C.ink }}>{res.industria}</b> · {res.fecha}. {res.nota}
            </div>
            <div className="flex gap-2">
              <Btn kind="dark" small onClick={aplicar}>Aplicar al modelo</Btn>
              <Btn small onClick={() => setRes(null)}>Descartar</Btn>
            </div>
            <div className="text-[10.5px] mt-2" style={{ color: C.muted }}>
              Verifica los datos contra la fuente original antes de defenderlos frente a un inversionista.
            </div>
          </div>
        )}

        <table className="w-full">
          <thead><tr><Th align="left">Componente</Th><Th>Valor</Th><Th align="left">Observaciones</Th></tr></thead>
          <tbody>
            <Row label="Tasa libre de riesgo" notaKey="rf"><PctIn value={w.rf} dec={3} onChange={(v) => up((n) => { n.wacc.rf = v; })} /></Row>
            <Row label="Beta" notaKey="beta"><NumIn value={w.beta} dec={2} onChange={(v) => up((n) => { n.wacc.beta = v; })} /></Row>
            <Row label="Prima de riesgo de mercado (ERP)" notaKey="erp"><PctIn value={w.erp} dec={2} onChange={(v) => up((n) => { n.wacc.erp = v; })} /></Row>
            <Row label="Prima por tamaño" nota="Empresa pequeña, menor liquidez"><PctIn value={w.pTamano} dec={2} onChange={(v) => up((n) => { n.wacc.pTamano = v; })} /></Row>
            <Row label="Prima por etapa (startup)" nota="Riesgo de ejecución del arranque"><PctIn value={w.pStartup} dec={2} onChange={(v) => up((n) => { n.wacc.pStartup = v; })} /></Row>
            <Row label="Riesgo país" notaKey="crp"><PctIn value={w.crp} dec={2} onChange={(v) => up((n) => { n.wacc.crp = v; })} /></Row>
            <Row label="Prima de negociación" nota="Ajuste discrecional del inversionista"><PctIn value={w.conv} dec={2} onChange={(v) => up((n) => { n.wacc.conv = v; })} /></Row>
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Estructura de capital">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Proporción de capital propio"><PctIn value={w.wE} dec={1} onChange={(v) => up((n) => { n.wacc.wE = v; n.wacc.wD = 1 - v; })} /></Field>
            <Field label="Proporción de deuda"><PctIn value={w.wD} dec={1} onChange={(v) => up((n) => { n.wacc.wD = v; n.wacc.wE = 1 - v; })} /></Field>
          </div>
          <table className="w-full mt-3">
            <tbody>
              <tr><Td align="left">Costo de deuda antes de impuestos</Td><Td>{pct(m.kdAntes, 2)}</Td></tr>
              <tr><Td align="left">Escudo fiscal</Td><Td color={C.pos}>−{pct(m.kdAntes * s.supuestos.isr, 2)}</Td></tr>
              <tr><Td align="left" bold>Costo de deuda después de impuestos</Td><Td bold>{pct(m.kdNom, 2)}</Td></tr>
            </tbody>
          </table>
        </Card>

        <Card title="Resultado">
          <table className="w-full">
            <tbody>
              <tr><Td align="left">CAPM nominal</Td><Td bold>{pct(m.capmNom, 2)}</Td></tr>
              <tr><Td align="left" color={C.muted}>CAPM real (deflactado)</Td><Td>{pct(m.capmReal, 2)}</Td></tr>
              <tr><Td align="left" bold>WACC nominal</Td><Td bold>{pct(m.waccNom, 2)}</Td></tr>
              <tr><Td align="left" color={C.muted}>WACC real</Td><Td>{pct(m.waccReal, 2)}</Td></tr>
            </tbody>
          </table>
          <div className="mt-3 px-3 py-2 rounded text-[12px]" style={{ background: C.soft, color: C.muted }}>
            El modelo descuenta con el <b style={{ color: C.ink }}>WACC nominal ({pct(m.waccNom, 2)})</b> porque los flujos están proyectados con inflación. Si proyectas a precios constantes, usa el WACC real.
          </div>
        </Card>
      </div>
    </>
  );
}
