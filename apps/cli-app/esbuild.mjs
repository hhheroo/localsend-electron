import { context } from 'esbuild';

const ctx = await context({
  entryPoints: ['src/main.tsx'],
  outfile: 'dist/main.mjs',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external: ['ink', 'react'],
  logLevel: 'info',
});

await ctx.watch();
