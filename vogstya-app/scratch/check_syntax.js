const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\sirin\\Downloads\\vogstya_jewellary-main\\vogstya_jewellary-main\\vogstya-app\\src\\screens\\AdminPanelScreen.js';

try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Simple syntax check using Function constructor
    new Function(content);
    console.log('Syntax check passed.');
} catch (e) {
    console.error('Syntax error detected:');
    console.error(e.message);
    // Find the approximate line number
    const stack = e.stack;
    console.error(stack);
}
