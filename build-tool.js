// build.js
const { execSync } = require('child_process');
const { minify } = require('terser');
const fs = require('fs');
const path = require('path');
const glob = require('glob'); // npm install glob

async function build() {
  // 1. Run Babel
  console.log("Transpiling with Babel...");
  execSync('npx babel ./server --out-dir dist-server');

  // 2. Run Terser on all output files
  const files = glob.sync('dist-server/**/*.js');
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const minified = await minify(code, {
      compress: { drop_console: true }, // Removes console.logs for production
      mangle: true,
      toplevel: true
    });
    fs.writeFileSync(file, minified.code);
  }
  console.log("Build and Minification complete!");
}

build();