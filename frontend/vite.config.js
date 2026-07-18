import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 4200,
    strictPort: true,
    proxy: {
      // Proxy all /api calls to Spring Boot during local dev
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false
      }
    }
  }
})