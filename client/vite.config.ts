import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = 'http://localhost:3000';

// In dev, the browser talks only to Vite (port 5173), which forwards these paths to Express.
// This mirrors production, where both are on one origin, so cookies behave the same in dev and prod.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/auth': backend,
      '/health': backend,
    },
  },
});
