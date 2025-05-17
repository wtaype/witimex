import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  // Determina la base URL según el modo de construcción
  // Si el modo comienza con 'v' (como v20, v21), se considera una versión específica
  const isVersionMode = mode && mode.startsWith('v');
  const base = isVersionMode ? `/witimex/${mode}/` : '/witimex/';
  
  console.log(`Building for: ${base} (mode: ${mode || 'default'})`);
  
  return {
    base,
    build: {
      outDir: isVersionMode ? `dist-${mode}` : 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: 'index.html'
      }
    }
  };
});