/* ============================================================
   MÓDULO: INVERSIÓN SERVICIOS
   Duplicado del módulo de empresa: mismo menú lateral, mismas
   pestañas y el mismo motor de cálculo, pero con estado, motor
   (lib/model-servicios) y pestañas (tabs-servicios) propios,
   de modo que los dos módulos evolucionan por separado.
   ============================================================ */
import React, { useState } from "react";
import { C } from "../lib/theme";
import TabEmpresa from "../tabs-servicios/TabEmpresa";
import TabExplosion from "../tabs-servicios/TabExplosion";
import TabInsumos from "../tabs-servicios/TabInsumos";
import TabMO from "../tabs-servicios/TabMO";
import TabCostosProduccion from "../tabs-servicios/TabCostosProduccion";
import TabResumenImpacto from "../tabs-servicios/TabResumenImpacto";
import TabProductos from "../tabs-servicios/TabProductos";
import TabGastos from "../tabs-servicios/TabGastos";
import TabInversion from "../tabs-servicios/TabInversion";
import TabPlan from "../tabs-servicios/TabPlan";
import TabCredito from "../tabs-servicios/TabCredito";
import TabPyL from "../tabs-servicios/TabPyL";
import TabWACC from "../tabs-servicios/TabWACC";
import TabRentabilidad from "../tabs-servicios/TabRentabilidad";
import TabSensibilidad from "../tabs-servicios/TabSensibilidad";
import TabIA from "../tabs-servicios/TabIA";

export default function ModuloServicios({ s, up, m, L, flash, topH }) {
  const [tab, setTab] = useState("empresa");

  const NAV = [
    { g: "Configuración", items: [["empresa", "Empresa y supuestos"]] },
    { g: "Costeo", items: [["explosion", L.explosionTab, true], ["insumos", L.insumos], ["mo", L.mo], ["prodcostos", L.cpTab], ["resumen", "Resumen de impacto"], ["productos", "Pricing"]] },
    { g: "Presupuesto", items: [["pyl", "Forecast"], ["plan", "Plan de ventas y precios"], ["gastos", "Gastos"], ["inversion", "Inversiones y activos"], ["credito", "Crédito"]] },
    { g: "Evaluación", items: [["wacc", "Costo de capital"], ["rentab", "Rentabilidad y valuación"], ["sens", "Escenarios"], ["ia", "Diagnóstico y datos"]] },
  ];

  return (
    <div className="flex" style={{ alignItems: "flex-start" }}>
      {/* Menú lateral del módulo */}
      <div className="shrink-0 px-3 py-4" style={{ width: 200, borderRight: `1px solid ${C.line}`, position: "sticky", top: topH, maxHeight: `calc(100vh - ${topH}px)`, overflowY: "auto", background: C.paper }}>
        {NAV.map((sec) => (
          <div key={sec.g} className="mb-3 rounded-lg overflow-hidden" style={{ background: C.white, border: `1px solid ${C.line}` }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1.5"
              style={{ color: C.muted, background: C.soft, borderBottom: `1px solid ${C.line}` }}>{sec.g}</div>
            <div className="p-1.5">
              {sec.items.map(([k, label, acc]) => (
                <button key={k} onClick={() => setTab(k)}
                  style={acc
                    ? { background: tab === k ? C.accent : C.accentSoft, color: tab === k ? C.white : "#3E6B27", border: `1px solid ${C.accent}`, fontWeight: 600 }
                    : { background: tab === k ? C.ink : "transparent", color: tab === k ? C.white : C.ink }}
                  className="w-full text-left text-[12.5px] px-2 py-1.5 rounded mb-0.5 hover:opacity-70 transition-opacity">
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="px-2 pt-2 text-[10px]" style={{ color: C.muted, borderTop: `1px solid ${C.line}` }}>
          <div className="mb-2 leading-relaxed">
            <span style={{ color: C.azul, fontWeight: 600 }}>Azul</span> = lo capturas tú<br />
            <span style={{ color: C.ink, fontWeight: 600 }}>Negro</span> = fórmula o dato de otra pestaña
          </div>
          www.profit120.com · info@profit120.com
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-5 min-w-0">
        {tab === "empresa" && <TabEmpresa s={s} up={up} m={m} />}
        {tab === "explosion" && <TabExplosion s={s} up={up} m={m} L={L} />}
        {tab === "insumos" && <TabInsumos s={s} up={up} m={m} L={L} />}
        {tab === "mo" && <TabMO s={s} up={up} m={m} L={L} />}
        {tab === "prodcostos" && <TabCostosProduccion s={s} up={up} m={m} L={L} />}
        {tab === "resumen" && <TabResumenImpacto s={s} m={m} L={L} />}
        {tab === "productos" && <TabProductos s={s} up={up} m={m} L={L} />}
        {tab === "gastos" && <TabGastos s={s} up={up} m={m} />}
        {tab === "inversion" && <TabInversion s={s} up={up} m={m} />}
        {tab === "plan" && <TabPlan s={s} up={up} m={m} L={L} />}
        {tab === "credito" && <TabCredito s={s} up={up} m={m} />}
        {tab === "pyl" && <TabPyL s={s} up={up} m={m} L={L} />}
        {tab === "wacc" && <TabWACC s={s} up={up} m={m} flash={flash} />}
        {tab === "rentab" && <TabRentabilidad s={s} up={up} m={m} />}
        {tab === "sens" && <TabSensibilidad s={s} m={m} />}
        {tab === "ia" && <TabIA s={s} m={m} />}
      </div>
    </div>
  );
}
