import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const base = mode === 'v20' ? '/witimex/v20/' : '/witimex/';
  return {
    base,
    build: {
      rollupOptions: {
        input: 'index.html', // Asegúrate de que siempre use el archivo de entrada correcto
      },
    },
  };
});