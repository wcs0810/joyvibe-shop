import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import path from 'node:path';
import { execSync } from 'node:child_process';

const APP_VERSION = process.env.APP_VERSION || `1.0.${Date.now()}`;

/**
 * Emits /version.json at build time. The deployed site serves this file with
 * no-cache headers (see netlify.toml); the running SPA polls it to detect a
 * newly deployed version and prompts the user to refresh.
 */
function emitVersionJson(): Plugin {
  return {
    name: 'joyvibe-version-json',
    generateBundle() {
      let commit = 'unknown';
      try {
        commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString().trim();
      } catch { /* not a git repo / git unavailable */ }
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({
          version: APP_VERSION,
          buildTime: new Date().toISOString(),
          commit,
        }, null, 2),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), emitVersionJson()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router')) return 'react-vendor';
            if (id.includes('lucide')) return 'lucide-vendor';
            return 'vendor';
          }
        },
      },
    },
  },
});
