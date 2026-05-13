const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(__dirname, 'test.json'), JSON.stringify({ hello: 'world' }));
console.log('Test file written');
