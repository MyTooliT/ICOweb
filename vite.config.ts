/// <reference types="vitest" />>
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    includeSource: ['tests/**/*.{js,ts,vue}'],
    environment: 'happy-dom',
    watch: false,
    setupFiles: [path.resolve(__dirname, 'tests/setupTests.ts')],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '!@': path.resolve(__dirname, './tests')
    },
  },
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
  }
})
