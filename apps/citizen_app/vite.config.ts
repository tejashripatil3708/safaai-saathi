import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/*.zip', '**/node_modules/**'],
    },
  },
});
