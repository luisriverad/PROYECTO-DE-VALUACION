import React, { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { C, LOGO } from "./lib/theme";
import { money, num, pct } from "./lib/format";
import { seed, LEX, computeModel } from "./lib/model";
import { exportarExcel } from "./lib/excel";
import { Btn } from "./components/ui";
import TabEmpresa from "./tabs/TabEmpresa";
import TabExplosion from "./tabs/TabExplosion";
import TabInsumos from "./tabs/TabInsumos";
import TabMO from "./tabs/TabMO";
import TabCostosProduccion from "./tabs/TabCostosProduccion";
import TabResumenImpacto from "./tabs/TabResumenImpacto";
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
import ModuloActivo from "./modules/ModuloActivo";
import { cargarActivos, guardarActivos, seedActivos, computeActivos } from "./lib/activos";
import TabGlosario from "./modules/activo/TabGlosario";
import ModuloServicios from "./modules/ModuloServicios";
import { seed as seedSv, LEX as LEXSv, computeModel as computeModelSv } from "./lib/model-servicios";
import { exportarExcel as exportarExcelSv } from "./lib/excel-servicios";

/* ============================================================
   MÓDULOS (macro pestañas)
   La plataforma se divide en módulos independientes entre sí.
   Cada uno tiene su propio menú, sus propios datos y su propia
   evaluación; comparten únicamente la identidad y la barra superior.
   ============================================================ */
const MODULOS = [
  { k: "empresa", label: "Inversión empresa", sub: "Evaluación de un negocio completo" },
  { k: "servicios", label: "Inversión servicios", sub: "Evaluación de un negocio de servicios" },
  { k: "activo", label: "Inversión activo", sub: "Evaluación de la compra de un activo" },
];

/* ============================================================
   APP
   ============================================================ */
/* ------------------------------------------------------------
   BARRA SUPERIOR DE KPIs
   ------------------------------------------------------------ */

/* Un dato suelto de la barra */
function KpiBarra({ k, v, tone }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>{k}</div>
      <div className="text-[15px] font-semibold" style={{ color: tone === "pos" ? C.pos : tone === "neg" ? C.neg : C.ink, fontVariantNumeric: "tabular-nums" }}>{v}</div>
    </div>
  );
}

/* Valor de la empresa e inversión requerida son las dos cifras con las que
   se toma la decisión: van juntas en su propia caja, no revueltas con el
   resto de los indicadores de la barra. */
