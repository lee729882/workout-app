// public/icon.svg 로 휴대폰 홈 화면용 PNG 아이콘을 만들어요.  실행: node scripts/make-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('../public/icon.svg', import.meta.url))
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))
const BG = '#FBF6EC'

const plain = async (name, size) => sharp(src, { density: 300 }).resize(size, size).png().toFile(out(name))

// 아이폰·마스커블: 배경을 꽉 채우고 둥근 모서리 없이 (휴대폰이 알아서 깎아요)
const filled = async (name, size, pad = 0) => {
  const inner = Math.round(size * (1 - pad * 2))
  const art = await sharp(src, { density: 300 }).resize(inner, inner).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(out(name))
}

await plain('icon-192.png', 192)
await plain('icon-512.png', 512)
await filled('apple-touch-icon.png', 180)
await filled('icon-maskable-512.png', 512, 0.1)
console.log('done')
