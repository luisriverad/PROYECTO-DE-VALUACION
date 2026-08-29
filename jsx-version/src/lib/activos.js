/* ============================================================
   MOTOR DEL MÓDULO "INVERSIÓN ACTIVO"
   Presupuesto de capital para la compra de un activo:
   maquinaria, inmueble, terreno y vehículo.
   Todo el cálculo vive aquí; las pestañas sólo lo muestran.
   ============================================================ */

/* ---------- utilidades ---------- */
export const ok = (n) => n !== null && n !== undefined && isFinite(n);

export function npv(rate, cf) { let s = 0; for (let i = 0; i < cf.length; i++) s += cf[i] / Math.pow(1 + rate, i); return s; }

export function irr(cf) {
  if (!cf.some((v) => v > 0) || !cf.some((v) => v < 0)) return null;
  let lo = -0.95, hi = 5, flo = npv(lo, cf), fhi = npv(hi, cf);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2, f = npv(mid, cf);
    if (flo * f <= 0) { hi = mid; fhi = f; } else { lo = mid; flo = f; }
  }
  return (lo + hi) / 2;
}

/* TIR modificada: reinvierte los flujos positivos a la tasa exigida */
export function mirr(cf, fin, rein) {
  const n = cf.length - 1; let pvN = 0, fvP = 0;
  cf.forEach((c, i) => { if (c < 0) pvN += c / Math.pow(1 + fin, i); else fvP += c * Math.pow(1 + rein, n - i); });
  if (pvN >= 0 || fvP <= 0) return null;
  return Math.pow(fvP / (-pvN), 1 / n) - 1;
}

export function pmt(r, n, pv) { return r === 0 || !n ? (n ? pv / n : 0) : (pv * r) / (1 - Math.pow(1 + r, -n)); }

export function saldoRest(r, t, pago, monto) {
  if (r === 0) return Math.max(0, monto - pago * t);
  return Math.max(0, monto * Math.pow(1 + r, t) - pago * ((Math.pow(1 + r, t) - 1) / r));
}

/* Valor anual equivalente: convierte el VPN en una renta anual */
export function vae(vpn, rate, n) {
  if (!ok(vpn) || !n || rate <= -1) return null;
  return (vpn * rate) / (1 - Math.pow(1 + rate, -n));
}

export function paybackDesc(acum) {
  if (acum[acum.length - 1] < 0) return null;
  return acum.filter((v) => v < 0).length;
}

