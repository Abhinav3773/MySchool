import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  base: '/MySchool/',
  plugins: [react()],
  server: {
    port: 4173,
  },
});
