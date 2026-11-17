import { mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

await mkdir('public/icons', { recursive: true })
const svg = readFileSync('public/favicon.svg')
await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png')
console.log('wrote public/icons/icon-192.png and icon-512.png')
