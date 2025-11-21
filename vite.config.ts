import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // 改成标准路径
    },
  },
  // 完全删除原来的 define 段落！让 Vite 自己正常注入 VITE_ 开头的变量
});
