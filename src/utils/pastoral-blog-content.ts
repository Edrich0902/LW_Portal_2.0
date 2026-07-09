export const EMPTY_PASTORAL_CONTENT = '{"ops":[{"insert":"\\n"}]}'

const EMPTY_CONTENT_PATTERNS = new Set([
  EMPTY_PASTORAL_CONTENT,
  '{"ops":[{"insert":"\\n"}]}',
  '{"ops":[{"insert":"\n"}]}',
])

export const isPastoralContentEmpty = (content: string): boolean => {
  if (!content.trim()) return true
  if (EMPTY_CONTENT_PATTERNS.has(content)) return true

  try {
    const parsed = JSON.parse(content) as { ops?: Array<{ insert?: string }> }
    const ops = parsed.ops ?? []
    if (ops.length === 0) return true
    return ops.every((op) => typeof op.insert === 'string' && op.insert.trim() === '')
  } catch {
    return content.trim().length === 0
  }
}

export const normalizePastoralTitle = (title: string): string => {
  const trimmed = title.trim()
  return trimmed.length > 0 ? trimmed : 'Untitled'
}
