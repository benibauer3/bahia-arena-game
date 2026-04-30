import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    target: "es2020",
    // Keep bundle lean for MiniPay's embedded browser
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          wagmi: ["wagmi", "@wagmi/core", "viem"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["wagmi", "viem", "@tanstack/react-query"],
  },
});
