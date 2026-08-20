import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Proxy hacia la API de Claude: la llave se inyecta aquí y nunca viaja al navegador.
      proxy: {
        "/anthropic": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/anthropic/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (env.ANTHROPIC_API_KEY) {
                proxyReq.setHeader("x-api-key", env.ANTHROPIC_API_KEY);
                proxyReq.setHeader("anthropic-version", "2023-06-01");
              }
            });
          },
        },
      },
    },
  };
});
