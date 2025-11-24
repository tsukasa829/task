import { create } from 'zustand'
import { Knowledge } from '../types'

const STORAGE_KEY = 'task_knowledge'

interface KnowledgeStore {
  knowledges: Knowledge[]
  recentTags: string[]
  
  // Actions
  addKnowledge: (content: string, tag: string) => void
  deleteKnowledge: (id: string) => void
  loadKnowledges: () => void
  updateRecentTags: (tag: string) => void
  getTopTagsByCount: (limit: number) => string[]
}

// LocalStorageから読み込み
const loadFromStorage = (): Knowledge[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load knowledges:', error)
    return []
  }
}

// LocalStorageに保存
const saveToStorage = (knowledges: Knowledge[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledges))
  } catch (error) {
    console.error('Failed to save knowledges:', error)
  }
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  knowledges: loadFromStorage(),
  recentTags: [],

  addKnowledge: (content: string, tag: string) => {
    const newKnowledge: Knowledge = {
      id: Date.now().toString(),
      content,
      tag,
      createdAt: new Date().toISOString()
    }

    set((state) => {
      const newKnowledges = [...state.knowledges, newKnowledge]
      saveToStorage(newKnowledges)
      return { knowledges: newKnowledges }
    })

    // タグを最近使用したタグに追加
    get().updateRecentTags(tag)
  },

  deleteKnowledge: (id: string) => {
    set((state) => {
      const newKnowledges = state.knowledges.filter(k => k.id !== id)
      saveToStorage(newKnowledges)
      return { knowledges: newKnowledges }
    })
  },

  loadKnowledges: () => {
    set({ knowledges: loadFromStorage() })
  },

  updateRecentTags: (tag: string) => {
    set((state) => {
      // タグを先頭に追加し、重複を削除、最大5件まで保持
      const newTags = [tag, ...state.recentTags.filter(t => t !== tag)].slice(0, 5)
      
      // recentTagsもlocalStorageに保存
      try {
        localStorage.setItem('task_recent_tags', JSON.stringify(newTags))
      } catch (error) {
        console.error('Failed to save recent tags:', error)
      }
      
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

// 初期化時に最近使用したタグを読み込み
const loadRecentTags = () => {
  try {
    const stored = localStorage.getItem('task_recent_tags')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

// ストア初期化時に最近のタグを読み込む
useKnowledgeStore.setState({ recentTags: loadRecentTags() })
