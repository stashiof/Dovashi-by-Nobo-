import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve('public/logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Also update assets/icon.svg and public/icon.svg
fs.writeFileSync(path.resolve('assets/icon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.resolve('public/icon.svg'), svgContent, 'utf8');

const sizes = [
  { size: 48, name: 'assets/icon-48.png' },
  { size: 72, name: 'assets/icon-72.png' },
  { size: 96, name: 'assets/icon-96.png' },
  { size: 144, name: 'assets/icon-144.png' },
  { size: 192, name: 'assets/icon-192.png' },
  { size: 432, name: 'assets/icon-432.png' },
  { size: 512, name: 'assets/icon-512.png' },
  { size: 1024, name: 'assets/icon-1024.png' },
  { size: 512, name: 'assets/splash.png' },
  { size: 512, name: 'public/logo.png' },
  { size: 192, name: 'public/icon-192.png' },
  { size: 512, name: 'public/icon-512.png' },
  { size: 512, name: 'public/icon.png' },
  { size: 512, name: 'public/favicon.png' },
];

for (const { size, name } of sizes) {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: size,
    },
    shapeRendering: 2,
    textRendering: 1,
    imageRendering: 0,
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  const destPath = path.resolve(name);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, pngBuffer);
  console.log(`Generated ${name} (${size}x${size})`);
}

console.log('All icons and splash screens generated successfully!');
