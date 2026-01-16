'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Todo, supabase } from '@/lib/supabase'

interface TodoItemProps {
  todo: Todo
  onUpdate: () => void
  onDelete: () => void
}

export default function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description || '')

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleStatusChange = async (newStatus: 'todo' | 'in_progress' | 'done') => {
    if (!supabase) return

    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', todo.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !supabase) return

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title, description })
        .eq('id', todo.id)

      if (error) throw error
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const handleDelete = async () => {
    if (!supabase) return
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todo.id)

      if (error) throw error
      onDelete()
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const statusColors = {
    todo: 'bg-gray-100 border-gray-300',
    in_progress: 'bg-yellow-50 border-yellow-300',
    done: 'bg-green-50 border-green-300',
  }

  if (isEditing) {
    return (
      <div className={`p-4 rounded-lg border-2 ${statusColors[todo.status]}`}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="할 일"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 mb-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="설명 (선택)"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            저장
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setTitle(todo.title)
              setDescription(todo.description || '')
            }}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-lg border-2 ${statusColors[todo.status]} group hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2">
        {/* 드래그 핸들 */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>

        <div className="flex-1 cursor-pointer" onClick={() => setIsEditing(true)}>
          <h4 className={`font-medium ${todo.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {todo.title}
          </h4>
          {todo.description && (
            <p className={`text-sm mt-1 ${todo.status === 'done' ? 'text-gray-300' : 'text-gray-500'}`}>
              {todo.description}
            </p>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 상태 변경 버튼 */}
      <div className="flex gap-1 mt-3">
        {todo.status !== 'todo' && (
          <button
            onClick={() => handleStatusChange('todo')}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
          >
            할 일
          </button>
        )}
        {todo.status !== 'in_progress' && (
          <button
            onClick={() => handleStatusChange('in_progress')}
            className="px-2 py-1 text-xs bg-yellow-200 text-yellow-700 rounded hover:bg-yellow-300"
          >
            진행중
          </button>
        )}
        {todo.status !== 'done' && (
          <button
            onClick={() => handleStatusChange('done')}
            className="px-2 py-1 text-xs bg-green-200 text-green-700 rounded hover:bg-green-300"
          >
            완료
          </button>
        )}
      </div>
    </div>
  )
}
