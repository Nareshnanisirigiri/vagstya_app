const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const filePath = process.argv[2];
const content = fs.readFileSync(filePath, 'utf8');

try {
  acorn.parse(content, {
    ecmaVersion: 2020,
    sourceType: 'module',
  });
  console.log('Syntax is valid');
} catch (err) {
  console.error('Syntax error found:');
  console.error(err.message);
  console.error('At position: ' + err.pos);
  
  // Find line and column
  const lines = content.substring(0, err.pos).split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length;
  console.error(`Line ${line}, Column ${col}`);
  
  // Show context
  const linesContent = content.split('\n');
  console.error('Context:');
  console.error(linesContent[line - 2]);
  console.error(linesContent[line - 1]);
  console.error(' '.repeat(col) + '^');
}
