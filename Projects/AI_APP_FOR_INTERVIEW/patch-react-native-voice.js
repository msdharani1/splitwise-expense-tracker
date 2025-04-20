const fs = require('fs');
const path = require('path');

const gradleFilePath = path.resolve(__dirname, 'node_modules/react-native-voice/android/build.gradle');

if (fs.existsSync(gradleFilePath)) {
  let content = fs.readFileSync(gradleFilePath, 'utf8');
  if (content.includes('compile')) {
    content = content.replace(/compile/g, 'implementation');
    fs.writeFileSync(gradleFilePath, 'utf8');
    console.log('Patched react-native-voice build.gradle to use implementation instead of compile');
  } else {
    console.log('No changes needed in react-native-voice build.gradle');
  }
} else {
  console.error('react-native-voice build.gradle not found');
}