const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);
let errors = 0;

files.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    try {
        parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy', 'objectRestSpread', 'asyncGenerators', 'exportDefaultFrom', 'exportNamespaceFrom', 'dynamicImport', 'nullishCoalescingOperator', 'optionalChaining']
        });
    } catch (e) {
        console.error(`Syntax error in ${file}: ${e.message}`);
        errors++;
    }
});

if (errors === 0) {
    console.log('No syntax errors found in src directory.');
} else {
    console.log(`Found ${errors} syntax errors.`);
}
