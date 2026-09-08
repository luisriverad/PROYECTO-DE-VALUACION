/* La puerta: decide si se ve la pantalla de entrada o la plataforma.

   Mientras Supabase averigua si hay sesión guardada no se muestra ninguna de
   las dos, para que quien ya entró no vea parpadear el formulario de acceso
   en cada recarga. */
import React from "react";
import { C } from "../lib/theme";
import { useSesion } from "../lib/auth";
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

  return <App perfil={perfil} salir={salir} />;
}