/* Busca por bisección el valor de x que hace f(x) = 0 */
export function solve(f, lo, hi) {
  let flo = f(lo), fhi = f(hi);
  if (!ok(flo) || !ok(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2, fm = f(m);
    if (!ok(fm)) return null;
    if (flo * fm <= 0) { hi = m; fhi = fm; } else { lo = m; flo = fm; }
  }
  return (lo + hi) / 2;
}

/* ---------- estado inicial (ejemplo ilustrativo) ---------- */
export const DEF_ACTIVOS = {
  sup: {
    isr: 0.30, inf: 0.045,
    /* Ancla: lo que te cobra el banco hoy. Es el único dato de mercado que el
       dueño ya conoce de memoria, y trae dentro su tamaño, su sector y su
       riesgo de crédito, que es justo lo que el CAPM reconstruye a mano. */
    metodo: "kd", kd: 0.145, primaEq: 0.050, wd: 0.30,
    /* Camino formal, por si hay que defenderlo ante un tercero: build-up.
       Suma primas en vez de multiplicarlas, así que no necesita beta. */
    rf: 0.095, prm: 0.065, ptam: 0.020, pneg: 0.030,
    /* Camino manual: la tasa se captura y punto. */
    baseDirecta: 0.160,
    /* La tasa depende del uso, no del nombre del activo. Si el inmueble o el
       terreno son inversión y no herramienta, la tasa la pone el mercado. */
    usoInm: "inv", usoTer: "inv",
    capMkt: 0.085, gMkt: 0.045, rendTer: 0.130,
    /* Prima adicional del proyecto: se suma a la tasa base. */
    pMaq: 0.00, pInm: 0.00, pAuto: 0.00, pTer: 0.00,
    perfil: "",
  },
  maq: {
    precio: 1200000, fletes: 40000, instal: 90000, capac: 20000,
    venta: 0, libros: 0, ve: 8, vf: 10,
    ing1: 900000, gIng: 0.05, aho1: 120000, cos1: 480000, gCos: 0.045,
    /* Referencia de la operación actual: sólo pone en escala los ingresos,
       ahorros y costos incrementales. No entra en ningún cálculo. */
    baseIng: 12000000, baseCos: 3000000,
    pctCT: 0.15, mto1: 35000, rv: 180000,
    /* Crédito refaccionario: el banco financia el equipo, no el capital de trabajo */
    ltvM: 0.60, tcM: 0.155, plazoM: 5, dscrMin: 1.25, ltvTope: 0.80,
  },
  inm: {
    precio: 3500000, pctAdq: 0.06, remod: 120000,
    ltv: 0.50, th: 0.115, plazo: 15, dscrMin: 1.25, ltvTope: 0.80,
    rentaMes: 37500, gRenta: 0.05, vac: 0.08, predial: 9000, seguro: 7000,
    pctMan: 0.05, pctAdm: 0.06, pctConstr: 0.70, tasaDep: 0.05,
    hor: 10, capSal: 0.080, pctCV: 0.06,
  },
  ter: {
    precio: 1800000, pctAdq: 0.06, bardeo: 90000,
    predial: 14000, vigilancia: 30000, rentaTemp: 0,
    plus: 0.11, hor: 7, pctCV: 0.07,
  },
  auto: {
    precio: 620000, anios: 5, rv: 285000,
    seguro: 24000, tenencia: 8000, mto1: 16000, gMto: 0.08, combustible: 0,
    pctEng: 0.20, tc: 0.155, plazoC: 4,
    rentaMes: 15500, deposito: 30000, gRentaA: 0.05, incluidos: 1,
    ded: 0.80, vfisc: 4,
  },
  esc: {
    p1: 0.25, p2: 0.50, p3: 0.25,
    ing1: [650000, 900000, 1100000], gIng: [0.00, 0.05, 0.08],
    cos1: [560000, 480000, 430000], precio: [1350000, 1200000, 1150000],
    rv: [90000, 180000, 240000], ve: [6, 8, 9],
  },
};

export const seedActivos = () => JSON.parse(JSON.stringify(DEF_ACTIVOS));

/* ---------- persistencia local ---------- */
const KEY = "p120-inversion-activo-v1";
export function cargarActivos() {
  const base = seedActivos();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); for (const k in DEF_ACTIVOS) if (o[k]) base[k] = Object.assign({}, DEF_ACTIVOS[k], o[k]); }
  } catch (e) { /* si el navegador no deja leer, se queda el ejemplo */ }
  return base;
}
export function guardarActivos(A) { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) { /* sin persistencia */ } }

/* ============================================================
   SUPUESTOS: costo de capital y tasa exigida a cada activo
   ============================================================ */

/* Primas adicionales del proyecto: lo que se le suma a la tasa base.
   Los porcentajes enseñan el criterio, no son la verdad: se pueden mover.
   Sobre una tasa base de 14% reproducen 12 / 14 / 15 / 18 / 22 por ciento. */
export const PRIMAS = [
  { k: "reemplazo", label: "Reemplazo de algo que ya opera", riesgo: "Bajo", p: -0.020,
    ej: "Cambias una máquina por otra parecida. Ya conoces el flujo porque lleva años pasando." },
  { k: "capacidad", label: "Ampliar capacidad de lo que ya haces", riesgo: "Medio", p: 0.000,
    ej: "Más de lo mismo, pero la demanda extra todavía está por confirmarse." },
  { k: "nuevouso", label: "Uso productivo nuevo pero definido", riesgo: "Medio-alto", p: 0.010,
    ej: "Un terreno con destino ya decidido, o una línea nueva de un producto que dominas." },
  { k: "especula", label: "Sin flujo, apostando a la plusvalía", riesgo: "Alto", p: 0.040,
    ej: "Sólo se carga con predial y vigilancia, y se espera que suba de precio." },
  { k: "nuevo", label: "Negocio nuevo o tecnología sin probar", riesgo: "Muy alto", p: 0.080,
    ej: "No tienes historia propia con qué compararlo." },
];

