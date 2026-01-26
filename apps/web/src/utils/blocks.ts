import { createId } from './id'
import type { Block } from '../types'

type BlockWithChildren = Block & { children?: Block[] }

const cloneBlock = (block: Block): Block => {
  const next: BlockWithChildren = { ...block, id: createId() }
  if (Array.isArray((block as BlockWithChildren).children)) {
    next.children = (block as BlockWithChildren).children?.map(cloneBlock)
  }
  return next
}

export const cloneBlocks = (blocks: Block[]) => blocks.map(cloneBlock)
