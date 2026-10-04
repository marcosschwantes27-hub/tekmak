import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  resolve: { alias: { "@": projectRoot } },
  build: {
    outDir: "assets/orbit-build",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: "components/assistencia-entry.tsx",
      name: "TekmakAssistencia",
      formats: ["iife"],
      fileName: () => "assistencia-orbita.js",
      cssFileName: "assistencia-orbita"
    }
  }
});

