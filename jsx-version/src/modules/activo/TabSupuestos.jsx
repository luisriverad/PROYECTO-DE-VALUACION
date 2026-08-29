import React, { useState } from "react";
import { Card, Btn, Field, TxtArea, LlaveIA } from "../../components/ui";
import { C } from "../../lib/theme";
import { num } from "../../lib/format";
import { iaFetch, buscaEnWeb, nombreProveedor } from "../../lib/ia";
import { PRIMAS, primaDe } from "../../lib/activos";
import { Head, Cols, Campo, Derivado, Stats, Nota, GridTable, fP, fP2, TasaBox } from "./piezas";

/* ============================================================
   ACTIVO · 1. SUPUESTOS GENERALES

   Aquí no se calcula un CAPM. Una PyME no cotiza, así que su beta
   no existe y estimarla proyecto por proyecto es inviable. En su
   lugar se fija UNA tasa base al año y cada proyecto sólo elige
   una prima adicional. Y para el activo que es inversión y no
   herramienta, la tasa la pone el mercado, no el costo de capital.
   ============================================================ */

/* ---------- selector segmentado ---------- */
const Seg = ({ value, onChange, opts }) => (
  <div className="flex rounded overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
    {opts.map((o) => {
      const on = o.k === value;
      return (
        <button key={o.k} onClick={() => onChange(o.k)} title={o.title}
          className="flex-1 text-[11px] px-2 py-1.5 font-medium transition-opacity hover:opacity-80"
          style={{
            background: on ? C.ink : C.white, color: on ? C.white : C.muted,
            borderLeft: o.k === opts[0].k ? "none" : `1px solid ${C.line}`,
          }}>{o.label}</button>
      );
    })}
  </div>
);

/* ---------- prima adicional: la pone el botón, pero se puede mover a mano ---------- */
function PrimaAdicional({ A, up, k }) {
  const actual = primaDe(A.sup[k]);
  return (
    <div className="flex flex-wrap gap-1 mt-1.5 mb-1">
      {PRIMAS.map((b) => {
        const on = b.k === actual;
        return (
          <button key={b.k} onClick={() => up((n) => { n.sup[k] = b.p; })}
            title={`${b.label} · ${b.ej} · ${b.p >= 0 ? "+" : ""}${(b.p * 100).toFixed(0)} pts`}
            className="text-[10px] px-2 py-1 rounded transition-opacity hover:opacity-80"
            style={{
              background: on ? C.accent : C.soft, color: on ? C.white : C.muted,
              border: `1px solid ${on ? C.accent : C.line}`,
            }}>{b.riesgo}</button>
        );
      })}
    </div>
  );
}

