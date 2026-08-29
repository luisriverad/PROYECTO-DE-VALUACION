/* ============================================================
   MÓDULO: INVERSIÓN ACTIVO
   Presupuesto de capital para la compra de un activo concreto.
   Estructura idéntica al módulo de empresa: menú lateral propio
   y una pestaña por tipo de activo.
   ============================================================ */
import React, { useState } from "react";
import { C } from "../lib/theme";
import TabSupuestos from "./activo/TabSupuestos";
import TabMaquinaria from "./activo/TabMaquinaria";
import TabInmueble from "./activo/TabInmueble";
import TabTerreno from "./activo/TabTerreno";
import TabVehiculo from "./activo/TabVehiculo";
import TabResultados from "./activo/TabResultados";
import TabSensibilidadActivo from "./activo/TabSensibilidadActivo";
import TabEscenarios from "./activo/TabEscenarios";

const NAV = [
  { g: "Configuración", items: [["sup", "Tasa de descuento"]] },
  { g: "Tipos de activo", items: [["maq", "Maquinaria y equipo"], ["inm", "Inmueble"], ["ter", "Terreno"], ["auto", "Vehículo"]] },
  { g: "Evaluación", items: [["res", "Tablero comparativo"], ["sen", "Sensibilidad"], ["esc", "Escenarios"]] },
];

export default function ModuloActivo({ A, up, setA, R, flash, topH }) {
  const [tab, setTab] = useState("sup");

  return (
    <div className="flex" style={{ alignItems: "flex-start" }}>
      {/* Menú lateral del módulo */}
      <div className="shrink-0 px-3 py-4"
        style={{ width: 200, borderRight: `1px solid ${C.line}`, position: "sticky", top: topH, maxHeight: `calc(100vh - ${topH}px)`, overflowY: "auto", background: C.paper }}>
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
          <div className="mb-2 leading-relaxed">
            <span style={{ color: C.azul, fontWeight: 600 }}>Azul</span> = lo capturas tú<br />
            <span style={{ color: C.ink, fontWeight: 600 }}>Negro</span> = fórmula o dato de otra pestaña
          </div>
          www.profit120.com · info@profit120.com
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-5 min-w-0">
        {tab === "sup" && <TabSupuestos A={A} up={up} R={R} flash={flash} />}
        {tab === "maq" && <TabMaquinaria A={A} up={up} R={R} />}
        {tab === "inm" && <TabInmueble A={A} up={up} R={R} />}
        {tab === "ter" && <TabTerreno A={A} up={up} R={R} />}
        {tab === "auto" && <TabVehiculo A={A} up={up} R={R} />}
        {tab === "res" && <TabResultados A={A} R={R} />}
        {tab === "sen" && <TabSensibilidadActivo A={A} R={R} />}
        {tab === "esc" && <TabEscenarios A={A} up={up} R={R} />}
      </div>
    </div>
  );
}
