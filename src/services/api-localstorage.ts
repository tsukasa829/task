export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  dueDate?: string
}

const STORAGE_KEY = 'wiki-todo-tasks'

// LocalStorageからタスクを取得
function getTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    console.log('[LocalStorage] Loading tasks:', data)
    const tasks = data ? JSON.parse(data) : []
    console.log('[LocalStorage] Loaded tasks count:', tasks.length)
    return tasks
  } catch (error) {
    console.error('Failed to load tasks:', error)
    return []
  }
}

// LocalStorageにタスクを保存
function saveTasks(tasks: Task[]): void {
  try {
    const data = JSON.stringify(tasks)
    localStorage.setItem(STORAGE_KEY, data)
    console.log('[LocalStorage] Saved tasks:', tasks.length, 'items')
    console.log('[LocalStorage] Data:', data)
  } catch (error) {
    console.error('Failed to save tasks:', error)
  }
}

// 次のタスクIDを生成
function getNextId(tasks: Task[]): string {
  if (tasks.length === 0) return 'TASK:001'
  
  const maxId = Math.max(
    ...tasks.map(t => parseInt(t.id.replace('TASK:', '')) || 0)
  )
  return `TASK:${String(maxId + 1).padStart(3, '0')}`
}

// タスク一覧を取得
export async function fetchTodos(): Promise<{ tasks: Task[], sha: string }> {
  const tasks = getTasks()
  return {
    tasks,
    sha: '' // LocalStorageではSHA不要
  }
}

// タスクを追加
export async function addTodo(
  title: string,
  dueDate: string | undefined,
  _sha: string
): Promise<{ newSha: string, newTask: Task }> {
  const tasks = getTasks()
  const today = new Date().toISOString().split('T')[0]
  
  const newTask: Task = {
    id: getNextId(tasks),
    title,
    completed: false,
    createdAt: today,
    dueDate
  }
  
  tasks.push(newTask)
  saveTasks(tasks)
  
  return {
    newSha: '',
    newTask
  }
}

// タスクの完了状態をトグル
export async function toggleTodo(taskId: string, _sha: string): Promise<string> {
  const tasks = getTasks()
  const task = tasks.find(t => t.id === taskId)
  
  if (task) {
    task.completed = !task.completed
    saveTasks(tasks)
  }
  
  return '' // LocalStorageではSHA不要
}

// タスクを削除
export async function deleteTodo(taskId: string, _sha: string): Promise<string> {
  const tasks = getTasks()
  const filteredTasks = tasks.filter(t => t.id !== taskId)
  saveTasks(filteredTasks)
  
  return '' // LocalStorageではSHA不要
}

// GitHubファイル更新（ダミー、互換性のため）
export async function updateTodoFile(_sha: string, _content: string, _message: string): Promise<string> {
  // LocalStorageでは何もしない
  return ''
}
