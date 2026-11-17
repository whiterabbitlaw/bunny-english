import type { Word } from '../data/worlds.ts'
import { shuffle } from './shuffle.ts'

export type Round = {
  key: string
  target: Word
  choices: Word[]
}

let roundSerial = 0

export function makeRound(pool: readonly Word[], target: Word, choiceCount = 3): Round {
  roundSerial += 1
  const others = shuffle(pool.filter((word) => word.id !== target.id)).slice(0, Math.max(0, choiceCount - 1))
  return {
    key: `${target.id}-${roundSerial}`,
    target,
    choices: shuffle([target, ...others]),
  }
}

export function buildRounds(pool: readonly Word[], count: number, choiceCount = 3): Round[] {
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((target) => makeRound(pool, target, choiceCount))
}
