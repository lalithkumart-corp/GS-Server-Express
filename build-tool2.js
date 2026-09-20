const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./server/bin/www.js'],
  bundle: true,
  minify: true,
  platform: 'node',
  target: ['node20'], // Specify your Node version
  outfile: './dist/server.bundle.js',
  // Dependencies to keep out of the bundle (e.g. native modules)
  external: ['pino', 'bcrypt'], 
}).catch(() => process.exit(1));