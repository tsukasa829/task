const API_BASE_URL = 'http://localhost:50321'

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  dueDate?: string
}

interface TodoContent {
  content: string
  sha: string
}

// GitHubからtodo.mdを取得
export async function fetchTodos(): Promise<{ tasks: Task[], sha: string }> {
  try {
    console.log('Fetching todos from:', `${API_BASE_URL}/api/repos/tsukasa829/docs/contents/docs/todo.md`)
    const response = await fetch(`${API_BASE_URL}/api/repos/tsukasa829/docs/contents/docs/todo.md`)
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch todos:', response.status, errorText)
      throw new Error(`Failed to fetch todos: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Fetched data:', data)
    // UTF-8対応のBase64デコード
    const content = decodeURIComponent(escape(atob(data.content)))
    console.log('Decoded content first 500 chars:', content.substring(0, 500))
    const tasks = parseTodoContent(content)
    
    return { tasks, sha: data.sha }
  } catch (error) {
    console.error('Error in fetchTodos:', error)
    throw error
  }
}

// todo.mdの内容をパース
function parseTodoContent(content: string): Task[] {
  const tasks: Task[] = []
  const lines = content.split('\n')
  
  console.log('Parsing content, total lines:', lines.length)
  
  let currentTask: Partial<Task> | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // HTML コメントを解析 (<!-- 001 created:2025-01-15 due:2025-01-20 --> または <!-- TASK:001 ... -->)
    const commentMatch = line.match(/<!--\s*(?:TASK:)?(\w+)\s+created:(\S+)(?:\s+due:(\S+))?\s*-->/)
    if (commentMatch) {
      const [, id, createdAt, dueDate] = commentMatch
      currentTask = { id: `TASK:${id}`, createdAt, dueDate: dueDate || undefined, completed: false }
      console.log('Found task comment:', { id, createdAt, dueDate })
      continue
    }
    
    // タスク行を解析 (- [ ] または - [x])
    const taskMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/)
    if (taskMatch && currentTask) {
      const [, checkbox, title] = taskMatch
      currentTask.completed = checkbox === 'x'
      currentTask.title = title
      tasks.push(currentTask as Task)
      console.log('Added task:', currentTask)
      currentTask = null
    }
  }
  
  console.log('Total tasks parsed:', tasks.length)
  return tasks
}

// タスクを追加
export async function addTodo(title: string, dueDate: string | undefined, sha: string): Promise<{ newSha: string, newTask: Task }> {
  // 既存のtodo.mdを取得
  const { tasks } = await fetchTodos()
  
  // 新しいタスクIDを生成
  const maxId = tasks.reduce((max, task) => {
    const num = parseInt(task.id.replace('TASK:', ''))
    return Math.max(max, num)
  }, 0)
  const newId = `TASK:${String(maxId + 1).padStart(3, '0')}`
  
  // 新しいタスクを作成
  const today = new Date().toISOString().split('T')[0]
  const newTask: Task = {
    id: newId,
    title,
    completed: false,
    createdAt: today,
    dueDate
  }
  
  // 新しいコンテンツを生成
  const updatedContent = generateTodoContent([...tasks, newTask])
  
  // GitHubに更新して新しいSHAとタスク情報を返す
  const newSha = await updateTodoFile(sha, updatedContent, `Add task: ${title}`)
  return { newSha, newTask }
}

// タスクの完了状態をトグル
export async function toggleTodo(taskId: string, sha: string): Promise<string> {
  const { tasks } = await fetchTodos()
  
  const updatedTasks = tasks.map(task => 
    task.id === taskId ? { ...task, completed: !task.completed } : task
  )
  
  const updatedContent = generateTodoContent(updatedTasks)
  const task = tasks.find(t => t.id === taskId)
  return await updateTodoFile(sha, updatedContent, `Toggle task: ${task?.title}`)
}

// タスクを削除
export async function deleteTodo(taskId: string, sha: string): Promise<string> {
  const { tasks } = await fetchTodos()
  
  const updatedTasks = tasks.filter(task => task.id !== taskId)
  const updatedContent = generateTodoContent(updatedTasks)
  
  const task = tasks.find(t => t.id === taskId)
  return await updateTodoFile(sha, updatedContent, `Delete task: ${task?.title}`)
}

// todo.mdのコンテンツを生成
function generateTodoContent(tasks: Task[]): string {
  const header = `# Todo

## タスク管理

このページではタスクを管理します。

---

## 進行中のタスク

`
  const inProgress = tasks
    .filter(task => !task.completed)
    .map(task => {
      const duePart = task.dueDate ? ` due:${task.dueDate}` : ''
      const taskId = task.id.replace('TASK:', '') // TASK:プレフィックスを削除
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
      const taskId = task.id.replace('TASK:', '') // TASK:プレフィックスを削除
      return `<!-- ${taskId} created:${task.createdAt}${duePart} -->
- [x] ${task.title}`
    })
    .join('\n')
  
  return header + inProgress + completedHeader + completed + '\n'
}

// GitHubのファイルを更新（エクスポート版 - 定期同期用）
export async function updateTodoFile(sha: string, content: string, message: string): Promise<string> {
  const encodedContent = btoa(unescape(encodeURIComponent(content))) // UTF-8対応Base64エンコード
  
  const response = await fetch(`${API_BASE_URL}/api/repos/tsukasa829/docs/contents/docs/todo.md`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: encodedContent,
      sha
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to update todo file')
  }
  
  const data = await response.json()
  return data.content.sha // 新しいSHAを返す
}
