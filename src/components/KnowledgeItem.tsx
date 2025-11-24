import React from 'react'
import { Knowledge } from '../types'
import { useKnowledgeStore } from '../stores/knowledgeStore'

interface KnowledgeItemProps {
  knowledge: Knowledge
}

const KnowledgeItem: React.FC<KnowledgeItemProps> = ({ knowledge }) => {
  const { deleteKnowledge } = useKnowledgeStore()

  return (
    <div className="group bg-white rounded-lg border border-purple-200 p-3 transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {knowledge.content}
          </p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {knowledge.tag}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {knowledge.createdAt.split('T')[0]}
            </span>
          </div>
        </div>

        <button
          onClick={() => void deleteKnowledge(knowledge.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
          title="削除"
        >
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default KnowledgeItem
