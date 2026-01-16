'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Todo, supabase } from '@/lib/supabase'
import TodoItem from './TodoItem'

type StatusType = 'todo' | 'in_progress' | 'done'

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const loadTodos = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('Error loading todos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim() || !supabase) return

    setIsAdding(true)
    try {
      const { error } = await supabase
        .from('todos')
        .insert({ title: newTodoTitle, status: 'todo' })

      if (error) throw error
      setNewTodoTitle('')
      loadTodos()
    } catch (error) {
      console.error('Error adding todo:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddTodo()
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTodo = todos.find(t => t.id === activeId)
    if (!activeTodo) return

    // 컬럼 위로 드래그했을 때
    if (['todo', 'in_progress', 'done'].includes(overId)) {
      if (activeTodo.status !== overId) {
        setTodos(prev => prev.map(t =>
          t.id === activeId ? { ...t, status: overId as StatusType } : t
        ))
      }
      return
    }

    // 다른 아이템 위로 드래그했을 때
    const overTodo = todos.find(t => t.id === overId)
    if (overTodo && activeTodo.status !== overTodo.status) {
      setTodos(prev => prev.map(t =>
        t.id === activeId ? { ...t, status: overTodo.status } : t
      ))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !supabase) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTodo = todos.find(t => t.id === activeId)
    if (!activeTodo) return

    let newStatus: StatusType = activeTodo.status

    // 컬럼에 드롭했을 때
    if (['todo', 'in_progress', 'done'].includes(overId)) {
      newStatus = overId as StatusType
    } else {
      // 다른 아이템에 드롭했을 때
      const overTodo = todos.find(t => t.id === overId)
      if (overTodo) {
        newStatus = overTodo.status
      }
    }

    // DB 업데이트
    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', activeId)

      if (error) throw error
      loadTodos()
    } catch (error) {
      console.error('Error updating todo status:', error)
      loadTodos() // 에러 시 원래 상태로 복원
    }
  }

  const todosByStatus = {
    todo: todos.filter((t) => t.status === 'todo'),
    in_progress: todos.filter((t) => t.status === 'in_progress'),
    done: todos.filter((t) => t.status === 'done'),
  }

  const columns = [
    { key: 'todo' as const, title: '할 일', color: 'bg-gray-500', count: todosByStatus.todo.length },
    { key: 'in_progress' as const, title: '진행중', color: 'bg-yellow-500', count: todosByStatus.in_progress.length },
    { key: 'done' as const, title: '완료', color: 'bg-green-500', count: todosByStatus.done.length },
  ]

  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null

  if (!supabase) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="text-center text-gray-500 py-8">
          <p>Supabase 연결이 필요합니다.</p>
          <p className="text-sm mt-2">환경 변수를 설정해주세요.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    )
  }

  return (
    <div>
      {/* 새 할 일 추가 */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="새로운 할 일을 입력하세요..."
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAddTodo}
            disabled={isAdding || !newTodoTitle.trim()}
            className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>

      {/* Kanban 보드 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <div key={column.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`${column.color} px-4 py-3 flex items-center justify-between`}>
                <h3 className="font-semibold text-white">{column.title}</h3>
                <span className="bg-white/20 text-white text-sm px-2 py-0.5 rounded-full">
                  {column.count}
                </span>
              </div>
              <SortableContext
                id={column.key}
                items={todosByStatus[column.key].map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="p-4 space-y-3 min-h-[200px] max-h-[500px] overflow-y-auto"
                  data-column={column.key}
                >
                  {todosByStatus[column.key].length === 0 ? (
                    <div
                      className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded-lg"
                    >
                      드래그하여 이동
                    </div>
                  ) : (
                    todosByStatus[column.key].map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onUpdate={loadTodos}
                        onDelete={loadTodos}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTodo ? (
            <div className="p-4 rounded-lg border-2 bg-white shadow-xl opacity-90">
              <h4 className="font-medium text-gray-800">{activeTodo.title}</h4>
              {activeTodo.description && (
                <p className="text-sm mt-1 text-gray-500">{activeTodo.description}</p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
