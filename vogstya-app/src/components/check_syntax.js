const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\sirin\\Downloads\\vogstya_jewellary-main\\vogstya_jewellary-main\\vogstya-app\\src\\components\\Header.js', 'utf8');
let openBraces = 0;
let closedBraces = 0;
let openParens = 0;
let closedParens = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  if (content[i] === '}') closedBraces++;
  if (content[i] === '(') openParens++;
  if (content[i] === ')') closedParens++;
}
console.log(`Braces: { ${openBraces}, } ${closedBraces}`);
console.log(`Parens: ( ${openParens}, ) ${closedParens}`);
