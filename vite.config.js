import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const renderHost = process.env.RENDER_EXTERNAL_HOSTNAME;
const previewAllowedHosts = ['localhost', '127.0.0.1', 'rms-eaf8.onrender.com', ...(renderHost ? [renderHost] : [])];

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    allowedHosts: previewAllowedHosts,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
