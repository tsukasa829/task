export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  dueDate?: string
}

export interface Knowledge {
  id: string
  content: string
  tag: string
  createdAt: string
}

export interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setTasks: (tasks: Task[]) => void
  addTask: (task: Omit<Task, 'id'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export interface KnowledgeStore {
  knowledges: Knowledge[]
  recentTags: string[]
  
  // Actions
  addKnowledge: (content: string, tag?: string) => void
  deleteKnowledge: (id: string) => void
  getKnowledgesByTag: (tag: string) => Knowledge[]
  updateRecentTags: (tag: string) => void
}
