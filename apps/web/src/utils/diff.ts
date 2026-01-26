export type DiffRowType = 'equal' | 'insert' | 'delete'

export type DiffRow = {
  type: DiffRowType
  left?: string
  right?: string
  leftLine?: number
  rightLine?: number
}

export type DiffResult = {
  rows: DiffRow[]
  truncated: boolean
  beforeLineCount: number
  afterLineCount: number
}

const DEFAULT_WINDOW = 24
const DEFAULT_MAX_ROWS = 2000

export const diffLines = (
  before: string[],
  after: string[],
  options?: { window?: number; maxRows?: number }
): DiffResult => {
  const windowSize = Math.max(4, options?.window ?? DEFAULT_WINDOW)
  const maxRows = Math.max(200, options?.maxRows ?? DEFAULT_MAX_ROWS)
  const rows: DiffRow[] = []
  let leftIndex = 0
  let rightIndex = 0
  let leftLine = 1
  let rightLine = 1

  while ((leftIndex < before.length || rightIndex < after.length) && rows.length < maxRows) {
    const leftValue = before[leftIndex]
    const rightValue = after[rightIndex]

    if (leftIndex < before.length && rightIndex < after.length && leftValue === rightValue) {
      rows.push({
        type: 'equal',
        left: leftValue,
        right: rightValue,
        leftLine,
        rightLine
      })
      leftIndex += 1
      rightIndex += 1
      leftLine += 1
      rightLine += 1
      continue
    }

    let matchLeft = -1
    let matchRight = -1
    for (let offsetLeft = 0; offsetLeft < windowSize && leftIndex + offsetLeft < before.length; offsetLeft += 1) {
      const candidate = before[leftIndex + offsetLeft]
      for (let offsetRight = 0; offsetRight < windowSize && rightIndex + offsetRight < after.length; offsetRight += 1) {
        if (candidate === after[rightIndex + offsetRight]) {
          matchLeft = leftIndex + offsetLeft
          matchRight = rightIndex + offsetRight
          break
        }
      }
      if (matchLeft >= 0) break
    }

    if (matchLeft >= 0 && matchRight >= 0) {
      while (leftIndex < matchLeft && rows.length < maxRows) {
        rows.push({
          type: 'delete',
          left: before[leftIndex],
          leftLine
        })
        leftIndex += 1
        leftLine += 1
      }
      while (rightIndex < matchRight && rows.length < maxRows) {
        rows.push({
          type: 'insert',
          right: after[rightIndex],
          rightLine
        })
        rightIndex += 1
        rightLine += 1
      }
      if (rows.length < maxRows) {
        rows.push({
          type: 'equal',
          left: before[matchLeft],
          right: after[matchRight],
          leftLine,
          rightLine
        })
      }
      leftIndex = matchLeft + 1
      rightIndex = matchRight + 1
      leftLine += 1
      rightLine += 1
      continue
    }

    if (leftIndex < before.length && rows.length < maxRows) {
      rows.push({
        type: 'delete',
        left: before[leftIndex],
        leftLine
      })
      leftIndex += 1
      leftLine += 1
    }
    if (rightIndex < after.length && rows.length < maxRows) {
      rows.push({
        type: 'insert',
        right: after[rightIndex],
        rightLine
      })
      rightIndex += 1
      rightLine += 1
    }
  }

  return {
    rows,
    truncated: leftIndex < before.length || rightIndex < after.length,
    beforeLineCount: before.length,
    afterLineCount: after.length
  }
}