function CajaResultado({ ev, inversion }) {
  return (
    <div className="flex items-stretch rounded-lg overflow-hidden shrink-0"
      style={{
        border: `1px solid ${C.line}`,
        background: "linear-gradient(180deg, #FAFCF6 0%, #FFFFFF 70%)",
        boxShadow: "0 1px 2px rgba(31,34,37,.06)",
      }}>
      <div className="pl-4 pr-5 py-2">
        <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>Valor de la empresa</div>
        <div className="text-[17px] font-semibold leading-tight" style={{ color: ev >= 0 ? C.pos : C.neg, fontVariantNumeric: "tabular-nums" }}>{money(ev)}</div>
      </div>
      <div className="self-center" style={{ width: 1, height: 30, background: C.line }} />
      <div className="pl-5 pr-4 py-2">
        <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>Inversión requerida</div>
        <div className="text-[17px] font-semibold leading-tight" style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>{money(inversion)}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [modulo, setModulo] = useState("empresa");
  const [s, setS] = useState(seed);
  const [sv, setSv] = useState(seedSv);   // estado del módulo INVERSIÓN SERVICIOS
  const [a, setA] = useState(cargarActivos);   // estado del módulo INVERSIÓN ACTIVO
  const [tab, setTab] = useState("empresa");
  const [toast, setToast] = useState(null);

  const [glosario, setGlosario] = useState(false);   // panel de glosario del módulo de activos

  useEffect(() => { guardarActivos(a); }, [a]);

  /* el glosario se cierra con Escape */
  useEffect(() => {
    if (!glosario) return;
    const alTeclear = (e) => { if (e.key === "Escape") setGlosario(false); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [glosario]);

  /* la barra superior queda fija; medimos su alto para colgar de ahí el menú lateral */
  const topRef = useRef(null);
  const [topH, setTopH] = useState(0);
  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const medir = () => setTopH(el.offsetHeight);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = useMemo(() => computeModel(s), [s]);
  const mSv = useMemo(() => computeModelSv(sv), [sv]);
  const RA = useMemo(() => computeActivos(a), [a]);
  const L = LEX[s.empresa.tipo] || LEX.manufactura;
  const LSv = LEXSv[sv.empresa.tipo] || LEXSv.manufactura;
  const esEmpresa = modulo === "empresa";
  const esServicios = modulo === "servicios";

  const up = (fn) => setS((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });
  const upSv = (fn) => setSv((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });
  const upA = (fn) => setA((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });
  const flash = (t) => { setToast(t); setTimeout(() => setToast(null), 2600); };

  const descargarExcel = () => {
    try { exportarExcel(XLSX, s, m); flash("Libro de Excel generado."); }
    catch (e) { flash("No se pudo generar el archivo: " + e.message); }
  };
  const descargarExcelSv = () => {
    try { exportarExcelSv(XLSX, sv, mSv); flash("Libro de Excel generado."); }
    catch (e) { flash("No se pudo generar el archivo: " + e.message); }
  };
  const [confirmando, setConfirmando] = useState(false);
  const [confirmandoSv, setConfirmandoSv] = useState(false);
  const limpiar = () => {
    if (!confirmando) { setConfirmando(true); flash("Toca otra vez para borrar el ejemplo y empezar de cero."); setTimeout(() => setConfirmando(false), 5000); return; }
    setConfirmando(false);
    setS({
      ...seed(),
      empresa: { nombre: "", tipo: s.empresa.tipo, anio: new Date().getFullYear() + 1 },
      insumos: [], recursosMO: [], productos: [], prodCostos: { directos: [], indirectos: [] },
      gastos: { admin: [], oper: [], venta: [], porPieza: [] }, activos: [],
      plan: { unidadesMes: Array(12).fill(0), crec: [0.2, 0.15, 0.12, 0.1] },
      credito: { activo: false, monto: 0, tasaAnual: 0.15, plazoAnios: 3, tipo: "insoluto", mesInicio: 1, prepagos: [] },
    });
    flash("Plataforma en blanco. Empieza por Empresa y supuestos.");
  };
  const limpiarSv = () => {
    if (!confirmandoSv) { setConfirmandoSv(true); flash("Toca otra vez para borrar el ejemplo y empezar de cero."); setTimeout(() => setConfirmandoSv(false), 5000); return; }
    setConfirmandoSv(false);
    setSv({
      ...seedSv(),
      empresa: { nombre: "", tipo: sv.empresa.tipo, anio: new Date().getFullYear() + 1 },
      insumos: [], recursosMO: [], productos: [], prodCostos: { directos: [], indirectos: [] },
      gastos: { admin: [], oper: [], venta: [], porPieza: [] }, activos: [],
      plan: { unidadesMes: Array(12).fill(0), crec: [0.2, 0.15, 0.12, 0.1] },
      credito: { activo: false, monto: 0, tasaAnual: 0.15, plazoAnios: 3, tipo: "insoluto", mesInicio: 1, prepagos: [] },
    });
    flash("Plataforma en blanco. Empieza por Empresa y supuestos.");
  };

  const NAV = [
    { g: "Configuración", items: [["empresa", "Empresa y supuestos"]] },
    { g: "Costeo", items: [["explosion", "Explosionado de materiales", true], ["insumos", L.insumos], ["mo", L.mo], ["prodcostos", L.cpTab], ["resumen", "Resumen de impacto"], ["productos", "Pricing"]] },
    { g: "Presupuesto", items: [["pyl", "Forecast"], ["plan", "Plan de ventas y precios"], ["gastos", "Gastos"], ["inversion", "Inversiones y activos"], ["credito", "Crédito"]] },
    { g: "Evaluación", items: [["wacc", "Costo de capital"], ["rentab", "Rentabilidad y valuación"], ["sens", "Escenarios"], ["ia", "Diagnóstico y datos"]] },
  ];

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      {/* Header + módulos + KPIs: fijos al hacer scroll */}
      <div ref={topRef} style={{ position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ background: C.ink }} className="px-5 pt-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="Profit120" style={{ height: 32, width: "auto" }} />
          <div style={{ background: "#3C4045", width: 1, height: 30 }} />
          <div>
            <div className="text-[15px] font-semibold tracking-tight" style={{ color: C.white }}>PLATAFORMA DE EVALUACIÓN DE LA INVERSIÓN</div>
            <div className="text-[11px]" style={{ color: "#9BA0A5" }}>
              {esEmpresa
                ? `${s.empresa.nombre || "Proyecto sin nombre"} · Ejercicio ${s.empresa.anio} · Horizonte ${s.supuestos.horizonte} años`
                : esServicios
                ? `${sv.empresa.nombre || "Proyecto sin nombre"} · Ejercicio ${sv.empresa.anio} · Horizonte ${sv.supuestos.horizonte} años`
                : `Presupuesto de capital · WACC ${pct(RA.sup.wacc, 2)} · ISR ${pct(RA.sup.isr, 0)}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {esEmpresa ? (
            <>
              <Btn small onClick={descargarExcel}>Exportar a Excel</Btn>
              <Btn small kind={confirmando ? "dark" : "primary"} onClick={limpiar}>{confirmando ? "Confirmar borrado" : "Empezar en blanco"}</Btn>
            </>
          ) : esServicios ? (
            <>
              <Btn small onClick={descargarExcelSv}>Exportar a Excel</Btn>
              <Btn small kind={confirmandoSv ? "dark" : "primary"} onClick={limpiarSv}>{confirmandoSv ? "Confirmar borrado" : "Empezar en blanco"}</Btn>
            </>
          ) : (
            <>
              <Btn small onClick={() => setGlosario(true)}>Glosario y reglas</Btn>
              <Btn small kind="primary" onClick={() => { setA(seedActivos()); flash("Se restablecieron los supuestos de ejemplo."); }}>Restablecer el ejemplo</Btn>
            </>
          )}
        </div>
      </div>

      {/* Macro pestañas: módulos de la plataforma */}
      <div className="px-5 pt-3 flex items-end gap-1" style={{ background: C.ink }}>
        {MODULOS.map((mod) => {
          const on = modulo === mod.k;
          return (
            <button key={mod.k} onClick={() => setModulo(mod.k)} title={mod.sub}
              style={{
                background: on ? C.paper : "transparent",
                color: on ? C.ink : "#9BA0A5",
                borderTop: `2px solid ${on ? C.accent : "transparent"}`,
                borderTopLeftRadius: 6, borderTopRightRadius: 6,
              }}
              className="text-[12px] font-semibold uppercase tracking-wide px-4 py-2 transition-opacity hover:opacity-80">
              {mod.label}
            </button>
          );
        })}
      </div>

      {/* Barra de KPIs (sólo aplica al módulo de empresa) */}
      {esEmpresa ? (
        <div className="px-5 py-3 flex items-center gap-6 flex-wrap" style={{ background: C.white, borderBottom: `1px solid ${C.line}` }}>
          <CajaResultado ev={m.ev} inversion={m.inversion} />
          {[
            ["VPN", money(m.vpn), m.vpn >= 0 ? "pos" : "neg"],
            ["TIR", pct(m.tir), m.tir >= m.waccNom ? "pos" : "neg"],
            ["WACC", pct(m.waccNom)],
            ["Payback desc.", m.dpbp ? num(m.dpbp, 1) + " años" : "No recupera"],
            ["Ventas Año 1", money(m.anios[0]?.ventas)],
          ].map(([k, v, tone]) => <KpiBarra key={k} k={k} v={v} tone={tone} />)}
        </div>
      ) : esServicios ? (
        <div className="px-5 py-3 flex items-center gap-6 flex-wrap" style={{ background: C.white, borderBottom: `1px solid ${C.line}` }}>
          <CajaResultado ev={mSv.ev} inversion={mSv.inversion} />
          {[
            ["VPN", money(mSv.vpn), mSv.vpn >= 0 ? "pos" : "neg"],
            ["TIR", pct(mSv.tir), mSv.tir >= mSv.waccNom ? "pos" : "neg"],
            ["WACC", pct(mSv.waccNom)],
            ["Payback desc.", mSv.dpbp ? num(mSv.dpbp, 1) + " años" : "No recupera"],
            ["Ventas Año 1", money(mSv.anios[0]?.ventas)],
          ].map(([k, v, tone]) => <KpiBarra key={k} k={k} v={v} tone={tone} />)}
        </div>
      ) : (
        <div className="px-5 py-3 flex gap-6 flex-wrap" style={{ background: C.white, borderBottom: `1px solid ${C.line}` }}>
          {[
            ["WACC", pct(RA.sup.wacc, 2)],
            ["Ke", pct(RA.sup.ke, 2)],
            ["ISR", pct(RA.sup.isr, 0)],
            ["VPN maquinaria", money(RA.maq.vpn), RA.maq.vpn >= 0 ? "pos" : "neg"],
            ["VPN inmueble", money(RA.inm.vpn), RA.inm.vpn >= 0 ? "pos" : "neg"],
            ["VPN terreno", money(RA.ter.vpn), RA.ter.vpn >= 0 ? "pos" : "neg"],
            ["Vehículo: gana", RA.auto.ganador],
          ].map(([k, v, tone]) => <KpiBarra key={k} k={k} v={v} tone={tone} />)}
        </div>
      )}
      </div>

      {esEmpresa ? (
        <div className="flex" style={{ alignItems: "flex-start" }}>
          {/* Sidebar */}
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
            {tab === "pyl" && <TabPyL s={s} up={up} m={m} />}
            {tab === "wacc" && <TabWACC s={s} up={up} m={m} flash={flash} />}
            {tab === "rentab" && <TabRentabilidad s={s} up={up} m={m} />}
            {tab === "sens" && <TabSensibilidad s={s} m={m} />}
            {tab === "ia" && <TabIA s={s} m={m} />}
          </div>
        </div>
      ) : esServicios ? (
        <ModuloServicios s={sv} up={upSv} m={mSv} L={LSv} flash={flash} topH={topH} />
      ) : (
        <ModuloActivo A={a} up={upA} setA={setA} R={RA} flash={flash} topH={topH} />
      )}

      {/* Footer: cierra los dos módulos, no sólo el de empresa */}
      <div className="px-5 py-4 flex items-center justify-center gap-x-20 gap-y-2 flex-wrap"
        style={{ background: C.white, borderTop: `1px solid ${C.line}` }}>
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: C.muted }}>Powered by Axon B2B</span>
        <a href="https://www.axonb2b.ai" target="_blank" rel="noreferrer noopener"
          className="text-[12px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: C.ink, textDecoration: "none" }}>www.axonb2b.ai</a>
        <a href="mailto:contacto@axonb2b.ai"
          className="text-[12px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: C.ink, textDecoration: "none" }}>contacto@axonb2b.ai</a>
      </div>

      {/* Glosario y reglas: panel sobre el contenido */}
      {glosario && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8"
          style={{ background: "rgba(31,34,37,.55)" }}
          onClick={() => setGlosario(false)}>
          <div className="w-full rounded-lg flex flex-col overflow-hidden"
            style={{ maxWidth: 1180, maxHeight: "100%", background: C.paper, border: `1px solid ${C.line}` }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 flex items-center justify-between gap-4 shrink-0" style={{ background: C.ink }}>
              <div>
                <div className="text-[14px] font-semibold tracking-tight" style={{ color: C.white }}>Glosario y reglas</div>
                <div className="text-[11px]" style={{ color: "#9BA0A5" }}>Lo mínimo que hay que tener claro antes de firmar una compra</div>
              </div>
              <Btn small onClick={() => setGlosario(false)}>Cerrar</Btn>
            </div>
            <div className="p-5 overflow-y-auto min-h-0">
              <TabGlosario />
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 px-4 py-2 rounded text-[12px]" style={{ transform: "translateX(-50%)", background: C.ink, color: C.white }}>{toast}</div>
      )}
    </div>
  );
}
