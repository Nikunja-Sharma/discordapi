#!/usr/bin/env node

// Discord Color Converter
// Converts hex colors to decimal values for JSON

const colors = {
  // Basic Colors
  'red': '#FF0000',
  'green': '#00FF00', 
  'blue': '#0000FF',
  'yellow': '#FFFF00',
  'orange': '#FF6600',
  'purple': '#9900FF',
  'pink': '#FF69B4',
  'cyan': '#00FFFF',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'black': '#000000',
  'white': '#FFFFFF',
  
  // Discord Brand Colors
  'discord-blurple': '#5865F2',
  'discord-green': '#57F287',
  'discord-yellow': '#FEE75C',
  'discord-fuchsia': '#EB459E',
  'discord-red': '#ED4245',
  
  // Common UI Colors
  'success': '#00FF00',
  'error': '#FF0000',
  'warning': '#FFFF00',
  'info': '#0099FF',
  'primary': '#007BFF',
  'secondary': '#6C757D',
  'light': '#F8F9FA',
  'dark': '#343A40'
};

function hexToDecimal(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to decimal
  return parseInt(hex, 16);
}

function printColorTable() {
  console.log('🎨 Discord Color Reference (Decimal Values for JSON)\n');
  console.log('| Color Name | Hex Code | Decimal Value |');
  console.log('|------------|----------|---------------|');
  
  Object.entries(colors).forEach(([name, hex]) => {
    const decimal = hexToDecimal(hex);
    console.log(`| ${name.padEnd(10)} | ${hex.padEnd(8)} | ${decimal.toString().padEnd(13)} |`);
  });
  
  console.log('\n📝 Usage in JSON:');
  console.log('```json');
  console.log('{');
  console.log('  "embeds": [');
  console.log('    {');
  console.log('      "title": "Colored Embed",');
  console.log('      "description": "This embed has a color",');
  console.log(`      "color": ${hexToDecimal(colors.gold)}`);
  console.log('    }');
  console.log('  ]');
  console.log('}');
  console.log('```');
}

// Command line usage
if (process.argv.length > 2) {
  const input = process.argv[2];
  
  if (colors[input.toLowerCase()]) {
    const hex = colors[input.toLowerCase()];
    const decimal = hexToDecimal(hex);
    console.log(`${input}: ${hex} = ${decimal}`);
  } else if (input.startsWith('#') || /^[0-9A-Fa-f]{6}$/.test(input)) {
    const decimal = hexToDecimal(input);
    console.log(`${input} = ${decimal}`);
  } else {
    console.log(`❌ Unknown color: ${input}`);
    console.log('Available colors:', Object.keys(colors).join(', '));
  }
} else {
  printColorTable();
}

module.exports = { hexToDecimal, colors };