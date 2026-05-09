import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#4F46E5"/>
  <rect x="128" y="140.8" width="256" height="44.8" rx="22.4" fill="white"/>
  <rect x="233.6" y="140.8" width="44.8" height="192" rx="22.4" fill="white"/>
  <circle cx="166.4" cy="409.6" r="28.16" fill="white" fill-opacity="0.65"/>
  <circle cx="256" cy="409.6" r="28.16" fill="white" fill-opacity="0.65"/>
  <circle cx="345.6" cy="409.6" r="28.16" fill="white" fill-opacity="0.65"/>
</svg>`

// Maskable icons need extra padding (safe area is 80% of total)
const SVG_MASKABLE = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#4F46E5"/>
  <rect x="166" y="179" width="180" height="31.5" rx="15.75" fill="white"/>
  <rect x="240.25" y="179" width="31.5" height="135" rx="15.75" fill="white"/>
  <circle cx="185" cy="368" r="19.8" fill="white" fill-opacity="0.65"/>
  <circle cx="256" cy="368" r="19.8" fill="white" fill-opacity="0.65"/>
  <circle cx="327" cy="368" r="19.8" fill="white" fill-opacity="0.65"/>
</svg>`

const dir = join(process.cwd(), 'public', 'icons')
await mkdir(dir, { recursive: true })

for (const size of [192, 512]) {
  await sharp(Buffer.from(SVG)).resize(size, size).png().toFile(join(dir, `icon-${size}.png`))
  await sharp(Buffer.from(SVG_MASKABLE)).resize(size, size).png().toFile(join(dir, `icon-maskable-${size}.png`))
  console.log(`Generated ${size}x${size} icons`)
}

console.log('Done!')
