/* Página de entrada.

   Es lo primero que ve cualquiera que abre la liga, así que dice qué es esto
   antes de pedir nada. La contraseña se valida en Supabase; aquí no se guarda
   ni se compara con nada local.

   La misma pantalla sirve para entrar y para darse de alta: son dos campos de
   diferencia y separarlas en dos páginas sólo agrega un clic. */
import React, { useState } from "react";
import { C, LOGO } from "../lib/theme";
import { entrar, registrar, configurado } from "../lib/auth";

export default function Login() {
  const [modo, setModo] = useState("entrar");   // entrar | alta
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const alta = modo === "alta";

  const cambiar = (m) => { setModo(m); setError(null); setAviso(null); };

  const enviar = async (e) => {
    e.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    setAviso(null);

    /* si sale bien, la sesión cambia sola y esta pantalla desaparece */
    const err = alta
      ? await registrar(nombre, correo, contrasena)
      : await entrar(correo, contrasena);

    if (err === "CONFIRMA") {
      setAviso("Tu cuenta quedó creada. Revisa tu correo y confirma la liga que te acaba de llegar; después entra aquí con tu contraseña.");
      setModo("entrar");
      setContrasena("");
    } else if (err) {
      setError(err);
    }
    setOcupado(false);
  };

  const campo = {
    background: C.white, border: `1px solid ${C.line}`, color: C.ink,
    borderRadius: 6, padding: "9px 10px", width: "100%", fontSize: 13, outline: "none",
  };
  const etiqueta = "text-[11px] mb-1 mt-3 font-medium";

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}
      className="flex items-center justify-center px-4 py-8">
      <div style={{ width: 400, maxWidth: "100%" }}>

        {/* identidad: la misma barra oscura que corona la plataforma */}
        <div style={{ background: C.ink, borderRadius: "8px 8px 0 0" }} className="px-5 py-4 flex items-center gap-3">
          <img src={LOGO} alt="Profit120" style={{ height: 30, width: "auto" }} />
          <div style={{ background: "#3C4045", width: 1, height: 28 }} />
          <div>
            <div className="text-[13px] font-semibold tracking-tight" style={{ color: C.white }}>PLATAFORMA DE EVALUACIÓN DE INVERSIÓN</div>
            <div className="text-[11px]" style={{ color: "#9BA0A5" }}>Profit120</div>
          </div>
        </div>

        <form onSubmit={enviar}
          style={{ background: C.white, border: `1px solid ${C.line}`, borderTop: "none", borderRadius: "0 0 8px 8px" }}
          className="px-5 py-5">

          {/* entrar o darse de alta: dos pestañas, una sola pantalla */}
          <div className="flex gap-1 mb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
            {[["entrar", "Entrar"], ["alta", "Crear cuenta"]].map(([k, etq]) => (
              <button key={k} type="button" onClick={() => cambiar(k)}
                style={{
                  color: modo === k ? C.ink : C.muted,
                  borderBottom: `2px solid ${modo === k ? C.accent : "transparent"}`,
                  marginBottom: -1,
                }}
                className="text-[12px] font-semibold px-3 py-2 transition-opacity hover:opacity-70">
                {etq}
              </button>
            ))}
          </div>

          <div className="text-[12.5px] mb-1 leading-relaxed" style={{ color: C.muted }}>
            {alta
              ? "Crea tu cuenta para trabajar tu proyecto. Tu avance se guarda solo y lo recuperas desde cualquier computadora."
              : "Entra con el correo y la contraseña que registraste."}
          </div>

          {!configurado && (
            <div className="text-[11.5px] mt-3 rounded px-3 py-2 leading-relaxed"
              style={{ color: C.ink, background: "#FAF2DF", border: `1px solid ${C.warn}` }}>
              El acceso todavía no está configurado en esta copia de la plataforma. Hay que capturar el
              proyecto de Supabase en <b>src/lib/auth.ts</b> antes de que alguien pueda entrar.
            </div>
          )}

          {aviso && (
            <div className="text-[12px] px-3 py-2 rounded mt-3 leading-relaxed"
              style={{ background: C.accentSoft, color: C.ink, border: `1px solid ${C.accent}` }}>{aviso}</div>
          )}

          {alta && (
            <>
              <div className={etiqueta} style={{ color: C.muted }}>Nombre del empresario</div>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                autoComplete="name" placeholder="Nombre y apellido" style={campo} />
            </>
          )}

          <div className={etiqueta} style={{ color: C.muted }}>Correo</div>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
            autoComplete="username" placeholder="nombre@ejemplo.com" style={campo} />

          <div className={etiqueta} style={{ color: C.muted }}>Contraseña</div>
          <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
            autoComplete={alta ? "new-password" : "current-password"} placeholder="••••••••" style={campo} />
          {alta && <div className="text-[10px] mt-1" style={{ color: C.muted }}>Mínimo 6 caracteres.</div>}

          {error && (
            <div className="text-[12px] px-3 py-2 rounded mt-3" style={{ background: "#FDECEA", color: C.neg }}>{error}</div>
          )}

          <button type="submit" disabled={ocupado || !configurado}
            style={{ background: C.accent, color: C.white, border: `1px solid ${C.accent}`, opacity: ocupado || !configurado ? 0.5 : 1 }}
            className="w-full mt-4 rounded font-medium text-[13px] py-2 transition-opacity hover:opacity-80">
            {ocupado ? (alta ? "Creando…" : "Entrando…") : (alta ? "Crear cuenta" : "Entrar")}
          </button>

          <div className="text-[11px] mt-4 leading-relaxed" style={{ color: C.muted }}>
            {alta
              ? "¿Ya tienes cuenta? Cambia a «Entrar» aquí arriba."
              : "¿No tienes cuenta? Créala en «Crear cuenta». Si olvidaste la contraseña, pídele al administrador que te la restablezca."}
          </div>
        </form>

        <div className="text-[11px] mt-3 text-center" style={{ color: C.muted }}>Profit120 · www.profit120.com</div>
      </div>
    </div>
  );
}
