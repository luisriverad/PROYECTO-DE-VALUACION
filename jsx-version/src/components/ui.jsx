/* Componentes base de la interfaz */
import React, { useState } from "react";
import { C } from "../lib/theme";
import { nfmt } from "../lib/format";

/* ============================================================
   COMPONENTES BASE
   ============================================================ */
export const Card = ({ title, sub, right, children, pad = true }) => (
  <div style={{ background: C.white, border: `1px solid ${C.line}` }} className="rounded-lg mb-4">
    {(title || right) && (
      <div className="flex items-start justify-between gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div>
          <div className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: C.ink }}>{title}</div>
          {sub && <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{sub}</div>}
        </div>
        <div className="shrink-0">{right}</div>
      </div>
    )}
    <div className={pad ? "p-4" : ""}>{children}</div>
  </div>
);

export const Btn = ({ children, onClick, kind = "ghost", small, disabled, title }) => {
  const st =
    kind === "primary" ? { background: C.accent, color: C.white, border: `1px solid ${C.accent}` }
      : kind === "dark" ? { background: C.ink, color: C.white, border: `1px solid ${C.ink}` }
        : kind === "danger" ? { background: "transparent", color: C.neg, border: `1px solid ${C.line}` }
          : { background: C.white, color: C.ink, border: `1px solid ${C.line}` };
  return (
    <button title={title} disabled={disabled} onClick={onClick} style={{ ...st, opacity: disabled ? 0.5 : 1 }}
      className={`${small ? "text-[11px] px-2 py-1" : "text-[12px] px-3 py-1.5"} rounded font-medium transition-opacity hover:opacity-80`}>
      {children}
    </button>
  );
};

export function Field({ label, hint, children, w }) {
  return (
    <label className="block" style={{ width: w }}>
      <div className="text-[11px] mb-1 font-medium" style={{ color: C.muted }}>{label}</div>
      {children}
      {hint && <div className="text-[10px] mt-1" style={{ color: C.muted }}>{hint}</div>}
    </label>
  );
}

export const inputCls = "w-full px-2 py-1.5 rounded text-[13px] outline-none";
export const inputSt = { background: C.white, border: `1px solid ${C.line}`, color: C.ink };

export function NumIn({ value, onChange, dec = 2, suffix, align = "right", disabled, plain }) {
  const [txt, setTxt] = useState(null);
  const shown = txt !== null ? txt : value === null || value === undefined || !isFinite(value) ? ""
    : plain ? String(Math.round(value)) : nfmt(dec).format(value);
  return (
    <div className="relative">
      <input
        disabled={disabled}
        className={inputCls} style={{ ...inputSt, textAlign: align, fontVariantNumeric: "tabular-nums", paddingRight: suffix ? 22 : 8 }}
        value={shown}
        onFocus={() => setTxt(value === null || value === undefined ? "" : String(value))}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={() => { const v = parseFloat(String(txt).replace(/[^0-9.\-]/g, "")); onChange(isFinite(v) ? v : 0); setTxt(null); }}
      />
      {suffix && <span className="absolute right-2 top-1.5 text-[11px]" style={{ color: C.muted }}>{suffix}</span>}
    </div>
  );
}
export function PctIn({ value, onChange, dec = 2 }) {
  return <NumIn value={value * 100} dec={dec} suffix="%" onChange={(v) => onChange(v / 100)} />;
}
export function TxtIn({ value, onChange, placeholder }) {
  return <input className={inputCls} style={inputSt} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export const Th = ({ children, align = "right", w }) => (
  <th style={{ color: C.muted, borderBottom: `1px solid ${C.line}`, width: w }}
    className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-2 text-${align} whitespace-nowrap`}>{children}</th>
);
export const Td = ({ children, align = "right", bold, color, bg, colSpan }) => (
  <td colSpan={colSpan} style={{ borderBottom: `1px solid ${C.soft}`, fontVariantNumeric: "tabular-nums", color: color || C.ink, background: bg }}
    className={`px-2 py-1.5 text-[12px] text-${align} ${bold ? "font-semibold" : ""} whitespace-nowrap`}>{children}</td>
);

export const KPI = ({ label, value, sub, tone }) => (
  <div className="rounded-lg px-3 py-3" style={{ background: C.white, border: `1px solid ${C.line}` }}>
    <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: C.muted }}>{label}</div>
    <div className="text-[20px] font-semibold mt-1" style={{ color: tone === "pos" ? C.pos : tone === "neg" ? C.neg : C.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    {sub && <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{sub}</div>}
  </div>
);

export const Empty = ({ texto }) => (
  <div className="text-[12.5px] py-6 text-center rounded" style={{ color: C.muted, background: C.soft }}>{texto}</div>
);