/* Qué escalón corresponde a una prima ya capturada; null si la movieron a mano */
export const primaDe = (p) => {
  const b = PRIMAS.find((x) => Math.abs(x.p - p) < 1e-9);
  return b ? b.k : null;
};

export function calcSup(A) {
  const s = A.sup;
  const kdt = s.kd * (1 - s.isr);
  const we = 1 - s.wd;
  /* Costo del capital propio sin beta: o el atajo sobre la deuda de la propia
     empresa, o un build-up de primas. Ambos llegan al mismo vecindario. */
  const ke = s.metodo === "buildup" ? s.rf + s.prm + s.ptam + s.pneg : s.kd + s.primaEq;
  const waccCalc = ke * we + kdt * s.wd;
  /* Tasa base de la empresa: el hurdle rate. Se fija una vez al año, no por proyecto. */
  const base = s.metodo === "directo" ? s.baseDirecta : waccCalc;
  /* Cuando el activo es inversión y no herramienta, la tasa la pone el mercado:
     el inmueble en renta por Gordon (r = cap rate + crecimiento) y el terreno
     por el rendimiento anual de comparables. */
  const tInmMkt = s.capMkt + s.gMkt;
  const tTerMkt = s.rendTer;
  const opInm = s.usoInm === "op", opTer = s.usoTer === "op";
  return {
    isr: s.isr, inf: s.inf, ke, kdt, we, kd: s.kd,
    base, wacc: base, waccCalc, tInmMkt, tTerMkt, opInm, opTer,
    tasas: {
      maq: base + s.pMaq,
      auto: base + s.pAuto,
      inm: (opInm ? base : tInmMkt) + s.pInm,
      ter: (opTer ? base : tTerMkt) + s.pTer,
    },
  };
}

/* ============================================================
   MAQUINARIA: flujo incremental, ampliación o reemplazo
   ============================================================ */
