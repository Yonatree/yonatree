// Resize a large original into a web-ready source asset for src/assets.
// Astro generates AVIF/WebP and responsive sizes from these at build time.
// Usage: node scripts/optimize-image.mjs <input> <output.jpg> [maxWidth=1400]
import sharp from 'sharp';

const [input, output, maxWidth = '1400'] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/optimize-image.mjs <input> <output.jpg> [maxWidth]');
  process.exit(1);
}

const info = await sharp(input)
  .rotate()
  .resize({ width: Number(maxWidth), withoutEnlargement: true })
  .jpeg({ quality: 84, mozjpeg: true, progressive: true })
  .toFile(output);

console.log(`${output} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
