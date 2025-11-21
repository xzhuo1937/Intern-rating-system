import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // loadEnv 会自动读取 Vercel 注入的环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // 关键：这里改成读取 Vercel 的环境变量，而不是 .env 文件
      // Vercel 会自动把你设置的 GEMINI_API_KEY 注入进来
      'process.env.API_KEY': JSON.stringify(import.meta.env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(import.meta.env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      // 上面这行兼容了 Vercel 和本地开发两种情况
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),  // 我顺手把路径改成标准 ./src，更稳妥
      }
    }
  };
});