export function calcMaq(A, sup, ov) {
  ov = ov || {};
  const m = Object.assign({}, A.maq, ov);
  const isr = sup.isr, inf = sup.inf, td = ov.td != null ? ov.td : sup.tasas.maq;
  const base = m.precio + m.fletes + m.instal + m.capac;
  const ct0 = m.pctCT * m.ing1;
  const efec = -(m.venta - m.libros) * isr;
  const inv0 = -(base + ct0) + m.venta + efec;
  const depA = m.vf ? base / m.vf : 0;
  const vl = Math.max(0, base - depA * Math.min(m.ve, m.vf));
  /* Crédito refaccionario. Se presta contra el equipo, no contra el capital
     de trabajo, así que el LTV se aplica sobre la base, no sobre la inversión. */
  const monto = base * m.ltvM;
  const capProp = Math.max(0, -inv0 - monto);
  const pago = monto > 0 ? pmt(m.tcM, m.plazoM, monto) : 0;
  const Y = []; let prevIng = 0, acum = 0, prevSaldo = monto;
  for (let t = 0; t <= 10; t++) {
    const on = t >= 1 && t <= m.ve;
    const ing = on ? m.ing1 * Math.pow(1 + m.gIng, t - 1) : 0;
    const aho = on ? m.aho1 * Math.pow(1 + inf, t - 1) : 0;
    const cos = on ? -m.cos1 * Math.pow(1 + m.gCos, t - 1) : 0;
    const ebitda = ing + aho + cos;
    const dep = t >= 1 && t <= Math.min(m.ve, m.vf) ? -depA : 0;
    const ebit = ebitda + dep;
    const imp = -ebit * isr;
    const nopat = ebit + imp;
    const addDep = -dep;
    const dct = t <= 1 ? 0 : -(m.pctCT * (ing - prevIng));
    const capex = on ? -m.mto1 * Math.pow(1 + inf, t - 1) : 0;
    const fcfOp = nopat + addDep + dct + capex;
    const invR = t === 0 ? inv0 : 0;
    const resc = t === m.ve ? m.rv - isr * (m.rv - vl) : 0;
    const recCT = t === m.ve ? m.pctCT * ing : 0;
    const total = t === 0 ? inv0 : fcfOp + invR + resc + recCT;
    const fac = 1 / Math.pow(1 + td, t);
    const desc = total * fac; acum += desc;
    /* Rama apalancada: mismo proyecto, pero el banco pone una parte. El interés
       es deducible, así que agrega escudo fiscal sobre el flujo sin deuda. */
    let saldo;
    if (t === 0) saldo = monto;
    else if (t > Math.min(m.plazoM, m.ve)) saldo = 0;
    else saldo = saldoRest(m.tcM, t, pago, monto);
    const intr = on ? -(prevSaldo * m.tcM) : 0;
    const amo = on ? -(prevSaldo - saldo) : 0;
    const escI = -intr * isr;
    const liq = t === m.ve ? -saldo : 0;
    const fl = t === 0 ? inv0 + monto : total + intr + amo + escI + liq;
    Y.push({ t, ing, aho, cos, ebitda, dep, ebit, imp, nopat, addDep, dct, capex, fcfOp, invR, resc, recCT, total, fac, desc, acum,
      saldo, intr, amo, escI, liq, fl, dl: fl / Math.pow(1 + sup.ke, t) });
    prevIng = ing;
    prevSaldo = saldo;
  }
  const cf = Y.map((y) => y.total);
  const vpn = Y.reduce((s, y) => s + y.desc, 0);
  const vpnL = Y.reduce((s, y) => s + y.dl, 0);
  const tir = irr(cf);
  /* Hasta dónde te presta el banco: el EBITDA del año 1 es lo que puede pagar
     el servicio de la deuda, así que el tope sale en forma cerrada igual que
     en el inmueble, sólo que la prueba se hace contra EBITDA y no contra NOI. */
  const ebitda1 = Y[1] ? Y[1].ebitda : 0;
  const dscr = pago > 0 ? ebitda1 / pago : null;
  const pagoMax = m.dscrMin > 0 ? ebitda1 / m.dscrMin : 0;
  const montoMax = pagoMax <= 0 ? 0
    : m.tcM === 0 ? pagoMax * m.plazoM
      : (pagoMax * (1 - Math.pow(1 + m.tcM, -m.plazoM))) / m.tcM;
  const ltvDscr = base > 0 ? Math.max(0, montoMax / base) : null;
  const ltvMax = ok(ltvDscr) ? Math.min(ltvDscr, m.ltvTope) : m.ltvTope;
  const limita = ok(ltvDscr) && ltvDscr < m.ltvTope ? "dscr" : "garantia";
  const propioMin = ok(ltvMax) ? Math.max(0, -inv0 - base * Math.min(ltvMax, 1)) : null;
  /* El crédito suma sólo si el equipo rinde más de lo que cobra el banco */
  const apalancaSuma = ok(tir) && tir > m.tcM;
  return {
    m, td, base, ct0, inv0, depA, vl, Y, vpn, vpnL,
    monto, capProp, pago, dscr, ltvMax, ltvDscr, limita, montoMax, propioMin, apalancaSuma,
    tir, tirL: irr(Y.map((y) => y.fl)), tirm: mirr(cf, sup.kd, td),
    vaeV: vae(vpn, td, m.ve),
    ir: inv0 < 0 ? Y.slice(1).reduce((s, y) => s + y.desc, 0) / -inv0 : null,
    pb: paybackDesc(Y.map((y) => y.acum)),
  };
}

/* ============================================================
   INMUEBLE EN RENTA: NOI, salida a cap rate, con y sin hipoteca
   ============================================================ */
