import React, { useState } from 'react'
import { Task } from '../types'
import TaskItem from './TaskItem'
import KnowledgeItem from './KnowledgeItem'
import { useKnowledgeStore } from '../stores/knowledgeStore'

interface TaskListProps {
  tasks: Task[]
}

type FilterType = 'none' | 'today' | 'week' | 'year' | 'knowledge'

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const [filter, setFilter] = useState<FilterType>('today')
  const { knowledges } = useKnowledgeStore()

  const getFilteredTasks = (taskList: Task[]) => {
    if (filter === 'none') return taskList

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return taskList.filter(task => {
      if (!task.dueDate) return false
      
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (filter === 'today') {
        return daysUntilDue <= 1
      } else if (filter === 'week') {
        return daysUntilDue >= 2 && daysUntilDue <= 7
      } else if (filter === 'year') {
        return daysUntilDue >= 8
      }
      
      return true
    })
  }

  const incompleteTasks = getFilteredTasks(tasks.filter(t => !t.completed))
  const completedTasks = tasks.filter(t => t.completed)

  // ナレッジ表示の場合
  if (filter === 'knowledge') {
    if (knowledges.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">ナレッジがありません</p>
          <p className="text-xs mt-1">タグボタンからナレッジを追加してください</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setFilter('today')}
              className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-purple-500 text-white"
            >
              ナレッジ ({knowledges.length})
            </button>
          </div>
          <div className="space-y-2">
            {knowledges.map(knowledge => (
              <KnowledgeItem key={knowledge.id} knowledge={knowledge} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p className="text-sm">タスクがありません</p>
        <p className="text-xs mt-1">下のフォームから追加してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {tasks.filter(t => !t.completed).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setFilter(filter === 'today' ? 'none' : 'today')}
              className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors ${
                filter === 'today'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              進行中 ({incompleteTasks.length})
            </button>
            <button
              onClick={() => setFilter(filter === 'week' ? 'none' : 'week')}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                filter === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              1週間
            </button>
            <button
              onClick={() => setFilter(filter === 'year' ? 'none' : 'year')}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                filter === 'year'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              1年
            </button>
            <button
              onClick={() => setFilter('knowledge')}
              className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            >
              ナレッジ
            </button>
          </div>
          <div className="space-y-2">
            {incompleteTasks.map(task => (
              <TaskItem key={task.id} task={task} filterType={filter} />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            完了 ({completedTasks.length})
          </h2>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskList
