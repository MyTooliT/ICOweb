/// <reference types="vitest" />>
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [VueRouter(), vue()],
  test: {
    includeSource: ['src/**/*.{js,ts,vue}'],
    environment: 'happy-dom',
    watch: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
