import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      // Enable Vue runtime template compilation for inline template components
      'vue': 'vue/dist/vue.esm-bundler.js',
    },
  },
})