'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { supabase, DiaryEntry } from '@/lib/supabase'

interface DiaryEditorProps {
  selectedDate: Date
  onSave: () => void
}

export default function DiaryEditor({ selectedDate, onSave }: DiaryEditorProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [existingEntry, setExistingEntry] = useState<DiaryEntry | null>(null)

  const formattedDate = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => {
    loadEntry()
  }, [selectedDate])

  const loadEntry = async () => {
    if (!supabase) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('date', formattedDate)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading entry:', error)
      }

      if (data) {
        setContent(data.content)
        setExistingEntry(data)
      } else {
        setContent('')
        setExistingEntry(null)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!content.trim() || !supabase) return

    setIsSaving(true)
    try {
      if (existingEntry) {
        const { error } = await supabase
          .from('diary_entries')
          .update({ content })
          .eq('id', existingEntry.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('diary_entries')
          .insert({ date: formattedDate, content })

        if (error) throw error
      }

      onSave()
      await loadEntry()
    } catch (error) {
      console.error('Error saving:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingEntry || !supabase) return
    if (!confirm('정말 삭제하시겠습니까?')) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', existingEntry.id)

      if (error) throw error

      setContent('')
      setExistingEntry(null)
      onSave()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

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

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {format(selectedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
        </h2>
        {existingEntry && (
          <span className="text-xs text-gray-400">
            마지막 수정: {format(new Date(existingEntry.updated_at), 'HH:mm')}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루는 어땠나요?"
            className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
          />

          <div className="flex justify-end gap-2 mt-4">
            {existingEntry && (
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                삭제
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '저장 중...' : existingEntry ? '수정' : '저장'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
