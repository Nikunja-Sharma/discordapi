#!/usr/bin/env node

// Color conversion mapping
const colorMap = {
  '0x3498db': '3447003',   // Blue
  '0x00ff00': '65280',     // Green
  '0xff6b35': '16738101',  // Orange
  '0xff0000': '16711680',  // Red
  '0x7289da': '7506394',   // Discord Blurple
  '0x00aa00': '43520',     // Dark Green
  '0xffd700': '16766720',  // Gold
  '0x5865f2': '5793522',   // Discord Brand Blue
  '0xff6b6b': '16738155',  // Light Red
  '0x1abc9c': '1752220',   // Turquoise
  '0xe74c3c': '15158332',  // Red
  '0x2ecc71': '3066993',   // Green
  '0x95a5a6': '9807270'    // Gray
};

console.log('Color Code Conversion Reference:');
console.log('================================');
Object.entries(colorMap).forEach(([hex, decimal]) => {
  console.log(`${hex} → ${decimal}`);
});

console.log('\nReplace these in your files:');
console.log('============================');
Object.entries(colorMap).forEach(([hex, decimal]) => {
  console.log(`"color": ${hex} → "color": ${decimal}`);
});