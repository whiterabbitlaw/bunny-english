export const worldIds = ['animals', 'colors', 'fruits', 'numbers'] as const

export type WorldId = (typeof worldIds)[number]

export type Word = {
  id: string
  en: string
  zh: string
}

export type World = {
  id: WorldId
  zh: string
  en: string
  intro: string
  band: string
  soft: string
  words: Word[]
}

export const worlds: World[] = [
  {
    id: 'animals',
    zh: '动物世界',
    en: 'Animals',
    intro: '小猫、小狗，还有会游的鱼。',
    band: '#0e7c73',
    soft: '#e7f6f3',
    words: [
      { id: 'animals-cat', en: 'cat', zh: '猫' },
      { id: 'animals-dog', en: 'dog', zh: '狗' },
      { id: 'animals-bird', en: 'bird', zh: '小鸟' },
      { id: 'animals-fish', en: 'fish', zh: '鱼' },
      { id: 'animals-rabbit', en: 'rabbit', zh: '兔子' },
      { id: 'animals-duck', en: 'duck', zh: '鸭子' },
    ],
  },
  {
    id: 'colors',
    zh: '颜色世界',
    en: 'Colors',
    intro: '红的、黄的、蓝的，形状也不一样。',
    band: '#d4534a',
    soft: '#ffe8e2',
    words: [
      { id: 'colors-red', en: 'red', zh: '红色' },
      { id: 'colors-yellow', en: 'yellow', zh: '黄色' },
      { id: 'colors-blue', en: 'blue', zh: '蓝色' },
      { id: 'colors-green', en: 'green', zh: '绿色' },
      { id: 'colors-orange', en: 'orange', zh: '橙色' },
      { id: 'colors-purple', en: 'purple', zh: '紫色' },
    ],
  },
  {
    id: 'fruits',
    zh: '水果世界',
    en: 'Fruits',
    intro: '看一看水果的样子，听一听名字。',
    band: '#c8880a',
    soft: '#fff3d4',
    words: [
      { id: 'fruits-apple', en: 'apple', zh: '苹果' },
      { id: 'fruits-banana', en: 'banana', zh: '香蕉' },
      { id: 'fruits-grape', en: 'grape', zh: '葡萄' },
      { id: 'fruits-orange', en: 'orange', zh: '橙子' },
      { id: 'fruits-strawberry', en: 'strawberry', zh: '草莓' },
      { id: 'fruits-watermelon', en: 'watermelon', zh: '西瓜' },
    ],
  },
  {
    id: 'numbers',
    zh: '数字世界',
    en: 'Numbers',
    intro: '从 one 到 six，数一数圆点。',
    band: '#1f6f9a',
    soft: '#e5f3fb',
    words: [
      { id: 'numbers-one', en: 'one', zh: '一' },
      { id: 'numbers-two', en: 'two', zh: '二' },
      { id: 'numbers-three', en: 'three', zh: '三' },
      { id: 'numbers-four', en: 'four', zh: '四' },
      { id: 'numbers-five', en: 'five', zh: '五' },
      { id: 'numbers-six', en: 'six', zh: '六' },
    ],
  },
]

const previewWord: Record<WorldId, string> = {
  animals: 'animals-rabbit',
  colors: 'colors-yellow',
  fruits: 'fruits-apple',
  numbers: 'numbers-three',
}

export function isWorldId(value: string): value is WorldId {
  return (worldIds as readonly string[]).includes(value)
}

export function getWorld(id: WorldId): World {
  const world = worlds.find((item) => item.id === id)
  if (!world) throw new Error(`missing world ${id}`)
  return world
}

export function previewWordId(id: WorldId): string {
  return previewWord[id]
}
