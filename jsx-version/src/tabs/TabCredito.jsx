import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   8. CRÉDITO
   ============================================================ */
export default function TabCredito({ s, up, m }) {
  const c = s.credito;
  const [verTodo, setVerTodo] = useState(false);
  const filas = verTodo ? m.cred : m.cred.slice(0, 12);
  const totalInt = m.cred.reduce((a, b) => a + b.interes, 0);
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
          <KPI label="Intereses totales" value={money(totalInt)} tone="neg" />
          <KPI label="Costo del dinero" value={c.monto > 0 ? pct(totalInt / c.monto) : "—"} sub="Intereses / monto" />
        </div>
      </Card>

      <Card title="Tabla de amortización" right={<Btn small onClick={() => setVerTodo(!verTodo)}>{verTodo ? "Ver 12 meses" : "Ver todo"}</Btn>}>
        {!m.cred.length ? <Empty texto="Sin crédito configurado." /> : (
          <div style={{ maxHeight: 420, overflow: "auto" }}>
            <table className="w-full">
              <thead><tr><Th>Periodo</Th><Th>Interés</Th><Th>Capital</Th><Th>Pago</Th><Th>Saldo</Th></tr></thead>
              <tbody>
                {filas.map((r) => (
                  <tr key={r.periodo}>
                    <Td>{r.periodo}</Td><Td color={C.neg}>{money(r.interes, 2)}</Td><Td>{money(r.capital, 2)}</Td>
                    <Td bold>{money(r.pago, 2)}</Td><Td color={C.muted}>{money(r.saldo, 2)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
