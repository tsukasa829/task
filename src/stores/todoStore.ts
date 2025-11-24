import { create } from 'zustand'
import { TaskStore } from '../types'
import * as api from '../services/api-indexeddb'

// 定期同期の間隔（ミリ秒）
export const SYNC_INTERVAL_MS = 60 * 1000 // 1分

interface StoreState extends TaskStore {
  sha: string
  pendingChanges: boolean // 未同期の変更があるか
  lastSyncTime: number | null // 最後の同期時刻
  setSha: (sha: string) => void
  fetchTasks: () => Promise<void>
  syncToGitHub: () => Promise<void> // 定期同期用
  addTaskWithApi: (title: string, dueDate?: string) => Promise<void>
  toggleTaskWithApi: (id: string) => Promise<void>
  deleteTaskWithApi: (id: string) => Promise<void>
}

export const useTaskStore = create<StoreState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  sha: '',
  pendingChanges: false,
  lastSyncTime: null,

  setSha: (sha) => set({ sha }),
  
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: Date.now().toString() }]
  })),
  
  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    )
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  // GitHubからタスクを取得（初回読み込み用）
  fetchTasks: async () => {
    console.log('[Zustand] Fetching tasks...')
    set({ isLoading: true, error: null })
    try {
      const { tasks, sha } = await api.fetchTodos()
      console.log('[Zustand] Fetched tasks:', tasks.length)
      set({ tasks, sha, isLoading: false, lastSyncTime: Date.now(), pendingChanges: false })
    } catch (error) {
      console.error('[Zustand] Fetch error:', error)
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  // 定期同期: ローカルの変更をGitHubに反映
  syncToGitHub: async () => {
    const { tasks, sha, pendingChanges } = get()
    
    // 変更がなければスキップ
    if (!pendingChanges) {
      return
    }
    
    try {
      const content = generateTodoContentFromTasks(tasks)
      const newSha = await api.updateTodoFile(sha, content, 'Sync tasks')
      set({ sha: newSha, pendingChanges: false, lastSyncTime: Date.now(), error: null })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  // タスクを追加
  addTaskWithApi: async (title: string, dueDate?: string) => {
    console.log('[Zustand] Adding task:', title)
    const { sha } = get()
    
    try {
      // APIでLocalStorageに保存
      const { newTask } = await api.addTodo(title, dueDate, sha)
      console.log('[Zustand] Task added:', newTask.id)
      
      // UIを更新
      set((state) => ({ 
        tasks: [...state.tasks, newTask],
        pendingChanges: false,
        error: null 
      }))
    } catch (error) {
      console.error('[Zustand] Add error:', error)
      set({ error: (error as Error).message })
    }
  },

  // タスクの完了状態をトグル
  toggleTaskWithApi: async (id: string) => {
    console.log('[Zustand] Toggling task:', id)
    const { sha } = get()
    
    try {
      // APIでLocalStorageを更新
      await api.toggleTodo(id, sha)
      console.log('[Zustand] Task toggled')
      
      // UIを更新
      set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        ),
        pendingChanges: false,
        error: null
      }))
    } catch (error) {
      console.error('[Zustand] Toggle error:', error)
      set({ error: (error as Error).message })
    }
  },

  // タスクを削除
  deleteTaskWithApi: async (id: string) => {
    console.log('[Zustand] Deleting task:', id)
    const { sha } = get()
    
    try {
      // APIでLocalStorageから削除
      await api.deleteTodo(id, sha)
      console.log('[Zustand] Task deleted')
      
      // UIを更新
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        pendingChanges: false,
        error: null
      }))
    } catch (error) {
      console.error('[Zustand] Delete error:', error)
      set({ error: (error as Error).message })
    }
  }
}))

// タスクリストからtodo.mdのコンテンツを生成
function generateTodoContentFromTasks(tasks: api.Task[]): string {
  const header = `# Todo

## In Progress

`
  const inProgress = tasks
    .filter(task => !task.completed)
    .map(task => {
      const duePart = task.dueDate ? ` due:${task.dueDate}` : ''
      const taskId = task.id.replace('TASK:', '')
      return `<!-- ${taskId} created:${task.createdAt}${duePart} -->
- [ ] ${task.title}`
    })
    .join('\n')
  
  const completedHeader = `

## Completed

`
  const completed = tasks
    .filter(task => task.completed)
    .map(task => {
      const duePart = task.dueDate ? ` due:${task.dueDate}` : ''
      const taskId = task.id.replace('TASK:', '')
      return `<!-- ${taskId} created:${task.createdAt}${duePart} -->
- [x] ${task.title}`
    })
    .join('\n')
  
  return header + inProgress + completedHeader + completed + '\n'
}
