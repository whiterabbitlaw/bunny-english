import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = process.argv[2] ?? 'dist'
const expected = normalize(process.argv[3] ?? '/bunny-english/')
const failures = []

function normalize(value) {
  if (!value || value === '/') return '/'
  const withLead = value.startsWith('/') ? value : `/${value}`
  return withLead.endsWith('/') ? withLead : `${withLead}/`
}

function underBase(url) {
  return url === expected || url.startsWith(expected)
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')
const urls = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]).filter((url) => url.startsWith('/'))
if (urls.length === 0) failures.push('index.html has no root-relative assets')

for (const url of urls) {
  if (!underBase(url)) failures.push(`asset not under ${expected}: ${url}`)
  if (expected !== '/' && /^\/(assets|icons|favicon\.svg|manifest\.webmanifest|sw\.js)(\/|$)/.test(url)) {
    failures.push(`root asset URL: ${url}`)
  }
  const relative = url.slice(expected.length).split(/[?#]/)[0]
  const file = join(dist, relative)
  try {
    if (!statSync(file).isFile()) failures.push(`missing file for ${url}`)
  } catch {
    failures.push(`missing file for ${url}`)
  }
}

const manifest = JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8'))
if (manifest.start_url !== expected) failures.push(`start_url ${manifest.start_url}`)
if (manifest.scope !== expected) failures.push(`scope ${manifest.scope}`)
for (const icon of manifest.icons ?? []) {
  if (!underBase(icon.src)) failures.push(`icon ${icon.src}`)
  const relative = icon.src.slice(expected.length).split(/[?#]/)[0]
  try {
    if (!statSync(join(dist, relative)).isFile()) failures.push(`missing icon file ${icon.src}`)
  } catch {
    failures.push(`missing icon file ${icon.src}`)
  }
}

const sw = readFileSync(join(dist, 'sw.js'), 'utf8')
if (!sw.includes('self.location')) failures.push('sw.js does not derive its base from self.location')
if (/['"]\/(?:assets|icons|favicon\.svg|manifest\.webmanifest)/.test(sw)) {
  failures.push('sw.js hardcodes a root asset URL')
}

function javascriptFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    if (statSync(file).isDirectory()) javascriptFiles(file, out)
    else if (name.endsWith('.js')) out.push(file)
  }
  return out
}

const bundled = javascriptFiles(join(dist, 'assets'))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
const escapedBase = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const assignedBase = new RegExp(
  '`' + escapedBase + '`[\\s\\S]{0,300}serviceWorker\\.register\\(`\\$\\{[^}]+\\}sw\\.js`',
)
if (!bundled.includes(`${expected}sw.js`) && !assignedBase.test(bundled)) {
  failures.push(`bundle missing service worker URL ${expected}sw.js`)
}
if (expected !== '/' && (bundled.includes('"/sw.js"') || bundled.includes("'/sw.js'") || bundled.includes('`/sw.js`'))) {
  failures.push('bundle still registers root /sw.js')
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`base paths ok: ${expected}`)
