import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png", "icons/*.svg"],
      manifest: {
        name: "DAS POS",
        short_name: "InfraMedik",
        description: "Point of Sale System for DAS Drug Shop",
        theme_color: "#1565C0",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        // Replace icon-192.png and icon-512.png with real PNG files (convert icon.svg)
        // before going to production. The SVG entry provides a fallback for modern browsers.
        icons: [
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml" },
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        start_url: "/",
        scope: "/",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-mui": ["@mui/material", "@mui/icons-material"],
          "vendor-mui-x": [
            "@mui/x-data-grid",
            "@mui/x-date-pickers",
            "@mui/x-charts",
          ],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-pdf": ["@react-pdf/renderer"],
          "vendor-excel": ["exceljs"],
        },
      },
    },
  },
});
