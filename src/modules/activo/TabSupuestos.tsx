import React, { useState } from "react";
import { Card, Btn, Field, TxtArea, LlaveIA } from "../../components/ui";
import { C } from "../../lib/theme";
import { num } from "../../lib/format";
import { claudeFetch, textoDe } from "../../lib/claude";
import { Head, Cols, Campo, Derivado, Stats, fP, fP2 } from "./piezas";

/* ============================================================
   ACTIVO · 1. SUPUESTOS GENERALES
   ============================================================ */
export default function TabSupuestos({ A, up, R, flash }: any) {
  const [cargando, setCargando] = useState(false);
  const [res, setRes] = useState(null);

  /* Lo que la IA puede llenar de esta pestaña */
  const CAMPOS = [
    { k: "rf", etiqueta: "Tasa libre de riesgo", esPct: true },
    { k: "prm", etiqueta: "Prima de mercado", esPct: true },
    { k: "beta", etiqueta: "Beta apalancada", esPct: false },
    { k: "ptam", etiqueta: "Prima por tamaño", esPct: true },
    { k: "kd", etiqueta: "Costo de la deuda", esPct: true },
    { k: "wd", etiqueta: "% Deuda objetivo", esPct: true },
    { k: "inf", etiqueta: "Inflación anual", esPct: true },
  ];

  const analizar = async () => {
    const perfil = (A.sup.perfil || "").trim();
    if (!perfil) { flash("Describe la empresa y la inversión antes de buscar."); return; }
    setCargando(true); setRes(null);
    try {
      const data = await claudeFetch({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Eres analista financiero. Vas a llenar los supuestos de costo de capital con los que se va a evaluar la compra de un activo.

DESCRIPCIÓN DE LA EMPRESA Y DE LA INVERSIÓN:
"""
${perfil}
"""

Busca los datos más recientes en las bases públicas de Aswath Damodaran (NYU Stern, páginas "Data: Current" y "Country Default Spreads and Risk Premiums"), el rendimiento actual del bono gubernamental a 10 años del país donde opera la empresa (en México, el Bono M 10 años) y la inflación anual vigente de ese país. Si la descripción no dice el país, supón México.

Devuelve estos campos:
1. rf: tasa libre de riesgo, el bono soberano a 10 años.
2. prm: prima de riesgo de mercado del país, es decir la prima madura del S&P 500 más el country risk premium.
3. beta: beta apalancada de la industria que corresponde a esa empresa, reapalancada a una estructura como la que describe.
4. ptam: prima por tamaño e iliquidez, según ventas y empleados. Entre 0.01 y 0.04 en PyME; 0 en una empresa grande.
5. kd: costo de la deuda antes de impuestos, la tasa a la que un banco le presta hoy a una empresa así en ese país.
6. wd: proporción de deuda objetivo D/(D+E), entre 0 y 1, razonable para su sector y tamaño.
7. inf: inflación anual vigente del país.
8. notas: objeto con una línea corta de justificación para cada campo: {"rf","prm","beta","ptam","kd","wd","inf"}.
9. fecha: fecha o edición de los datos que usaste.
10. nota: una línea explicando qué industria y qué país tomaste.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin backticks y sin texto adicional, con esta forma exacta:
{"rf":0.095,"prm":0.065,"beta":1.10,"ptam":0.02,"kd":0.145,"wd":0.30,"inf":0.045,"notas":{"rf":"...","prm":"...","beta":"...","ptam":"...","kd":"...","wd":"...","inf":"..."},"fecha":"...","nota":"..."}
Los valores son decimales (0.045 = 4.5%), salvo la beta, que es un número.`
        }],
      });
      const txt = textoDe(data);
      const j = txt.replace(/```json|```/g, "").trim();
      const start = j.indexOf("{"), end = j.lastIndexOf("}");
      setRes(JSON.parse(j.slice(start, end + 1)));
    } catch (e) {
      flash("No se pudo obtener la información: " + e.message);
    } finally { setCargando(false); }
  };

  const aplicar = () => {
    up((n) => { CAMPOS.forEach(({ k }) => { if (isFinite(res[k])) n.sup[k] = res[k]; }); });
    flash("Supuestos aplicados: los cinco activos se recalcularon.");
  };

  return (
    <>
      <Head titulo="Supuestos generales"
        texto="Todo el módulo se alimenta de aquí. Cambia estas tasas antes que nada: mueven los cinco activos al mismo tiempo." />

      <Card title="Llena los supuestos con IA"
        sub="Describe la empresa y la inversión que estás evaluando; la IA busca los datos de mercado y propone las tasas."
        right={<div className="flex gap-2 items-center">
          <LlaveIA />
          <Btn kind="primary" small onClick={analizar} disabled={cargando}>{cargando ? "Analizando…" : "Llenar supuestos con IA"}</Btn>
        </div>}>
        <Field label="Describe la empresa y la inversión"
          hint="Entre más concreto, mejor: giro, país y ciudad, años operando, ventas anuales, empleados, cómo se financia hoy y qué activo estás evaluando comprar.">
          <TxtArea rows={4} value={A.sup.perfil} onChange={(v) => up((n) => { n.sup.perfil = v; })}
            placeholder="Ej.: Fábrica de calzado en León, Guanajuato. 12 años operando, ventas de 45 millones al año, 60 empleados, con un crédito bancario al 15%. Evalúa comprar maquinaria de inyección y una nave para rentar." />
        </Field>
        <div className="text-[11px] mt-2" style={{ color: C.muted }}>
          Cada quien usa su propia llave de Anthropic: se guarda sólo en tu navegador.
        </div>

        {res && (
          <div className="mt-4 rounded p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
            <div className="text-[12px] font-semibold mb-2">Lo que encontró la IA</div>
            <Stats items={CAMPOS.filter(({ k }) => isFinite(res[k])).map(({ k, etiqueta, esPct }) => ({
              k: etiqueta,
              valor: res[k],
              fmt: esPct ? fP2 : (v) => num(v, 2),
              signo: false,
              n: res.notas ? res.notas[k] : null,
            }))} />
            <div className="text-[11.5px] mt-2" style={{ color: C.muted }}>{res.fecha ? res.fecha + ". " : ""}{res.nota}</div>
            <div className="flex gap-2 mt-2">
              <Btn kind="dark" small onClick={aplicar}>Aplicar al modelo</Btn>
              <Btn small onClick={() => setRes(null)}>Descartar</Btn>
            </div>
            <div className="text-[10.5px] mt-2" style={{ color: C.muted }}>
              Verifica los datos contra la fuente original antes de defenderlos frente a un inversionista.
            </div>
          </div>
        )}
      </Card>

      <Cols
        izq={<>
          <Card title="Fiscal y macro">
            <Campo A={A} up={up} g="sup" k="isr" label="Tasa de ISR corporativo" hint="Usa tu tasa efectiva si difiere de la nominal" tipo="pct" />
            <Campo A={A} up={up} g="sup" k="inf" label="Inflación general anual" hint="Se aplica a costos y gastos fijos" tipo="pct" />
          </Card>

          <Card title="Costo de capital">
            <Campo A={A} up={up} g="sup" k="rf" label="Tasa libre de riesgo (Rf)" hint="Bono M 10 años, en pesos" tipo="pct" />
            <Campo A={A} up={up} g="sup" k="prm" label="Prima de riesgo de mercado" tipo="pct" />
            <Campo A={A} up={up} g="sup" k="beta" label="Beta apalancada" hint="Del sector, reapalancada con tu D/E" tipo="num" />
            <Campo A={A} up={up} g="sup" k="ptam" label="Prima por tamaño e iliquidez" hint="Típico 1% a 4% en PyME" tipo="pct" />
            <Derivado label="Costo del capital propio (Ke)" valor={fP2(R.sup.ke)} />
            <Campo A={A} up={up} g="sup" k="kd" label="Costo de la deuda (Kd)" hint="Tasa efectiva de tus créditos" tipo="pct" />
            <Derivado label="Kd después de impuestos" valor={fP2(R.sup.kdt)} />
            <Campo A={A} up={up} g="sup" k="wd" label="% Deuda   D/(D+E)" hint="Estructura objetivo, no la de hoy" tipo="pct" />
            <Derivado label="% Capital propio" valor={fP(R.sup.we)} />
            <Derivado label="WACC" hint="El mínimo que debe rendir una inversión de riesgo promedio" valor={fP2(R.sup.wacc)} />
          </Card>
        </>}
        der={
          <Card title="Tasa de descuento por tipo de activo"
            sub="Cada activo se descuenta al riesgo que le corresponde, no todos al WACC.">
            <Campo A={A} up={up} g="sup" k="pMaq" label="Maquinaria — prima adicional" hint="Mismo riesgo que la operación" tipo="pct" />
            <Derivado label="→ tasa aplicada" valor={fP2(R.sup.tasas.maq)} />
            <Campo A={A} up={up} g="sup" k="pInm" label="Inmueble — prima adicional" hint="Menor riesgo: flujo contractual" tipo="pct" />
            <Derivado label="→ tasa aplicada" valor={fP2(R.sup.tasas.inm)} />
            <Campo A={A} up={up} g="sup" k="pTer" label="Terreno — prima adicional" hint="Iliquidez y ausencia de flujo" tipo="pct" />
            <Derivado label="→ tasa aplicada" valor={fP2(R.sup.tasas.ter)} />
            <Campo A={A} up={up} g="sup" k="pAuto" label="Vehículo — prima adicional" hint="Parte de Kd después de ISR, no del WACC" tipo="pct" />
            <Derivado label="→ tasa aplicada" valor={fP2(R.sup.tasas.auto)} />
          </Card>
        }
      />
    </>
  );
}
