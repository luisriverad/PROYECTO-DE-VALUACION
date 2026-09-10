/* Pestaña de administración: quién entró y cómo va cada proyecto.

   Sólo la ve el administrador, pero esconder la pestaña es cortesía, no
   seguridad: el candado real está en las políticas de RLS de Supabase. Si un
   alumno llamara a estas consultas a mano, la base le devolvería únicamente su
   propia fila. */
import React, { useEffect, useState } from "react";
import { C } from "../lib/theme";
import { money, pct, num } from "../lib/format";
import { traerPadron, cambiarAlta, eliminarCuenta } from "../lib/auth";
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

export default function PanelAdmin({ abrirProyecto }: any) {
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

  /* Dar de baja o reactivar. Se pregunta antes de la baja porque el alumno se
     queda fuera de inmediato; reactivar no necesita confirmación. */
  const [ocupado, setOcupado] = useState<string | null>(null);
  const alta = async (p: any) => {
    const baja = p.activo !== false;
    if (baja && !window.confirm(`¿Dar de baja a ${p.nombre || p.correo}? No podrá entrar ni guardar, pero su trabajo se conserva y puedes reactivarlo después.`)) return;
    setOcupado(p.id);
    const err = await cambiarAlta(p.id, !baja);
    setOcupado(null);
    if (err) { setError(err); return; }
    traer();
  };

  /* Eliminar no tiene vuelta atrás, así que no basta un «Aceptar»: hay que
     escribir la palabra, para que no se borre a nadie por un clic de más. */
  const eliminar = async (p: any) => {
    const quien = p.nombre || p.correo;
    const ok = window.prompt(
      `Vas a ELIMINAR para siempre a ${quien} (${p.correo || "sin correo"}).\n\n` +
      `Se borran su cuenta de acceso, su perfil y todo su trabajo guardado. No se puede deshacer.\n\n` +
      `Escribe ELIMINAR para confirmar:`);
    if (ok == null) return;
    if (ok.trim().toUpperCase() !== "ELIMINAR") { window.alert("No se eliminó: no escribiste ELIMINAR."); return; }
    setOcupado(p.id);
    const err = await eliminarCuenta(p.id);
    setOcupado(null);
    if (err) { setError(err); return; }
    traer();
  };

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
      <Card title="Padrón"
        sub={`${alumnos.length} ${alumnos.length === 1 ? "cuenta" : "cuentas"} de alumno · ${alumnos.filter((x: any) => x.activo !== false).length} activas · ${new Set(filas.map((f) => f.usuario)).size} con trabajo guardado`}
        right={<Btn small onClick={traer}>Actualizar</Btn>}>
        {padron.length === 0 ? <Empty texto="Todavía no hay cuentas dadas de alta." /> : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.soft }}>
                <Th align="left">Empresario</Th>
                <Th align="left">Correo</Th>
                <Th align="left">Rol</Th>
                <Th align="left">Grupo</Th>
                <Th align="left">Última entrada</Th>
                <Th align="left">Último guardado</Th>
                <Th align="left">Estado</Th>
                <Th align="left"></Th>
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
                  <Td align="left" color={p.activo === false ? C.neg : C.pos}>
                    {p.activo === false ? "De baja" : "Activa"}
                  </Td>
                  <Td align="left">
                    {p.rol === "admin" ? (
                      <span className="text-[11px]" style={{ color: C.muted }}>—</span>
                    ) : (
                      <div className="flex gap-1 justify-start">
                        <Btn small kind="dark" onClick={() => abrirProyecto?.(p)}
                          title={`Abrir el proyecto de ${p.nombre || p.correo}`}>
                          Entrar a proyecto
                        </Btn>
                        <Btn small kind={p.activo === false ? "ghost" : "danger"}
                          disabled={ocupado === p.id} onClick={() => alta(p)}>
                          {ocupado === p.id ? "…" : p.activo === false ? "Reactivar" : "Dar de baja"}
                        </Btn>
                        <Btn small kind="danger" disabled={ocupado === p.id} onClick={() => eliminar(p)}
                          title={`Borrar para siempre la cuenta de ${p.nombre || p.correo} y todo su trabajo`}>
                          Eliminar
                        </Btn>
                      </div>
                    )}
                  </Td>
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
                <Th align="left">Empresario</Th>
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
          Los alumnos se dan de alta solos desde la página de entrada. Dar de baja apaga la cuenta:
          no puede entrar ni guardar, pero su trabajo se conserva y se puede reactivar. Eliminar la
          borra de raíz —cuenta de acceso, perfil y todo su trabajo— y no se puede deshacer; el correo
          queda libre para volver a darse de alta.
        </div>
      </Card>
    </>
  );
}
