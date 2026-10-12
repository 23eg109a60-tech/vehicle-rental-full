import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  define: {
    // Expose backend URL to the app bundle (used by api-client in production)
    __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || "")
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.API_SERVER_URL || "http://localhost:8080",
        changeOrigin: true
      }
    }
  },
  preview: { host: "0.0.0.0", port: 5173 }
});
