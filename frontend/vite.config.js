import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // `ANALYZE=true npm run build` ile bundle içeriğini gösteren bir HTML
    // raporu üretir (dist/stats.html) — normal build'leri etkilemiyor.
    process.env.ANALYZE && visualizer({ filename: 'dist/stats.html', gzipSize: true, template: 'treemap' }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        // React/react-dom/react-router nadiren değişir — app kodundan ayrı bir
        // chunk'ta tutmak, her deploy'da kullanıcının zaten cache'lediği bu
        // kütüphaneleri yeniden indirmesini önler. i18next de benzer şekilde
        // app koduyla birlikte sık değişmeyen, ayrı bir bağımlılık grubu.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    // @testing-library/jest-dom setup'ı vitest'in global expect'ini bekliyor
    globals: true
  }
})
