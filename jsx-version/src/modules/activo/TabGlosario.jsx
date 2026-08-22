import React from "react";
import { C } from "../../lib/theme";
import { Card } from "../../components/ui";

/* ============================================================
   ACTIVO · GLOSARIO Y REGLAS
   Se abre como panel desde la barra superior, no es una pestaña.
   ============================================================ */
const GLO = [
  ["Indicadores", [
    ["VPN", "Cuántos pesos de hoy le agrega la inversión a tu empresa. Es el único criterio que decide: acepta si es positivo, y entre alternativas gana el más alto."],
    ["TIR", "La tasa a la que el VPN sería cero. Intuitiva pero traicionera: da resultados múltiples si el flujo cambia de signo varias veces y engaña al comparar proyectos de distinta escala."],
    ["TIRM", "La TIR corregida: supone que reinviertes al costo de capital y no a la propia TIR."],
    ["VAE", "El VPN convertido en renta anual. La única forma correcta de comparar activos con vidas útiles distintas."],
    ["CAE", "El mismo cálculo cuando el activo sólo genera costos, como un vehículo. Gana el menor."],
    ["Payback descontado", "En cuántos años recuperas lo invertido contando el valor del dinero en el tiempo. Mide exposición, no rentabilidad."],
    ["Índice de rentabilidad", "Valor presente de los flujos entre la inversión. Sirve cuando el capital está racionado."],
  ]],
  ["Conceptos del flujo", [
    ["Flujo incremental", "La diferencia entre el flujo de la empresa con el activo y sin él. Es lo único que se modela."],
    ["Costo hundido", "Dinero ya gastado que no vuelve, decidas lo que decidas. Nunca entra."],
    ["Costo de oportunidad", "Lo que dejas de ganar por usar algo que ya tienes. La bodega propia no es gratis."],
    ["Capital de trabajo", "Inventario más cobranza menos proveedores. Sale al principio, crece con las ventas y se recupera al final."],
    ["Escudo fiscal", "La depreciación no es salida de efectivo, pero reduce el impuesto. Ese ahorro sí es flujo."],
    ["Rescate después de impuestos", "Precio de venta menos el impuesto sobre la diferencia contra el valor en libros."],
  ]],
  ["Costo de capital", [
    ["WACC", "El promedio ponderado de lo que cuestan tu deuda y tu capital propio."],
    ["Ke", "Tasa libre de riesgo más beta por la prima de mercado, más primas por tamaño e iliquidez."],
    ["Beta", "Cuánto se mueve el riesgo de un negocio frente al mercado. Si el activo es de otro sector, usa la beta de ese sector."],
  ]],
  ["Inmuebles", [
    ["NOI", "Renta efectiva menos gastos operativos. No resta hipoteca ni depreciación."],
    ["Cap rate", "NOI entre el valor del inmueble. Es como el mercado pone precio."],
    ["DSCR", "NOI entre el servicio anual de la deuda. Abajo de 1.25x no hay holgura."],
    ["Cash-on-cash", "Flujo del año entre el capital propio invertido."],
  ]],
];

const REGLAS = [
  "El flujo va sin intereses ni pago de capital: el financiamiento ya está en la tasa de descuento.",
  "Flujos nominales con tasa nominal, flujos reales con tasa real. Nunca se mezclan.",
  "Para el escudo fiscal importa la depreciación fiscal, no la contable.",
  "Si el valor terminal explica más del 70% del valor, el modelo es una perpetuidad disfrazada.",
  "Compara siempre el valor de equilibrio contra lo que la operación ha logrado de verdad.",
];

const Definicion = ({ t, d }) => (
  <div className="grid gap-3 py-2" style={{ gridTemplateColumns: "150px 1fr", borderBottom: `1px dotted ${C.line}` }}>
    <div className="text-[12.5px] font-semibold" style={{ color: C.ink }}>{t}</div>
    <div className="text-[12.5px] leading-relaxed" style={{ color: C.muted }}>{d}</div>
  </div>
);

export default function TabGlosario() {
  const izq = GLO.filter((_, i) => i % 2 === 0);
  const der = GLO.filter((_, i) => i % 2 === 1);
  return (
    <>
      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", alignItems: "start" }}>
        <div className="min-w-0">
          {izq.map(([titulo, defs]) => (
            <Card key={titulo} title={titulo}>
              {defs.map(([t, d]) => <Definicion key={t} t={t} d={d} />)}
            </Card>
          ))}
        </div>
        <div className="min-w-0">
          {der.map(([titulo, defs]) => (
            <Card key={titulo} title={titulo}>
              {defs.map(([t, d]) => <Definicion key={t} t={t} d={d} />)}
            </Card>
          ))}
          <Card title="Reglas que no se rompen">
            {REGLAS.map((t) => (
              <div key={t} className="grid gap-2 py-2" style={{ gridTemplateColumns: "18px 1fr", borderBottom: `1px dotted ${C.line}` }}>
                <div className="text-[12px] font-bold" style={{ color: C.accent }}>▸</div>
                <div className="text-[12.5px] leading-relaxed" style={{ color: C.muted }}>{t}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <Card>
        <div className="text-[11.5px] leading-relaxed" style={{ color: C.muted }}>
          Los valores cargados son un ejemplo ilustrativo, no una recomendación. Las tasas de depreciación fiscal de cada activo deben
          confirmarse con un contador. Esta herramienta es de análisis y no sustituye asesoría fiscal, legal ni de inversión.
        </div>
      </Card>
    </>
  );
}
