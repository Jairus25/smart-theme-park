import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-server proxy: the React app calls fetch("/api/...") with no host, and
// Vite forwards those to the Express API on :4000. This avoids CORS entirely
// during development (CORS is still enabled server-side too, in case you
// run the client from a different origin/port later).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
