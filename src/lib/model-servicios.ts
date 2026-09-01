/* Estado inicial y motor de cálculo */
import { uid, MESES, irr, npv } from "./format";

/* ============================================================
   ESTADO INICIAL — ejemplo MI ESTUDIO DE DISEÑO (los alumnos lo sustituyen)
   Un despacho de diseño gráfico: la unidad que se vende es un proyecto
   entregado, y lo que lo cuesta son horas de gente más insumos de entrega
   (licencias por pieza, impresiones, fotografía, ilustración externa).
   ============================================================ */
export const seed = () => {
  const I = (nombre, costoLote, volumenLote, unidad) => ({ id: uid(), nombre, costoLote, volumenLote, unidad });
  const ins = [
    I("Licencia de tipografías", 6000, 20, "licencia"),
    I("Banco de imágenes", 3500, 50, "imagen"),
    I("Impresión de dummies y pruebas de color", 1200, 10, "juego"),
    I("Sesión de fotografía de producto", 18000, 2, "sesión"),
    I("Ilustración externa", 9000, 6, "pieza"),
    I("Mensajería y entregas", 1500, 30, "envío"),
  ];
  const mo = [
    { id: uid(), nombre: "Director de arte", sueldoMensual: 45000, personas: 1, horasMes: 160, ineficiencia: 0.15 },
    { id: uid(), nombre: "Diseñador senior", sueldoMensual: 28000, personas: 2, horasMes: 160, ineficiencia: 0.12 },
    { id: uid(), nombre: "Diseñador junior", sueldoMensual: 18000, personas: 2, horasMes: 160, ineficiencia: 0.2 },
    { id: uid(), nombre: "Ejecutivo de cuenta", sueldoMensual: 22000, personas: 1, horasMes: 160, ineficiencia: 0.25 },
  ];
  const receta = (bom, horas) => ({
    bom: bom.map(([i, cant]) => ({ insumoId: ins[i].id, cant })),
    mo: horas.map(([i, h]) => ({ moId: mo[i].id, horas: h })),
  });
  return {
    empresa: { nombre: "MI ESTUDIO DE DISEÑO, S.A. DE C.V.", tipo: "servicios", anio: 2026 },
    supuestos: {
      isr: 0.3, ptu: 0.1, inflacion: 0.035, gPerp: 0.03, diasBase: 360,
      dso: 45, pctCredito: 0.6, dio: 0, dpo: 30,
      indexarPrecios: false, impuestoAnio1: true, nominaEscalaVolumen: true,
      anioCambioGastos: 3, horizonte: 5,
    },
    insumos: ins,
    recursosMO: mo,
    productos: [
      /* mezcla: de cada 100 proyectos del año, cuántos son de cada tipo */
      { id: uid(), nombre: "Identidad corporativa", mix: 0.15, margen: 0.35, precio: 85000,
        ...receta([[0, 2], [1, 5], [2, 1]], [[0, 20], [1, 60], [2, 40], [3, 12]]) },
      { id: uid(), nombre: "Campaña digital (mensual)", mix: 0.45, margen: 0.3, precio: 42000,
        ...receta([[1, 12]], [[0, 6], [1, 20], [2, 30], [3, 10]]) },
      { id: uid(), nombre: "Diseño editorial (catálogo)", mix: 0.25, margen: 0.3, precio: 48000,
        ...receta([[1, 8], [2, 2], [3, 0.5], [5, 1]], [[0, 8], [1, 30], [2, 25], [3, 6]]) },
      { id: uid(), nombre: "Empaque y etiqueta", mix: 0.15, margen: 0.4, precio: 62000,
        ...receta([[0, 1], [2, 3], [4, 1], [5, 1]], [[0, 12], [1, 35], [2, 20], [3, 6]]) },
    ],
    prodCostos: {
      directos: [
        { id: uid(), nombre: "Licencias de software de diseño", fijoMes: 9500, porUnidad: 0, porHora: 0 },
        { id: uid(), nombre: "Nube y almacenamiento de proyectos", fijoMes: 1800, porUnidad: 0, porHora: 0 },
        { id: uid(), nombre: "Impresión de entregables", fijoMes: 0, porUnidad: 350, porHora: 0 },
      ],
      indirectos: [
        { id: uid(), nombre: "Renta de equipo de cómputo y monitores", fijoMes: 6500, porUnidad: 0, porHora: 0 },
        { id: uid(), nombre: "Capacitación y suscripciones", fijoMes: 2200, porUnidad: 0, porHora: 0 },
        { id: uid(), nombre: "Respaldo y ciberseguridad", fijoMes: 1500, porUnidad: 0, porHora: 0 },
      ],
    },
    gastos: {
      admin: [
        { id: uid(), nombre: "Socio director", m1: 55000, m2: 90000 },
        { id: uid(), nombre: "Dirección de cuentas", m1: 30000, m2: 55000 },
        { id: uid(), nombre: "Administración y facturación", m1: 12000, m2: 22000 },
      ],
      oper: [
        { id: uid(), nombre: "Renta del estudio", m1: 22000, m2: 35000 },
        { id: uid(), nombre: "Contabilidad y legal", m1: 8000, m2: 12000 },
        { id: uid(), nombre: "Internet, luz y servicios", m1: 4500, m2: 7000 },
        { id: uid(), nombre: "Seguridad social (IMSS/INFONAVIT)", m1: 9500, m2: 15000 },
      ],
      venta: [
        { id: uid(), nombre: "Portafolio, premios y presencia digital", m1: 12000, m2: 20000 },
        { id: uid(), nombre: "Prospección y nuevos negocios", m1: 8000, m2: 15000 },
      ],
      porPieza: [
        { id: uid(), nombre: "Entrega de archivos y respaldo del proyecto", costo: 250 },
        { id: uid(), nombre: "Junta de cierre y presentación", costo: 900 },
      ],
    },
    activos: [
      { id: uid(), nombre: "Estaciones de trabajo y monitores", inversion: 240000, anios: 4, tipo: "dep", mesInicio: 1 },
      { id: uid(), nombre: "Tableta gráfica y periféricos", inversion: 45000, anios: 4, tipo: "dep", mesInicio: 1 },
      { id: uid(), nombre: "Mobiliario del estudio", inversion: 90000, anios: 10, tipo: "dep", mesInicio: 1 },
      { id: uid(), nombre: "Acondicionamiento del local", inversion: 120000, anios: 5, tipo: "amort", mesInicio: 1 },
      { id: uid(), nombre: "Marca propia y sitio web", inversion: 60000, anios: 3, tipo: "amort", mesInicio: 2 },
    ],
    /* proyectos entregados al mes: el primer mes se va en armar el equipo */
    plan: { unidadesMes: [2, 4, 6, 7, 8, 9, 9, 10, 11, 12, 13, 14], crec: [0.25, 0.2, 0.15, 0.1] },
    credito: { activo: true, monto: 300000, tasaAnual: 0.15, plazoAnios: 3, tipo: "insoluto", mesInicio: 1, prepagos: [] },
    wacc: {
      rf: 0.08724, beta: 1.2, erp: 0.0433, pTamano: 0, pStartup: 0.05, crp: 0.0379, conv: 0.02,
      wE: 1, wD: 0, sector: "Advertising / Design Services", perfil: "",
      notas: {
        rf: "Bono M 10 años", beta: "Unlevered beta sector", erp: "ERP implícita S&P 500", crp: "Country risk premium México",
        pTamano: "Despacho pequeño, menor liquidez", pStartup: "Riesgo de ejecución del arranque", conv: "Ajuste discrecional del inversionista",
      },
      fuente: "",
    },
    valuacion: { multiplo: 7.5, caja: 0, pasLab: 0, pasFin: 0, capex: [0, 0, 0, 0, 0], inversionManual: null },
  };
};

