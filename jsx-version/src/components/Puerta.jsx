/* La puerta: decide si se ve la pantalla de entrada o la plataforma.

   Mientras Supabase averigua si hay sesión guardada no se muestra ninguna de
   las dos, para que quien ya entró no vea parpadear el formulario de acceso
   en cada recarga. */
import React from "react";
import { C } from "../lib/theme";
import { useSesion, salir as cerrarSesion } from "../lib/auth";
import Login from "./Login";
import App from "../App";

export default function Puerta() {
  const { cargando, perfil, salir } = useSesion();

  if (cargando) {
    return (
      <div style={{ background: C.paper, minHeight: "100vh", color: C.muted }}
        className="flex items-center justify-center text-[12.5px]">
        Cargando…
      </div>
    );
  }

  if (!perfil) return <Login />;

  /* Cuenta dada de baja: se cierra la sesión y se explica. El bloqueo de
     verdad lo hacen las políticas de la base —no podría guardar nada aunque
     entrara—, pero dejarlo pasar a una pantalla que no guarda sería peor que
     decírselo de frente. */
  if (perfil.activo === false) {
    return (
      <div style={{ background: C.paper, minHeight: "100vh" }} className="flex items-center justify-center px-4">
        <div style={{ width: 380, maxWidth: "100%", background: C.white, border: `1px solid ${C.line}`, borderRadius: 8 }}
          className="px-5 py-5 text-center">
          <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>Tu cuenta está dada de baja</div>
          <div className="text-[12.5px] leading-relaxed mb-4" style={{ color: C.muted }}>
            Tu trabajo se conserva. Pídele al administrador del curso que la reactive.
          </div>
          <button onClick={() => { cerrarSesion(); }}
            style={{ background: C.ink, color: C.white, border: `1px solid ${C.ink}` }}
            className="text-[12px] px-3 py-1.5 rounded font-medium hover:opacity-80 transition-opacity">
            Salir
          </button>
        </div>
      </div>
    );
  }

  return <App perfil={perfil} salir={salir} />;
}
