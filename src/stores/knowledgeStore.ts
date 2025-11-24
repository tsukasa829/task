import { create } from 'zustand'
import { Knowledge } from '../types'
import * as api from '../services/api-pglite'

const RECENT_TAGS_KEY = 'task_recent_tags'

interface KnowledgeStore {
  knowledges: Knowledge[]
  recentTags: string[]
  isLoading: boolean
  
  // Actions
  fetchKnowledges: () => Promise<void>
  addKnowledge: (content: string, tag: string) => Promise<void>
  deleteKnowledge: (id: string) => Promise<void>
  updateRecentTags: (tag: string) => void
  getTopTagsByCount: (limit: number) => string[]
}

// 最近使用したタグをLocalStorageから読み込み
const loadRecentTags = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_TAGS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

// 最近使用したタグをLocalStorageに保存
const saveRecentTags = (tags: string[]) => {
  try {
    localStorage.setItem(RECENT_TAGS_KEY, JSON.stringify(tags))
  } catch (error) {
    console.error('Failed to save recent tags:', error)
  }
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  knowledges: [],
  recentTags: loadRecentTags(),
  isLoading: false,

  fetchKnowledges: async () => {
    set({ isLoading: true })
    try {
      const knowledges = await api.fetchKnowledges()
      set({ knowledges, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch knowledges:', error)
      set({ isLoading: false })
    }
  },

  addKnowledge: async (content: string, tag: string) => {
    try {
      const newKnowledge = await api.addKnowledge(content, tag)
      set((state) => ({
        knowledges: [...state.knowledges, newKnowledge]
      }))
      
      // タグを最近使用したタグに追加
      get().updateRecentTags(tag)
    } catch (error) {
      console.error('Failed to add knowledge:', error)
    }
  },

  deleteKnowledge: async (id: string) => {
    try {
      await api.deleteKnowledge(id)
      set((state) => ({
        knowledges: state.knowledges.filter(k => k.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete knowledge:', error)
    }
  },

  updateRecentTags: (tag: string) => {
    set((state) => {
      // タグを先頭に追加し、重複を削除、最大5件まで保持
      const newTags = [tag, ...state.recentTags.filter(t => t !== tag)].slice(0, 5)
      saveRecentTags(newTags)
      return { recentTags: newTags }
    })
  },

  getTopTagsByCount: (limit: number) => {
    const { knowledges } = get()
    
    // タグごとのナレッジ数をカウント
    const tagCounts = knowledges.reduce((acc, knowledge) => {
      acc[knowledge.tag] = (acc[knowledge.tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // カウント順にソートして上位を取得
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag)
  }
}))

// 初回ロード
useKnowledgeStore.getState().fetchKnowledges()