/* Vocabulario por giro. Todo lo que en pantalla suene a fábrica —pieza, material,
   explosionado— sale de aquí, para que el módulo de servicios hable de servicios
   y el de comercio de artículos sin duplicar una sola pestaña.
     uni / unis / uniCorta : la unidad que se vende, en singular, plural y corta
     verbo / entregada     : "producir" / "producida" y sus equivalentes
     explosionTab          : cómo se llama la pestaña donde se arma el costo
     catalogo, bomAdd, moAdd : título del catálogo y botones de alta de renglón */
export const LEX = {
  manufactura: {
    insumos: "Materias primas", insumo: "Materia prima", mo: "Mano de obra directa",
    prod: "Productos", prodS: "Producto", bom: "Lista de materiales (BOM)",
    cp: "producción", cpTab: "Costos de producción",
    uni: "pieza", unis: "piezas", uniCorta: "pzas", verbo: "producir", entregada: "producida",
    unUni: "una pieza", uniDe: "de la pieza",
    explosionTab: "Explosionado de materiales", catalogo: "Lista de materiales",
    bomAdd: "+ Material", moAdd: "+ Mano de obra",
  },
  retail: {
    insumos: "Mercancía", insumo: "Artículo", mo: "Personal de piso",
    prod: "SKUs / Líneas", prodS: "SKU", bom: "Costo de adquisición",
    cp: "operación", cpTab: "Costos de operación",
    uni: "unidad", unis: "unidades", uniCorta: "uds", verbo: "vender", entregada: "vendida",
    unUni: "una unidad", uniDe: "de la unidad",
    explosionTab: "Explosionado de costo", catalogo: "Catálogo de SKUs",
    bomAdd: "+ Artículo", moAdd: "+ Personal",
  },
  servicios: {
    insumos: "Insumos directos", insumo: "Insumo", mo: "Personal operativo",
    prod: "Servicios", prodS: "Servicio", bom: "Insumos por servicio",
    cp: "servicio", cpTab: "Costos del servicio",
    uni: "servicio", unis: "servicios", uniCorta: "svs", verbo: "entregar", entregada: "entregado",
    unUni: "un servicio", uniDe: "del servicio",
    explosionTab: "Diseño de servicios", catalogo: "Catálogo de servicios",
    bomAdd: "+ Insumo", moAdd: "+ Horas de personal",
  },
};

