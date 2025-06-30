import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/chord-diagram-app/", // Required for GitHub Pages
  plugins: [react()],
});
