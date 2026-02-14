import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import agentationHttp from 'agentation-zero/plugins/http';
import agentationLocator from 'agentation-zero/plugins/locator';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    agentationLocator(),
    react(),
    agentationHttp()
  ],
});