/* ============================================================
   MOTOR DE CÁLCULO — función pura sobre el estado
   ============================================================ */
export function computeModel(s) {
  const H = s.supuestos.horizonte;
  const tasaFiscal = s.supuestos.isr + s.supuestos.ptu;
  const inf = s.supuestos.inflacion;

  // --- costos unitarios de insumos
  const insumoUnit = {};
  s.insumos.forEach((i) => { insumoUnit[i.id] = i.volumenLote > 0 ? i.costoLote / i.volumenLote : 0; });
  // el índice de ineficiencia recorta las horas realmente productivas: el mismo sueldo
  // se reparte entre menos horas, así que la tarifa sube y la capacidad baja
  const moHora = {}, moHorasEfect = {};
  s.recursosMO.forEach((m) => {
    const hef = (m.horasMes || 0) * (1 - (m.ineficiencia || 0));
    moHorasEfect[m.id] = hef;
    moHora[m.id] = hef > 0 ? m.sueldoMensual / hef : 0;
  });

  // --- costo directo por producto
  const prod = s.productos.map((p) => {
    const mp = (p.bom || []).reduce((a, b) => a + (insumoUnit[b.insumoId] || 0) * (b.cant || 0), 0);
    const mod = (p.mo || []).reduce((a, b) => a + (moHora[b.moId] || 0) * (b.horas || 0), 0);
    const horas = (p.mo || []).reduce((a, b) => a + (b.horas || 0), 0);
    return { ...p, mp, mod, directo: mp + mod, horas };
  });

  // --- volumen
  const unidadesAnio = [];
  const u1 = s.plan.unidadesMes.reduce((a, b) => a + (b || 0), 0);
  unidadesAnio.push(u1);
  for (let y = 1; y < H; y++) unidadesAnio.push(unidadesAnio[y - 1] * (1 + (s.plan.crec[y - 1] || 0)));

  // --- gastos
  const sumFijos = (arr, etapa) => arr.reduce((a, g) => a + (etapa === 1 ? g.m1 : g.m2 || 0), 0);
  const gAdmin1 = sumFijos(s.gastos.admin, 1), gAdmin2 = sumFijos(s.gastos.admin, 2);
  const gOper1 = sumFijos(s.gastos.oper, 1), gOper2 = sumFijos(s.gastos.oper, 2);
  const gVenta1 = sumFijos(s.gastos.venta, 1), gVenta2 = sumFijos(s.gastos.venta, 2);
  const gFijoMes1 = gAdmin1 + gOper1 + gVenta1;
  const gFijoMes2 = gAdmin2 + gOper2 + gVenta2;
  const costoPorPieza = s.gastos.porPieza.reduce((a, g) => a + (g.costo || 0), 0);
  const nominaMes = s.recursosMO.reduce((a, m) => a + m.sueldoMensual * (m.personas || 1), 0);

  // --- costos de producción: semi-variables (base fija + consumo por unidad + consumo por hora de MO)
  const PC = s.prodCostos || { directos: [], indirectos: [] };
  const horasProm = prod.reduce((a, p, idx) => a + p.horas * (s.productos[idx].mix || 0), 0);
  const fijoDe = (arr) => arr.reduce((a, g) => a + (g.fijoMes || 0), 0);
  const varDe = (arr, horas) => arr.reduce((a, g) => a + (g.porUnidad || 0) + (g.porHora || 0) * horas, 0);
  const cpFijoDirMes = fijoDe(PC.directos), cpFijoIndMes = fijoDe(PC.indirectos);
  const cpFijoMes = cpFijoDirMes + cpFijoIndMes;
  const cpVarDirU = varDe(PC.directos, horasProm), cpVarIndU = varDe(PC.indirectos, horasProm);
  const cpVarU = cpVarDirU + cpVarIndU;
  const cpDirMes = (u) => cpFijoDirMes + cpVarDirU * u;
  const cpIndMes = (u) => cpFijoIndMes + cpVarIndU * u;
  const cpFijoUnit = u1 > 0 ? (cpFijoMes * 12) / u1 : 0;

  // --- absorción y pricing
  const gastoTotalAnio1 = gFijoMes1 * 12 + costoPorPieza * u1;
  const absorcion = u1 > 0 ? gastoTotalAnio1 / u1 : 0;
  const pricing = prod.map((p) => {
    // la parte variable se traza al producto por sus propias horas; la fija se prorratea
    const cpVar = varDe(PC.directos, p.horas) + varDe(PC.indirectos, p.horas);
    const cp = cpVar + cpFijoUnit;
    const produccion = p.directo + cp;
    const estandar = produccion + absorcion;
    const sugerido = estandar * (1 + (p.margen || 0));
    const margenReal = p.precio > 0 ? (p.precio - estandar) / p.precio : 0;
    const margenContrib = p.precio > 0 ? (p.precio - p.mp - cpVar - costoPorPieza) / p.precio : 0;
    return { ...p, cpVar, cp, produccion, absorcion, estandar, sugerido, margenReal, margenContrib };
  });

  // --- capacidad instalada
  const horasDisp = s.recursosMO.reduce((a, m) => a + (moHorasEfect[m.id] || 0) * (m.personas || 1) * 12, 0);
  const horasReq = prod.reduce((a, p, idx) => a + p.horas * u1 * (s.productos[idx].mix || 0), 0);
  const capacidad = { horasDisp, horasReq, uso: horasDisp > 0 ? horasReq / horasDisp : 0 };

  // --- depreciación y amortización
  const damMes = (y, m) => {
    // y: 1..H, m: 0..11 -> mes global
    const g = (y - 1) * 12 + m + 1;
    let dep = 0, amo = 0;
    s.activos.forEach((a) => {
      const ini = a.mesInicio || 1, fin = ini + (a.anios || 1) * 12 - 1;
      if (g >= ini && g <= fin) {
        const v = (a.inversion || 0) / ((a.anios || 1) * 12);
        if (a.tipo === "amort") amo += v; else dep += v;
      }
    });
    return { dep, amo };
  };
  const damAnio = (y) => {
    let dep = 0, amo = 0;
    for (let m = 0; m < 12; m++) { const d = damMes(y, m); dep += d.dep; amo += d.amo; }
    return { dep, amo };
  };

  // --- tabla de crédito, con pagos anticipados a capital
  const cred = [];
  const prepagos = s.credito.prepagos || [];
  let plazoOriginal = 0, totalIntSin = 0;
  if (s.credito.activo && s.credito.monto > 0) {
    const n = Math.round(s.credito.plazoAnios * 12);
    const i = s.credito.tasaAnual / 12;
    const frances = s.credito.tipo === "frances";
    plazoOriginal = n;
    const cuotaFija = i > 0 ? (s.credito.monto * i) / (1 - Math.pow(1 + i, -n)) : s.credito.monto / n;

    /* corrida de referencia sin anticipos, para poder medir el ahorro */
    let sRef = s.credito.monto;
    for (let k = 1; k <= n; k++) {
      const int = sRef * i;
      totalIntSin += int;
      sRef -= frances ? cuotaFija - int : s.credito.monto / n;
    }

    /* corrida real: cada anticipo baja el saldo y, según su modo, el plazo o la mensualidad */
    let saldo = s.credito.monto, cuota = cuotaFija, capFijo = s.credito.monto / n;
    for (let k = 1; k <= n && saldo > 0.005; k++) {
      const interes = saldo * i;
      let capital = frances ? cuota - interes : capFijo;
      capital = Math.min(Math.max(capital, 0), saldo);
      let sal = saldo - capital;
      const delMes = prepagos.filter((p) => Math.round(p.periodo || 0) === k);
      const prepago = Math.min(Math.max(delMes.reduce((a, p) => a + (p.monto || 0), 0), 0), sal);
      sal -= prepago;
      cred.push({
        periodo: k, mesGlobal: (s.credito.mesInicio || 1) + k - 1,
        interes, capital, prepago, pago: interes + capital + prepago, saldo: sal,
      });
      /* si el anticipo era para bajar la mensualidad, el saldo se reparte en el plazo que queda */
      if (prepago > 0 && sal > 0 && delMes.some((p) => p.modo === "pago")) {
        const rest = n - k;
        if (rest > 0) {
          cuota = i > 0 ? (sal * i) / (1 - Math.pow(1 + i, -rest)) : sal / rest;
          capFijo = sal / rest;
        }
      }
      saldo = sal;
    }
  }
  const credTotalInt = cred.reduce((a, r) => a + r.interes, 0);
  const credInfo = {
    totalInt: credTotalInt, totalIntSin, ahorro: totalIntSin - credTotalInt,
    plazoOriginal, plazoReal: cred.length,
    totalPrepago: cred.reduce((a, r) => a + (r.prepago || 0), 0),
  };
  const interesMes = (y, m) => {
    const g = (y - 1) * 12 + m + 1;
    const r = cred.find((c) => c.mesGlobal === g);
    return r ? r.interes : 0;
  };
  const interesAnio = (y) => { let t = 0; for (let m = 0; m < 12; m++) t += interesMes(y, m); return t; };

  // --- P&L mensual año 1
  const meses = [];
  let acum = 0;
  for (let m = 0; m < 12; m++) {
    const uMes = s.plan.unidadesMes[m] || 0;
    let ventas = 0, mp = 0;
    pricing.forEach((p) => { const u = uMes * (p.mix || 0); ventas += u * (p.precio || 0); mp += u * p.mp; });
    const nomina = nominaMes, cpDir = cpDirMes(uMes), cpInd = cpIndMes(uMes);
    const cogs = mp + nomina + cpDir + cpInd;
    const ub = ventas - cogs;
    const gFijo = gFijoMes1, gVar = costoPorPieza * uMes;
    const { dep, amo } = damMes(1, m);
    const ebit = ub - gFijo - gVar - dep - amo;
    const ebitda = ebit + dep + amo;
    const fin = interesMes(1, m);
    const uai = ebit - fin;
    const imp = uai > 0 ? uai * tasaFiscal : 0;
    const neta = uai - imp;
    acum += neta;
    meses.push({ mes: MESES[m], unidades: uMes, ventas, mp, nomina, cpDir, cpInd, cogs, ub, gFijo, gVar, dep, amo, ebit, ebitda, fin, uai, imp, neta, acum });
  }

  // --- P&L anual
  const anios = [];
  let acumA = 0;
  for (let y = 1; y <= H; y++) {
    if (y === 1) {
      // El Año 1 es exactamente la suma del detalle mensual: las dos vistas siempre amarran.
      const T = (k) => meses.reduce((a, x) => a + x[k], 0);
      const a1 = {
        y: 1, label: "Año 1", unidades: T("unidades"), ventas: T("ventas"), mp: T("mp"), nomina: T("nomina"),
        cpDir: T("cpDir"), cpInd: T("cpInd"), cogs: T("cogs"), ub: T("ub"), gFijo: T("gFijo"), gVar: T("gVar"), dep: T("dep"),
        amo: T("amo"), ebit: T("ebit"), ebitda: T("ebitda"), fin: T("fin"), uai: T("uai"), imp: T("imp"), neta: T("neta"),
      };
      acumA = a1.neta; anios.push({ ...a1, acum: acumA });
      continue;
    }
    const infl = Math.pow(1 + inf, y - 1);
    const u = unidadesAnio[y - 1];
    const escala = u1 > 0 ? u / u1 : 0;
    let ventas = 0, mp = 0;
    pricing.forEach((p) => {
      const uu = u * (p.mix || 0);
      ventas += uu * (p.precio || 0) * (s.supuestos.indexarPrecios ? infl : 1);
      mp += uu * p.mp * infl;
    });
    const factorNom = s.supuestos.nominaEscalaVolumen ? escala : 1;
    const etapa = y >= s.supuestos.anioCambioGastos ? 2 : 1;
    const nomina = nominaMes * 12 * infl * factorNom;
    const cpDir = (cpFijoDirMes * 12 + cpVarDirU * u) * infl;
    const cpInd = (cpFijoIndMes * 12 + cpVarIndU * u) * infl;
    const cogs = mp + nomina + cpDir + cpInd;
    const ub = ventas - cogs;
    const gFijo = (etapa === 1 ? gFijoMes1 : gFijoMes2) * 12 * infl;
    const gVar = costoPorPieza * u * infl;
    const { dep, amo } = damAnio(y);
    const ebit = ub - gFijo - gVar - dep - amo;
    const ebitda = ebit + dep + amo;
    const fin = interesAnio(y);
    const uai = ebit - fin;
    const imp = uai > 0 ? uai * tasaFiscal : 0;
    const neta = uai - imp;
    acumA += neta;
    anios.push({ y, label: "Año " + y, unidades: u, ventas, mp, nomina, cpDir, cpInd, cogs, ub, gFijo, gVar, dep, amo, ebit, ebitda, fin, uai, imp, neta, acum: acumA });
  }

  // --- inversión requerida = máxima necesidad de caja acumulada
  const minMes = Math.min(...meses.map((m) => m.acum));
  const minAnio = Math.min(...anios.map((a) => a.acum));
  const inversionAuto = Math.abs(Math.min(0, minMes, minAnio));
  const inversion = s.valuacion.inversionManual != null ? s.valuacion.inversionManual : inversionAuto;

  // --- costo de capital
  const w = s.wacc;
  const capmNom = w.rf + w.beta * w.erp + w.pTamano + w.pStartup + w.crp + w.conv;
  const capmReal = (1 + capmNom) / (1 + inf) - 1;
  const kdAntes = s.credito.tasaAnual;
  const kdNom = kdAntes * (1 - s.supuestos.isr);
  const kdReal = (1 + kdNom) / (1 + inf) - 1;
  const wE = w.wE, wD = w.wD;
  const waccNom = capmNom * wE + kdNom * wD;
  const waccReal = capmReal * wE + kdReal * wD;

  // --- capital de trabajo
  const db = s.supuestos.diasBase || 360;
  const ct = [{ y: 0, cxc: 0, inv: 0, cxp: 0, ctn: 0, delta: 0 }];
  anios.forEach((a, idx) => {
    const cxc = (a.ventas * s.supuestos.pctCredito * s.supuestos.dso) / db;
    const inv = (a.mp * s.supuestos.dio) / db;
    const cxp = (a.mp * s.supuestos.dpo) / db;
    const ctn = cxc + inv - cxp;
    ct.push({ y: idx + 1, cxc, inv, cxp, ctn, delta: -(ctn - ct[idx].ctn) });
  });

  // --- flujo libre
  const flujos = [{ y: 0, nopat: 0, dam: 0, dCT: 0, capex: -inversion, fcf: -inversion }];
  anios.forEach((a, idx) => {
    const gravar = a.ebit > 0 && (s.supuestos.impuestoAnio1 || idx > 0);
    const nopat = gravar ? a.ebit * (1 - tasaFiscal) : a.ebit;
    const dam = a.dep + a.amo;
    const dCT = ct[idx + 1].delta;
    const capex = -(s.valuacion.capex[idx] || 0);
    flujos.push({ y: idx + 1, nopat, dam, dCT, capex, fcf: nopat + dam + dCT + capex });
  });

  const wacc = waccNom;
  const g = s.supuestos.gPerp;
  const fcfN = flujos[flujos.length - 1].fcf;
  const vt = wacc > g ? (fcfN * (1 + g)) / (wacc - g) : NaN;
  const vpVT = isFinite(vt) ? vt / Math.pow(1 + wacc, H) : NaN;
  const vpFlujos = flujos.slice(1).map((f) => f.fcf / Math.pow(1 + wacc, f.y));
  const vpOperacion = vpFlujos.reduce((a, b) => a + b, 0);
  const vpn = vpOperacion - inversion;
  const vpnPerp = vpn + (isFinite(vpVT) ? vpVT : 0);
  const arrFcf = flujos.map((f) => f.fcf);
  const tir = irr(arrFcf);
  const arrPerp = arrFcf.slice();
  if (isFinite(vt)) arrPerp[arrPerp.length - 1] = arrPerp[arrPerp.length - 1] + vt;
  const tirPerp = irr(arrPerp);

  // payback descontado
  let cum = -inversion, dpbp = null, acumSerie = [{ y: 0, acum: cum }];
  for (let i = 0; i < vpFlujos.length; i++) {
    const prev = cum; cum += vpFlujos[i];
    acumSerie.push({ y: i + 1, acum: cum });
    if (dpbp === null && prev < 0 && cum >= 0) dpbp = i + Math.abs(prev) / vpFlujos[i];
  }
  // punto de equilibrio contable (primer año con EBIT positivo)
  const anioEquilibrio = anios.find((a) => a.ebit > 0)?.y ?? null;
  const mesEquilibrio = meses.findIndex((m) => m.ebit > 0);

  // valuación
  const ev = vpOperacion + (isFinite(vpVT) ? vpVT : 0);
  const equity = ev + s.valuacion.caja - s.valuacion.pasLab - s.valuacion.pasFin;
  const preMoney = equity - inversion;
  const pctPost = equity > 0 ? inversion / equity : NaN;
  const pctPre = preMoney > 0 ? inversion / preMoney : NaN;
  const ebits = anios.map((a) => a.ebit).sort((a, b) => a - b);
  const medEbit = ebits.length % 2 ? ebits[(ebits.length - 1) / 2] : (ebits[ebits.length / 2 - 1] + ebits[ebits.length / 2]) / 2;
  const valMultiplo = (medEbit * s.valuacion.multiplo) / Math.pow(1 + wacc, H);

  // punto de equilibrio operativo año 1
  const precioProm = pricing.reduce((a, p) => a + (p.precio || 0) * (p.mix || 0), 0);
  const cvProm = pricing.reduce((a, p) => a + (p.mp + p.cpVar + costoPorPieza) * (p.mix || 0), 0);
  const cmuProm = precioProm - cvProm;
  const costosFijosAnio1 = gFijoMes1 * 12 + nominaMes * 12 + cpFijoMes * 12 + damAnio(1).dep + damAnio(1).amo;
  const peUnidades = cmuProm > 0 ? costosFijosAnio1 / cmuProm : NaN;
  const pePesos = peUnidades * precioProm;

  return {
    insumoUnit, moHora, moHorasEfect, prod: pricing, absorcion, unidadesAnio, meses, anios, cred, credInfo, capacidad,
    inversion, inversionAuto, minMes, minAnio,
    capmNom, capmReal, kdNom, kdReal, waccNom, waccReal, kdAntes,
    ct, flujos, vt, vpVT, vpOperacion, vpn, vpnPerp, tir, tirPerp, dpbp, acumSerie,
    ev, equity, preMoney, pctPost, pctPre, medEbit, valMultiplo,
    anioEquilibrio, mesEquilibrio, peUnidades, pePesos, precioProm, cvProm, cmuProm, costosFijosAnio1,
    gFijoMes1, gFijoMes2, nominaMes, costoPorPieza, gastoTotalAnio1, tasaFiscal,
    gAdmin1, gOper1, gVenta1,
    horasProm, cpFijoDirMes, cpFijoIndMes, cpFijoMes, cpVarDirU, cpVarIndU, cpVarU, cpFijoUnit,
  };
}
