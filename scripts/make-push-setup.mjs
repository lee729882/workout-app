// 푸시 알림 비밀값을 넣은 SQL 을 만들어요.  실행: node scripts/make-push-setup.mjs <vapid-keys.json>
// 결과: supabase/push-setup.secret.sql (.gitignore 에 들어 있어서 GitHub에 안 올라가요)
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const keysPath = process.argv[2]
if (!keysPath) throw new Error('VAPID 키 JSON 경로를 넣어주세요')
const { publicKey, privateKey } = JSON.parse(readFileSync(keysPath, 'utf8'))

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url))
const env = readFileSync(root('.env'), 'utf8')
const url = env.match(/^VITE_SUPABASE_URL=(.+)$/m)?.[1]?.trim()
if (!url) throw new Error('.env 에 VITE_SUPABASE_URL 이 없어요')

const q = (s) => `'${s.replace(/'/g, "''")}'`
const rows = {
  push_url: `${url}/functions/v1/push`,
  push_hook_secret: randomBytes(24).toString('hex'),
  vapid_public: publicKey,
  vapid_private: privateKey,
  vapid_subject: 'https://workout-app-theta-two.vercel.app',
}

const sql =
  readFileSync(root('supabase/push.sql'), 'utf8') +
  '\n-- ───── 비밀값 (이 파일은 GitHub에 올리지 마세요) ─────\n' +
  Object.entries(rows)
    .map(([k, v]) => `insert into app_config (key, value) values (${q(k)}, ${q(v)}) on conflict (key) do update set value = excluded.value;`)
    .join('\n') +
  "\n\nselect key, left(value, 12) || '…' as value from app_config order by key;\n"

writeFileSync(root('supabase/push-setup.secret.sql'), sql)

// 공개키는 앱에도 필요해요
const line = `VITE_VAPID_PUBLIC_KEY=${publicKey}`
const nextEnv = /^VITE_VAPID_PUBLIC_KEY=.*$/m.test(env) ? env.replace(/^VITE_VAPID_PUBLIC_KEY=.*$/m, line) : `${env.trimEnd()}\n\n# 푸시 알림 공개키\n${line}\n`
writeFileSync(root('.env'), nextEnv)
console.log('done')
