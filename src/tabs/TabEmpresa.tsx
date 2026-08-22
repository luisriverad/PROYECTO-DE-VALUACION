import React, { useState, useMemo } from "react";
import { C } from "../lib/theme";
import { uid, money, num, pct, nfmt, MESES } from "../lib/format";
import { Card, Btn, Field, NumIn, PctIn, TxtIn, Th, Td, KPI, Empty, inputCls, inputSt } from "../components/ui";

/* ============================================================
   1. EMPRESA Y SUPUESTOS
   ============================================================ */
export default function TabEmpresa({ s, up, m }: any) {
  const sp = s.supuestos;
  const Tg = ({ k, label, hint }: any) => (
    <div className="flex items-start gap-2 py-1.5">
      <input type="checkbox" checked={sp[k]} onChange={(e) => up((n) => { n.supuestos[k] = e.target.checked; })} className="mt-0.5" style={{ accentColor: C.azul }} />
      <div>
        <div className="text-[12.5px]">{label}</div>
        {hint && <div className="text-[11px]" style={{ color: C.muted }}>{hint}</div>}
      </div>
    </div>
  );
  return (
    <>
      <Card title="Identidad del proyecto" sub="El tipo de empresa cambia la nomenclatura de toda la plataforma.">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Nombre de la empresa"><TxtIn value={s.empresa.nombre} onChange={(v) => up((n) => { n.empresa.nombre = v; })} placeholder="Razón social" /></Field>
          <Field label="Tipo de empresa">
            <select className={inputCls} style={inputSt} value={s.empresa.tipo} onChange={(e) => up((n) => { n.empresa.tipo = e.target.value; })}>
              <option value="manufactura">Manufactura</option>
              <option value="retail">Retail / Comercio</option>
              <option value="servicios">Servicios</option>
            </select>
          </Field>
          <Field label="Año de arranque"><NumIn value={s.empresa.anio} dec={0} plain onChange={(v) => up((n) => { n.empresa.anio = v; })} /></Field>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Supuestos fiscales y macro">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tasa de ISR"><PctIn value={sp.isr} onChange={(v) => up((n) => { n.supuestos.isr = v; })} /></Field>
            <Field label="PTU"><PctIn value={sp.ptu} onChange={(v) => up((n) => { n.supuestos.ptu = v; })} /></Field>
            <Field label="Inflación anual"><PctIn value={sp.inflacion} onChange={(v) => up((n) => { n.supuestos.inflacion = v; })} /></Field>
            <Field label="Crecimiento a perpetuidad (g)"><PctIn value={sp.gPerp} onChange={(v) => up((n) => { n.supuestos.gPerp = v; })} /></Field>
            <Field label="Horizonte de evaluación (años)">
              <select className={inputCls} style={inputSt} value={sp.horizonte} onChange={(e) => up((n) => {
                const h = parseInt(e.target.value); n.supuestos.horizonte = h;
                while (n.plan.crec.length < h - 1) n.plan.crec.push(0.1);
                while (n.valuacion.capex.length < h) n.valuacion.capex.push(0);
              })}>
                {[3, 4, 5, 6, 7, 8, 9, 10].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Año en que cambia la estructura de gastos"><NumIn value={sp.anioCambioGastos} dec={0} onChange={(v) => up((n) => { n.supuestos.anioCambioGastos = v; })} /></Field>
          </div>
          <div className="text-[11px] mt-2 px-2 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
            Tasa fiscal total aplicada a la utilidad: <b style={{ color: C.ink }}>{pct(m.tasaFiscal)}</b>
          </div>
        </Card>

        <Card title="Capital de trabajo" sub="Define cuánta caja consume la operación al crecer. Se captura en Rentabilidad y valuación, junto a la tabla que mueve.">
          <table className="w-full">
            <tbody>
              <tr><Td align="left">Días de cartera (DSO)</Td><Td>{num(sp.dso, 0)}</Td></tr>
              <tr><Td align="left">Clientes con crédito</Td><Td>{pct(sp.pctCredito, 1)}</Td></tr>
              <tr><Td align="left">Días de inventario (DIO)</Td><Td>{num(sp.dio, 0)}</Td></tr>
              <tr><Td align="left">Días de proveedores (DPO)</Td><Td>{num(sp.dpo, 0)}</Td></tr>
              <tr><Td align="left">Días base del año</Td><Td>{num(sp.diasBase, 0)}</Td></tr>
            </tbody>
          </table>
          <div className="text-[11px] mt-2 px-2 py-2 rounded" style={{ background: C.soft, color: C.muted }}>
            Ciclo de conversión de efectivo: <b style={{ color: C.ink }}>{num(sp.dso + sp.dio - sp.dpo, 0)} días</b>
          </div>
        </Card>
      </div>

      <Card title="Criterios del modelo" sub="Cada opción cambia el resultado. Documenta cuál usaste y por qué.">
        <div className="grid grid-cols-3 gap-4">
          <Tg k="indexarPrecios" label="Indexar precios de venta a inflación" hint="Si lo apagas, el precio queda fijo y el margen se erosiona año con año." />
          <Tg k="impuestoAnio1" label="Gravar utilidad desde el Año 1" hint="Apágalo si el proyecto amortiza pérdidas fiscales iniciales." />
          <Tg k="nominaEscalaVolumen" label="La nómina directa escala con el volumen" hint="Si lo apagas, la nómina solo sube por inflación (más capacidad ociosa)." />
        </div>
      </Card>
    </>
  );
}
