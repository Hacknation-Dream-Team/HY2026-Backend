const fs = require('fs');
const files = [
  'src/Wizard.tsx',
  'src/views/LoginView.tsx',
  'src/views/ProfileView.tsx',
  'src/views/DiscoverView.tsx',
  'src/views/ChatsView.tsx',
  'src/MapRoute.tsx',
  'src/LocationPicker.tsx',
  'src/MainView.tsx',
  'src/App.tsx'
];

const replacements = {
  'Ä™': 'ę',
  'Ĺ‚': 'ł',
  'Ăł': 'ó',
  'Ĺ›': 'ś',
  'Ĺş': 'ź',
  'ĹĽ': 'ż',
  'Ĺ„': 'ń',
  'Ä‡': 'ć',
  'Ä…': 'ą',
  'Ä†': 'Ć',
  'Ĺ ': 'Ł',
  'Ă“': 'Ó',
  'Ĺš': 'Ś',
  'Ĺą': 'Ź',
  'Ĺť': 'Ż',
  'Ĺƒ': 'Ń',
  'Ä„': 'Ą',
  'Ä˜': 'Ę'
};

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    for (let key in replacements) {
      if (content.includes(key)) {
        content = content.split(key).join(replacements[key]);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(f, content, 'utf8');
      console.log(`Fixed ${f}`);
    }
  }
});