export function calcInm(A, sup, ov) {
  ov = ov || {};
  const i = Object.assign({}, A.inm, ov);
  const isr = sup.isr, inf = sup.inf;
  const td = ov.td != null ? ov.td : sup.tasas.inm;
  const gAdq = i.precio * i.pctAdq;
  const invTot = i.precio + gAdq + i.remod;
  const monto = i.precio * i.ltv;
  const capProp = invTot - monto;
  /* Tasa del capital propio. Si el inmueble es herramienta de la operación es el
     Ke de la empresa. Si es inversión, se reapalanca desde la tasa del propio
     mercado inmobiliario: el accionista carga con el diferencial entre lo que
     rinde el ladrillo y lo que cuesta la hipoteca, amplificado por su D/E. */
  const de = capProp > 0 ? monto / capProp : 0;
  const ke = sup.opInm ? sup.ke : td + (td - i.th) * de;
  const pago = monto > 0 ? pmt(i.th, i.plazo, monto) : 0;
  const depA = i.precio * i.pctConstr * i.tasaDep;
  const rentaAnual = i.rentaMes * 12;
  const Y = []; let prevSaldo = monto;
  for (let t = 0; t <= 10; t++) {
    const on = t >= 1 && t <= i.hor;
    const rb = on ? rentaAnual * Math.pow(1 + i.gRenta, t - 1) : 0;
    const vac = -rb * i.vac;
    const rEf = rb + vac;
    const pre = on ? -i.predial * Math.pow(1 + inf, t - 1) : 0;
    const seg = on ? -i.seguro * Math.pow(1 + inf, t - 1) : 0;
    const man = -rEf * i.pctMan;
    const adm = -rEf * i.pctAdm;
    const noi = rEf + pre + seg + man + adm;
    let saldo;
    if (t === 0) saldo = monto;
    else if (t > Math.min(i.plazo, i.hor)) saldo = 0;
    else saldo = saldoRest(i.th, t, pago, monto);
    const dep = on ? -depA : 0;
    const intr = on ? -(prevSaldo * i.th) : 0;
    const amo = on ? -(prevSaldo - saldo) : 0;
    const isr0 = -Math.max(0, noi + dep) * isr;
    const isr1 = -Math.max(0, noi + dep + intr) * isr;
    const vs = t === i.hor ? (noi * (1 + i.gRenta)) / i.capSal : 0;
    const cv = -vs * i.pctCV;
    const libros = invTot - depA * i.hor;
    const iga = t === i.hor ? -Math.max(0, vs + cv - libros) * isr : 0;
    const liq = t === i.hor ? -saldo : 0;
    const fu = t === 0 ? -invTot : noi + isr0 + vs + cv + iga;
    const fl = t === 0 ? -capProp : noi + intr + amo + isr1 + vs + cv + iga + liq;
    Y.push({ t, rb, vac, rEf, pre, seg, man, adm, noi, saldo, dep, intr, amo, isr0, isr1, vs, cv, iga, liq, fu, fl,
      du: fu / Math.pow(1 + td, t), dl: fl / Math.pow(1 + ke, t) });
    prevSaldo = saldo;
  }
  let ac = 0; Y.forEach((y) => { ac += y.du; y.acum = ac; });
  const vpnU = Y.reduce((s, y) => s + y.du, 0);
  const vpnL = Y.reduce((s, y) => s + y.dl, 0);
  /* Hasta dónde te presta el banco. El NOI no depende del crédito, así que el
     tope sale en forma cerrada: el pago máximo que pasa la prueba de DSCR, y
     de ahí para atrás el monto que ese pago amortiza en el plazo. */
  const noi1 = Y[1] ? Y[1].noi : 0;
  const pagoMax = i.dscrMin > 0 ? noi1 / i.dscrMin : 0;
  const montoMax = pagoMax <= 0 ? 0
    : i.th === 0 ? pagoMax * i.plazo
      : (pagoMax * (1 - Math.pow(1 + i.th, -i.plazo))) / i.th;
  /* Dos restricciones distintas, y manda la que pegue primero: el flujo tiene
     que pagar el servicio (DSCR) y la garantía tiene que cubrir el saldo. */
  const ltvDscr = i.precio > 0 ? Math.max(0, montoMax / i.precio) : null;
  const ltvMax = ok(ltvDscr) ? Math.min(ltvDscr, i.ltvTope) : i.ltvTope;
  const limita = ok(ltvDscr) && ltvDscr < i.ltvTope ? "dscr" : "garantia";
  /* Con este crédito no te alcanza para menos de esto de tu bolsa */
  const propioMin = ok(ltvMax) ? Math.max(0, invTot - i.precio * Math.min(ltvMax, 1)) : null;
  /* El apalancamiento suma sólo si el ladrillo rinde de verdad más de lo que
     cuesta la hipoteca. La prueba va contra el rendimiento real (la TIR sin
     deuda), no contra la tasa que le exiges: exigirle mucho a un inmueble no
     hace que pague la hipoteca. */
  const tirU = irr(Y.map((y) => y.fu));
  const apalancaSuma = ok(tirU) && tirU > i.th;

  return {
    i, td, ke, invTot, monto, capProp, pago, depA, rentaAnual, Y,
    ltvMax, ltvDscr, limita, montoMax, propioMin, apalancaSuma, de,
    vpn: vpnU, vpnL, tir: tirU, tirL: irr(Y.map((y) => y.fl)),
    capEnt: invTot ? Y[1].noi / invTot : null,
    coc: capProp ? Y[1].fl / capProp : null,
    dscr: pago ? Y[1].noi / pago : null,
    vaeV: vae(vpnU, td, i.hor),
    pctSalida: (function () {
      const s = Y.slice(1).reduce((a, y) => a + y.du, 0);
      const term = Y[i.hor] ? (Y[i.hor].vs + Y[i.hor].cv + Y[i.hor].iga) / Math.pow(1 + td, i.hor) : 0;
      return s ? term / s : null;
    })(),
  };
}

