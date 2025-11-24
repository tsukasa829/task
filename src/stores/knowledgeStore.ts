import { create } from 'zustand'
import { Knowledge } from '../types'
import * as db from '../services/indexeddb'

const STORE_NAME = db.STORES.KNOWLEDGES

interface KnowledgeStore {
  knowledges: Knowledge[]
  recentTags: string[]
  isLoading: boolean
  
  // Actions
  addKnowledge: (content: string, tag: string) => Promise<void>
  deleteKnowledge: (id: string) => Promise<void>
  loadKnowledges: () => Promise<void>
  updateRecentTags: (tag: string) => void
  getTopTagsByCount: (limit: number) => string[]
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  knowledges: [],
  recentTags: [],
  isLoading: false,

  addKnowledge: async (content: string, tag: string) => {
    const newKnowledge: Knowledge = {
      id: `KNOWLEDGE:${Date.now()}`,
      content,
      tag,
      createdAt: new Date().toISOString()
    }

    await db.add(STORE_NAME, newKnowledge)
    
    set((state) => ({
      knowledges: [...state.knowledges, newKnowledge]
    }))

    // タグを最近使用したタグに追加
    get().updateRecentTags(tag)
  },

  deleteKnowledge: async (id: string) => {
    await db.deleteItem(STORE_NAME, id)
    
    set((state) => ({
      knowledges: state.knowledges.filter(k => k.id !== id)
    }))
  },

  loadKnowledges: async () => {
    set({ isLoading: true })
    const knowledges = await db.getAll<Knowledge>(STORE_NAME)
    set({ knowledges, isLoading: false })
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
