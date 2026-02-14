import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/client', 'src/plugins']
    })
  ],
  define: {
    __VERSION__: '"0.0.2"'
  },
  server: {
    port: 5173
  },
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        'client/agentation-zero': resolve(__dirname, 'src/client/index.ts'),
        'plugins/http': resolve(__dirname, 'src/plugins/vite-plugin-agentation-http.ts'),
        'plugins/locator': resolve(__dirname, 'src/plugins/vite-plugin-agentation-locator.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'vite', '@ngrok/ngrok', 'serve-handler', 'path', 'fs', 'http', 'https', 'child_process', 'os', 'url'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
