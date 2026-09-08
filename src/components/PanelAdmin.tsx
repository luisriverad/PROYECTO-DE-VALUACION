/* Pestaña de administración: quién entró y cómo va cada proyecto.

   Sólo la ve el administrador, pero esconder la pestaña es cortesía, no
   seguridad: el candado real está en las políticas de RLS de Supabase. Si un
   alumno llamara a estas consultas a mano, la base le devolvería únicamente su
   propia fila. */
import React, { useEffect, useState } from "react";
import { C } from "../lib/theme";
import { money, pct, num } from "../lib/format";
import { traerPadron } from "../lib/auth";
import { traerAvances } from "../lib/avances";
import { Card, Btn, Th, Td, Empty } from "./ui";

const NOMBRE_MODULO: any = { empresa: "Inversión empresa", servicios: "Inversión servicios", activo: "Inversión activo" };

/* «Hace 3 días» se lee mejor que una marca de tiempo ISO */
function cuando(iso: any) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} días`;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export default function PanelAdmin() {
  const [padron, setPadron] = useState<any[]>([]);
  const [avances, setAvances] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const traer = () => {
    setCargando(true);
    setError(null);
    Promise.all([traerPadron(), traerAvances()])
      .then(([p, a]) => { setPadron(p); setAvances(a); setCargando(false); })
      .catch((e) => { setError(e.message); setCargando(false); });
  };

  useEffect(traer, []);

  /* el avance más reciente de cada quien, para la columna de actividad */
  const ultimoGuardado: any = {};
  for (const av of avances) {
    const t = av.actualizado;
    if (!ultimoGuardado[av.usuario] || t > ultimoGuardado[av.usuario]) ultimoGuardado[av.usuario] = t;
  }

  const alumnos = padron.filter((p) => p.rol !== "admin");
  const porUsuario: any = {};
  for (const p of padron) porUsuario[p.id] = p;

  /* un renglón por proyecto capturado, ordenado por lo más reciente */
  const filas = avances
    .filter((a) => a.resumen && porUsuario[a.usuario])
    .sort((x, y) => String(y.actualizado).localeCompare(String(x.actualizado)));

  if (cargando) return <div className="text-[12.5px]" style={{ color: C.muted }}>Cargando…</div>;

  if (error) {
    return (
      <Card title="Administración">
        <div className="text-[12px] px-3 py-2 rounded" style={{ background: "#FDECEA", color: C.neg }}>{error}</div>
        <div className="mt-3"><Btn small onClick={traer}>Reintentar</Btn></div>
      </Card>
    );
  }

  return (
    <>
      <Card title="Padrón" sub="Quién tiene cuenta, cuándo entró y cuándo guardó por última vez."
        right={<Btn small onClick={traer}>Actualizar</Btn>}>
        {padron.length === 0 ? <Empty texto="Todavía no hay cuentas dadas de alta." /> : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.soft }}>
                <Th align="left">Nombre</Th>
                <Th align="left">Correo</Th>
                <Th align="left">Rol</Th>
                <Th align="left">Grupo</Th>
                <Th align="left">Última entrada</Th>
                <Th align="left">Último guardado</Th>
              </tr>
            </thead>
            <tbody>
              {padron.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <Td align="left" bold>{p.nombre || "—"}</Td>
                  <Td align="left" color={C.muted}>{p.correo || "—"}</Td>
                  <Td align="left" color={p.rol === "admin" ? C.accent : C.ink}>
                    {p.rol === "admin" ? "Administrador" : "Alumno"}
                  </Td>
                  <Td align="left" color={C.muted}>{p.grupo || "—"}</Td>
                  <Td align="left" color={C.muted}>{cuando(p.ultimo_acceso)}</Td>
                  <Td align="left" color={C.muted}>{cuando(ultimoGuardado[p.id])}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Avance de los proyectos"
        sub="Las cifras con las que va cada alumno, tal como las tiene guardadas en este momento.">
        {filas.length === 0 ? (
          <Empty texto="Nadie ha guardado trabajo todavía. En cuanto un alumno capture algo, aparece aquí." />
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.soft }}>
                <Th align="left">Alumno</Th>
                <Th align="left">Módulo</Th>
                <Th align="left">Proyecto</Th>
                <Th>Inversión</Th>
                <Th>VPN</Th>
                <Th>TIR</Th>
                <Th align="left">Actualizado</Th>
              </tr>
            </thead>
            <tbody>
              {filas.map((a) => {
                const r = a.resumen || {};
                const esActivo = a.modulo === "activo";
                return (
                  <tr key={a.usuario + a.modulo} style={{ borderTop: `1px solid ${C.line}` }}>
                    <Td align="left" bold>{porUsuario[a.usuario]?.nombre || "—"}</Td>
                    <Td align="left" color={C.muted}>{NOMBRE_MODULO[a.modulo] || a.modulo}</Td>
                    <Td align="left">
                      {esActivo
                        ? `${r.capturados || 0} de 4 activos · tasa ${pct(r.tasa)}`
                        : (r.proyecto || "Sin nombre")}
                    </Td>
                    <Td>{esActivo ? "—" : money(r.inversion)}</Td>
                    <Td color={r.vpn == null ? C.muted : r.vpn >= 0 ? C.pos : C.neg}>
                      {esActivo ? "—" : money(r.vpn)}
                    </Td>
                    <Td color={r.tir == null ? C.muted : r.wacc != null && r.tir >= r.wacc ? C.pos : C.neg}>
                      {esActivo ? "—" : pct(r.tir)}
                    </Td>
                    <Td align="left" color={C.muted}>{cuando(a.actualizado)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="text-[11px] mt-4 leading-relaxed" style={{ color: C.muted }}>
          {alumnos.length > 0 && (
            <>Hay {alumnos.length} {alumnos.length === 1 ? "alumno" : "alumnos"} con cuenta
              {" "}y {new Set(filas.map((f) => f.usuario)).size} con trabajo guardado. </>
          )}
          Las altas, las bajas y el cambio de rol se hacen desde el panel de Supabase.
        </div>
      </Card>
    </>
  );
}
