/* Componentes base de la interfaz */
import React, { useState } from "react";
import { C } from "../lib/theme";
import { nfmt } from "../lib/format";
import { cargarConfig, guardarConfig, borrarConfig, detectaProveedor, PROVEEDORES, LISTA } from "../lib/ia";

/* ============================================================
   COMPONENTES BASE
   ============================================================ */
export const Card = ({ title, sub, right, children, pad = true }: any) => (
  <div style={{ background: C.white, border: `1px solid ${C.line}` }} className="rounded-lg mb-4">
    {(title || right) && (
      <div className="flex items-start justify-between gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: C.ink }}>{title}</div>
          {sub && <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{sub}</div>}
        </div>
        <div className="shrink-0">{right}</div>
      </div>
    )}
    <div className={pad ? "p-4" : ""}>{children}</div>
  </div>
);

export const Btn = ({ children, onClick, kind = "ghost", small, disabled, title }: any) => {
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

/* ---------- llave de la IA, que cada quien carga en su navegador ----------
   Acepta llaves de cualquier proveedor, porque no todos tienen cuenta de
   Anthropic. Se dice de frente cuál funciona mejor y por qué. */
export function LlaveIA({ alineado = "der" }: any) {
  const [abierto, setAbierto] = useState(false);
  const [c, setC] = useState(() => cargarConfig());
  const [tiene, setTiene] = useState(() => !!cargarConfig().llave);
  const P = PROVEEDORES[c.prov] || PROVEEDORES.anthropic;

  const abrir = () => { setC(cargarConfig()); setAbierto(!abierto); };
  const set = (k, v) => setC((x) => Object.assign({}, x, { [k]: v }));
  /* al pegar la llave se adivina el proveedor por el prefijo, para no preguntar */
  const pegar = (v) => {
    const p = detectaProveedor(v);
    setC((x) => Object.assign({}, x, { llave: v }, p ? { prov: p } : {}));
  };
  const guardar = () => { guardarConfig(c); setTiene(!!(c.llave || "").trim()); setAbierto(false); };
  const quitar = () => { borrarConfig(); setC(cargarConfig()); setTiene(false); setAbierto(false); };

  return (
    <span className="relative inline-block">
      <Btn small kind={tiene ? "ghost" : "dark"} onClick={abrir}
        title={tiene ? `Llave de ${P.nombre} cargada en este navegador` : "Pega tu API key para usar la IA"}>
        {tiene ? "API key cargada ✓" : "Cargar API key"}
      </Btn>
      {abierto && (
        <div className="absolute mt-1 rounded-lg p-3 text-left"
          style={{ [alineado === "der" ? "right" : "left"]: 0, top: "100%", width: 370, zIndex: 30,
            background: C.white, border: `1px solid ${C.line}`, boxShadow: "0 8px 28px rgba(0,0,0,.14)" }}>

          <div className="text-[11px] mb-2 leading-relaxed" style={{ color: C.muted }}>
            Sirve la llave de cualquier proveedor. Se guarda únicamente en este navegador: no viaja al
            servidor ni la ve nadie más que abra la liga.
          </div>

          <div className="rounded px-2.5 py-2 mb-2.5" style={{ background: C.accentSoft, border: `1px solid ${C.accent}` }}>
            <div className="text-[11px] leading-relaxed" style={{ color: C.ink }}>
              <b>El modelo funciona mejor con API key de Anthropic.</b> Es el único que busca los datos de
              mercado en internet al momento; con los demás el modelo contesta de memoria y te lo advierte
              en la nota.
            </div>
          </div>

          <div className="text-[11px] mb-1 font-medium" style={{ color: C.muted }}>Proveedor</div>
          <select className={inputCls} style={{ ...inputSt, cursor: "pointer" }} value={c.prov}
            onChange={(e) => set("prov", e.target.value)}>
            {LISTA.map((k) => (
              <option key={k} value={k}>{PROVEEDORES[k].nombre}{PROVEEDORES[k].recomendado ? " — recomendado" : ""}</option>
            ))}
          </select>

          <div className="text-[11px] mb-1 mt-2 font-medium" style={{ color: C.muted }}>API key</div>
          <input type="password" className={inputCls} style={inputSt} value={c.llave}
            placeholder={P.prefijo ? P.prefijo + "…" : "tu llave"} autoComplete="off"
            onChange={(e) => pegar(e.target.value)} />
          <div className="text-[10px] mt-1" style={{ color: C.muted }}>{P.ayudaLlave}</div>

          {P.pideUrl && (
            <>
              <div className="text-[11px] mb-1 mt-2 font-medium" style={{ color: C.muted }}>Dirección del servicio</div>
              <input className={inputCls} style={inputSt} value={c.url}
                placeholder="https://openrouter.ai/api/v1/chat/completions"
                onChange={(e) => set("url", e.target.value)} />
              <div className="text-[10px] mt-1" style={{ color: C.muted }}>La URL completa del endpoint, con /chat/completions al final.</div>
            </>
          )}

          <div className="text-[11px] mb-1 mt-2 font-medium" style={{ color: C.muted }}>Modelo</div>
          <input className={inputCls} style={inputSt} value={c.modelo}
            placeholder={P.modelo || "nombre del modelo"}
            onChange={(e) => set("modelo", e.target.value)} />
          <div className="text-[10px] mt-1" style={{ color: C.muted }}>
            {P.modelo ? `Déjalo vacío para usar ${P.modelo}. Cámbialo si tu cuenta tiene otro.` : "Escribe el nombre exacto del modelo de tu servicio."}
          </div>

          <div className="flex gap-2 mt-3">
            <Btn small kind="primary" onClick={guardar}>Guardar</Btn>
            {tiene && <Btn small kind="danger" onClick={quitar}>Quitar</Btn>}
            <Btn small onClick={() => setAbierto(false)}>Cerrar</Btn>
          </div>

          {P.consola && (
            <a href={P.consola} target="_blank" rel="noreferrer"
              className="text-[11px] mt-2 inline-block" style={{ color: C.azul }}>
              Consigue una llave de {P.nombre}
            </a>
          )}
        </div>
      )}
    </span>
  );
}

export function Field({ label, hint, children, w }: any) {
  return (
    <label className="block" style={{ width: w }}>
      <div className="text-[11px] mb-1 font-medium" style={{ color: C.muted }}>{label}</div>
      {children}
      {hint && <div className="text-[10px] mt-1" style={{ color: C.muted }}>{hint}</div>}
    </label>
  );
}

export const inputCls = "w-full px-2 py-1.5 rounded text-[13px] outline-none";
/* Convención de modelo financiero: lo que se captura a mano va en azul,
   lo que sale de una fórmula o se jala de otra pestaña va en negro. */
export const inputSt = { background: C.white, border: `1px solid ${C.line}`, color: C.azul };

export function NumIn({ value, onChange, dec = 2, suffix, align = "right", disabled, plain }: any) {
  const [txt, setTxt] = useState(null);
  const shown = txt !== null ? txt : value === null || value === undefined || !isFinite(value) ? ""
    : plain ? String(Math.round(value)) : nfmt(dec).format(value);
  return (
    <div className="relative">
      <input
        disabled={disabled}
        className={inputCls} style={{ ...inputSt, textAlign: align as any, fontVariantNumeric: "tabular-nums", paddingRight: suffix ? 22 : 8 }}
        value={shown}
        onFocus={() => setTxt(value === null || value === undefined ? "" : String(value))}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={() => { const v = parseFloat(String(txt).replace(/[^0-9.\-]/g, "")); onChange(isFinite(v) ? v : 0); setTxt(null); }}
      />
      {suffix && <span className="absolute right-2 top-1.5 text-[11px]" style={{ color: C.muted }}>{suffix}</span>}
    </div>
  );
}
export function PctIn({ value, onChange, dec = 2 }: any) {
  return <NumIn value={value * 100} dec={dec} suffix="%" onChange={(v) => onChange(v / 100)} />;
}
export function TxtIn({ value, onChange, placeholder }: any) {
  return <input className={inputCls} style={inputSt} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}
export function TxtArea({ value, onChange, placeholder, rows = 4 }: any) {
  return <textarea className={inputCls} style={{ ...inputSt, resize: "vertical", lineHeight: 1.55 }} rows={rows}
    value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 0.5, tramos, color }: any) {
  const pista = tramos && tramos.length
    ? `linear-gradient(90deg, ${tramos.map((t) => `${t.color} ${t.desde}%, ${t.color} ${t.hasta}%`).join(", ")})`
    : C.line;
  return (
    <div className="relative select-none" style={{ height: 28 }}>
      <div className="absolute left-0 right-0 rounded-full" style={{ top: 11, height: 6, background: pista }} />
      <input type="range" className="p120-range absolute left-0 right-0 w-full" style={{ top: 0, height: 28, color }}
        min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export const UNIDADES = [
  { v: "m", label: "Metros (m)" },
  { v: "pza", label: "Piezas (pza)" },
  { v: "lt", label: "Litros (lt)" },
];
export function UnidadIn({ value, onChange }: any) {
  const std = UNIDADES.some((u) => u.v === value);
  const [otro, setOtro] = useState(!std);
  const modo = std && !otro ? value : "otro";
  return (
    <div className="flex items-center gap-1">
      <select
        className={inputCls} style={{ ...inputSt, cursor: "pointer" }} value={modo}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "otro") { setOtro(true); onChange(""); } else { setOtro(false); onChange(v); }
        }}>
        {UNIDADES.map((u) => <option key={u.v} value={u.v}>{u.label}</option>)}
        <option value="otro">Otro…</option>
      </select>
      {modo === "otro" && <TxtIn value={value} placeholder="ej. kg" onChange={onChange} />}
    </div>
  );
}

