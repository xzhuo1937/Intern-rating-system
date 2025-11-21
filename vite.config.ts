import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  define: {
    // 这两行是 AI Studio 项目原本就需要的全局变量
    // Vercel 会自动把 GEMINI_API_KEY 注入到 process.env 里
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
