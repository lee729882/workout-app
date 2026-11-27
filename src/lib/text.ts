/** 받침이 있으면 '을', 없으면 '를' (상체를, 런닝머신을) */
export function eul(word: string) {
  const c = word.charCodeAt(word.length - 1)
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? '을' : '를'
}
