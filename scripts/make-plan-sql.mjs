// src/data/plan.ts 의 계획을 DB(plan_days)에 넣는 SQL 로 만들어요.
// 실행: node scripts/make-plan-sql.mjs > supabase/plan-days.sql
import { PLAN } from '../src/data/plan.ts'
import { repsFor } from '../src/data/routines.ts'

const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const arr = (a) => (a?.length ? `array[${a.map(q).join(', ')}]` : 'null')
const strength = new Set(['upper', 'lower', 'upperWalk', 'lowerWalk'])

const rows = PLAN.map(
  (p) =>
    `  (${q(p.date)}, ${q(p.shift)}, ${q(p.kind)}, ${q(p.place)}, ${strength.has(p.kind) ? repsFor(p.date) : 'null'}, ${arr(p.cardio)}, ${q(p.note)})`,
)

console.log(`-- 운동 계획 (자동 생성: node scripts/make-plan-sql.mjs)
alter table plan_days add column if not exists reps int;

insert into plan_days (date, shift, kind, place, reps, cardio, note) values
${rows.join(',\n')}
on conflict (date) do update set
  shift = excluded.shift, kind = excluded.kind, place = excluded.place,
  reps = excluded.reps, cardio = excluded.cardio, note = excluded.note;`)
