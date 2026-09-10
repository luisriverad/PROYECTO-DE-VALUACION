import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* Sin proxy hacia la IA a propósito: un proxy que inyecta una llave del
   servidor la comparte entre todas las cuentas. Cada quien usa la suya,
   cargada en «CARGA DE API KEY» (ver src/lib/ia.ts). */
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