/* ============================================================
   TERRENO: no genera flujo, sólo cuesta cargarlo
   ============================================================ */
export function calcTer(A, sup, ov) {
  ov = ov || {};
  const g = Object.assign({}, A.ter, ov);
  const isr = sup.isr, inf = sup.inf;
  const td = ov.td != null ? ov.td : sup.tasas.ter;
  const gAdq = g.precio * g.pctAdq;
  const invTot = g.precio + gAdq + g.bardeo;
  const Y = []; let ac = 0, pvCarga = 0;
  for (let t = 0; t <= 10; t++) {
    const on = t >= 1 && t <= g.hor;
    const valEst = t <= g.hor ? g.precio * Math.pow(1 + g.plus, t) : 0;
    const carga = on ? -(g.predial + g.vigilancia) * Math.pow(1 + inf, t - 1) : 0;
    const ingT = on ? g.rentaTemp * Math.pow(1 + inf, t - 1) : 0;
    const impT = -Math.max(0, ingT + carga) * isr;
    const venta = t === g.hor ? valEst : 0;
    const cv = -venta * g.pctCV;
    const iga = t === g.hor ? -Math.max(0, venta + cv - invTot) * isr : 0;
    const total = t === 0 ? -invTot : carga + ingT + impT + venta + cv + iga;
    const desc = total / Math.pow(1 + td, t); ac += desc;
    if (t >= 1) pvCarga += carga / Math.pow(1 + td, t);
    Y.push({ t, valEst, carga, ingT, impT, venta, cv, iga, total, desc, acum: ac });
  }
  const vpn = Y.reduce((s, y) => s + y.desc, 0);
  /* plusvalía que deja el VPN en cero; _ns evita recursión infinita */
  const plusEq = ov._ns ? null : solve((x) => calcTer(A, sup, Object.assign({}, ov, { plus: x, _ns: true })).vpn, -0.5, 2.0);
  return {
    g, td, invTot, Y, vpn, tir: irr(Y.map((y) => y.total)),
    vaeV: vae(vpn, td, g.hor), pvCarga,
    mult: invTot ? (Y[g.hor] ? Y[g.hor].venta / invTot : null) : null,
    plusEq,
  };
}

