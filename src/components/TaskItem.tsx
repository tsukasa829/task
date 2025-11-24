import React, { useState } from 'react'
import { Task } from '../types'
import { useTaskStore } from '../stores/todoStore'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import * as api from '../services/api-pglite'

interface TaskItemProps {
  task: Task
  filterType?: 'none' | 'today' | 'week' | 'year'
}

const TaskItem: React.FC<TaskItemProps> = ({ task, filterType }) => {
  const { toggleTaskWithApi, deleteTaskWithApi, setTasks, tasks } = useTaskStore()
  const { addKnowledge, recentTags } = useKnowledgeStore()
  const [showTagMenu, setShowTagMenu] = useState(false)

  const handlePostpone = async () => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 7)
    const newDueDate = newDate.toISOString().split('T')[0]
    
    await api.updateDueDate(task.id, newDueDate, '')
    
    // ローカルステートを更新
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...t, dueDate: newDueDate } : t
    )
    setTasks(updatedTasks)
  }

  const handleMoveToToday = async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const newDueDate = tomorrow.toISOString().split('T')[0]
    
    await api.updateDueDate(task.id, newDueDate, '')
    
    // ローカルステートを更新
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...t, dueDate: newDueDate } : t
    )
    setTasks(updatedTasks)
  }

  const handleConvertToKnowledge = async (tag: string) => {
    // TODOのtitleをcontentとしてナレッジに追加
    addKnowledge(task.title, tag)
    
    // TODOを削除
    await deleteTaskWithApi(task.id)
    
    setShowTagMenu(false)
  }

  const isWeekFilter = filterType === 'week'

  return (
    <div className={`group bg-white rounded-lg border p-3 transition-all hover:shadow-md ${
      task.completed ? 'border-gray-200 opacity-60' : 'border-gray-300'
    }`}>
      <div className="flex items-start gap-3">
        {isWeekFilter && !task.completed ? (
          <button
            onClick={handleMoveToToday}
            className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all text-blue-500 hover:text-blue-600"
            title="1日後に移動"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => toggleTaskWithApi(task.id)}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-blue-500'
            }`}
          >
            {task.completed && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {task.createdAt}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                期限: {task.dueDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 relative">
          <button
            onClick={() => deleteTaskWithApi(task.id)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
            title="削除"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          {!task.completed && (
            <>
              <button
                onClick={handlePostpone}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-green-50 rounded transition-all"
                title="7日後に延期"
              >
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-purple-50 rounded transition-all"
                title="ナレッジに変換"
              >
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </>
          )}
          
          {showTagMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowTagMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {recentTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleConvertToKnowledge(tag)}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-purple-50 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskItem
