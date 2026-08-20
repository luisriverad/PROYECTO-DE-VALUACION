/* Utilidades de formato y matemáticas financieras */

export const uid = () => Math.random().toString(36).slice(2, 9);
export const nfmt = (d) => new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const money = (v, d = 0) => (v === null || v === undefined || !isFinite(v) ? "—" : (v < 0 ? "-" : "") + "$" + nfmt(d).format(Math.abs(v)));
export const num = (v, d = 2) => (v === null || v === undefined || !isFinite(v) ? "—" : nfmt(d).format(v));
export const pct = (v, d = 1) => (v === null || v === undefined || !isFinite(v) ? "—" : nfmt(d).format(v * 100) + "%");
export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const npv = (rate, flows) => flows.reduce((a, f, i) => a + f / Math.pow(1 + rate, i), 0);
export function irr(flows) {
  if (!flows.length) return NaN;
  const hasPos = flows.some((f) => f > 0), hasNeg = flows.some((f) => f < 0);
  if (!hasPos || !hasNeg) return NaN;
  let lo = -0.9999, hi = 10, fLo = npv(lo, flows), fHi = npv(hi, flows);
  if (fLo * fHi > 0) return NaN;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2, fMid = npv(mid, flows);
    if (Math.abs(fMid) < 1e-7) return mid;
    if (fLo * fMid < 0) { hi = mid; fHi = fMid; } else { lo = mid; fLo = fMid; }
  }
  return (lo + hi) / 2;
}
