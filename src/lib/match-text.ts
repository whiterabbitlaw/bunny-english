export function heardMatches(transcript: string, target: string): boolean {
  const want = target.toLowerCase()
  const tokens = transcript
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return tokens.some((token) => token === want || token === `${want}s`)
}
