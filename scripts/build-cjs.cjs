#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper function to recursively find all .js files
function findJSFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findJSFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Create temporary tsconfig for CJS build
const cjsTsconfig = {
  extends: './tsconfig.app.json',
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'node',
    outDir: 'dist-cjs-temp'
  }
};

fs.writeFileSync('tsconfig.cjs.json', JSON.stringify(cjsTsconfig, null, 2));

console.log('Building CommonJS versions...');

// Run TypeScript compiler for CJS
const { execSync } = require('child_process');
try {
  execSync('npx tsc -p tsconfig.cjs.json', { stdio: 'inherit' });

  // Find all .js files in the temp directory and copy them as .cjs files
  const jsFiles = findJSFiles('dist-cjs-temp');

  for (const jsFile of jsFiles) {
    const relativePath = path.relative('dist-cjs-temp', jsFile);
    const cjsPath = path.join('dist', relativePath.replace('.js', '.cjs'));

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(cjsPath), { recursive: true });

    // Copy the file with .cjs extension
    fs.copyFileSync(jsFile, cjsPath);
    console.log(`Created: ${cjsPath}`);
  }

  // Clean up
  fs.rmSync('dist-cjs-temp', { recursive: true, force: true });
  fs.unlinkSync('tsconfig.cjs.json');

  console.log('✅ CommonJS build completed successfully!');
} catch (error) {
  console.error('❌ CJS build failed:', error.message);

  // Clean up on error
  if (fs.existsSync('dist-cjs-temp')) {
    fs.rmSync('dist-cjs-temp', { recursive: true, force: true });
  }
  if (fs.existsSync('tsconfig.cjs.json')) {
    fs.unlinkSync('tsconfig.cjs.json');
  }

  process.exit(1);
}
