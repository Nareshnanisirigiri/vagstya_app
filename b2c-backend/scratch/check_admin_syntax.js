const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\sirin\\Downloads\\vogstya_jewellary-main\\vogstya_jewellary-main\\vogstya-app\\src\\screens\\AdminPanelScreen.js', 'utf8');

const checkBalance = (open, close, label) => {
  let count = 0;
  let pos = 0;
  while ((pos = content.indexOf(open, pos)) !== -1) {
    count++;
    pos += open.length;
  }
  let closeCount = 0;
  pos = 0;
  while ((pos = content.indexOf(close, pos)) !== -1) {
    closeCount++;
    pos += close.length;
  }
  console.log(`${label}: ${count} open, ${closeCount} close. Diff: ${count - closeCount}`);
};

checkBalance('{', '}', 'Braces');
checkBalance('(', ')', 'Parens');
checkBalance('<View', '</View>', 'View Tags');
checkBalance('<Text', '</Text>', 'Text Tags');
checkBalance('<Pressable', '</Pressable>', 'Pressable Tags');
checkBalance('<ScrollView', '</ScrollView>', 'ScrollView Tags');
checkBalance('<Animated.View', '</Animated.View>', 'Animated.View Tags');
checkBalance('<Ionicons', '/>', 'Ionicons (self-closing)');
