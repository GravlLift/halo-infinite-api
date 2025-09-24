import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'core/token-persisters/index': 'src/core/token-persisters/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
