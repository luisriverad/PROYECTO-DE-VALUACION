import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Bar
} from "recharts";

/* ============================================================
   8. CRÉDITO
   ============================================================ */
export default function TabCredito({ s, up, m }) {
  const c = s.credito;
  const [verTodo, setVerTodo] = useState(false);
  const filas = verTodo ? m.cred : m.cred.slice(0, 12);
  const info = m.credInfo;
  const pre = c.prepagos || [];

  const addPre = () => up((n) => {
    if (!n.credito.prepagos) n.credito.prepagos = [];
    n.credito.prepagos.push({ id: uid(), periodo: Math.min(12, Math.round(c.plazoAnios * 12)), monto: 0, modo: "plazo" });
  });
  const curva = m.cred.map((r) => ({ p: r.periodo, Pago: Math.round(r.pago), Saldo: Math.round(r.saldo) }));

  return (
    <>
      <Card title="Crédito bancario" sub="El financiamiento no cambia el negocio: cambia quién se queda con el valor.">
        <div className="grid grid-cols-6 gap-3">
          <Field label="¿Usar crédito?">
            <select className={inputCls} style={inputSt} value={c.activo ? "si" : "no"} onChange={(e) => up((n) => { n.credito.activo = e.target.value === "si"; })}>
              <option value="si">Sí</option><option value="no">No</option>
            </select>
          </Field>
          <Field label="Monto"><NumIn value={c.monto} dec={0} onChange={(v) => up((n) => { n.credito.monto = v; })} /></Field>
          <Field label="Tasa anual total"><PctIn value={c.tasaAnual} onChange={(v) => up((n) => { n.credito.tasaAnual = v; })} /></Field>
          <Field label="Plazo (años)"><NumIn value={c.plazoAnios} dec={0} onChange={(v) => up((n) => { n.credito.plazoAnios = v; })} /></Field>
          <Field label="Sistema">
            <select className={inputCls} style={inputSt} value={c.tipo} onChange={(e) => up((n) => { n.credito.tipo = e.target.value; })}>
              <option value="insoluto">Saldos insolutos (pago decreciente)</option>
              <option value="frances">Cuota fija (francés)</option>
            </select>
          </Field>
          <Field label="Mes de disposición"><NumIn value={c.mesInicio} dec={0} onChange={(v) => up((n) => { n.credito.mesInicio = v; })} /></Field>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          <KPI label="Tasa mensual" value={pct(c.tasaAnual / 12, 3)} />
          <KPI label="Pago del primer mes" value={money(m.cred[0]?.pago || 0)} />
          <KPI label="Intereses totales" value={money(info.totalInt)} tone="neg" />
          <KPI label="Costo del dinero" value={c.monto > 0 ? pct(info.totalInt / c.monto) : "—"} sub="Intereses / monto" />
        </div>
      </Card>

      <Card title="Pagos anticipados a capital"
        sub="Abonos extra que no pagan intereses: entran directo al saldo. Decide si quieres terminar antes o pagar menos cada mes."
        right={<Btn small kind="primary" onClick={addPre} disabled={!c.activo || !c.monto}>+ Pago anticipado</Btn>}>
        {!pre.length ? (
          <Empty texto="Sin pagos anticipados. Agrega uno para ver cuánto interés te ahorras y cómo cambia el plazo." />
        ) : (
          <table className="w-full">
            <thead><tr>
              <Th align="left" w="14%">Mes del crédito</Th><Th w="18%">Monto</Th>
              <Th align="left" w="30%">Qué quieres que baje</Th><Th align="left">Efecto</Th><Th w="34"></Th>
            </tr></thead>
            <tbody>
              {pre.map((x, i) => (
                <tr key={x.id || i}>
                  <Td align="left"><div style={{ width: 90 }}><NumIn value={x.periodo} dec={0} plain onChange={(v) => up((n) => { n.credito.prepagos[i].periodo = Math.max(1, Math.round(v)); })} /></div></Td>
                  <Td><NumIn value={x.monto} dec={0} onChange={(v) => up((n) => { n.credito.prepagos[i].monto = Math.max(0, v); })} /></Td>
                  <Td align="left">
                    <select className={inputCls} style={inputSt} value={x.modo || "plazo"}
                      onChange={(e) => up((n) => { n.credito.prepagos[i].modo = e.target.value; })}>
                      <option value="plazo">El plazo — terminas antes</option>
                      <option value="pago">La mensualidad — pagas menos</option>
                    </select>
                  </Td>
                  <Td align="left" color={C.muted}>
                    {(x.modo || "plazo") === "plazo"
                      ? "Sigues pagando lo mismo y el crédito se acaba antes."
                      : "El saldo se reparte en los meses que faltan y baja el pago."}
                  </Td>
                  <Td><Btn small kind="danger" onClick={() => up((n) => { n.credito.prepagos.splice(i, 1); })}>×</Btn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <KPI label="Anticipos aplicados" value={money(info.totalPrepago)} sub={`${pre.length} abono${pre.length === 1 ? "" : "s"}`} />
          <KPI label="Intereses sin anticipos" value={money(info.totalIntSin)} />
          <KPI label="Intereses que te ahorras" value={money(info.ahorro)} tone={info.ahorro > 0 ? "pos" : undefined} />
          <KPI label="Plazo real" value={`${info.plazoReal} de ${info.plazoOriginal} meses`}
            sub={info.plazoOriginal > info.plazoReal ? `Terminas ${info.plazoOriginal - info.plazoReal} meses antes` : "Mismo plazo"} />
        </div>
        <div className="mt-3 text-[11px] px-3 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
          El interés que dejas de pagar baja el gasto financiero del <b style={{ color: C.ink }}>Forecast</b>, así que sube la
          utilidad y el impuesto del año en que anticipas. El abono en sí no es gasto: sale de la caja y se va contra el saldo.
        </div>
      </Card>

      <Card title="Tabla de amortización" right={<Btn small onClick={() => setVerTodo(!verTodo)}>{verTodo ? "Ver 12 meses" : "Ver todo"}</Btn>}>
        {!m.cred.length ? <Empty texto="Sin crédito configurado." /> : (
          <div style={{ maxHeight: 420, overflow: "auto" }}>
            <table className="w-full">
              <thead><tr><Th>Periodo</Th><Th>Interés</Th><Th>Capital</Th><Th>Pago anticipado</Th><Th>Pago total</Th><Th>Saldo</Th></tr></thead>
              <tbody>
                {filas.map((r) => (
                  <tr key={r.periodo} style={{ background: r.prepago > 0 ? C.accentSoft : undefined }}>
                    <Td>{r.periodo}</Td><Td color={C.neg}>{money(r.interes, 2)}</Td><Td>{money(r.capital, 2)}</Td>
                    <Td color={r.prepago > 0 ? C.pos : C.muted}>{r.prepago > 0 ? money(r.prepago, 2) : "—"}</Td>
                    <Td bold>{money(r.pago, 2)}</Td><Td color={C.muted}>{money(r.saldo, 2)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Cómo se mueve el dinero" sub="Lo que sale de la caja cada mes contra el saldo que te queda por pagar.">
        {!m.cred.length ? <Empty texto="Sin crédito configurado." /> : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <ComposedChart data={curva}>
                <CartesianGrid stroke={C.soft} vertical={false} />
                <XAxis dataKey="p" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => nfmt(0).format(v / 1000) + "k"} />
                <Tooltip formatter={(v) => money(v)} labelFormatter={(v) => "Mes " + v} contentStyle={{ fontSize: 12, border: `1px solid ${C.line}` }} />
                <Bar dataKey="Pago" fill={C.ink} radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="Saldo" stroke={C.accent} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-2 text-[11px]" style={{ color: C.muted }}>
          Las barras son el pago del mes —interés, capital y anticipo juntos— y la línea es el saldo. En el mes del anticipo la
          barra brinca y la línea cae: ahí es donde la caja hace el esfuerzo que después te ahorra intereses.
        </div>
      </Card>
    </>
  );
}
