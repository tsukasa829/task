export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  dueDate?: string
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
