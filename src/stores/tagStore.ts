import { create } from 'zustand'
import { Tag } from '../types'
import * as db from '../services/indexeddb'

const STORE_NAME = 'TAGS' as const

// デフォルトタグ
const DEFAULT_TAGS: Tag[] = [
  { id: 'TAG:1', name: 'メンタル', createdAt: new Date().toISOString() },
  { id: 'TAG:2', name: '戦略', createdAt: new Date().toISOString() },
  { id: 'TAG:3', name: 'メモ', createdAt: new Date().toISOString() }
]

interface TagStore {
  tags: Tag[]
  isLoading: boolean
  
  // Actions
  loadTags: () => Promise<void>
  addTag: (name: string) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  getTagNames: () => string[]
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  isLoading: false,

  loadTags: async () => {
    set({ isLoading: true })
    let tags = await db.getAll<Tag>(STORE_NAME)
    
    // 初回起動時はデフォルトタグを追加
    if (tags.length === 0) {
      for (const tag of DEFAULT_TAGS) {
        await db.add(STORE_NAME, tag)
      }
      tags = DEFAULT_TAGS
    }
    
    set({ tags, isLoading: false })
  },

  addTag: async (name: string) => {
    const newTag: Tag = {
      id: `TAG:${Date.now()}`,
      name,
      createdAt: new Date().toISOString()
    }

    await db.add(STORE_NAME, newTag)
    
    set((state) => ({
      tags: [...state.tags, newTag]
    }))
  },

  deleteTag: async (id: string) => {
    await db.deleteItem(STORE_NAME, id)
    
    set((state) => ({
      tags: state.tags.filter(t => t.id !== id)
    }))
  },

  getTagNames: () => {
    return get().tags.map(t => t.name)
  }
}))
