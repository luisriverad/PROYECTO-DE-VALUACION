/* Exportación del libro de Excel */
import { computeModel } from "./model";

/* ============================================================
   EXPORTACIÓN A EXCEL — un libro con la misma estructura de pestañas
   ============================================================ */
const FMT = { money: "#,##0", money2: "#,##0.00", money4: "#,##0.0000", pct: "0.0%", pct2: "0.00%", int: "#,##0", dec: "#,##0.00" };
const F = (v, f) => ({ __f: true, v, f });
const $ = (v) => F(v, FMT.money);
const $2 = (v) => F(v, FMT.money2);
const P = (v) => F(v, FMT.pct2);
const N = (v) => F(v, FMT.int);
const N2 = (v) => F(v, FMT.dec);

function hoja(XLSX, aoa, anchos) {
  const limpio = aoa.map((r) => (r || []).map((c) => {
    const val = c && c.__f ? c.v : c;
    return typeof val === "number" && !isFinite(val) ? "" : val === undefined ? "" : val;
  }));
  const ws = XLSX.utils.aoa_to_sheet(limpio);
  aoa.forEach((row, r) => (row || []).forEach((c, i) => {
    if (c && c.__f && typeof c.v === "number" && isFinite(c.v)) {
      const dir = XLSX.utils.encode_cell({ r, c: i });
      if (ws[dir]) ws[dir].z = c.f;
    }
  }));
  ws["!cols"] = (anchos || []).map((w) => ({ wch: w }));
  return ws;
}

export function exportarExcel(XLSX, s, m) {
  const H = s.supuestos.horizonte;
  const wb = XLSX.utils.book_new();
  const anios = m.anios.map((a) => a.label);
  const vacio = [];

  /* ---------- SUPUESTOS ---------- */
  const sup = [
    ["PLATAFORMA DE EVALUACIÓN DE LA INVERSIÓN"],
    [s.empresa.nombre || "Proyecto sin nombre"],
    vacio,
    ["IDENTIDAD"],
    ["Tipo de empresa", s.empresa.tipo],
    ["Año de arranque", s.empresa.anio],
    ["Horizonte de evaluación (años)", H],
    vacio,
    ["SUPUESTOS FISCALES Y MACRO"],
    ["Tasa de ISR", P(s.supuestos.isr)],
    ["PTU", P(s.supuestos.ptu)],
    ["Tasa fiscal total", P(m.tasaFiscal)],
    ["Inflación anual", P(s.supuestos.inflacion)],
    ["Crecimiento a perpetuidad (g)", P(s.supuestos.gPerp)],
    ["Año en que cambia la estructura de gastos", s.supuestos.anioCambioGastos],
    vacio,
    ["CAPITAL DE TRABAJO"],
    ["Días de cartera (DSO)", s.supuestos.dso],
    ["% de clientes a crédito", P(s.supuestos.pctCredito)],
    ["Días de inventario (DIO)", s.supuestos.dio],
    ["Días de proveedores (DPO)", s.supuestos.dpo],
    ["Días base del año", s.supuestos.diasBase],
    ["Ciclo de conversión de efectivo (días)", s.supuestos.dso + s.supuestos.dio - s.supuestos.dpo],
    vacio,
    ["CRITERIOS DEL MODELO"],
    ["Precios indexados a inflación", s.supuestos.indexarPrecios ? "Sí" : "No"],
    ["Utilidad gravada desde el Año 1", s.supuestos.impuestoAnio1 ? "Sí" : "No"],
    ["Nómina directa escala con el volumen", s.supuestos.nominaEscalaVolumen ? "Sí" : "No"],
  ];
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, sup, [42, 22]), "Supuestos");

  /* ---------- COSTEO ---------- */
  const cost = [["LISTA DE MATERIALES Y COSTO ESTÁNDAR"], vacio];
  m.prod.forEach((p) => {
    cost.push([p.nombre.toUpperCase(), "Concepto", "Cantidad", "Unidad", "Costo unitario", "Importe"]);
    (p.bom || []).forEach((b) => {
      const ins = s.insumos.find((x) => x.id === b.insumoId);
      cost.push(["", ins ? ins.nombre : "—", N2(b.cant), ins ? ins.unidad : "", $2(m.insumoUnit[b.insumoId] || 0), $2((m.insumoUnit[b.insumoId] || 0) * b.cant)]);
    });
    (p.mo || []).forEach((b) => {
      const r = s.recursosMO.find((x) => x.id === b.moId);
      cost.push(["", r ? r.nombre : "—", N2(b.horas), "hrs", $2(m.moHora[b.moId] || 0), $2((m.moHora[b.moId] || 0) * b.horas)]);
    });
    cost.push(["", "Costo de materiales", "", "", "", $2(p.mp)]);
    cost.push(["", "Costo de mano de obra", "", "", "", $2(p.mod)]);
    cost.push(["", "Costos de producción (variable trazable)", "", "", "", $2(p.cpVar)]);
    cost.push(["", "Costos de producción (prorrateo de base fija)", "", "", "", $2(m.cpFijoUnit)]);
    cost.push(["", "COSTO DE PRODUCCIÓN (sin absorción de gasto)", "", "", "", $2(p.produccion)]);
    cost.push(vacio);
  });
  cost.push(["CATÁLOGO DE INSUMOS"]);
  cost.push(["", "Insumo", "Costo del lote", "Volumen del lote", "Unidad", "Costo por unidad"]);
  s.insumos.forEach((i) => cost.push(["", i.nombre, $(i.costoLote), N2(i.volumenLote), i.unidad, $2(m.insumoUnit[i.id])]));
  cost.push(vacio);
  cost.push(["MANO DE OBRA"]);
  cost.push(["", "Puesto", "Sueldo mensual", "Personas", "Horas contratadas / mes", "Índice de ineficiencia", "Horas productivas / mes", "Costo por hora", "Nómina anual", "Costo de la ineficiencia"]);
  s.recursosMO.forEach((r) => cost.push(["", r.nombre, $(r.sueldoMensual), r.personas, r.horasMes, P(r.ineficiencia || 0), N(m.moHorasEfect[r.id]), $2(m.moHora[r.id]), $(r.sueldoMensual * r.personas * 12), $((r.sueldoMensual || 0) * (r.personas || 1) * 12 * (r.ineficiencia || 0))]));
  cost.push(["", "Nómina directa total", $(m.nominaMes), "", "", "", $(m.nominaMes * 12)]);
  cost.push(vacio);
  cost.push(["COSTOS DE PRODUCCIÓN"]);
  cost.push(["", "Concepto", "Base fija mensual", "Por unidad", "Por hora de MO", "Costo unitario", "Costo Año 1"]);
  const u1x = m.unidadesAnio[0] || 0, hrs1x = u1x * m.horasProm;
  const filaCP = (g) => ["", g.nombre, $(g.fijoMes || 0), $2(g.porUnidad || 0), $2(g.porHora || 0),
    $2((g.porUnidad || 0) + (g.porHora || 0) * m.horasProm),
    $((g.fijoMes || 0) * 12 + (g.porUnidad || 0) * u1x + (g.porHora || 0) * hrs1x)];
  cost.push(["DIRECTOS"]);
  (s.prodCostos.directos || []).forEach((g) => cost.push(filaCP(g)));
  cost.push(["INDIRECTOS"]);
  (s.prodCostos.indirectos || []).forEach((g) => cost.push(filaCP(g)));
  cost.push(["", "Base fija total", $(m.cpFijoMes), "", "", $2(m.cpVarU), $(m.cpFijoMes * 12 + m.cpVarU * u1x)]);
  cost.push(vacio);
  cost.push(["CAPACIDAD INSTALADA"]);
  cost.push(["", "Horas productivas / año (netas de ineficiencia)", N(m.capacidad.horasDisp)]);
  cost.push(["", "Horas requeridas / año", N(m.capacidad.horasReq)]);
  cost.push(["", "Uso de capacidad", P(m.capacidad.uso)]);
  cost.push(["", "Horas de MO por unidad (promedio ponderado)", N2(m.horasProm)]);
  cost.push(["", "Holgura (horas)", N(m.capacidad.horasDisp - m.capacidad.horasReq)]);
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, cost, [16, 38, 16, 18, 12, 18, 16]), "Costeo");

  /* ---------- GASTOS ---------- */
  const ac = s.supuestos.anioCambioGastos;
  const gas = [["ESTRUCTURA DE GASTOS"], vacio];
  const bloque = (titulo, arr) => {
    gas.push([titulo, "Mensual Año 1–" + (ac - 1), "Mensual Año " + ac + "+", "Anual Año 1"]);
    arr.forEach((g) => gas.push([g.nombre, $(g.m1), $(g.m2), $(g.m1 * 12)]));
    gas.push(["Total", $(arr.reduce((a, g) => a + g.m1, 0)), $(arr.reduce((a, g) => a + (g.m2 || 0), 0)), $(arr.reduce((a, g) => a + g.m1, 0) * 12)]);
    gas.push(vacio);
  };
  bloque("GASTOS ADMINISTRATIVOS", s.gastos.admin);
  bloque("GASTOS OPERATIVOS", s.gastos.oper);
  bloque("GASTOS DE VENTA", s.gastos.venta);
  gas.push(["GASTOS VARIABLES POR UNIDAD VENDIDA", "Costo por unidad"]);
  s.gastos.porPieza.forEach((g) => gas.push([g.nombre, $2(g.costo)]));
  gas.push(["Total por unidad", $2(m.costoPorPieza)]);
  gas.push(vacio);
  gas.push(["ACTIVOS E INVERSIONES", "Inversión", "Tratamiento", "Vida útil (años)", "Mes de alta", "Cargo mensual", "Cargo anual"]);
  s.activos.forEach((a) => gas.push([a.nombre, $(a.inversion), a.tipo === "amort" ? "Amortización" : "Depreciación", a.anios, a.mesInicio, $2(a.inversion / ((a.anios || 1) * 12)), $(a.inversion / (a.anios || 1))]));
  gas.push(vacio);
  gas.push(["ABSORCIÓN DE GASTO"]);
  gas.push(["Gasto total Año 1", $(m.gastoTotalAnio1)]);
  gas.push(["Unidades Año 1", N(m.unidadesAnio[0])]);
  gas.push(["Absorción por unidad", $2(m.absorcion)]);
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, gas, [38, 20, 18, 16, 14, 16, 16]), "Gastos");

  /* ---------- PRICING ---------- */
  const pri = [
    ["PRICING Y MARGEN"], vacio,
    ["Producto", "Mezcla", "Materiales + MO", "Costos de producción", "Costo de producción", "Absorción de gasto", "Costo estándar", "Margen objetivo", "Precio sugerido", "Precio de lista", "Margen real", "Margen de contribución"],
  ];
  m.prod.forEach((p) => pri.push([p.nombre, P(p.mix), $2(p.directo), $2(p.cp), $2(p.produccion), $2(p.absorcion), $2(p.estandar), P(p.margen), $2(p.sugerido), $(p.precio), P(p.margenReal), P(p.margenContrib)]));
  pri.push(["Total / promedio ponderado", P(m.prod.reduce((a, p) => a + p.mix, 0)), "", "", "", "", "", "", "", $2(m.precioProm), "", ""]);
  pri.push(vacio);
  pri.push(["PUNTO DE EQUILIBRIO OPERATIVO (AÑO 1)"]);
  pri.push(["Precio promedio ponderado", $2(m.precioProm)]);
  pri.push(["Costo variable unitario promedio", $2(m.cvProm)]);
  pri.push(["Margen de contribución unitario", $2(m.cmuProm)]);
  pri.push(["Costos fijos totales", $(m.costosFijosAnio1)]);
  pri.push(["Unidades de equilibrio", N(m.peUnidades)]);
  pri.push(["Venta de equilibrio", $(m.pePesos)]);
  pri.push(["Unidades del plan Año 1", N(m.unidadesAnio[0])]);
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, pri, [30, 12, 16, 20, 18, 18, 15, 15, 16, 15, 13, 20]), "Pricing");

  /* ---------- PRESUPUESTO ANUAL ---------- */
  const enc = ["Concepto", ...m.meses.map((x) => x.mes), ...anios];
  const fila = (label, fn, fmt) => [label, ...m.meses.map((x) => fmt(fn(x))), ...m.anios.map((a) => fmt(fn(a)))];
  const pres = [
    [s.empresa.nombre || "Proyecto"],
    ["Forecast — ejercicio " + s.empresa.anio],
    vacio, enc,
    ...s.productos.map((p) => fila(p.nombre + " (piezas)", (x) => (x.unidades || 0) * (p.mix || 0), N)),
    fila("Piezas totales", (x) => x.unidades, N),
    fila("Ventas", (x) => x.ventas, $),
    fila("Materiales", (x) => -x.mp, $),
    fila("Nómina directa", (x) => -x.nomina, $),
    fila("Costos directos de producción", (x) => -x.cpDir, $),
    fila("Costos indirectos de producción", (x) => -x.cpInd, $),
    fila("Costo de ventas", (x) => -x.cogs, $),
    fila("Utilidad bruta", (x) => x.ub, $),
    fila("% sobre ventas", (x) => (x.ventas ? x.ub / x.ventas : NaN), P),
    fila("Gastos fijos", (x) => -x.gFijo, $),
    fila("Gastos variables de venta", (x) => -x.gVar, $),
    fila("EBITDA", (x) => x.ebitda, $),
    fila("% sobre ventas", (x) => (x.ventas ? x.ebitda / x.ventas : NaN), P),
    fila("Depreciación", (x) => -x.dep, $),
    fila("Amortización", (x) => -x.amo, $),
    fila("Utilidad de operación (EBIT)", (x) => x.ebit, $),
    fila("% sobre ventas", (x) => (x.ventas ? x.ebit / x.ventas : NaN), P),
    fila("Gasto financiero", (x) => -x.fin, $),
    fila("Utilidad antes de impuestos", (x) => x.uai, $),
    fila("ISR + PTU", (x) => -x.imp, $),
    fila("Utilidad neta", (x) => x.neta, $),
    fila("% sobre ventas", (x) => (x.ventas ? x.neta / x.ventas : NaN), P),
    fila("Utilidad acumulada", (x) => x.acum, $),
  ];
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, pres, [30, ...Array(12 + H).fill(13)]), "Presupuesto Anual");

  /* ---------- PLAN DE VENTAS ---------- */
  const plan = [
    ["PLAN DE VENTAS"], vacio,
    ["Unidades por mes — Año 1"],
    ["", ...m.meses.map((x) => x.mes), "Total"],
    ["Unidades", ...m.meses.map((x) => N(x.unidades)), N(m.unidadesAnio[0])],
    ["Ventas", ...m.meses.map((x) => $(x.ventas)), $(m.anios[0].ventas)],
    vacio,
    ["Unidades por producto — Año 1"],
    ["Producto", ...m.meses.map((x) => x.mes), "Total"],
    ...m.prod.map((p) => [p.nombre, ...m.meses.map((x) => N(x.unidades * p.mix)), N(m.unidadesAnio[0] * p.mix)]),
    vacio,
    ["Proyección anual"],
    ["Concepto", ...anios],
    ["Crecimiento vs. año anterior", "", ...s.plan.crec.slice(0, H - 1).map((c) => P(c))],
    ["Unidades", ...m.anios.map((a) => N(a.unidades))],
    ["Ventas", ...m.anios.map((a) => $(a.ventas))],
  ];
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, plan, [30, ...Array(13).fill(12)]), "Plan de Ventas");

  /* ---------- CRÉDITO BANCARIO ---------- */
  const cre = [
    ["TABLA DE AMORTIZACIÓN"], vacio,
    ["Monto", $(s.credito.monto)],
    ["Tasa anual total", P(s.credito.tasaAnual)],
    ["Tasa mensual", F(s.credito.tasaAnual / 12, "0.000%")],
    ["Plazo (años)", s.credito.plazoAnios],
    ["Plazo (meses)", Math.round(s.credito.plazoAnios * 12)],
    ["Sistema", s.credito.tipo === "frances" ? "Cuota fija (francés)" : "Saldos insolutos (pago decreciente)"],
    ["Mes de disposición", s.credito.mesInicio],
    ["Intereses totales", $(m.cred.reduce((a, b) => a + b.interes, 0))],
    vacio,
    ["Periodo", "Interés", "Capital", "Pago", "Saldo"],
    ...m.cred.map((r) => [r.periodo, $2(r.interes), $2(r.capital), $2(r.pago), $2(r.saldo)]),
    vacio,
    ["Intereses por año", ...anios],
    ["", ...m.anios.map((a) => $(a.fin))],
  ];
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, cre, [26, 16, 16, 16, 16]), "Crédito Bancario");

  /* ---------- COSTO DE CAPITAL ---------- */
  const w = s.wacc;
  const cap = [
    ["CÁLCULO DEL COSTO DE CAPITAL"], vacio,
    ["Componente", "Valor", "Observaciones"],
    ["Tasa libre de riesgo", P(w.rf), w.notas.rf || ""],
    ["Beta", N2(w.beta), w.notas.beta || ""],
    ["Prima de riesgo de mercado (ERP)", P(w.erp), w.notas.erp || ""],
    ["Prima por tamaño", P(w.pTamano), "Empresa pequeña, menor liquidez"],
    ["Prima por etapa (startup)", P(w.pStartup), "Riesgo de ejecución del arranque"],
    ["Riesgo país", P(w.crp), w.notas.crp || ""],
    ["Prima de negociación", P(w.conv), "Ajuste discrecional del inversionista"],
    vacio,
    ["Sector de referencia", w.sector],
    ["Fuente", w.fuente || "Captura manual"],
    vacio,
    ["CAPM nominal", P(m.capmNom)],
    ["CAPM real (deflactado)", P(m.capmReal)],
    vacio,
    ["Costo de deuda antes de impuestos", P(m.kdAntes)],
    ["Costo de deuda después de impuestos", P(m.kdNom)],
    ["Costo de deuda real", P(m.kdReal)],
    vacio,
    ["Proporción de capital propio", P(w.wE)],
    ["Proporción de deuda", P(w.wD)],
    ["WACC NOMINAL", P(m.waccNom)],
    ["WACC real", P(m.waccReal)],
  ];
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, cap, [38, 14, 52]), "Costo de Capital");

  /* ---------- RENTABILIDAD DE LA INVERSIÓN ---------- */
  const ren = [
    ["ANÁLISIS DE RENTABILIDAD DE LA INVERSIÓN"], vacio,
    ["Inversión requerida", $(m.inversion)],
    ["VPN (periodo de análisis)", $(m.vpn)],
    ["VPN con valor terminal", $(m.vpnPerp)],
    ["TIR (" + H + " años)", P(m.tir)],
    ["TIR con perpetuidad", P(m.tirPerp)],
    ["WACC de descuento", P(m.waccNom)],
    ["Payback descontado (años)", m.dpbp ? N2(m.dpbp) : "No recupera"],
    ["Primer año con utilidad de operación", m.anioEquilibrio ? "Año " + m.anioEquilibrio : "Ninguno"],
    vacio,
    ["FLUJO DE EFECTIVO LIBRE"],
    ["Concepto", ...m.flujos.map((f) => "Año " + f.y)],
    ["Utilidad de operación (EBIT)", "", ...m.anios.map((a) => $(a.ebit))],
    ["NOPAT", "", ...m.flujos.slice(1).map((f) => $(f.nopat))],
    ["+ Depreciación y amortización", "", ...m.flujos.slice(1).map((f) => $(f.dam))],
    ["± Variación en capital de trabajo", "", ...m.flujos.slice(1).map((f) => $(f.dCT))],
    ["− Inversión (CAPEX)", ...m.flujos.map((f) => $(f.capex))],
    ["FLUJO DE EFECTIVO LIBRE", ...m.flujos.map((f) => $(f.fcf))],
    ["Flujo descontado", ...m.flujos.map((f) => $(f.fcf / Math.pow(1 + m.waccNom, f.y)))],
    ["Acumulado descontado", ...m.acumSerie.map((a) => $(a.acum))],
    vacio,
    ["VALUACIÓN POR FLUJOS DESCONTADOS"],
    ["Valor presente de los flujos (" + H + " años)", $(m.vpOperacion)],
    ["Valor terminal (perpetuidad g = " + (s.supuestos.gPerp * 100).toFixed(1) + "%)", $(m.vt)],
    ["Valor terminal a valor presente", $(m.vpVT)],
    ["VALOR DE LA EMPRESA (Enterprise Value)", $(m.ev)],
    ["+ Caja", $(s.valuacion.caja)],
    ["− Pasivos laborales", $(-s.valuacion.pasLab)],
    ["− Pasivos financieros", $(-s.valuacion.pasFin)],
    ["VALOR DEL CAPITAL (Equity Value)", $(m.equity)],
    ["Participación post-money", P(m.pctPost)],
    ["Participación pre-money", P(m.pctPre)],
    vacio,
    ["VALUACIÓN POR MÚLTIPLOS"],
    ["Múltiplo EBIT del sector", N2(s.valuacion.multiplo)],
    ["EBIT mediano del horizonte", $(m.medEbit)],
    ["Valuación por múltiplo (a valor presente)", $(m.valMultiplo)],
    ["Diferencia contra flujos descontados", $(m.valMultiplo - m.ev)],
    vacio,
    ["CAPITAL DE TRABAJO"],
    ["Concepto", ...m.ct.map((c) => "Año " + c.y)],
    ["Cuentas por cobrar", ...m.ct.map((c) => $(c.cxc))],
    ["Inventarios", ...m.ct.map((c) => $(c.inv))],
    ["Cuentas por pagar", ...m.ct.map((c) => $(-c.cxp))],
    ["Capital de trabajo neto", ...m.ct.map((c) => $(c.ctn))],
    ["Impacto en el flujo", ...m.ct.map((c) => $(c.delta))],
  ];
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, ren, [42, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16]), "Rentabilidad");

  /* ---------- ESCENARIOS ---------- */
  const d = [-0.2, -0.1, 0, 0.1, 0.2];
  const escVPN = [["SENSIBILIDAD DEL VPN"], ["Precio ↓ / Volumen →", ...d.map((x) => P(x))]];
  const escTIR = [["SENSIBILIDAD DE LA TIR"], ["Precio ↓ / Volumen →", ...d.map((x) => P(x))]];
  d.forEach((dp) => {
    const fv = [P(dp)], ft = [P(dp)];
    d.forEach((dv) => {
      const c = JSON.parse(JSON.stringify(s));
      c.productos.forEach((p) => { p.precio = p.precio * (1 + dp); });
      c.plan.unidadesMes = c.plan.unidadesMes.map((u) => u * (1 + dv));
      const r = computeModel(c);
      fv.push($(r.vpn)); ft.push(P(r.tir));
    });
    escVPN.push(fv); escTIR.push(ft);
  });
  const esc = [...escVPN, [], ...escTIR];
  XLSX.utils.book_append_sheet(wb, hoja(XLSX, esc, [24, 16, 16, 16, 16, 16]), "Escenarios");

  const nombre = (s.empresa.nombre || "Proyecto").replace(/[^\wáéíóúñÁÉÍÓÚÑ ]+/g, "").trim().replace(/\s+/g, "_");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  a.download = nombre + "_Evaluacion_de_la_Inversion.xlsx";
  a.click();
}
