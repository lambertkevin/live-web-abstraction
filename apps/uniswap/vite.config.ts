import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import inject from '@rollup/plugin-inject';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    host: true,
    port: Number(process.env.UNISWAP_PORT) || 1234,
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
  resolve: {
    alias: {
      // process: 'process/browser',
      // buffer: 'buffer',
      // crypto: 'crypto-browserify',
      // stream: 'stream-browserify',
      // assert: 'assert',
      // http: 'stream-http',
      // https: 'https-browserify',
      // url: 'url',
      // util: 'util',
      jsbi: path.resolve(__dirname, "./node_modules/jsbi/dist/jsbi-cjs.js"),
      "~@fontsource/ibm-plex-mono": "@fontsource/ibm-plex-mono",
      "~@fontsource/inter": "@fontsource/inter",
    },
  },
  build: {
    rollupOptions: {
      plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
    },
    commonjsOptions: {
      transformMixedEsModules: false,
    },
  },
});
