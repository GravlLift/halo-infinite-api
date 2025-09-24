import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all TypeScript files
function findTSFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTSFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix relative imports to add .js extension
  const relativeImportRegex = /from\s+['"](\.[^'"]*?)(?<!\.js)['"](?=\s*;?\s*$)/gm;
  content = content.replace(relativeImportRegex, (match, importPath) => {
    if (!importPath.endsWith('.js') && !importPath.includes('.js')) {
      changed = true;
      return match.replace(importPath, `${importPath}.js`);
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTSFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files to check...`);

for (const tsFile of tsFiles) {
  fixImportsInFile(tsFile);
}

console.log('✅ Import fixing completed!');