export const Th = ({ children, align = "right", w }: any) => (
  <th style={{ color: C.muted, borderBottom: `1px solid ${C.line}`, width: w }}
    className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-2 text-${align} whitespace-nowrap`}>{children}</th>
);
export const Td = ({ children, align = "right", bold, color, bg, colSpan }: any) => (
  <td colSpan={colSpan} style={{ borderBottom: `1px solid ${C.soft}`, fontVariantNumeric: "tabular-nums", color: color || C.ink, background: bg }}
    className={`px-2 py-1.5 text-[12px] text-${align} ${bold ? "font-semibold" : ""} whitespace-nowrap`}>{children}</td>
);

/* `destaca` pinta el KPI en el naranja de la paleta: es para el dato que hay
   que ver primero en la tarjeta, sin recurrir al verde ni al rojo, que ya
   significan otra cosa (bueno / malo). */
/* La mezcla tiene que sumar 100%. Si no, el forecast reparte de menos o de más
   y todo el costeo sale movido sin que nadie lo note: por eso el aviso dice
   cuánto falta —o cuánto sobra— y no sólo que está mal. */
export function AvisoMezcla({ productos, L }: any) {
  const lista = productos || [];
  if (!lista.length) return null;
  const total = lista.reduce((a, p) => a + (p.mix || 0), 0);
  const dif = 1 - total;
  const ok = Math.abs(dif) <= 0.0005;
  const P = (v) => nfmt(1).format(v * 100) + "%";
  return (
    <div className="text-[12px] mb-3 px-3 py-2 rounded leading-relaxed"
      style={{
        background: ok ? C.accentSoft : "#FDECEA",
        border: `1px solid ${ok ? C.accent : "#EDB4AE"}`,
        color: ok ? "#3E6B27" : C.neg,
      }}>
      <b>Mezcla {P(total)}</b>
      {ok ? (
        <> · completa. El volumen del forecast se reparte entero entre {lista.length} {(L ? L.prod : "productos").toLowerCase()}.</>
      ) : dif > 0 ? (
        <> · falta <b>{P(dif)}</b> por repartir. Con la mezcla incompleta, el forecast deja fuera ese {P(dif)} del
          volumen: las ventas, el costo y el margen salen más bajos de lo que deberían. Súbele a algún renglón hasta llegar a 100%.</>
      ) : (
        <> · sobra <b>{P(-dif)}</b>. La mezcla pasa de 100%, así que el forecast reparte más volumen del que hay en el
          plan y todo sale inflado. Bájale a algún renglón hasta dejarla en 100%.</>
      )}
    </div>
  );
}

/* Versión compacta del aviso para la barra superior: se ve desde cualquier
   pestaña, porque la mezcla se descuadra en una pantalla y el daño aparece en
   otra. Si la mezcla está bien, no estorba: no se dibuja. */
export function ChipMezcla({ productos }: any) {
  const lista = productos || [];
  if (!lista.length) return null;
  const total = lista.reduce((a, p) => a + (p.mix || 0), 0);
  const dif = 1 - total;
  if (Math.abs(dif) <= 0.0005) return null;
  const P = (v) => nfmt(1).format(Math.abs(v) * 100) + "%";
  return (
    <div className="rounded-lg px-3 py-1.5 self-center"
      style={{ background: "#FDECEA", border: `1px solid #EDB4AE`, color: C.neg }}>
      <div className="text-[10px] uppercase tracking-wide font-semibold">Mezcla incompleta</div>
      <div className="text-[12.5px] font-semibold">
        {P(total)} · {dif > 0 ? `falta ${P(dif)}` : `sobra ${P(dif)}`}
      </div>
    </div>
  );
}

export const KPI = ({ label, value, sub, tone, destaca }: any) => (
  <div className="rounded-lg px-3 py-3"
    style={{ background: destaca ? C.tasaBg : C.white, border: `1px solid ${destaca ? C.tasaLinea : C.line}` }}>
    <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: destaca ? C.tasaTexto : C.muted }}>{label}</div>
    <div className="text-[20px] font-semibold mt-1"
      style={{ color: tone === "pos" ? C.pos : tone === "neg" ? C.neg : destaca ? C.tasaTexto : C.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    {sub && <div className="text-[11px] mt-0.5" style={{ color: destaca ? C.tasaTexto : C.muted, opacity: destaca ? 0.85 : 1 }}>{sub}</div>}
  </div>
);

export const Empty = ({ texto }: any) => (
  <div className="text-[12.5px] py-6 text-center rounded" style={{ color: C.muted, background: C.soft }}>{texto}</div>
);
