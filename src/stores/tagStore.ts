import { create } from 'zustand'
import { Tag } from '../types'
import * as api from '../services/api-pglite'

interface TagStore {
  tags: Tag[]
  
  // Actions
  fetchTags: () => Promise<void>
  addTag: (name: string) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  getTagNames: () => string[]
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],

  fetchTags: async () => {
    try {
      const tags = await api.fetchTags()
      set({ tags })
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  },

  addTag: async (name: string) => {
    try {
      const newTag = await api.addTag(name)
      set((state) => ({ tags: [...state.tags, newTag] }))
    } catch (error) {
      console.error('Failed to add tag:', error)
    }
  },

  deleteTag: async (id: string) => {
    try {
      await api.deleteTag(id)
      set((state) => ({ tags: state.tags.filter(t => t.id !== id) }))
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  },

  getTagNames: () => {
    return get().tags.map(t => t.name)
  }
}))

// 初回ロード
useTagStore.getState().fetchTags()
