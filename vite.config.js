// vite.config.js
import {resolve} from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
        input: {
            main: resolve(__dirname, 'index.html'),
            initial: resolve(__dirname, 'initial_info.html'),
            myinfo: resolve(__dirname, 'myinfo.html'),
            diary: resolve(__dirname, 'diary.html'),
          }
          
    },
  },
  base: './',
});
