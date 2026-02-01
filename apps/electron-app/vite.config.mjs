import { defineConfig } from 'vite';
import path from 'node:path';
import electronSimple from 'vite-plugin-electron/simple';
import electron from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';
import unocss from 'unocss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    unocss(),
    react(),
    electronSimple({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: {
          main: 'electron/main.ts',
          'service-worker': 'electron/service-worker.ts'
        },
        vite: {
          build: {
            rollupOptions: {
              external: ['undici']
            }
          }
        }
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.ts')
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer:
        process.env.NODE_ENV === 'test'
          ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
            undefined
          : {}
    })
  ]
});