export default function TabSupuestos({ A, up, R, flash }) {
  const [cargando, setCargando] = useState(false);
  const [res, setRes] = useState(null);

  /* Lo que la IA puede llenar de esta pestaña */
  const CAMPOS = [
    { k: "kd", etiqueta: "Costo de la deuda (Kd)", esPct: true },
    { k: "primaEq", etiqueta: "Prima del capital propio", esPct: true },
    { k: "wd", etiqueta: "% Deuda objetivo", esPct: true },
    { k: "inf", etiqueta: "Inflación anual", esPct: true },
    { k: "capMkt", etiqueta: "Cap rate de comparables", esPct: true },
    { k: "gMkt", etiqueta: "Crecimiento de rentas", esPct: true },
    { k: "rendTer", etiqueta: "Rendimiento de terrenos", esPct: true },
    { k: "pMaq", etiqueta: "Prima adicional · maquinaria", esPct: true },
    { k: "pInm", etiqueta: "Prima adicional · inmueble", esPct: true },
    { k: "pTer", etiqueta: "Prima adicional · terreno", esPct: true },
    { k: "pAuto", etiqueta: "Prima adicional · vehículo", esPct: true },
  ];

  const analizar = async () => {
    const perfil = (A.sup.perfil || "").trim();
    if (!perfil) { flash("Describe la empresa y la inversión antes de buscar."); return; }
    setCargando(true); setRes(null);
    try {
      const { texto: txt } = await iaFetch({
        maxTokens: 8000,
        buscar: true,
        prompt: `Eres analista financiero. Vas a proponer la TASA DE DESCUENTO con la que se va a evaluar la compra de un activo.

DESCRIPCIÓN DE LA EMPRESA Y DE LA INVERSIÓN:
"""
${perfil}
"""

No calcules un CAPM: es una empresa que no cotiza, su beta no es observable y estimarla sería falsa precisión. Usa el atajo sobre el costo de la deuda de la propia empresa, que ya incorpora su tamaño, su sector y su riesgo de crédito. Si la descripción no dice el país, supón México.

Busca en internet lo que necesites: la tasa a la que la banca comercial le presta hoy a una empresa así en ese país, la inflación anual vigente, y los cap rates y rendimientos inmobiliarios de la ciudad o zona que menciona.

Devuelve estos campos, todos en decimales (0.045 = 4.5%):

TASA BASE DE LA EMPRESA
1. kd: costo de la deuda antes de impuestos. Si la descripción ya dice a qué tasa le presta su banco, usa ese número tal cual y dilo en la nota.
2. primaEq: cuánto más caro es el capital propio que la deuda de esa misma empresa. Típico 0.04 a 0.07; más alto si el negocio es cíclico o depende de pocos clientes.
3. wd: proporción de deuda objetivo D/(D+E), entre 0 y 1, razonable para su sector y tamaño.
4. inf: inflación anual vigente del país.

TASA DE MERCADO, para cuando el inmueble o el terreno son inversión y no herramienta
5. capMkt: cap rate de comparables en renta en esa zona. En México suele ir de 0.07 a 0.11.
6. gMkt: crecimiento anual de largo plazo de las rentas en esa zona; normalmente cerca de la inflación.
7. rendTer: rendimiento anual histórico de terrenos comparables en esa zona.

PRIMA ADICIONAL DE CADA PROYECTO
Elige para cada activo una prima de esta escala, según lo que la descripción diga que van a hacer con él:
  -0.020 = reemplazo de algo que ya opera, flujo conocido
   0.000 = ampliar capacidad de lo que ya hacen
   0.010 = uso productivo nuevo pero definido
   0.040 = sin flujo, apostando a la plusvalía
   0.080 = negocio nuevo o tecnología sin probar
8. pMaq, pInm, pTer, pAuto: la prima que le toca a maquinaria, inmueble, terreno y vehículo.

9. notas: objeto con una línea corta de justificación para cada campo: {"kd","primaEq","wd","inf","capMkt","gMkt","rendTer","pMaq","pInm","pTer","pAuto"}.
10. fecha: fecha o vigencia de los datos que usaste.
11. nota: una línea diciendo qué país, qué ciudad y qué giro tomaste.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin backticks y sin texto adicional, con esta forma exacta:
{"kd":0.145,"primaEq":0.05,"wd":0.30,"inf":0.045,"capMkt":0.085,"gMkt":0.045,"rendTer":0.13,"pMaq":0.0,"pInm":0.0,"pTer":0.04,"pAuto":0.0,"notas":{"kd":"...","primaEq":"...","wd":"...","inf":"...","capMkt":"...","gMkt":"...","rendTer":"...","pMaq":"...","pInm":"...","pTer":"...","pAuto":"..."},"fecha":"...","nota":"..."}`,
      });
      const j = txt.replace(/```json|```/g, "").trim();
      const start = j.indexOf("{"), end = j.lastIndexOf("}");
      setRes(JSON.parse(j.slice(start, end + 1)));
    } catch (e) {
      flash("No se pudo obtener la información: " + e.message);
    } finally { setCargando(false); }
  };

  const aplicar = () => {
    up((n) => {
      CAMPOS.forEach(({ k }) => { if (isFinite(res[k])) n.sup[k] = res[k]; });
      n.sup.metodo = "kd";
    });
    flash("Supuestos aplicados: los cuatro activos se recalcularon.");
  };

  /* Vista previa de la tasa base que dejaría lo que trajo la IA */
  const basePrev = res && isFinite(res.kd) && isFinite(res.primaEq) && isFinite(res.wd)
    ? (res.kd + res.primaEq) * (1 - res.wd) + res.kd * (1 - A.sup.isr) * res.wd : null;

  const met = A.sup.metodo;

  return (
    <>
      <Head titulo="Tasa de descuento"
        texto="Una PyME no cotiza, así que su beta no existe y calcular un CAPM por proyecto es inviable. Aquí se fija una sola tasa base al año y cada proyecto elige una prima adicional. El activo que es inversión y no herramienta se descuenta contra el mercado, no contra tu costo de capital." />

      <Card title="Llena los supuestos con IA"
        sub="Describe la empresa y la inversión que estás evaluando; la IA busca los datos de mercado y propone la tasa."
        right={<div className="flex gap-2 items-center">
          <LlaveIA />
          <Btn kind="primary" small onClick={analizar} disabled={cargando}>{cargando ? "Analizando…" : "Proponer tasa con IA"}</Btn>
        </div>}>
        <Field label="Describe la empresa y la inversión"
          hint="Entre más concreto, mejor: giro, país y ciudad, años operando, ventas anuales, empleados, a qué tasa le presta hoy su banco y qué vas a hacer exactamente con el activo (reemplazar, ampliar, rentar, esperar plusvalía).">
          <TxtArea rows={4} value={A.sup.perfil} onChange={(v) => up((n) => { n.sup.perfil = v; })}
            placeholder="Ej.: Fábrica de calzado en León, Guanajuato. 12 años operando, ventas de 45 millones al año, 60 empleados, con un crédito bancario al 15%. Evalúa reemplazar una inyectora y comprar una nave para rentarla a terceros." />
        </Field>
        <div className="text-[11px] mt-2" style={{ color: C.muted }}>
          Cada quien usa su propia llave: se guarda sólo en tu navegador. Sirve la de cualquier proveedor,
          aunque <b style={{ color: C.ink }}>el modelo funciona mejor con API key de Anthropic</b>, que es el
          único que consulta los datos de mercado en internet al momento.
        </div>
        {!buscaEnWeb() && (
          <div className="text-[11px] mt-2 rounded px-2.5 py-2" style={{ color: C.ink, background: "#FAF2DF", border: "1px solid #C08A19" }}>
            Con {nombreProveedor()} el modelo contesta de memoria, sin buscar en internet. Las tasas van a ser
            razonables pero no vigentes: verifícalas antes de defenderlas.
          </div>
        )}

        {res && (
          <div className="mt-4 rounded p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
            <div className="text-[12px] font-semibold mb-2">
              Lo que encontró la IA{basePrev != null ? ` · tasa base ${fP2(basePrev)}` : ""}
            </div>
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
              Es un punto de partida, no un dictamen. Muévelo si conoces mejor tu mercado.
            </div>
          </div>
        )}
      </Card>

      <Cols
        izq={<>
          <Card title="Tasa base de la empresa"
            sub="Se fija una vez al año, no por proyecto.">
            <div className="mb-3">
              <Seg value={met} onChange={(k) => up((n) => { n.sup.metodo = k; })}
                opts={[
                  { k: "kd", label: "Sobre tu deuda", title: "El capital propio cuesta unos puntos más que lo que te cobra tu banco" },
                  { k: "buildup", label: "Build-up", title: "Suma de primas, sin beta: el método estándar para empresas que no cotizan" },
                  { k: "directo", label: "Manual", title: "Captura la tasa y ya" },
                ]} />
            </div>

            {met === "kd" && <>
              <Campo A={A} up={up} g="sup" k="kd" label="Costo de la deuda (Kd)" hint="A qué tasa te presta tu banco hoy. Este dato ya lo sabes." tipo="pct" />
              <Campo A={A} up={up} g="sup" k="primaEq" label="Prima del capital propio" hint="Tu dinero cuesta más que el del banco: típico 4 a 7 puntos" tipo="pct" />
              <Derivado label="Costo del capital propio (Ke)" valor={fP2(R.sup.ke)} />
            </>}

            {met === "buildup" && <>
              <Campo A={A} up={up} g="sup" k="rf" label="Tasa libre de riesgo (Rf)" hint="Bono M 10 años, en pesos" tipo="pct" />
              <Campo A={A} up={up} g="sup" k="prm" label="Prima de riesgo de mercado" tipo="pct" />
              <Campo A={A} up={up} g="sup" k="ptam" label="Prima por tamaño e iliquidez" hint="Típico 1% a 4% en PyME" tipo="pct" />
              <Campo A={A} up={up} g="sup" k="pneg" label="Prima por riesgo del negocio" hint="Concentración de clientes, ciclicidad, dependencia del dueño" tipo="pct" />
              <Derivado label="Costo del capital propio (Ke)" valor={fP2(R.sup.ke)} />
              <Campo A={A} up={up} g="sup" k="kd" label="Costo de la deuda (Kd)" hint="Tasa efectiva de tus créditos" tipo="pct" />
            </>}

            {met === "directo" && <>
              <Campo A={A} up={up} g="sup" k="baseDirecta" label="Tasa base" hint="El mínimo que le exiges a una inversión de riesgo promedio" tipo="pct" />
              <Campo A={A} up={up} g="sup" k="kd" label="Costo de la deuda (Kd)" hint="Se sigue usando para la TIRM y el flujo apalancado" tipo="pct" />
            </>}

            {met !== "directo" && <>
              <Derivado label="Kd después de impuestos" valor={fP2(R.sup.kdt)} />
              <Campo A={A} up={up} g="sup" k="wd" label="% Deuda   D/(D+E)"
                hint="Estructura objetivo de la empresa, no la de hoy. Mueve tu tasa base; cuánto dinero sacas de tu bolsa para cada activo se decide en su pestaña." tipo="pct" />
              <Derivado label="% Capital propio" valor={fP(R.sup.we)} />
            </>}

            <TasaBox label="Tasa base de la empresa" valor={fP2(R.sup.base)}
              nota="El mínimo que debe rendir una inversión de riesgo promedio" />
          </Card>

          <Card title="Fiscal y macro">
            <Campo A={A} up={up} g="sup" k="isr" label="Tasa de ISR corporativo" hint="Usa tu tasa efectiva si difiere de la nominal" tipo="pct" />
            <Campo A={A} up={up} g="sup" k="inf" label="Inflación general anual" hint="Se aplica a costos y gastos fijos" tipo="pct" />
          </Card>
        </>}
        der={<>
          <Card title="La tasa depende del uso, no del activo"
            sub="El mismo inmueble se descuenta distinto si lo vas a ocupar que si lo vas a rentar." pad={false}>
            <GridTable
              head={["Activo", "Uso", "De dónde sale la tasa"]}
              rows={[
                { cells: ["Maquinaria", "Operación actual", "Tasa base + prima adicional"] },
                { cells: ["Vehículo", "Operación actual", "Tasa base + prima adicional"] },
                { cells: ["Inmueble", "Uso operativo", "Tasa base + prima adicional"] },
                { cells: ["Terreno", "Uso operativo", "Tasa base + prima adicional"] },
                { hi: true, cells: ["Inmueble", "Inversión / renta", "Cap rate de comparables + crecimiento"] },
                { hi: true, cells: ["Terreno", "Inversión / plusvalía", "Rendimiento anual de comparables"] },
              ]}
            />
            <Nota>
              Cuando el activo es una herramienta de tu operación, compite contra tus otros usos del dinero: la vara
              es tu tasa base. Cuando es una inversión, compite contra lo que paga ese mercado a cualquiera que
              ponga el mismo dinero, y ahí tu costo de capital es irrelevante.
            </Nota>
          </Card>

          <Card title="Tasa de cada activo"
            sub="Elige la prima adicional por lo que vas a hacer con él, no por cómo se llama.">
            <div className="text-[11px] uppercase tracking-wider font-semibold mt-1 mb-1" style={{ color: C.accent }}>Maquinaria</div>
            <PrimaAdicional A={A} up={up} k="pMaq" />
            <Campo A={A} up={up} g="sup" k="pMaq" label="Prima adicional" tipo="pct" />
            <TasaBox chico label="Tasa de descuento · Maquinaria" valor={fP2(R.sup.tasas.maq)} />

            <div className="text-[11px] uppercase tracking-wider font-semibold mt-4 mb-1" style={{ color: C.accent }}>Vehículo</div>
            <PrimaAdicional A={A} up={up} k="pAuto" />
            <Campo A={A} up={up} g="sup" k="pAuto" label="Prima adicional" tipo="pct" />
            <TasaBox chico label="Tasa de descuento · Vehículo" valor={fP2(R.sup.tasas.auto)} />

            <div className="text-[11px] uppercase tracking-wider font-semibold mt-4 mb-1" style={{ color: C.accent }}>Inmueble</div>
            <div className="mb-1">
              <Seg value={A.sup.usoInm} onChange={(k) => up((n) => { n.sup.usoInm = k; })}
                opts={[
                  { k: "op", label: "Lo voy a ocupar", title: "Herramienta de tu operación: se descuenta a tu tasa base" },
                  { k: "inv", label: "Lo voy a rentar", title: "Inversión: la tasa la pone el mercado inmobiliario" },
                ]} />
            </div>
            {A.sup.usoInm === "inv" ? <>
              <Campo A={A} up={up} g="sup" k="capMkt" label="Cap rate de comparables" hint="NOI entre precio, de propiedades parecidas en la zona" tipo="pct" />
              <Campo A={A} up={up} g="sup" k="gMkt" label="Crecimiento de rentas" hint="De largo plazo; normalmente cerca de la inflación" tipo="pct" />
              <Derivado label="Tasa de mercado" hint="Cap rate + crecimiento" valor={fP2(R.sup.tInmMkt)} />
            </> : <Derivado label="Parte de la tasa base" valor={fP2(R.sup.base)} />}
            <PrimaAdicional A={A} up={up} k="pInm" />
            <Campo A={A} up={up} g="sup" k="pInm" label="Prima adicional" tipo="pct" />
            <TasaBox chico label="Tasa de descuento · Inmueble" valor={fP2(R.sup.tasas.inm)} />

            <div className="text-[11px] uppercase tracking-wider font-semibold mt-4 mb-1" style={{ color: C.accent }}>Terreno</div>
            <div className="mb-1">
              <Seg value={A.sup.usoTer} onChange={(k) => up((n) => { n.sup.usoTer = k; })}
                opts={[
                  { k: "op", label: "Uso productivo", title: "Va a servir a tu operación: se descuenta a tu tasa base" },
                  { k: "inv", label: "Esperando plusvalía", title: "Inversión: la tasa la pone el mercado de terrenos" },
                ]} />
            </div>
            {A.sup.usoTer === "inv"
              ? <Campo A={A} up={up} g="sup" k="rendTer" label="Rendimiento de comparables" hint="Lo que ha dado al año un terreno parecido en esa zona" tipo="pct" />
              : <Derivado label="Parte de la tasa base" valor={fP2(R.sup.base)} />}
            <PrimaAdicional A={A} up={up} k="pTer" />
            <Campo A={A} up={up} g="sup" k="pTer" label="Prima adicional" tipo="pct" />
            <TasaBox chico label="Tasa de descuento · Terreno" valor={fP2(R.sup.tasas.ter)} />
          </Card>

          <Card title="Cómo se elige la prima adicional" pad={false}>
            <GridTable
              head={["Qué vas a hacer", "Riesgo", "Prima", "Con base " + fP(R.sup.base)]}
              rows={PRIMAS.map((b) => ({
                cells: [b.label, b.riesgo,
                  (b.p >= 0 ? "+" : "") + (b.p * 100).toFixed(0) + " pts",
                  fP(R.sup.base + b.p)],
              }))}
            />
            <Nota>
              A mayor incertidumbre sobre los flujos futuros, mayor tasa de descuento. Los porcentajes enseñan el
              criterio: muévelos si tu experiencia dice otra cosa. Y no pelees por décimas — ninguna decisión de
              compra se voltea entre 15.8% y 16.1%, se voltea entre 14% y 22%. Para eso está la pestaña de
              sensibilidad: si el veredicto cambia dentro de ese rango, el problema no es la tasa, es que el
              proyecto está en el filo.
            </Nota>
          </Card>
        </>}
      />
    </>
  );
}