/* ============================================================
   VEHÍCULO: contado contra crédito contra arrendamiento
   ============================================================ */
export function calcAuto(A, sup, ov) {
  ov = ov || {};
  const a = Object.assign({}, A.auto, ov);
  const isr = sup.isr, inf = sup.inf;
  const td = ov.td != null ? ov.td : sup.tasas.auto;
  const eng = a.precio * a.pctEng;
  const fin = a.precio - eng;
  const pagoC = fin > 0 ? pmt(a.tc, a.plazoC, fin) : 0;
  const depA = a.vfisc ? a.precio / a.vfisc : 0;
  const rentaAnual = a.rentaMes * 12;
  const Y = []; let prevSaldo = fin;
  for (let t = 0; t <= 10; t++) {
    const on = t >= 1 && t <= a.anios;
    const comun = on ? -((a.seguro + a.tenencia + a.combustible) * Math.pow(1 + inf, t - 1) + a.mto1 * Math.pow(1 + a.gMto, t - 1)) : 0;
    const escC = -comun * isr * a.ded;
    const escD = t >= 1 && t <= Math.min(a.vfisc, a.anios) ? depA * isr * a.ded : 0;
    const libros = Math.max(0, a.precio - depA * Math.min(a.anios, a.vfisc));
    const rev = t === a.anios ? a.rv - isr * (a.rv - libros) : 0;
    let saldo;
    if (t === 0) saldo = fin;
    else if (t > Math.min(a.plazoC, a.anios)) saldo = 0;
    else saldo = saldoRest(a.tc, t, pagoC, fin);
    const pagoT = t >= 1 && t <= Math.min(a.plazoC, a.anios) ? -pagoC : 0;
    const escI = on ? prevSaldo * a.tc * isr * a.ded : 0;
    const liq = t === a.anios ? -saldo : 0;
    const renta = on ? -rentaAnual * Math.pow(1 + a.gRentaA, t - 1) : 0;
    const escR = -renta * isr * a.ded;
    const comC = comun * (1 - a.incluidos);
    const escCC = -comC * isr * a.ded;
    const dev = t === a.anios ? a.deposito : 0;
    const optA = t === 0 ? -a.precio : comun + escC + escD + rev;
    const optB = t === 0 ? -eng : comun + escC + escD + rev + pagoT + escI + liq;
    const optC = t === 0 ? -a.deposito : renta + escR + comC + escCC + dev;
    Y.push({ t, comun, escC, escD, rev, saldo, pagoT, escI, liq, renta, escR, comC, escCC, dev,
      A: optA, B: optB, C: optC,
      dA: optA / Math.pow(1 + td, t), dB: optB / Math.pow(1 + td, t), dC: optC / Math.pow(1 + td, t) });
    prevSaldo = saldo;
  }
  const vpA = Y.reduce((s, y) => s + y.dA, 0), vpB = Y.reduce((s, y) => s + y.dB, 0), vpC = Y.reduce((s, y) => s + y.dC, 0);
  const arr = [{ n: "A · Contado", v: vpA }, { n: "B · Crédito", v: vpB }, { n: "C · Arrendamiento", v: vpC }].sort((x, y) => y.v - x.v);
  return {
    a, td, eng, fin, pagoC, depA, rentaAnual, Y,
    vpA, vpB, vpC,
    caeA: vae(vpA, td, a.anios), caeB: vae(vpB, td, a.anios), caeC: vae(vpC, td, a.anios),
    ganador: arr[0].n, ahorro: arr[0].v - arr[1].v, orden: arr,
  };
}

/* ============================================================
   Corrida completa
   ============================================================ */
export function computeActivos(A) {
  const sup = calcSup(A);
  return { sup, maq: calcMaq(A, sup, {}), inm: calcInm(A, sup, {}), ter: calcTer(A, sup, {}), auto: calcAuto(A, sup, {}) };
}
