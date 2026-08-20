/* Puente con la API de Claude.
   En desarrollo pasa por el proxy de Vite (vite.config.ts) y la llave nunca
   llega al navegador. Para producción, publica tu propio backend y apunta
   VITE_API_URL a ese endpoint. */

const env = import.meta.env || {};
const API_URL = env.VITE_API_URL || "/anthropic/v1/messages";

export async function claudeFetch(body) {
  const headers = { "Content-Type": "application/json" };
  const llaveDirecta = env.VITE_ANTHROPIC_API_KEY;
  if (llaveDirecta) {
    headers["x-api-key"] = llaveDirecta;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  const r = await fetch(API_URL, { method: "POST", headers, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("La API respondió " + r.status + ". Revisa tu llave en el archivo .env");
  return r.json();
}

export function textoDe(data) {
  return (data?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}
