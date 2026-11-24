import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** .env 에 Supabase 주소와 키가 있으면 클라우드 모드 */
export const CLOUD = Boolean(url && key)

export const supabase = CLOUD ? createClient(url!, key!) : null

export const ACCOUNT_EMAIL = {
  user: (import.meta.env.VITE_USER_EMAIL as string | undefined) ?? '',
  admin: (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '',
}
