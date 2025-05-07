import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.', 
  base: './', // Tämä on tärkeää, jotta build käyttää suhteellisia polkuja
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        diary: path.resolve(__dirname, 'diary.html'),
        myinfo: path.resolve(__dirname, 'myinfo.html'),
        settings: path.resolve(__dirname, 'settings.html'),
        initial_info: path.resolve(__dirname, 'initial_info.html'),
      }
    }
  },
  server: {
    port: 5173,
  },
});
