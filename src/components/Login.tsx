/* Página de entrada.

   Es lo primero que ve cualquiera que abre la liga, así que dice qué es esto
   antes de pedir nada. La contraseña se valida en Supabase; aquí no se guarda
   ni se compara con nada local. */
import React, { useState } from "react";
import { C, LOGO } from "../lib/theme";
import { entrar, configurado } from "../lib/auth";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const enviar = async (e: any) => {
    e.preventDefault();
    if (entrando) return;
    setEntrando(true);
    setError(null);
    /* si entra bien, la sesión cambia sola y esta pantalla desaparece */
    const err = await entrar(correo, contrasena);
    if (err) { setError(err); setEntrando(false); }
  };

  const campo: any = {
    background: C.white, border: `1px solid ${C.line}`, color: C.ink,
    borderRadius: 6, padding: "9px 10px", width: "100%", fontSize: 13, outline: "none",
  };

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}
      className="flex items-center justify-center px-4">
      <div style={{ width: 380, maxWidth: "100%" }}>

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

          <div className="text-[12.5px] mb-4 leading-relaxed" style={{ color: C.muted }}>
            Entra con el correo y la contraseña que te dieron para el curso.
          </div>

          {!configurado && (
            <div className="text-[11.5px] mb-4 rounded px-3 py-2 leading-relaxed"
              style={{ color: C.ink, background: "#FAF2DF", border: `1px solid ${C.warn}` }}>
              El acceso todavía no está configurado en esta copia de la plataforma. Hay que capturar el
              proyecto de Supabase en <b>src/lib/auth.ts</b> antes de que alguien pueda entrar.
            </div>
          )}

          <div className="text-[11px] mb-1 font-medium" style={{ color: C.muted }}>Correo</div>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
            autoComplete="username" autoFocus placeholder="nombre@ejemplo.com" style={campo} />

          <div className="text-[11px] mb-1 mt-3 font-medium" style={{ color: C.muted }}>Contraseña</div>
          <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password" placeholder="••••••••" style={campo} />

          {error && (
            <div className="text-[12px] px-3 py-2 rounded mt-3" style={{ background: "#FDECEA", color: C.neg }}>{error}</div>
          )}

          <button type="submit" disabled={entrando || !configurado}
            style={{ background: C.accent, color: C.white, border: `1px solid ${C.accent}`, opacity: entrando || !configurado ? 0.5 : 1 }}
            className="w-full mt-4 rounded font-medium text-[13px] py-2 transition-opacity hover:opacity-80">
            {entrando ? "Entrando…" : "Entrar"}
          </button>

          <div className="text-[11px] mt-4 leading-relaxed" style={{ color: C.muted }}>
            ¿Olvidaste la contraseña o no tienes cuenta? Pídele el alta al administrador del curso:
            las cuentas se dan de alta desde el panel de la plataforma.
          </div>
        </form>

        <div className="text-[11px] mt-3 text-center" style={{ color: C.muted }}>Profit120 · www.profit120.com</div>
      </div>
    </div>
  );
}
