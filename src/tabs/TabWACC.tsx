import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, TxtArea, Slider, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import { iaFetch } from "../lib/ia";
import { leerJSON } from "../lib/investigacion";
import { estadoPerfil, textoPerfil, MIN_PALABRAS } from "../lib/perfil";

/* ============================================================
   10. COSTO DE CAPITAL + IA DAMODARAN
   ============================================================ */
export default function TabWACC({ s, up, m, flash, irA }: any) {
  const w = s.wacc;
  const [cargando, setCargando] = useState(false);
  const [res, setRes] = useState<any>(null);
  /* cómo estaban los parámetros antes de llenarlos, para poder deshacer */
  const [antes, setAntes] = useState<any>(null);
  const st = estadoPerfil(s);

  /* Campos que la IA puede llenar, en el orden en que aparecen en la tabla */
  const CAMPOS = [
    { k: "rf", etiqueta: "Tasa libre de riesgo", esPct: true },
    { k: "beta", etiqueta: "Beta desapalancada", esPct: false },
    { k: "erp", etiqueta: "Prima de mercado (ERP)", esPct: true },
    { k: "pTamano", etiqueta: "Prima por tamaño", esPct: true },
    { k: "pStartup", etiqueta: "Prima por etapa", esPct: true },
    { k: "crp", etiqueta: "Riesgo país", esPct: true },
    { k: "conv", etiqueta: "Prima de negociación", esPct: true },
  ];

  /* Semáforo de la estructura de capital, sobre la proporción de deuda */
  const TRAMOS = [
    { desde: 0, hasta: 15, color: C.warn },
    { desde: 15, hasta: 45, color: C.pos },
    { desde: 45, hasta: 60, color: C.warn },
    { desde: 60, hasta: 100, color: C.neg },
  ];
  const zonaDe = (wD) => {
    const d = (wD || 0) * 100;
    if (d < 15) return { color: C.warn, titulo: "Poco apalancamiento",
      texto: "Casi todo se financia con capital propio. Es lo más seguro, pero desperdicias el escudo fiscal y el WACC te sale más caro." };
    if (d <= 45) return { color: C.pos, titulo: "Estructura sana",
      texto: "Aprovechas el escudo fiscal sin que el pago de la deuda mande sobre la operación. Es la banda en la que trabaja la mayoría de las empresas." };
    if (d <= 60) return { color: C.warn, titulo: "Apalancamiento alto",
      texto: "Todavía es manejable, pero un año flojo te deja sin margen para pagar. Revisa la cobertura del crédito antes de subirle más." };
    return { color: C.neg, titulo: "Demasiada deuda",
      texto: "El proyecto depende del banco más que de la operación: cualquier tropiezo en las ventas se vuelve un problema de pago." };
  };
  const zona = zonaDe(w.wD);

  /* Un solo botón: toma el perfil de Empresa y supuestos, busca los datos de
     mercado y los aplica de una vez. Lo que había antes se guarda para poder
     deshacer, porque el botón pisa lo que se hubiera capturado a mano. */
  const obtener = async () => {
    if (!st.listo) {
      flash(`Primero describe tu empresa en Empresa y supuestos: faltan ${st.faltan} palabras.`);
      return;
    }
    setCargando(true); setRes(null);
    try {
      const r = await iaFetch({
          maxTokens: 8000,
          buscar: true,
          prompt: `Eres analista financiero. Vas a llenar los parámetros de mercado del costo de capital (CAPM) de esta empresa.

PERFIL DE LA EMPRESA (lo capturó el empresario en Empresa y supuestos):
${textoPerfil(s)}

SECTOR DECLARADO: "${w.sector || "(no declarado: dedúcelo del perfil)"}"

Busca los datos más recientes en las bases públicas de Aswath Damodaran (NYU Stern, páginas "Data: Current" y "Country Default Spreads and Risk Premiums") y el rendimiento actual del bono gubernamental a 10 años del país donde opera la empresa (en México, el Bono M 10 años). Si el perfil no dice el país, supón México.

Devuelve estos campos:
1. sector: nombre exacto de la industria de Damodaran que mejor corresponde al perfil.
2. rf: tasa libre de riesgo, el bono soberano a 10 años de ese país.
3. beta: beta desapalancada (unlevered beta) de esa industria, mercados emergentes o global.
4. erp: prima de riesgo de mercado madura (ERP implícita del S&P 500).
5. crp: country risk premium del país donde opera.
6. pTamano: prima por tamaño, según las ventas del último año, las personas trabajando y la liquidez del perfil. 0 si es una empresa grande; sube hasta 0.05 en una microempresa.
7. pStartup: prima por etapa, según la etapa y los años operando del perfil. 0 si es un negocio establecido con historial; entre 0.03 y 0.10 si es idea o arranque, o si el producto no está probado.
8. conv: prima de negociación por iliquidez, dependencia de un cliente (qué parte de las ventas es el cliente más grande), gobierno corporativo (quién toma las decisiones) o proveedores críticos. 0 si no hay razón clara.
9. notas: objeto con una línea corta de justificación para cada campo: {"rf","beta","erp","crp","pTamano","pStartup","conv"}. Cuando uses un dato del perfil, cítalo.
10. fecha: fecha o edición de los datos de Damodaran que usaste.
11. nota: una línea explicando qué industria elegiste y por qué.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin backticks y sin texto adicional, con esta forma exacta:
{"sector":"...","rf":0.0872,"beta":1.15,"erp":0.0433,"crp":0.0379,"pTamano":0.02,"pStartup":0.05,"conv":0.00,"notas":{"rf":"...","beta":"...","erp":"...","crp":"...","pTamano":"...","pStartup":"...","conv":"..."},"fecha":"...","nota":"..."}
Los valores numéricos deben ser decimales (0.045 = 4.5%).`,
        });
      const parsed = leerJSON(r);
      /* sólo números de verdad: un "n/d" o un texto no pisa lo que ya había */
      const valor = (k: string) => { const v = parsed[k]; const x = typeof v === "number" ? v : parseFloat(v); return v != null && v !== "" && isFinite(x) ? x : null; };
      const previo: any = { sector: w.sector, fuente: w.fuente, notas: { ...(w.notas || {}) } };
      CAMPOS.forEach(({ k }) => { previo[k] = w[k]; });
      const industria = parsed.sector || parsed.industria || w.sector;
      up((n) => {
        CAMPOS.forEach(({ k }) => { const x = valor(k); if (x != null) n.wacc[k] = x; });
        if (industria) n.wacc.sector = industria;
        n.wacc.notas = n.wacc.notas || {};
        if (parsed.notas) CAMPOS.forEach(({ k }) => { if (parsed.notas[k]) n.wacc.notas[k] = String(parsed.notas[k]); });
        n.wacc.fuente = `Damodaran · ${industria} · ${parsed.fecha || ""}`;
      });
      setAntes(previo);
      setRes({ ...parsed, ...Object.fromEntries(CAMPOS.map(({ k }) => [k, valor(k)])) });
      flash("Parámetros de costo de capital obtenidos y aplicados.");
    } catch (e: any) {
      flash("No se pudieron obtener los parámetros: " + e.message);
    } finally { setCargando(false); }
  };

  const deshacer = () => {
    if (!antes) return;
    up((n) => {
      CAMPOS.forEach(({ k }) => { n.wacc[k] = antes[k]; });
      n.wacc.sector = antes.sector;
      n.wacc.fuente = antes.fuente;
      n.wacc.notas = { ...antes.notas };
    });
    setAntes(null); setRes(null);
    flash("Se restauraron los parámetros anteriores.");
  };

  const Row = ({ label, children, valor, nota, notaKey }: any) => (
    <tr>
      <Td align="left" w="30%">{label}</Td>
      <Td w="120">{children}</Td>
      <Td align="left" color={C.muted}>
        {notaKey
          ? <TxtIn value={w.notas[notaKey] || ""} onChange={(v) => up((n) => { n.wacc.notas[notaKey] = v; })} placeholder="Fuente / justificación" />
          : nota}
      </Td>
    </tr>
  );

  return (
    <>
      <Card title="Parámetros de mercado" sub="El costo de capital es la vara con la que se mide todo lo demás."
        right={<Btn kind="primary" onClick={obtener} disabled={cargando || !st.listo}
          title={st.listo ? "Toma el perfil de Empresa y supuestos, busca los datos de Damodaran y los aplica a la tabla" : "Completa primero la descripción de tu empresa en Empresa y supuestos"}>
          {cargando ? "OBTENIENDO PARÁMETROS…" : "OBTENER PARÁMETROS DE COSTO DE CAPITAL"}
        </Btn>}>
        {/* la descripción ya no se escribe aquí: se lee de Empresa y supuestos */}
        <div className="mb-3 rounded-lg px-3 py-2 flex items-center justify-between gap-3 flex-wrap text-[11.5px] leading-relaxed"
          style={{ background: st.listo ? C.soft : "#FBF3E0", border: `1px solid ${st.listo ? C.line : "#E9CF8F"}` }}>
          <span style={{ color: st.listo ? C.muted : C.ink }}>
            {st.listo ? (
              <>Usa la descripción y el diagnóstico de <b style={{ color: C.ink }}>Empresa y supuestos</b> ({st.palabras} palabras · {st.respondidas} de {st.total} preguntas
                respondidas). Busca los datos de Damodaran para tu industria, ajusta las primas de tamaño, etapa y negociación a tu perfil y los
                aplica directo a la tabla. Usa tu propia llave de «CARGA DE API KEY».</>
            ) : (
              <><b>Falta la descripción de tu empresa.</b> Llevas {st.palabras} de {MIN_PALABRAS} palabras. El botón se habilita en cuanto la
                completes en Empresa y supuestos.</>
            )}
          </span>
          <button onClick={() => irA?.("empresa")} className="text-[11px] font-medium hover:underline shrink-0" style={{ color: C.azul }}>
            {st.listo ? "Revisar el perfil →" : "Ir a Empresa y supuestos →"}
          </button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-3">
          <Field label="Sector / industria" hint="Como lo nombraría Damodaran: Apparel, Retail (General), Software (System & Application), Trucking… El botón lo llena por ti.">
            <TxtIn value={w.sector} onChange={(v) => up((n) => { n.wacc.sector = v; })} />
          </Field>
          {w.fuente && <div className="col-span-2 text-[11px] self-end pb-2" style={{ color: C.muted }}>Fuente activa: {w.fuente}</div>}
        </div>

        {res && (
          <div className="mb-4 rounded p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
            <div className="text-[12px] font-semibold mb-2" style={{ color: C.pos }}>✓ Parámetros obtenidos y aplicados a la tabla</div>
            <div className="grid grid-cols-4 gap-3 mb-2">
              {CAMPOS.filter(({ k }) => res[k] != null).map(({ k, etiqueta, esPct }) => (
                <KPI key={k} label={etiqueta} value={esPct ? pct(res[k], 2) : num(res[k], 2)} sub={res.notas ? res.notas[k] : null} />
              ))}
            </div>
            <div className="text-[11.5px] mb-2" style={{ color: C.muted }}>
              <b style={{ color: C.ink }}>{res.sector || res.industria}</b> · {res.fecha}. {res.nota}
            </div>
            <div className="flex gap-2">
              {antes && <Btn small kind="danger" onClick={deshacer}>Deshacer: volver a los anteriores</Btn>}
              <Btn small onClick={() => setRes(null)}>Cerrar</Btn>
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
            <Row label="Prima por tamaño" notaKey="pTamano"><PctIn value={w.pTamano} dec={2} onChange={(v) => up((n) => { n.wacc.pTamano = v; })} /></Row>
            <Row label="Prima por etapa (startup)" notaKey="pStartup"><PctIn value={w.pStartup} dec={2} onChange={(v) => up((n) => { n.wacc.pStartup = v; })} /></Row>
            <Row label="Riesgo país" notaKey="crp"><PctIn value={w.crp} dec={2} onChange={(v) => up((n) => { n.wacc.crp = v; })} /></Row>
            <Row label="Prima de negociación" notaKey="conv"><PctIn value={w.conv} dec={2} onChange={(v) => up((n) => { n.wacc.conv = v; })} /></Row>
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Estructura de capital">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Proporción de capital propio"><PctIn value={w.wE} dec={1} onChange={(v) => up((n) => { n.wacc.wE = v; n.wacc.wD = 1 - v; })} /></Field>
            <Field label="Proporción de deuda"><PctIn value={w.wD} dec={1} onChange={(v) => up((n) => { n.wacc.wD = v; n.wacc.wE = 1 - v; })} /></Field>
          </div>

          <div className="mt-3">
            <Slider value={(w.wD || 0) * 100} color={zona.color} tramos={TRAMOS}
              onChange={(v) => up((n) => { n.wacc.wD = v / 100; n.wacc.wE = 1 - v / 100; })} />
            <div className="flex justify-between text-[10px] -mt-1" style={{ color: C.muted }}>
              <span>Todo capital propio</span>
              <span>Mitad y mitad</span>
              <span>Todo deuda</span>
            </div>
            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded"
              style={{ background: zona.color + "14", border: `1px solid ${zona.color}33` }}>
              <span style={{ width: 10, height: 10, borderRadius: 9999, background: zona.color, marginTop: 4, flexShrink: 0 }} />
              <div className="text-[12px]">
                <b style={{ color: zona.color }}>{zona.titulo} · {pct(w.wD, 1)} de deuda</b>
                <span style={{ color: C.muted }}> — {zona.texto}</span>
              </div>
            </div>
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
