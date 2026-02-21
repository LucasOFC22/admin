import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações de build
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    // Code splitting manual para vendors
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
          ],
          // Animation library
          'vendor-motion': ['framer-motion'],
          // Charts library
          'vendor-charts': ['recharts'],
          // Query & Forms
          'vendor-data': ['@tanstack/react-query', 'react-hook-form', 'zod'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  // Otimização de dependências - pré-otimiza deps pesadas
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'framer-motion',
      'xlsx',
      'reactflow',
      '@react-pdf/renderer'
    ],
  },
}));
