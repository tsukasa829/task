import { create } from 'zustand'
import { Tag } from '../types'

const STORAGE_KEY = 'task_tags'

// デフォルトタグ
const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: 'メンタル', createdAt: new Date().toISOString() },
  { id: 'tag-2', name: '戦略', createdAt: new Date().toISOString() },
  { id: 'tag-3', name: 'メモ', createdAt: new Date().toISOString() }
]

interface TagStore {
  tags: Tag[]
  
  // Actions
  loadTags: () => void
  addTag: (name: string) => void
  deleteTag: (id: string) => void
  getTagNames: () => string[]
}

// LocalStorageから読み込み
const loadFromStorage = (): Tag[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    // 初回は DEFAULT_TAGS を保存して返す
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TAGS))
    return DEFAULT_TAGS
  } catch (error) {
    console.error('Failed to load tags:', error)
    return DEFAULT_TAGS
  }
}

// LocalStorageに保存
const saveToStorage = (tags: Tag[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags))
  } catch (error) {
    console.error('Failed to save tags:', error)
  }
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: loadFromStorage(),

  loadTags: () => {
    set({ tags: loadFromStorage() })
  },

  addTag: (name: string) => {
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name,
      createdAt: new Date().toISOString()
    }

    set((state) => {
      const newTags = [...state.tags, newTag]
      saveToStorage(newTags)
      return { tags: newTags }
    })
  },

  deleteTag: (id: string) => {
    set((state) => {
      const newTags = state.tags.filter(t => t.id !== id)
      saveToStorage(newTags)
      return { tags: newTags }
    })
  },

  getTagNames: () => {
    return get().tags.map(t => t.name)
  }
}))
