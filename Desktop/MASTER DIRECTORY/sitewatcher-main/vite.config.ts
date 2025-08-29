import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Optimize build for production
    minify: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          charts: ['recharts'],
          utils: ['clsx', 'class-variance-authority', 'tailwind-merge'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Enable hot module replacement
    hmr: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@tanstack/react-query',
      'recharts',
      'lucide-react'
    ],
  },
  // Performance optimizations
  define: {
    __DEV__: process.env.NODE_ENV !== 'production',
  },
  // Asset optimization
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.webp'],
});
