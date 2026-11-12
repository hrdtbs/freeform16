import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), cloudflare(), tailwindcss()],
  server: {
    port: 4177,
    host: "127.0.0.1",
  },
  preview: {
    port: 4177,
    host: "127.0.0.1",
  },
});
