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
    isr: 0.30, inf: 0.045, rf: 0.095, prm: 0.065, beta: 1.10, ptam: 0.020,
    kd: 0.145, wd: 0.30,
    pMaq: 0.00, pInm: -0.050, pAuto: 0.00, pTer: 0.030,
    perfil: "",
  },
  maq: {
    precio: 1200000, fletes: 40000, instal: 90000, capac: 20000,
    venta: 0, libros: 0, ve: 8, vf: 10,
    ing1: 900000, gIng: 0.05, aho1: 120000, cos1: 480000, gCos: 0.045,
    pctCT: 0.15, mto1: 35000, rv: 180000,
  },
  inm: {
    precio: 3500000, pctAdq: 0.06, remod: 120000,
    ltv: 0.50, th: 0.115, plazo: 15,
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
    rv: [90000, 180000, 240000], ve: [6, 8, 9], td: [0.19, 0.161, 0.145],
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
export function calcSup(A) {
  const s = A.sup;
  const ke = s.rf + s.beta * s.prm + s.ptam;
  const kdt = s.kd * (1 - s.isr);
  const we = 1 - s.wd;
  const wacc = ke * we + kdt * s.wd;
  return {
    isr: s.isr, inf: s.inf, ke, kdt, we, wacc, kd: s.kd,
    tasas: {
      maq: wacc + s.pMaq, inm: wacc + s.pInm, auto: kdt + s.pAuto,
      ter: wacc + s.pTer,
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
  const Y = []; let prevIng = 0, acum = 0;
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
    Y.push({ t, ing, aho, cos, ebitda, dep, ebit, imp, nopat, addDep, dct, capex, fcfOp, invR, resc, recCT, total, fac, desc, acum });
    prevIng = ing;
  }
  const cf = Y.map((y) => y.total);
  const vpn = Y.reduce((s, y) => s + y.desc, 0);
  return {
    m, td, base, ct0, inv0, depA, vl, Y, vpn,
    tir: irr(cf), tirm: mirr(cf, sup.kd, td),
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
  const ke = sup.ke;
  const gAdq = i.precio * i.pctAdq;
  const invTot = i.precio + gAdq + i.remod;
  const monto = i.precio * i.ltv;
  const capProp = invTot - monto;
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
  return {
    i, td, ke, invTot, monto, capProp, pago, depA, rentaAnual, Y,
    vpn: vpnU, vpnL, tir: irr(Y.map((y) => y.fu)), tirL: irr(Y.map((y) => y.fl)),
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
