import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { C, LOGO } from "./lib/theme";
import { money, num, pct } from "./lib/format";
import { seed, LEX, computeModel } from "./lib/model";
import { exportarExcel } from "./lib/excel";
import { Btn } from "./components/ui";
import TabEmpresa from "./tabs/TabEmpresa";
import TabInsumos from "./tabs/TabInsumos";
import TabMO from "./tabs/TabMO";
import TabCostosProduccion from "./tabs/TabCostosProduccion";
import TabProductos from "./tabs/TabProductos";
import TabGastos from "./tabs/TabGastos";
import TabInversion from "./tabs/TabInversion";
import TabPlan from "./tabs/TabPlan";
import TabCredito from "./tabs/TabCredito";
import TabPyL from "./tabs/TabPyL";
import TabWACC from "./tabs/TabWACC";
import TabRentabilidad from "./tabs/TabRentabilidad";
import TabSensibilidad from "./tabs/TabSensibilidad";
import TabIA from "./tabs/TabIA";

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [s, setS] = useState(seed);
  const [tab, setTab] = useState("empresa");
  const [toast, setToast] = useState(null);

  const m = useMemo(() => computeModel(s), [s]);
  const L = LEX[s.empresa.tipo] || LEX.manufactura;

  const up = (fn) => setS((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });
  const flash = (t) => { setToast(t); setTimeout(() => setToast(null), 2600); };

  const descargarExcel = () => {
    try { exportarExcel(XLSX, s, m); flash("Libro de Excel generado."); }
    catch (e) { flash("No se pudo generar el archivo: " + e.message); }
  };
  const [confirmando, setConfirmando] = useState(false);
  const limpiar = () => {
    if (!confirmando) { setConfirmando(true); flash("Toca otra vez para borrar el ejemplo y empezar de cero."); setTimeout(() => setConfirmando(false), 5000); return; }
    setConfirmando(false);
    setS({
      ...seed(),
      empresa: { nombre: "", tipo: s.empresa.tipo, anio: new Date().getFullYear() + 1 },
      insumos: [], recursosMO: [], productos: [], prodCostos: { directos: [], indirectos: [] },
      gastos: { admin: [], oper: [], venta: [], porPieza: [] }, activos: [],
      plan: { unidadesMes: Array(12).fill(0), crec: [0.2, 0.15, 0.12, 0.1] },
      credito: { activo: false, monto: 0, tasaAnual: 0.15, plazoAnios: 3, tipo: "insoluto", mesInicio: 1 },
    });
    flash("Plataforma en blanco. Empieza por Empresa y supuestos.");
  };

  const NAV = [
    { g: "Configuración", items: [["empresa", "Empresa y supuestos"]] },
    { g: "Costeo", items: [["insumos", L.insumos], ["mo", L.mo], ["prodcostos", L.cpTab], ["productos", L.prod + " y costeo"]] },
    { g: "Presupuesto", items: [["gastos", "Gastos"], ["inversion", "Inversiones y activos"], ["plan", "Plan de ventas y precios"], ["credito", "Crédito"], ["pyl", "Estado de resultados"]] },
    { g: "Evaluación", items: [["wacc", "Costo de capital"], ["rentab", "Rentabilidad y valuación"], ["sens", "Escenarios"], ["ia", "Diagnóstico y datos"]] },
  ];

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.ink }} className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="Profit120" style={{ height: 32, width: "auto" }} />
          <div style={{ background: "#3C4045", width: 1, height: 30 }} />
          <div>
            <div className="text-[15px] font-semibold tracking-tight" style={{ color: C.white }}>PLATAFORMA DE EVALUACIÓN DE LA INVERSIÓN</div>
            <div className="text-[11px]" style={{ color: "#9BA0A5" }}>{s.empresa.nombre || "Proyecto sin nombre"} · Ejercicio {s.empresa.anio} · Horizonte {s.supuestos.horizonte} años</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Btn small onClick={descargarExcel}>Exportar a Excel</Btn>
          <Btn small kind={confirmando ? "dark" : "primary"} onClick={limpiar}>{confirmando ? "Confirmar borrado" : "Empezar en blanco"}</Btn>
        </div>
      </div>

      {/* Barra de KPIs */}
      <div className="px-5 py-3 flex gap-6 flex-wrap" style={{ background: C.white, borderBottom: `1px solid ${C.line}` }}>
        {[
          ["Inversión requerida", money(m.inversion)],
          ["VPN", money(m.vpn), m.vpn >= 0 ? "pos" : "neg"],
          ["TIR", pct(m.tir), m.tir >= m.waccNom ? "pos" : "neg"],
          ["WACC", pct(m.waccNom)],
          ["Payback desc.", m.dpbp ? num(m.dpbp, 1) + " años" : "No recupera"],
          ["Ventas Año 1", money(m.anios[0]?.ventas)],
        ].map(([k, v, tone]) => (
          <div key={k}>
            <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>{k}</div>
            <div className="text-[15px] font-semibold" style={{ color: tone === "pos" ? C.pos : tone === "neg" ? C.neg : C.ink, fontVariantNumeric: "tabular-nums" }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="flex" style={{ alignItems: "flex-start" }}>
        {/* Sidebar */}
        <div className="shrink-0 px-3 py-4" style={{ width: 200, borderRight: `1px solid ${C.line}`, position: "sticky", top: 0 }}>
          {NAV.map((sec) => (
            <div key={sec.g} className="mb-3 rounded-lg overflow-hidden" style={{ background: C.white, border: `1px solid ${C.line}` }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1.5"
                style={{ color: C.muted, background: C.soft, borderBottom: `1px solid ${C.line}` }}>{sec.g}</div>
              <div className="p-1.5">
                {sec.items.map(([k, label]) => (
                  <button key={k} onClick={() => setTab(k)}
                    style={{ background: tab === k ? C.ink : "transparent", color: tab === k ? C.white : C.ink }}
                    className="w-full text-left text-[12.5px] px-2 py-1.5 rounded mb-0.5 hover:opacity-70 transition-opacity">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="px-2 pt-2 text-[10px]" style={{ color: C.muted, borderTop: `1px solid ${C.line}` }}>
            www.profit120.com · info@profit120.com
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 p-5 min-w-0">
          {tab === "empresa" && <TabEmpresa s={s} up={up} m={m} />}
          {tab === "insumos" && <TabInsumos s={s} up={up} m={m} L={L} />}
          {tab === "mo" && <TabMO s={s} up={up} m={m} L={L} />}
          {tab === "prodcostos" && <TabCostosProduccion s={s} up={up} m={m} L={L} />}
          {tab === "productos" && <TabProductos s={s} up={up} m={m} L={L} />}
          {tab === "gastos" && <TabGastos s={s} up={up} m={m} />}
          {tab === "inversion" && <TabInversion s={s} up={up} m={m} />}
          {tab === "plan" && <TabPlan s={s} up={up} m={m} L={L} />}
          {tab === "credito" && <TabCredito s={s} up={up} m={m} />}
          {tab === "pyl" && <TabPyL s={s} m={m} />}
          {tab === "wacc" && <TabWACC s={s} up={up} m={m} flash={flash} />}
          {tab === "rentab" && <TabRentabilidad s={s} up={up} m={m} />}
          {tab === "sens" && <TabSensibilidad s={s} m={m} />}
          {tab === "ia" && <TabIA s={s} m={m} />}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 px-4 py-2 rounded text-[12px]" style={{ transform: "translateX(-50%)", background: C.ink, color: C.white }}>{toast}</div>
      )}
    </div>
  );
}
